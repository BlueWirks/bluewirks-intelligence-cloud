/**
 * Creates a trace context for correlating logs across services.
 * Uses Cloud Trace format: projects/PROJECT/traces/TRACE_ID
 */
export function createTraceContext(projectId: string): {
  traceId: string;
  spanId: string;
  traceHeader: string;
} {
  const traceId = crypto.randomUUID().replace(/-/g, "");
  const spanId = Math.random().toString(16).slice(2, 18);

  return {
    traceId,
    spanId,
    traceHeader: `projects/${projectId}/traces/${traceId}`,
  };
}
