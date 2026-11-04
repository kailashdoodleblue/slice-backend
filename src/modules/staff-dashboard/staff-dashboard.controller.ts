import { Request, Response } from "express";
import { staffDashboardService } from "./staff-dashboard.service";

export class StaffDashboardController {
  getDashboard = async (req: Request, res: Response) => {
    const data = await staffDashboardService.getDashboard(
      req.user!.id,
      req.query as any
    );
    return res.status(200).json({
      success: true,
      data,
    });
  };

  getRecentTransactions = async (req: Request, res: Response) => {
    const data = await staffDashboardService.getRecentTransactions(req.user!.id);
    return res.status(200).json({
      success: true,
      data,
    });
  };
}

export const staffDashboardController = new StaffDashboardController();

