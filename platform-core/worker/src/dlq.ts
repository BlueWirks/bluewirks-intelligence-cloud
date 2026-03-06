import { PubSub } from "@google-cloud/pubsub";
import { IngestionDlqMessageSchema, type IngestionDlqMessage } from "@bluewirks/contracts";

const pubsub = new PubSub();

export async function publishIngestionDlq(message: IngestionDlqMessage, topicName?: string): Promise<string | null> {
  if (!topicName) {
    return null;
  }

  const validated = IngestionDlqMessageSchema.parse(message);
  const data = Buffer.from(JSON.stringify(validated), "utf8");
  return pubsub.topic(topicName).publishMessage({ data });
}
