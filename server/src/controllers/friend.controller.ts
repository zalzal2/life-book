import { Response } from "express";
import { z } from "zod";

import { AuthedRequest } from "../middlewares/auth.middleware";

import {
    sendFriendRequest,
    getFriends,
    getReceivedFriendRequests,
    acceptFriendRequest,
    deleteFriend,
    getFriendProfile,
} from "../services/friend.service";


const friendRequestSchema = z.object({
    friendCode: z.string().min(1).max(8),
});


// 친구 요청 보내기
export async function requestFriend(
    req: AuthedRequest,
    res: Response
) {
    try {
        const userId = req.userId!;

        const parsed = friendRequestSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                message: "친구 코드가 올바르지 않습니다.",
            });
        }

        const { friendCode } = parsed.data;

        const friendship = await sendFriendRequest(
            userId,
            friendCode
        );

        return res.status(201).json({
            message: "친구 요청을 보냈습니다.",
            friendship,
        });
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "친구 요청에 실패했습니다.";

        return res.status(400).json({
            message,
        });
    }
}


// 친구 목록 조회
export async function getMyFriends(
    req: AuthedRequest,
    res: Response
) {
    try {
        const userId = req.userId!;

        const friends = await getFriends(userId);

        return res.json({
            friends,
        });
    } catch (error) {
        return res.status(500).json({
            message: "친구 목록을 불러오지 못했습니다.",
        });
    }
}


// 받은 친구 요청 조회
export async function getMyFriendRequests(
    req: AuthedRequest,
    res: Response
) {
    try {
        const userId = req.userId!;

        const requests =
            await getReceivedFriendRequests(userId);

        return res.json({
            requests,
        });
    } catch (error) {
        return res.status(500).json({
            message: "친구 요청을 불러오지 못했습니다.",
        });
    }
}


// 친구 요청 수락
export async function acceptFriend(
    req: AuthedRequest,
    res: Response
) {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        await acceptFriendRequest(
            userId,
            id
        );

        return res.json({
            message: "친구 요청을 수락했습니다.",
        });
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "친구 요청 수락에 실패했습니다.";

        return res.status(400).json({
            message,
        });
    }
}


// 친구 삭제
export async function removeFriend(
    req: AuthedRequest,
    res: Response
) {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        await deleteFriend(
            userId,
            id
        );

        return res.json({
            message: "친구를 삭제했습니다.",
        });
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "친구 삭제에 실패했습니다.";

        return res.status(400).json({
            message,
        });
    }
}

export async function getMyFriendProfile(
    req: AuthedRequest,
    res: Response
) {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const profile = await getFriendProfile(
            userId,
            id
        );

        return res.json(profile);
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "친구 프로필을 불러오지 못했습니다.";

        return res.status(400).json({
            message,
        });
    }
}