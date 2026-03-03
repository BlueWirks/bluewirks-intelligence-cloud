import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import { IngestMessageSchema, RunDocSchema, COLLECTIONS } from "@bluewirks/contracts";
// import { parseAsset } from "@bluewirks/ingestion";
// import { generateEmbeddings, upsertVectors } from "@bluewirks/vector-engine";

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

/**
 * Handles an ingestion message:
 * 1. Parse asset by type
 * 2. Chunk content
 * 3. Generate embeddings
 * 4. Upsert into Vector Search
 * 5. Record run for audit
 */
export async function handleIngestionMessage(msg: unknown): Promise<void> {
  const parsed = IngestMessageSchema.parse(msg);
  const { orgId, assetId, gcsUri, assetType, traceId } = parsed;
  const runId = crypto.randomUUID();
  const startTime = Date.now();
  const startedAt = new Date().toISOString();

  try {
    // Update status to processing
    await db
      .collection(COLLECTIONS.orgs).doc(orgId)
      .collection(COLLECTIONS.assets).doc(assetId)
      .set({
        status: "PROCESSING",
        gcsUri,
        assetType,
        traceId,
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

    // TODO Phase 1: Wire up actual pipeline
    // const parsed = await parseAsset(objectPath, assetType);
    // const chunks = chunkContent(parsed);
    // const embeddings = await generateEmbeddings(chunks);
    // await upsertVectors(orgId, assetId, embeddings);

    console.log(JSON.stringify({
      severity: "INFO",
      message: "Ingestion pipeline placeholder",
      runId,
      orgId,
      assetId,
      assetType,
    }));

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
    console.error(JSON.stringify({
      severity: "ERROR",
      message: "Ingestion pipeline failed",
      runId,
      orgId,
      assetId,
      error: String(err),
    }));

    await db
      .collection(COLLECTIONS.orgs).doc(orgId)
      .collection(COLLECTIONS.assets).doc(assetId)
      .set({ status: "FAILED" }, { merge: true });

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

    throw err;
  }
}
