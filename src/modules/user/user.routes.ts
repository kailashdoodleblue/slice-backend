import { Router } from "express";
import { userController } from "./user.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { UserRole } from "../../constants";
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
} from "./user.validation";

const router = Router();

//router.use(authenticate, authorize(UserRole.ADMIN));

router.get("/", userController.getUsers);
router.get("/:id", validate(userIdParamSchema), userController.getUserById);
router.post("/", validate(createUserSchema), userController.createUser);
router.put("/:id", validate(updateUserSchema), userController.updateUser);
router.delete("/:id", validate(userIdParamSchema), userController.deleteUser);

export default router;
