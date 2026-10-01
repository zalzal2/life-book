import React, { useState } from "react";

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
} from "react-native";

import { useQuery } from "@tanstack/react-query";

import {
  fetchExperiences,
} from "../api/experiences";

const OFFICIAL_STATUS = [
  { code: "ALL" as const, label: "👾 전체" },
  { code: "INTERESTED" as const, label: "❤️ 관심" },
  { code: "COMPLETED" as const, label: "✅ 완료" },
];

const USER_STATUS = [
  { code: "ALL" as const, label: "👾 전체" },
  { code: "INTERESTED" as const, label: "❤️ 관심" },
  { code: "COMPLETED" as const, label: "✅ 완료" },
  { code: "MY_CREATED" as const, label: "내가 만든 경험" },
];

const CATEGORIES = [
  { code: undefined, label: "👾 전체" },
  { code: "TRAVEL", label: "✈️ 여행" },
  { code: "FOOD", label: "🍜 음식" },
  { code: "CULTURE", label: "🎨 문화" },
  { code: "ADVENTURE", label: "🎯 도전" },
  { code: "HOBBY", label: "🎮 취미" },
  { code: "RELATION", label: "👥 관계" },
  { code: "GROWTH", label: "💼 성장" },
  { code: "LIFE", label: "🌱 일상" },
];

type StatusFilter =
  | "ALL"
  | "INTERESTED"
  | "COMPLETED"
  | "MY_CREATED";

type ExperienceSourceFilter =
  | "OFFICIAL"
  | "USER";

export default function CategoryListScreen({ navigation }: any) {

  // 검색어 
  const [keyword, setKeyword] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [experienceSource, setExperienceSource] =
    useState<ExperienceSourceFilter>("OFFICIAL");

  const [category, setCategory] = useState<string | undefined>(
    undefined
  );

  const [rarity, setRarity] = useState<number | undefined>(
    undefined
  );

  const [difficulty, setDifficulty] = useState<number | undefined>(
    undefined
  );

  const [rarityOpen, setRarityOpen] = useState(false);
  const [difficultyOpen, setDifficultyOpen] = useState(false);

  const statusList =
    experienceSource === "OFFICIAL"
      ? OFFICIAL_STATUS
      : USER_STATUS;

  const resetFilters = () => {
    setKeyword("");
    setStatusFilter("ALL");
    setCategory(undefined);
    setRarity(undefined);
    setDifficulty(undefined);
  };
  const { data: experiences, isLoading } = useQuery({
    queryKey: [
      "experiences",
      experienceSource,
      keyword,
      category,
      statusFilter,
      rarity,
      difficulty,
    ],

    queryFn: () =>
      fetchExperiences({
        keyword: keyword.trim() || undefined,
        category,

        status:
          statusFilter === "INTERESTED" ||
            statusFilter === "COMPLETED"
            ? statusFilter
            : undefined,

        source:
          experienceSource === "OFFICIAL"
            ? "OFFICIAL"
            : "USER",

        rarity,
        difficulty,

        createdByMe:
          statusFilter === "MY_CREATED",
      }),
  });

  return (
    <View style={styles.container}>

      {/* 나만의 경험 만들기 */}
      <Pressable
        style={styles.createExperienceButton}
        onPress={() =>
          navigation.navigate("CreateExperience")
        }
      >
        <Text style={styles.createExperienceButtonText}>
          ＋ 나만의 경험 만들기
        </Text>
      </Pressable>

      {/* 공식 경험 / 사용자 경험 */}
      <View style={styles.sourceRow}>

        <Pressable
          onPress={() => {
            setExperienceSource("OFFICIAL");
            setStatusFilter("ALL");
          }}
          style={[
            styles.sourceTab,
            experienceSource === "OFFICIAL" &&
            styles.sourceTabActive,
          ]}
        >
          <Text
            style={
              experienceSource === "OFFICIAL"
                ? styles.sourceTabTextActive
                : styles.sourceTabText
            }
          >
            공식 경험
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setExperienceSource("USER");
            setStatusFilter("ALL");
          }}
          style={[
            styles.sourceTab,
            experienceSource === "USER" &&
            styles.sourceTabActive,
          ]}
        >
          <Text
            style={
              experienceSource === "USER"
                ? styles.sourceTabTextActive
                : styles.sourceTabText
            }
          >
            사용자 경험
          </Text>
        </Pressable>

      </View>

      {/* 검색창 */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>
          🔍
        </Text>

        <TextInput
          style={styles.searchInput}
          value={keyword}
          onChangeText={setKeyword}
          placeholder="경험을 검색해보세요"
          placeholderTextColor="#999"
          returnKeyType="search"
          autoCorrect={false}
        />
        {keyword.length > 0 && (
          <Pressable
            style={styles.searchClearButton}
            onPress={() => setKeyword("")}
          >
            <Text style={styles.searchClearText}>
              ×
            </Text>
          </Pressable>)}
      </View>

      {/* 상태 필터 */}
      <View style={styles.tabRow}>
        <FlatList
          horizontal
          data={statusList}
          keyExtractor={(item) => item.label}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                setStatusFilter(item.code)
              }
              style={[
                styles.tab,
                statusFilter === item.code &&
                styles.tabActive,
              ]}
            >
              <Text
                style={
                  statusFilter === item.code
                    ? styles.tabTextActive
                    : styles.tabText
                }
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* 카테고리 필터 */}
      <View style={styles.tabRow}>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item.label}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                setCategory(item.code)
              }
              style={[
                styles.tab,
                category === item.code &&
                styles.tabActive,
              ]}
            >
              <Text
                style={
                  category === item.code
                    ? styles.tabTextActive
                    : styles.tabText
                }
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* 필터 상단 */}
      <View style={styles.filterHeader}>
        <Text style={styles.filterTitle}>
          필터
        </Text>

        {(keyword ||
          category ||
          statusFilter !== "ALL" ||
          rarity ||
          difficulty) && (
            <Pressable onPress={resetFilters}>
              <Text style={styles.resetText}>
                초기화
              </Text>
            </Pressable>
          )}
      </View>
      {/* 희귀도 / 난이도 필터 */}
      <View style={styles.dropdownRow}>

        {/* 희귀도 */}
        <View style={styles.dropdownContainer}>

          <Pressable
            style={styles.dropdownButton}
            onPress={() => {
              setRarityOpen(true);
              setDifficultyOpen(false);
            }}
          >
            <Text style={styles.dropdownText}>
              {rarity
                ? `희귀도 ${rarity}`
                : "희귀도 전체"}
            </Text>

            <Text style={styles.dropdownArrow}>
              ▼
            </Text>
          </Pressable>

          <Modal
            visible={rarityOpen}
            transparent
            animationType="fade"
            onRequestClose={() =>
              setRarityOpen(false)
            }
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={() =>
                setRarityOpen(false)
              }
            >
              <View style={styles.dropdownMenu}>

                <Pressable
                  style={styles.dropdownItem}
                  onPress={() => {
                    setRarity(undefined);
                    setRarityOpen(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>
                    희귀도 전체
                  </Text>
                </Pressable>

                {[1, 2, 3, 4, 5].map((value) => (
                  <Pressable
                    key={value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setRarity(value);
                      setRarityOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>
                      희귀도 {value}
                    </Text>
                  </Pressable>
                ))}

              </View>
            </Pressable>
          </Modal>

        </View>

        {/* 난이도 */}
        <View style={styles.dropdownContainer}>

          <Pressable
            style={styles.dropdownButton}
            onPress={() => {
              setDifficultyOpen(true);
              setRarityOpen(false);
            }}
          >
            <Text style={styles.dropdownText}>
              {difficulty
                ? `난이도 ${difficulty}`
                : "난이도 전체"}
            </Text>

            <Text style={styles.dropdownArrow}>
              ▼
            </Text>
          </Pressable>

          <Modal
            visible={difficultyOpen}
            transparent
            animationType="fade"
            onRequestClose={() =>
              setDifficultyOpen(false)
            }
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={() =>
                setDifficultyOpen(false)
              }
            >
              <View style={styles.dropdownMenu}>

                <Pressable
                  style={styles.dropdownItem}
                  onPress={() => {
                    setDifficulty(undefined);
                    setDifficultyOpen(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>
                    난이도 전체
                  </Text>
                </Pressable>

                {[1, 2, 3, 4, 5].map((value) => (
                  <Pressable
                    key={value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setDifficulty(value);
                      setDifficultyOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>
                      난이도 {value}
                    </Text>
                  </Pressable>
                ))}

              </View>
            </Pressable>
          </Modal>

        </View>

      </View>
      <View style={styles.selectedFilterRow}>

        {category && (
          <Pressable
            style={styles.filterChip}
            onPress={() => setCategory(undefined)}
          >
            <Text style={styles.filterChipText}>
              {CATEGORIES.find(
                (item) => item.code === category
              )?.label} ×
            </Text>
          </Pressable>
        )}

        {statusFilter !== "ALL" && (
          <Pressable
            style={styles.filterChip}
            onPress={() => setStatusFilter("ALL")}
          >
            <Text style={styles.filterChipText}>
              {statusFilter === "INTERESTED"
                ? "❤️ 관심"
                : statusFilter === "COMPLETED"
                  ? "✅ 완료"
                  : "내가 만든 경험"} ×
            </Text>
          </Pressable>
        )}

        {rarity && (
          <Pressable
            style={styles.filterChip}
            onPress={() => setRarity(undefined)}
          >
            <Text style={styles.filterChipText}>
              희귀도 {rarity} ×
            </Text>
          </Pressable>
        )}

        {difficulty && (
          <Pressable
            style={styles.filterChip}
            onPress={() => setDifficulty(undefined)}
          >
            <Text style={styles.filterChipText}>
              난이도 {difficulty} ×
            </Text>
          </Pressable>
        )}

      </View>
      {/* 경험 목록 */}
      <FlatList
        data={experiences}
        keyExtractor={(item) => item.id}
        refreshing={isLoading}
        renderItem={({ item }) => (

          <Pressable
            style={styles.row}
            onPress={() =>
              navigation.navigate(
                "ExperienceDetail",
                {
                  experienceId: item.id,
                }
              )
            }
          >

            <View style={styles.rowHeader}>

              <Text style={styles.rowName}>
                {item.name}

                {/* 사용자 경험이면 작성자 표시 */}
                {experienceSource === "USER" && (
                  <Text style={styles.createdBy}>
                    {" "}by {item.createdBy?.nickname ?? "탈퇴한 회원"}
                  </Text>
                )}
              </Text>

              {/* 관심 */}
              {item.myExperience?.status ===
                "INTERESTED" && (
                  <Text style={styles.statusText}>
                    ❤️
                  </Text>
                )}

              {/* 완료 */}
              {item.myExperience?.status ===
                "COMPLETED" && (
                  <Text style={styles.statusText}>
                    ✅
                  </Text>
                )}

            </View>

            <Text style={styles.rowMeta}>
              희귀도{" "}
              {"◆".repeat(item.rarity)}
              {"◇".repeat(5 - item.rarity)}
              {" · "}
              난이도 {item.difficulty}
            </Text>

            {/* 완료 기록 */}
            {item.myExperience?.status ===
              "COMPLETED" && (
                <View style={styles.record}>

                  {item.myExperience.rating && (
                    <Text style={styles.recordText}>
                      ⭐ {item.myExperience.rating}점
                    </Text>
                  )}

                  {item.myExperience.memo && (
                    <Text
                      style={styles.memo}
                      numberOfLines={1}
                    >
                      "{item.myExperience.memo}"
                    </Text>
                  )}

                </View>
              )}

          </Pressable>
        )}

        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                해당하는 경험이 없습니다.
              </Text>
            </View>
          ) : null
        }
      />

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
  },

  /* 공식 / 사용자 경험 */

  sourceRow: {
    flexDirection: "row",
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },

  sourceTab: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  sourceTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#427519",
  },

  sourceTabText: {
    fontSize: 15,
    color: "#999",
  },

  sourceTabTextActive: {
    fontSize: 15,
    fontWeight: "600",
    color: "#427519",
  },
  /* 검색 */
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    backgroundColor: "#FFF",
  },

  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    paddingVertical: 0,
  },

  searchClearButton: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },

  searchClearText: {
    fontSize: 22,
    color: "#999",
    lineHeight: 24,
  },

  /* 상태 / 카테고리 */

  tabRow: {
    height: 58,
    flexGrow: 0,
    paddingHorizontal: 8,
  },

  tabContent: {
    paddingHorizontal: 8,
    alignItems: "center",
  },

  tab: {
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F0F0F0",
    marginHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
  },

  tabActive: {
    backgroundColor: "#427519",
  },

  tabText: {
    color: "#666",
    fontSize: 13,
  },

  tabTextActive: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },

  /* 경험 목록 */

  row: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },

  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  rowName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },

  createdBy: {
    fontSize: 13,
    fontWeight: "400",
    color: "#888",
  },

  statusText: {
    fontSize: 16,
    marginLeft: 8,
  },

  rowMeta: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },

  record: {
    marginTop: 8,
    gap: 2,
  },

  recordText: {
    fontSize: 12,
    color: "#666",
  },

  memo: {
    fontSize: 12,
    color: "#888",
  },

  empty: {
    alignItems: "center",
    paddingTop: 50,
  },

  emptyText: {
    color: "#999",
    fontSize: 14,
  },

  /* 희귀도 / 난이도 */

  dropdownRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  dropdownContainer: {
    flex: 1,
  },

  dropdownButton: {
    height: 42,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
  },

  dropdownText: {
    fontSize: 13,
    color: "#555",
  },

  dropdownArrow: {
    fontSize: 10,
    color: "#999",
  },

  /* Modal */

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },

  dropdownMenu: {
    width: "75%",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingVertical: 8,
  },

  dropdownItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },

  dropdownItemText: {
    fontSize: 14,
    color: "#333",
  },

  /* 경험 만들기 */

  createExperienceButton: {
    marginHorizontal: 16,
    marginVertical: 8,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#427519",
    justifyContent: "center",
    alignItems: "center",
  },

  createExperienceButtonText: {
    color: "#427519",
    fontSize: 14,
    fontWeight: "600",
  },

  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
  },

  filterTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },

  resetText: {
    fontSize: 13,
    color: "#427519",
  },

  selectedFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 6,
  },

  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "#EAF2E4",
  },

  filterChipText: {
    fontSize: 12,
    color: "#427519",
  },
});