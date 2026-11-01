import "reflect-metadata";
import { AppDataSource } from "../config/data-source";
import { seedAdminUser } from "./admin.seed";

const run = async () => {
  try {
    await AppDataSource.initialize();
    await seedAdminUser();
    console.log("Seeding completed successfully.");
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

run();

