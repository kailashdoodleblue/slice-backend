import { randomBytes } from "crypto";
import { AppDataSource } from "../../config/data-source";
import { Merchant } from "../../entities/merchant.entity";
import { Staff } from "../../entities/staff.entity";
import { Transaction } from "../../entities/transaction.entity";
import { MerchantStatus } from "../../constants";
import { AppError } from "../../utils/AppError";
import { SubmitTransactionInput } from "./transaction.validation";

const CURRENCY = "AED";
const REF_PREFIX = "TX-";
const REF_BASE = 1000;

export type TransactionStatus = "pending" | "approved" | "rejected";

export const getTransactionStatus = (tx: Transaction): TransactionStatus => {
  if (tx.approvalStatus) return "approved";
  return tx.remarks ? "rejected" : "pending";
};

const STATUS_NOTES: Record<TransactionStatus, string> = {
  pending: "Awaiting review · Not included in your balance.",
  approved: "Approved · Included in your balance.",
  rejected: "Rejected",
};

/** incentive = amount * (merchant percentage / 100), rounded to 2 decimals */
export const calculateIncentive = (amount: number, percentage: number): number =>
  Math.round(amount * percentage) / 100;

const isDuplicateEntryError = (err: any): boolean =>
  err?.code === "ER_DUP_ENTRY" || err?.driverError?.code === "ER_DUP_ENTRY";

export class TransactionService {
  async submitTransaction(userId: string, input: SubmitTransactionInput) {
    console.log("IN THIS FUNCTION ",userId)
    // 1. Resolve the staff profile of the logged-in user
    const staff = await Staff.findOneBy({ userId });
    console.log("Staff:", staff)
    if (!staff) {
      throw AppError.forbidden("Only staff members can submit transactions");
    }

    // 2. Merchant must exist, be active and be the staff's own merchant
    const merchant = await Merchant.findOneBy({ id: input.merchantId });
    if (!merchant) {
      throw AppError.notFound("Merchant not found");
    }
    if (merchant.status !== MerchantStatus.ACTIVE) {
      throw AppError.badRequest("Selected merchant is inactive");
    }
    if (String(staff.merchantId) !== String(merchant.id)) {
      throw AppError.forbidden("You are not assigned to this merchant");
    }

    // 3. An approval code can only be claimed once
    await this.assertAuthCodeUnclaimed(input.authCode);

    // 4. Calculate incentive from the merchant's percentage
    const incentive = calculateIncentive(
      input.transactionAmount,
      Number(merchant.incentivePercentage)
    );

    // 5. Persist (ref id is derived from the generated primary key)
    let saved: Transaction;
    try {
      saved = await AppDataSource.transaction(async (manager) => {
        const repo = manager.getRepository(Transaction);
        const tx = await repo.save(
          repo.create({
            refId: `TMP-${randomBytes(8).toString("hex")}`,
            authorizationCode: input.authCode,
            staffId: staff.staffId,
            merchantId: merchant.id,
            transactionAmount: input.transactionAmount,
            incentive,
            approvalStatus: false,
            remarks: null,
          })
        );
        tx.refId = `${REF_PREFIX}${REF_BASE + Number(tx.id)}`;
        return repo.save(tx);
      });
    } catch (err) {
      // Concurrent request claimed the same code between check and insert
      if (isDuplicateEntryError(err)) {
        await this.assertAuthCodeUnclaimed(input.authCode);
      }
      throw err;
    }

    const status = getTransactionStatus(saved);
    return {
      id: saved.id,
      reference: saved.refId,
      authCode: saved.authorizationCode,
      status,
      submittedAt: saved.createdAt,
      transactionAmount: saved.transactionAmount,
      currency: CURRENCY,
      incentiveAmount: saved.incentive,
      note: STATUS_NOTES[status],
      rejectionReason: saved.remarks,
    };
  }

  private async assertAuthCodeUnclaimed(authCode: string): Promise<void> {
    const existing = await Transaction.findOneBy({ authorizationCode: authCode });
    if (!existing) return;

    throw AppError.conflict("Transaction already submitted", {
      code: "TRANSACTION_ALREADY_CLAIMED",
      errors: { authCode: ["This Approval code has already been claimed."] },
      existingTransaction: {
        reference: existing.refId,
        authCode: existing.authorizationCode,
        status: getTransactionStatus(existing),
        submittedAt: existing.createdAt,
      },
    });
  }
}

export const transactionService = new TransactionService();

