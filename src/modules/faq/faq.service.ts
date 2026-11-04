import { FAQ } from "../../entities/faq.entity";
import { AppError } from "../../utils/AppError";
import { CreateFAQInput, UpdateFAQInput } from "./faq.validation";

export class FAQService {
  async createFAQ(input: CreateFAQInput): Promise<FAQ> {
    const faq = FAQ.create({
      question: input.question,
      answer: input.answer,
    });
    return faq.save();
  }

  async getAllFAQs(): Promise<FAQ[]> {
    return FAQ.find({
      order: { id: "DESC" },
    });
  }

  async getFAQById(id: string): Promise<FAQ> {
    const faq = await FAQ.findOneBy({ id });
    if (!faq) {
      throw AppError.notFound("FAQ not found");
    }
    return faq;
  }

  async updateFAQ(id: string, input: UpdateFAQInput): Promise<FAQ> {
    const faq = await FAQ.findOneBy({ id });
    if (!faq) {
      throw AppError.notFound("FAQ not found");
    }

    if (input.question !== undefined) faq.question = input.question;
    if (input.answer !== undefined) faq.answer = input.answer;

    return faq.save();
  }

  async deleteFAQ(id: string): Promise<void> {
    const faq = await FAQ.findOneBy({ id });
    if (!faq) {
      throw AppError.notFound("FAQ not found");
    }

    await faq.remove();
  }
}

export const faqService = new FAQService();

