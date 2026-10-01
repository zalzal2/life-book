import React, { useState } from "react";

import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Pressable,
    ScrollView,
    Switch,
    ActivityIndicator,
    Alert,
    Modal,
} from "react-native";

import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import {
    createExperience,
    fetchCategories,
    checkDuplicateExperiences,
} from "../api/experiences";

export default function CreateExperienceScreen({
    navigation,
}: any) {
    const queryClient = useQueryClient();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const [categoryId, setCategoryId] = useState<number | null>(
        null
    );

    const [difficulty, setDifficulty] = useState(3);
    const [rarity, setRarity] = useState(3);

    const [estimatedTime, setEstimatedTime] = useState("");
    const [cost, setCost] = useState("");
    const [companion, setCompanion] = useState("");
    const [scope, setScope] = useState("");

    const [isPublic, setIsPublic] = useState(true);

    const [categoryOpen, setCategoryOpen] = useState(false);

    const categoriesQuery = useQuery({
        queryKey: ["categories"],
        queryFn: fetchCategories,
    });

    const [selectOpen, setSelectOpen] = useState<
        "estimatedTime" | "cost" | "companion" | "scope" | null
    >(null);

    const createMutation = useMutation({
        mutationFn: createExperience,

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["experiences"],
            });

            Alert.alert(
                "경험 생성 완료",
                "새로운 경험이 추가되었습니다.",
                [
                    {
                        text: "확인",
                        onPress: () => {
                            navigation.replace("CategoryList");
                        },
                    },
                ]
            );
        },

        onError: (error: any) => {
            console.error(error);

            Alert.alert(
                "생성 실패",
                error?.response?.data?.message ??
                "경험을 생성하지 못했습니다."
            );
        },
    });

    const selectedCategory = categoriesQuery.data?.find(
        (category) => category.id === categoryId
    );

    const timeOptions = [
        "1시간",
        "2~4시간",
        "반나절~1일",
        "1일",
        "1~3일",
        "2~5일",
        "3~7일",
        "1주~1개월",
        "1개월 이상",
        "6개월 이상"
    ];

    const costOptions = [
        "0원",
        "1만원~",
        "2만원~",
        "5만원~",
        "10만원~",
        "15만원~",
        "30만원~",
        "50만원~",
        "100만원~",
        "150만원~",
    ];

    const companionOptions = [
        "혼자",
        "친구",
        "가족",
        "연인",
        "동료",
        "혼자/친구",
        "혼자/가족",
        "혼자/동료",
        "친구/가족",
    ];

    const scopeOptions = [
        "국내",
        "해외",
        "국내/해외",
    ];
    /**
     * 실제 경험 생성
     *
     * 중복 검사에서
     * "그래도 등록"을 눌렀을 때도 이 함수를 사용한다.
     */
    const createExperienceRequest = () => {
        if (!categoryId) {
            Alert.alert(
                "입력 필요",
                "카테고리를 선택해주세요."
            );
            return;
        }

        createMutation.mutate({
            categoryId,

            name: name.trim(),

            description:
                description.trim() || undefined,

            difficulty,
            rarity,

            estimatedTime:
                estimatedTime.trim() || undefined,

            cost:
                cost.trim() || undefined,

            companion:
                companion.trim() || undefined,

            scope:
                scope.trim() || undefined,

            isPublic,
        });
    };

    /**
     * 생성 버튼
     *
     * 1. 기본 입력값 검사
     * 2. 비슷한 경험 검사
     * 3. 비슷한 경험이 있으면 사용자에게 경고
     * 4. 그래도 등록하면 실제 생성
     */
    const handleCreate = async () => {
        const trimmedName = name.trim();

        if (!trimmedName) {
            Alert.alert(
                "입력 필요",
                "경험 이름을 입력해주세요."
            );
            return;
        }

        if (!categoryId) {
            Alert.alert(
                "입력 필요",
                "카테고리를 선택해주세요."
            );
            return;
        }

        try {
            const result =
                await checkDuplicateExperiences(
                    trimmedName
                );

            const duplicates =
                result?.duplicates ?? [];

            if (duplicates.length > 0) {
                const duplicateText = duplicates
                    .map((item: any) => {
                        const rarityText =
                            "◆".repeat(item.rarity) +
                            "◇".repeat(5 - item.rarity);

                        return (
                            `👻 ${item.name}\n` +
                            `희귀도 ${rarityText} · 난이도 ${item.difficulty}`
                        );
                    })
                    .join("\n\n");

                Alert.alert(
                    "비슷한 경험이 있어요",
                    `${duplicateText}\n\n그래도 새로운 경험으로 등록하시겠어요?`,
                    [
                        {
                            text: "취소",
                            style: "cancel",
                        },
                        {
                            text: "그래도 등록",
                            onPress:
                                createExperienceRequest,
                        },
                    ]
                );

                return;
            }

            createExperienceRequest();
        } catch (error: any) {
            console.error(
                "duplicate check error:",
                error
            );

            /**
             * 중복 검사 API가 실패했다고 해서
             * 경험 생성 자체를 막지는 않는다.
             *
             * 필요하면 여기서 생성 중단하도록
             * 변경할 수도 있다.
             */
            createExperienceRequest();
        }
    };

    if (categoriesQuery.isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
        >
            {/* 경험 이름 */}
            <View style={styles.section}>
                <Text style={styles.label}>
                    경험 이름
                </Text>

                <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="예: 일본에서 온천 가기"
                    maxLength={100}
                />
            </View>

            {/* 설명 */}
            <View style={styles.section}>
                <Text style={styles.label}>
                    설명
                </Text>

                <TextInput
                    style={[
                        styles.input,
                        styles.textarea,
                    ]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="어떤 경험인지 설명해주세요."
                    multiline
                    textAlignVertical="top"
                    maxLength={1000}
                />
            </View>

            {/* 카테고리 */}
            <View style={styles.section}>
                <Text style={styles.label}>
                    카테고리
                </Text>

                <Pressable
                    style={styles.selectButton}
                    onPress={() => setCategoryOpen(true)}
                >
                    <Text
                        style={
                            selectedCategory
                                ? styles.selectText
                                : styles.placeholderText
                        }
                    >
                        {selectedCategory
                            ? `${selectedCategory.emoji ?? ""} ${selectedCategory.name}`
                            : "카테고리를 선택해주세요"}
                    </Text>

                    <Text style={styles.arrow}>
                        ▼
                    </Text>
                </Pressable>
            </View>

            {/* 난이도 */}
            <View style={styles.section}>
                <Text style={styles.label}>
                    난이도
                </Text>

                <View style={styles.levelRow}>
                    {[1, 2, 3, 4, 5].map((value) => (
                        <Pressable
                            key={value}
                            style={[
                                styles.levelButton,
                                difficulty === value &&
                                styles.levelButtonActive,
                            ]}
                            onPress={() =>
                                setDifficulty(value)
                            }
                        >
                            <Text
                                style={[
                                    styles.levelText,
                                    difficulty === value &&
                                    styles.levelTextActive,
                                ]}
                            >
                                {value}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            {/* 희귀도 */}
            <View style={styles.section}>
                <Text style={styles.label}>
                    희귀도
                </Text>

                <View style={styles.levelRow}>
                    {[1, 2, 3, 4, 5].map((value) => (
                        <Pressable
                            key={value}
                            style={[
                                styles.levelButton,
                                rarity === value &&
                                styles.levelButtonActive,
                            ]}
                            onPress={() =>
                                setRarity(value)
                            }
                        >
                            <Text
                                style={[
                                    styles.rarityText,
                                    rarity === value &&
                                    styles.levelTextActive,
                                ]}
                            >
                                {"◆".repeat(value)}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            {/* 예상 소요시간 */}
            <View style={styles.section}>
                <Text style={styles.label}>
                    예상 소요시간
                </Text>

                <Pressable
                    style={styles.selectButton}
                    onPress={() => setSelectOpen("estimatedTime")}
                >
                    <Text
                        style={
                            estimatedTime
                                ? styles.selectText
                                : styles.placeholderText
                        }
                    >
                        {estimatedTime || "예상 소요시간을 선택해주세요"}
                    </Text>

                    <Text style={styles.arrow}>
                        ▼
                    </Text>
                </Pressable>
            </View>

            {/* 비용 */}
            <View style={styles.section}>
                <Text style={styles.label}>
                    예상 비용
                </Text>

                <Pressable
                    style={styles.selectButton}
                    onPress={() => setSelectOpen("cost")}
                >
                    <Text
                        style={
                            cost
                                ? styles.selectText
                                : styles.placeholderText
                        }
                    >
                        {cost || "예상 비용을 선택해주세요"}
                    </Text>

                    <Text style={styles.arrow}>
                        ▼
                    </Text>
                </Pressable>
            </View>

            {/* 함께할 사람 */}
            <View style={styles.section}>
                <Text style={styles.label}>
                    누구와?
                </Text>

                <Pressable
                    style={styles.selectButton}
                    onPress={() => setSelectOpen("companion")}
                >
                    <Text
                        style={
                            companion
                                ? styles.selectText
                                : styles.placeholderText
                        }
                    >
                        {companion || "누구와 함께할지 선택해주세요"}
                    </Text>

                    <Text style={styles.arrow}>
                        ▼
                    </Text>
                </Pressable>
            </View>

            {/* 국내 / 해외 */}
            <View style={styles.section}>
                <Text style={styles.label}>
                    범위
                </Text>

                <Pressable
                    style={styles.selectButton}
                    onPress={() => setSelectOpen("scope")}
                >
                    <Text
                        style={
                            scope
                                ? styles.selectText
                                : styles.placeholderText
                        }
                    >
                        {scope || "국내 / 해외를 선택해주세요"}
                    </Text>

                    <Text style={styles.arrow}>
                        ▼
                    </Text>
                </Pressable>
            </View>

            {/* 공개 여부 */}
            <View style={styles.publicRow}>
                <View>
                    <Text style={styles.label}>
                        공개 여부
                    </Text>

                    <Text style={styles.publicDescription}>
                        {isPublic
                            ? "다른 사용자도 이 경험을 볼 수 있습니다."
                            : "나만 이 경험을 볼 수 있습니다."}
                    </Text>
                </View>

                <Switch
                    value={isPublic}
                    onValueChange={setIsPublic}
                />
            </View>

            {/* 생성 버튼 */}
            <Pressable
                style={[
                    styles.createButton,
                    createMutation.isPending &&
                    styles.buttonDisabled,
                ]}
                disabled={createMutation.isPending}
                onPress={handleCreate}
            >
                {createMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.createButtonText}>
                        경험 만들기
                    </Text>
                )}
            </Pressable>

            {/* 카테고리 선택 Modal */}
            <Modal
                visible={categoryOpen}
                transparent
                animationType="fade"
                onRequestClose={() =>
                    setCategoryOpen(false)
                }
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() =>
                        setCategoryOpen(false)
                    }
                >
                    <View style={styles.categoryModal}>
                        <Text style={styles.modalTitle}>
                            카테고리 선택
                        </Text>

                        {categoriesQuery.data?.map(
                            (category) => (
                                <Pressable
                                    key={category.id}
                                    style={styles.categoryItem}
                                    onPress={() => {
                                        setCategoryId(
                                            category.id
                                        );
                                        setCategoryOpen(false);
                                    }}
                                >
                                    <Text
                                        style={
                                            styles.categoryItemText
                                        }
                                    >
                                        {category.emoji ?? ""}{" "}
                                        {category.name}
                                    </Text>
                                </Pressable>
                            )
                        )}
                    </View>
                </Pressable>
            </Modal>
            {/* 선택 Modal */}
            <Modal
                visible={selectOpen !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectOpen(null)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setSelectOpen(null)}
                >
                    <View style={styles.categoryModal}>
                        <Text style={styles.modalTitle}>
                            {selectOpen === "estimatedTime" &&
                                "예상 소요시간 선택"}

                            {selectOpen === "cost" &&
                                "예상 비용 선택"}

                            {selectOpen === "companion" &&
                                "누구와 함께할지 선택"}

                            {selectOpen === "scope" &&
                                "범위 선택"}
                        </Text>

                        {(selectOpen === "estimatedTime"
                            ? timeOptions
                            : selectOpen === "cost"
                                ? costOptions
                                : selectOpen === "companion"
                                    ? companionOptions
                                    : scopeOptions
                        ).map((option) => (
                            <Pressable
                                key={option}
                                style={styles.categoryItem}
                                onPress={() => {
                                    if (
                                        selectOpen ===
                                        "estimatedTime"
                                    ) {
                                        setEstimatedTime(option);
                                    }

                                    if (
                                        selectOpen ===
                                        "cost"
                                    ) {
                                        setCost(option);
                                    }

                                    if (
                                        selectOpen ===
                                        "companion"
                                    ) {
                                        setCompanion(option);
                                    }

                                    if (
                                        selectOpen ===
                                        "scope"
                                    ) {
                                        setScope(option);
                                    }

                                    setSelectOpen(null);
                                }}
                            >
                                <Text
                                    style={
                                        styles.categoryItemText
                                    }
                                >
                                    {option}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </Pressable>
            </Modal>
        </ScrollView>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },

    content: {
        padding: 20,
        paddingBottom: 40,
        gap: 20,
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    section: {
        gap: 8,
    },

    label: {
        fontSize: 15,
        fontWeight: "600",
        color: "#333",
    },

    input: {
        height: 46,
        borderWidth: 1,
        borderColor: "#DDD",
        borderRadius: 10,
        paddingHorizontal: 14,
        fontSize: 14,
        backgroundColor: "#FFF",
    },

    textarea: {
        height: 110,
        paddingTop: 12,
    },

    selectButton: {
        height: 46,
        borderWidth: 1,
        borderColor: "#DDD",
        borderRadius: 10,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    selectText: {
        fontSize: 14,
        color: "#333",
    },

    placeholderText: {
        fontSize: 14,
        color: "#999",
    },

    arrow: {
        fontSize: 11,
        color: "#999",
    },

    levelRow: {
        flexDirection: "row",
        gap: 8,
    },

    levelButton: {
        flex: 1,
        height: 42,
        borderRadius: 10,
        backgroundColor: "#F0F0F0",
        justifyContent: "center",
        alignItems: "center",
    },

    levelButtonActive: {
        backgroundColor: "#9c5098",
    },

    levelText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#666",
    },

    levelTextActive: {
        color: "#fff",
    },

    rarityText: {
        fontSize: 14,
        color: "#666",
        letterSpacing: 1,
    },

    publicRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    publicDescription: {
        marginTop: 4,
        fontSize: 12,
        color: "#999",
    },

    createButton: {
        height: 50,
        borderRadius: 12,
        backgroundColor: "#427519",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 4,
    },

    buttonDisabled: {
        opacity: 0.6,
    },

    createButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        justifyContent: "center",
        alignItems: "center",
    },

    categoryModal: {
        width: "82%",
        backgroundColor: "#fff",
        borderRadius: 16,
        paddingVertical: 12,
        overflow: "hidden",
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        paddingHorizontal: 20,
        paddingVertical: 14,
    },

    categoryItem: {
        paddingHorizontal: 20,
        paddingVertical: 14,
    },

    categoryItemText: {
        fontSize: 15,
        color: "#333",
    },
});