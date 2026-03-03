import { Router } from "express";
import { z } from "zod";
import { createSignedUploadUrl } from "../services/storage.js";
import { publishIngest } from "../services/pubsub.js";

export const assetsRouter = Router();

const SignedUrlReq = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  assetType: z.string().min(1) // e.g. "pro_tools_session" | "unity_scene" | "doc"
});

assetsRouter.post("/signed-url", async (req, res, next) => {
  try {
    const body = SignedUrlReq.parse(req.body);

    const out = await createSignedUploadUrl({
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
  objectPath: z.string().min(1), // gs://bucket/path OR just path
  assetType: z.string().min(1),
  metadata: z.record(z.any()).optional()
});

assetsRouter.post("/commit", async (req, res, next) => {
  try {
    const body = CommitReq.parse(req.body);

    // Publish ingest job (worker will do parse/chunk/embed/upsert)
    const messageId = await publishIngest({
      objectPath: body.objectPath,
      assetType: body.assetType,
      metadata: body.metadata ?? {}
    });

    res.json({ ok: true, messageId });
  } catch (e) {
    next(e);
  }
});
