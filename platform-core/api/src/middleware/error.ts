import type { Request, Response, NextFunction } from "express";

export function notFound(req: Request, res: Response) {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "Route not found" },
    path: req.path
  });
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const status = Number(err?.status || 500);
  const msg = err?.message || "Internal error";

  console.error(
    JSON.stringify({
      level: "error",
      msg: "request_failed",
      requestId: (req as any).requestId,
      status,
      error: msg
    })
  );

  res.status(status).json({
    error: { code: "INTERNAL", message: msg },
    requestId: (req as any).requestId
  });
}
