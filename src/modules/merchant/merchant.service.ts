import { Merchant } from "../../entities/merchant.entity";
import { Staff } from "../../entities/staff.entity";
import { AppError } from "../../utils/AppError";
import { getPaginationMeta } from "../../utils/pagination";
import {
  CreateMerchantInput,
  UpdateMerchantInput,
  GetMerchantsQuery,
} from "./merchant.validation";

export class MerchantService {
  private async generateMerchantCode(): Promise<string> {
    const lastMerchant = await Merchant.findOne({
      where: {},
      order: { id: "DESC" },
    });

    if (!lastMerchant || !lastMerchant.merchantCode) {
      return "MRC-0001";
    }

    const match = lastMerchant.merchantCode.match(/\d+$/);
    const nextNumber = match ? parseInt(match[0], 10) + 1 : 1;
    return `MRC-${nextNumber.toString().padStart(4, "0")}`;
  }

  async createMerchant(input: CreateMerchantInput): Promise<Merchant> {
    const merchantCode = await this.generateMerchantCode();

    const merchant = Merchant.create({
      merchantCode,
      businessName: input.businessName,
      businessEmail: input.businessEmail,
      contactPerson: input.contactPerson || null,
      countryCode: input.countryCode || null,
      phoneNumber: input.phoneNumber || null,
      businessType: input.businessType || null,
      countryMarket: input.countryMarket || null,
      registrationNumber: input.registrationNumber || null,
      website: input.website || null,
      addressLine1: input.addressLine1 || null,
      addressLine2: input.addressLine2 || null,
      city: input.city || null,
      postalCode: input.postalCode || null,
      status: input.status || "Active",
    });

    return merchant.save();
  }

  async getAllMerchants(query: GetMerchantsQuery = {}) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 7;
    const skip = (page - 1) * limit;

    const status = query.status ? query.status.toLowerCase() : "all";
    const search = query.search ? query.search.trim() : undefined;

    const qb = Merchant.createQueryBuilder("merchant");

    // Filter by status: 'all' (default), 'active', or 'inactive'
    if (status === "active") {
      qb.andWhere("LOWER(merchant.status) = :status", { status: "active" });
    } else if (status === "inactive") {
      qb.andWhere("LOWER(merchant.status) = :status", { status: "inactive" });
    }

    // Filter by search: matches merchant name, registration code, location, or primary contact
    if (search) {
      qb.andWhere(
        "(LOWER(merchant.businessName) LIKE :search OR " +
          "LOWER(merchant.merchantCode) LIKE :search OR " +
          "LOWER(merchant.registrationNumber) LIKE :search OR " +
          "LOWER(merchant.city) LIKE :search OR " +
          "LOWER(merchant.addressLine1) LIKE :search OR " +
          "LOWER(merchant.countryMarket) LIKE :search OR " +
          "LOWER(merchant.contactPerson) LIKE :search OR " +
          "LOWER(merchant.businessEmail) LIKE :search OR " +
          "LOWER(merchant.phoneNumber) LIKE :search)",
        { search: `%${search.toLowerCase()}%` }
      );
    }

    qb.orderBy("merchant.id", "DESC");
    qb.skip(skip).take(limit);

    const [merchants, total] = await qb.getManyAndCount();

    // Query staff count per merchant for the paginated page items
    const merchantIds = merchants.map((m) => m.id);
    const staffCounts = merchantIds.length
      ? await Staff.createQueryBuilder("staff")
          .select("staff.merchantId", "merchantId")
          .addSelect("COUNT(staff.staffId)", "count")
          .where("staff.merchantId IN (:...merchantIds)", { merchantIds })
          .groupBy("staff.merchantId")
          .getRawMany()
      : [];

    const countMap = new Map(
      staffCounts.map((item) => [String(item.merchantId), Number(item.count)])
    );

    const formattedMerchants = merchants.map((m) => ({
      ...m,
      staffCount: countMap.get(String(m.id)) || 0,
    }));

    return {
      merchants: formattedMerchants,
      meta: getPaginationMeta(total, page, limit),
    };
  }

  async getMerchantById(id: string) {
    const merchant = await Merchant.findOne({
      where: { id },
      relations: ["staff"],
    });

    if (!merchant) {
      throw AppError.notFound("Merchant not found");
    }

    return {
      ...merchant,
      staffCount: merchant.staff ? merchant.staff.length : 0,
    };
  }

  async updateMerchant(id: string, input: UpdateMerchantInput): Promise<Merchant> {
    const merchant = await Merchant.findOneBy({ id });
    if (!merchant) {
      throw AppError.notFound("Merchant not found");
    }

    if (input.businessName !== undefined) merchant.businessName = input.businessName;
    if (input.businessEmail !== undefined) merchant.businessEmail = input.businessEmail;
    if (input.contactPerson !== undefined) merchant.contactPerson = input.contactPerson || null;
    if (input.phoneNumber !== undefined) merchant.phoneNumber = input.phoneNumber || null;
    if (input.businessType !== undefined) merchant.businessType = input.businessType || null;
    if (input.countryMarket !== undefined) merchant.countryMarket = input.countryMarket || null;
    if (input.registrationNumber !== undefined) merchant.registrationNumber = input.registrationNumber || null;
    if (input.website !== undefined) merchant.website = input.website || null;
    if (input.addressLine1 !== undefined) merchant.addressLine1 = input.addressLine1 || null;
    if (input.addressLine2 !== undefined) merchant.addressLine2 = input.addressLine2 || null;
    if (input.city !== undefined) merchant.city = input.city || null;
    if (input.postalCode !== undefined) merchant.postalCode = input.postalCode || null;
    if (input.status !== undefined) merchant.status = input.status;

    return merchant.save();
  }

  async updateMerchantStatus(id: string, status: string): Promise<Merchant> {
    const merchant = await Merchant.findOneBy({ id });
    if (!merchant) {
      throw AppError.notFound("Merchant not found");
    }
    merchant.status = status;
    return merchant.save();
  }

  async getTotalMerchantCount(): Promise<number> {
    const count = await Merchant.count();
    if (count === 0) {
      return 0;
    }
    return count;
  }

  async getTotalActiveMerchant(): Promise<number> {
    const count = await Merchant.count({
      where: { status: "Active" },
    });
    if (count === 0) {
      return 0;
    }
    return count;
  }

  async getTotalInActiveMerchant(): Promise<number> {
    const count = await Merchant.count({
      where: { status: "Inactive" },
    });
    if (count === 0) {
      return 0;
    }
    return count;
  }

   async getMerchantDropdown(): Promise<{ id: string; businessName: string }[]> {
    return Merchant.find({
      select: {
        id: true,
        businessName: true,
      },
      order: {
        businessName: "ASC",
      },
    });
  }

  async getLocationDropdown(): Promise<string[]> {
    const records = await Merchant.createQueryBuilder("merchant")
      .select("DISTINCT merchant.city", "city")
      .where("merchant.city IS NOT NULL")
      .andWhere("merchant.city != ''")
      .orderBy("merchant.city", "ASC")
      .getRawMany();

    return records.map((r: { city: string }) => r.city);
  }



}

export const merchantService = new MerchantService();
