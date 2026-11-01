import bcrypt from "bcryptjs";
import { User } from "../entities/user.entity";
import { UserRole, UserStatus } from "../constants";
import { env } from "../config/env";

export const seedAdminUser = async (): Promise<void> => {
  const adminEmail = env.admin.email;
  const adminPassword = env.admin.password;

  if (!adminEmail || !adminPassword) {
    console.warn("⚠️ Admin credentials not configured in environment. Skipping admin seed.");
    return;
  }

  const existingAdmin = await User.findOneBy({ email: adminEmail });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const admin = User.create({
      email: adminEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });
    await admin.save();
    console.log(`✅ Default Admin user seeded (${adminEmail})`);
  } else {
    console.log(`ℹ️ Admin user already exists (${adminEmail})`);
  }
};
