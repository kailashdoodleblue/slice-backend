import { Router } from "express";
import { authController } from "./auth.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { loginSchema } from "./auth.validation";

const router = Router();

router.post("/login", validate(loginSchema), authController.login);
router.get("/me", authenticate, authController.me);
router.post("/logout", authenticate, authController.logout);

export default router;

