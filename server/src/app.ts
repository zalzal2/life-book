import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth.routes";
import experienceRoutes from "./routes/experience.routes";
import meRoutes from "./routes/me.routes";
import achievementRoutes from "./routes/achievement.routes";
import friendRoutes from "./routes/friend.routes";
import categoriesRoutes from "./routes/categories.routes";
import uploadRoutes from "./routes/upload.routes";

const app = express();

app.use(cors());

app.use(express.json());
app.use(
  "/uploads",
  express.static(
    path.join(process.cwd(), "uploads")
  )
);

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/uploads", uploadRoutes);
app.use("/auth", authRoutes);
app.use("/experiences", experienceRoutes);
app.use("/me", meRoutes);
app.use("/achievements", achievementRoutes);
app.use("/categories", categoriesRoutes);
app.use("/friends", friendRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "요청한 경로를 찾을 수 없습니다." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🏆 인생 도감 서버 실행 중: http://localhost:${PORT}`);
});
