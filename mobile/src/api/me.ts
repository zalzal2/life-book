import { apiClient } from "./client";

export type Me = {
    id: string;
    email: string | null;
    nickname: string;
    friendCode: string;
    profileImage: string | null;
    experiencePoints: number;
    createdAt: string;
    authProvider: "LOCAL" | "KAKAO" | "NAVER";
};

export async function fetchMe(): Promise<Me> {
    const { data } = await apiClient.get<Me>("/me");
    return data;
}

export async function updateMe(payload: {
    nickname: string;
}) {
    const { data } = await apiClient.patch<Me>(
        "/me",
        payload
    );

    return data;
}

export async function changePassword(payload: {
    currentPassword: string;
    newPassword: string;
}) {
    const { data } = await apiClient.patch(
        "/me/password",
        payload
    );

    return data;
}

export async function deleteMe() {
    await apiClient.delete("/me");
}