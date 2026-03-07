import { firestore } from "../firestore.js";
import { randomUUID } from "node:crypto";
import { SCALE_COLLECTIONS } from "@bluewirks/contracts";
import type {
  WebhookCreateRequest, WebhookUpdateRequest,
  WebhookConfig, WebhookListResponse, WebhookTestResponse,
} from "@bluewirks/contracts";

const now = () => new Date().toISOString();

function webhookCol(orgId: string) {
  return firestore.collection("orgs").doc(orgId).collection(SCALE_COLLECTIONS.webhooks);
}

export async function listWebhooks(
  orgId: string,
  context?: { requestId?: string },
): Promise<WebhookListResponse> {
  const snap = await webhookCol(orgId).orderBy("createdAt", "desc").get();
  const webhooks = snap.docs.map((d) => d.data() as WebhookConfig);

  return {
    orgId,
    webhooks,
    queriedAt: now(),
  };
}

export async function createWebhook(
  input: WebhookCreateRequest,
  context?: { requestId?: string },
): Promise<WebhookConfig> {
  const id = randomUUID();
  const ts = now();
  const webhook: WebhookConfig = {
    id,
    orgId: input.orgId,
    name: input.name,
    url: input.url,
    events: input.events,
    enabled: true,
    createdAt: ts,
    updatedAt: ts,
  };

  await webhookCol(input.orgId).doc(id).set(webhook);
  return webhook;
}

export async function updateWebhook(
  input: WebhookUpdateRequest,
  context?: { requestId?: string },
): Promise<WebhookConfig> {
  const ref = webhookCol(input.orgId).doc(input.webhookId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("Webhook not found");

  const existing = doc.data() as WebhookConfig;
  const updated: Partial<WebhookConfig> = { updatedAt: now() };
  if (input.name) updated.name = input.name;
  if (input.url) updated.url = input.url;
  if (input.events) updated.events = input.events;
  if (input.enabled !== undefined) updated.enabled = input.enabled;

  await ref.update(updated);
  return { ...existing, ...updated } as WebhookConfig;
}

export async function deleteWebhook(
  orgId: string,
  webhookId: string,
): Promise<void> {
  await webhookCol(orgId).doc(webhookId).delete();
}

export async function testWebhook(
  orgId: string,
  webhookId: string,
): Promise<WebhookTestResponse> {
  const doc = await webhookCol(orgId).doc(webhookId).get();
  if (!doc.exists) throw new Error("Webhook not found");

  const webhook = doc.data() as WebhookConfig;
  const start = Date.now();

  // Stub: In production, send an HTTPS POST to webhook.url with a test payload.
  // For now, return a synthetic success response.
  const latencyMs = Date.now() - start;

  return {
    webhookId,
    statusCode: 200,
    success: true,
    latencyMs,
    testedAt: now(),
  };
}
