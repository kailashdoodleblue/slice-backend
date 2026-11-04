import { Transaction } from "../../entities/transaction.entity";
import { Merchant } from "../../entities/merchant.entity";
import { Staff } from "../../entities/staff.entity";
import { GetDashboardGraphQuery, GetDashboardIncentivesQuery } from "./admin.validation";

export interface DashboardStats {
  transactions: {
    total: number;
    pending: number;
  };
  incentives: {
    approved: number;
    pending: number;
  };
  merchants: {
    total: number;
    thisMonth: number;
  };
  staff: {
    total: number;
    thisMonth: number;
  };
}

export interface VolumeDataPoint {
  month: string;
  year: number;
  monthKey: string;
  approved: number;
  pending: number;
  total: number;
}

export interface DashboardGraphResponse {
  filter: {
    merchantId: string;
    selectedMonth: string;
    startDate: string;
    endDate: string;
  };
  volume: VolumeDataPoint[];
}

export interface IncentiveDistributionResponse {
  month: string;
  currency: string;
  totalIncentive: number;
  breakdown: {
    approved: {
      amount: number;
      percentage: number;
      count: number;
    };
    unapproved: {
      amount: number;
      percentage: number;
      count: number;
    };
    pending: {
      amount: number;
      percentage: number;
      count: number;
    };
  };
  chart: {
    label: string;
    status: "approved" | "unapproved" | "pending";
    amount: number;
    percentage: number;
    formatted: string;
  }[];
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const FULL_MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function parseTargetDate(monthStr?: string, yearNum?: number): { year: number; month: number } {
  const now = new Date();
  let targetYear = yearNum || now.getUTCFullYear();
  let targetMonth = now.getUTCMonth(); // 0 - 11

  if (monthStr) {
    const trimmed = monthStr.trim();

    // Check "YYYY-MM" format e.g. "2026-10"
    const yyyyMmMatch = trimmed.match(/^(\d{4})-(\d{1,2})$/);
    if (yyyyMmMatch) {
      targetYear = parseInt(yyyyMmMatch[1], 10);
      targetMonth = parseInt(yyyyMmMatch[2], 10) - 1;
    } else {
      // Check "Oct 2026", "October 2026", "Oct-2026"
      const parts = trimmed.split(/[\s,/-]+/);
      if (parts.length >= 2) {
        const monthPart = parts[0].toLowerCase();
        const yearPart = parseInt(parts[1], 10);
        if (!isNaN(yearPart) && yearPart >= 2000) {
          targetYear = yearPart;
        }
        const foundIdx = MONTH_NAMES.findIndex((m) =>
          m.toLowerCase().startsWith(monthPart.substring(0, 3))
        );
        if (foundIdx !== -1) {
          targetMonth = foundIdx;
        }
      } else if (!isNaN(Number(trimmed))) {
        // Just month number e.g. "10"
        const m = parseInt(trimmed, 10);
        if (m >= 1 && m <= 12) {
          targetMonth = m - 1;
        }
      } else {
        // Just month name e.g. "October" or "Oct"
        const foundIdx = MONTH_NAMES.findIndex((m) =>
          m.toLowerCase().startsWith(trimmed.toLowerCase().substring(0, 3))
        );
        if (foundIdx !== -1) {
          targetMonth = foundIdx;
        }
      }
    }
  }

  return { year: targetYear, month: targetMonth };
}

export class AdminService {
  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    // 1st day of the current calendar month at 00:00:00.000 UTC
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    // 1. Transaction stats (Total, Pending, Approved Incentive, Pending Incentive)
    const transactionStatsRaw = await Transaction.createQueryBuilder("tx")
      .select([
        "COUNT(tx.id) AS totalTransactions",
        "COUNT(CASE WHEN tx.approvalStatus = 0 AND (tx.remarks IS NULL OR tx.remarks = '') THEN 1 END) AS pendingTransactions",
        "COALESCE(SUM(CASE WHEN tx.approvalStatus = 1 THEN tx.incentive ELSE 0 END), 0) AS approvedIncentive",
        "COALESCE(SUM(CASE WHEN tx.approvalStatus = 0 AND (tx.remarks IS NULL OR tx.remarks = '') THEN tx.incentive ELSE 0 END), 0) AS pendingIncentive",
      ])
      .getRawOne();

    // 2. Merchant stats (Total, This Month Joined)
    const merchantStatsRaw = await Merchant.createQueryBuilder("m")
      .select([
        "COUNT(m.id) AS totalMerchants",
        "COUNT(CASE WHEN m.createdAt >= :startOfMonth THEN 1 END) AS thisMonthMerchants",
      ])
      .setParameter("startOfMonth", startOfMonth)
      .getRawOne();

    // 3. Staff stats (Total, This Month Joined)
    const staffStatsRaw = await Staff.createQueryBuilder("s")
      .select([
        "COUNT(s.staffId) AS totalStaff",
        "COUNT(CASE WHEN s.createdAt >= :startOfMonth THEN 1 END) AS thisMonthStaff",
      ])
      .setParameter("startOfMonth", startOfMonth)
      .getRawOne();

    return {
      transactions: {
        total: Number(transactionStatsRaw?.totalTransactions || 0),
        pending: Number(transactionStatsRaw?.pendingTransactions || 0),
      },
      incentives: {
        approved: Number(Number(transactionStatsRaw?.approvedIncentive || 0).toFixed(2)),
        pending: Number(Number(transactionStatsRaw?.pendingIncentive || 0).toFixed(2)),
      },
      merchants: {
        total: Number(merchantStatsRaw?.totalMerchants || 0),
        thisMonth: Number(merchantStatsRaw?.thisMonthMerchants || 0),
      },
      staff: {
        total: Number(staffStatsRaw?.totalStaff || 0),
        thisMonth: Number(staffStatsRaw?.thisMonthStaff || 0),
      },
    };
  }

  async getIncentiveVolumeGraph(query: GetDashboardGraphQuery = {}): Promise<DashboardGraphResponse> {
    const { year: targetYear, month: targetMonth } = parseTargetDate(query.month, query.year);

    // Build the 6-month array ending at targetYear / targetMonth
    const monthsList: { key: string; month: string; year: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(targetYear, targetMonth - i, 1));
      const mIndex = d.getUTCMonth();
      const y = d.getUTCFullYear();
      const key = `${y}-${String(mIndex + 1).padStart(2, "0")}`;
      monthsList.push({
        key,
        month: MONTH_NAMES[mIndex],
        year: y,
      });
    }

    const startDate = new Date(Date.UTC(monthsList[0].year, MONTH_NAMES.indexOf(monthsList[0].month), 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(targetYear, targetMonth + 1, 1, 0, 0, 0, 0));

    const qb = Transaction.createQueryBuilder("tx")
      .select([
        "DATE_FORMAT(tx.createdAt, '%Y-%m') AS monthKey",
        "COALESCE(SUM(CASE WHEN tx.approvalStatus = 1 THEN tx.incentive ELSE 0 END), 0) AS approved",
        "COALESCE(SUM(CASE WHEN tx.approvalStatus = 0 AND (tx.remarks IS NULL OR tx.remarks = '') THEN tx.incentive ELSE 0 END), 0) AS pending",
      ])
      .where("tx.createdAt >= :startDate AND tx.createdAt < :endDate", { startDate, endDate });

    // Optional merchant filter
    if (query.merchantId && query.merchantId !== "all") {
      qb.andWhere("tx.merchantId = :merchantId", { merchantId: query.merchantId });
    }

    qb.groupBy("monthKey").orderBy("monthKey", "ASC");

    const rawResults = await qb.getRawMany();
    const dataMap = new Map<string, { approved: number; pending: number }>();
    for (const r of rawResults) {
      dataMap.set(r.monthKey, {
        approved: Number(Number(r.approved || 0).toFixed(2)),
        pending: Number(Number(r.pending || 0).toFixed(2)),
      });
    }

    const volume: VolumeDataPoint[] = monthsList.map((m) => {
      const values = dataMap.get(m.key) || { approved: 0, pending: 0 };
      return {
        month: m.month,
        year: m.year,
        monthKey: m.key,
        approved: values.approved,
        pending: values.pending,
        total: Number((values.approved + values.pending).toFixed(2)),
      };
    });

    return {
      filter: {
        merchantId: query.merchantId || "all",
        selectedMonth: `${MONTH_NAMES[targetMonth]} ${targetYear}`,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      },
      volume,
    };
  }

  async getIncentiveDistribution(query: GetDashboardIncentivesQuery = {}): Promise<IncentiveDistributionResponse> {
    const { year: targetYear, month: targetMonth } = parseTargetDate(query.month, query.year);

    const startDate = new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(targetYear, targetMonth + 1, 1, 0, 0, 0, 0));

    const qb = Transaction.createQueryBuilder("tx")
      .select([
        "COALESCE(SUM(CASE WHEN tx.approvalStatus = 1 THEN tx.incentive ELSE 0 END), 0) AS approvedAmount",
        "COUNT(CASE WHEN tx.approvalStatus = 1 THEN 1 END) AS approvedCount",
        "COALESCE(SUM(CASE WHEN tx.approvalStatus = 0 AND (tx.remarks IS NOT NULL AND tx.remarks != '') THEN tx.incentive ELSE 0 END), 0) AS unapprovedAmount",
        "COUNT(CASE WHEN tx.approvalStatus = 0 AND (tx.remarks IS NOT NULL AND tx.remarks != '') THEN 1 END) AS unapprovedCount",
        "COALESCE(SUM(CASE WHEN tx.approvalStatus = 0 AND (tx.remarks IS NULL OR tx.remarks = '') THEN tx.incentive ELSE 0 END), 0) AS pendingAmount",
        "COUNT(CASE WHEN tx.approvalStatus = 0 AND (tx.remarks IS NULL OR tx.remarks = '') THEN 1 END) AS pendingCount",
      ])
      .where("tx.createdAt >= :startDate AND tx.createdAt < :endDate", { startDate, endDate });

    // Optional merchant filter
    if (query.merchantId && query.merchantId !== "all") {
      qb.andWhere("tx.merchantId = :merchantId", { merchantId: query.merchantId });
    }

    const raw = await qb.getRawOne();

    const approvedAmount = Number(Number(raw?.approvedAmount || 0).toFixed(2));
    const approvedCount = Number(raw?.approvedCount || 0);

    const unapprovedAmount = Number(Number(raw?.unapprovedAmount || 0).toFixed(2));
    const unapprovedCount = Number(raw?.unapprovedCount || 0);

    const pendingAmount = Number(Number(raw?.pendingAmount || 0).toFixed(2));
    const pendingCount = Number(raw?.pendingCount || 0);

    const totalIncentive = Number((approvedAmount + unapprovedAmount + pendingAmount).toFixed(2));

    const approvedPercentage =
      totalIncentive > 0 ? Number(((approvedAmount / totalIncentive) * 100).toFixed(1)) : 0;
    const unapprovedPercentage =
      totalIncentive > 0 ? Number(((unapprovedAmount / totalIncentive) * 100).toFixed(1)) : 0;
    const pendingPercentage =
      totalIncentive > 0 ? Number(((pendingAmount / totalIncentive) * 100).toFixed(1)) : 0;

    const displayMonth = `${FULL_MONTH_NAMES[targetMonth]} ${targetYear}`;

    return {
      month: displayMonth,
      currency: "AED",
      totalIncentive,
      breakdown: {
        approved: {
          amount: approvedAmount,
          percentage: approvedPercentage,
          count: approvedCount,
        },
        unapproved: {
          amount: unapprovedAmount,
          percentage: unapprovedPercentage,
          count: unapprovedCount,
        },
        pending: {
          amount: pendingAmount,
          percentage: pendingPercentage,
          count: pendingCount,
        },
      },
      chart: [
        {
          label: "Approved",
          status: "approved",
          amount: approvedAmount,
          percentage: approvedPercentage,
          formatted: `Approved: ${approvedPercentage}% (${approvedAmount.toLocaleString()})`,
        },
        {
          label: "Unapproved",
          status: "unapproved",
          amount: unapprovedAmount,
          percentage: unapprovedPercentage,
          formatted: `Unapproved: ${unapprovedPercentage}% (${unapprovedAmount.toLocaleString()})`,
        },
        {
          label: "Pending",
          status: "pending",
          amount: pendingAmount,
          percentage: pendingPercentage,
          formatted: `Pending: ${pendingPercentage}% (${pendingAmount.toLocaleString()})`,
        },
      ],
    };
  }
}

export const adminService = new AdminService();
