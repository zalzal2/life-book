import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useAuthStore } from "../store/authStore";

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const { register, isLoading } = useAuthStore();

  const handleSubmit = () => {
    setError("");

    if (!email || !password || !nickname) {
      setError("이메일, 비밀번호, 닉네임을 모두 입력해주세요.");
      return;
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 해요.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 서로 일치하지 않아요.");
      return;
    }

    register(email, password, nickname).catch((e) => {
      const message = e?.response?.data?.message || "회원가입 중 문제가 발생했어요.";
      setError(message);
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>인생 도감</Text>
      <Text style={styles.subtitle}>회원가입하고 나만의 경험 도감을 시작해보세요</Text>

      <TextInput
        style={styles.input}
        placeholder="닉네임"
        value={nickname}
        onChangeText={setNickname}
      />
      <TextInput
        style={styles.input}
        placeholder="이메일"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호 (8자 이상)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호 확인"
        secureTextEntry
        value={passwordConfirm}
        onChangeText={setPasswordConfirm}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={isLoading}>
        <Text style={styles.buttonText}>{isLoading ? "가입 중..." : "회원가입"}</Text>
      </Pressable>

      <Pressable style={styles.linkRow} onPress={() => navigation.navigate("Login")}>
        <Text style={styles.linkText}>이미 계정이 있으신가요? 로그인</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: "800", textAlign: "center" },
  subtitle: { fontSize: 13, color: "#888", textAlign: "center", marginBottom: 16 },
  input: { borderWidth: 1, borderColor: "#DDD", borderRadius: 10, padding: 14 },
  error: { color: "#E5484D", fontSize: 13, textAlign: "center" },
  button: { backgroundColor: "#FF7A45", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 8 },
  buttonText: { color: "#fff", fontWeight: "700" },
  linkRow: { marginTop: 16, alignItems: "center" },
  linkText: { color: "#666", fontSize: 13, textDecorationLine: "underline" },
});
