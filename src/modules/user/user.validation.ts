import Joi from "joi";

export interface CreateUserInput {
  name?: string;
  email: string;
  password?: string;
  role?: string;
  status?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  status?: string;
}

export const createUserSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().max(150).optional(),
    email: Joi.string().trim().email().max(150).required().messages({
      "string.email": "Invalid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),
    password: Joi.string().min(6).max(100).optional(),
    role: Joi.string().valid("admin", "staff").default("staff").optional(),
    status: Joi.string().valid("Active", "Inactive").default("Active").optional(),
  }).required(),
});

export const updateUserSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().pattern(/^\d+$/).required().messages({
      "string.pattern.base": "ID must be a numeric string",
    }),
  }).required(),
  body: Joi.object({
    name: Joi.string().trim().max(150).optional(),
    email: Joi.string().trim().email().max(150).optional(),
    status: Joi.string().valid("Active", "Inactive").optional(),
  })
    .min(1)
    .required()
    .messages({
      "object.min": "At least one field must be provided",
    }),
});

export const userIdParamSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().pattern(/^\d+$/).required().messages({
      "string.pattern.base": "ID must be a numeric string",
    }),
  }).required(),
});
