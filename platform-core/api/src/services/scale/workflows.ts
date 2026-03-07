import { firestore } from "../firestore.js";
import { randomUUID } from "node:crypto";
import { SCALE_COLLECTIONS } from "@bluewirks/contracts";
import type {
  WorkflowCreateRequest, WorkflowUpdateRequest,
  WorkflowDefinition, WorkflowListResponse,
} from "@bluewirks/contracts";

const now = () => new Date().toISOString();

function workflowCol(orgId: string) {
  return firestore.collection("orgs").doc(orgId).collection(SCALE_COLLECTIONS.workflowDefinitions);
}

export async function listWorkflows(
  orgId: string,
  context?: { requestId?: string },
): Promise<WorkflowListResponse> {
  const snap = await workflowCol(orgId).orderBy("createdAt", "desc").get();
  const workflows = snap.docs.map((d) => d.data() as WorkflowDefinition);

  return {
    orgId,
    workflows,
    queriedAt: now(),
  };
}

export async function createWorkflow(
  input: WorkflowCreateRequest,
  context?: { requestId?: string },
): Promise<WorkflowDefinition> {
  const id = randomUUID();
  const ts = now();
  const workflow: WorkflowDefinition = {
    id,
    orgId: input.orgId,
    name: input.name,
    description: input.description,
    triggerType: input.triggerType,
    triggerConfig: input.triggerConfig,
    steps: input.steps,
    status: "draft",
    createdAt: ts,
    updatedAt: ts,
  };

  await workflowCol(input.orgId).doc(id).set(workflow);
  return workflow;
}

export async function getWorkflow(
  orgId: string,
  workflowId: string,
): Promise<WorkflowDefinition | null> {
  const doc = await workflowCol(orgId).doc(workflowId).get();
  return doc.exists ? (doc.data() as WorkflowDefinition) : null;
}

export async function updateWorkflow(
  input: WorkflowUpdateRequest,
  context?: { requestId?: string },
): Promise<WorkflowDefinition> {
  const ref = workflowCol(input.orgId).doc(input.workflowId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("Workflow not found");

  const existing = doc.data() as WorkflowDefinition;
  const updated: Partial<WorkflowDefinition> = { updatedAt: now() };
  if (input.name) updated.name = input.name;
  if (input.description !== undefined) updated.description = input.description;
  if (input.triggerType) updated.triggerType = input.triggerType;
  if (input.triggerConfig) updated.triggerConfig = input.triggerConfig;
  if (input.steps) updated.steps = input.steps;

  await ref.update(updated);
  return { ...existing, ...updated } as WorkflowDefinition;
}

export async function deleteWorkflow(
  orgId: string,
  workflowId: string,
): Promise<void> {
  await workflowCol(orgId).doc(workflowId).delete();
}

export async function activateWorkflow(
  orgId: string,
  workflowId: string,
): Promise<WorkflowDefinition> {
  const ref = workflowCol(orgId).doc(workflowId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("Workflow not found");

  // Stub: In production, register Eventarc trigger or Cloud Scheduler
  const ts = now();
  await ref.update({ status: "active", updatedAt: ts });
  return { ...(doc.data() as WorkflowDefinition), status: "active", updatedAt: ts };
}

export async function deactivateWorkflow(
  orgId: string,
  workflowId: string,
): Promise<WorkflowDefinition> {
  const ref = workflowCol(orgId).doc(workflowId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("Workflow not found");

  const ts = now();
  await ref.update({ status: "paused", updatedAt: ts });
  return { ...(doc.data() as WorkflowDefinition), status: "paused", updatedAt: ts };
}
