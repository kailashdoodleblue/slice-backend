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
}

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

