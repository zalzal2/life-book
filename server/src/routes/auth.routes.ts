import { Router } from "express";
import {
    login,
    register,
    kakaoAuth,
    kakaoLogin,
    naverAuth,
    naverLogin,
} from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);

router.get("/kakao", kakaoAuth);
router.get("/kakao/callback", kakaoLogin);
router.get("/naver", naverAuth);
router.get("/naver/callback", naverLogin);
export default router;