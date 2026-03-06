import type { Request, Response, NextFunction } from "express";
import { buildInternalErrorEnvelope } from "../services/internal-error.js";

export function requireInternalAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.isAuthed) {
    res.status(401).json(
      buildInternalErrorEnvelope({
        code: "UNAUTHORIZED",
        message: "Authentication required for internal route",
        requestId: req.requestId,
      })
    );
    return;
  }

  next();
}
