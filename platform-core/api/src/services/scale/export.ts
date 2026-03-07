import { firestore } from "../firestore.js";
import { randomUUID } from "node:crypto";
import { SCALE_COLLECTIONS } from "@bluewirks/contracts";
import type {
  ExportConfigUpsertRequest, ExportConfig,
  ExportStatusResponse, ExportTriggerResponse,
  ExportTriggerRequest,
} from "@bluewirks/contracts";

const now = () => new Date().toISOString();

function exportCol(orgId: string) {
  return firestore.collection("orgs").doc(orgId).collection(SCALE_COLLECTIONS.exportConfigs);
}

export async function listExportConfigs(
  orgId: string,
  context?: { requestId?: string },
): Promise<ExportStatusResponse> {
  const snap = await exportCol(orgId).get();
  const configs = snap.docs.map((d) => d.data() as ExportConfig);

  return {
    orgId,
    configs,
    queriedAt: now(),
  };
}

export async function upsertExportConfig(
  input: ExportConfigUpsertRequest,
  context?: { requestId?: string },
): Promise<ExportConfig> {
  const existing = await exportCol(input.orgId)
    .where("sourceCollection", "==", input.sourceCollection)
    .limit(1)
    .get();

  const id = existing.empty ? randomUUID() : existing.docs[0].id;
  const ts = now();

  const config: ExportConfig = {
    id,
    orgId: input.orgId,
    dataset: input.dataset,
    table: input.table,
    sourceCollection: input.sourceCollection,
    schedule: input.schedule,
    enabled: input.enabled,
    createdAt: existing.empty ? ts : (existing.docs[0].data().createdAt as string),
    updatedAt: ts,
  };

  await exportCol(input.orgId).doc(id).set(config, { merge: true });
  return config;
}

export async function triggerExport(
  input: ExportTriggerRequest,
  context?: { requestId?: string },
): Promise<ExportTriggerResponse> {
  const doc = await exportCol(input.orgId).doc(input.configId).get();
  if (!doc.exists) throw new Error("Export config not found");

  const jobId = randomUUID();

  // Stub: In production, trigger Cloud Scheduler / BQ Data Transfer job
  await exportCol(input.orgId).doc(input.configId).update({
    lastRunAt: now(),
    lastRunStatus: "pending",
  });

  return {
    orgId: input.orgId,
    configId: input.configId,
    jobId,
    status: "triggered",
    triggeredAt: now(),
  };
}
