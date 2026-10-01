import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middlewares/auth.middleware";

export async function getMyAchievements(
    req: AuthedRequest,
    res: Response
) {
    const userId = req.userId!;

    const achievements = await prisma.achievement.findMany({
        orderBy: {
            code: "asc",
        },
    });

    const userAchievements =
        await prisma.userAchievement.findMany({
            where: {
                userId,
            },
            select: {
                achievementId: true,
                unlockedAt: true,
            },
        });

    const unlockedMap = new Map(
        userAchievements.map((item) => [
            item.achievementId,
            item.unlockedAt,
        ])
    );

    const result = achievements.map((achievement) => ({
        id: achievement.id,
        code: achievement.code,
        name: achievement.name,
        description: achievement.description,
        condition: achievement.condition,
        unlocked: unlockedMap.has(achievement.id),
        unlockedAt:
            unlockedMap.get(achievement.id) ?? null,
    }));

    return res.json(result);
}