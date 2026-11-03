import Joi from "joi";

export interface CreateStaffInput {
  email: string;
  password: string;
  fullName: string;
  merchantId: string;
  mobileNumber: string;
}

export interface UpdateStaffInput {
  fullName?: string;
  mobileNumber?: string;
}

export interface GetStaffQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: "all" | "active" | "inactive";
  merchantId?: string;
}

export const getStaffQuerySchema = Joi.object({
  query: Joi.object({
    status: Joi.string()
      .trim()
      .lowercase()
      .valid("all", "active", "inactive")
      .default("all")
      .optional()
      .messages({
        "any.only": "Status must be 'all', 'active', or 'inactive'",
      }),
    search: Joi.string().trim().max(100).allow("").optional(),
    merchantId: Joi.string().pattern(/^\d+$/).optional().messages({
      "string.pattern.base": "Merchant ID must be a numeric string",
    }),
    page: Joi.number().integer().min(1).default(1).optional().messages({
      "number.base": "Page must be a number",
      "number.min": "Page must be at least 1",
    }),
    limit: Joi.number().integer().min(1).max(50).default(7).optional().messages({
      "number.base": "Limit must be a number",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit must be at most 50",
    }),
  }).optional(),
});

export const createStaffSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().trim().email().max(150).required().messages({
      "string.email": "Invalid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),
    password: Joi.string().min(6).max(100).required().messages({
      "string.min": "Password must be at least 6 characters long",
      "string.empty": "Password is required",
      "any.required": "Password is required",
    }),
    fullName: Joi.string().trim().max(150).required().messages({
      "string.empty": "Full name is required",
      "any.required": "Full name is required",
    }),
    merchantId: Joi.string().pattern(/^\d+$/).required().messages({
      "string.pattern.base": "Merchant ID must be a numeric string",
      "any.required": "Merchant ID is required",
    }),
    mobileNumber: Joi.string().trim().max(20).required().messages({
      "string.empty": "Mobile number is required",
      "any.required": "Mobile number is required",
    }),
  }).required(),
});

export const updateStaffSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().pattern(/^\d+$/).required().messages({
      "string.pattern.base": "ID must be a numeric string",
    }),
  }).required(),
  body: Joi.object({
    fullName: Joi.string().trim().max(150).optional(),
    mobileNumber: Joi.string().trim().max(20).optional(),
  })
    .min(1)
    .required()
    .messages({
      "object.min": "At least one field must be provided for update",
    }),
});

export const updateStaffStatusSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().pattern(/^\d+$/).required().messages({
      "string.pattern.base": "ID must be a numeric string",
    }),
  }).required(),
  body: Joi.object({
    status: Joi.string().valid("Active", "Inactive").required().messages({
      "any.only": "Status must be either 'Active' or 'Inactive'",
      "any.required": "Status is required",
    }),
  }).required(),
});

export const staffIdParamSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().pattern(/^\d+$/).required().messages({
      "string.pattern.base": "ID must be a numeric string",
    }),
  }).required(),
});
