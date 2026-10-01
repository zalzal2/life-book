import { create } from "zustand";
import { apiClient, saveToken, clearToken } from "../api/client";

type User = {
  id: string;
  email: string | null;
  nickname: string;
  friendCode: string;
};

type AuthState = {
  user: User | null;
  isLoading: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<void>;

  socialLogin: (
    token: string
  ) => Promise<void>;

  register: (
    email: string,
    password: string,
    nickname: string
  ) => Promise<void>;

  logout: () => Promise<void>;
};

export const useAuthStore =
  create<AuthState>((set) => ({
    user: null,
    isLoading: false,

    login: async (email, password) => {
      set({ isLoading: true });

      try {
        const { data } =
          await apiClient.post(
            "/auth/login",
            {
              email,
              password,
            }
          );

        await saveToken(data.token);

        set({
          user: data.user,
        });
      } finally {
        set({
          isLoading: false,
        });
      }
    },

    socialLogin: async (token) => {
      set({ isLoading: true });

      try {

        await saveToken(token);
        const { data } =
          await apiClient.get("/me");

        set({
          user: data,
        });
      } catch (error: any) {

        throw error;

      } finally {
        set({
          isLoading: false,
        });
      }
    },

    register: async (
      email,
      password,
      nickname
    ) => {
      set({ isLoading: true });

      try {
        const { data } =
          await apiClient.post(
            "/auth/register",
            {
              email,
              password,
              nickname,
            }
          );

        await saveToken(data.token);

        set({
          user: data.user,
        });
      } finally {
        set({
          isLoading: false,
        });
      }
    },

    logout: async () => {
      await clearToken();

      set({
        user: null,
      });
    },
  }));

