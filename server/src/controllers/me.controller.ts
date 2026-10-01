import { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middlewares/auth.middleware";
import bcrypt from "bcryptjs";

const updateMeSchema = z.object({
    nickname: z.string().min(1).max(20),
});

export async function getMe(
    req: AuthedRequest,
    res: Response
) {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            id: true,
            email: true,
            nickname: true,
            friendCode: true,
            profileImage: true,
            experiencePoints: true,
            createdAt: true,
            authProvider: true,
        },
    });

    if (!user) {
        return res.status(404).json({
            message: "사용자를 찾을 수 없습니다.",
        });
    }

    return res.json(user);
}

export async function updateMe(
    req: AuthedRequest,
    res: Response
) {
    const parsed = updateMeSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            message: "입력값이 올바르지 않습니다.",
            issues: parsed.error.issues,
        });
    }

    const userId = req.userId!;
    const { nickname } = parsed.data;

    const user = await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            nickname,
        },
        select: {
            id: true,
            email: true,
            nickname: true,
            friendCode: true,
            profileImage: true,
            experiencePoints: true,
            createdAt: true,
        },
    });

    return res.json(user);
}

export async function changePassword(
    req: AuthedRequest,
    res: Response
) {
    try {
        const userId = req.userId!;

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "현재 비밀번호와 새 비밀번호를 입력해주세요.",
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                message: "새 비밀번호는 8자 이상이어야 합니다.",
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                message: "새 비밀번호는 현재 비밀번호와 다르게 설정해주세요.",
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
        });

        if (!user) {
            return res.status(404).json({
                message: "사용자를 찾을 수 없습니다.",
            });
        }

        if (!user.password) {
            return res.status(400).json({
                message: "비밀번호가 설정된 계정이 아닙니다.",
            });
        }

        if (user.authProvider !== "LOCAL") {
            return res.status(400).json({
                message: "소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.",
            });
        }

        const isPasswordValid = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(400).json({
                message: "현재 비밀번호가 올바르지 않습니다.",
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                password: hashedPassword,
            },
        });

        return res.json({
            message: "비밀번호가 변경되었습니다.",
        });
    } catch (error) {
        console.error("changePassword error:", error);

        return res.status(500).json({
            message: "비밀번호 변경에 실패했습니다.",
        });
    }
}

export async function deleteMe(
    req: AuthedRequest,
    res: Response
) {
    try {
        const userId = req.userId!;

        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
        });

        if (!user) {
            return res.status(404).json({
                message: "사용자를 찾을 수 없습니다.",
            });
        }

        await prisma.$transaction(async (tx) => {
            /*
             * 1. 내가 만든 경험은 유지
             *    작성자 정보만 제거
             */
            await tx.experience.updateMany({
                where: {
                    createdById: userId,
                },
                data: {
                    createdById: null,
                },
            });

            /*
             * 2. 내가 등록한 경험의 사진 삭제
             */
            await tx.photo.deleteMany({
                where: {
                    userExperience: {
                        userId,
                    },
                },
            });

            /*
             * 3. 내가 등록한 경험 기록 삭제
             */
            await tx.userExperience.deleteMany({
                where: {
                    userId,
                },
            });

            /*
             * 4. 업적 기록 삭제
             */
            await tx.userAchievement.deleteMany({
                where: {
                    userId,
                },
            });

            /*
             * 5. 친구 관계 삭제
             */
            await tx.friendship.deleteMany({
                where: {
                    OR: [
                        {
                            requesterId: userId,
                        },
                        {
                            addresseeId: userId,
                        },
                    ],
                },
            });

            /*
             * 6. 내가 작성한 경험 신고 기록 삭제
             */
            await tx.experienceReport.deleteMany({
                where: {
                    reporterId: userId,
                },
            });

            /*
             * 7. 마지막으로 User 삭제
             */
            await tx.user.delete({
                where: {
                    id: userId,
                },
            });
        });

        return res.status(204).send();
    } catch (error) {
        console.error("deleteMe error:", error);

        return res.status(500).json({
            message: "회원탈퇴에 실패했습니다.",
        });
    }
}
