import { Router } from "express";

import {
  getExperience,
  getRandomExperience,
  listExperiences,
  createExperience,
  checkDuplicateExperiences,
} from "../controllers/experience.controller";

import {
  reportExperience,
} from "../controllers/experienceReport.controller";

import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", listExperiences);
router.get("/random", getRandomExperience);
router.get("/check-duplicate", checkDuplicateExperiences);
router.post("/:experienceId/report", reportExperience);
router.get("/:id", getExperience);
router.post("/", authMiddleware, createExperience);

export default router;