import { firestore } from "../firestore.js";
import { SCALE_COLLECTIONS } from "@bluewirks/contracts";
import type {
  CostSummaryRequest, CostSummaryResponse,
  CostLineItem,
} from "@bluewirks/contracts";

const now = () => new Date().toISOString();

function costCol(orgId: string) {
  return firestore.collection("orgs").doc(orgId).collection(SCALE_COLLECTIONS.costRecords);
}

export async function getCostSummary(
  input: CostSummaryRequest,
  context?: { requestId?: string },
): Promise<CostSummaryResponse> {
  const snap = await costCol(input.orgId)
    .where("timestamp", ">=", input.startDate)
    .where("timestamp", "<=", input.endDate)
    .get();

  const buckets = new Map<string, CostLineItem>();

  for (const doc of snap.docs) {
    const d = doc.data();
    const key = input.groupBy === "day"
      ? (d.timestamp as string).slice(0, 10)
      : (d[input.groupBy] as string) || "unknown";

    const existing = buckets.get(key) || {
      groupKey: key,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
      requestCount: 0,
    };

    existing.inputTokens += (d.inputTokens as number) || 0;
    existing.outputTokens += (d.outputTokens as number) || 0;
    existing.totalTokens += ((d.inputTokens as number) || 0) + ((d.outputTokens as number) || 0);
    existing.estimatedCostUsd += (d.estimatedCostUsd as number) || 0;
    existing.requestCount += 1;
    buckets.set(key, existing);
  }

  const items = Array.from(buckets.values());
  const totals: CostLineItem = {
    groupKey: "total",
    inputTokens: items.reduce((s, i) => s + i.inputTokens, 0),
    outputTokens: items.reduce((s, i) => s + i.outputTokens, 0),
    totalTokens: items.reduce((s, i) => s + i.totalTokens, 0),
    estimatedCostUsd: items.reduce((s, i) => s + i.estimatedCostUsd, 0),
    requestCount: items.reduce((s, i) => s + i.requestCount, 0),
  };

  return {
    orgId: input.orgId,
    startDate: input.startDate,
    endDate: input.endDate,
    groupBy: input.groupBy,
    items,
    totals,
    generatedAt: now(),
  };
}
