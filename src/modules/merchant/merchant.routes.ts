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
  getMerchantsQuerySchema,
} from "./merchant.validation";

const router = Router();

// Public endpoints (no authentication required)
router.get("/dropdown", merchantController.getMerchantDropdown);
router.get("/locations", merchantController.getLocationDropdown);

// Admin-only merchant management
router.use(authenticate, authorize(UserRole.ADMIN));

router.post("/", validate(createMerchantSchema), merchantController.createMerchant);
router.get("/", validate(getMerchantsQuerySchema), merchantController.getMerchants);
router.get("/:id", validate(merchantIdParamSchema), merchantController.getMerchantById);
router.put("/:id", validate(updateMerchantSchema), merchantController.updateMerchant);
router.patch(
  "/:id/status",
  validate(updateMerchantStatusSchema),
  merchantController.updateStatus
);

export default router;
