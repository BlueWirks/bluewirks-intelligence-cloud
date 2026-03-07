import { Router } from "express";
import * as contracts from "@bluewirks/contracts";
import { assertOrgScope } from "../../middleware/internalPolicy.js";
import { listExportConfigs, upsertExportConfig, triggerExport } from "../../services/scale/export.js";

export const exportRouter = Router();

exportRouter.post("/list", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await listExportConfigs(orgId, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});

exportRouter.post("/upsert", async (req, res, next) => {
  try {
    const body = contracts.ExportConfigUpsertRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await upsertExportConfig(body, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});

exportRouter.post("/trigger", async (req, res, next) => {
  try {
    const body = contracts.ExportTriggerRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await triggerExport(body, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});
