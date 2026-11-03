import Joi from "joi";

export const AUTH_CODE_PATTERN = /^[A-Z0-9]{6}$/;
export const MIN_TRANSACTION_AMOUNT = 100;

export interface SubmitTransactionInput {
  merchantId: string;
  authCode: string;
  transactionAmount: number;
}

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

