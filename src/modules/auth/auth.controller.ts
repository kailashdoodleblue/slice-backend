import { Request, Response } from "express";
import { authService } from "./auth.service";
import { sendResponse } from "../../utils/response";

export class AuthController {

  adminLogin = async (req: Request, res: Response) => {
    const result = await authService.adminLogin(req.body);
    return sendResponse(res, {
      message: "Admin login successful",
      data: result,
    });
  };

  staffLogin = async (req: Request, res: Response) => {
    const result = await authService.staffLogin(req.body);
    return sendResponse(res, {
      message: "Staff login successful",
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

  forgotPassword = async (req: Request, res: Response) => {
    const result = await authService.forgotPassword(req.body);
    return sendResponse(res, {
      message: "Password reset link has been sent to your email",
      data: result,
    });
  };

  resetPassword = async (req: Request, res: Response) => {
    const result = await authService.resetPassword(req.body);
    return sendResponse(res, {
      message: result.message,
    });
  };
}

export const authController = new AuthController();
