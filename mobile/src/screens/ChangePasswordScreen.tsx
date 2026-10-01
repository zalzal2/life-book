import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    Alert,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import { changePassword } from "../api/me";

export default function ChangePasswordScreen() {
    const [currentPassword, setCurrentPassword] =
        useState("");

    const [newPassword, setNewPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const changePasswordMutation = useMutation({
        mutationFn: changePassword,

        onSuccess: () => {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            Alert.alert(
                "변경 완료",
                "비밀번호가 변경되었습니다."
            );
        },

        onError: (error: any) => {
            const message =
                error?.response?.data?.message ??
                "비밀번호 변경에 실패했습니다.";

            Alert.alert(
                "비밀번호 변경 실패",
                message
            );
        },
    });

    const handleChangePassword = () => {
        if (!currentPassword) {
            Alert.alert(
                "입력 확인",
                "현재 비밀번호를 입력해주세요."
            );
            return;
        }

        if (!newPassword) {
            Alert.alert(
                "입력 확인",
                "새 비밀번호를 입력해주세요."
            );
            return;
        }

        if (newPassword.length < 8) {
            Alert.alert(
                "입력 확인",
                "새 비밀번호는 8자 이상 입력해주세요."
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert(
                "입력 확인",
                "새 비밀번호가 일치하지 않습니다."
            );
            return;
        }

        changePasswordMutation.mutate({
            currentPassword,
            newPassword,
        });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                비밀번호 변경
            </Text>

            <Text style={styles.label}>
                현재 비밀번호
            </Text>

            <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="현재 비밀번호를 입력해주세요"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
            />

            <Text style={styles.label}>
                새 비밀번호
            </Text>

            <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="새 비밀번호를 입력해주세요"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
            />

            <Text style={styles.info}>
                비밀번호는 8자 이상 입력해주세요.
            </Text>

            <Text style={styles.label}>
                새 비밀번호 확인
            </Text>

            <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="새 비밀번호를 다시 입력해주세요"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
            />

            <Pressable
                style={[
                    styles.button,
                    changePasswordMutation.isPending &&
                    styles.disabled,
                ]}
                disabled={
                    changePasswordMutation.isPending
                }
                onPress={handleChangePassword}
            >
                <Text style={styles.buttonText}>
                    {changePasswordMutation.isPending
                        ? "변경 중..."
                        : "비밀번호 변경"}
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

    title: {
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 30,
    },

    label: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
        marginTop: 18,
    },

    input: {
        borderWidth: 1,
        borderColor: "#DDD",
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        backgroundColor: "#FFF",
    },

    info: {
        fontSize: 12,
        color: "#999",
        marginTop: 6,
    },

    button: {
        marginTop: 30,
        backgroundColor: "#427519",
        borderRadius: 10,
        padding: 14,
        alignItems: "center",
    },

    disabled: {
        opacity: 0.5,
    },

    buttonText: {
        color: "#FFF",
        fontWeight: "700",
        fontSize: 16,
    },
});
