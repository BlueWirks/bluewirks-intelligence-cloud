import { firestore } from "../firestore.js";
import { randomUUID } from "node:crypto";
import { PubSub } from "@google-cloud/pubsub";
import { SCALE_COLLECTIONS } from "@bluewirks/contracts";
import type {
  DlqListRequest, DlqListResponse,
  DlqReplayRequest, DlqReplayResponse,
  DlqPurgeRequest, DlqPurgeResponse,
} from "@bluewirks/contracts";

const pubsub = new PubSub();
const now = () => new Date().toISOString();

function dlqCol(orgId: string) {
  return firestore.collection("orgs").doc(orgId).collection(SCALE_COLLECTIONS.dlqMessages);
}

export async function listDlqMessages(
  input: DlqListRequest,
  context?: { requestId?: string },
): Promise<DlqListResponse> {
  let query = dlqCol(input.orgId).orderBy("failedAt", "desc").limit(input.limit);

  if (input.failureCode) {
    query = query.where("failureCode", "==", input.failureCode);
  }
  if (input.cursor) {
    const cursorDoc = await dlqCol(input.orgId).doc(input.cursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const snap = await query.get();
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DlqListResponse["items"][number]);
  const nextCursor = snap.docs.length === input.limit ? snap.docs[snap.docs.length - 1].id : undefined;

  return {
    orgId: input.orgId,
    count: items.length,
    items,
    nextCursor,
    queriedAt: now(),
  };
}

export async function replayDlqMessages(
  input: DlqReplayRequest,
  context?: { requestId?: string },
): Promise<DlqReplayResponse> {
  const topic = process.env.INGEST_TOPIC || "ingest-assets";
  let replayed = 0;
  const errors: DlqReplayResponse["errors"] = [];

  for (const messageId of input.messageIds) {
    try {
      const doc = await dlqCol(input.orgId).doc(messageId).get();
      if (!doc.exists) {
        errors.push({ messageId, error: "Message not found" });
        continue;
      }

      const data = doc.data()!;
      const replayPayload = {
        traceId: data.traceId || randomUUID(),
        orgId: data.orgId,
        assetId: data.assetId,
        assetType: data.assetType,
        gcsUri: data.gcsUri,
        createdAt: now(),
      };

      await pubsub.topic(topic).publishMessage({
        data: Buffer.from(JSON.stringify(replayPayload), "utf8"),
      });

      await dlqCol(input.orgId).doc(messageId).delete();
      replayed++;
    } catch (err) {
      errors.push({ messageId, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  return {
    orgId: input.orgId,
    replayed,
    failed: errors.length,
    errors,
    replayedAt: now(),
  };
}

export async function purgeDlqMessages(
  input: DlqPurgeRequest,
  context?: { requestId?: string },
): Promise<DlqPurgeResponse> {
  const cutoff = new Date(Date.now() - input.olderThanDays * 86400000).toISOString();
  const snap = await dlqCol(input.orgId).where("failedAt", "<", cutoff).get();

  const batch = firestore.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();

  return {
    orgId: input.orgId,
    purged: snap.size,
    purgedAt: now(),
  };
}
