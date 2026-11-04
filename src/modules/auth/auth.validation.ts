import Joi from "joi";

export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ForgotPasswordInput {
  email: string;
  portal?: "admin" | "staff";
}

export interface ResetPasswordInput {
  token: string;
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
    rememberMe: Joi.boolean().optional(),
    remindMe: Joi.boolean().optional(),
  }).required(),
});

export const forgotPasswordSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().trim().email().required().messages({
      "string.email": "Invalid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),
    portal: Joi.string()
      .trim()
      .lowercase()
      .valid("admin", "staff")
      .optional()
      .messages({
        "any.only": "Portal must be either 'admin' or 'staff'",
      }),
  }).required(),
});

export const resetPasswordSchema = Joi.object({
  body: Joi.object({
    token: Joi.string().trim().required().messages({
      "string.empty": "Reset token is required",
      "any.required": "Reset token is required",
    }),
    password: Joi.string().min(6).max(100).required().messages({
      "string.min": "Password must be at least 6 characters long",
      "string.empty": "Password is required",
      "any.required": "Password is required",
    }),
  }).required(),
});
