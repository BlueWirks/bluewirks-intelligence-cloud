import { Storage } from "@google-cloud/storage";
import { env } from "../env.js";

const storage = new Storage();

export async function createSignedUploadUrl(opts: {
  orgId: string;
  assetId: string;
  filename: string;
  contentType: string;
}) {
  const bucketName = env.ASSETS_BUCKET || "bluewirks-hub-assets";
  const objectPath = `orgs/${opts.orgId}/assets/${opts.assetId}/${opts.filename}`;

  const [url] = await storage.bucket(bucketName).file(objectPath).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000,
    contentType: opts.contentType
  });

  return {
    bucket: bucketName,
    objectPath,
    gcsUri: `gs://${bucketName}/${objectPath}`,
    url,
    expiresInSeconds: 15 * 60
  };
}
