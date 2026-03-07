import { firestore } from "../firestore.js";
import { env } from "../../env.js";
import type {
  FailoverState, FailoverActivateRequest, FailoverActivateResponse,
  FailoverRegion,
} from "@bluewirks/contracts";

const now = () => new Date().toISOString();

function failoverRef(orgId: string) {
  return firestore.collection("orgs").doc(orgId).collection("failover").doc("state");
}

export async function getFailoverStatus(
  orgId: string,
  context?: { requestId?: string },
): Promise<FailoverState> {
  const doc = await failoverRef(orgId).get();
  if (doc.exists) return doc.data() as FailoverState;

  // Default: primary region with no failover
  return {
    orgId,
    currentRegion: env.GCP_REGION,
    primaryRegion: env.GCP_REGION,
    status: "primary",
    queriedAt: now(),
  };
}

export async function activateFailover(
  input: FailoverActivateRequest,
  context?: { requestId?: string },
): Promise<FailoverActivateResponse> {
  const current = await getFailoverStatus(input.orgId);

  // Stub: In production, update Global LB backend routing
  const ts = now();
  const newState: FailoverState = {
    orgId: input.orgId,
    currentRegion: input.targetRegion,
    primaryRegion: current.primaryRegion,
    status: "failover",
    lastFailoverAt: ts,
    queriedAt: ts,
  };

  await failoverRef(input.orgId).set(newState);

  return {
    orgId: input.orgId,
    previousRegion: current.currentRegion,
    newRegion: input.targetRegion,
    status: "failover",
    activatedAt: ts,
  };
}

export async function deactivateFailover(
  orgId: string,
  context?: { requestId?: string },
): Promise<FailoverActivateResponse> {
  const current = await getFailoverStatus(orgId);
  const ts = now();

  const newState: FailoverState = {
    orgId,
    currentRegion: current.primaryRegion,
    primaryRegion: current.primaryRegion,
    status: "primary",
    lastRestoredAt: ts,
    queriedAt: ts,
  };

  await failoverRef(orgId).set(newState);

  return {
    orgId,
    previousRegion: current.currentRegion,
    newRegion: current.primaryRegion,
    status: "primary",
    activatedAt: ts,
  };
}

export async function listRegions(
  _orgId: string,
): Promise<FailoverRegion[]> {
  // Stub: In production, query available Cloud Run regions
  return [
    { region: "us-central1", available: true },
    { region: "us-east1", available: true },
    { region: "europe-west1", available: true },
    { region: "asia-east1", available: true },
  ];
}
