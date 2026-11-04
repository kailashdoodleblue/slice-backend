import { Router } from "express";
import { staffController } from "./staff.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { UserRole } from "../../constants";
import {
  updateStaffSchema,
  updateStaffStatusSchema,
  staffIdParamSchema,
  getStaffQuerySchema,
} from "./staff.validation";

const router = Router();

// Admin-only staff management
router.use(authenticate, authorize(UserRole.ADMIN));

router.get("/", validate(getStaffQuerySchema), staffController.getAllStaff);
router.get("/:id", validate(staffIdParamSchema), staffController.getStaffById);
router.put("/:id", validate(updateStaffSchema), staffController.updateStaff);
router.patch(
  "/:id/status",
  validate(updateStaffStatusSchema),
  staffController.updateStatus
);

export default router;
