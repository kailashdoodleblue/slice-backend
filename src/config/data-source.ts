import "reflect-metadata";
import path from "path";
import { DataSource } from "typeorm";
import { env } from "./env";
import { User } from "../entities";
export const AppDataSource = new DataSource({
  type: "mysql",
  host: env.db.host,
  port: env.db.port,
  username: env.db.username,
  password: env.db.password,
  database: env.db.database,
  timezone: "Z", // Store and retrieve all date/time values in UTC
  // Auto-create tables in dev only. Use migrations in production.
  synchronize: env.nodeEnv === "development",
  logging: env.nodeEnv === "development",
  entities: [User, path.join(__dirname, "../entities/**/*.{ts,js}")],
  migrations: [path.join(__dirname, "../migrations/*.{ts,js}")],
});
