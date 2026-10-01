import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const FRIEND_CODE_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type KakaoTokenResponse = {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
};

type KakaoUserResponse = {
  id: number;
  properties?: {
    nickname?: string;
    profile_image?: string;
  };
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
  };
};

type NaverTokenResponse = {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: string;
};

type NaverUserResponse = {
  response: {
    id: string;
    nickname?: string;
    email?: string;
    profile_image?: string;
  };
};

function generateFriendCode(length = 6) {
  let code = "";

  for (let i = 0; i < length; i++) {
    code += FRIEND_CODE_CHARS[
      Math.floor(Math.random() * FRIEND_CODE_CHARS.length)
    ];
  }

  return code;
}

async function createUniqueFriendCode() {
  while (true) {
    const friendCode = generateFriendCode();

    const existingUser = await prisma.user.findUnique({
      where: { friendCode },
    });

    if (!existingUser) {
      return friendCode;
    }
  }
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  nickname: z.string().min(1).max(20),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function issueToken(userId: string) {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"],
  };

  return jwt.sign(
    { userId },
    process.env.JWT_SECRET as string,
    options
  );
}

export async function register(req: Request, res: Response) {

  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: "입력값이 올바르지 않습니다.", issues: parsed.error.issues });
  }
  const { email, password, nickname } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: "이미 가입된 이메일입니다." });
  }

  const hashed = await bcrypt.hash(password, 10);

  const friendCode = await createUniqueFriendCode();

  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      nickname,
      friendCode,
    },
  });

  const token = issueToken(user.id);
  return res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      friendCode: user.friendCode,
    },
  });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "입력값이 올바르지 않습니다." });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return res.status(401).json({
      message: "이메일 또는 비밀번호가 올바르지 않습니다.",
    });
  }

  if (!user.password) {
    return res.status(401).json({
      message: "이 계정은 소셜 로그인으로 가입된 계정입니다.",
    });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
  }

  const token = issueToken(user.id);
  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      friendCode: user.friendCode,
    },
  });
}

export async function kakaoLogin(req: Request, res: Response) {
  try {
    const { code } = req.query;

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        message: "카카오 인증 코드가 없습니다.",
      });
    }

    const redirectUri = process.env.KAKAO_REDIRECT_URI;
    const clientId = process.env.KAKAO_REST_API_KEY;
    const clientSecret = process.env.KAKAO_CLIENT_SECRET;

    if (!redirectUri || !clientId) {
      return res.status(500).json({
        message: "카카오 로그인 환경변수가 설정되지 않았습니다.",
      });
    }

    // 1. 카카오 access token 요청
    const tokenResponse = await fetch(
      "https://kauth.kakao.com/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded;charset=utf-8",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: clientId,
          redirect_uri: redirectUri,
          code,
          ...(clientSecret
            ? { client_secret: clientSecret }
            : {}),
        }).toString(),
      }
    );

    const tokenData =
      (await tokenResponse.json()) as KakaoTokenResponse;

    if (!tokenResponse.ok) {
      console.error("카카오 토큰 요청 실패:", tokenData);

      return res.status(400).json({
        message: "카카오 토큰을 가져오지 못했습니다.",
      });
    }

    // 2. 카카오 사용자 정보 요청
    const userResponse = await fetch(
      "https://kapi.kakao.com/v2/user/me",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const kakaoUser =
      (await userResponse.json()) as KakaoUserResponse;

    if (!userResponse.ok) {
      console.error("카카오 사용자 정보 요청 실패:", kakaoUser);

      return res.status(400).json({
        message: "카카오 사용자 정보를 가져오지 못했습니다.",
      });
    }

    console.log("카카오 사용자:", kakaoUser);

    // 3. 카카오 사용자 ID
    const providerId = String(kakaoUser.id);

    // 4. 기존 카카오 회원 확인
    let user = await prisma.user.findFirst({
      where: {
        authProvider: "KAKAO",
        providerId,
      },
    });

    // 5. 없으면 회원가입
    if (!user) {
      const friendCode = await createUniqueFriendCode();

      const nickname =
        kakaoUser.kakao_account?.profile?.nickname ||
        kakaoUser.properties?.nickname ||
        `카카오회원${providerId.slice(-4)}`;

      const profileImage =
        kakaoUser.kakao_account?.profile?.profile_image_url ||
        kakaoUser.properties?.profile_image ||
        null;

      const email =
        kakaoUser.kakao_account?.email || null;

      user = await prisma.user.create({
        data: {
          email,
          password: null,
          nickname,
          friendCode,
          profileImage,
          authProvider: "KAKAO",
          providerId,
        },
      });
    }

    // 6. 우리 서비스 JWT 발급
    const token = issueToken(user.id);

    const returnUrl =
      typeof req.query.state === "string"
        ? req.query.state
        : null;

    if (!returnUrl) {
      return res.status(400).json({
        message: "로그인 완료 후 돌아갈 주소가 없습니다.",
      });
    }

    const redirectUrl =
      `${returnUrl}?token=${encodeURIComponent(token)}`;

    console.log("📱 Expo로 돌아가기:", redirectUrl);

    return res.redirect(redirectUrl);
  } catch (error) {
    console.error("카카오 로그인 오류:", error);

    return res.status(500).json({
      message: "카카오 로그인에 실패했습니다.",
    });
  }
}

export function kakaoAuth(req: Request, res: Response) {
  console.log("🔥 /auth/kakao 도착");
  console.log("returnUrl:", req.query.returnUrl);

  const clientId = process.env.KAKAO_REST_API_KEY;
  const redirectUri = process.env.KAKAO_REDIRECT_URI;

  console.log("KAKAO_REST_API_KEY 존재:", !!clientId);
  console.log("KAKAO_REDIRECT_URI:", redirectUri);

  if (!clientId || !redirectUri) {
    return res.status(500).json({
      message: "카카오 로그인 환경변수가 설정되지 않았습니다.",
    });
  }

  const returnUrl = req.query.returnUrl as string;

  const kakaoAuthUrl =
    `https://kauth.kakao.com/oauth/authorize` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&state=${encodeURIComponent(returnUrl)}`;

  console.log("카카오 인증 URL:", kakaoAuthUrl);

  return res.redirect(kakaoAuthUrl);
}

export function naverAuth(req: Request, res: Response) {
  const clientId = process.env.NAVER_CLIENT_ID;
  const redirectUri = process.env.NAVER_REDIRECT_URI;


  if (!clientId || !redirectUri) {
    return res.status(500).json({
      message: "네이버 로그인 환경변수가 설정되지 않았습니다.",
    });
  }

  const returnUrl = req.query.returnUrl as string;

  const state = encodeURIComponent(returnUrl);

  const naverAuthUrl =
    `https://nid.naver.com/oauth2.0/authorize` +
    `?response_type=code` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`;

  return res.redirect(naverAuthUrl);
}

export async function naverLogin(req: Request, res: Response) {
  try {
    const code = req.query.code as string;
    const state = req.query.state as string;

    if (!code || !state) {
      return res.status(400).json({
        message: "네이버 로그인 인증 정보가 없습니다.",
      });
    }

    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;
    const redirectUri = process.env.NAVER_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(500).json({
        message: "네이버 로그인 환경변수가 설정되지 않았습니다.",
      });
    }

    // 1. 네이버 access token 요청
    const tokenResponse = await fetch(
      "https://nid.naver.com/oauth2.0/token" +
      `?grant_type=authorization_code` +
      `&client_id=${encodeURIComponent(clientId)}` +
      `&client_secret=${encodeURIComponent(clientSecret)}` +
      `&code=${encodeURIComponent(code)}` +
      `&state=${encodeURIComponent(state)}`
    );

    const tokenData =
      (await tokenResponse.json()) as NaverTokenResponse;

    if (!tokenData.access_token) {
      return res.status(400).json({
        message: "네이버 액세스 토큰을 가져오지 못했습니다.",
      });
    }

    // 2. 네이버 사용자 정보 요청
    const userResponse = await fetch(
      "https://openapi.naver.com/v1/nid/me",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const userData =
      (await userResponse.json()) as NaverUserResponse;

    const naverUser = userData.response;

    if (!naverUser?.id) {
      return res.status(400).json({
        message: "네이버 사용자 정보를 가져오지 못했습니다.",
      });
    }

    // 3. 기존 네이버 계정 찾기
    let user = await prisma.user.findUnique({
      where: {
        authProvider_providerId: {
          authProvider: "NAVER",
          providerId: naverUser.id,
        },
      },
    });

    // 4. 없으면 회원가입
    if (!user) {
      const friendCode = await createUniqueFriendCode();

      user = await prisma.user.create({
        data: {
          authProvider: "NAVER",
          providerId: naverUser.id,
          email: naverUser.email ?? null,
          nickname: naverUser.nickname ?? "네이버 사용자",
          friendCode,
          profileImage: naverUser.profile_image ?? null,
        },
      });
    }

    // 5. 우리 서비스 JWT 발급
    const token = issueToken(user.id);

    // 6. Expo로 돌아가기
    const returnUrl = state;

    if (!returnUrl) {
      return res.status(400).json({
        message: "로그인 완료 후 돌아갈 주소가 없습니다.",
      });
    }

    const redirectUrl = new URL(returnUrl);
    redirectUrl.searchParams.set("token", token);

    return res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("❌ 네이버 로그인 오류:", error);

    return res.status(500).json({
      message: "네이버 로그인 중 오류가 발생했습니다.",
    });
  }
}