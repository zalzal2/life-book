import React, {
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from "react-native";

import {
  useAuthStore,
} from "../store/authStore";

import * as AuthSession from "expo-auth-session";
import { Linking } from "react-native";


const API_URL =
  process.env.EXPO_PUBLIC_API_URL!;

export default function LoginScreen({
  navigation,
}: any) {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const {
    login,
    socialLogin,
    isLoading,
  } = useAuthStore();

  /*
   * Expo가 로그인 완료 후
   * 돌아올 주소
   */
  const redirectUri =
    AuthSession.makeRedirectUri({
      path: "redirect",
    });

  /*
   * 카카오 로그인
   */
  const handleKakaoLogin = async () => {
    try {
      setError("");

      const redirectUri = AuthSession.makeRedirectUri({
        path: "redirect",
      });

      console.log("① Expo Redirect URI:", redirectUri);

      const authUrl =
        `${API_URL}/auth/kakao` +
        `?returnUrl=${encodeURIComponent(redirectUri)}`;

      console.log("② 카카오 로그인 URL:", authUrl);

      await Linking.openURL(authUrl);

      console.log("③ 카카오 로그인 페이지 열기 완료");
    } catch (error) {
      console.error("❌ 카카오 로그인 오류:", error);
      setError("카카오 로그인 중 문제가 발생했습니다.");
    }
  };


  /*
   * 네이버 로그인
   */
  const handleNaverLogin = async () => {
    try {
      setError("");

      const redirectUri = AuthSession.makeRedirectUri({
        path: "redirect",
      });

      console.log("① 네이버 Expo Redirect URI:", redirectUri);

      const authUrl =
        `${API_URL}/auth/naver` +
        `?returnUrl=${encodeURIComponent(redirectUri)}`;

      console.log("② 네이버 로그인 URL:", authUrl);

      await Linking.openURL(authUrl);

      console.log("③ 네이버 로그인 페이지 열기 완료");
    } catch (error) {
      console.error("❌ 네이버 로그인 오류:", error);
      setError("네이버 로그인 중 문제가 발생했습니다.");
    }
  };

  /*
   * 일반 이메일 로그인
   */
  const handleSubmit = () => {
    setError("");

    login(
      email,
      password
    ).catch((e) => {
      const message =
        e?.response?.data
          ?.message ||
        "로그인 중 문제가 발생했어요.";

      setError(message);
    });
  };

  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      try {
        const parsed = new URL(url);

        const token = parsed.searchParams.get("token");
        const loginError = parsed.searchParams.get("error");

        if (loginError) {
          console.log("❌ 네이버 로그인 오류:", loginError);
          setError("네이버 로그인에 실패했습니다.");
          return;
        }

        if (!token) {
          console.log("❌ 토큰 없음");
          return;
        }

        await socialLogin(token);

      } catch (error: any) {
        console.error("❌ 딥링크 처리 오류:", error);
        console.error("❌ 에러 메시지:", error?.message);
        console.error("❌ 응답 상태:", error?.response?.status);
        console.error("❌ 응답 데이터:", error?.response?.data);
      }
    };

    // 앱이 이미 실행 중인 상태에서 딥링크가 들어오는 경우
    const subscription = Linking.addEventListener(
      "url",
      ({ url }) => {
        handleDeepLink(url);
      }
    );


    return () => {
      subscription.remove();
    };
  }, [socialLogin]);


  return (
    <View
      style={styles.container}
    >
      <Text
        style={styles.title}
      >
        인생 도감
      </Text>

      <TextInput
        style={styles.input}
        placeholder="이메일"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={
          setEmail
        }
      />

      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        secureTextEntry
        value={password}
        onChangeText={
          setPassword
        }
      />

      {error ? (
        <Text
          style={styles.error}
        >
          {error}
        </Text>
      ) : null}

      <Pressable
        style={styles.button}
        onPress={
          handleSubmit
        }
        disabled={
          isLoading
        }
      >
        <Text
          style={
            styles.buttonText
          }
        >
          {isLoading
            ? "로그인 중..."
            : "로그인"}
        </Text>
      </Pressable>

      <Pressable
        style={styles.kakaoButton}
        onPress={handleKakaoLogin}
      >
        <Text
          style={styles.kakaoButtonText}>
          카카오 로그인
        </Text>
      </Pressable>

      <Pressable
        style={styles.naverButton}
        onPress={handleNaverLogin}
      >
        <Text style={styles.naverButtonText}>
          네이버로 로그인
        </Text>
      </Pressable>
      <Pressable
        style={
          styles.linkRow
        }
        onPress={() =>
          navigation.navigate(
            "Register"
          )
        }
      >
        <Text
          style={
            styles.linkText
          }
        >
          계정이 없으신가요?
          회원가입
        </Text>
      </Pressable>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent:
        "center",
      padding: 24,
      gap: 12,
    },

    title: {
      fontSize: 28,
      fontWeight: "800",
      textAlign:
        "center",
      marginBottom: 24,
    },

    input: {
      borderWidth: 1,
      borderColor:
        "#DDD",
      borderRadius: 10,
      padding: 14,
    },

    error: {
      color: "#E5484D",
      fontSize: 13,
      textAlign:
        "center",
    },

    button: {
      backgroundColor:
        "#FF7A45",
      borderRadius: 10,
      padding: 14,
      alignItems:
        "center",
      marginTop: 8,
    },

    buttonText: {
      color: "#fff",
      fontWeight:
        "700",
    },

    kakaoButton: {
      backgroundColor:
        "#FEE500",
      borderRadius: 10,
      padding: 14,
      alignItems:
        "center",
      marginTop: 4,
    },

    kakaoButtonText: {
      color: "#191919",
      fontWeight:
        "700",
    },

    linkRow: {
      marginTop: 16,
      alignItems:
        "center",
    },

    linkText: {
      color: "#666",
      fontSize: 13,
      textDecorationLine:
        "underline",
    },

    naverButton: {
      height: 50,
      borderRadius: 8,
      backgroundColor: "#03C75A",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 10,
    },

    naverButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
  });