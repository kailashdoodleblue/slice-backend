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
}

export const transactionController = new TransactionController();

