import { Request, Response } from "express";
import { faqService } from "./faq.service";
import { sendResponse } from "../../utils/response";

export class FAQController {
  createFAQ = async (req: Request, res: Response) => {
    const faq = await faqService.createFAQ(req.body);
    return sendResponse(res, {
      statusCode: 201,
      message: "FAQ created successfully",
      data: faq,
    });
  };

  getAllFAQs = async (_req: Request, res: Response) => {
    const faqs = await faqService.getAllFAQs();
    return sendResponse(res, {
      message: "FAQs retrieved successfully",
      data: faqs,
    });
  };

  getFAQById = async (req: Request, res: Response) => {
    const faq = await faqService.getFAQById(req.params.id);
    return sendResponse(res, {
      message: "FAQ retrieved successfully",
      data: faq,
    });
  };

  updateFAQ = async (req: Request, res: Response) => {
    const faq = await faqService.updateFAQ(req.params.id, req.body);
    return sendResponse(res, {
      message: "FAQ updated successfully",
      data: faq,
    });
  };

  deleteFAQ = async (req: Request, res: Response) => {
    await faqService.deleteFAQ(req.params.id);
    return sendResponse(res, {
      message: "FAQ deleted successfully",
    });
  };
}

export const faqController = new FAQController();

