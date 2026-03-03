export type LogSeverity = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";

interface LogEntry {
  severity: LogSeverity;
  message: string;
  component: string;
  [key: string]: unknown;
}

/**
 * Writes a structured log entry compatible with Cloud Logging.
 */
export function structuredLog(entry: LogEntry): void {
  console.log(JSON.stringify({
    ...entry,
    timestamp: new Date().toISOString(),
  }));
}
