import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

type AuthRequest = Request & {
  userId?: string;
};

export async function listExperiences(
  req: AuthRequest,
  res: Response
) {
  try {
    const {
      keyword,
      category,
      scope,
      source,
      status,
      rarity,
      difficulty,
      createdByMe,
    } = req.query as {
      keyword?: string;
      category?: string;
      scope?: string;
      source?: string;
      status?: "INTERESTED" | "COMPLETED";
      rarity?: string;
      difficulty?: string;
      createdByMe?: string;
    };

    const userId = req.userId;

    const experiences = await prisma.experience.findMany({
      where: {
        AND: [
          {
            OR: [
              { isPublic: true },
              ...(userId
                ? [{ createdById: userId }]
                : []),
            ],
          },

          ...(keyword
            ? [
              {
                OR: [
                  {
                    name: {
                      contains: keyword,
                    },
                  },
                  {
                    description: {
                      contains: keyword,
                    },
                  },
                ],
              },
            ]
            : []),
        ],

        //카테고리
        ...(category
          ? {
            category: {
              code: category,
            },
          }
          : {}),

        //범위
        ...(scope
          ? {
            scope: {
              contains: scope,
            },
          }
          : {}),

        // 공식 / 사용자 경험
        ...(source === "OFFICIAL"
          ? {
            source: {
              in: ["BASE", "SEASON"],
            },
          }
          : source === "USER"
            ? {
              source: "USER",
            }
            : {}),

        // 희귀도
        ...(rarity
          ? {
            rarity: Number(rarity),
          }
          : {}),

        // 난이도
        ...(difficulty
          ? {
            difficulty: Number(difficulty),
          }
          : {}),

        // 관심 / 완료 필터
        ...(status && userId
          ? {
            userExperiences: {
              some: {
                userId,
                status,
              },
            },
          }
          : {}),

        // 내가 만든 경험만 보기
        ...(createdByMe === "true" && userId
          ? {
            createdById: userId,
          }
          : {}),
      },

      include: {
        category: true,

        // 작성자 정보
        createdBy: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },

        // 현재 로그인한 사용자의 상태
        ...(userId
          ? {
            userExperiences: {
              where: {
                userId,
              },
              select: {
                id: true,
                status: true,
                rating: true,
                memo: true,
                completedAt: true,

                photos: {
                  select: {
                    id: true,
                    url: true,
                  },
                },
              },
            },
          }
          : {}),
      },

      orderBy: [
        {
          categoryId: "asc",
        },
        {
          rarity: "asc",
        },
      ],
    });

    const result = experiences.map((experience) => {
      const myExperience =
        "userExperiences" in experience
          ? experience.userExperiences[0] ?? null
          : null;

      return {
        ...experience,
        myExperience,
        userExperiences: undefined,
      };
    });

    return res.json(result);
  } catch (error) {
    console.error("listExperiences error:", error);

    return res.status(500).json({
      message: "경험 목록을 불러오지 못했습니다.",
    });
  }
}

const createExperienceSchema = z.object({
  categoryId: z.number().int().positive(),

  name: z
    .string()
    .trim()
    .min(1, "경험 이름을 입력해주세요.")
    .max(100, "경험 이름은 100자 이하로 입력해주세요."),

  description: z
    .string()
    .trim()
    .max(1000, "설명은 1000자 이하로 입력해주세요.")
    .optional()
    .nullable(),

  difficulty: z
    .number()
    .int()
    .min(1)
    .max(5),

  rarity: z
    .number()
    .int()
    .min(1)
    .max(5),

  estimatedTime: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable(),

  cost: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable(),

  companion: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable(),

  scope: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable(),

  isPublic: z.boolean().default(true),
});

export async function createExperience(
  req: AuthRequest,
  res: Response
) {
  try {
    const parsed = createExperienceSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "입력값이 올바르지 않습니다.",
        issues: parsed.error.issues,
      });
    }

    const userId = req.userId!;

    const {
      categoryId,
      name,
      description,
      difficulty,
      rarity,
      estimatedTime,
      cost,
      companion,
      scope,
      isPublic,
    } = parsed.data;

    // 존재하는 카테고리인지 확인
    const category = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      return res.status(400).json({
        message: "존재하지 않는 카테고리입니다.",
      });
    }

    const experience = await prisma.experience.create({
      data: {
        categoryId,

        name,
        description,

        difficulty,
        rarity,

        estimatedTime,
        cost,
        companion,
        scope,

        // 사용자 생성 경험
        source: "USER",

        // 현재 로그인한 사용자를 작성자로 지정
        createdById: userId,

        // 사용자가 선택한 공개 여부
        isPublic,
      },

      include: {
        category: true,

        createdBy: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },
      },
    });

    return res.status(201).json(experience);
  } catch (error) {
    console.error("createExperience error:", error);

    return res.status(500).json({
      message: "경험을 생성하지 못했습니다.",
    });
  }
}

export async function getExperience(
  req: AuthRequest,
  res: Response
) {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const experience = await prisma.experience.findFirst({
      where: {
        id,

        OR: [
          // 공개된 경험
          {
            isPublic: true,
          },

          // 비공개 경험이어도 내가 만든 경험이면 조회 가능
          ...(userId
            ? [
              {
                createdById: userId,
              },
            ]
            : []),
        ],
      },

      include: {
        category: true,

        createdBy: {
          select: {
            id: true,
            nickname: true,
            profileImage: true,
          },
        },

        ...(userId
          ? {
            userExperiences: {
              where: {
                userId,
              },
              select: {
                id: true,
                status: true,
                rating: true,
                memo: true,
                completedAt: true,

                photos: {
                  select: {
                    id: true,
                    url: true,
                  },
                },
              },
            },
          }
          : {}),
      },
    });

    if (!experience) {
      return res.status(404).json({
        message: "경험을 찾을 수 없습니다.",
      });
    }

    const myExperience =
      "userExperiences" in experience
        ? experience.userExperiences[0] ?? null
        : null;

    return res.json({
      ...experience,
      myExperience,
      userExperiences: undefined,
    });
  } catch (error) {
    console.error("getExperience error:", error);

    return res.status(500).json({
      message: "경험을 불러오지 못했습니다.",
    });
  }
}

// "오늘의 발견"
// 아직 관심 등록/완료하지 않은 경험 중 랜덤 1개
export async function getRandomExperience(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = req.userId;

    const doneIds = userId
      ? (
        await prisma.userExperience.findMany({
          where: {
            userId,
          },
          select: {
            experienceId: true,
          },
        })
      ).map((e) => e.experienceId)
      : [];

    const count = await prisma.experience.count({
      where: {
        isPublic: true,
        id: {
          notIn: doneIds,
        },
      },
    });

    if (count === 0) {
      return res.status(404).json({
        message: "추천할 새로운 경험이 없습니다.",
      });
    }

    const skip = Math.floor(Math.random() * count);

    const [experience] =
      await prisma.experience.findMany({
        where: {
          isPublic: true,
          id: {
            notIn: doneIds,
          },
        },

        include: {
          category: true,
        },

        skip,
        take: 1,
      });

    return res.json(experience);
  } catch (error) {
    console.error("getRandomExperience error:", error);

    return res.status(500).json({
      message: "오늘의 발견을 불러오지 못했습니다.",
    });
  }
}

export async function checkDuplicateExperiences(
  req: AuthRequest,
  res: Response
) {
  try {
    const name = String(req.query.name ?? "").trim();

    if (!name) {
      return res.status(400).json({
        message: "경험 이름을 입력해주세요.",
      });
    }

    const experiences = await prisma.experience.findMany({
      where: {
        isPublic: true,
      },
      select: {
        id: true,
        name: true,
        difficulty: true,
        rarity: true,
        source: true,
      },
      take: 100,
    });

    // 일단 1차 버전은 이름에 포함된 단어를 기준으로 비교
    const keywords = name
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length >= 2);

    const duplicates = experiences.filter((experience) => {
      const targetName = experience.name.toLowerCase();

      const matchedCount = keywords.filter((keyword) =>
        targetName.includes(keyword)
      ).length;

      return matchedCount >= 1;
    });

    return res.json({
      duplicates: duplicates.slice(0, 5),
    });
  } catch (error) {
    console.error(
      "checkDuplicateExperiences error:",
      error
    );

    return res.status(500).json({
      message: "중복 경험을 확인하지 못했습니다.",
    });
  }
}