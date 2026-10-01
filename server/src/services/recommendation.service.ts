import { prisma } from "../lib/prisma";

// v1 추천 로직: 아직 안 해본 경험 중, 유저가 가장 많이 완료한 카테고리와
// 같은 카테고리 + 난이도가 살짝 높은 것을 우선 추천.
// 추후 AI 기반 추천(사용자 패턴 분석)으로 고도화 가능.
export async function recommendNextExperiences(
  userId: string,
  take = 5
) {
  // 1. 사용자의 경험 기록 가져오기
  const userExperiences = await prisma.userExperience.findMany({
    where: { userId },
    include: {
      experience: true,
    },
  });

  // 이미 완료했거나 관심 등록한 경험
  const excludedIds = userExperiences.map(
    (item) => item.experienceId
  );

  const completed = userExperiences.filter(
    (item) => item.status === "COMPLETED"
  );

  // --------------------------------------------------
  // 신규 유저
  // --------------------------------------------------

  if (completed.length === 0) {
    const candidates = await prisma.experience.findMany({
      where: {
        isPublic: true,
        id: {
          notIn: excludedIds,
        },
        difficulty: {
          lte: 2,
        },
      },
      include: {
        category: true,
      },
      take: 30,
    });

    return candidates
      .sort(() => Math.random() - 0.5)
      .slice(0, take)
      .map((experience) => ({
        ...experience,
        recommendationReason:
          "처음 시작하기 좋은 쉬운 경험이에요",
      }));
  }

  // --------------------------------------------------
  // 2. 완료 경험 분석
  // --------------------------------------------------

  const categoryCount: Record<number, number> = {};

  let totalDifficulty = 0;
  let totalRarity = 0;

  for (const item of completed) {
    const experience = item.experience;

    categoryCount[experience.categoryId] =
      (categoryCount[experience.categoryId] || 0) + 1;

    totalDifficulty += experience.difficulty;
    totalRarity += experience.rarity;
  }

  const avgDifficulty =
    totalDifficulty / completed.length;

  const avgRarity =
    totalRarity / completed.length;

  // --------------------------------------------------
  // 3. 카테고리 선호도 순위
  // --------------------------------------------------

  const favoriteCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .map(([categoryId]) => Number(categoryId));

  // --------------------------------------------------
  // 4. 추천 후보 가져오기
  // --------------------------------------------------

  const candidates = await prisma.experience.findMany({
    where: {
      isPublic: true,

      id: {
        notIn: excludedIds,
      },
    },

    include: {
      category: true,
    },

    take: 100,
  });

  // --------------------------------------------------
  // 5. 후보 점수 계산
  // --------------------------------------------------

  const scored = candidates.map((experience) => {
    let score = 0;

    const categoryIndex =
      favoriteCategories.indexOf(
        experience.categoryId
      );

    // 선호 카테고리
    if (categoryIndex === 0) {
      score += 50;
    } else if (categoryIndex === 1) {
      score += 35;
    } else if (categoryIndex === 2) {
      score += 25;
    } else if (categoryIndex >= 0) {
      score += 15;
    }

    // 난이도 차이
    const difficultyDiff = Math.abs(
      experience.difficulty - avgDifficulty
    );

    if (difficultyDiff === 0) {
      score += 30;
    } else if (difficultyDiff <= 1) {
      score += 20;
    } else if (difficultyDiff <= 2) {
      score += 10;
    }

    // 희귀도 차이
    const rarityDiff = Math.abs(
      experience.rarity - avgRarity
    );

    if (rarityDiff <= 0.5) {
      score += 15;
    } else if (rarityDiff <= 1) {
      score += 10;
    } else if (rarityDiff <= 2) {
      score += 5;
    }

    // 약간의 랜덤성
    score += Math.random() * 10;

    return {
      experience,
      score,
    };
  });

  // --------------------------------------------------
  // 6. 점수순 정렬
  // --------------------------------------------------

  scored.sort((a, b) => b.score - a.score);

  // --------------------------------------------------
  // 7. 카테고리 다양성을 고려해서 추천
  // --------------------------------------------------

  const selected: typeof scored = [];
  const categorySelectedCount: Record<number, number> = {};

  // 먼저 높은 점수 순으로 보면서
  // 같은 카테고리가 2개 이상 몰리지 않도록 선택
  for (const item of scored) {
    if (selected.length >= take) {
      break;
    }

    const categoryId = item.experience.categoryId;

    const count =
      categorySelectedCount[categoryId] || 0;

    // 같은 카테고리는 최대 2개까지
    if (count >= 2) {
      continue;
    }

    selected.push(item);

    categorySelectedCount[categoryId] =
      count + 1;
  }

  // --------------------------------------------------
  // 8. 후보가 부족하면 남은 경험으로 채우기
  // --------------------------------------------------

  if (selected.length < take) {
    for (const item of scored) {
      if (selected.length >= take) {
        break;
      }

      const alreadySelected = selected.some(
        (selectedItem) =>
          selectedItem.experience.id ===
          item.experience.id
      );

      if (alreadySelected) {
        continue;
      }

      selected.push(item);
    }
  }

  // --------------------------------------------------
  // 9. 추천 결과 반환
  // --------------------------------------------------

  return selected.map((item) => {
    const experience = item.experience;

    let reason = "새로운 경험을 발견해보세요";

    const categoryIndex =
      favoriteCategories.indexOf(
        experience.categoryId
      );

    if (categoryIndex === 0) {
      reason = "가장 많이 완료한 카테고리예요";
    } else if (categoryIndex === 1) {
      reason = "자주 즐긴 카테고리예요";
    } else if (
      Math.abs(
        experience.difficulty - avgDifficulty
      ) <= 1
    ) {
      reason = "지금까지의 경험과 비슷한 난이도예요";
    } else if (
      Math.abs(
        experience.rarity - avgRarity
      ) <= 1
    ) {
      reason = "지금까지 수집한 경험과 비슷한 희귀도예요";
    }

    return {
      ...experience,
      recommendationReason: reason,
    };
  });
}