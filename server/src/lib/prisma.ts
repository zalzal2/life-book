import { PrismaClient } from "@prisma/client";

// 개발 중 hot-reload 시 커넥션 중복 생성 방지
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
