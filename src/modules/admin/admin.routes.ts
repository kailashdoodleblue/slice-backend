import { Router } from "express";
import { adminController } from "./admin.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { UserRole } from "../../constants";
import {
  getDashboardGraphQuerySchema,
  getDashboardIncentivesQuerySchema,
} from "./admin.validation";

const router = Router();

// Restrict all admin endpoints to Admin role
router.use(authenticate, authorize(UserRole.ADMIN));

router.get("/dashboard", adminController.getDashboardStats);
router.get(
  "/dashboard/graph",
  validate(getDashboardGraphQuerySchema),
  adminController.getDashboardGraph
);
router.get(
  "/dashboard/volume",
  validate(getDashboardGraphQuerySchema),
  adminController.getDashboardGraph
);
router.get(
  "/dashboard/incentives",
  validate(getDashboardIncentivesQuerySchema),
  adminController.getIncentiveDistribution
);
router.get(
  "/dashboard/incentives-distribution",
  validate(getDashboardIncentivesQuerySchema),
  adminController.getIncentiveDistribution
);

export default router;
