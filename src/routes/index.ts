import { Router } from "express";
import healthRoutes from "../modules/health/health.routes";
import authRoutes from "../modules/auth/auth.routes";
import merchantRoutes from "../modules/merchant/merchant.routes";
import staffRoutes from "../modules/staff/staff.routes";
import userRoutes from "../modules/user/user.routes";
import staffDashboardRoutes from "../modules/staff-dashboard/staff-dashboard.routes";
import transactionRoutes from "../modules/transaction/transaction.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/merchants", merchantRoutes);
router.use("/staff", staffRoutes);
router.use("/users", userRoutes);
router.use("/staff-dashboard", staffDashboardRoutes);
router.use("/transactions", transactionRoutes);

export default router;
