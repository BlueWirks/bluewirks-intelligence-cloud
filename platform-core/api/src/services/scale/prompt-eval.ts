import { firestore } from "../firestore.js";
import { randomUUID } from "node:crypto";
import { SCALE_COLLECTIONS } from "@bluewirks/contracts";
import type {
  PromptEvalCreateRequest, PromptExperiment,
  PromptEvalRunResponse, PromptEvalResult,
} from "@bluewirks/contracts";

const now = () => new Date().toISOString();

function experimentCol(orgId: string) {
  return firestore.collection("orgs").doc(orgId).collection(SCALE_COLLECTIONS.promptExperiments);
}

export async function createExperiment(
  input: PromptEvalCreateRequest,
  context?: { requestId?: string },
): Promise<PromptExperiment> {
  const id = randomUUID();
  const experiment: PromptExperiment = {
    id,
    orgId: input.orgId,
    name: input.name,
    status: "draft",
    variants: input.variants,
    testQueries: input.testQueries,
    createdAt: now(),
  };

  await experimentCol(input.orgId).doc(id).set(experiment);
  return experiment;
}

export async function listExperiments(
  orgId: string,
  context?: { requestId?: string },
): Promise<PromptExperiment[]> {
  const snap = await experimentCol(orgId).orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => d.data() as PromptExperiment);
}

export async function getExperiment(
  orgId: string,
  experimentId: string,
): Promise<PromptExperiment | null> {
  const doc = await experimentCol(orgId).doc(experimentId).get();
  return doc.exists ? (doc.data() as PromptExperiment) : null;
}

export async function runExperiment(
  orgId: string,
  experimentId: string,
  context?: { requestId?: string },
): Promise<PromptEvalRunResponse> {
  const doc = await experimentCol(orgId).doc(experimentId).get();
  if (!doc.exists) {
    throw new Error("Experiment not found");
  }

  const experiment = doc.data() as PromptExperiment;
  await experimentCol(orgId).doc(experimentId).update({ status: "running" });

  // Execute each variant against each test query
  const results: PromptEvalResult[] = [];
  const start = Date.now();

  for (const variant of experiment.variants) {
    for (const query of experiment.testQueries) {
      const variantStart = Date.now();
      // Stub: in production, call executeGeneration with variant.promptId
      results.push({
        variantId: variant.variantId,
        query,
        output: { answer: `[stub] Response from ${variant.label} for: ${query}`, confidence: 0.5 },
        latencyMs: Date.now() - variantStart,
        tokenCount: 0,
      });
    }
  }

  const completedAt = now();
  await experimentCol(orgId).doc(experimentId).update({
    status: "completed",
    completedAt,
  });

  return {
    experimentId,
    status: "completed",
    results,
    completedAt,
  };
}
