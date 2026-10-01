import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(
    process.cwd(),
    "uploads"
);

// uploads 폴더가 없으면 생성
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
        recursive: true,
    });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },

    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);

        const filename =
            `${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 10)}${ext}`;

        cb(null, filename);
    },
});

const fileFilter: multer.Options["fileFilter"] = (
    _req,
    file,
    cb
) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
        return;
    }

    cb(
        new Error("이미지 파일만 업로드할 수 있습니다.")
    );
};

export const uploadImagesMiddleware = multer({
    storage,
    fileFilter,

    limits: {
        files: 5,
        fileSize: 10 * 1024 * 1024,
    },
}).array("images", 5);