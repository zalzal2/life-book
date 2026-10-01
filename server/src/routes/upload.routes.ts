import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { uploadImagesMiddleware } from "../middlewares/upload.middleware";
import { uploadImages } from "../controllers/upload.controller";

const router = Router();

router.use(authMiddleware);

router.post(
    "/images",
    uploadImagesMiddleware,
    uploadImages
);

export default router;