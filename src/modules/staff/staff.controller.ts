import { Request, Response } from "express";
import { staffService } from "./staff.service";
import { sendResponse } from "../../utils/response";

export class StaffController {
  getAllStaff = async (req: Request, res: Response) => {
    const { staff, meta } = await staffService.getAllStaff(req.query);
    return sendResponse(res, {
      message: "Staff list retrieved successfully",
      data: staff,
      meta,
    });
  };

  getStaffById = async (req: Request, res: Response) => {
    const staff = await staffService.getStaffById(req.params.id);
    return sendResponse(res, {
      message: "Staff details retrieved successfully",
      data: staff,
    });
  };

  updateStaff = async (req: Request, res: Response) => {
    const staff = await staffService.updateStaff(req.params.id, req.body);
    return sendResponse(res, {
      message: "Staff updated successfully",
      data: staff,
    });
  };

  updateStatus = async (req: Request, res: Response) => {
    const staff = await staffService.updateStaffStatus(
      req.params.id,
      req.body.status
    );
    return sendResponse(res, {
      message: "Staff status updated successfully",
      data: staff,
    });
  };
}

export const staffController = new StaffController();
