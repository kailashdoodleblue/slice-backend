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

  getMerchants = async (_req: Request, res: Response) => {
    const merchants = await merchantService.getAllMerchants();
    return sendResponse(res, {
      message: "Merchants retrieved successfully",
      data: merchants,
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

