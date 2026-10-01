import { apiClient } from "./client";

export type ExperienceStatus = "INTERESTED" | "COMPLETED";

export type MyExperience = {
  id: string;
  status: ExperienceStatus;
  rating: number | null;
  memo: string | null;
  completedAt: string | null;
  earnedExp: number | null;

  photos: {
    id: string;
    url: string;
  }[];

  experience: {
    id: string;
    name: string;
    description: string | null;
    difficulty: number;
    rarity: number;
    estimatedTime: string | null;
    cost: string | null;
    companion: string | null;
    scope: string | null;

    category: {
      id: number;
      code: string;
      name: string;
      emoji: string | null;
    };
  };
};

export type Experience = {
  id: string;
  name: string;
  description: string | null;
  difficulty: number;
  rarity: number;
  estimatedTime: string | null;
  cost: string | null;
  companion: string | null;
  scope: string | null;

  source: "BASE" | "SEASON" | "USER";

  category: {
    id: number;
    code: string;
    name: string;
    emoji: string | null;
  };

  // 사용자 생성 경험 작성자
  createdBy?: {
    id: string;
    nickname: string;
    profileImage: string | null;
  } | null;

  // 내가 이 경험을 관심/완료했는지
  myExperience: MyExperience | null;
};

export type MyStats = {
  totalCount: number;
  interestedCount: number;
  totalExp: number;
  level: number;
  currentExp: number;
  nextLevelExp: number;
  expPercent: number;
  categoryStats: Record<string, number>;
  rarityStats: Record<number, number>;
};

export async function fetchExperiences(params?: {
  keyword?: string;
  category?: string;
  scope?: string;
  source?: string;
  status?: ExperienceStatus;
  rarity?: number;
  difficulty?: number;
  createdByMe?: boolean;
}) {
  const { data } = await apiClient.get<Experience[]>("/experiences", {
    params,
  });

  return data;
}

export async function fetchRandomExperience() {
  const { data } = await apiClient.get<Experience>("/experiences/random");
  return data;
}

export async function fetchMyStats(): Promise<MyStats> {
  const res = await apiClient.get("/me/stats");
  return res.data;
}

export async function upsertMyExperience(payload: {
  experienceId: string;
  status: ExperienceStatus;
  rating?: number;
  memo?: string;
  photoUrls?: string[];
}) {
  const { data } = await apiClient.post("/me/experiences", payload);
  return data;
}

export async function fetchMyExperiences(
  status?: ExperienceStatus
): Promise<MyExperience[]> {
  const { data } = await apiClient.get<MyExperience[]>(
    "/me/experiences",
    {
      params: { status },
    }
  );

  return data;
}

export async function cancelMyInterest(
  experienceId: string
) {
  return apiClient.delete(
    `/me/experiences/interest/${experienceId}`
  );
}

export type Category = {
  id: number;
  code: string;
  name: string;
  emoji: string | null;
};

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>("/categories");
  return data;
}

export async function createExperience(payload: {
  categoryId: number;
  name: string;
  description?: string;
  difficulty: number;
  rarity: number;
  estimatedTime?: string;
  cost?: string;
  companion?: string;
  scope?: string;
  isPublic: boolean;
}) {
  const { data } = await apiClient.post(
    "/experiences",
    payload
  );

  return data;
}

export async function checkDuplicateExperiences(
  name: string
) {
  const { data } = await apiClient.get(
    "/experiences/check-duplicate",
    {
      params: { name },
    }
  );

  return data;
}

export async function reportExperience(
  experienceId: string,
  reason: string
) {
  const { data } = await apiClient.post(
    `/experiences/${experienceId}/report`,
    {
      reason,
    }
  );

  return data;
}

export async function fetchRecommendations() {
  const { data } = await apiClient.get("/me/recommendations");
  return data;
}