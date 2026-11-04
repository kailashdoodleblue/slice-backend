import { Router } from "express";
import { staffController } from "./staff.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { UserRole } from "../../constants";
import {
  createStaffSchema,
  updateStaffSchema,
  updateMyProfileSchema,
  changePasswordSchema,
  updateStaffStatusSchema,
  staffIdParamSchema,
  getStaffQuerySchema,
} from "./staff.validation";

const router = Router();

// router.use(authenticate, authorize(UserRole.ADMIN));

router.get("/me/profile", authenticate, authorize(UserRole.STAFF), staffController.getMyProfile);
router.put(
  "/me/profile",
  authenticate,
  authorize(UserRole.STAFF),
  validate(updateMyProfileSchema),
  staffController.updateMyProfile
);
router.patch(
  "/me/change-password",
  authenticate,
  authorize(UserRole.STAFF),
  validate(changePasswordSchema),
  staffController.changePassword
);
router.post("/", validate(createStaffSchema), staffController.createStaff);
router.get("/", validate(getStaffQuerySchema), staffController.getAllStaff);
router.get("/:id", validate(staffIdParamSchema), staffController.getStaffById);
router.put("/:id", validate(updateStaffSchema), staffController.updateStaff);
router.patch(
  "/:id/status",
  validate(updateStaffStatusSchema),
  staffController.updateStatus
);

export default router;
