import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../../entities/user.entity";
import { UserRole, UserStatus } from "../../constants";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { sendEmail } from "../../utils/mailer";
import { getPasswordResetTemplate } from "../../templates/email";
import {
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "./auth.validation";

export class AuthService {
  private async loginWithRole(input: LoginInput, requiredRole?: UserRole) {
    const user = await User.createQueryBuilder("user")
      .where("user.email = :email", { email: input.email.trim().toLowerCase() })
      .addSelect("user.password")
      .leftJoinAndSelect("user.staff", "staff")
      .leftJoinAndSelect("staff.merchant", "merchant")
      .getOne();

    if (!user) {
      throw AppError.unauthorized("Invalid email or password");
    }

    if (requiredRole && user.role !== requiredRole) {
      const roleLabel = requiredRole === UserRole.ADMIN ? "administrator" : "staff";
      throw AppError.forbidden(`Access denied: Not a ${roleLabel} account`);
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw AppError.forbidden("Account is inactive. Please contact support.");
    }

    const isMatch = await bcrypt.compare(input.password, user.password);
    if (!isMatch) {
      throw AppError.unauthorized("Invalid email or password");
    }

    const isRememberMe = Boolean(input.rememberMe);
    const expiresIn = isRememberMe ? "7d" : env.jwt.expiresIn;

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      env.jwt.secret,
      { expiresIn: expiresIn as any }
    );

    const name = user.name || user.staff?.fullName || (user.role === UserRole.ADMIN ? "Admin" : "");

    return {
      token,
      user: {
        email: user.email,
        name,
      },
    };
  }

  async adminLogin(input: LoginInput) {
    return this.loginWithRole(input, UserRole.ADMIN);
  }

  async staffLogin(input: LoginInput) {
    return this.loginWithRole(input, UserRole.STAFF);
  }

  async login(input: LoginInput) {
    return this.loginWithRole(input);
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

  async forgotPassword(input: ForgotPasswordInput) {
    const user = await User.createQueryBuilder("user")
      .where("user.email = :email", { email: input.email.trim().toLowerCase() })
      .addSelect("user.password")
      .leftJoinAndSelect("user.staff", "staff")
      .getOne();

    // Validate account based on requested portal or general existence
    if (!user) {
      const errorMsg =
        input.portal === "admin"
          ? "Admin account not found with this email"
          : input.portal === "staff"
          ? "Staff account not found with this email"
          : "Account not found with this email";
      throw AppError.notFound(errorMsg);
    }

    if (input.portal === "admin" && user.role !== UserRole.ADMIN) {
      throw AppError.notFound("Admin account not found with this email");
    }

    if (input.portal === "staff" && user.role !== UserRole.STAFF) {
      throw AppError.notFound("Staff account not found with this email");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw AppError.forbidden("Account is inactive. Please contact support.");
    }

    const isAdmin = user.role === UserRole.ADMIN;
    const portalType: "admin" | "staff" = isAdmin ? "admin" : "staff";

    // Dynamic secret using JWT_SECRET + user.password hash
    // This ensures automatic one-time use without needing extra database columns
    const resetSecret = `${env.jwt.secret}_${user.password}`;
    const resetToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        type: "password_reset",
      },
      resetSecret,
      { expiresIn: env.jwt.resetPasswordExpiresIn as any }
    );

    // Pick client URL based on whether this is an Admin or Staff account
    const baseUrl = isAdmin ? env.adminClientUrl : env.clientUrl;
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

    // Get email content from the template
    const { subject, text, html } = getPasswordResetTemplate({
      name: isAdmin ? "Administrator" : user.staff?.fullName,
      resetLink,
      portal: portalType,
    });

    // Send email using the common mailer function
    await sendEmail({
      to: user.email,
      subject,
      text,
      html,
    });

    return {
      email: user.email,
      portal: portalType,
    };
  }

  async resetPassword(input: ResetPasswordInput) {
    const decoded = jwt.decode(input.token) as {
      id?: string;
      email?: string;
      type?: string;
    } | null;

    if (!decoded || !decoded.id || decoded.type !== "password_reset") {
      throw AppError.badRequest("Invalid or expired reset token");
    }

    const user = await User.createQueryBuilder("user")
      .where("user.id = :id", { id: decoded.id })
      .addSelect("user.password")
      .getOne();

    if (!user) {
      throw AppError.badRequest("Invalid or expired reset token");
    }

    // Verify signature using the current password hash as part of the secret
    try {
      jwt.verify(input.token, `${env.jwt.secret}_${user.password}`);
    } catch (_error) {
      throw AppError.badRequest("Invalid or expired reset token");
    }

    // Hash new password and save
    const hashedPassword = await bcrypt.hash(input.password, 10);
    user.password = hashedPassword;
    await user.save();

    return {
      message: "Password reset successfully. You can now log in with your new password.",
    };
  }
}

export const authService = new AuthService();
