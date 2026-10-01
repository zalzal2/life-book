import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  ScrollView,
} from "react-native";

import Share from "react-native-share";
import { captureRef } from "react-native-view-shot";
import * as ImagePicker from "expo-image-picker";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import {
  upsertMyExperience,
  cancelMyInterest,
  reportExperience,
  Experience,
} from "../api/experiences";
import { uploadImages } from "../api/uploads";
import ShareExperienceCard from "../components/ShareExperienceCard";

export default function ExperienceDetailScreen({ route }: any) {
  const { experienceId } = route.params;

  const [memo, setMemo] = useState("");
  const [rating, setRating] = useState(0);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const shareCardRef = React.useRef<View>(null);

  // 새로 선택한 사진
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const queryClient = useQueryClient();

  const { data: experience, isLoading } = useQuery({
    queryKey: ["experience", experienceId],
    queryFn: async () =>
      (await apiClient.get<Experience>(`/experiences/${experienceId}`)).data,
  });

  // 내가 이 경험을 어떻게 기록했는지
  const myExperience = experience?.myExperience;

  const isInterested =
    myExperience?.status === "INTERESTED";

  const isCompleted =
    myExperience?.status === "COMPLETED";

  // 기존에 저장된 별점/메모를 화면에 반영
  useEffect(() => {
    if (myExperience) {
      setRating(myExperience.rating ?? 0);
      setMemo(myExperience.memo ?? "");
    }
  }, [myExperience]);

  // 사진 선택
  const pickImages = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "사진 접근 권한 필요",
          "사진을 선택하려면 갤러리 접근 권한이 필요합니다."
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: true,
          selectionLimit: 5,
          quality: 0.8,
        });

      if (result.canceled) {
        return;
      }

      const newImages = result.assets.map(
        (asset) => asset.uri
      );

      setSelectedImages((prev) => {
        const combined = [...prev, ...newImages];

        // 같은 사진 중복 선택 방지
        return [...new Set(combined)].slice(0, 5);
      });
    } catch (error) {
      console.error("사진 선택 실패:", error);

      Alert.alert(
        "사진 선택 실패",
        "사진을 선택하지 못했습니다."
      );
    }
  };

  // 선택한 사진 삭제
  const removeImage = (uri: string) => {
    setSelectedImages((prev) =>
      prev.filter((image) => image !== uri)
    );
  };

  // 관심 등록
  const interestMutation = useMutation({
    mutationFn: () =>
      upsertMyExperience({
        experienceId: experienceId,
        status: "INTERESTED",
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["experience", experienceId],
      });

      queryClient.invalidateQueries({
        queryKey: ["experiences"],
      });

      queryClient.invalidateQueries({
        queryKey: ["myExperiences"],
      });
    },
  });

  // 관심 취소
  const cancelInterestMutation = useMutation({
    mutationFn: () => cancelMyInterest(experienceId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["experience", experienceId],
      });

      queryClient.invalidateQueries({
        queryKey: ["experiences"],
      });

      queryClient.invalidateQueries({
        queryKey: ["myExperiences"],
      });
    },
  });

  const shareExperienceCard = async () => {
    if (!experience) {
      Alert.alert(
        "오류",
        "경험 정보를 찾을 수 없습니다."
      );
      return;
    }

    if (!shareCardRef.current) {
      Alert.alert(
        "오류",
        "공유 카드를 찾을 수 없습니다."
      );
      return;
    }

    try {
      setIsSharing(true);

      // 1. 경험 카드 이미지 캡처
      const uri = await captureRef(
        shareCardRef,
        {
          format: "png",
          quality: 1,
          result: "tmpfile",
        }
      );

      // 2. 자동 공유 문구
      const shareMessage = `✨ 새로운 경험을 완료했어요!

「${experience.name}」

⭐ ${myExperience?.rating ?? 0}/5
${myExperience?.memo
          ? `💬 ${myExperience.memo}\n`
          : ""
        }
나의 경험 도감에 새로운 추억을 기록했습니다. 🏆

#나의경험도감 #MYLIFE`;

      // 3. file:// 제거
      const shareUri = uri.startsWith("file://")
        ? uri
        : `file://${uri}`;

      // 4. 이미지 + 문구 공유
      await Share.open({
        title: "나의 경험 도감",
        message: shareMessage,
        url: shareUri,
        type: "image/png",
        failOnCancel: false,
      });

    } catch (error: any) {
      console.error(
        "경험 카드 공유 실패:",
        error
      );

      // 사용자가 공유창을 닫은 경우는 오류로 처리하지 않음
      if (error?.message !== "User did not share") {
        Alert.alert(
          "공유 실패",
          "경험 카드를 공유하지 못했습니다."
        );
      }
    } finally {
      setIsSharing(false);
    }
  };

  const submitReport = async (reason: string) => {
    try {
      await reportExperience(experienceId, reason);

      Alert.alert(
        "신고 접수",
        "신고가 접수되었습니다."
      );
    } catch (error: any) {
      console.error("report error:", error);

      Alert.alert(
        "신고 실패",
        error?.response?.data?.message ??
        "신고 처리에 실패했습니다."
      );
    }
  };

  const completeMutation = useMutation({
    mutationFn: async () => {
      let photoUrls: string[] = [];

      // 선택한 사진이 있으면 먼저 서버에 업로드
      if (selectedImages.length > 0) {
        photoUrls = await uploadImages(
          selectedImages
        );
      }

      // 업로드된 실제 URL을 DB에 저장
      return upsertMyExperience({
        experienceId: experienceId,
        status: "COMPLETED",
        rating: rating || undefined,
        memo: memo || undefined,
        photoUrls:
          photoUrls.length > 0
            ? photoUrls
            : undefined,
      });
    },

    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["experience", experienceId],
      });

      queryClient.invalidateQueries({
        queryKey: ["experiences"],
      });

      queryClient.invalidateQueries({
        queryKey: ["myExperiences"],
      });

      queryClient.invalidateQueries({
        queryKey: ["myStats"],
      });

      if (data.unlockedAchievements?.length) {
        Alert.alert(
          "업적 달성!",
          data.unlockedAchievements
            .map((a: any) => a.name)
            .join(", ")
        );
      }
    },

    onError: (error: any) => {
      console.error(
        "경험 완료 처리 실패:",
        error
      );

      Alert.alert(
        "저장 실패",
        error?.response?.data?.message ??
        "경험을 저장하지 못했습니다."
      );
    },
  });
  if (isLoading || !experience) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* 카테고리 */}
      <Text style={styles.category}>
        {experience.category.emoji}{" "}
        {experience.category.name}
      </Text>

      {/* 경험 이름 */}
      <Text style={styles.name}>
        {experience.name}
      </Text>

      {/* 설명 */}
      {experience.description && (
        <Text style={styles.desc}>
          {experience.description}
        </Text>
      )}

      {/* 경험 정보 */}
      <View style={styles.metaRow}>
        <Text style={styles.metaItem}>
          난이도 {experience.difficulty}
        </Text>

        <Text style={styles.metaItem}>
          희귀도 {"⭐".repeat(experience.rarity)}
        </Text>

        {experience.estimatedTime && (
          <Text style={styles.metaItem}>
            ⏱️ {experience.estimatedTime}
          </Text>
        )}

        {experience.cost && (
          <Text style={styles.metaItem}>
            💰 {experience.cost}
          </Text>
        )}
      </View>

      {/* 완료 상태 */}
      {isCompleted && (
        <View style={styles.completedBox}>
          <Text style={styles.completedTitle}>
            🎉 이미 달성하였습니다!
          </Text>

          {myExperience.completedAt && (
            <Text style={styles.completedDate}>
              완료일{" "}
              {new Date(
                myExperience.completedAt
              ).toLocaleDateString("ko-KR")}
            </Text>
          )}
        </View>
      )}

      {/* 관심 상태 */}
      {!isCompleted && (
        <Pressable
          style={[
            styles.interestButton,
            isInterested &&
            styles.interestButtonActive,
          ]}
          disabled={
            interestMutation.isPending ||
            cancelInterestMutation.isPending
          }
          onPress={() => {
            if (isInterested) {
              cancelInterestMutation.mutate();
            } else {
              interestMutation.mutate();
            }
          }}
        >
          <Text
            style={[
              styles.interestButtonText,
              isInterested &&
              styles.interestButtonTextActive,
            ]}
          >
            {interestMutation.isPending ||
              cancelInterestMutation.isPending
              ? "처리 중..."
              : isInterested
                ? "💔 관심 취소"
                : "❤️ 관심 등록"}
          </Text>
        </Pressable>
      )}

      {/* 별점 */}
      <Text style={styles.sectionTitle}>
        별점
      </Text>

      {isCompleted ? (
        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Text key={n} style={styles.star}>
              {myExperience.rating &&
                n <= myExperience.rating
                ? "⭐"
                : "☆"}
            </Text>
          ))}
        </View>
      ) : (
        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              onPress={() => setRating(n)}
            >
              <Text style={styles.star}>
                {n <= rating ? "⭐" : "☆"}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* 사진 */}
      <Text style={styles.sectionTitle}>
        사진
      </Text>

      {/* 이미 완료한 경험이면 저장된 사진 표시 */}
      {isCompleted && (
        <>
          {myExperience?.photos?.length > 0 ? (
            <View style={styles.photoGrid}>
              {myExperience.photos.map((photo) => (
                <View
                  key={photo.id}
                  style={styles.photoContainer}
                >
                  <Image
                    source={{ uri: photo.url }}
                    style={styles.photo}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.photoDescription}>
              등록한 사진이 없습니다.
            </Text>
          )}
        </>
      )}

      {/* 아직 완료하지 않은 경우 사진 추가 */}
      {!isCompleted && (
        <>
          <Pressable
            style={styles.photoAddButton}
            onPress={pickImages}
          >
            <Text style={styles.photoAddButtonText}>
              📷 사진 추가
            </Text>
          </Pressable>

          {selectedImages.length > 0 && (
            <View style={styles.photoGrid}>
              {selectedImages.map((uri) => (
                <View
                  key={uri}
                  style={styles.photoContainer}
                >
                  <Image
                    source={{ uri }}
                    style={styles.photo}
                  />

                  <Pressable
                    style={styles.photoDeleteButton}
                    onPress={() => removeImage(uri)}
                  >
                    <Text style={styles.photoDeleteText}>
                      ×
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.photoDescription}>
            최대 5장까지 추가할 수 있어요.
          </Text>
        </>
      )}

      {/* 기록 */}
      <Text style={styles.sectionTitle}>
        기록
      </Text>

      {isCompleted ? (
        <View style={styles.memoBox}>
          <Text style={styles.memoText}>
            {myExperience.memo ||
              "작성한 기록이 없습니다."}
          </Text>
        </View>
      ) : (
        <TextInput
          style={styles.memoInput}
          placeholder="이 경험에 대한 짧은 기록을 남겨보세요"
          multiline
          value={memo}
          onChangeText={setMemo}
        />
      )}

      {/* 완료 버튼 */}
      {!isCompleted && (
        <Pressable
          style={styles.completeButton}
          disabled={completeMutation.isPending}
          onPress={() =>
            completeMutation.mutate()
          }
        >
          <Text style={styles.completeButtonText}>
            {completeMutation.isPending
              ? "저장 중..."
              : "✅ 완료 처리"}
          </Text>
        </Pressable>
      )}

      {/* 공유 버튼 */}
      {isCompleted && (
        <Pressable
          style={styles.shareButton}
          onPress={() => setShareModalVisible(true)}
        >
          <Text style={styles.shareButtonText}>
            📤 공유하기
          </Text>
        </Pressable>
      )}

      {/* 사용자 경험 신고 */}
      {experience.source === "USER" &&
        experience.createdBy && (
          <Pressable
            style={styles.reportButton}
            onPress={() =>
              setReportModalVisible(true)
            }
          >
            <Text
              style={styles.reportButtonText}
            >
              🚨 이 경험 신고하기
            </Text>
          </Pressable>
        )}

      {/* 공유 카드 미리보기 */}
      <Modal
        visible={shareModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShareModalVisible(false)
        }
      >
        <View style={styles.shareModalOverlay}>
          <View style={styles.shareModal}>

            {/* 제목 */}
            <View style={styles.shareModalHeader}>
              <Text style={styles.shareModalTitle}>
                경험 카드 공유
              </Text>

              <Pressable
                onPress={() =>
                  setShareModalVisible(false)
                }
              >
                <Text style={styles.shareModalClose}>
                  ✕
                </Text>
              </Pressable>
            </View>

            {/* 카드 미리보기 */}
            <View style={styles.shareCardPreview}>
              <View
                ref={shareCardRef}
                collapsable={false}
              >
                <ShareExperienceCard
                  experience={experience}
                  rating={myExperience?.rating}
                  memo={myExperience?.memo}
                  photoUrl={
                    myExperience?.photos?.[0]?.url
                  }
                  completedAt={
                    myExperience?.completedAt
                  }
                />
              </View>
            </View>

            {/* 공유 버튼 */}
            <Pressable
              style={styles.shareImageButton}
              disabled={isSharing}
              onPress={shareExperienceCard}
            >
              {isSharing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.shareImageButtonText}>
                  📤 이미지로 공유하기
                </Text>
              )}
            </Pressable>

            {/* 닫기 */}
            <Pressable
              style={styles.shareCloseButton}
              onPress={() =>
                setShareModalVisible(false)
              }
            >
              <Text style={styles.shareCloseButtonText}>
                닫기
              </Text>
            </Pressable>

          </View>
        </View>
      </Modal>


      {/* 신고 모달 */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setReportModalVisible(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reportModal}>
            <Text style={styles.reportTitle}>
              경험 신고
            </Text>

            <Text
              style={styles.reportDescription}
            >
              신고 사유를 선택해주세요.
            </Text>

            <Pressable
              style={styles.reportOption}
              onPress={() => {
                setReportModalVisible(false);
                submitReport("부적절한 내용");
              }}
            >
              <Text
                style={styles.reportOptionText}
              >
                부적절한 내용
              </Text>
            </Pressable>

            <Pressable
              style={styles.reportOption}
              onPress={() => {
                setReportModalVisible(false);
                submitReport("광고 / 홍보");
              }}
            >
              <Text
                style={styles.reportOptionText}
              >
                광고 / 홍보
              </Text>
            </Pressable>

            <Pressable
              style={styles.reportOption}
              onPress={() => {
                setReportModalVisible(false);
                submitReport("중복 경험");
              }}
            >
              <Text
                style={styles.reportOptionText}
              >
                중복 경험
              </Text>
            </Pressable>

            <Pressable
              style={styles.reportOption}
              onPress={() => {
                setReportModalVisible(false);
                submitReport("잘못된 정보");
              }}
            >
              <Text
                style={styles.reportOptionText}
              >
                잘못된 정보
              </Text>
            </Pressable>

            <Pressable
              style={styles.reportOption}
              onPress={() => {
                setReportModalVisible(false);
                submitReport("기타");
              }}
            >
              <Text
                style={styles.reportOptionText}
              >
                기타
              </Text>
            </Pressable>

            <Pressable
              style={styles.reportCancelButton}
              onPress={() =>
                setReportModalVisible(false)
              }
            >
              <Text
                style={styles.reportCancelText}
              >
                취소
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  contentContainer: {
    padding: 20,
    paddingBottom: 40,
    gap: 8,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  category: {
    color: "#999",
    fontSize: 13,
  },

  name: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 4,
  },

  desc: {
    fontSize: 14,
    color: "#555",
    marginTop: 8,
    lineHeight: 21,
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },

  metaItem: {
    fontSize: 12,
    color: "#666",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  completedBox: {
    marginTop: 16,
    padding: 14,
    backgroundColor: "#EAF8F1",
    borderRadius: 12,
  },

  completedTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#16845A",
  },

  completedDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },

  interestButton: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#FF7A45",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },

  interestButtonActive: {
    backgroundColor: "#FFF1EB",
  },

  interestButtonText: {
    color: "#FF7A45",
    fontWeight: "600",
  },

  interestButtonTextActive: {
    color: "#FF7A45",
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
  },

  starRow: {
    flexDirection: "row",
    gap: 4,
  },

  star: {
    fontSize: 24,
  },

  // 사진 추가 버튼
  photoAddButton: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    borderStyle: "dashed",
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },

  photoAddButtonText: {
    fontSize: 14,
    color: "#555",
    fontWeight: "600",
  },

  // 사진 미리보기
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },

  photoContainer: {
    width: "100%",
    height: 250,
    position: "relative",
    marginBottom: 8,
  },

  photo: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  photoDeleteButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },

  photoDeleteText: {
    color: "#fff",
    fontSize: 18,
    lineHeight: 20,
  },

  photoDescription: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
  },

  memoInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
  },

  memoBox: {
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    backgroundColor: "#FAFAFA",
  },

  memoText: {
    color: "#555",
    lineHeight: 20,
  },

  completeButton: {
    marginTop: 20,
    backgroundColor: "#22A06B",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },

  completeButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  reportButton: {
    marginTop: 12,
    padding: 10,
    alignItems: "center",
  },

  reportButtonText: {
    color: "#999",
    fontSize: 13,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  reportModal: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },

  reportTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  reportDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 6,
    marginBottom: 16,
  },

  reportOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },

  reportOptionText: {
    fontSize: 15,
    color: "#333",
  },

  reportCancelButton: {
    marginTop: 14,
    paddingVertical: 12,
    alignItems: "center",
  },

  reportCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#999",
  },

  /* =========================
   공유 카드
  ========================= */

  shareButton: {
    marginTop: 12,
    backgroundColor: "#173B35",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },

  shareButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },

  shareModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },

  shareModal: {
    width: "100%",
    maxHeight: "95%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
  },

  shareModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  shareModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },

  shareModalClose: {
    fontSize: 22,
    color: "#777",
    paddingHorizontal: 4,
  },

  shareCardPreview: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  shareImageButton: {
    marginTop: 16,
    backgroundColor: "#22A06B",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },

  shareImageButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  shareCloseButton: {
    marginTop: 8,
    padding: 12,
    alignItems: "center",
  },

  shareCloseButtonText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
  },
});