import Joi from "joi";

export interface CreateMerchantInput {
  merchantCode: string;
  businessName: string;
  businessEmail: string;
  contactPerson?: string;
  phoneNumber?: string;
  businessType?: string;
  countryMarket?: string;
  registrationNumber?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  status?: string;
  incentivePercentage?: number;
}

export interface UpdateMerchantInput {
  merchantCode?: string;
  businessName?: string;
  businessEmail?: string;
  contactPerson?: string;
  phoneNumber?: string;
  businessType?: string;
  countryMarket?: string;
  registrationNumber?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  status?: string;
  incentivePercentage?: number;
}

export interface GetMerchantsQuery {
  status?: "all" | "active" | "inactive";
  search?: string;
  page?: number;
  limit?: number;
}

export const getMerchantsQuerySchema = Joi.object({
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

export const createMerchantSchema = Joi.object({
  body: Joi.object({
    merchantCode: Joi.string().trim().max(50).required().messages({
      "string.empty": "Merchant code is required",
      "any.required": "Merchant code is required",
    }),
    businessName: Joi.string().trim().max(150).required().messages({
      "string.empty": "Business name is required",
      "any.required": "Business name is required",
    }),
    businessEmail: Joi.string().trim().email().max(150).required().messages({
      "string.email": "Invalid business email address",
      "string.empty": "Business email is required",
      "any.required": "Business email is required",
    }),
    contactPerson: Joi.string().trim().max(150).allow(null, "").optional(),
    phoneNumber: Joi.string().trim().max(20).allow(null, "").optional(),
    businessType: Joi.string().trim().max(100).allow(null, "").optional(),
    countryMarket: Joi.string().trim().max(100).allow(null, "").optional(),
    registrationNumber: Joi.string().trim().max(100).allow(null, "").optional(),
    website: Joi.string().trim().max(255).allow(null, "").optional(),
    addressLine1: Joi.string().trim().max(255).allow(null, "").optional(),
    addressLine2: Joi.string().trim().max(255).allow(null, "").optional(),
    city: Joi.string().trim().max(100).allow(null, "").optional(),
    postalCode: Joi.string().trim().max(20).allow(null, "").optional(),
    status: Joi.string().valid("Active", "Inactive").default("Active").optional(),
    incentivePercentage: Joi.number().precision(2).min(0).max(100).default(0).optional().messages({
      "number.base": "Incentive percentage must be a number",
      "number.min": "Incentive percentage cannot be negative",
      "number.max": "Incentive percentage cannot exceed 100",
    }),
  }).required(),
});

export const updateMerchantSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().pattern(/^\d+$/).required().messages({
      "string.pattern.base": "ID must be a numeric string",
    }),
  }).required(),
  body: Joi.object({
    merchantCode: Joi.string().trim().max(50).optional(),
    businessName: Joi.string().trim().max(150).optional(),
    businessEmail: Joi.string().trim().email().max(150).optional(),
    contactPerson: Joi.string().trim().max(150).allow(null, "").optional(),
    phoneNumber: Joi.string().trim().max(20).allow(null, "").optional(),
    businessType: Joi.string().trim().max(100).allow(null, "").optional(),
    countryMarket: Joi.string().trim().max(100).allow(null, "").optional(),
    registrationNumber: Joi.string().trim().max(100).allow(null, "").optional(),
    website: Joi.string().trim().max(255).allow(null, "").optional(),
    addressLine1: Joi.string().trim().max(255).allow(null, "").optional(),
    addressLine2: Joi.string().trim().max(255).allow(null, "").optional(),
    city: Joi.string().trim().max(100).allow(null, "").optional(),
    postalCode: Joi.string().trim().max(20).allow(null, "").optional(),
    status: Joi.string().valid("Active", "Inactive").optional(),
    incentivePercentage: Joi.number().precision(2).min(0).max(100).optional().messages({
      "number.base": "Incentive percentage must be a number",
      "number.min": "Incentive percentage cannot be negative",
      "number.max": "Incentive percentage cannot exceed 100",
    }),
  })
    .min(1)
    .required()
    .messages({
      "object.min": "At least one field must be provided for update",
    }),
});

export const updateMerchantStatusSchema = Joi.object({
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

export const merchantIdParamSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().pattern(/^\d+$/).required().messages({
      "string.pattern.base": "ID must be a numeric string",
    }),
  }).required(),
});
