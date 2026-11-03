import { Router } from "express";
import { faqController } from "./faq.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { UserRole } from "../../constants";
import {
  createFAQSchema,
  updateFAQSchema,
  faqIdParamSchema,
} from "./faq.validation";

const router = Router();

// Public: Anyone can read FAQs
router.get("/", faqController.getAllFAQs);
router.get("/:id", validate(faqIdParamSchema), faqController.getFAQById);

// Admin-only: Create, Update, Delete FAQs
router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(createFAQSchema),
  faqController.createFAQ
);

router.put(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(updateFAQSchema),
  faqController.updateFAQ
);

router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(faqIdParamSchema),
  faqController.deleteFAQ
);

export default router;

