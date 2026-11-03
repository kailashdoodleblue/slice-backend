import { Merchant } from "../../entities/merchant.entity";
import { AppError } from "../../utils/AppError";
import { CreateMerchantInput, UpdateMerchantInput } from "./merchant.validation";

export class MerchantService {
  async createMerchant(input: CreateMerchantInput): Promise<Merchant> {
    const existing = await Merchant.findOneBy({ merchantCode: input.merchantCode });
    if (existing) {
      throw AppError.conflict("Merchant with this code already exists");
    }

    const merchant = Merchant.create({
      merchantCode: input.merchantCode,
      businessName: input.businessName,
      businessEmail: input.businessEmail,
      contactPerson: input.contactPerson || null,
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
      incentivePercentage: input.incentivePercentage ?? 0,
    });

    return merchant.save();
  }

  async getAllMerchants(): Promise<Merchant[]> {
    return Merchant.find({
      order: { id: "DESC" },
    });
  }

  async getMerchantById(id: string): Promise<Merchant> {
    const merchant = await Merchant.findOne({
      where: { id },
      relations: ["staff"],
    });

    if (!merchant) {
      throw AppError.notFound("Merchant not found");
    }

    return merchant;
  }

  async updateMerchant(id: string, input: UpdateMerchantInput): Promise<Merchant> {
    const merchant = await this.getMerchantById(id);

    if (input.merchantCode && input.merchantCode !== merchant.merchantCode) {
      const existing = await Merchant.findOneBy({ merchantCode: input.merchantCode });
      if (existing) {
        throw AppError.conflict("Merchant with this code already exists");
      }
      merchant.merchantCode = input.merchantCode;
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
    if (input.incentivePercentage !== undefined) merchant.incentivePercentage = input.incentivePercentage;

    return merchant.save();
  }

  async updateMerchantStatus(id: string, status: string): Promise<Merchant> {
    const merchant = await this.getMerchantById(id);
    merchant.status = status;
    return merchant.save();
  }
}

export const merchantService = new MerchantService();

