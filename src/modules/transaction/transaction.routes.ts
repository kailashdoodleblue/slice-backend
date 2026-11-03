import { Router } from "express";
import { transactionController } from "./transaction.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { UserRole } from "../../constants";
import { submitTransactionSchema } from "./transaction.validation";

const router = Router();

router.use(authenticate, authorize(UserRole.STAFF));

router.post(
  "/",
  validate(submitTransactionSchema),
  transactionController.submitTransaction
);

export default router;

