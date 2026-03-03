import { Router, Request, Response } from "express";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { PubSub } from "@google-cloud/pubsub";

export const commitRouter = Router();

const db = getFirestore();
const pubsub = new PubSub();
const TOPIC = process.env.INGESTION_TOPIC || "ingestion-topic";

/**
 * POST /api/commit
 * Body: { assetId: string, objectPath: string, assetType: string, metadata?: object }
 * Commits an uploaded asset and triggers ingestion.
 */
commitRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { assetId, objectPath, assetType, metadata } = req.body;

    if (!assetId || !objectPath || !assetType) {
      res.status(400).json({ error: "assetId, objectPath, and assetType are required" });
      return;
    }

    const orgId = (req as any).orgId;
    const userId = (req as any).userId;

    // Write asset record to Firestore
    const assetRef = db.collection("orgs").doc(orgId).collection("assets").doc(assetId);
    await assetRef.set({
      objectPath,
      assetType,
      metadata: metadata || {},
      status: "pending",
      createdBy: userId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Publish ingestion message
    await pubsub.topic(TOPIC).publishMessage({
      json: { orgId, assetId, objectPath, assetType },
    });

    res.json({ status: "committed", assetId });
  } catch (err) {
    console.error("Failed to commit asset", err);
    res.status(500).json({ error: "Failed to commit asset" });
  }
});
