import bcrypt from "bcryptjs";
import { EntityManager } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { User } from "../../entities/user.entity";
import { UserRole, UserStatus } from "../../constants";
import { Staff } from "../../entities/staff.entity";
import { Merchant } from "../../entities/merchant.entity";
import { AppError } from "../../utils/AppError";
import { getPaginationMeta } from "../../utils/pagination";
import {
  CreateStaffInput,
  UpdateStaffInput,
  UpdateMyProfileInput,
  ChangePasswordInput,
  GetStaffQuery,
} from "./staff.validation";

export class StaffService {
  private async generateStaffCode(manager: EntityManager): Promise<string> {
    const lastStaff = await manager
      .getRepository(Staff)
      .createQueryBuilder("staff")
      .setLock("pessimistic_write")
      .where("staff.staffCode IS NOT NULL")
      .orderBy("staff.staffCode", "DESC")
      .getOne();

    if (!lastStaff || !lastStaff.staffCode) {
      return "STF-0001";
    }

    const match = lastStaff.staffCode.match(/\d+$/);
    const nextNumber = match ? parseInt(match[0], 10) + 1 : 1;
    return `STF-${nextNumber.toString().padStart(4, "0")}`;
  }

  async createStaff(input: CreateStaffInput) {
    return AppDataSource.transaction(async (manager) => {
      // 1. Validate Merchant exists and is active
      const merchant = await manager.getRepository(Merchant).findOneBy({ id: input.merchantId });
      if (!merchant) {
        throw AppError.notFound("Merchant not found");
      }
      if (merchant.status !== "Active") {
        throw AppError.badRequest("Selected merchant is inactive");
      }

      // 2. Check whether email already exists in users table
      const existingUser = await manager.getRepository(User).findOneBy({
        email: input.email.trim().toLowerCase(),
      });
      if (existingUser) {
        throw AppError.conflict("Email is already registered");
      }

      // 3. Check whether mobile number already exists in staff table
      const existingMobile = await manager.getRepository(Staff).findOneBy({
        mobileNumber: input.mobileNumber.trim(),
      });
      if (existingMobile) {
        throw AppError.conflict("Mobile number is already registered");
      }

      // 4. Generate unique staffCode
      const staffCode = await this.generateStaffCode(manager);

      // 5. Hash the password
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // 6. Create User record with role staff
      const user = manager.getRepository(User).create({
        name: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        password: hashedPassword,
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
      });
      const savedUser = await manager.getRepository(User).save(user);

      // 7. Create Staff profile
      const staff = manager.getRepository(Staff).create({
        staffCode,
        userId: savedUser.id,
        fullName: input.fullName.trim(),
        merchantId: input.merchantId,
        countryCode: input.countryCode ? input.countryCode.trim() : "+971",
        mobileNumber: input.mobileNumber.trim(),
      });
      const savedStaff = await manager.getRepository(Staff).save(staff);

      return {
        staffId: savedStaff.staffId,
        staffCode: savedStaff.staffCode,
        fullName: savedStaff.fullName,
        countryCode: savedStaff.countryCode,
        mobileNumber: savedStaff.mobileNumber,
        user: {
          id: savedUser.id,
          name: savedUser.name,
          email: savedUser.email,
          role: savedUser.role
        }
      };
    });
  }

  async getAllStaff(query: GetStaffQuery = {}) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 7;
    const skip = (page - 1) * limit;

    const status = query.status ? query.status.toLowerCase() : "all";
    const search = query.search ? query.search.trim() : undefined;
    const merchantId = query.merchantId ? query.merchantId.trim() : undefined;

    const qb = Staff.createQueryBuilder("staff")
      .leftJoinAndSelect("staff.user", "user")
      .leftJoinAndSelect("staff.merchant", "merchant");

    // Filter by user account status: 'all' (default), 'active', or 'inactive'
    if (status === "active") {
      qb.andWhere("LOWER(user.status) = :status", { status: "active" });
    } else if (status === "inactive") {
      qb.andWhere("LOWER(user.status) = :status", { status: "inactive" });
    }

    // Filter by merchantId if provided
    if (merchantId) {
      qb.andWhere("staff.merchantId = :merchantId", { merchantId });
    }

    // Filter by search: matches staff code, full name, mobile number, country code, user email, or merchant business name
    if (search) {
      qb.andWhere(
        "(LOWER(staff.staffCode) LIKE :search OR " +
          "LOWER(staff.fullName) LIKE :search OR " +
          "LOWER(staff.mobileNumber) LIKE :search OR " +
          "LOWER(staff.countryCode) LIKE :search OR " +
          "LOWER(user.email) LIKE :search OR " +
          "LOWER(merchant.businessName) LIKE :search)",
        { search: `%${search.toLowerCase()}%` }
      );
    }

    qb.orderBy("staff.staffId", "DESC");
    qb.skip(skip).take(limit);

    const [staffList, total] = await qb.getManyAndCount();

    return {
      staff: staffList,
      meta: getPaginationMeta(total, page, limit),
    };
  }

  async getStaffById(staffId: string): Promise<Staff> {
    const staff = await Staff.findOne({
      where: { staffId },
      relations: ["user", "merchant"],
    });

    if (!staff) {
      throw AppError.notFound("Staff member not found");
    }

    return staff;
  }

  async updateStaff(staffId: string, input: UpdateStaffInput): Promise<Staff> {
    const staff = await this.getStaffById(staffId);

    if (input.mobileNumber && input.mobileNumber !== staff.mobileNumber) {
      const existing = await Staff.findOneBy({ mobileNumber: input.mobileNumber.trim() });
      if (existing && String(existing.staffId) !== String(staffId)) {
        throw AppError.conflict("Mobile number is already registered");
      }
      staff.mobileNumber = input.mobileNumber.trim();
    }

    if (input.countryCode !== undefined) {
      staff.countryCode = input.countryCode.trim();
    }

    if (input.fullName !== undefined) {
      staff.fullName = input.fullName.trim();
      const user = await User.findOneBy({ id: staff.userId });
      if (user) {
        user.name = input.fullName.trim();
        await user.save();
      }
    }

    return staff.save();
  }

  async updateStaffStatus(staffId: string, status: string): Promise<Staff> {
    const staff = await this.getStaffById(staffId);

    const user = await User.findOneBy({ id: staff.userId });
    if (!user) {
      throw AppError.notFound("Associated user record not found");
    }

    user.status = status;
    await user.save();

    return this.getStaffById(staffId);
  }

  async getMyProfile(userId: string) {
    const staff = await Staff.findOne({
      where: { userId },
      relations: ["user", "merchant"],
    });

    if (!staff) {
      throw AppError.notFound("Staff profile not found");
    }

    return {
      staffId: staff.staffId,
      staffCode: staff.staffCode,
      staffName: staff.fullName,
      email: staff.user?.email || null,
      mobileNumber: staff.mobileNumber,
      countryCode: staff.countryCode,
      merchantName: staff.merchant?.businessName || null,
      merchantCountry: staff.merchant?.countryMarket || staff.merchant?.countryCode || null,
    };
  }

  async updateMyProfile(userId: string, input: UpdateMyProfileInput) {
    return AppDataSource.transaction(async (manager) => {
      const staffRepo = manager.getRepository(Staff);
      const userRepo = manager.getRepository(User);

      // 1. Fetch current staff profile with user and merchant
      const staff = await staffRepo.findOne({
        where: { userId },
        relations: ["user", "merchant"],
      });

      if (!staff) {
        throw AppError.notFound("Staff profile not found");
      }

      // 2. Validate & update email if provided
      if (input.email !== undefined) {
        if (!staff.user) {
          throw AppError.notFound("Associated user record not found");
        }
        const cleanEmail = input.email.trim().toLowerCase();
        if (cleanEmail !== staff.user.email) {
          const existingEmail = await userRepo.findOneBy({ email: cleanEmail });
          if (existingEmail && String(existingEmail.id) !== String(userId)) {
            throw AppError.conflict("Email is already registered");
          }
          staff.user.email = cleanEmail;
          await userRepo.save(staff.user);
        }
      }

      // 3. Determine target countryCode & mobileNumber, and validate composite uniqueness
      const targetCountryCode =
        input.countryCode !== undefined ? input.countryCode.trim() : staff.countryCode;
      const targetMobileNumber =
        input.mobileNumber !== undefined ? input.mobileNumber.trim() : staff.mobileNumber;

      const isMobileChanged =
        input.mobileNumber !== undefined && targetMobileNumber !== staff.mobileNumber;
      const isCountryCodeChanged =
        input.countryCode !== undefined && targetCountryCode !== staff.countryCode;

      if (isMobileChanged || isCountryCodeChanged) {
        const existingStaff = await staffRepo.findOneBy({
          countryCode: targetCountryCode,
          mobileNumber: targetMobileNumber,
        });
        if (existingStaff && String(existingStaff.staffId) !== String(staff.staffId)) {
          throw AppError.conflict("Mobile number with this country code is already registered");
        }
        staff.countryCode = targetCountryCode;
        staff.mobileNumber = targetMobileNumber;
      }

      // 4. Update full name if provided
      if (input.fullName !== undefined) {
        staff.fullName = input.fullName.trim();
      }

      const savedStaff = await staffRepo.save(staff);

      return {
        staffId: savedStaff.staffId,
        staffCode: savedStaff.staffCode,
        staffName: savedStaff.fullName,
        email: staff.user?.email || null,
        mobileNumber: savedStaff.mobileNumber,
        countryCode: savedStaff.countryCode,
        merchantName: staff.merchant?.businessName || null,
        merchantCountry: staff.merchant?.countryMarket || staff.merchant?.countryCode || null,
      };
    });
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await User.createQueryBuilder("user")
      .where("user.id = :userId", { userId })
      .addSelect("user.password")
      .getOne();

    if (!user) {
      throw AppError.notFound("User not found");
    }

    // 1. Verify current password matches what is stored in the database
    const isCurrentMatch = await bcrypt.compare(input.currentPassword, user.password);
    if (!isCurrentMatch) {
      throw AppError.badRequest("Current password is incorrect");
    }

    // 2. Prevent reusing the same password
    const isSamePassword = await bcrypt.compare(input.newPassword, user.password);
    if (isSamePassword) {
      throw AppError.badRequest("New password cannot be the same as your current password");
    }

    // 3. Hash the new password and save
    const hashedPassword = await bcrypt.hash(input.newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return {
      id: user.id,
      message: "Your password is updated",
    };
  }
}

export const staffService = new StaffService();
