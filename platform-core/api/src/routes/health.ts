import { Router, Request, Response } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    version: process.env.APP_VERSION || "0.1.0",
    timestamp: new Date().toISOString(),
  });
});
