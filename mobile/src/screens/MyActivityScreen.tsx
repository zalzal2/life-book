import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Pressable,
    ScrollView,
} from "react-native";
import {
    useFocusEffect,
    useNavigation,
} from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
    fetchMyStats,
    fetchMyExperiences,
} from "../api/experiences";
import { fetchMyAchievements } from "../api/achievements";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type TabType =
    | "COMPLETED"
    | "INTERESTED"
    | "ACHIEVEMENTS"
    | "STATS";

type MainStackParamList = {
    MainTabs: undefined;
    MyActivity: undefined;
    ExperienceDetail: {
        experienceId: string;
    };
    MemberProfile: undefined;
    ProfileEdit: undefined;
    ChangePassword: undefined;
    NotificationSettings: undefined;
    AppInfo: undefined;
};

const CATEGORY_INFO: Record<
    string,
    { emoji: string; name: string }
> = {
    TRAVEL: { emoji: "✈️", name: "여행" },
    FOOD: { emoji: "🍜", name: "음식" },
    CULTURE: { emoji: "🎨", name: "문화" },
    ADVENTURE: { emoji: "🎯", name: "도전" },
    HOBBY: { emoji: "🎮", name: "취미" },
    RELATION: { emoji: "👥", name: "관계" },
    GROWTH: { emoji: "💼", name: "성장" },
    LIFE: { emoji: "🌱", name: "일상" },
};

export default function MyActivityScreen() {
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] =
        useState<TabType>("COMPLETED");

    const statsQuery = useQuery({
        queryKey: ["myStats"],
        queryFn: fetchMyStats,
    });

    const experiencesQuery = useQuery({
        queryKey: ["myExperiences"],
        queryFn: () => fetchMyExperiences(),
    });

    const achievementsQuery = useQuery({
        queryKey: ["myAchievements"],
        queryFn: fetchMyAchievements,
    });

    useFocusEffect(
        useCallback(() => {
            queryClient.invalidateQueries({
                queryKey: ["myStats"],
            });

            queryClient.invalidateQueries({
                queryKey: ["myExperiences"],
            });

            queryClient.invalidateQueries({
                queryKey: ["myAchievements"],
            });
        }, [queryClient])
    );

    if (
        statsQuery.isLoading ||
        experiencesQuery.isLoading ||
        achievementsQuery.isLoading
    ) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
            </View>
        );
    }

    const stats = statsQuery.data;

    const experiences =
        experiencesQuery.data ?? [];

    const achievements =
        achievementsQuery.data ?? [];

    const completedExperiences =
        experiences.filter(
            (item: any) => item.status === "COMPLETED"
        );

    const interestedExperiences =
        experiences.filter(
            (item: any) => item.status === "INTERESTED"
        );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* 요약 카드 */}
            {stats && (
                <View style={styles.summaryCard}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryNumber}>
                            {stats.totalCount}
                        </Text>
                        <Text style={styles.summaryLabel}>
                            완료
                        </Text>
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryNumber}>
                            {stats.interestedCount}
                        </Text>
                        <Text style={styles.summaryLabel}>
                            관심
                        </Text>
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryNumber}>
                            {stats.totalExp}
                        </Text>
                        <Text style={styles.summaryLabel}>
                            EXP
                        </Text>
                    </View>
                </View>
            )}

            {/* 탭 */}
            <View style={styles.tabs}>
                <TabButton
                    label="완료"
                    active={activeTab === "COMPLETED"}
                    onPress={() => setActiveTab("COMPLETED")}
                />

                <TabButton
                    label="관심"
                    active={activeTab === "INTERESTED"}
                    onPress={() => setActiveTab("INTERESTED")}
                />

                <TabButton
                    label="업적"
                    active={activeTab === "ACHIEVEMENTS"}
                    onPress={() =>
                        setActiveTab("ACHIEVEMENTS")
                    }
                />

                <TabButton
                    label="통계"
                    active={activeTab === "STATS"}
                    onPress={() => setActiveTab("STATS")}
                />
            </View>

            {/* 완료 */}
            {activeTab === "COMPLETED" && (
                <View>
                    {completedExperiences.length === 0 ? (
                        <EmptyState text="아직 완료한 경험이 없어요." />
                    ) : (
                        completedExperiences.map(
                            (item: any) => (
                                <ExperienceCard
                                    key={item.id}
                                    item={item}
                                />
                            )
                        )
                    )}
                </View>
            )}

            {/* 관심 */}
            {activeTab === "INTERESTED" && (
                <View>
                    {interestedExperiences.length === 0 ? (
                        <EmptyState text="관심 등록한 경험이 없어요." />
                    ) : (
                        interestedExperiences.map(
                            (item: any) => (
                                <ExperienceCard
                                    key={item.id}
                                    item={item}
                                />
                            )
                        )
                    )}
                </View>
            )}

            {/* 업적 */}
            {activeTab === "ACHIEVEMENTS" && (
                <AchievementSection
                    achievements={achievements}
                />
            )}

            {/* 통계 */}
            {activeTab === "STATS" && stats && (
                <StatsSection stats={stats} />
            )}
        </ScrollView>
    );
}

function TabButton({
    label,
    active,
    onPress,
}: {
    label: string;
    active: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            style={[
                styles.tab,
                active && styles.activeTab,
            ]}
            onPress={onPress}
        >
            <Text
                style={[
                    styles.tabText,
                    active && styles.activeTabText,
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
}

function ExperienceCard({
    item,
}: {
    item: any;
}) {
    const navigation =
        useNavigation<
            NativeStackNavigationProp<MainStackParamList>
        >();

    const experience = item.experience;

    const category =
        CATEGORY_INFO[experience.category?.code];

    return (
        <Pressable
            style={({ pressed }) => [
                styles.experienceCard,
                pressed && styles.experienceCardPressed,
            ]}
            onPress={() => {
                navigation.navigate("ExperienceDetail", {
                    experienceId: experience.id,
                });
            }}
        >
            <View style={styles.experienceHeader}>
                <Text style={styles.category}>
                    {category
                        ? `${category.emoji} ${category.name}`
                        : experience.category?.name}
                </Text>

                {item.earnedExp != null && (
                    <Text style={styles.exp}>
                        +{item.earnedExp} EXP
                    </Text>
                )}
            </View>

            <Text style={styles.experienceName}>
                {experience.name}
            </Text>

            <Text style={styles.meta}>
                난이도 {experience.difficulty}
                {"  ·  "}
                {"⭐".repeat(experience.rarity)}
            </Text>

            {item.status === "COMPLETED" &&
                item.rating != null && (
                    <Text style={styles.rating}>
                        {"★".repeat(item.rating)}
                        {"☆".repeat(5 - item.rating)}
                    </Text>
                )}

            {item.memo && (
                <Text
                    style={styles.memo}
                    numberOfLines={2}
                >
                    {item.memo}
                </Text>
            )}
        </Pressable>
    );
}

function EmptyState({
    text,
}: {
    text: string;
}) {
    return (
        <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>
                {text}
            </Text>
        </View>
    );
}

function StatsSection({
    stats,
}: {
    stats: any;
}) {
    return (
        <View>
            <View style={styles.statCard}>
                <Text style={styles.statTitle}>
                    📊 카테고리별 수집
                </Text>

                {Object.entries(
                    stats.categoryStats ?? {}
                ).map(([category, count]) => {
                    const info =
                        CATEGORY_INFO[category];

                    return (
                        <View
                            key={category}
                            style={styles.statRow}
                        >
                            <Text style={styles.statLabel}>
                                {info
                                    ? `${info.emoji} ${info.name}`
                                    : category}
                            </Text>

                            <Text style={styles.statValue}>
                                {String(count)}개
                            </Text>
                        </View>
                    );
                })}
            </View>

            <View style={styles.statCard}>
                <Text style={styles.statTitle}>
                    ⭐ 희귀도별 수집
                </Text>

                {Object.entries(
                    stats.rarityStats ?? {}
                ).map(([rarity, count]) => {
                    const rarityNumber = Number(rarity);

                    return (
                        <View
                            key={rarity}
                            style={styles.statRow}
                        >
                            <Text style={styles.rarity}>
                                {"★".repeat(rarityNumber)}
                                {"☆".repeat(
                                    5 - rarityNumber
                                )}
                            </Text>

                            <Text style={styles.statValue}>
                                {String(count)}개
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

function AchievementSection({
    achievements,
}: {
    achievements: any[];
}) {
    const unlockedCount = achievements.filter(
        (a) => a.unlocked
    ).length;

    const sortedAchievements = [...achievements].sort((a, b) => {
        // 달성한 업적 먼저
        if (a.unlocked !== b.unlocked) {
            return a.unlocked ? -1 : 1;
        }

        // 둘 다 달성했다면 최근 달성한 업적 먼저
        if (a.unlocked && b.unlocked) {
            return (
                new Date(b.unlockedAt).getTime() -
                new Date(a.unlockedAt).getTime()
            );
        }

        // 둘 다 미달성이라면 기존 순서 유지
        return 0;
    });

    return (
        <View>
            <View style={styles.achievementSummary}>
                <Text style={styles.achievementSummaryTitle}>
                    🏆 업적 달성
                </Text>

                <Text style={styles.achievementSummaryCount}>
                    {unlockedCount} / {achievements.length}
                </Text>
            </View>

            {sortedAchievements.map((achievement) => (
                <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                />
            ))}
        </View>
    );
}

function AchievementCard({
    achievement,
}: {
    achievement: any;
}) {
    const unlocked = achievement.unlocked;

    return (
        <View
            style={[
                styles.achievementCard,
                !unlocked &&
                styles.lockedAchievementCard,
            ]}
        >
            <View
                style={[
                    styles.achievementIcon,
                    !unlocked &&
                    styles.lockedAchievementIcon,
                ]}
            >
                <Text style={styles.achievementIconText}>
                    {unlocked ? "🏆" : "🔒"}
                </Text>
            </View>

            <View style={styles.achievementContent}>
                <Text
                    style={[
                        styles.achievementName,
                        !unlocked &&
                        styles.lockedAchievementText,
                    ]}
                >
                    {achievement.name}
                </Text>

                <Text
                    style={[
                        styles.achievementDescription,
                        !unlocked &&
                        styles.lockedAchievementText,
                    ]}
                >
                    {achievement.description}
                </Text>

                {unlocked &&
                    achievement.unlockedAt && (
                        <Text style={styles.unlockedDate}>
                            {new Date(
                                achievement.unlockedAt
                            ).toLocaleDateString("ko-KR")}{" "}
                            달성
                        </Text>
                    )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f7f7f7",
    },

    content: {
        padding: 20,
        paddingBottom: 40,
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },

    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
    },

    backText: {
        fontSize: 34,
        lineHeight: 38,
    },

    headerTitle: {
        flex: 1,
        fontSize: 22,
        fontWeight: "700",
    },

    headerSpacer: {
        width: 40,
    },

    summaryCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 16,
        paddingVertical: 20,
        marginBottom: 20,
    },

    summaryItem: {
        flex: 1,
        alignItems: "center",
    },

    summaryNumber: {
        fontSize: 22,
        fontWeight: "700",
    },

    summaryLabel: {
        marginTop: 5,
        fontSize: 13,
        color: "#777",
    },

    summaryDivider: {
        width: 1,
        height: 35,
        backgroundColor: "#eee",
    },

    tabs: {
        flexDirection: "row",
        backgroundColor: "#eaeaea",
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
    },

    tab: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 11,
        borderRadius: 9,
    },

    activeTab: {
        backgroundColor: "#fff",
    },

    tabText: {
        fontSize: 14,
        color: "#777",
        fontWeight: "500",
    },

    activeTabText: {
        color: "#111",
        fontWeight: "700",
    },

    experienceCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 17,
        marginBottom: 12,
    },

    experienceCardPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },

    experienceHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    category: {
        fontSize: 13,
        color: "#666",
    },

    exp: {
        fontSize: 13,
        fontWeight: "700",
    },

    experienceName: {
        fontSize: 18,
        fontWeight: "700",
        marginTop: 8,
    },

    meta: {
        fontSize: 13,
        color: "#777",
        marginTop: 7,
    },

    rating: {
        marginTop: 8,
        fontSize: 15,
    },

    memo: {
        marginTop: 10,
        color: "#666",
        lineHeight: 19,
    },

    empty: {
        alignItems: "center",
        paddingVertical: 60,
    },

    emptyIcon: {
        fontSize: 40,
        marginBottom: 12,
    },

    emptyText: {
        color: "#888",
    },

    statCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
    },

    statTitle: {
        fontSize: 17,
        fontWeight: "700",
        marginBottom: 15,
    },

    statRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 9,
    },

    statLabel: {
        fontSize: 14,
    },

    statValue: {
        fontSize: 14,
        fontWeight: "600",
    },

    rarity: {
        fontSize: 13,
    },

    achievementSummary: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#FFF9E6",
        borderRadius: 16,
        padding: 18,
        marginBottom: 12,
    },

    achievementSummaryTitle: {
        fontSize: 16,
        fontWeight: "700",
    },

    achievementSummaryCount: {
        fontSize: 16,
        fontWeight: "700",
        color: "#8A6D1D",
    },

    achievementCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#F5E6A8",
    },

    lockedAchievementCard: {
        opacity: 0.55,
        borderColor: "#EEEEEE",
    },

    achievementIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: "#FFF9E6",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,
    },

    lockedAchievementIcon: {
        backgroundColor: "#F2F2F2",
    },

    achievementIconText: {
        fontSize: 25,
    },

    achievementContent: {
        flex: 1,
    },

    achievementName: {
        fontSize: 16,
        fontWeight: "700",
    },

    achievementDescription: {
        fontSize: 13,
        color: "#666",
        marginTop: 4,
        lineHeight: 18,
    },

    lockedAchievementText: {
        color: "#999",
    },

    unlockedDate: {
        fontSize: 11,
        color: "#A58B3A",
        marginTop: 6,
    },
});