import { Request, Response, NextFunction } from "express";

/**
 * Structured request logger for Cloud Logging compatibility.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  res.on("finish", () => {
    const latencyMs = Date.now() - start;
    const logEntry = {
      severity: res.statusCode >= 400 ? "WARNING" : "INFO",
      message: `${req.method} ${req.path} ${res.statusCode}`,
      httpRequest: {
        requestMethod: req.method,
        requestUrl: req.originalUrl,
        status: res.statusCode,
        latency: `${latencyMs / 1000}s`,
        userAgent: req.get("User-Agent"),
      },
      component: "api",
    };
    console.log(JSON.stringify(logEntry));
  });

  next();
}
