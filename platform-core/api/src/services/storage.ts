import { Storage } from "@google-cloud/storage";
import { env } from "../env.js";

const storage = new Storage();

export async function createSignedUploadUrl(opts: {
  filename: string;
  contentType: string;
}) {
  const bucketName = env.ASSETS_BUCKET || "bluewirks-hub-assets";
  const objectPath = `uploads/${Date.now()}-${opts.filename}`;

  const [url] = await storage.bucket(bucketName).file(objectPath).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000,
    contentType: opts.contentType
  });

  return {
    bucket: bucketName,
    objectPath,
    url,
    expiresInSeconds: 15 * 60
  };
}
