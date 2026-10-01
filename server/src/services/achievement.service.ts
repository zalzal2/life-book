import { prisma } from "../lib/prisma";

type AchievementCondition = {
  type: string;
  value?: number;
  category?: string;
  minRarity?: number;
  minDifficulty?: number;
  categoryCount?: number;
  conditions?: AchievementCondition[];
};

export async function evaluateAchievements(userId: string) {
  // 사용자의 완료 경험
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
      photos: true,
    },
  });

  // 관심 경험
  const interestedCount = await prisma.userExperience.count({
    where: {
      userId,
      status: "INTERESTED",
    },
  });

  // 사용자 정보
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      experiencePoints: true,
    },
  });

  if (!user) {
    return [];
  }

  // 내가 만든 경험의 개수
  const userCreatedCount =
    await prisma.experience.count({
      where: {
        createdById: userId,
      },
    });

  // 전체 업적
  const achievements = await prisma.achievement.findMany();

  // 이미 획득한 업적
  const userAchievements = await prisma.userAchievement.findMany({
    where: {
      userId,
    },
    select: {
      achievementId: true,
    },
  });

  const unlockedIds = new Set(
    userAchievements.map((item) => item.achievementId)
  );

  const newlyUnlocked = [];

  for (const achievement of achievements) {
    // 이미 획득한 업적은 다시 지급하지 않음
    if (unlockedIds.has(achievement.id)) {
      continue;
    }

    const condition =
      achievement.condition as AchievementCondition;

    const achieved = checkAchievementCondition(
      condition,
      {
        completed,
        interestedCount,
        experiencePoints: user.experiencePoints,
        userCreatedCount,
      }
    );
    if (!achieved) {
      continue;
    }

    const userAchievement =
      await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
        },
        include: {
          achievement: true,
        },
      });

    newlyUnlocked.push(userAchievement.achievement);
  }

  return newlyUnlocked;
}

function checkAchievementCondition(
  condition: AchievementCondition,
  data: {
    completed: any[];
    interestedCount: number;
    experiencePoints: number;
    userCreatedCount: number;
  }
): boolean {
  const {
    completed,
    interestedCount,
    experiencePoints,
    userCreatedCount,
  } = data;

  switch (condition.type) {
    // --------------------------------
    // 완료 개수
    // --------------------------------
    case "COMPLETED_COUNT":
      return completed.length >= (condition.value ?? Infinity);

    // --------------------------------
    // 카테고리 종류 수
    // --------------------------------
    case "CATEGORY_DIVERSITY": {
      const categories = new Set(
        completed.map(
          (item) => item.experience.category.code
        )
      );

      return categories.size >= (condition.value ?? Infinity);
    }

    // --------------------------------
    // 모든 카테고리에서 N개 이상
    // --------------------------------
    case "CATEGORY_BALANCED": {
      const requiredCount = condition.value ?? 0;
      const categoryCount = condition.categoryCount ?? 0;

      const categoryStats: Record<string, number> = {};

      for (const item of completed) {
        const code = item.experience.category.code;

        categoryStats[code] =
          (categoryStats[code] ?? 0) + 1;
      }

      const qualifiedCategories =
        Object.values(categoryStats).filter(
          (count) => count >= requiredCount
        );

      return qualifiedCategories.length >= categoryCount;
    }

    // --------------------------------
    // 특정 카테고리 N개
    // --------------------------------
    case "CATEGORY_COMPLETED": {
      const category = condition.category;
      const value = condition.value ?? 0;

      if (!category) {
        return false;
      }

      const count = completed.filter(
        (item) =>
          item.experience.category.code === category
      ).length;

      return count >= value;
    }

    // --------------------------------
    // 특정 카테고리 하나에서 N개
    // --------------------------------
    case "ANY_CATEGORY_COMPLETED": {
      const value = condition.value ?? 0;

      const categoryStats: Record<string, number> = {};

      for (const item of completed) {
        const code = item.experience.category.code;

        categoryStats[code] =
          (categoryStats[code] ?? 0) + 1;
      }

      return Object.values(categoryStats).some(
        (count) => count >= value
      );
    }

    // --------------------------------
    // 희귀도 조건
    // --------------------------------
    case "RARITY_COMPLETED": {
      const minRarity = condition.minRarity ?? 0;
      const value = condition.value ?? 0;

      const count = completed.filter(
        (item) =>
          item.experience.rarity >= minRarity
      ).length;

      return count >= value;
    }

    // --------------------------------
    // 난이도 조건
    // --------------------------------
    case "DIFFICULTY_COMPLETED": {
      const minDifficulty =
        condition.minDifficulty ?? 0;

      const value = condition.value ?? 0;

      const count = completed.filter(
        (item) =>
          item.experience.difficulty >=
          minDifficulty
      ).length;

      return count >= value;
    }

    // --------------------------------
    // 관심 등록
    // --------------------------------
    case "INTERESTED_COUNT":
      return (
        interestedCount >=
        (condition.value ?? Infinity)
      );

    // --------------------------------
    // EXP
    // --------------------------------
    case "EXP":
      return (
        experiencePoints >=
        (condition.value ?? Infinity)
      );

    // --------------------------------
    // 희귀도 + 난이도
    // --------------------------------
    case "RARITY_DIFFICULTY_COMPLETED": {
      const minRarity =
        condition.minRarity ?? 0;

      const minDifficulty =
        condition.minDifficulty ?? 0;

      const value = condition.value ?? 0;

      const count = completed.filter(
        (item) =>
          item.experience.rarity >= minRarity &&
          item.experience.difficulty >=
          minDifficulty
      ).length;

      return count >= value;
    }

    // --------------------------------
    // 사진
    // --------------------------------
    case "PHOTO_COMPLETED": {
      const value = condition.value ?? 0;

      const count = completed.filter(
        (item) => item.photos.length > 0
      ).length;

      return count >= value;
    }

    // --------------------------------
    // 메모
    // --------------------------------
    case "MEMO_COMPLETED": {
      const value = condition.value ?? 0;

      const count = completed.filter(
        (item) =>
          item.memo &&
          item.memo.trim().length > 0
      ).length;

      return count >= value;
    }

    // --------------------------------
    // 별점
    // --------------------------------
    case "RATED_COMPLETED": {
      const value = condition.value ?? 0;

      const count = completed.filter(
        (item) => item.rating != null
      ).length;

      return count >= value;
    }

    // --------------------------------
    // 직접 만든 경험
    // --------------------------------
    case "USER_CREATED_COUNT":
      return (
        data.userCreatedCount >=
        (condition.value ?? Infinity)
      );

    // --------------------------------
    // 복합 조건
    // --------------------------------
    case "COMBINED": {
      if (!condition.conditions?.length) {
        return false;
      }

      return condition.conditions.every(
        (subCondition) =>
          checkAchievementCondition(
            subCondition,
            data
          )
      );
    }

    default:
      console.warn(
        `지원하지 않는 업적 조건: ${condition.type}`
      );

      return false;
  }
}