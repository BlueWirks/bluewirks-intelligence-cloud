import crypto from "crypto";
import * as contracts from "@bluewirks/contracts";
import { firestore } from "./firestore.js";

const COLLECTIONS = contracts.COLLECTIONS;
const TraceLookupRequestSchema = contracts.TraceLookupRequestSchema;
const TraceLookupResponseSchema = contracts.TraceLookupResponseSchema;

type TraceLookupRequest = contracts.TraceLookupRequest;
type TraceLookupResponse = contracts.TraceLookupResponse;

const SERVICE = process.env.API_SERVICE_NAME || "api";

function logStage(entry: {
  severity?: "INFO" | "WARNING" | "ERROR";
  stage: string;
  status: string;
  orgId: string;
  assetId?: string;
  requestId?: string;
  traceId: string;
  [key: string]: unknown;
}) {
  const { severity = "INFO", ...rest } = entry;
  console.log(JSON.stringify({
    severity,
    service: SERVICE,
    timestamp: new Date().toISOString(),
    ...rest,
  }));
}

export async function lookupTrace(
  input: TraceLookupRequest,
  context?: { requestId?: string; traceId?: string },
  deps?: { db?: any }
): Promise<TraceLookupResponse> {
  const body = TraceLookupRequestSchema.parse(input);
  const traceId = context?.traceId ?? body.traceId ?? crypto.randomUUID();

  logStage({
    stage: "trace_lookup_requested",
    status: "received",
    orgId: body.orgId,
    assetId: body.assetId,
    requestId: context?.requestId,
    traceId,
  });

  const db = deps?.db ?? firestore;

  const assetsRef = db
    .collection(COLLECTIONS.orgs)
    .doc(body.orgId)
    .collection(COLLECTIONS.assets);
  const runsRef = db
    .collection(COLLECTIONS.orgs)
    .doc(body.orgId)
    .collection(COLLECTIONS.runs);

  const assets: Array<any> = [];

  if (body.assetId) {
    const assetDoc = await assetsRef.doc(body.assetId).get();
    if (assetDoc.exists) {
      const data = assetDoc.data() as any;
      assets.push({
        assetId: assetDoc.id,
        traceId: data.traceId,
        status: data.status,
        assetType: data.assetType,
        gcsUri: data.gcsUri,
        updatedAt: assetDoc.updateTime?.toDate().toISOString() ?? new Date().toISOString(),
      });
    }
  } else if (body.traceId) {
    const query = await assetsRef.where("traceId", "==", body.traceId).get();
    for (const doc of query.docs) {
      const data = doc.data() as any;
      assets.push({
        assetId: doc.id,
        traceId: data.traceId,
        status: data.status,
        assetType: data.assetType,
        gcsUri: data.gcsUri,
        updatedAt: doc.updateTime?.toDate().toISOString() ?? new Date().toISOString(),
      });
    }
  }

  const runs: Array<any> = [];
  if (body.traceId) {
    const query = await runsRef.where("traceId", "==", body.traceId).get();
    for (const doc of query.docs) {
      const data = doc.data() as any;
      runs.push({
        runId: doc.id,
        assetId: data.assetId,
        traceId: data.traceId,
        status: data.status,
        startedAt: data.startedAt,
        finishedAt: data.finishedAt,
        error: data.error,
      });
    }
  } else if (body.assetId) {
    const query = await runsRef.where("assetId", "==", body.assetId).get();
    for (const doc of query.docs) {
      const data = doc.data() as any;
      runs.push({
        runId: doc.id,
        assetId: data.assetId,
        traceId: data.traceId,
        status: data.status,
        startedAt: data.startedAt,
        finishedAt: data.finishedAt,
        error: data.error,
      });
    }
  }

  const response = TraceLookupResponseSchema.parse({
    traceId,
    requestId: context?.requestId ?? body.requestId,
    orgId: body.orgId,
    lookedUpAt: new Date().toISOString(),
    assets,
    runs,
    links: [
      { label: "orgId", value: body.orgId },
      ...(body.assetId ? [{ label: "assetId", value: body.assetId }] : []),
      ...(body.traceId ? [{ label: "queryTraceId", value: body.traceId }] : []),
      ...(body.requestId ? [{ label: "queryRequestId", value: body.requestId }] : []),
    ],
  });

  logStage({
    stage: "trace_lookup_completed",
    status: "completed",
    orgId: body.orgId,
    assetId: body.assetId,
    requestId: context?.requestId,
    traceId,
    assets: response.assets.length,
    runs: response.runs.length,
  });

  return response;
}
