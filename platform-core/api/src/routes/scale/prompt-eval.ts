import { Router } from "express";
import * as contracts from "@bluewirks/contracts";
import { assertOrgScope } from "../../middleware/internalPolicy.js";
import {
  createExperiment, listExperiments, getExperiment, runExperiment,
} from "../../services/scale/prompt-eval.js";

export const promptEvalRouter = Router();

promptEvalRouter.post("/create", async (req, res, next) => {
  try {
    const body = contracts.PromptEvalCreateRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await createExperiment(body, { requestId: req.requestId });
    res.status(201).json(out);
  } catch (error) { next(error); }
});

promptEvalRouter.post("/list", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await listExperiments(orgId, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});

promptEvalRouter.get("/:experimentId", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await getExperiment(orgId, req.params.experimentId);
    if (!out) { res.status(404).json({ error: "Experiment not found" }); return; }
    res.json(out);
  } catch (error) { next(error); }
});

promptEvalRouter.post("/:experimentId/run", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await runExperiment(orgId, req.params.experimentId, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});
