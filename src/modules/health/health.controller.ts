import { Request, Response } from "express";
import { healthService } from "./health.service";

export class HealthController {
  checkHealth = async (_req: Request, res: Response) => {
    const health = await healthService.getHealth();
    res.status(health.status === "ok" ? 200 : 503).json(health);
  };
}

export const healthController = new HealthController();
