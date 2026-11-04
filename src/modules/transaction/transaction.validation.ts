import Joi from "joi";

export const AUTH_CODE_PATTERN = /^[A-Z0-9]{6}$/;
export const MIN_TRANSACTION_AMOUNT = 100;

export interface SubmitTransactionInput {
  merchantId: string;
  authCode: string;
  transactionAmount: number;
}

export interface GetTransactionsQuery {
  page?: number;
  limit?: number;
  month?: string;
  status?: "all" | "pending" | "approved" | "rejected";
  search?: string;
}

export const getTransactionsQuerySchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1).optional().messages({
      "number.base": "Page must be a number",
      "number.min": "Page must be at least 1",
    }),
    limit: Joi.number().integer().min(1).max(50).default(10).optional().messages({
      "number.base": "Limit must be a number",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit must be at most 50",
    }),
    month: Joi.string()
      .trim()
      .pattern(/^\d{4}-(0[1-9]|1[0-2])$/)
      .optional()
      .messages({
        "string.pattern.base": "month must be in YYYY-MM format",
      }),
    status: Joi.string()
      .trim()
      .lowercase()
      .valid("all", "pending", "approved", "rejected")
      .default("all")
      .optional()
      .messages({
        "any.only": "Status must be 'all', 'pending', 'approved', or 'rejected'",
      }),
    search: Joi.string().trim().max(100).allow("").optional(),
  }).optional(),
});

export const submitTransactionSchema = Joi.object({
  body: Joi.object({
    merchantId: Joi.string().pattern(/^\d+$/).required().messages({
      "string.pattern.base": "Merchant ID must be a numeric string",
      "string.empty": "Merchant ID is required",
      "any.required": "Merchant ID is required",
    }),
    authCode: Joi.string()
      .trim()
      .uppercase()
      .pattern(AUTH_CODE_PATTERN)
      .required()
      .messages({
        "string.pattern.base": "Use exactly 6 letters or numbers. No symbols.",
        "string.empty": "Approval code is required",
        "any.required": "Approval code is required",
      }),
    transactionAmount: Joi.number()
      .precision(2)
      .min(MIN_TRANSACTION_AMOUNT)
      .max(9999999999.99)
      .required()
      .messages({
        "number.base": "Transaction amount must be a number",
        "number.min": `Enter AED ${MIN_TRANSACTION_AMOUNT} or more to qualify.`,
        "any.required": "Transaction amount is required",
      }),
  }).required(),
});

