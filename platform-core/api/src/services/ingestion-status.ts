import crypto from "crypto";
import * as contracts from "@bluewirks/contracts";
import { firestore } from "./firestore.js";

const COLLECTIONS = contracts.COLLECTIONS;
const IngestionStatusLookupRequestSchema = contracts.IngestionStatusLookupRequestSchema;
const IngestionStatusLookupResponseSchema = contracts.IngestionStatusLookupResponseSchema;

type IngestionStatusLookupRequest = contracts.IngestionStatusLookupRequest;
type IngestionStatusLookupResponse = contracts.IngestionStatusLookupResponse;
type IngestionStatusItem = contracts.IngestionStatusItem;

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

function docToItem(
  orgId: string,
  assetId: string,
  data: Record<string, unknown>,
  updatedAt: string
): IngestionStatusItem {
  return {
    orgId,
    assetId,
    traceId: typeof data.traceId === "string" ? data.traceId : crypto.randomUUID(),
    status: data.status as contracts.AssetStatus,
    assetType: typeof data.assetType === "string" ? data.assetType : undefined,
    gcsUri: typeof data.gcsUri === "string" ? data.gcsUri : undefined,
    createdAt: typeof data.createdAt === "string" ? data.createdAt : undefined,
    updatedAt,
    embeddingStatus: typeof data.embeddingStatus === "string" ? data.embeddingStatus : undefined,
    embeddingCount: typeof data.embeddingCount === "number" ? data.embeddingCount : undefined,
  };
}

export async function lookupIngestionStatus(
  input: IngestionStatusLookupRequest,
  context?: { requestId?: string; traceId?: string },
  deps?: { db?: any }
): Promise<IngestionStatusLookupResponse> {
  const traceId = context?.traceId ?? input.traceId ?? crypto.randomUUID();
  const body = IngestionStatusLookupRequestSchema.parse(input);

  logStage({
    stage: "ingestion_status_lookup_requested",
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

  const items: IngestionStatusItem[] = [];

  if (body.assetId) {
    const snap = await assetsRef.doc(body.assetId).get();
    if (snap.exists) {
      const data = (snap.data() ?? {}) as Record<string, unknown>;
      items.push(docToItem(body.orgId, body.assetId, data, snap.updateTime?.toDate().toISOString() ?? new Date().toISOString()));
    }
  } else if (body.traceId) {
    const snap = await assetsRef.where("traceId", "==", body.traceId).get();
    for (const doc of snap.docs) {
      const data = (doc.data() ?? {}) as Record<string, unknown>;
      items.push(docToItem(body.orgId, doc.id, data, doc.updateTime?.toDate().toISOString() ?? new Date().toISOString()));
    }
  }

  const runsRef = db
    .collection(COLLECTIONS.orgs)
    .doc(body.orgId)
    .collection(COLLECTIONS.runs);

  for (const item of items) {
    const runSnap = await runsRef.where("assetId", "==", item.assetId).get();
    const sorted = runSnap.docs
      .map((doc: any) => ({ id: doc.id, ...(doc.data() as any) }))
      .sort((a: any, b: any) => String(b.startedAt).localeCompare(String(a.startedAt)));

    const latest = sorted[0];
    if (latest) {
      item.latestRun = {
        runId: latest.id,
        status: latest.status,
        startedAt: latest.startedAt,
        finishedAt: latest.finishedAt,
        error: latest.error,
      };
    }
  }

  const response = IngestionStatusLookupResponseSchema.parse({
    traceId,
    requestId: context?.requestId,
    orgId: body.orgId,
    lookedUpAt: new Date().toISOString(),
    count: items.length,
    items,
  });

  logStage({
    stage: "ingestion_status_lookup_completed",
    status: "completed",
    orgId: body.orgId,
    assetId: body.assetId,
    requestId: context?.requestId,
    traceId,
    count: response.count,
  });

  return response;
}
