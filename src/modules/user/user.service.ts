import bcrypt from "bcryptjs";
import { User } from "../../entities/user.entity";
import { UserRole, UserStatus } from "../../constants";
import { AppError } from "../../utils/AppError";
import { CreateUserInput, UpdateUserInput } from "./user.validation";

export class UserService {
  async getAllUsers(): Promise<User[]> {
    return User.find({
      order: { id: "DESC" },
      relations: ["staff", "staff.merchant"],
    });
  }

  async getUserById(id: string): Promise<User> {
    const user = await User.findOne({
      where: { id },
      relations: ["staff", "staff.merchant"],
    });
    if (!user) {
      throw AppError.notFound("User not found");
    }
    return user;
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const exists = await User.findOneBy({ email: input.email.trim().toLowerCase() });
    if (exists) {
      throw AppError.conflict("Email already in use");
    }

    const hashedPassword = await bcrypt.hash(input.password || "DefaultPassword123!", 10);

    const user = User.create({
      email: input.email.trim().toLowerCase(),
      password: hashedPassword,
      role: input.role || UserRole.STAFF,
      status: input.status || UserStatus.ACTIVE,
    });
    return user.save();
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    const user = await this.getUserById(id);

    if (input.email && input.email !== user.email) {
      const emailExists = await User.findOneBy({ email: input.email.trim().toLowerCase() });
      if (emailExists) {
        throw AppError.conflict("Email already in use");
      }
      user.email = input.email.trim().toLowerCase();
    }

    if (input.status !== undefined) user.status = input.status;

    return user.save();
  }

  async deleteUser(id: string): Promise<void> {
    const result = await User.delete(id);
    if (!result.affected) {
      throw AppError.notFound("User not found");
    }
  }
}

export const userService = new UserService();
