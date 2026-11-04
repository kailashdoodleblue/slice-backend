import Joi from "joi";

export interface StaffDashboardQuery {
  incentiveMonth?: string;
  performanceMonth?: string;
}

const monthField = (label: string) =>
  Joi.string()
    .trim()
    .pattern(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional()
    .messages({
      "string.pattern.base": `${label} must be in YYYY-MM format`,
    });

export const staffDashboardSchema = Joi.object({
  query: Joi.object({
    incentiveMonth: monthField("incentiveMonth"),
    performanceMonth: monthField("performanceMonth"),
  }).required(),
});

