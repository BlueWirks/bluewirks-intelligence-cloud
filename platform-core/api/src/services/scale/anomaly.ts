import { firestore } from "../firestore.js";
import { randomUUID } from "node:crypto";
import { SCALE_COLLECTIONS } from "@bluewirks/contracts";
import type {
  AnomalyThresholdUpsertRequest, AnomalyThreshold,
  AnomalyThresholdListResponse, AnomalyBaselineResponse,
} from "@bluewirks/contracts";

const now = () => new Date().toISOString();

function thresholdCol(orgId: string) {
  return firestore.collection("orgs").doc(orgId).collection(SCALE_COLLECTIONS.anomalyThresholds);
}

export async function listThresholds(
  orgId: string,
  context?: { requestId?: string },
): Promise<AnomalyThresholdListResponse> {
  const snap = await thresholdCol(orgId).get();
  const thresholds = snap.docs.map((d) => d.data() as AnomalyThreshold);

  return {
    orgId,
    thresholds,
    queriedAt: now(),
  };
}

export async function upsertThreshold(
  input: AnomalyThresholdUpsertRequest,
  context?: { requestId?: string },
): Promise<AnomalyThreshold> {
  const existing = await thresholdCol(input.orgId)
    .where("metric", "==", input.metric)
    .limit(1)
    .get();

  const id = existing.empty ? randomUUID() : existing.docs[0].id;
  const ts = now();

  const threshold: AnomalyThreshold = {
    id,
    orgId: input.orgId,
    metric: input.metric,
    operator: input.operator,
    value: input.value,
    windowMinutes: input.windowMinutes,
    enabled: input.enabled,
    createdAt: existing.empty ? ts : (existing.docs[0].data().createdAt as string),
    updatedAt: ts,
  };

  await thresholdCol(input.orgId).doc(id).set(threshold, { merge: true });
  return threshold;
}

export async function getBaseline(
  orgId: string,
  context?: { requestId?: string },
): Promise<AnomalyBaselineResponse> {
  // Stub: In production, query Cloud Monitoring for baseline calculation
  return {
    orgId,
    metrics: [],
    calculatedAt: now(),
  };
}
