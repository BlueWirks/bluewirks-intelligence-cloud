import { Router } from "express";
import * as contracts from "@bluewirks/contracts";
import { requireInternalAuth } from "../middleware/internalAuth.js";
import { assertOrgScope, requireInternalOperatorRole } from "../middleware/internalPolicy.js";
import { retrieveGroundedContext } from "../services/retrieval.js";
import { executeGroundedGeneration } from "../services/grounded-generation.js";
import { lookupIngestionStatus } from "../services/ingestion-status.js";
import { executeRetrievalDebug } from "../services/retrieval-debug.js";
import { lookupTrace } from "../services/trace-lookup.js";
import { buildInternalErrorEnvelope } from "../services/internal-error.js";

export const internalRouter = Router();

const RetrievalRequestSchema = contracts.RetrievalRequestSchema;
const IngestionStatusLookupRequestSchema = contracts.IngestionStatusLookupRequestSchema;
const RetrievalDebugRequestSchema = contracts.RetrievalDebugRequestSchema;
const TraceLookupRequestSchema = contracts.TraceLookupRequestSchema;
const GroundedGenerationRequestSchema = contracts.GroundedGenerationRequestSchema;

internalRouter.use(requireInternalAuth);
internalRouter.use(requireInternalOperatorRole);

internalRouter.post("/retrieval", async (req, res, next) => {
  try {
    const body = RetrievalRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);

    const out = await retrieveGroundedContext(body, {
      requestId: req.requestId,
    });

    res.json(out);
  } catch (error) {
    next(error);
  }
});

internalRouter.post("/grounded-generation", async (req, res, next) => {
  try {
    const body = GroundedGenerationRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);

    const out = await executeGroundedGeneration(body, {
      requestId: req.requestId,
    });

    res.json(out);
  } catch (error) {
    next(error);
  }
});

internalRouter.post("/ingestion/status", async (req, res, next) => {
  try {
    const body = IngestionStatusLookupRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);

    const out = await lookupIngestionStatus(body, {
      requestId: req.requestId,
      traceId: body.traceId,
    });

    res.json(out);
  } catch (error) {
    next(error);
  }
});

internalRouter.post("/retrieval/debug", async (req, res, next) => {
  try {
    const body = RetrievalDebugRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);

    const out = await executeRetrievalDebug(body, {
      requestId: req.requestId,
    });

    res.json(out);
  } catch (error) {
    next(error);
  }
});

internalRouter.post("/trace/lookup", async (req, res, next) => {
  try {
    const body = TraceLookupRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);

    const out = await lookupTrace(body, {
      requestId: req.requestId,
      traceId: body.traceId,
    });

    res.json(out);
  } catch (error) {
    next(error);
  }
});

internalRouter.use((req, res) => {
  res.status(404).json(
    buildInternalErrorEnvelope({
      code: "NOT_FOUND",
      message: "Internal operator route not found",
      requestId: req.requestId,
    })
  );
});
