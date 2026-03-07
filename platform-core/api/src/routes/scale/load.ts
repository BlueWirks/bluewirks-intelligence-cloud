import { Router } from "express";
import * as contracts from "@bluewirks/contracts";
import { assertOrgScope } from "../../middleware/internalPolicy.js";
import { triggerLoadTest, getLoadTestStatus, stopLoadTest } from "../../services/scale/load.js";

export const loadRouter = Router();

loadRouter.post("/trigger", async (req, res, next) => {
  try {
    const body = contracts.LoadTestTriggerRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await triggerLoadTest(body, { requestId: req.requestId });
    res.status(201).json(out);
  } catch (error) { next(error); }
});

loadRouter.post("/status", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const testId = req.body?.testId as string | undefined;
    const out = await getLoadTestStatus(orgId, testId, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});

loadRouter.post("/stop", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const { testId } = req.body as { testId: string };
    const out = await stopLoadTest(orgId, testId);
    res.json(out);
  } catch (error) { next(error); }
});
