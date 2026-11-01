import { Request, Response, NextFunction } from "express";
import Joi from "joi";

export const validate =
  (schema: Joi.ObjectSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(
      {
        body: req.body,
        query: req.query,
        params: req.params,
      },
      {
        abortEarly: false,
        allowUnknown: true,
      }
    );

    if (error) {
      return next(error);
    }

    if (value.body !== undefined) req.body = value.body;
    if (value.query !== undefined) req.query = value.query;
    if (value.params !== undefined) req.params = value.params;

    next();
  };
