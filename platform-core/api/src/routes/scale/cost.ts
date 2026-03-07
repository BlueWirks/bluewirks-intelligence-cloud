import { Router } from "express";
import * as contracts from "@bluewirks/contracts";
import { assertOrgScope } from "../../middleware/internalPolicy.js";
import { getCostSummary } from "../../services/scale/cost.js";

export const costRouter = Router();

costRouter.post("/summary", async (req, res, next) => {
  try {
    const body = contracts.CostSummaryRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await getCostSummary(body, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});
