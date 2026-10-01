import { PrismaClient, ExperienceSource } from "@prisma/client";
import { parse } from "csv-parse/sync";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const CATEGORY_META: Record<string, { name: string; emoji: string }> = {
  TRAVEL: { name: "여행·탐험", emoji: "✈️" },
  FOOD: { name: "음식·미식", emoji: "🍜" },
  CULTURE: { name: "문화·콘텐츠", emoji: "🎨" },
  ADVENTURE: { name: "도전·모험", emoji: "🎯" },
  HOBBY: { name: "취미·창작", emoji: "🎮" },
  RELATION: { name: "사람·관계", emoji: "👥" },
  GROWTH: { name: "성장·커리어", emoji: "💼" },
  LIFE: { name: "일상·라이프", emoji: "🌱" },
};

type Row = {
  experience_id: string;
  category_code: string;
  category: string;
  experience_name: string;
  description: string;
  difficulty: string;
  rarity: string;
  estimated_time: string;
  cost: string;
  companion: string;
  scope: string;
};

async function main() {
  console.log("시드 시작: 카테고리 생성");

  const categoryIdByCode: Record<string, number> = {};
  for (const [code, meta] of Object.entries(CATEGORY_META)) {
    const category = await prisma.category.upsert({
      where: { code },
      update: {},
      create: { code, name: meta.name, emoji: meta.emoji },
    });
    categoryIdByCode[code] = category.id;
  }

  const csvPath = path.join(__dirname, "experiences_seed.csv");
  const raw = fs.readFileSync(csvPath, "utf-8");
  const records: Row[] = parse(raw, { columns: true, skip_empty_lines: true });

  console.log(`시드 시작: 경험 ${records.length}개 로드`);

  for (const r of records) {
    await prisma.experience.create({
      data: {
        categoryId: categoryIdByCode[r.category_code],
        name: r.experience_name,
        description: r.description,
        difficulty: Number(r.difficulty),
        rarity: Number(r.rarity),
        estimatedTime: r.estimated_time,
        cost: r.cost,
        companion: r.companion,
        scope: r.scope,
        source: ExperienceSource.BASE,
      },
    });
  }

  console.log("시드 시작: 업적 CSV 로드");

  type AchievementRow = {
    code: string;
    name: string;
    description: string;
    condition: string;
  };

  const achievementCsvPath = path.join(
    __dirname,
    "achievements_seed.csv"
  );

  const achievementRaw = fs.readFileSync(
    achievementCsvPath,
    "utf-8"
  );

  const achievementRecords: AchievementRow[] = parse(
    achievementRaw,
    {
      columns: true,
      skip_empty_lines: true,
    }
  );

  console.log(
    `업적 ${achievementRecords.length}개 로드`
  );

  for (const r of achievementRecords) {
    await prisma.achievement.upsert({
      where: {
        code: r.code,
      },
      update: {
        name: r.name,
        description: r.description,
        condition: JSON.parse(r.condition),
      },
      create: {
        code: r.code,
        name: r.name,
        description: r.description,
        condition: JSON.parse(r.condition),
      },
    });
  }

  console.log(
    `업적 ${achievementRecords.length}개 생성/업데이트 완료`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
