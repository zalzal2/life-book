import React from "react";
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView,
} from "react-native";
import {
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { fetchMe, deleteMe } from "../api/me";
import { useAuthStore } from "../store/authStore";
import { useNavigation } from "@react-navigation/native";


export default function MemberProfileScreen() {
    const queryClient = useQueryClient();
    const navigation = useNavigation();
    const logout = useAuthStore((state) => state.logout);

    const meQuery = useQuery({
        queryKey: ["me"],
        queryFn: fetchMe,
    });

    const handleLogout = () => {
        Alert.alert(
            "로그아웃",
            "로그아웃하시겠습니까?",
            [
                {
                    text: "취소",
                    style: "cancel",
                },
                {
                    text: "로그아웃",
                    style: "destructive",
                    onPress: async () => {
                        await logout();

                        queryClient.clear();
                    },
                },
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "회원탈퇴",
            "정말 탈퇴하시겠습니까?\n\n회원정보와 활동 기록은 삭제되며, 직접 작성한 도감은 유지됩니다.",
            [
                {
                    text: "취소",
                    style: "cancel",
                },
                {
                    text: "탈퇴하기",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteMe();

                            await logout();

                            queryClient.clear();
                        } catch (error: any) {
                            console.error("회원탈퇴 실패:", error);

                            Alert.alert(
                                "회원탈퇴 실패",
                                error?.response?.data?.message ??
                                "회원탈퇴에 실패했습니다."
                            );
                        }
                    },
                },
            ]
        );
    };

    if (meQuery.isLoading || !meQuery.data) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
            </View>
        );
    }

    const me = meQuery.data;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
        >
            {/* 프로필 */}
            <View style={styles.profileCard}>
                <View style={styles.profileImage}>
                    <Text style={styles.profileEmoji}>👤</Text>
                </View>

                <Text style={styles.nickname}>
                    {me.nickname}
                </Text>

                <Text style={styles.email}>
                    {me.email}
                </Text>
            </View>

            {/* 계정 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    계정
                </Text>

                <View style={styles.menuGroup}>
                    <Pressable
                        style={styles.menuItem}
                        onPress={() => {
                            navigation.navigate("ProfileEdit" as never);
                        }}
                    >
                        <Text style={styles.menuText}>
                            프로필 수정
                        </Text>

                        <Text style={styles.arrow}>
                            ›
                        </Text>
                    </Pressable>

                    <View style={styles.divider} />

                    {me.authProvider === "LOCAL" && (
                        <>
                            <View style={styles.divider} />

                            <Pressable
                                style={styles.menuItem}
                                onPress={() => {
                                    navigation.navigate("ChangePassword" as never);
                                }}
                            >
                                <Text style={styles.menuText}>
                                    비밀번호 변경
                                </Text>

                                <Text style={styles.arrow}>
                                    ›
                                </Text>
                            </Pressable>
                        </>
                    )}
                </View>
            </View>

            {/* 앱 설정 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    앱 설정
                </Text>

                <View style={styles.menuGroup}>
                    <Pressable
                        style={styles.menuItem}
                        onPress={() => {
                            navigation.navigate("NotificationSettings" as never);
                        }}
                    >
                        <Text style={styles.menuText}>
                            알림 설정
                        </Text>

                        <Text style={styles.arrow}>
                            ›
                        </Text>
                    </Pressable>

                    <View style={styles.divider} />

                    <Pressable
                        style={styles.menuItem}
                        onPress={() => {
                            navigation.navigate("AppInfo" as never);
                        }}
                    >
                        <Text style={styles.menuText}>
                            앱 정보
                        </Text>

                        <Text style={styles.arrow}>
                            ›
                        </Text>
                    </Pressable>
                </View>
            </View>

            {/* 기타 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    기타
                </Text>

                <View style={styles.menuGroup}>
                    <Pressable
                        style={styles.menuItem}
                        onPress={handleLogout}
                    >
                        <Text style={styles.menuText}>
                            로그아웃
                        </Text>
                    </Pressable>

                    <View style={styles.divider} />

                    <Pressable
                        style={styles.menuItem}
                        onPress={handleDeleteAccount}
                    >
                        <Text style={styles.deleteText}>
                            회원탈퇴
                        </Text>
                    </Pressable>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F8F8",
    },

    contentContainer: {
        padding: 20,
        paddingTop: 30,
        paddingBottom: 40,
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    profileCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        paddingVertical: 28,
        alignItems: "center",
        marginBottom: 30,
    },

    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#F2F2F2",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },

    profileEmoji: {
        fontSize: 36,
    },

    nickname: {
        fontSize: 20,
        fontWeight: "700",
    },

    email: {
        fontSize: 14,
        color: "#888",
        marginTop: 5,
    },

    section: {
        marginBottom: 28,
    },

    sectionTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#777",
        marginBottom: 8,
        marginLeft: 4,
    },

    menuGroup: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        overflow: "hidden",
    },

    menuItem: {
        minHeight: 52,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    menuText: {
        fontSize: 15,
        color: "#222",
    },

    arrow: {
        fontSize: 24,
        color: "#AAA",
    },

    divider: {
        height: 1,
        backgroundColor: "#F0F0F0",
        marginLeft: 16,
    },

    deleteText: {
        fontSize: 15,
        color: "#E53935",
    },
});