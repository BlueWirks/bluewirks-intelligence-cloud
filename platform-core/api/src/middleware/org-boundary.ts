import { Request, Response, NextFunction } from "express";

const ORG_ID = process.env.ORG_ID;

/**
 * Enforces org boundary — the token's org_id must match the configured ORG_ID.
 * Prevents cross-tenant access.
 */
export function orgBoundaryMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const tokenOrgId = (req as any).orgId;

  if (!tokenOrgId) {
    res.status(403).json({ error: "No org_id claim in token" });
    return;
  }

  if (ORG_ID && tokenOrgId !== ORG_ID) {
    console.warn(`Org boundary violation: token org_id=${tokenOrgId}, expected=${ORG_ID}`);
    res.status(403).json({ error: "Org boundary violation" });
    return;
  }

  next();
}
