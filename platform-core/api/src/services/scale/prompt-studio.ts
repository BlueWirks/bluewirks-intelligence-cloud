import { firestore } from "../firestore.js";
import { randomUUID } from "node:crypto";
import { SCALE_COLLECTIONS } from "@bluewirks/contracts";
import type {
  PromptTemplateCreateRequest, PromptTemplateUpdateRequest,
  PromptTemplate, PromptTemplateListResponse,
  PromptTestRequest, PromptTestResponse,
} from "@bluewirks/contracts";

const now = () => new Date().toISOString();

function templateCol(orgId: string) {
  return firestore.collection("orgs").doc(orgId).collection(SCALE_COLLECTIONS.promptTemplates);
}

export async function listTemplates(
  orgId: string,
  context?: { requestId?: string },
): Promise<PromptTemplateListResponse> {
  const snap = await templateCol(orgId).orderBy("createdAt", "desc").get();
  const templates = snap.docs.map((d) => d.data() as PromptTemplate);

  return {
    orgId,
    templates,
    queriedAt: now(),
  };
}

export async function createTemplate(
  input: PromptTemplateCreateRequest,
  context?: { requestId?: string },
): Promise<PromptTemplate> {
  const id = randomUUID();
  const ts = now();
  const template: PromptTemplate = {
    id,
    orgId: input.orgId,
    name: input.name,
    description: input.description,
    systemInstruction: input.systemInstruction,
    userTemplate: input.userTemplate,
    modelId: input.modelId,
    temperature: input.temperature,
    maxOutputTokens: input.maxOutputTokens,
    outputSchema: input.outputSchema,
    status: "draft",
    version: 1,
    createdAt: ts,
    updatedAt: ts,
  };

  await templateCol(input.orgId).doc(id).set(template);
  return template;
}

export async function getTemplate(
  orgId: string,
  templateId: string,
): Promise<PromptTemplate | null> {
  const doc = await templateCol(orgId).doc(templateId).get();
  return doc.exists ? (doc.data() as PromptTemplate) : null;
}

export async function updateTemplate(
  input: PromptTemplateUpdateRequest,
  context?: { requestId?: string },
): Promise<PromptTemplate> {
  const ref = templateCol(input.orgId).doc(input.templateId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("Template not found");

  const existing = doc.data() as PromptTemplate;
  const updated: Partial<PromptTemplate> = { updatedAt: now() };

  if (input.name) updated.name = input.name;
  if (input.description !== undefined) updated.description = input.description;
  if (input.systemInstruction) updated.systemInstruction = input.systemInstruction;
  if (input.userTemplate) updated.userTemplate = input.userTemplate;
  if (input.modelId) updated.modelId = input.modelId;
  if (input.temperature !== undefined) updated.temperature = input.temperature;
  if (input.maxOutputTokens !== undefined) updated.maxOutputTokens = input.maxOutputTokens;
  if (input.outputSchema !== undefined) updated.outputSchema = input.outputSchema;
  if (input.status) updated.status = input.status;

  // Auto-increment version on content changes
  if (input.systemInstruction || input.userTemplate) {
    updated.version = existing.version + 1;
  }

  await ref.update(updated);
  return { ...existing, ...updated } as PromptTemplate;
}

export async function deleteTemplate(
  orgId: string,
  templateId: string,
): Promise<void> {
  await templateCol(orgId).doc(templateId).delete();
}

export async function testTemplate(
  input: PromptTestRequest,
  context?: { requestId?: string },
): Promise<PromptTestResponse> {
  const doc = await templateCol(input.orgId).doc(input.templateId).get();
  if (!doc.exists) throw new Error("Template not found");

  const start = Date.now();
  // Stub: In production, call Vertex AI with the template config
  const latencyMs = Date.now() - start;

  return {
    templateId: input.templateId,
    output: { answer: `[stub] Prompt test response for: ${input.testInput}`, confidence: 0.5 },
    latencyMs,
    inputTokens: 0,
    outputTokens: 0,
    testedAt: now(),
  };
}
