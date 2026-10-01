import { prisma } from "../lib/prisma";

export async function sendFriendRequest(
    requesterId: string,
    friendCode: string
) {
    const addressee = await prisma.user.findUnique({
        where: { friendCode },
        select: {
            id: true,
            nickname: true,
            friendCode: true,
        },
    });

    if (!addressee) {
        throw new Error("존재하지 않는 친구 코드입니다.");
    }

    if (addressee.id === requesterId) {
        throw new Error("자기 자신에게 친구 요청을 보낼 수 없습니다.");
    }

    const existingFriendship =
        await prisma.friendship.findFirst({
            where: {
                OR: [
                    {
                        requesterId,
                        addresseeId: addressee.id,
                    },
                    {
                        requesterId: addressee.id,
                        addresseeId: requesterId,
                    },
                ],
            },
        });

    if (existingFriendship) {
        if (existingFriendship.status === "ACCEPTED") {
            throw new Error("이미 친구입니다.");
        }

        throw new Error("이미 친구 요청이 존재합니다.");
    }

    return prisma.friendship.create({
        data: {
            requesterId,
            addresseeId: addressee.id,
            status: "PENDING",
        },
        include: {
            addressee: {
                select: {
                    id: true,
                    nickname: true,
                    profileImage: true,
                    friendCode: true,
                },
            },
        },
    });
}


// 친구 목록 조회
export async function getFriends(userId: string) {
    const friendships = await prisma.friendship.findMany({
        where: {
            status: "ACCEPTED",
            OR: [
                { requesterId: userId },
                { addresseeId: userId },
            ],
        },
        include: {
            requester: {
                select: {
                    id: true,
                    nickname: true,
                    profileImage: true,
                    friendCode: true,
                },
            },
            addressee: {
                select: {
                    id: true,
                    nickname: true,
                    profileImage: true,
                    friendCode: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return friendships.map((friendship) => {
        const friend =
            friendship.requesterId === userId
                ? friendship.addressee
                : friendship.requester;

        return {
            friendshipId: friendship.id,
            ...friend,
        };
    });
}


// 받은 친구 요청 조회
export async function getReceivedFriendRequests(
    userId: string
) {
    return prisma.friendship.findMany({
        where: {
            addresseeId: userId,
            status: "PENDING",
        },
        include: {
            requester: {
                select: {
                    id: true,
                    nickname: true,
                    profileImage: true,
                    friendCode: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}


// 친구 요청 수락
export async function acceptFriendRequest(
    userId: string,
    friendshipId: string
) {
    const friendship = await prisma.friendship.findUnique({
        where: {
            id: friendshipId,
        },
    });

    if (!friendship) {
        throw new Error("친구 요청을 찾을 수 없습니다.");
    }

    // 요청을 받은 사람만 수락 가능
    if (friendship.addresseeId !== userId) {
        throw new Error("이 친구 요청을 수락할 수 없습니다.");
    }

    if (friendship.status !== "PENDING") {
        throw new Error("이미 처리된 친구 요청입니다.");
    }

    return prisma.friendship.update({
        where: {
            id: friendshipId,
        },
        data: {
            status: "ACCEPTED",
        },
    });
}


// 친구 삭제
export async function deleteFriend(
    userId: string,
    friendshipId: string
) {
    const friendship = await prisma.friendship.findUnique({
        where: {
            id: friendshipId,
        },
    });

    if (!friendship) {
        throw new Error("친구 관계를 찾을 수 없습니다.");
    }

    const isMyFriend =
        friendship.requesterId === userId ||
        friendship.addresseeId === userId;

    if (!isMyFriend) {
        throw new Error("이 친구 관계를 삭제할 수 없습니다.");
    }

    return prisma.friendship.delete({
        where: {
            id: friendshipId,
        },
    });
}

export async function getFriendProfile(
    userId: string,
    friendId: string
) {
    // 실제 친구인지 확인
    const friendship = await prisma.friendship.findFirst({
        where: {
            status: "ACCEPTED",
            OR: [
                {
                    requesterId: userId,
                    addresseeId: friendId,
                },
                {
                    requesterId: friendId,
                    addresseeId: userId,
                },
            ],
        },
    });

    if (!friendship) {
        throw new Error("친구 프로필을 볼 수 없습니다.");
    }

    const friend = await prisma.user.findUnique({
        where: {
            id: friendId,
        },
        select: {
            id: true,
            nickname: true,
            profileImage: true,
            friendCode: true,
            experiencePoints: true,

            userExperiences: {
                where: {
                    status: "COMPLETED",
                },
                select: {
                    experienceId: true,
                    experience: {
                        select: {
                            category: {
                                select: {
                                    code: true,
                                    name: true,
                                    emoji: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!friend) {
        throw new Error("사용자를 찾을 수 없습니다.");
    }

    const completedExperiences =
        friend.userExperiences;

    const categoryMap = new Map<
        string,
        {
            code: string;
            name: string;
            emoji: string | null;
            count: number;
        }
    >();

    for (const item of completedExperiences) {
        const category = item.experience.category;

        const existing = categoryMap.get(category.code);

        if (existing) {
            existing.count += 1;
        } else {
            categoryMap.set(category.code, {
                code: category.code,
                name: category.name,
                emoji: category.emoji,
                count: 1,
            });
        }
    }

    return {
        id: friend.id,
        nickname: friend.nickname,
        profileImage: friend.profileImage,
        friendCode: friend.friendCode,
        experiencePoints: friend.experiencePoints,
        totalCount: completedExperiences.length,
        categoryStats: Array.from(categoryMap.values()),
    };
}