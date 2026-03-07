import { firestore } from "../firestore.js";
import { randomUUID } from "node:crypto";
import { SCALE_COLLECTIONS } from "@bluewirks/contracts";
import type {
  AiAppCreateRequest, AiAppUpdateRequest,
  AiApp, AiAppListResponse, AiAppTestRequest, AiAppTestResponse,
} from "@bluewirks/contracts";

const now = () => new Date().toISOString();

function appsCol(orgId: string) {
  return firestore.collection("orgs").doc(orgId).collection(SCALE_COLLECTIONS.aiApps);
}

export async function listApps(
  orgId: string,
  context?: { requestId?: string },
): Promise<AiAppListResponse> {
  const snap = await appsCol(orgId).orderBy("createdAt", "desc").get();
  const apps = snap.docs.map((d) => d.data() as AiApp);

  return {
    orgId,
    apps,
    queriedAt: now(),
  };
}

export async function createApp(
  input: AiAppCreateRequest,
  context?: { requestId?: string },
): Promise<AiApp> {
  const id = randomUUID();
  const ts = now();
  const app: AiApp = {
    id,
    orgId: input.orgId,
    name: input.name,
    description: input.description,
    status: "draft",
    promptId: input.promptId,
    dataSourceIds: input.dataSourceIds,
    config: input.config,
    createdAt: ts,
    updatedAt: ts,
  };

  await appsCol(input.orgId).doc(id).set(app);
  return app;
}

export async function getApp(
  orgId: string,
  appId: string,
): Promise<AiApp | null> {
  const doc = await appsCol(orgId).doc(appId).get();
  return doc.exists ? (doc.data() as AiApp) : null;
}

export async function updateApp(
  input: AiAppUpdateRequest,
  context?: { requestId?: string },
): Promise<AiApp> {
  const ref = appsCol(input.orgId).doc(input.appId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("App not found");

  const existing = doc.data() as AiApp;
  const updated: Partial<AiApp> = { updatedAt: now() };
  if (input.name) updated.name = input.name;
  if (input.description !== undefined) updated.description = input.description;
  if (input.promptId) updated.promptId = input.promptId;
  if (input.dataSourceIds) updated.dataSourceIds = input.dataSourceIds;
  if (input.config) updated.config = input.config;

  await ref.update(updated);
  return { ...existing, ...updated } as AiApp;
}

export async function deleteApp(
  orgId: string,
  appId: string,
): Promise<void> {
  await appsCol(orgId).doc(appId).delete();
}

export async function deployApp(
  orgId: string,
  appId: string,
): Promise<AiApp> {
  const ref = appsCol(orgId).doc(appId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("App not found");

  const ts = now();
  await ref.update({ status: "deployed", deployedAt: ts, updatedAt: ts });
  return { ...(doc.data() as AiApp), status: "deployed", deployedAt: ts, updatedAt: ts };
}

export async function testApp(
  input: AiAppTestRequest,
  context?: { requestId?: string },
): Promise<AiAppTestResponse> {
  const doc = await appsCol(input.orgId).doc(input.appId).get();
  if (!doc.exists) throw new Error("App not found");

  const start = Date.now();
  // Stub: In production, execute the app's prompt pipeline
  const latencyMs = Date.now() - start;

  return {
    appId: input.appId,
    input: input.input,
    output: { answer: `[stub] AI App response for: ${input.input}`, confidence: 0.5 },
    latencyMs,
    testedAt: now(),
  };
}
