import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
// import { parseAsset } from "@bluewirks/ingestion";
// import { generateEmbeddings, upsertVectors } from "@bluewirks/vector-engine";

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

interface IngestionMessage {
  orgId: string;
  assetId: string;
  objectPath: string;
  assetType: string;
}

/**
 * Handles an ingestion message:
 * 1. Parse asset by type
 * 2. Chunk content
 * 3. Generate embeddings
 * 4. Upsert into Vector Search
 * 5. Record run for audit
 */
export async function handleIngestionMessage(msg: IngestionMessage): Promise<void> {
  const { orgId, assetId, objectPath, assetType } = msg;
  const runId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // Update status to processing
    await db
      .collection("orgs").doc(orgId)
      .collection("assets").doc(assetId)
      .update({ status: "processing", updatedAt: FieldValue.serverTimestamp() });

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

    // Mark asset as indexed
    await db
      .collection("orgs").doc(orgId)
      .collection("assets").doc(assetId)
      .update({ status: "indexed", updatedAt: FieldValue.serverTimestamp() });

    // Record run
    await db
      .collection("orgs").doc(orgId)
      .collection("runs").doc(runId)
      .set({
        runId,
        type: "ingestion",
        assetId,
        assetType,
        status: "success",
        latencyMs: Date.now() - startTime,
        createdAt: FieldValue.serverTimestamp(),
      });
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
      .collection("orgs").doc(orgId)
      .collection("assets").doc(assetId)
      .update({ status: "error", updatedAt: FieldValue.serverTimestamp() });

    await db
      .collection("orgs").doc(orgId)
      .collection("runs").doc(runId)
      .set({
        runId,
        type: "ingestion",
        assetId,
        assetType,
        status: "error",
        error: String(err),
        latencyMs: Date.now() - startTime,
        createdAt: FieldValue.serverTimestamp(),
      });

    throw err;
  }
}
