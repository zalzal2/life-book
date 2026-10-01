import React from "react";
import {
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function AppInfoScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <Text style={styles.logo}>🏆</Text>

                <Text style={styles.appName}>
                    MY LIFE
                </Text>

                <Text style={styles.description}>
                    나의 모든 경험을 기록하고{"\n"}
                    새로운 경험을 발견해보세요.
                </Text>
            </View>

            <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>
                        앱 버전
                    </Text>

                    <Text style={styles.value}>
                        1.0.0
                    </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                    <Text style={styles.label}>
                        개발자
                    </Text>

                    <Text style={styles.value}>
                        MY LIFE
                    </Text>
                </View>
            </View>

            <Text style={styles.copyright}>
                © 2026 MY LIFE
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F7F7F7",
        alignItems: "center",
        paddingTop: 70,
    },

    logoContainer: {
        alignItems: "center",
    },

    logo: {
        fontSize: 56,
        marginBottom: 12,
    },

    appName: {
        fontSize: 24,
        fontWeight: "700",
        color: "#222222",
        letterSpacing: 1,
    },

    description: {
        marginTop: 14,
        fontSize: 14,
        lineHeight: 22,
        color: "#777777",
        textAlign: "center",
    },

    infoSection: {
        width: "100%",
        backgroundColor: "#FFFFFF",
        marginTop: 50,
        paddingHorizontal: 20,
    },

    infoRow: {
        height: 64,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    label: {
        fontSize: 15,
        color: "#555555",
    },

    value: {
        fontSize: 15,
        color: "#222222",
    },

    divider: {
        height: 1,
        backgroundColor: "#EEEEEE",
    },

    copyright: {
        position: "absolute",
        bottom: 30,
        fontSize: 12,
        color: "#AAAAAA",
    },
});