import { Router } from "express";
import { staffController } from "./staff.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { UserRole } from "../../constants";
import {
  createStaffSchema,
  updateStaffSchema,
  updateStaffStatusSchema,
  staffIdParamSchema,
} from "./staff.validation";

const router = Router();

// router.use(authenticate, authorize(UserRole.ADMIN));

router.post("/", validate(createStaffSchema), staffController.createStaff);
router.get("/", staffController.getAllStaff);
router.get("/:id", validate(staffIdParamSchema), staffController.getStaffById);
router.put("/:id", validate(updateStaffSchema), staffController.updateStaff);
router.patch(
  "/:id/status",
  validate(updateStaffStatusSchema),
  staffController.updateStatus
);

export default router;

