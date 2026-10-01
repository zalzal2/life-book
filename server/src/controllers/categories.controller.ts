import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function listCategories(
    req: Request,
    res: Response
) {
    try {
        const categories = await prisma.category.findMany({
            orderBy: {
                id: "asc",
            },
            select: {
                id: true,
                code: true,
                name: true,
                emoji: true,
            },
        });

        return res.json(categories);
    } catch (error) {
        console.error("listCategories error:", error);

        return res.status(500).json({
            message: "카테고리를 불러오지 못했습니다.",
        });
    }
}