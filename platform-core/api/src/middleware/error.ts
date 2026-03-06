import type { Request, Response, NextFunction } from "express";
import { buildInternalErrorEnvelope, toValidationDetails } from "../services/internal-error.js";

const SERVICE = process.env.API_SERVICE_NAME || "api";

function mapStatusToCode(status: number): string {
  if (status === 400) return "VALIDATION_FAILED";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status >= 500) return "INTERNAL";
  return "INTERNAL";
}

export function notFound(req: Request, res: Response) {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "Route not found" },
    path: req.path
  });
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const status = Number(err?.status || 500);
  const msg = err?.message || "Internal error";
  const code = err?.code || mapStatusToCode(status);
  const details = toValidationDetails(err) || err?.details;
  const traceId = err?.traceId;
  const orgId = req.user?.orgId;

  console.error(
    JSON.stringify({
      severity: "ERROR",
      service: SERVICE,
      stage: "http_request",
      status: "failed",
      timestamp: new Date().toISOString(),
      requestId: (req as any).requestId,
      traceId,
      orgId,
      path: req.path,
      method: req.method,
      httpStatus: status,
      errorCode: code,
      error: msg,
    })
  );

  if (req.path.startsWith("/v1/internal")) {
    res.status(status).json(
      buildInternalErrorEnvelope({
        code,
        message: msg,
        requestId: (req as any).requestId,
        traceId,
        details,
      })
    );
    return;
  }

  res.status(status).json({
    error: { code: "INTERNAL", message: msg },
    requestId: (req as any).requestId
  });
}
