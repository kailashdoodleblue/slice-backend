import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../../entities/user.entity";
import { UserStatus } from "../../constants";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { LoginInput } from "./auth.validation";

export class AuthService {
  async login(input: LoginInput) {
    const user = await User.createQueryBuilder("user")
      .where("user.email = :email", { email: input.email.trim().toLowerCase() })
      .addSelect("user.password")
      .leftJoinAndSelect("user.staff", "staff")
      .leftJoinAndSelect("staff.merchant", "merchant")
      .getOne();

    if (!user) {
      throw AppError.unauthorized("Invalid email or password");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw AppError.forbidden("Account is inactive. Please contact support.");
    }

    const isMatch = await bcrypt.compare(input.password, user.password);
    if (!isMatch) {
      throw AppError.unauthorized("Invalid email or password");
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn as any }
    );

    const { password: _, ...userWithoutPassword } = user;

    return {
      token,
      user: userWithoutPassword,
    };
  }

  async getProfile(userId: string) {
    const user = await User.findOne({
      where: { id: userId },
      relations: ["staff", "staff.merchant"],
    });

    if (!user) {
      throw AppError.notFound("User not found");
    }

    return user;
  }
}

export const authService = new AuthService();
