import { Router, Request, Response } from "express";
import { Storage } from "@google-cloud/storage";

export const uploadRouter = Router();

const storage = new Storage();
const BUCKET = process.env.ASSET_BUCKET || "bluewirks-assets";
const SIGNED_URL_EXPIRY = 15 * 60 * 1000; // 15 minutes

/**
 * POST /api/upload/signed-url
 * Body: { fileName: string, contentType: string }
 * Returns: { signedUrl: string, objectPath: string }
 */
uploadRouter.post("/signed-url", async (req: Request, res: Response) => {
  try {
    const { fileName, contentType } = req.body;

    if (!fileName || !contentType) {
      res.status(400).json({ error: "fileName and contentType are required" });
      return;
    }

    const orgId = (req as any).orgId;
    const objectPath = `orgs/${orgId}/assets/${Date.now()}-${fileName}`;

    const [signedUrl] = await storage
      .bucket(BUCKET)
      .file(objectPath)
      .getSignedUrl({
        version: "v4",
        action: "write",
        expires: Date.now() + SIGNED_URL_EXPIRY,
        contentType,
      });

    res.json({ signedUrl, objectPath });
  } catch (err) {
    console.error("Failed to generate signed URL", err);
    res.status(500).json({ error: "Failed to generate signed URL" });
  }
});
