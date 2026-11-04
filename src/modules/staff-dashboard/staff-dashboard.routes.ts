import { Router } from "express";
import { staffDashboardController } from "./staff-dashboard.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { UserRole } from "../../constants";
import { staffDashboardSchema } from "./staff-dashboard.validation";

const router = Router();

router.use(authenticate, authorize(UserRole.STAFF));

router.get("/", validate(staffDashboardSchema), staffDashboardController.getDashboard);
router.get("/recent-transactions", staffDashboardController.getRecentTransactions);

export default router;

