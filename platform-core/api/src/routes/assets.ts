import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { createSignedUploadUrl } from "../services/storage.js";
import { publishIngest } from "../services/pubsub.js";
import { firestore } from "../services/firestore.js";
import { AssetDocSchema, COLLECTIONS } from "@bluewirks/contracts";

export const assetsRouter = Router();

const SignedUrlReq = z.object({
  orgId: z.string().min(1),
  assetId: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  assetType: z.string().min(1) // e.g. "pro_tools_session" | "unity_scene" | "doc"
});

assetsRouter.post("/signed-url", async (req, res, next) => {
  try {
    const body = SignedUrlReq.parse(req.body);

    const out = await createSignedUploadUrl({
      orgId: body.orgId,
      assetId: body.assetId,
      filename: body.filename,
      contentType: body.contentType
    });

    res.json({
      upload: out,
      assetType: body.assetType
    });
  } catch (e) {
    next(e);
  }
});

const CommitReq = z.object({
  orgId: z.string().min(1),
  assetId: z.string().min(1),
  gcsUri: z.string().regex(/^gs:\/\/.+/),
  assetType: z.string().min(1),
  metadata: z.record(z.any()).optional(),
  traceId: z.string().uuid().optional(),
});

assetsRouter.post("/commit", async (req, res, next) => {
  try {
    const body = CommitReq.parse(req.body);
    const traceId = body.traceId ?? crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const assetDoc = AssetDocSchema.parse({
      status: "QUEUED",
      gcsUri: body.gcsUri,
      assetType: body.assetType,
      createdAt,
      traceId,
    });

    await firestore
      .collection(COLLECTIONS.orgs).doc(body.orgId)
      .collection(COLLECTIONS.assets).doc(body.assetId)
      .set({
        ...assetDoc,
        metadata: body.metadata ?? {},
      }, { merge: true });

    // Publish ingest job (worker will do parse/chunk/embed/upsert)
    const messageId = await publishIngest({
      traceId,
      orgId: body.orgId,
      assetId: body.assetId,
      assetType: body.assetType,
      gcsUri: body.gcsUri,
      createdAt,
    });

    res.json({ ok: true, messageId, traceId });
  } catch (e) {
    next(e);
  }
});
