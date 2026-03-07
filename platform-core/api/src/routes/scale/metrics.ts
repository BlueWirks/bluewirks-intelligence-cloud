import { Router } from "express";
import * as contracts from "@bluewirks/contracts";
import { assertOrgScope } from "../../middleware/internalPolicy.js";
import { getTraceMetrics, createCustomMetric, listCustomMetrics } from "../../services/scale/metrics.js";

export const metricsRouter = Router();

metricsRouter.post("/traces", async (req, res, next) => {
  try {
    const body = contracts.TraceMetricsRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await getTraceMetrics(body, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});

metricsRouter.post("/custom", async (req, res, next) => {
  try {
    const body = contracts.CustomMetricCreateRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await createCustomMetric(body, { requestId: req.requestId });
    res.status(201).json(out);
  } catch (error) { next(error); }
});

metricsRouter.post("/custom/list", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await listCustomMetrics(orgId);
    res.json(out);
  } catch (error) { next(error); }
});
