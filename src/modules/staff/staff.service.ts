import bcrypt from "bcryptjs";
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
  GetStaffQuery,
} from "./staff.validation";

export class StaffService {
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

      // 4. Hash the password
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // 5. Create User record with role staff
      const user = manager.getRepository(User).create({
        email: input.email.trim().toLowerCase(),
        password: hashedPassword,
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
      });
      const savedUser = await manager.getRepository(User).save(user);

      // 6. Create Staff profile
      const staff = manager.getRepository(Staff).create({
        userId: savedUser.id,
        fullName: input.fullName.trim(),
        merchantId: input.merchantId,
        mobileNumber: input.mobileNumber.trim(),
      });
      const savedStaff = await manager.getRepository(Staff).save(staff);

      return {
        staffId: savedStaff.staffId,
        fullName: savedStaff.fullName,
        mobileNumber: savedStaff.mobileNumber,
        merchantId: savedStaff.merchantId,
        createdAt: savedStaff.createdAt,
        user: {
          id: savedUser.id,
          email: savedUser.email,
          role: savedUser.role,
          status: savedUser.status,
          createdAt: savedUser.createdAt,
        },
        merchant: {
          id: merchant.id,
          merchantCode: merchant.merchantCode,
          businessName: merchant.businessName,
        },
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

    // Filter by search: matches full name, mobile number, user email, or merchant business name
    if (search) {
      qb.andWhere(
        "(LOWER(staff.fullName) LIKE :search OR " +
          "LOWER(staff.mobileNumber) LIKE :search OR " +
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

    if (input.fullName !== undefined) {
      staff.fullName = input.fullName.trim();
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
}

export const staffService = new StaffService();
