import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../entities/user.entity";
import { UserStatus } from "../constants";
import { AppError } from "../utils/AppError";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw AppError.unauthorized("Authentication token required");
  }

  const token = authHeader.split(" ")[1];

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, env.jwt.secret) as JwtPayload;
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      throw AppError.unauthorized("Authentication token has expired");
    }
    throw AppError.unauthorized("Invalid authentication token");
  }

  const user = await User.findOne({
    where: { id: payload.id },
    relations: ["staff", "staff.merchant"],
  });

  if (!user) {
    throw AppError.unauthorized("User account no longer exists");
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw AppError.forbidden("Account is inactive. Please contact your administrator.");
  }

  req.user = user;
  next();
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized("Authentication required");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw AppError.forbidden("Access denied: insufficient permissions");
    }

    next();
  };
};
