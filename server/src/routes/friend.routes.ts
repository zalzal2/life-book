import { Router } from "express";

import {
    requestFriend,
    getMyFriends,
    getMyFriendRequests,
    acceptFriend,
    removeFriend,
    getMyFriendProfile,
} from "../controllers/friend.controller";

import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();


// 친구 요청 보내기
router.post(
    "/request",
    authMiddleware,
    requestFriend
);


// 친구 목록
router.get(
    "/",
    authMiddleware,
    getMyFriends
);


// 받은 친구 요청
router.get(
    "/requests",
    authMiddleware,
    getMyFriendRequests
);

// 친구 프로필 보기
router.get(
    "/:id/profile",
    authMiddleware,
    getMyFriendProfile
);

// 친구 요청 수락
router.patch(
    "/:id/accept",
    authMiddleware,
    acceptFriend
);


// 친구 삭제
router.delete(
    "/:id",
    authMiddleware,
    removeFriend
);


export default router;