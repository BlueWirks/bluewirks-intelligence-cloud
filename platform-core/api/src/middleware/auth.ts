import type { Request, Response, NextFunction } from "express";
import { env } from "../env.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        isAuthed: boolean;
        orgId: string;
        role: string;
      };
    }
  }
}

/**
 * Minimal stub:
 * - Accepts requests with or without Authorization for now.
 * - If ORG_ID is set, you can later enforce org boundary via verified token claims.
 */
export function auth(req: Request, _res: Response, next: NextFunction) {
  const authz = req.header("authorization") || "";
  req.user = {
    // placeholder shape; replace with decoded Firebase token later
    isAuthed: authz.startsWith("Bearer "),
    orgId: env.ORG_ID ?? "dev-org",
    role: "owner"
  } as any;

  next();
}
