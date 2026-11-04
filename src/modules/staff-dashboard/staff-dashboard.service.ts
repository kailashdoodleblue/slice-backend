import { Staff } from "../../entities/staff.entity";
import { Transaction } from "../../entities/transaction.entity";
import { AppError } from "../../utils/AppError";
import { getTransactionStatus } from "../transaction/transaction.service";
import { StaffDashboardQuery } from "./staff-dashboard.validation";

const CURRENCY = "AED";
const MINIMUM_APPROVED_COUNT = 10;
const TARGET = 100;
const RECENT_LIMIT = 3;
// Business timezone: GST (UTC+4). Month boundaries and cutoff follow it.
const GST_OFFSET_MS = 4 * 60 * 60 * 1000;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const monthNameGst = (date: Date): string => {
  const gst = new Date(date.getTime() + GST_OFFSET_MS);
  return MONTH_NAMES[gst.getUTCMonth()];
};

/** "YYYY-MM" for the current month in GST */
const currentMonthGst = (): string => {
  const d = new Date(Date.now() + GST_OFFSET_MS);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

/** [start, end) of the month in GST expressed as UTC dates, plus the 23:59 GST cutoff */
const monthRange = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1) - GST_OFFSET_MS);
  const end = new Date(Date.UTC(y, m, 1) - GST_OFFSET_MS);
  const cutoffAt = new Date(end.getTime() - 60 * 1000);
  return { start, end, cutoffAt };
};

export class StaffDashboardService {
  async getDashboard(userId: string, query: StaffDashboardQuery) {
    const staff = await Staff.findOneBy({ userId });
    if (!staff) {
      throw AppError.forbidden("Only staff members can view the dashboard");
    }

    const incentiveMonth = query.incentiveMonth || currentMonthGst();
    const performanceMonth = query.performanceMonth || currentMonthGst();

    const [incentive, performance] = await Promise.all([
      this.getStats(staff.staffId, incentiveMonth),
      incentiveMonth === performanceMonth
        ? undefined
        : this.getStats(staff.staffId, performanceMonth),
    ]);
    const perf = performance ?? incentive;

    // Approved count against the monthly minimum, capped at the target
    const progress = Math.min(
      TARGET,
      Math.round((perf.approvedCount / MINIMUM_APPROVED_COUNT) * TARGET)
    );

    return {
      month: incentiveMonth,
      currency: CURRENCY,
      cutoffAt: monthRange(incentiveMonth).cutoffAt.toISOString(),
      incentive: {
        amount: incentive.incentiveAmount,
        approvedCount: incentive.approvedCount,
        pendingCount: incentive.pendingCount,
        minimumApprovedCount: MINIMUM_APPROVED_COUNT,
      },
      performance: {
        transactionVolume: perf.volume,
        transactionsSubmitted: perf.submitted,
        targetProgress: { current: progress, target: TARGET },
      },
    };
  }

  /**
   * Aggregates one staff member's transactions for a month.
   * - approved: approval_status = 1
   * - pending:  not approved and no remarks
   * - rejected: not approved with remarks (excluded from incentive/volume/submitted)
   */
  private async getStats(staffId: string, month: string) {
    const { start, end } = monthRange(month);

    const raw = await Transaction.createQueryBuilder("t")
      .select(
        "COALESCE(SUM(CASE WHEN t.approval_status = 1 OR t.remarks IS NULL THEN t.incentive ELSE 0 END), 0)",
        "incentiveAmount"
      )
      .addSelect("COALESCE(SUM(t.approval_status = 1), 0)", "approvedCount")
      .addSelect(
        "COALESCE(SUM(t.approval_status = 0 AND t.remarks IS NULL), 0)",
        "pendingCount"
      )
      .addSelect(
        "COALESCE(SUM(CASE WHEN t.approval_status = 1 OR t.remarks IS NULL THEN t.transaction_amount ELSE 0 END), 0)",
        "volume"
      )
      .addSelect(
        "COALESCE(SUM(t.approval_status = 1 OR t.remarks IS NULL), 0)",
        "submitted"
      )
      .where("t.staff_id = :staffId", { staffId })
      .andWhere("t.created_at >= :start AND t.created_at < :end", { start, end })
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

