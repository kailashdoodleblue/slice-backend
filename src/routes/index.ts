import { Router } from "express";
import healthRoutes from "../modules/health/health.routes";
import userRoutes from "../modules/user/user.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/users", userRoutes);

export default router;
