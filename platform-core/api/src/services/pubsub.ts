import { PubSub } from "@google-cloud/pubsub";
import { env } from "../env.js";
import { IngestMessageSchema, type IngestMessage } from "@bluewirks/contracts";

const pubsub = new PubSub();

export async function publishIngest(msg: IngestMessage): Promise<string> {
  const topic = env.INGEST_TOPIC || "ingest";
  const validated = IngestMessageSchema.parse(msg);
  const dataBuffer = Buffer.from(JSON.stringify(validated), "utf8");

  // If topic doesn't exist yet, Pub/Sub will throw; that’s fine for now.
  return pubsub.topic(topic).publishMessage({ data: dataBuffer });
}
