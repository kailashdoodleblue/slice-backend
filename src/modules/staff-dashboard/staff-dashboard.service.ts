import { AppError } from "../../utils/AppError";
import { Staff } from "../../entities/staff.entity";
import { Transaction } from "../../entities/transaction.entity";
import {
  getTransactionStatus,
  calculateIncentive,
} from "../transaction/transaction.service";

const CURRENCY = "AED";
const RECENT_LIMIT = 5;
const GST_OFFSET_MS = 4 * 60 * 60 * 1000;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const currentMonthGst = (): string => {
  const d = new Date(Date.now() + GST_OFFSET_MS);
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

export class StaffDashboardService {
  async getDashboard(userId: string, requestedMonth?: string) {
    const staff = await Staff.findOne({
      where: { userId },
      relations: ["merchant"],
    });

    if (!staff) {
      throw AppError.forbidden("Only staff members can access the dashboard");
    }

    const curMonth = currentMonthGst();
    const month = requestedMonth ?? curMonth;
    const isPastMonth = month < curMonth;

    const [monthStats, recentRows] = await Promise.all([
      this.getStats(staff.staffId, month),
      this.getRecentTransactions(userId),
    ]);

    const percentage = staff.merchant
      ? Number(staff.merchant.incentivePercentage)
      : 0;

    return {
      staff: {
        staffId: staff.staffId,
        staffName: staff.fullName,
        incentivePercentage: percentage,
      },
      merchant: staff.merchant
        ? {
            id: staff.merchant.id,
            businessName: staff.merchant.businessName,
          }
        : null,
      month: {
        key: month,
        isPastMonth,
      },
      stats: {
        currency: CURRENCY,
        incentiveAmount: monthStats.incentiveAmount,
        volume: monthStats.volume,
        submitted: monthStats.submitted,
        approvedCount: monthStats.approvedCount,
        pendingCount: monthStats.pendingCount,
      },
      recentTransactions: recentRows,
    };
  }

  /**
   * Aggregates one staff member's transactions for a month.
   * - approved: approvalStatus = 1
   * - pending:  not approved and no remarks
   * - rejected: not approved with remarks (excluded from incentive/volume/submitted)
   */
  private async getStats(staffId: string, month: string) {
    const { start, end } = monthRange(month);

    const raw = await Transaction.createQueryBuilder("t")
      .select(
        "COALESCE(SUM(CASE WHEN t.approvalStatus = 1 OR t.remarks IS NULL THEN t.incentive ELSE 0 END), 0)",
        "incentiveAmount"
      )
      .addSelect("COALESCE(SUM(t.approvalStatus = 1), 0)", "approvedCount")
      .addSelect(
        "COALESCE(SUM(t.approvalStatus = 0 AND t.remarks IS NULL), 0)",
        "pendingCount"
      )
      .addSelect(
        "COALESCE(SUM(CASE WHEN t.approvalStatus = 1 OR t.remarks IS NULL THEN t.transactionAmount ELSE 0 END), 0)",
        "volume"
      )
      .addSelect(
        "COALESCE(SUM(t.approvalStatus = 1 OR t.remarks IS NULL), 0)",
        "submitted"
      )
      .where("t.staffId = :staffId", { staffId })
      .andWhere("t.createdAt >= :start AND t.createdAt < :end", { start, end })
      .getRawOne();

    return {
      incentiveAmount: Number(raw?.incentiveAmount ?? 0),
      approvedCount: Number(raw?.approvedCount ?? 0),
      pendingCount: Number(raw?.pendingCount ?? 0),
      volume: Number(raw?.volume ?? 0),
      submitted: Number(raw?.submitted ?? 0),
    };
  }

  async getRecentTransactions(userId: string) {
    const staff = await Staff.findOneBy({ userId });
    if (!staff) {
      throw AppError.forbidden("Only staff members can view recent transactions");
    }

    const rows = await Transaction.find({
      where: { staffId: staff.staffId },
      order: { createdAt: "DESC", id: "DESC" },
      take: RECENT_LIMIT,
    });

    return rows.map((tx) => {
      const status = getTransactionStatus(tx);
      const note =
        status === "pending"
          ? "Awaiting review · Not included in your balance."
          : status === "approved"
          ? `Included in ${monthNameGst(tx.createdAt)} earnings · Awaiting settlement.`
          : null;

      return {
        id: `tx-${tx.id}`,
        reference: tx.refId,
        authCode: tx.authorizationCode,
        status,
        submittedAt: tx.createdAt,
        transactionAmount: tx.transactionAmount,
        incentiveAmount: status === "rejected" ? 0 : tx.incentive,
        note,
        rejectionReason: status === "rejected" ? tx.remarks : null,
      };
    });
  }
}

export const staffDashboardService = new StaffDashboardService();
