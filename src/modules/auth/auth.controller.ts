import { Request, Response } from "express";
import { authService } from "./auth.service";
import { sendResponse } from "../../utils/response";

export class AuthController {
  login = async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    return sendResponse(res, {
      message: "Login successful",
      data: result,
    });
  };

  me = async (req: Request, res: Response) => {
    const user = await authService.getProfile(req.user!.id);
    return sendResponse(res, {
      message: "User profile retrieved successfully",
      data: user,
    });
  };

  logout = async (_req: Request, res: Response) => {
    return sendResponse(res, {
      message: "Logged out successfully",
    });
  };
}

export const authController = new AuthController();

