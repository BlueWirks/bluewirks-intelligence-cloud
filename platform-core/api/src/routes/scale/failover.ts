import { Router } from "express";
import * as contracts from "@bluewirks/contracts";
import { assertOrgScope } from "../../middleware/internalPolicy.js";
import {
  getFailoverStatus, activateFailover, deactivateFailover, listRegions,
} from "../../services/scale/failover.js";

export const failoverRouter = Router();

failoverRouter.post("/status", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await getFailoverStatus(orgId, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});

failoverRouter.post("/activate", async (req, res, next) => {
  try {
    const body = contracts.FailoverActivateRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await activateFailover(body, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});

failoverRouter.post("/deactivate", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await deactivateFailover(orgId, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});

failoverRouter.post("/regions", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await listRegions(orgId);
    res.json({ regions: out });
  } catch (error) { next(error); }
});
