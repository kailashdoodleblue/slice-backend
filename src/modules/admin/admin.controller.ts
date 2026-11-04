import { Request, Response } from "express";
import { adminService } from "./admin.service";
import { sendResponse } from "../../utils/response";

export class AdminController {
  getDashboardStats = async (_req: Request, res: Response) => {
    const stats = await adminService.getDashboardStats();
    return sendResponse(res, {
      message: "Admin dashboard statistics retrieved successfully",
      data: stats,
    });
  };

  getDashboardGraph = async (req: Request, res: Response) => {
    const graphData = await adminService.getIncentiveVolumeGraph(req.query);
    return sendResponse(res, {
      message: "Dashboard incentive volume graph retrieved successfully",
      data: graphData,
    });
  };

  getIncentiveDistribution = async (req: Request, res: Response) => {
    const distribution = await adminService.getIncentiveDistribution(req.query);
    return sendResponse(res, {
      message: "Dashboard incentive distribution retrieved successfully",
      data: distribution,
    });
  };

  getMerchantDropdown = async (_req: Request, res: Response) => {
    const merchants = await adminService.getMerchantDropdown();
    return sendResponse(res, {
      message: "Merchant dropdown list retrieved successfully",
      data: merchants,
    });
  };
}

export const adminController = new AdminController();
