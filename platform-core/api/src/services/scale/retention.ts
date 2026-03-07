import { firestore } from "../firestore.js";
import { SCALE_COLLECTIONS } from "@bluewirks/contracts";
import type {
  RetentionListRequest, RetentionListResponse,
  RetentionUpsertRequest, RetentionPolicy,
} from "@bluewirks/contracts";

const now = () => new Date().toISOString();

function retentionCol(orgId: string) {
  return firestore.collection("orgs").doc(orgId).collection(SCALE_COLLECTIONS.retentionPolicies);
}

export async function listRetentionPolicies(
  input: RetentionListRequest,
  context?: { requestId?: string },
): Promise<RetentionListResponse> {
  const snap = await retentionCol(input.orgId).get();
  const policies = snap.docs.map((d) => d.data() as RetentionPolicy);

  return {
    orgId: input.orgId,
    policies,
    queriedAt: now(),
  };
}

export async function upsertRetentionPolicy(
  input: RetentionUpsertRequest,
  context?: { requestId?: string; actor?: string },
): Promise<RetentionPolicy> {
  const policy: RetentionPolicy = {
    collection: input.collection,
    ttlDays: input.ttlDays,
    enabled: input.enabled,
    updatedAt: now(),
    updatedBy: context?.actor,
  };

  await retentionCol(input.orgId).doc(input.collection).set(policy, { merge: true });
  return policy;
}

export async function deleteRetentionPolicy(
  orgId: string,
  collection: string,
): Promise<void> {
  await retentionCol(orgId).doc(collection).delete();
}
