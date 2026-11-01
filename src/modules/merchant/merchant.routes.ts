import { Router } from "express";
import { merchantController } from "./merchant.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { UserRole } from "../../constants";
import {
  createMerchantSchema,
  updateMerchantSchema,
  updateMerchantStatusSchema,
  merchantIdParamSchema,
} from "./merchant.validation";

const router = Router();

router.use(authenticate, authorize(UserRole.ADMIN));

router.post("/", validate(createMerchantSchema), merchantController.createMerchant);
router.get("/", merchantController.getMerchants);
router.get("/:id", validate(merchantIdParamSchema), merchantController.getMerchantById);
router.put("/:id", validate(updateMerchantSchema), merchantController.updateMerchant);
router.patch(
  "/:id/status",
  validate(updateMerchantStatusSchema),
  merchantController.updateStatus
);

export default router;

