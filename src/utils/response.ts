import { Response } from "express";

export interface ApiResponseOptions<T = unknown> {
  statusCode?: number;
  message?: string;
  data?: T;
  meta?: object;
}

export const sendResponse = <T>(
  res: Response,
  options: ApiResponseOptions<T>
): Response => {
  const { statusCode = 200, message = "Success", data, meta } = options;
  const isSuccess = statusCode >= 200 && statusCode < 300;

  return res.status(statusCode).json({
    success: isSuccess,
    message,
    ...(data !== undefined && { data }),
    ...(meta !== undefined && { meta }),
  });
};

