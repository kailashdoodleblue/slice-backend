import Joi from "joi";

export interface GetDashboardGraphQuery {
  merchantId?: string;
  month?: string;
  year?: number;
}

export const getDashboardGraphQuerySchema = Joi.object({
  query: Joi.object({
    merchantId: Joi.string().trim().optional(),
    month: Joi.string().trim().max(30).optional(),
    year: Joi.number().integer().min(2000).max(2100).optional(),
  }).optional(),
});

export interface GetDashboardIncentivesQuery extends GetDashboardGraphQuery {}

export const getDashboardIncentivesQuerySchema = getDashboardGraphQuerySchema;
