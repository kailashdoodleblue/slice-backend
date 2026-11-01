import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof Joi.ValidationError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message.replace(/['"]/g, ""),
      })),
    });
    return;
  }

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  if (statusCode === 500) console.error(err);

  res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500 && env.nodeEnv === "production"
        ? "Internal server error"
        : err.message,
  });
};
