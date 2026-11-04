import { Request, Response } from "express";
import { transactionService } from "./transaction.service";
import { sendResponse } from "../../utils/response";

export class TransactionController {
  submitTransaction = async (req: Request, res: Response) => {
    const transaction = await transactionService.submitTransaction(
      req.user!.id,
      req.body
    );
    return sendResponse(res, {
      statusCode: 201,
      message: "Transaction submitted",
      data: transaction,
    });
  };

  getAllTransactions = async (req: Request, res: Response) => {
    const { defaultMonth, items, meta } =
      await transactionService.getAllTransactions(req.user!.id, req.query as any);
    return res.status(200).json({
      success: true,
      message: "Transactions retrieved successfully",
      defaultMonth,
      data: items,
      meta,
    });
  };
}

export const transactionController = new TransactionController();

