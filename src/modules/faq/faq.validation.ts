import Joi from "joi";

export interface CreateFAQInput {
  question: string;
  answer: string;
}

export interface UpdateFAQInput {
  question?: string;
  answer?: string;
}

export const createFAQSchema = Joi.object({
  body: Joi.object({
    question: Joi.string().trim().required().messages({
      "string.empty": "Question is required",
      "any.required": "Question is required",
    }),
    answer: Joi.string().trim().required().messages({
      "string.empty": "Answer is required",
      "any.required": "Answer is required",
    }),
  }).required(),
});

export const updateFAQSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().pattern(/^\d+$/).required().messages({
      "string.pattern.base": "ID must be a numeric string",
    }),
  }).required(),
  body: Joi.object({
    question: Joi.string().trim().optional(),
    answer: Joi.string().trim().optional(),
  })
    .min(1)
    .required()
    .messages({
      "object.min": "At least one field (question or answer) must be provided for update",
    }),
});

export const faqIdParamSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().pattern(/^\d+$/).required().messages({
      "string.pattern.base": "ID must be a numeric string",
    }),
  }).required(),
});

