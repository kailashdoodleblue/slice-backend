import "reflect-metadata";
import app from "./app";
import { env } from "./config/env";
import { AppDataSource } from "./config/data-source";
import { seedAdminUser } from "./seed/admin.seed";

const start = async () => {
  try {
    await AppDataSource.initialize();
    console.log("✅ MySQL connected");

    await seedAdminUser();

    const server = app.listen(env.port, () => {
      console.log(`🚀 Server running on http://localhost:${env.port}`);
      console.log(`❤️  Health check: http://localhost:${env.port}/api/health`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down...`);
      server.close(async () => {
        if (AppDataSource.isInitialized) await AppDataSource.destroy();
        process.exit(0);
      });
    };
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

start();
