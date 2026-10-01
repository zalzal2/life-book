import axios from "axios";
import * as SecureStore from "expo-secure-store";

// 개발 중에는 로컬 서버 주소로, 배포 시 실제 API 주소로 변경
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ||
  "http://localhost:4000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function saveToken(token: string) {
  await SecureStore.setItemAsync("token", token);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync("token");
}
