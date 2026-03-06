import crypto from "crypto";
import * as contracts from "@bluewirks/contracts";
import { retrieveGroundedContext } from "./retrieval.js";

const RetrievalDebugRequestSchema = contracts.RetrievalDebugRequestSchema;
const RetrievalDebugResponseSchema = contracts.RetrievalDebugResponseSchema;

type RetrievalDebugRequest = contracts.RetrievalDebugRequest;
type RetrievalDebugResponse = contracts.RetrievalDebugResponse;

const SERVICE = process.env.API_SERVICE_NAME || "api";

function logStage(entry: {
  severity?: "INFO" | "WARNING" | "ERROR";
  stage: string;
  status: string;
  orgId: string;
  requestId?: string;
  traceId: string;
  [key: string]: unknown;
}) {
  const { severity = "INFO", ...rest } = entry;
  console.log(JSON.stringify({
    severity,
    service: SERVICE,
    timestamp: new Date().toISOString(),
    ...rest,
  }));
}

export async function executeRetrievalDebug(
  input: RetrievalDebugRequest,
  context?: { requestId?: string; traceId?: string }
): Promise<RetrievalDebugResponse> {
  const traceId = context?.traceId ?? crypto.randomUUID();
  const body = RetrievalDebugRequestSchema.parse(input);

  logStage({
    stage: "retrieval_debug_requested",
    status: "received",
    orgId: body.orgId,
    requestId: context?.requestId,
    traceId,
    topK: body.topK,
  });

  const retrieval = await retrieveGroundedContext(
    {
      orgId: body.orgId,
      query: body.query,
      topK: body.topK,
    },
    {
      requestId: context?.requestId,
      traceId,
    }
  );

  const response = RetrievalDebugResponseSchema.parse({
    traceId,
    requestId: context?.requestId,
    orgId: body.orgId,
    requestedAt: new Date().toISOString(),
    retrieval,
    debug: {
      ranking: retrieval.results.map((result, index) => ({
        index,
        chunkId: result.chunkId,
        score: result.score,
      })),
    },
  });

  logStage({
    stage: "retrieval_debug_completed",
    status: "completed",
    orgId: body.orgId,
    requestId: context?.requestId,
    traceId,
    resultCount: response.retrieval.resultCount,
  });

  return response;
}
