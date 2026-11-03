import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 3000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  adminClientUrl: process.env.ADMIN_CLIENT_URL || "http://localhost:3001",
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "app_db",
  },
  admin: {
    email: process.env.ADMIN_EMAIL || "admin@slice.com",
    password: process.env.ADMIN_PASSWORD || "Admin@123456",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "slice_backend_jwt_super_secret_key_2026",
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    resetPasswordExpiresIn: process.env.JWT_RESET_PASSWORD_EXPIRES_IN || "1h",
  },
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.EMAIL_FROM || "no-reply@slice.com",
  },
};
