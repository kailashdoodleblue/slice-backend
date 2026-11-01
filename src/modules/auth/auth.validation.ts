import Joi from "joi";

export interface LoginInput {
  email: string;
  password: string;
}

export const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().trim().email().required().messages({
      "string.email": "Invalid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),
    password: Joi.string().required().messages({
      "string.empty": "Password is required",
      "any.required": "Password is required",
    }),
  }).required(),
});

