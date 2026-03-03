import { PubSub } from "@google-cloud/pubsub";
import { env } from "../env.js";

const pubsub = new PubSub();

type IngestMessage = {
  objectPath: string;
  assetType: string;
  metadata: Record<string, unknown>;
};

export async function publishIngest(msg: IngestMessage): Promise<string> {
  const topic = env.INGEST_TOPIC || "ingest";
  const dataBuffer = Buffer.from(JSON.stringify(msg), "utf8");

  // If topic doesn't exist yet, Pub/Sub will throw; that’s fine for now.
  return pubsub.topic(topic).publishMessage({ data: dataBuffer });
}
