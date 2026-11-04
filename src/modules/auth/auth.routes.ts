import { Router } from "express";
import { authController } from "./auth.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.validation";
import { createStaffSchema } from "../staff/staff.validation";

const router = Router();

// Separate Admin and Staff logins
router.post("/admin/login", validate(loginSchema), authController.adminLogin);
router.post("/staff/login", validate(loginSchema), authController.staffLogin);

// Staff registration
router.post(
  "/staff/register",
  validate(createStaffSchema),
  authController.staffRegister
);

// Password recovery
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword
);

// Authenticated session routes
router.get("/me", authenticate, authController.me);
router.post("/logout", authenticate, authController.logout);

export default router;
