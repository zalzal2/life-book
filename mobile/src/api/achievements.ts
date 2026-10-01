import { apiClient } from "./client";

export function fetchMyAchievements() {
    return apiClient.get("/achievements/me").then((res) => res.data);
}