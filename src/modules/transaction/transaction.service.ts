import { randomBytes } from "crypto";
import { AppDataSource } from "../../config/data-source";
import { Merchant } from "../../entities/merchant.entity";
import { Staff } from "../../entities/staff.entity";
import { Transaction } from "../../entities/transaction.entity";
import { MerchantStatus } from "../../constants";
import { AppError } from "../../utils/AppError";
import { getPaginationMeta } from "../../utils/pagination";
import {
  SubmitTransactionInput,
  GetTransactionsQuery,
} from "./transaction.validation";

const CURRENCY = "AED";
const REF_PREFIX = "TX-";
const REF_BASE = 1000;
const GST_OFFSET_MS = 4 * 60 * 60 * 1000;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const currentMonthGst = (): string => {
  const d = new Date(Date.now() + GST_OFFSET_MS);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

const monthKeyGst = (date: Date): string => {
  const d = new Date(date.getTime() + GST_OFFSET_MS);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

const monthNameGst = (date: Date): string => {
  const gst = new Date(date.getTime() + GST_OFFSET_MS);
  return MONTH_NAMES[gst.getUTCMonth()];
};

const monthRange = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1) - GST_OFFSET_MS);
  const end = new Date(Date.UTC(y, m, 1) - GST_OFFSET_MS);
  return { start, end };
};

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
    console.log("IN THIS FUNCTION ", userId);
    // 1. Resolve the staff profile of the logged-in user
    const staff = await Staff.findOneBy({ userId });
    console.log("Staff:", staff);
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

  async getAllTransactions(userId: string, query: GetTransactionsQuery = {}) {
    const staff = await Staff.findOneBy({ userId });
    if (!staff) {
      throw AppError.forbidden("Only staff members can view transactions");
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const status = query.status ? query.status.toLowerCase() : "all";
    const search = query.search ? query.search.trim() : undefined;
    const month = query.month ? query.month.trim() : undefined;

    const qb = Transaction.createQueryBuilder("t").where(
      "t.staffId = :staffId",
      { staffId: staff.staffId }
    );

    if (month) {
      const { start, end } = monthRange(month);
      qb.andWhere("t.createdAt >= :start AND t.createdAt < :end", {
        start,
        end,
      });
    }

    if (status === "approved") {
      qb.andWhere("t.approvalStatus = 1");
    } else if (status === "pending") {
      qb.andWhere("t.approvalStatus = 0 AND t.remarks IS NULL");
    } else if (status === "rejected") {
      qb.andWhere("t.approvalStatus = 0 AND t.remarks IS NOT NULL");
    }

    if (search) {
      qb.andWhere(
        "(LOWER(t.authorizationCode) LIKE :search OR LOWER(t.refId) LIKE :search)",
        { search: `%${search.toLowerCase()}%` }
      );
    }

    qb.orderBy("t.createdAt", "DESC").addOrderBy("t.id", "DESC");
    qb.skip(skip).take(limit);

    const [rows, total] = await qb.getManyAndCount();
    const curMonth = currentMonthGst();

    const items = rows.map((tx) => {
      const txStatus = getTransactionStatus(tx);
      const txMonth = monthKeyGst(tx.createdAt);
      const isPastMonth = txMonth < curMonth;

      const note =
        txStatus === "pending"
          ? "Awaiting review · Not included in your balance."
          : txStatus === "approved"
          ? `Included in ${monthNameGst(tx.createdAt)} earnings · ${
              isPastMonth ? "Settled." : "Awaiting settlement."
            }`
          : null;

      return {
        id: `tx-${tx.id}`,
        reference: tx.refId,
        authCode: tx.authorizationCode,
        status: txStatus,
        submittedAt: tx.createdAt,
        transactionAmount: tx.transactionAmount,
        currency: CURRENCY,
        incentiveAmount: txStatus === "rejected" ? 0 : tx.incentive,
        note,
        rejectionReason: txStatus === "rejected" ? tx.remarks : null,
      };
    });

    return {
      defaultMonth: curMonth,
      items,
      meta: getPaginationMeta(total, page, limit),
    };
  }

  private async assertAuthCodeUnclaimed(authCode: string): Promise<void> {
    const existing = await Transaction.findOneBy({ authorizationCode: authCode });
    if (!existing) return;

    throw AppError.conflict("Transaction already claimed", {
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
