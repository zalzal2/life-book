import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function calculateExperiencePoints(
    difficulty: number,
    rarity: number
): number {
    const difficultyExp: Record<number, number> = {
        1: 10,
        2: 20,
        3: 35,
        4: 50,
        5: 70,
    };

    const rarityExp: Record<number, number> = {
        1: 0,
        2: 10,
        3: 25,
        4: 45,
        5: 70,
    };

    const baseExp = 50;

    return (
        baseExp +
        (difficultyExp[difficulty] ?? 0) +
        (rarityExp[rarity] ?? 0)
    );
}

async function main() {
    console.log("기존 완료 경험 EXP 소급 지급 시작...");

    const completedExperiences =
        await prisma.userExperience.findMany({
            where: {
                status: "COMPLETED",
                earnedExp: null,
            },
            include: {
                experience: {
                    select: {
                        name: true,
                        difficulty: true,
                        rarity: true,
                    },
                },
            },
        });

    console.log(
        `소급 대상: ${completedExperiences.length}개`
    );

    if (completedExperiences.length === 0) {
        console.log("소급할 경험이 없습니다.");
        return;
    }

    const userExpMap = new Map<string, number>();

    for (const userExperience of completedExperiences) {
        const exp = calculateExperiencePoints(
            userExperience.experience.difficulty,
            userExperience.experience.rarity
        );

        userExpMap.set(
            userExperience.userId,
            (userExpMap.get(userExperience.userId) ?? 0) + exp
        );

        console.log(
            `${userExperience.experience.name}: +${exp} EXP`
        );
    }

    await prisma.$transaction(async (tx) => {
        // 완료 경험마다 earnedExp 기록
        for (const userExperience of completedExperiences) {
            const exp = calculateExperiencePoints(
                userExperience.experience.difficulty,
                userExperience.experience.rarity
            );

            await tx.userExperience.update({
                where: {
                    id: userExperience.id,
                },
                data: {
                    earnedExp: exp,
                },
            });
        }

        // 사용자별 EXP 지급
        for (const [userId, totalExp] of userExpMap) {
            await tx.user.update({
                where: {
                    id: userId,
                },
                data: {
                    experiencePoints: {
                        increment: totalExp,
                    },
                },
            });

            console.log(
                `User ${userId}: +${totalExp} EXP`
            );
        }
    });

    console.log("✅ EXP 소급 지급 완료!");
}

main()
    .catch((error) => {
        console.error("❌ 마이그레이션 실패");
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });