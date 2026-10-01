import { Request, Response } from "express";

export async function uploadImages(
    req: Request,
    res: Response
) {
    try {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return res.status(400).json({
                message: "업로드할 이미지가 없습니다.",
            });
        }

        const baseUrl = `${req.protocol}://${req.get("host")}`;

        const urls = files.map((file) => {
            return `${baseUrl}/uploads/${file.filename}`;
        });

        return res.json({
            urls,
        });
    } catch (error) {
        console.error("uploadImages error:", error);

        return res.status(500).json({
            message: "이미지 업로드에 실패했습니다.",
        });
    }
}
