import { Router } from "express";
import * as contracts from "@bluewirks/contracts";
import { assertOrgScope } from "../../middleware/internalPolicy.js";
import { listThresholds, upsertThreshold, getBaseline } from "../../services/scale/anomaly.js";

export const anomalyRouter = Router();

anomalyRouter.post("/thresholds/list", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await listThresholds(orgId, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});

anomalyRouter.post("/thresholds/upsert", async (req, res, next) => {
  try {
    const body = contracts.AnomalyThresholdUpsertRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await upsertThreshold(body, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});

anomalyRouter.post("/baseline", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await getBaseline(orgId, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});
