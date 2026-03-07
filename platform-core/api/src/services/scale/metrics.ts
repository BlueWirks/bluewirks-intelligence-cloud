import { firestore } from "../firestore.js";
import { randomUUID } from "node:crypto";
import type {
  TraceMetricsRequest, TraceMetricsResponse,
  CustomMetricCreateRequest, CustomMetricDefinition,
} from "@bluewirks/contracts";

const now = () => new Date().toISOString();

function metricsCol(orgId: string) {
  return firestore.collection("orgs").doc(orgId).collection("custom_metrics");
}

export async function getTraceMetrics(
  input: TraceMetricsRequest,
  context?: { requestId?: string },
): Promise<TraceMetricsResponse> {
  // Stub: In production, query Cloud Trace API for actual metrics.
  // Returns placeholder data to validate the contract shape.
  return {
    orgId: input.orgId,
    metricType: input.metricType,
    percentile: input.percentile,
    points: [],
    summary: {
      min: 0,
      max: 0,
      avg: 0,
      current: 0,
    },
    queriedAt: now(),
  };
}

export async function createCustomMetric(
  input: CustomMetricCreateRequest,
  context?: { requestId?: string },
): Promise<CustomMetricDefinition> {
  const id = randomUUID();
  const metric: CustomMetricDefinition = {
    id,
    orgId: input.orgId,
    name: input.name,
    metricType: input.metricType,
    filter: input.filter,
    aggregation: input.aggregation,
    createdAt: now(),
  };

  await metricsCol(input.orgId).doc(id).set(metric);
  return metric;
}

export async function listCustomMetrics(
  orgId: string,
): Promise<CustomMetricDefinition[]> {
  const snap = await metricsCol(orgId).get();
  return snap.docs.map((d) => d.data() as CustomMetricDefinition);
}
