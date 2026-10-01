import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from "react-native";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  fetchMyStats,
  fetchRandomExperience,
  fetchRecommendations,
  upsertMyExperience,
} from "../api/experiences";

import { fetchMe } from "../api/me";

import { fetchMyAchievements } from "../api/achievements";

import {
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";

export default function HomeScreen() {
  const queryClient = useQueryClient();

  const navigation = useNavigation();

  const statsQuery = useQuery({
    queryKey: ["myStats"],
    queryFn: fetchMyStats,
  });

  const todayQuery = useQuery({
    queryKey: ["randomExperience"],
    queryFn: fetchRandomExperience,
  });

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
  });

  const achievementsQuery = useQuery({
    queryKey: ["myAchievements"],
    queryFn: fetchMyAchievements,
  });

  const recommendationsQuery = useQuery({
    queryKey: ["recommendations"],
    queryFn: fetchRecommendations,
  });

  // 홈 화면에 다시 들어올 때 최신 데이터 가져오기
  useFocusEffect(
    React.useCallback(() => {
      queryClient.invalidateQueries({
        queryKey: ["randomExperience"],
      });

      queryClient.invalidateQueries({
        queryKey: ["myStats"],
      });

      queryClient.invalidateQueries({
        queryKey: ["me"],
      });

      queryClient.invalidateQueries({
        queryKey: ["myAchievements"],
      });

      queryClient.invalidateQueries({
        queryKey: ["recommendations"],
      });
    }, [queryClient])
  );

  const interestMutation = useMutation({
    mutationFn: (experienceId: string) =>
      upsertMyExperience({
        experienceId,
        status: "INTERESTED",
      }),

    onSuccess: () => {
      // 내 경험 목록 갱신
      queryClient.invalidateQueries({
        queryKey: ["myExperiences"],
      });

      // 도감 목록 갱신
      queryClient.invalidateQueries({
        queryKey: ["experiences"],
      });

      // 경험치/통계 갱신
      queryClient.invalidateQueries({
        queryKey: ["myStats"],
      });

      // 오늘의 발견 관심 상태 갱신
      queryClient.invalidateQueries({
        queryKey: ["randomExperience"],
      });

      queryClient.invalidateQueries({
        queryKey: ["myAchievements"],
      });
    },

    onError: (error: any) => {
      console.error(
        "관심 등록 실패:",
        error?.response?.data ?? error
      );
    },
  });

  if (
    statsQuery.isLoading ||
    todayQuery.isLoading ||
    meQuery.isLoading ||
    achievementsQuery.isLoading ||
    recommendationsQuery.isLoading
  ) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const stats = statsQuery.data;
  const today = todayQuery.data;
  const me = meQuery.data;
  const achievements = achievementsQuery.data ?? [];
  const recommendations = recommendationsQuery.data ?? [];

  const unlockedAchievements = achievements
    .filter((achievement: any) => achievement.unlocked)
    .sort(
      (a: any, b: any) =>
        new Date(b.unlockedAt).getTime() -
        new Date(a.unlockedAt).getTime()
    );

  const latestAchievement =
    unlockedAchievements[0];

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>🏆 MY LIFE</Text>

        <View style={styles.headerRight}>
          {/* 친구 */}
          <Pressable
            style={({ pressed }) => [
              styles.friendButton,
              pressed && styles.headerButtonPressed,
            ]}
            onPress={() =>
              navigation.navigate("Friends" as never)
            }
          >
            <Text style={styles.friendIcon}>👥</Text>
          </Pressable>

          {/* 프로필 */}
          <Pressable
            style={({ pressed }) => [
              styles.profileButton,
              pressed && styles.headerButtonPressed,
            ]}
            onPress={() =>
              navigation.navigate("MemberProfile" as never)
            }
          >
            <Text style={styles.nickname}>
              {me?.nickname}
            </Text>

            <Text style={styles.profileArrow}>›</Text>
          </Pressable>
        </View>
      </View>
      {/* 최근 업적 */}
      {latestAchievement && (
        <View style={styles.latestAchievementCard}>
          <View style={styles.latestAchievementHeader}>
            <Text style={styles.latestAchievementLabel}>
              🏆 최근 업적
            </Text>

            <Text style={styles.latestAchievementDate}>
              {new Date(
                latestAchievement.unlockedAt
              ).toLocaleDateString("ko-KR")}
            </Text>
          </View>

          <Text style={styles.latestAchievementName}>
            ✨ {latestAchievement.name}
          </Text>

          <Text style={styles.latestAchievementDescription}>
            {latestAchievement.description}
          </Text>
        </View>
      )}
      {/* 나의 레벨 / 경험치 */}
      {stats && (
        <View style={styles.statsCard}>
          <Text style={styles.level}>
            Lv.{stats.level}
          </Text>

          <View style={styles.expInfo}>
            <Text style={styles.expText}>
              {stats.currentExp} / 100 EXP
            </Text>
          </View>

          <View style={styles.expBarBackground}>
            <View
              style={[
                styles.expBar,
                {
                  width: `${stats.expPercent}%`,
                },
              ]}
            />
          </View>

          <Text style={styles.count}>
            {stats.totalCount}개 경험 수집
          </Text>
        </View>
      )}

      {/* 오늘의 발견 */}
      {today && (
        <View style={styles.todayCard}>
          <Text style={styles.todayLabel}>
            🎲 오늘의 발견
          </Text>

          <Text style={styles.todayName}>
            {today.name}
          </Text>

          <Text style={styles.todayMeta}>
            {today.category.emoji}{" "}
            {today.category.name} · 난이도{" "}
            {today.difficulty} · 희귀도{" "}
            {"⭐".repeat(today.rarity)}
          </Text>

          <Pressable
            style={[
              styles.button,
              interestMutation.isPending &&
              styles.buttonDisabled,
            ]}
            disabled={interestMutation.isPending}
            onPress={() =>
              interestMutation.mutate(today.id)
            }
          >
            <Text style={styles.buttonText}>
              {interestMutation.isPending
                ? "저장 중..."
                : "❤️ 관심 등록"}
            </Text>
          </Pressable>
        </View>
      )}

      {/* 추천 경험 */}
      {recommendations.length > 0 && (
        <View style={styles.recommendationSection}>
          <View style={styles.recommendationHeader}>
            <View>
              <Text style={styles.recommendationTitle}>
                ✨ 이런 경험은 어때요?
              </Text>

              <Text style={styles.recommendationSubtitle}>
                지금까지의 활동을 바탕으로 추천했어요
              </Text>
            </View>

            <Pressable
              onPress={() =>
                queryClient.invalidateQueries({
                  queryKey: ["recommendations"],
                })
              }
            >
              <Text style={styles.refreshText}>
                ↻ 새로고침
              </Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={
              styles.recommendationList
            }
          >
            {recommendations.map((item: any) => (
              <Pressable
                key={item.id}
                style={styles.recommendationCard}
                onPress={() =>
                  (navigation as any).navigate("ExperienceDetail", {
                    experienceId: item.id,
                  })
                }
              >
                <Text style={styles.recommendationCategory}>
                  {item.category?.emoji ?? "•"}{" "}
                  {item.category?.name}
                </Text>

                <Text
                  style={styles.recommendationName}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>

                <Text
                  style={styles.recommendationReason}
                  numberOfLines={2}
                >
                  {item.recommendationReason}
                </Text>

                <Text style={styles.recommendationMeta}>
                  난이도 {item.difficulty} · 희귀도{" "}
                  {"⭐".repeat(item.rarity)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 내 활동 기록 */}
      <Pressable
        style={styles.activityCard}
        onPress={() =>
          navigation.navigate("MyActivity" as never)
        }
      >
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle}>
            📖 내 활동 기록
          </Text>

          <Text style={styles.activityArrow}>
            ›
          </Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },

  container: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
    gap: 16,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  /* 헤더 */

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
  },

  profileButton: {
    flexDirection: "row",
    alignItems: "center",
  },

  nickname: {
    fontSize: 16,
    fontWeight: "600",
  },

  profileArrow: {
    fontSize: 24,
    color: "#999",
    marginLeft: 2,
  },

  /* 레벨 / 경험치 */

  statsCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },

  level: {
    fontSize: 32,
    fontWeight: "800",
  },

  expInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },

  expText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
  },

  expBarBackground: {
    width: "100%",
    height: 10,
    backgroundColor: "#E5E5E5",
    borderRadius: 5,
    overflow: "hidden",
    marginTop: 8,
  },

  expBar: {
    height: "100%",
    backgroundColor: "#427519",
    borderRadius: 5,
  },

  count: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },

  /* 오늘의 발견 */

  todayCard: {
    backgroundColor: "#FFF7E6",
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },

  todayLabel: {
    fontSize: 14,
    color: "#999",
  },

  todayName: {
    fontSize: 20,
    fontWeight: "700",
  },

  todayMeta: {
    fontSize: 13,
    color: "#666",
  },

  button: {
    marginTop: 8,
    backgroundColor: "#FF7A45",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },

  activityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  activityTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  activityArrow: {
    fontSize: 28,
    color: "#999",
  },

  latestAchievementCard: {
    backgroundColor: "#FFF9E6",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F5E6A8",
  },

  latestAchievementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  latestAchievementLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8A6D1D",
  },

  latestAchievementDate: {
    fontSize: 11,
    color: "#999",
  },

  latestAchievementName: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 10,
  },

  latestAchievementDescription: {
    fontSize: 13,
    color: "#666",
    marginTop: 5,
    lineHeight: 19,
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  friendButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },

  friendIcon: {
    fontSize: 22,
  },

  headerButtonPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.92 }],
  },

  /* 추천 경험 */

  recommendationSection: {
    marginTop: 4,
  },

  recommendationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  recommendationTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  recommendationSubtitle: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },

  refreshText: {
    fontSize: 13,
    color: "#777",
    fontWeight: "600",
  },

  recommendationList: {
    gap: 12,
    paddingRight: 20,
  },

  recommendationCard: {
    width: 210,
    minHeight: 135,
    backgroundColor: "#F7F7F7",
    borderRadius: 16,
    padding: 16,
    justifyContent: "space-between",
  },

  recommendationCategory: {
    fontSize: 12,
    color: "#777",
  },

  recommendationName: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 23,
    marginTop: 8,
  },

  recommendationMeta: {
    fontSize: 12,
    color: "#888",
    marginTop: 12,
  },

  recommendationReason: {
    fontSize: 12,
    color: "#666",
    lineHeight: 17,
    marginTop: 6,
  },
});