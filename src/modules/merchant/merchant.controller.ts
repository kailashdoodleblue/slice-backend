import { Request, Response } from "express";
import { merchantService } from "./merchant.service";
import { sendResponse } from "../../utils/response";

export class MerchantController {
  createMerchant = async (req: Request, res: Response) => {
    const merchant = await merchantService.createMerchant(req.body);
    return sendResponse(res, {
      statusCode: 201,
      message: "Merchant created successfully",
      data: merchant,
    });
  };

  getMerchants = async (req: Request, res: Response) => {
    const { merchants, meta } = await merchantService.getAllMerchants(req.query);
    return sendResponse(res, {
      message: "Merchants retrieved successfully",
      data: merchants,
      meta,
    });
  };

  getMerchantDropdown = async (_req: Request, res: Response) => {
    const merchants = await merchantService.getMerchantDropdown();
    return sendResponse(res, {
      message: "Merchant dropdown list retrieved successfully",
      data: merchants,
    });
  };

  getLocationDropdown = async (_req: Request, res: Response) => {
    const locations = await merchantService.getLocationDropdown();
    return sendResponse(res, {
      message: "Location dropdown list retrieved successfully",
      data: locations,
    });
  };

  getMerchantById = async (req: Request, res: Response) => {
    const merchant = await merchantService.getMerchantById(req.params.id);
    return sendResponse(res, {
      message: "Merchant retrieved successfully",
      data: merchant,
    });
  };

  updateMerchant = async (req: Request, res: Response) => {
    const merchant = await merchantService.updateMerchant(req.params.id, req.body);
    return sendResponse(res, {
      message: "Merchant updated successfully",
      data: merchant,
    });
  };

  updateStatus = async (req: Request, res: Response) => {
    const merchant = await merchantService.updateMerchantStatus(
      req.params.id,
      req.body.status
    );
    return sendResponse(res, {
      message: "Merchant status updated successfully",
      data: merchant,
    });
  };
}

export const merchantController = new MerchantController();
