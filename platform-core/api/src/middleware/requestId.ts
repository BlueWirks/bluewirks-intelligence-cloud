import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = req.header("x-request-id") || crypto.randomUUID();
  req.requestId = id;
  res.setHeader("x-request-id", id);
  next();
}
