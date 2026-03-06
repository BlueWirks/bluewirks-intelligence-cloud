import crypto from "crypto";
import * as contracts from "@bluewirks/contracts";
import { executeGeneration } from "@bluewirks/prompt-engine";
import { retrieveGroundedContext } from "./retrieval.js";
import { classifyProviderError, withRetry } from "./retry.js";

const GroundedGenerationRequestSchema = contracts.GroundedGenerationRequestSchema;

const StrictJsonOutputSchema = contracts.StrictJsonOutputSchema;
const GroundedGenerationResponseSchema = contracts.GroundedGenerationResponseSchema;

type GroundedGenerationRequest = contracts.GroundedGenerationRequest;
type GroundedGenerationResponse = contracts.GroundedGenerationResponse;

const SERVICE = process.env.API_SERVICE_NAME || "api";
const ENABLE_GROUNDED_GENERATION_STUB =
  (process.env.ENABLE_GROUNDED_GENERATION_STUB || "true").toLowerCase() === "true";

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

function buildGroundedContext(input: { retrieval: any }): string {
  return input.retrieval.results
    .map((item: any, index: number) => {
      const src = item.trace?.sourceLabel || item.trace?.gcsUri || item.trace?.assetId || "unknown-source";
      const text = typeof item.content === "string" ? item.content : "";
      return `[${index + 1}] chunkId=${item.chunkId} source=${src} score=${item.score}\n${text}`;
    })
    .join("\n\n");
}

export async function executeGroundedGeneration(
  input: GroundedGenerationRequest,
  context?: { requestId?: string; traceId?: string }
): Promise<GroundedGenerationResponse> {
  const started = Date.now();
  const traceId = context?.traceId ?? input.traceId ?? crypto.randomUUID();
  const requestId = context?.requestId ?? input.requestId;

  let body: GroundedGenerationRequest;
  try {
    body = GroundedGenerationRequestSchema.parse(input);
  } catch (error) {
    logStage({
      severity: "ERROR",
      stage: "contract_validation",
      status: "failed",
      orgId: typeof (input as any)?.orgId === "string" ? (input as any).orgId : "unknown-org",
      requestId,
      traceId,
      error: String(error),
    });
    throw error;
  }

  logStage({
    stage: "grounded_request_received",
    status: "received",
    orgId: body.orgId,
    requestId,
    traceId,
    topK: body.topK,
    promptId: body.promptId,
  });

  const retrieval = await retrieveGroundedContext(
    {
      orgId: body.orgId,
      query: body.query,
      topK: body.topK,
    },
    { requestId, traceId }
  );

  logStage({
    stage: "grounded_assembly_completed",
    status: "assembled",
    orgId: body.orgId,
    requestId,
    traceId,
    resultCount: retrieval.resultCount,
  });

  const promptContext = buildGroundedContext({ retrieval });

  let output: unknown;
  let status: "success" | "schema_retry" | "error" = "success";
  let promptVersion = "1.0.0";
  let modelId = process.env.GENERATION_MODEL || "gemini-2.0-flash";

  if (ENABLE_GROUNDED_GENERATION_STUB) {
    output = {
      answer: retrieval.resultCount > 0
        ? `Grounded stub answer based on ${retrieval.resultCount} retrieved chunk(s).`
        : "No indexed context found for this query.",
      confidence: retrieval.resultCount > 0 ? 0.62 : 0.2,
      citations: retrieval.results.map((result: any) => ({
        chunkId: result.chunkId,
        score: result.score,
        trace: result.trace,
      })),
      fields: {
        retrievalCount: retrieval.resultCount,
        mode: "stub",
      },
    };
  } else {
    const generation = await withRetry(
      async () => executeGeneration(body.promptId, promptContext, body.query),
      {
        maxRetries: Number(process.env.API_PROVIDER_MAX_RETRIES || "2"),
        baseDelayMs: Number(process.env.API_PROVIDER_RETRY_BASE_MS || "200"),
        classify: classifyProviderError,
        onRetry: ({ attempt, delayMs, error }) => {
          logStage({
            severity: "WARNING",
            stage: "generation_retry",
            status: "retrying",
            orgId: body.orgId,
            requestId,
            traceId,
            attempt,
            delayMs,
            reason: String(error),
          });
        },
      }
    );
    status = generation.status;
    promptVersion = generation.promptVersion;
    modelId = generation.modelId;

    output = {
      ...(typeof generation.output === "object" && generation.output !== null ? generation.output : {}),
      citations: retrieval.results.map((result: any) => ({
        chunkId: result.chunkId,
        score: result.score,
        trace: result.trace,
      })),
      fields: {
        retrievalCount: retrieval.resultCount,
        mode: "provider",
      },
    };
  }

  const strictOutput = StrictJsonOutputSchema.parse(output);

  logStage({
    stage: "generation_completed",
    status: "generated",
    orgId: body.orgId,
    requestId,
    traceId,
    citations: strictOutput.citations.length,
  });

  return GroundedGenerationResponseSchema.parse({
    traceId,
    requestId,
    orgId: body.orgId,
    promptId: body.promptId,
    promptVersion,
    modelId,
    outputSchemaVersion: body.outputSchemaVersion,
    output: strictOutput,
    status,
    latencyMs: Date.now() - started,
    generatedAt: new Date().toISOString(),
    processing: [
      { stage: "retrieval", status: "retrieved", timestamp: (retrieval as any).retrievedAt ?? new Date().toISOString() },
      { stage: "grounded_assembly", status: "assembled", timestamp: new Date().toISOString() },
      { stage: "generation", status: "generated", timestamp: new Date().toISOString() },
    ],
    retrieval,
  });
 }
