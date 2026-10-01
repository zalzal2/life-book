import { Response } from "express";

import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middlewares/auth.middleware";

export async function reportExperience(
    req: AuthedRequest,
    res: Response
) {
    try {
        const userId = req.userId!;
        const { experienceId } = req.params;
        const { reason } = req.body;

        if (!reason || !String(reason).trim()) {
            return res.status(400).json({
                message: "신고 사유를 선택해주세요.",
            });
        }

        const experience =
            await prisma.experience.findUnique({
                where: {
                    id: experienceId,
                },
            });

        if (!experience) {
            return res.status(404).json({
                message: "경험을 찾을 수 없습니다.",
            });
        }

        // 공식 경험은 신고할 수 없음
        if (experience.source !== "USER") {
            return res.status(400).json({
                message:
                    "사용자가 만든 경험만 신고할 수 있습니다.",
            });
        }

        // 비공개 경험은 신고할 수 없음
        if (!experience.isPublic) {
            return res.status(400).json({
                message:
                    "공개된 경험만 신고할 수 있습니다.",
            });
        }

        // 자신의 경험은 신고할 수 없음
        if (experience.createdById === userId) {
            return res.status(400).json({
                message:
                    "자신이 만든 경험은 신고할 수 없습니다.",
            });
        }

        // 이미 신고했는지 확인
        const existing =
            await prisma.experienceReport.findUnique({
                where: {
                    experienceId_reporterId: {
                        experienceId,
                        reporterId: userId,
                    },
                },
            });

        if (existing) {
            return res.status(409).json({
                message: "이미 신고한 경험입니다.",
            });
        }

        const report =
            await prisma.experienceReport.create({
                data: {
                    experienceId,
                    reporterId: userId,
                    reason: String(reason).trim(),
                },
            });

        return res.status(201).json({
            message: "신고가 접수되었습니다.",
            report,
        });
    } catch (error) {
        console.error(
            "reportExperience error:",
            error
        );

        return res.status(500).json({
            message: "신고 처리에 실패했습니다.",
        });
    }
}