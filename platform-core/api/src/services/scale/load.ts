import { firestore } from "../firestore.js";
import { randomUUID } from "node:crypto";
import { SCALE_COLLECTIONS } from "@bluewirks/contracts";
import type {
  LoadTestTriggerRequest, LoadTestResult,
} from "@bluewirks/contracts";

const now = () => new Date().toISOString();

function loadCol(orgId: string) {
  return firestore.collection("orgs").doc(orgId).collection(SCALE_COLLECTIONS.loadTests);
}

export async function triggerLoadTest(
  input: LoadTestTriggerRequest,
  context?: { requestId?: string },
): Promise<LoadTestResult> {
  const testId = randomUUID();
  const result: LoadTestResult = {
    testId,
    orgId: input.orgId,
    status: "pending",
    targetService: input.targetService,
    totalRequests: 0,
    successCount: 0,
    errorCount: 0,
    avgLatencyMs: 0,
    p99LatencyMs: 0,
    startedAt: now(),
  };

  await loadCol(input.orgId).doc(testId).set(result);

  // Stub: In production, trigger an async Cloud Run Job or Task Queue
  // that executes the load test and updates status on completion.
  await loadCol(input.orgId).doc(testId).update({ status: "running" });

  return { ...result, status: "running" };
}

export async function getLoadTestStatus(
  orgId: string,
  testId?: string,
  context?: { requestId?: string },
): Promise<LoadTestResult[]> {
  if (testId) {
    const doc = await loadCol(orgId).doc(testId).get();
    return doc.exists ? [doc.data() as LoadTestResult] : [];
  }

  const snap = await loadCol(orgId).orderBy("startedAt", "desc").limit(20).get();
  return snap.docs.map((d) => d.data() as LoadTestResult);
}

export async function stopLoadTest(
  orgId: string,
  testId: string,
): Promise<LoadTestResult> {
  const ref = loadCol(orgId).doc(testId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("Load test not found");

  const existing = doc.data() as LoadTestResult;
  if (existing.status !== "running" && existing.status !== "pending") {
    throw new Error("Load test is not running");
  }

  const updated = { ...existing, status: "stopped" as const, completedAt: now() };
  await ref.update({ status: "stopped", completedAt: updated.completedAt });
  return updated;
}
