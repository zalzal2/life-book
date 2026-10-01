import { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middlewares/auth.middleware";
import { evaluateAchievements } from "../services/achievement.service";

const upsertSchema = z.object({
  experienceId: z.string(),
  status: z.enum(["INTERESTED", "COMPLETED"]).default("INTERESTED"),
  rating: z.number().min(1).max(5).optional(),
  memo: z.string().optional(),
  photoUrls: z.array(z.string().url()).optional(),
});

export async function listMyExperiences(req: AuthedRequest, res: Response) {
  const { status } = req.query as { status?: "INTERESTED" | "COMPLETED" };

  const items = await prisma.userExperience.findMany({
    where: { userId: req.userId!, ...(status ? { status } : {}) },
    include: { experience: { include: { category: true } }, photos: true },
    orderBy: { createdAt: "desc" },
  });

  return res.json(items);
}

export async function upsertMyExperience(
  req: AuthedRequest,
  res: Response
) {
  const parsed = upsertSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "입력값이 올바르지 않습니다.",
      issues: parsed.error.issues,
    });
  }

  const {
    experienceId,
    status,
    rating,
    memo,
    photoUrls,
  } = parsed.data;

  const userId = req.userId!;

  // 경험 정보 조회
  const experience = await prisma.experience.findUnique({
    where: { id: experienceId },
  });

  if (!experience) {
    return res.status(404).json({
      message: "경험을 찾을 수 없습니다.",
    });
  }

  // 기존 기록 조회
  const existing = await prisma.userExperience.findUnique({
    where: {
      userId_experienceId: {
        userId,
        experienceId,
      },
    },
  });

  // 최초 완료 시 지급할 EXP
  let earnedExp = existing?.earnedExp ?? null;

  const isFirstCompletion =
    status === "COMPLETED" &&
    existing?.status !== "COMPLETED";

  if (isFirstCompletion) {
    earnedExp = calculateExperiencePoints(
      experience.difficulty,
      experience.rarity
    );
  }

  const record = await prisma.$transaction(async (tx) => {
    const record = await tx.userExperience.upsert({
      where: {
        userId_experienceId: {
          userId,
          experienceId,
        },
      },

      update: {
        status,
        rating,
        memo,
        completedAt:
          status === "COMPLETED"
            ? existing?.completedAt ?? new Date()
            : null,

        ...(isFirstCompletion
          ? { earnedExp }
          : {}),
      },

      create: {
        userId,
        experienceId,
        status,
        rating,
        memo,
        completedAt:
          status === "COMPLETED"
            ? new Date()
            : null,

        earnedExp:
          status === "COMPLETED"
            ? earnedExp
            : null,
      },
    });

    // 최초 완료일 때만 EXP 증가
    if (isFirstCompletion && earnedExp) {
      await tx.user.update({
        where: { id: userId },
        data: {
          experiencePoints: {
            increment: earnedExp,
          },
        },
      });
    }

    // 사진 저장
    if (photoUrls?.length) {
      await tx.photo.createMany({
        data: photoUrls.map((url) => ({
          userExperienceId: record.id,
          url,
        })),
      });
    }

    return record;
  });

  const unlocked =
    status === "COMPLETED"
      ? await evaluateAchievements(userId)
      : [];

  return res.json({
    userExperience: record,
    earnedExp: isFirstCompletion
      ? earnedExp
      : 0,
    unlockedAchievements: unlocked,
  });
}

function calculateExperiencePoints(
  difficulty: number,
  rarity: number
): number {
  const difficultyExp: Record<number, number> = {
    1: 10,
    2: 20,
    3: 35,
    4: 50,
    5: 70,
  };

  const rarityExp: Record<number, number> = {
    1: 0,
    2: 10,
    3: 25,
    4: 45,
    5: 70,
  };

  const baseExp = 50;

  return (
    baseExp +
    (difficultyExp[difficulty] ?? 0) +
    (rarityExp[rarity] ?? 0)
  );
}

export async function deleteMyExperience(req: AuthedRequest, res: Response) {
  const { id } = req.params;

  const record = await prisma.userExperience.findUnique({ where: { id } });
  if (!record || record.userId !== req.userId) {
    return res.status(404).json({ message: "기록을 찾을 수 없습니다." });
  }

  await prisma.userExperience.delete({ where: { id } });
  return res.status(204).send();
}

export async function getMyStats(
  req: AuthedRequest,
  res: Response
) {
  const userId = req.userId!;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      experiencePoints: true,
    },
  });

  const interestedCount = await prisma.userExperience.count({
    where: {
      userId,
      status: "INTERESTED",
    },
  });

  if (!user) {
    return res.status(404).json({
      message: "사용자를 찾을 수 없습니다.",
    });
  }

  const completed = await prisma.userExperience.findMany({
    where: {
      userId,
      status: "COMPLETED",
    },
    include: {
      experience: {
        include: {
          category: true,
        },
      },
    },
  });

  const totalCount = completed.length;
  const totalExp = user.experiencePoints;

  // 100 EXP마다 레벨 +1
  const level = Math.floor(totalExp / 100) + 1;

  const currentLevelExp = (level - 1) * 100;
  const nextLevelExp = level * 100;

  const currentExp = totalExp - currentLevelExp;

  const expPercent =
    Math.min(
      currentExp / 100,
      1
    ) * 100;

  const categoryStats: Record<string, number> = {};
  const rarityStats: Record<number, number> = {};

  for (const item of completed) {
    const catCode = item.experience.category.code;

    categoryStats[catCode] =
      (categoryStats[catCode] || 0) + 1;

    rarityStats[item.experience.rarity] =
      (rarityStats[item.experience.rarity] || 0) + 1;
  }

  return res.json({
    totalCount,
    interestedCount,
    totalExp,
    level,
    currentExp,
    nextLevelExp,
    expPercent,
    categoryStats,
    rarityStats,
  });
}

export async function cancelMyInterest(
  req: AuthedRequest,
  res: Response
) {
  const { experienceId } = req.params;
  const userId = req.userId!;

  const record = await prisma.userExperience.findUnique({
    where: {
      userId_experienceId: {
        userId,
        experienceId,
      },
    },
  });

  if (!record) {
    return res.status(404).json({
      message: "관심 등록한 경험을 찾을 수 없습니다.",
    });
  }

  if (record.status !== "INTERESTED") {
    return res.status(400).json({
      message: "관심 상태인 경험만 취소할 수 있습니다.",
    });
  }

  await prisma.userExperience.delete({
    where: {
      id: record.id,
    },
  });

  return res.status(204).send();
}