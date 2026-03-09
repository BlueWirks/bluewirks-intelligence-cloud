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

const LatestUnityFindingsReq = z.object({
  orgId: z.string().min(1),
  assetId: z.string().min(1).optional(),
  recentLimit: z.coerce.number().int().min(1).max(20).default(5),
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

assetsRouter.get("/unity/latest-findings", async (req, res, next) => {
  try {
    const query = LatestUnityFindingsReq.parse(req.query);
    const assetsRef = firestore
      .collection(COLLECTIONS.orgs).doc(query.orgId)
      .collection(COLLECTIONS.assets);

    const recentSnap = await assetsRef
      .where("assetType", "==", "unity_scene")
      .orderBy("createdAt", "desc")
      .limit(query.recentLimit)
      .get();

    const recent = recentSnap.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      const metadata = (data.metadata ?? {}) as Record<string, unknown>;
      return {
        assetId: doc.id,
        sceneName: typeof metadata.sceneName === "string" ? metadata.sceneName : null,
        exportedAtUtc: typeof metadata.exportedAtUtc === "string" ? metadata.exportedAtUtc : null,
        createdAt: typeof data.createdAt === "string" ? data.createdAt : null,
      };
    });

    if (query.assetId) {
      const doc = await assetsRef.doc(query.assetId).get();
      if (!doc.exists) {
        res.json({ found: false, item: null, recent });
        return;
      }

      const data = doc.data() as Record<string, unknown>;
      if (data.assetType !== "unity_scene") {
        res.json({ found: false, item: null, recent });
        return;
      }

      const metadata = (data.metadata ?? {}) as Record<string, unknown>;
      const findings = Array.isArray(metadata.findings) ? metadata.findings : [];
      const diffSummary = metadata.diffSummary && typeof metadata.diffSummary === "object"
        ? metadata.diffSummary
        : null;

      res.json({
        found: true,
        item: {
          assetId: doc.id,
          sceneName: typeof metadata.sceneName === "string" ? metadata.sceneName : null,
          exportedAtUtc: typeof metadata.exportedAtUtc === "string" ? metadata.exportedAtUtc : null,
          buildTarget: typeof metadata.buildTarget === "string" ? metadata.buildTarget : null,
          findings,
          diffSummary,
          createdAt: typeof data.createdAt === "string" ? data.createdAt : null,
        },
        recent,
      });
      return;
    }

    if (recentSnap.empty) {
      res.json({ found: false, item: null, recent: [] });
      return;
    }

    const doc = recentSnap.docs[0];
    const data = doc.data() as Record<string, unknown>;
    const metadata = (data.metadata ?? {}) as Record<string, unknown>;
    const findings = Array.isArray(metadata.findings) ? metadata.findings : [];
    const diffSummary = metadata.diffSummary && typeof metadata.diffSummary === "object"
      ? metadata.diffSummary
      : null;

    res.json({
      found: true,
      item: {
        assetId: doc.id,
        sceneName: typeof metadata.sceneName === "string" ? metadata.sceneName : null,
        exportedAtUtc: typeof metadata.exportedAtUtc === "string" ? metadata.exportedAtUtc : null,
        buildTarget: typeof metadata.buildTarget === "string" ? metadata.buildTarget : null,
        findings,
        diffSummary,
        createdAt: typeof data.createdAt === "string" ? data.createdAt : null,
      },
      recent,
    });
  } catch (e) {
    next(e);
  }
});
