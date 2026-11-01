import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 3000,
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
  },
};
