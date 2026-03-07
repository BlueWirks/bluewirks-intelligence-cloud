import { Router } from "express";
import * as contracts from "@bluewirks/contracts";
import { assertOrgScope } from "../../middleware/internalPolicy.js";
import { listDlqMessages, replayDlqMessages, purgeDlqMessages } from "../../services/scale/dlq.js";

export const dlqRouter = Router();

dlqRouter.post("/list", async (req, res, next) => {
  try {
    const body = contracts.DlqListRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await listDlqMessages(body, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});

dlqRouter.post("/replay", async (req, res, next) => {
  try {
    const body = contracts.DlqReplayRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await replayDlqMessages(body, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});

dlqRouter.post("/purge", async (req, res, next) => {
  try {
    const body = contracts.DlqPurgeRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await purgeDlqMessages(body, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});
