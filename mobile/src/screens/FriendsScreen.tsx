import React, { useCallback, useState } from "react";
import {
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import {
    useFocusEffect,
    useNavigation,
} from "@react-navigation/native";
import { apiClient } from "../api/client";
import { fetchMe } from "../api/me";

type Friend = {
    friendshipId: string;
    id: string;
    nickname: string;
    profileImage: string | null;
    friendCode: string;
};

type FriendRequest = {
    id: string;
    requester: {
        id: string;
        nickname: string;
        profileImage: string | null;
        friendCode: string;
    };
};

export default function FriendsScreen() {
    const [myFriendCode, setMyFriendCode] = useState("");
    const [friendCode, setFriendCode] = useState("");
    const [loading, setLoading] = useState(false);

    const [friends, setFriends] = useState<Friend[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const navigation = useNavigation<any>();

    // 친구 정보 불러오기
    const loadFriendsData = async () => {
        try {
            const [me, friendsResponse, requestsResponse] =
                await Promise.all([
                    fetchMe(),
                    apiClient.get("/friends"),
                    apiClient.get("/friends/requests"),
                ]);

            setMyFriendCode(me.friendCode);
            setFriends(friendsResponse.data.friends);
            setRequests(requestsResponse.data.requests);
        } catch (error) {
            console.error("친구 정보 불러오기 실패:", error);

            Alert.alert(
                "오류",
                "친구 정보를 불러오지 못했습니다."
            );
        }
    };

    // 화면에 다시 들어왔을 때 갱신
    useFocusEffect(
        useCallback(() => {
            loadFriendsData();
        }, [])
    );

    // 당겨서 새로고침
    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            await loadFriendsData();
        } finally {
            setRefreshing(false);
        }
    };

    // 친구 코드 복사
    const handleCopyFriendCode = async () => {
        if (!myFriendCode) return;

        await Clipboard.setStringAsync(myFriendCode);

        Alert.alert(
            "복사 완료",
            "친구 코드가 복사되었습니다."
        );
    };

    // 친구 요청
    const handleSendRequest = async () => {
        const code = friendCode.trim().toUpperCase();

        if (!code) {
            Alert.alert(
                "알림",
                "친구 코드를 입력해주세요."
            );
            return;
        }

        try {
            setLoading(true);

            await apiClient.post("/friends/request", {
                friendCode: code,
            });

            Alert.alert(
                "완료",
                "친구 요청을 보냈습니다."
            );

            setFriendCode("");

            await loadFriendsData();
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                "친구 요청에 실패했습니다.";

            Alert.alert(
                "친구 요청 실패",
                message
            );
        } finally {
            setLoading(false);
        }
    };

    // 친구 요청 수락
    const handleAcceptRequest = async (
        friendshipId: string
    ) => {
        try {
            await apiClient.patch(
                `/friends/${friendshipId}/accept`
            );

            await loadFriendsData();

            Alert.alert(
                "완료",
                "친구 요청을 수락했습니다."
            );
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                "친구 요청 수락에 실패했습니다.";

            Alert.alert("오류", message);
        }
    };

    // 친구 요청 거절 / 친구 삭제
    const handleDeleteFriend = (
        friendshipId: string,
        message: string
    ) => {
        Alert.alert(
            "확인",
            message,
            [
                {
                    text: "취소",
                    style: "cancel",
                },
                {
                    text: "확인",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await apiClient.delete(
                                `/friends/${friendshipId}`
                            );

                            await loadFriendsData();
                        } catch (error: any) {
                            const message =
                                error?.response?.data?.message ||
                                "처리에 실패했습니다.";

                            Alert.alert(
                                "오류",
                                message
                            );
                        }
                    },
                },
            ]
        );
    };

    return (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                />
            }
        >
            {/* 헤더 */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>
                        친구
                    </Text>

                    <Text style={styles.subtitle}>
                        친구와 경험을 함께 기록해보세요.
                    </Text>
                </View>

                <View style={styles.friendCountBadge}>
                    <Text style={styles.friendCountText}>
                        {friends.length}
                    </Text>
                </View>
            </View>

            {/* 내 친구 코드 */}
            <View style={styles.codeCard}>
                <View style={styles.codeCardTop}>
                    <View>
                        <Text style={styles.codeLabel}>
                            내 친구 코드
                        </Text>

                        <Text style={styles.codeDescription}>
                            친구에게 이 코드를 알려주세요.
                        </Text>
                    </View>

                    <View style={styles.codeIcon}>
                        <Text style={styles.codeIconText}>
                            #
                        </Text>
                    </View>
                </View>

                <View style={styles.codeRow}>
                    <Text style={styles.friendCode}>
                        {myFriendCode || "------"}
                    </Text>

                    <Pressable
                        style={({ pressed }) => [
                            styles.copyButton,
                            pressed && styles.pressed,
                            !myFriendCode &&
                            styles.disabledButton,
                        ]}
                        onPress={handleCopyFriendCode}
                        disabled={!myFriendCode}
                    >
                        <Text style={styles.copyButtonText}>
                            복사
                        </Text>
                    </Pressable>
                </View>
            </View>

            {/* 친구 추가 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    친구 추가
                </Text>

                <View style={styles.searchRow}>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.searchIcon}>
                            #
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="친구 코드 입력"
                            placeholderTextColor="#AAAAAA"
                            value={friendCode}
                            onChangeText={setFriendCode}
                            autoCapitalize="characters"
                            maxLength={8}
                        />
                    </View>

                    <Pressable
                        style={({ pressed }) => [
                            styles.requestButton,
                            pressed && styles.pressed,
                            loading &&
                            styles.disabledButton,
                        ]}
                        onPress={handleSendRequest}
                        disabled={loading}
                    >
                        <Text style={styles.requestButtonText}>
                            {loading
                                ? "전송"
                                : "추가"}
                        </Text>
                    </Pressable>
                </View>
            </View>

            {/* 받은 친구 요청 */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        받은 친구 요청
                    </Text>

                    {requests.length > 0 && (
                        <View style={styles.requestBadge}>
                            <Text style={styles.requestBadgeText}>
                                {requests.length}
                            </Text>
                        </View>
                    )}
                </View>

                {requests.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyTitle}>
                            새로운 친구 요청이 없어요
                        </Text>

                        <Text style={styles.emptyText}>
                            친구 코드로 새로운 친구를 추가해보세요.
                        </Text>
                    </View>
                ) : (
                    requests.map((request) => (
                        <View
                            key={request.id}
                            style={styles.personCard}
                        >
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {request.requester.nickname
                                        .charAt(0)
                                        .toUpperCase()}
                                </Text>
                            </View>

                            <View style={styles.personInfo}>
                                <Text style={styles.personName}>
                                    {request.requester.nickname}
                                </Text>

                                <Text style={styles.personCode}>
                                    {request.requester.friendCode}
                                </Text>
                            </View>

                            <View style={styles.requestActions}>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.acceptButton,
                                        pressed &&
                                        styles.pressed,
                                    ]}
                                    onPress={() =>
                                        handleAcceptRequest(
                                            request.id
                                        )
                                    }
                                >
                                    <Text style={styles.acceptText}>
                                        수락
                                    </Text>
                                </Pressable>

                                <Pressable
                                    style={({ pressed }) => [
                                        styles.rejectButton,
                                        pressed &&
                                        styles.pressed,
                                    ]}
                                    onPress={() =>
                                        handleDeleteFriend(
                                            request.id,
                                            "친구 요청을 거절하시겠습니까?"
                                        )
                                    }
                                >
                                    <Text style={styles.rejectText}>
                                        거절
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    ))
                )}
            </View>

            {/* 친구 목록 */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        친구 목록
                    </Text>

                    <Text style={styles.sectionCount}>
                        {friends.length}명
                    </Text>
                </View>

                {friends.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyTitle}>
                            아직 친구가 없어요
                        </Text>

                        <Text style={styles.emptyText}>
                            친구 코드를 공유해서 친구를 추가해보세요.
                        </Text>
                    </View>
                ) : (
                    friends.map((friend) => (
                        <View
                            key={friend.friendshipId}
                            style={styles.personCard}
                        >
                            <Pressable
                                style={({ pressed }) => [
                                    styles.personPressable,
                                    pressed && styles.personPressed,
                                ]}
                                onPress={() => {
                                    navigation.navigate(
                                        "FriendProfile",
                                        {
                                            friendId: friend.id,
                                        }
                                    );
                                }}
                            >
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>
                                        {friend.nickname
                                            .charAt(0)
                                            .toUpperCase()}
                                    </Text>
                                </View>

                                <View style={styles.personInfo}>
                                    <Text style={styles.personName}>
                                        {friend.nickname}
                                    </Text>

                                    <Text style={styles.personCode}>
                                        {friend.friendCode}
                                    </Text>
                                </View>
                            </Pressable>

                            <Pressable
                                style={({ pressed }) => [
                                    styles.deleteButton,
                                    pressed &&
                                    styles.pressed,
                                ]}
                                onPress={() =>
                                    handleDeleteFriend(
                                        friend.friendshipId,
                                        `${friend.nickname}님을 친구에서 삭제하시겠습니까?`
                                    )
                                }
                            >
                                <Text style={styles.deleteText}>
                                    삭제
                                </Text>
                            </Pressable>
                        </View>
                    ))
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
        paddingTop: 28,
        paddingBottom: 50,
    },

    /* 헤더 */

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },

    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#222",
    },

    subtitle: {
        marginTop: 5,
        fontSize: 13,
        color: "#888",
    },

    friendCountBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#222",
        justifyContent: "center",
        alignItems: "center",
    },

    friendCountText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
    },

    /* 친구 코드 */

    codeCard: {
        backgroundColor: "#222",
        borderRadius: 20,
        padding: 20,
        marginBottom: 28,
    },

    codeCardTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },

    codeLabel: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },

    codeDescription: {
        marginTop: 5,
        color: "#AAAAAA",
        fontSize: 12,
    },

    codeIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: "#3A3A3A",
        justifyContent: "center",
        alignItems: "center",
    },

    codeIconText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },

    codeRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 20,
    },

    friendCode: {
        color: "#fff",
        fontSize: 27,
        fontWeight: "800",
        letterSpacing: 4,
    },

    copyButton: {
        backgroundColor: "#fff",
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 9,
    },

    copyButtonText: {
        color: "#222",
        fontSize: 13,
        fontWeight: "700",
    },

    /* 공통 섹션 */

    section: {
        marginBottom: 28,
    },

    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },

    sectionTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#222",
    },

    sectionCount: {
        marginLeft: "auto",
        fontSize: 13,
        color: "#999",
    },

    requestBadge: {
        marginLeft: 7,
        minWidth: 20,
        height: 20,
        paddingHorizontal: 6,
        borderRadius: 10,
        backgroundColor: "#222",
        justifyContent: "center",
        alignItems: "center",
    },

    requestBadgeText: {
        color: "#fff",
        fontSize: 11,
        fontWeight: "700",
    },

    /* 친구 추가 */

    searchRow: {
        flexDirection: "row",
        gap: 8,
    },

    inputWrapper: {
        flex: 1,
        height: 50,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: "#EAEAEA",
    },

    searchIcon: {
        fontSize: 17,
        fontWeight: "700",
        color: "#999",
        marginRight: 8,
    },

    input: {
        flex: 1,
        height: "100%",
        fontSize: 14,
        color: "#222",
    },

    requestButton: {
        height: 50,
        paddingHorizontal: 18,
        borderRadius: 12,
        backgroundColor: "#222",
        justifyContent: "center",
        alignItems: "center",
    },

    requestButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "700",
    },

    /* 사람 카드 */

    personCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 12,
        marginBottom: 8,
    },

    personPressable: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
    },

    personPressed: {
        opacity: 0.6,
    },

    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#EEEEEE",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },

    avatarText: {
        fontSize: 17,
        fontWeight: "700",
        color: "#555",
    },

    personInfo: {
        flex: 1,
    },

    personName: {
        fontSize: 15,
        fontWeight: "700",
        color: "#222",
    },

    personCode: {
        marginTop: 4,
        fontSize: 12,
        color: "#999",
        letterSpacing: 0.5,
    },

    /* 요청 버튼 */

    requestActions: {
        flexDirection: "row",
        gap: 5,
    },

    acceptButton: {
        paddingHorizontal: 11,
        paddingVertical: 8,
        borderRadius: 9,
        backgroundColor: "#222",
    },

    acceptText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "700",
    },

    rejectButton: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 9,
        backgroundColor: "#F3F3F3",
    },

    rejectText: {
        color: "#777",
        fontSize: 12,
        fontWeight: "600",
    },

    /* 삭제 */

    deleteButton: {
        paddingHorizontal: 10,
        paddingVertical: 8,
    },

    deleteText: {
        color: "#AAAAAA",
        fontSize: 12,
    },

    /* 비어있을 때 */

    emptyBox: {
        backgroundColor: "#fff",
        borderRadius: 14,
        paddingVertical: 24,
        paddingHorizontal: 20,
        alignItems: "center",
    },

    emptyTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#555",
    },

    emptyText: {
        marginTop: 5,
        fontSize: 12,
        color: "#AAAAAA",
        textAlign: "center",
    },

    /* 공통 */

    pressed: {
        opacity: 0.65,
        transform: [{ scale: 0.97 }],
    },

    disabledButton: {
        opacity: 0.5,
    },
});