import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from "react-native";
import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    fetchMe,
    updateMe,
} from "../api/me";

export default function ProfileEditScreen() {
    const queryClient = useQueryClient();

    const meQuery = useQuery({
        queryKey: ["me"],
        queryFn: fetchMe,
    });

    const [nickname, setNickname] = useState("");

    useEffect(() => {
        if (meQuery.data) {
            setNickname(meQuery.data.nickname);
        }
    }, [meQuery.data]);

    const updateMutation = useMutation({
        mutationFn: () =>
            updateMe({
                nickname: nickname.trim(),
            }),

        onSuccess: (data) => {
            queryClient.setQueryData(["me"], data);

            Alert.alert(
                "저장 완료",
                "회원정보가 수정되었습니다."
            );
        },

        onError: () => {
            Alert.alert(
                "오류",
                "회원정보 수정에 실패했습니다."
            );
        },
    });

    if (meQuery.isLoading || !meQuery.data) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
            </View>
        );
    }

    const me = meQuery.data;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                프로필 수정
            </Text>

            {/* 프로필 이미지 */}
            <View style={styles.profileImage}>
                <Text style={styles.profileEmoji}>
                    👤
                </Text>
            </View>

            {/* 닉네임 */}
            <Text style={styles.label}>
                닉네임
            </Text>

            <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
                maxLength={20}
                placeholder="닉네임을 입력해주세요"
            />

            {/* 이메일 */}
            <Text style={styles.label}>
                이메일
            </Text>

            <View style={styles.emailBox}>
                <Text style={styles.email}>
                    {me.email}
                </Text>
            </View>

            <Text style={styles.info}>
                이메일은 변경할 수 없습니다.
            </Text>

            {/* 저장 */}
            <Pressable
                style={[
                    styles.saveButton,
                    (
                        updateMutation.isPending ||
                        nickname.trim().length === 0
                    ) && styles.disabled,
                ]}
                disabled={
                    updateMutation.isPending ||
                    nickname.trim().length === 0
                }
                onPress={() =>
                    updateMutation.mutate()
                }
            >
                <Text style={styles.saveButtonText}>
                    {updateMutation.isPending
                        ? "저장 중..."
                        : "저장하기"}
                </Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#F8F8F8",
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    title: {
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 30,
    },

    profileImage: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: "#F2F2F2",
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
        marginBottom: 30,
    },

    profileEmoji: {
        fontSize: 40,
    },

    label: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
        marginTop: 16,
    },

    input: {
        borderWidth: 1,
        borderColor: "#DDD",
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        backgroundColor: "#FFF",
    },

    emailBox: {
        borderWidth: 1,
        borderColor: "#EEE",
        borderRadius: 10,
        padding: 12,
        backgroundColor: "#F0F0F0",
    },

    email: {
        fontSize: 16,
        color: "#777",
    },

    info: {
        fontSize: 12,
        color: "#999",
        marginTop: 6,
    },

    saveButton: {
        marginTop: 30,
        backgroundColor: "#427519",
        borderRadius: 10,
        padding: 14,
        alignItems: "center",
    },

    disabled: {
        opacity: 0.5,
    },

    saveButtonText: {
        color: "#FFF",
        fontWeight: "700",
        fontSize: 16,
    },
});
