import React from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
} from "react-native";

type ShareExperienceCardProps = {
    experience: any;
    photoUrl?: string;
    rating?: number | null;
    memo?: string | null;
    completedAt?: string | null;
};

export default function ShareExperienceCard({
    experience,
    photoUrl,
    rating,
    memo,
    completedAt,
}: ShareExperienceCardProps) {
    const categoryEmoji =
        experience?.category?.emoji ?? "◆";

    const categoryName =
        experience?.category?.name ?? "경험";

    const displayRating = rating ?? 0;

    return (
        <View style={styles.card}>

            {/* 카드 테두리 장식 */}
            <View style={styles.innerBorder}>

                {/* 상단 */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.logo}>
                            🏆 MY LIFE
                        </Text>

                        <Text style={styles.logoSub}>
                            나의 경험 도감
                        </Text>
                    </View>

                    <View style={styles.completeBadge}>
                        <Text style={styles.completeBadgeText}>
                            ✓ COMPLETE
                        </Text>
                    </View>
                </View>

                {/* 사진 */}
                {photoUrl ? (
                    <View style={styles.photoFrame}>
                        <Image
                            source={{ uri: photoUrl }}
                            style={styles.photo}
                            resizeMode="cover"
                        />
                    </View>
                ) : (
                    <View style={styles.noPhotoFrame}>
                        <Text style={styles.noPhotoIcon}>
                            {categoryEmoji}
                        </Text>

                        <Text style={styles.noPhotoText}>
                            EXPERIENCE
                        </Text>
                    </View>
                )}

                {/* 카테고리 */}
                <View style={styles.categoryRow}>
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>
                            {categoryEmoji} {categoryName}
                        </Text>
                    </View>
                </View>

                {/* 경험 이름 */}
                <Text
                    style={styles.experienceName}
                    numberOfLines={2}
                >
                    {experience?.name}
                </Text>

                {/* 설명 */}
                {experience?.description ? (
                    <Text
                        style={styles.description}
                        numberOfLines={2}
                    >
                        {experience.description}
                    </Text>
                ) : null}

                {/* 정보 영역 */}
                <View style={styles.infoRow}>

                    {/* 별점 */}
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>
                            SCORE
                        </Text>

                        <Text style={styles.scoreText}>
                            {"★".repeat(displayRating)}
                            <Text style={styles.emptyStar}>
                                {"☆".repeat(5 - displayRating)}
                            </Text>
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    {/* 난이도 */}
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>
                            난이도
                        </Text>

                        <Text style={styles.infoValue}>
                            {experience?.difficulty ?? "-"}
                            <Text style={styles.smallText}>
                                {" "} / 5
                            </Text>
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    {/* 희귀도 */}
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>
                            희귀도
                        </Text>

                        <Text style={styles.infoValue}>
                            {experience?.rarity ?? "-"}
                            <Text style={styles.smallText}>
                                {" "} / 5
                            </Text>
                        </Text>
                    </View>
                </View>

                {/* 메모 */}
                {memo ? (
                    <View style={styles.memoBox}>
                        <Text style={styles.memoQuote}>
                            “
                        </Text>

                        <Text
                            style={styles.memoText}
                            numberOfLines={3}
                        >
                            {memo}
                        </Text>

                        <Text style={styles.memoQuoteEnd}>
                            ”
                        </Text>
                    </View>
                ) : (
                    <View style={styles.memoBox}>
                        <Text style={styles.emptyMemo}>
                            GOOD MEMORY!
                        </Text>
                    </View>
                )}

                {/* 완료 날짜 */}
                {completedAt ? (
                    <Text style={styles.completedDate}>
                        COMPLETED ·{" "}
                        {new Date(completedAt).toLocaleDateString(
                            "ko-KR"
                        )}
                    </Text>
                ) : null}

                {/* 하단 */}
                <View style={styles.footer}>
                    <View style={styles.footerLine} />

                    <Text style={styles.footerText}>
                        - MY LIFE -
                    </Text>

                    <Text style={styles.footerSub}>
                        Small Experiences · Big Memories
                    </Text>
                </View>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    /*
     * 전체 카드
     *
     * 나중에 view-shot으로
     * 1080 x 1350 비율로 캡처할 예정
     */
    card: {
        width: 360,
        backgroundColor: "#173B35",
        padding: 6,
        borderRadius: 8,
    },

    innerBorder: {
        backgroundColor: "#FFFDF4",
        borderWidth: 3,
        borderColor: "#244E45",
        borderRadius: 5,
        padding: 18,
    },

    /* 상단 */

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },

    logo: {
        fontSize: 25,
        fontWeight: "900",
        color: "#173B35",
        letterSpacing: 1,
    },

    logoSub: {
        fontSize: 12,
        fontWeight: "700",
        color: "#52736B",
        marginTop: 2,
    },

    completeBadge: {
        backgroundColor: "#3F8A5B",
        borderWidth: 2,
        borderColor: "#214C37",
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 5,
    },

    completeBadgeText: {
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "900",
        letterSpacing: 0.5,
    },

    /* 사진 */

    photoFrame: {
        width: "100%",
        height: 140,
        marginTop: 14,
        borderWidth: 4,
        borderColor: "#173B35",
        backgroundColor: "#DDE8DE",
        overflow: "hidden",
    },

    photo: {
        width: "100%",
        height: "100%",
    },

    noPhotoFrame: {
        width: "100%",
        height: 140,
        marginTop: 14,
        borderWidth: 4,
        borderColor: "#173B35",
        backgroundColor: "#DDE8DE",
        justifyContent: "center",
        alignItems: "center",
    },

    noPhotoIcon: {
        fontSize: 48,
    },

    noPhotoText: {
        marginTop: 8,
        fontSize: 12,
        fontWeight: "900",
        color: "#52736B",
        letterSpacing: 2,
    },

    /* 카테고리 */

    categoryRow: {
        marginTop: 12,
        flexDirection: "row",
    },

    categoryBadge: {
        backgroundColor: "#DDEEDB",
        borderWidth: 1,
        borderColor: "#8CB48A",
        borderRadius: 5,
        paddingHorizontal: 9,
        paddingVertical: 4,
    },

    categoryText: {
        fontSize: 11,
        fontWeight: "800",
        color: "#315B3A",
    },

    /* 이름 */

    experienceName: {
        fontSize: 23,
        lineHeight: 29,
        fontWeight: "900",
        color: "#172D2A",
        marginTop: 9,
    },

    description: {
        fontSize: 11,
        lineHeight: 17,
        color: "#5B6D68",
        marginTop: 5,
    },

    /* 정보 */

    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 13,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#D5DDD2",
    },

    infoItem: {
        flex: 1,
        alignItems: "center",
    },

    infoLabel: {
        fontSize: 8,
        fontWeight: "800",
        color: "#82918B",
        letterSpacing: 0.5,
        marginBottom: 3,
    },

    scoreText: {
        fontSize: 13,
        color: "#D89B24",
        letterSpacing: 0,
    },

    emptyStar: {
        color: "#C9CEC7",
    },

    infoValue: {
        fontSize: 15,
        fontWeight: "900",
        color: "#28483F",
    },

    smallText: {
        fontSize: 9,
        fontWeight: "600",
        color: "#8B9993",
    },

    divider: {
        width: 1,
        height: 28,
        backgroundColor: "#D5DDD2",
    },

    /* 메모 */

    memoBox: {
        minHeight: 55,
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: "#F1F5E9",
        borderWidth: 1,
        borderColor: "#A9C1A3",
        justifyContent: "center",
        position: "relative",
    },

    memoQuote: {
        position: "absolute",
        left: 5,
        top: 1,
        fontSize: 25,
        fontWeight: "900",
        color: "#75A083",
    },

    memoQuoteEnd: {
        position: "absolute",
        right: 5,
        bottom: -5,
        fontSize: 25,
        fontWeight: "900",
        color: "#75A083",
    },

    memoText: {
        fontSize: 11,
        lineHeight: 17,
        fontWeight: "600",
        color: "#415D54",
        paddingHorizontal: 8,
        textAlign: "center",
    },

    emptyMemo: {
        textAlign: "center",
        fontSize: 11,
        fontWeight: "900",
        color: "#72917E",
        letterSpacing: 2,
    },

    /* 완료 날짜 */

    completedDate: {
        fontSize: 8,
        fontWeight: "700",
        color: "#8C9994",
        textAlign: "right",
        marginTop: 7,
    },

    /* 하단 */

    footer: {
        marginTop: "auto",
        alignItems: "center",
    },

    footerLine: {
        width: "100%",
        height: 1,
        backgroundColor: "#B9C9B7",
        marginBottom: 7,
    },

    footerText: {
        fontSize: 13,
        fontWeight: "900",
        color: "#244E45",
        letterSpacing: 2,
    },

    footerSub: {
        fontSize: 7,
        fontWeight: "600",
        color: "#91A099",
        marginTop: 3,
        letterSpacing: 0.5,
    },
});