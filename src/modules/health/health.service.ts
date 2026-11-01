import { AppDataSource } from "../../config/data-source";

export interface HealthStatus {
  status: "ok" | "error";
  timestamp: string;
  uptime: number;
  services: {
    database: {
      status: "up" | "down";
      responseTimeMs: number;
    };
  };
  memory: {
    rssMB: number;
  };
}

export class HealthService {
  async getHealth(): Promise<HealthStatus> {
    const started = Date.now();
    let dbStatus: "up" | "down" = "down";

    try {
      if (AppDataSource.isInitialized) {
        await AppDataSource.query("SELECT 1");
        dbStatus = "up";
      }
    } catch {
      dbStatus = "down";
    }

    const healthy = dbStatus === "up";

    return {
      status: healthy ? "ok" : "error",
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      services: {
        database: {
          status: dbStatus,
          responseTimeMs: Date.now() - started,
        },
      },
      memory: {
        rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
    };
  }
}

export const healthService = new HealthService();

