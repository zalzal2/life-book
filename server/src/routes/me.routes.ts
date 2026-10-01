import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  deleteMyExperience,
  getMyStats,
  listMyExperiences,
  upsertMyExperience,
  cancelMyInterest,
} from "../controllers/userExperience.controller";
import {
  getMe,
  updateMe,
  changePassword,
  deleteMe,
} from "../controllers/me.controller";
import { recommendNextExperiences } from "../services/recommendation.service";
import { AuthedRequest } from "../middlewares/auth.middleware";
import { Response } from "express";

const router = Router();
router.use(authMiddleware);
// 회원 정보
router.patch("/password", changePassword);
router.get("/", getMe);
router.patch("/", updateMe);
router.delete("/", deleteMe);

// 내 경험
router.get("/experiences", listMyExperiences);
router.post("/experiences", upsertMyExperience);
router.delete("/experiences/interest/:experienceId", cancelMyInterest);
router.delete("/experiences/:id", deleteMyExperience);

router.get("/stats", getMyStats);

// 추천
router.get("/recommendations", async (req: AuthedRequest, res: Response) => {
  const items = await recommendNextExperiences(req.userId!);
  res.json(items);
});

export default router;
