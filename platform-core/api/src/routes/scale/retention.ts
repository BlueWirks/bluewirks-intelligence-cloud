import { Router } from "express";
import * as contracts from "@bluewirks/contracts";
import { assertOrgScope } from "../../middleware/internalPolicy.js";
import {
  listRetentionPolicies, upsertRetentionPolicy, deleteRetentionPolicy,
} from "../../services/scale/retention.js";

export const retentionRouter = Router();

retentionRouter.post("/list", async (req, res, next) => {
  try {
    const body = contracts.RetentionListRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await listRetentionPolicies(body, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});

retentionRouter.post("/upsert", async (req, res, next) => {
  try {
    const body = contracts.RetentionUpsertRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await upsertRetentionPolicy(body, {
      requestId: req.requestId,
      actor: req.user?.role,
    });
    res.json(out);
  } catch (error) { next(error); }
});

retentionRouter.delete("/:collection", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    await deleteRetentionPolicy(orgId, req.params.collection);
    res.json({ ok: true });
  } catch (error) { next(error); }
});
