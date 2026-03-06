import type { Request, Response, NextFunction } from "express";
import { env } from "../env.js";
import { buildInternalErrorEnvelope, InternalApiError } from "../services/internal-error.js";

const SERVICE = process.env.API_SERVICE_NAME || "api";

function allowedInternalRoles(): string[] {
  return env.INTERNAL_OPERATOR_ROLES
    .split(",")
    .map((value: string) => value.trim())
    .filter(Boolean);
}

function logDenied(input: {
  stage: string;
  status: string;
  orgId?: string;
  requestId?: string;
  traceId?: string;
  role?: string;
  reason: string;
}) {
  console.warn(JSON.stringify({
    severity: "WARNING",
    service: SERVICE,
    timestamp: new Date().toISOString(),
    ...input,
  }));
}

export function requireInternalOperatorRole(req: Request, res: Response, next: NextFunction) {
  const role = req.user?.role || "unknown";
  const allowed = allowedInternalRoles();

  if (!allowed.includes(role)) {
    logDenied({
      stage: "internal_authorization",
      status: "denied",
      orgId: req.user?.orgId,
      requestId: req.requestId,
      role,
      reason: "role_not_allowed",
    });

    res.status(403).json(buildInternalErrorEnvelope({
      code: "FORBIDDEN_ROLE",
      message: "Operator role is required for this internal route",
      requestId: req.requestId,
      details: [{ path: "role", message: `Allowed roles: ${allowed.join(", ")}` }],
    }));
    return;
  }

  next();
}

export function assertOrgScope(reqOrgId: string | undefined, bodyOrgId: string, requestId?: string) {
  if (reqOrgId && reqOrgId !== bodyOrgId) {
    throw new InternalApiError({
      status: 403,
      code: "FORBIDDEN_ORG_SCOPE",
      message: "Org scope violation",
      details: [{ path: "orgId", message: `Expected ${reqOrgId} but got ${bodyOrgId}` }],
    });
  }
}
