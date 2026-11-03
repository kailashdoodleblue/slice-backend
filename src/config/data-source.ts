import "reflect-metadata";
import path from "path";
import { DataSource } from "typeorm";
import { env } from "./env";
import { User, Merchant, Staff, Transaction } from "../entities";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: env.db.host,
  port: env.db.port,
  username: env.db.username,
  password: env.db.password,
  database: env.db.database,
  timezone: "Z",
  synchronize: env.nodeEnv === "development",
  logging: env.nodeEnv === "development",
  entities: [User, Merchant, Staff, Transaction, path.join(__dirname, "../entities/**/*.{ts,js}")],
  migrations: [path.join(__dirname, "../migrations/*.{ts,js}")],
});
