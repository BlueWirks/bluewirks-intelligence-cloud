import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import { IngestMessageSchema, RunDocSchema, COLLECTIONS } from "@bluewirks/contracts";
import { parseAsset, chunkContent } from "@bluewirks/ingestion";
import { createEmbeddingService, createVectorIndexAdapter } from "@bluewirks/vector-engine";
import { buildEmbeddingInputs, buildVectorDocuments } from "./pipeline.js";
import { classifyWorkerError, computeBackoffMs, shouldRetry } from "./retry.js";
import { publishIngestionDlq } from "./dlq.js";
import { validateWorkerEnv } from "./env.js";

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();
const workerEnv = validateWorkerEnv(process.env);

const SERVICE = process.env.WORKER_SERVICE_NAME || "worker";
const embeddingService = createEmbeddingService() as any;
const vectorAdapter = createVectorIndexAdapter() as any;

function logStage(entry: {
  severity?: "INFO" | "WARNING" | "ERROR";
  orgId: string;
  assetId: string;
  traceId: string;
  stage: string;
  status: string;
  requestId?: string;
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

/**
 * Handles an ingestion message:
 * 1. Parse asset by type
 * 2. Chunk content
 * 3. Generate embeddings
 * 4. Upsert into Vector Search
 * 5. Record run for audit
 */
export async function handleIngestionMessage(
  msg: unknown,
  context?: { deliveryAttempt?: number; messageId?: string; requestId?: string }
): Promise<void> {
  const deliveryAttempt = context?.deliveryAttempt ?? 1;
  const maxAttempts = workerEnv.WORKER_RETRY_MAX_ATTEMPTS;
  const baseDelayMs = workerEnv.WORKER_RETRY_BASE_DELAY_MS;
  const dlqTopic = workerEnv.INGEST_DLQ_TOPIC;
  const dlqEnabled = workerEnv.ENABLE_WORKER_DLQ_PUBLISH;

  let orgId = "unknown-org";
  let assetId = "unknown-asset";
  let assetType = "unknown-type";
  let gcsUri = "gs://unknown/unknown";
  let traceId: string = crypto.randomUUID();
  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();

  try {
    const parsed = IngestMessageSchema.parse(msg);
    orgId = parsed.orgId;
    assetId = parsed.assetId;
    assetType = parsed.assetType;
    gcsUri = parsed.gcsUri;
    traceId = parsed.traceId;

    const assetRef = db
      .collection(COLLECTIONS.orgs).doc(orgId)
      .collection(COLLECTIONS.assets).doc(assetId);

    const currentAsset = await assetRef.get();
    const currentStatus = currentAsset.exists ? (currentAsset.data() as any)?.status : undefined;
    if (currentStatus === "INDEXED") {
      logStage({
        orgId,
        assetId,
        traceId,
        stage: "idempotency_check",
        status: "skipped_already_indexed",
        requestId: context?.requestId,
        runId,
      });
      return;
    }

    // Update status to processing
    await assetRef.set({
        status: "PROCESSING",
        gcsUri,
        assetType,
        traceId,
        retryAttempt: deliveryAttempt,
      }, { merge: true });

    await db
      .collection(COLLECTIONS.orgs).doc(orgId)
      .collection(COLLECTIONS.runs).doc(runId)
      .set(RunDocSchema.parse({
        assetId,
        traceId,
        startedAt,
        status: "PROCESSING",
      }));

    logStage({
      orgId,
      assetId,
      traceId,
      stage: "parse",
      status: "started",
      requestId: context?.requestId,
      runId,
      assetType,
      deliveryAttempt,
    });

    const parsedAsset = await parseAsset(gcsUri, assetType);

    logStage({
      orgId,
      assetId,
      traceId,
      stage: "parse",
      status: "completed",
      requestId: context?.requestId,
      runId,
      sectionCount: parsedAsset.sections.length,
    });

    const chunks = chunkContent(parsedAsset);
    const embeddingInputs = buildEmbeddingInputs({
      orgId,
      assetId,
      assetType,
      gcsUri,
      chunks,
    });

    logStage({
      orgId,
      assetId,
      traceId,
      stage: "chunk",
      status: "completed",
      requestId: context?.requestId,
      runId,
      chunkCount: chunks.length,
    });

    logStage({
      orgId,
      assetId,
      traceId,
      stage: "embed",
      status: "started",
      requestId: context?.requestId,
      runId,
      chunkCount: chunks.length,
    });

    const vectors = await embeddingService.embedTexts(
      embeddingInputs.map((item) => item.content),
      {
        orgId,
        assetId,
        traceId,
        modelId: workerEnv.EMBEDDING_MODEL,
      }
    );

    const embeddings = embeddingInputs.map((item, index) => ({
      chunkId: item.chunkId,
      embedding: vectors[index],
      metadata: item.metadata,
    }));

    await db
      .collection(COLLECTIONS.orgs).doc(orgId)
      .collection(COLLECTIONS.assets).doc(assetId)
      .set({
        embeddingStatus: "EMBEDDED",
        embeddingCount: embeddings.length,
      }, { merge: true });

    logStage({
      orgId,
      assetId,
      traceId,
      stage: "embed",
      status: "completed",
      requestId: context?.requestId,
      runId,
      embeddingCount: embeddings.length,
    });

    logStage({
      orgId,
      assetId,
      traceId,
      stage: "index",
      status: "started",
      requestId: context?.requestId,
      runId,
      embeddingCount: embeddings.length,
    });

    const vectorDocuments = buildVectorDocuments({
      orgId,
      assetId,
      embeddings,
    });

    await vectorAdapter.upsertDocuments(vectorDocuments, { traceId });

    logStage({
      orgId,
      assetId,
      traceId,
      stage: "index",
      status: "completed",
      requestId: context?.requestId,
      runId,
      upsertedCount: embeddings.length,
    });

    const finishedAt = new Date().toISOString();

    // Mark asset as indexed
    await db
      .collection(COLLECTIONS.orgs).doc(orgId)
      .collection(COLLECTIONS.assets).doc(assetId)
      .set({ status: "INDEXED" }, { merge: true });

    // Record run
    await db
      .collection(COLLECTIONS.orgs).doc(orgId)
      .collection(COLLECTIONS.runs).doc(runId)
      .set(RunDocSchema.parse({
        assetId,
        traceId,
        startedAt,
        finishedAt,
        status: "INDEXED",
      }));
  } catch (err) {
    const classification = classifyWorkerError(err);
    const retryAllowed = shouldRetry({
      attempt: deliveryAttempt,
      maxAttempts,
      classification: classification.classification,
    });
    const backoffMs = computeBackoffMs(deliveryAttempt, baseDelayMs);

    logStage({
      severity: "ERROR",
      orgId,
      assetId,
      traceId,
      stage: "pipeline",
      status: "failed",
      requestId: context?.requestId,
      runId,
      failureCode: classification.code,
      retryClassification: classification.classification,
      retryAllowed,
      deliveryAttempt,
      error: String(err),
    });

    const assetRef = db
      .collection(COLLECTIONS.orgs).doc(orgId)
      .collection(COLLECTIONS.assets).doc(assetId);

    const finishedAt = new Date().toISOString();
    await db
      .collection(COLLECTIONS.orgs).doc(orgId)
      .collection(COLLECTIONS.runs).doc(runId)
      .set(RunDocSchema.parse({
        assetId,
        traceId,
        startedAt,
        finishedAt,
        status: "FAILED",
        error: String(err),
      }));

    if (retryAllowed) {
      await assetRef.set({
        status: "PROCESSING",
        retryStatus: "RETRY_SCHEDULED",
        retryAttempt: deliveryAttempt,
        retryBackoffMs: backoffMs,
        lastError: String(err),
        failureCode: classification.code,
      }, { merge: true });

      logStage({
        severity: "WARNING",
        orgId,
        assetId,
        traceId,
        stage: "retry",
        status: "scheduled",
        requestId: context?.requestId,
        runId,
        deliveryAttempt,
        nextAttempt: deliveryAttempt + 1,
        backoffMs,
      });

      throw err;
    }

    await assetRef.set({
      status: "FAILED",
      embeddingStatus: "FAILED",
      retryStatus: "EXHAUSTED",
      retryAttempt: deliveryAttempt,
      failureCode: classification.code,
      retryClassification: classification.classification,
      failedAt: finishedAt,
      lastError: String(err),
    }, { merge: true });

    if (dlqEnabled && dlqTopic) {
      const dlqMessageId = await publishIngestionDlq({
        traceId,
        orgId,
        assetId,
        assetType,
        gcsUri,
        requestId: context?.requestId,
        deliveryAttempt,
        retryClassification: classification.classification,
        failureCode: classification.code,
        failureMessage: String(err),
        failedAt: finishedAt,
      }, dlqTopic);

      logStage({
        severity: "WARNING",
        orgId,
        assetId,
        traceId,
        stage: "dlq",
        status: "published",
        requestId: context?.requestId,
        runId,
        dlqTopic,
        dlqMessageId,
      });
    } else {
      logStage({
        severity: "WARNING",
        orgId,
        assetId,
        traceId,
        stage: "dlq",
        status: "skipped",
        requestId: context?.requestId,
        runId,
        reason: "dlq_not_configured",
      });
    }

    return;
  }
}
