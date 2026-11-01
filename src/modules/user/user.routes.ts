import { Router } from "express";
import { userController } from "./user.controller";
import { validate } from "../../middlewares/validate.middleware";
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
} from "./user.validation";

const router = Router();

router.get("/", userController.getUsers);
router.get("/:id", validate(userIdParamSchema), userController.getUserById);
router.post("/", validate(createUserSchema), userController.createUser);
router.put("/:id", validate(updateUserSchema), userController.updateUser);
router.delete("/:id", validate(userIdParamSchema), userController.deleteUser);

export default router;
