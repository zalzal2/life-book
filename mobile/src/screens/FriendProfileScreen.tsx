import React from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useRoute } from "@react-navigation/native";

import { apiClient } from "../api/client";

type CategoryStat = {
    code: string;
    name: string;
    emoji: string;
    count: number;
};

type FriendProfile = {
    id: string;
    nickname: string;
    profileImage: string | null;
    friendCode: string;
    experiencePoints: number;
    totalCount: number;
    categoryStats: CategoryStat[];
};

export default function FriendProfileScreen() {
    const route = useRoute<any>();
    const friendId = route.params?.friendId;

    const [profile, setProfile] =
        React.useState<FriendProfile | null>(null);

    const [loading, setLoading] =
        React.useState(true);

    const loadProfile = async () => {
        try {
            setLoading(true);

            const { data } = await apiClient.get<FriendProfile>(
                `/friends/${friendId}/profile`
            );

            setProfile(data);
        } catch (error: any) {
            console.error(
                "친구 프로필 불러오기 실패:",
                error?.response?.data ?? error
            );

            Alert.alert(
                "오류",
                error?.response?.data?.message ||
                "친구 프로필을 불러오지 못했습니다."
            );
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (friendId) {
            loadProfile();
        }
    }, [friendId]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>
                    프로필을 불러올 수 없습니다.
                </Text>
            </View>
        );
    }

    const level =
        Math.floor(profile.experiencePoints / 100) + 1;

    const currentExp =
        profile.experiencePoints % 100;

    const expPercent = currentExp;

    return (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
        >
            {/* 프로필 */}
            <View style={styles.profileCard}>
                {profile.profileImage ? (
                    <Image
                        source={{
                            uri: profile.profileImage,
                        }}
                        style={styles.profileImage}
                    />
                ) : (
                    <View style={styles.profilePlaceholder}>
                        <Text style={styles.profileInitial}>
                            {profile.nickname
                                .charAt(0)
                                .toUpperCase()}
                        </Text>
                    </View>
                )}

                <Text style={styles.nickname}>
                    {profile.nickname}
                </Text>

                <View style={styles.friendCodeBadge}>
                    <Text style={styles.friendCode}>
                        #{profile.friendCode}
                    </Text>
                </View>
            </View>

            {/* 레벨 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    경험치
                </Text>

                <View style={styles.expCard}>
                    <View style={styles.expHeader}>
                        <Text style={styles.level}>
                            Lv.{level}
                        </Text>

                        <Text style={styles.expText}>
                            {currentExp} / 100 EXP
                        </Text>
                    </View>

                    <View style={styles.expBarBackground}>
                        <View
                            style={[
                                styles.expBar,
                                {
                                    width: `${expPercent}%`,
                                },
                            ]}
                        />
                    </View>

                    <Text style={styles.totalExp}>
                        총 {profile.experiencePoints} EXP
                    </Text>
                </View>
            </View>

            {/* 활동 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    활동 기록
                </Text>

                <View style={styles.statRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {profile.totalCount}
                        </Text>

                        <Text style={styles.statLabel}>
                            수집한 경험
                        </Text>
                    </View>

                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {profile.categoryStats.length}
                        </Text>

                        <Text style={styles.statLabel}>
                            활동 카테고리
                        </Text>
                    </View>
                </View>
            </View>

            {/* 카테고리 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    카테고리별 활동
                </Text>

                {profile.categoryStats.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>
                            아직 완료한 경험이 없습니다.
                        </Text>
                    </View>
                ) : (
                    profile.categoryStats.map(
                        (category) => (
                            <View
                                key={category.code}
                                style={styles.categoryCard}
                            >
                                <View
                                    style={
                                        styles.categoryLeft
                                    }
                                >
                                    <View
                                        style={
                                            styles.categoryIcon
                                        }
                                    >
                                        <Text>
                                            {category.emoji}
                                        </Text>
                                    </View>

                                    <Text
                                        style={
                                            styles.categoryName
                                        }
                                    >
                                        {category.name}
                                    </Text>
                                </View>

                                <Text
                                    style={
                                        styles.categoryCount
                                    }
                                >
                                    {category.count}개
                                </Text>
                            </View>
                        )
                    )
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: "#F8F8F8",
    },

    container: {
        padding: 20,
        paddingTop: 24,
        paddingBottom: 50,
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F8F8F8",
    },

    errorText: {
        color: "#888",
        fontSize: 14,
    },

    /* 프로필 */

    profileCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        paddingVertical: 28,
        alignItems: "center",
    },

    profileImage: {
        width: 88,
        height: 88,
        borderRadius: 44,
        marginBottom: 14,
    },

    profilePlaceholder: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: "#EAEAEA",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 14,
    },

    profileInitial: {
        fontSize: 32,
        fontWeight: "800",
        color: "#666",
    },

    nickname: {
        fontSize: 23,
        fontWeight: "800",
        color: "#222",
    },

    friendCodeBadge: {
        marginTop: 8,
        backgroundColor: "#F2F2F2",
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },

    friendCode: {
        fontSize: 12,
        color: "#777",
        fontWeight: "600",
        letterSpacing: 1,
    },

    /* 섹션 */

    section: {
        marginTop: 24,
    },

    sectionTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#222",
        marginBottom: 12,
    },

    /* 경험치 */

    expCard: {
        backgroundColor: "#222",
        borderRadius: 18,
        padding: 20,
    },

    expHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    level: {
        color: "#fff",
        fontSize: 28,
        fontWeight: "800",
    },

    expText: {
        color: "#BDBDBD",
        fontSize: 12,
        fontWeight: "600",
    },

    expBarBackground: {
        width: "100%",
        height: 9,
        backgroundColor: "#444",
        borderRadius: 5,
        overflow: "hidden",
        marginTop: 16,
    },

    expBar: {
        height: "100%",
        backgroundColor: "#fff",
        borderRadius: 5,
    },

    totalExp: {
        color: "#999",
        fontSize: 11,
        marginTop: 10,
    },

    /* 활동 통계 */

    statRow: {
        flexDirection: "row",
        gap: 10,
    },

    statCard: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 16,
        paddingVertical: 20,
        alignItems: "center",
    },

    statNumber: {
        fontSize: 25,
        fontWeight: "800",
        color: "#222",
    },

    statLabel: {
        marginTop: 5,
        fontSize: 12,
        color: "#999",
    },

    /* 카테고리 */

    categoryCard: {
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    categoryLeft: {
        flexDirection: "row",
        alignItems: "center",
    },

    categoryIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: "#F2F2F2",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },

    categoryName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
    },

    categoryCount: {
        fontSize: 13,
        fontWeight: "700",
        color: "#777",
    },

    emptyCard: {
        backgroundColor: "#fff",
        borderRadius: 14,
        paddingVertical: 24,
        alignItems: "center",
    },

    emptyText: {
        fontSize: 13,
        color: "#999",
    },
});