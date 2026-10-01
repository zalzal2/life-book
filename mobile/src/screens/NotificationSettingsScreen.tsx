import React, { useEffect, useState } from "react";
import {
    Alert,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "notificationSettings";

type NotificationSettings = {
    push: boolean;
    recommendation: boolean;
    interested: boolean;
    completed: boolean;
};

const DEFAULT_SETTINGS: NotificationSettings = {
    push: true,
    recommendation: true,
    interested: true,
    completed: true,
};

export default function NotificationSettingsScreen() {
    const [settings, setSettings] =
        useState<NotificationSettings>(DEFAULT_SETTINGS);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const saved = await AsyncStorage.getItem(STORAGE_KEY);

            if (saved) {
                const parsed = JSON.parse(saved);

                setSettings({
                    ...DEFAULT_SETTINGS,
                    ...parsed,
                });
            }
        } catch (error) {
            console.error("알림 설정 불러오기 실패:", error);
        } finally {
            setLoading(false);
        }
    }

    async function saveSettings(
        newSettings: NotificationSettings
    ) {
        try {
            await AsyncStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(newSettings)
            );
        } catch (error) {
            console.error("알림 설정 저장 실패:", error);

            Alert.alert(
                "오류",
                "알림 설정을 저장하지 못했습니다."
            );
        }
    }

    async function updateSetting(
        key: keyof NotificationSettings,
        value: boolean
    ) {
        const newSettings = {
            ...settings,
            [key]: value,
        };

        // 전체 알림을 끄면 모든 알림을 끔
        if (key === "push" && !value) {
            newSettings.recommendation = false;
            newSettings.interested = false;
            newSettings.completed = false;
        }

        // 세부 알림 중 하나라도 켜면 전체 알림도 켬
        if (
            key !== "push" &&
            value &&
            !settings.push
        ) {
            newSettings.push = true;
        }

        setSettings(newSettings);
        await saveSettings(newSettings);
    }

    if (loading) {
        return <View style={styles.container} />;
    }

    return (
        <View style={styles.container}>
            {/* 전체 알림 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    전체 알림
                </Text>

                <View style={styles.settingRow}>
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>
                            푸시 알림
                        </Text>

                        <Text style={styles.description}>
                            모든 알림을 받아요
                        </Text>
                    </View>

                    <Switch
                        value={settings.push}
                        onValueChange={(value) =>
                            updateSetting("push", value)
                        }
                    />
                </View>
            </View>

            {/* 알림 종류 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    알림 종류
                </Text>

                <View style={styles.settingRow}>
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>
                            경험 추천 알림
                        </Text>

                        <Text style={styles.description}>
                            새로운 경험을 추천받아요
                        </Text>
                    </View>

                    <Switch
                        value={settings.recommendation}
                        onValueChange={(value) =>
                            updateSetting(
                                "recommendation",
                                value
                            )
                        }
                        disabled={!settings.push}
                    />
                </View>

                <View style={styles.divider} />

                <View style={styles.settingRow}>
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>
                            관심 경험 알림
                        </Text>

                        <Text style={styles.description}>
                            관심 등록한 경험과 관련된 알림을 받아요
                        </Text>
                    </View>

                    <Switch
                        value={settings.interested}
                        onValueChange={(value) =>
                            updateSetting(
                                "interested",
                                value
                            )
                        }
                        disabled={!settings.push}
                    />
                </View>

                <View style={styles.divider} />

                <View style={styles.settingRow}>
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>
                            완료 알림
                        </Text>

                        <Text style={styles.description}>
                            경험 완료와 관련된 알림을 받아요
                        </Text>
                    </View>

                    <Switch
                        value={settings.completed}
                        onValueChange={(value) =>
                            updateSetting(
                                "completed",
                                value
                            )
                        }
                        disabled={!settings.push}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F7F7F7",
        paddingTop: 8,
    },

    section: {
        backgroundColor: "#FFFFFF",
        marginTop: 12,
        paddingHorizontal: 20,
    },

    sectionTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#888888",
        paddingTop: 18,
        paddingBottom: 8,
    },

    settingRow: {
        minHeight: 72,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    textContainer: {
        flex: 1,
        paddingRight: 16,
    },

    title: {
        fontSize: 16,
        fontWeight: "500",
        color: "#222222",
    },

    description: {
        fontSize: 13,
        color: "#888888",
        marginTop: 5,
        lineHeight: 18,
    },

    divider: {
        height: 1,
        backgroundColor: "#EEEEEE",
    },
});
