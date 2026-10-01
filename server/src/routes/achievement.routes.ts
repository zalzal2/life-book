import { Router } from "express";

import { prisma } from "../lib/prisma";

import {
  authMiddleware,
} from "../middlewares/auth.middleware";

import {
  getMyAchievements,
} from "../controllers/achievement.controller";

const router = Router();

// 전체 업적 목록
router.get("/", async (_req, res) => {
  const achievements = await prisma.achievement.findMany({
    orderBy: {
      code: "asc",
    },
  });

  res.json(achievements);
});

// 내 업적 목록 + 달성 여부
router.get(
  "/me",
  authMiddleware,
  getMyAchievements
);

export default router;