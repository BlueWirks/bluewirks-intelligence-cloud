import { Router } from "express";
import * as contracts from "@bluewirks/contracts";
import { assertOrgScope } from "../../middleware/internalPolicy.js";
import {
  listTenants, getTenant, updateTenantIsolation,
  getTenantAudit, verifyTenantIsolation,
} from "../../services/scale/tenants.js";

export const tenantsRouter = Router();

tenantsRouter.post("/list", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await listTenants(orgId, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});

tenantsRouter.get("/:tenantId", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await getTenant(orgId, req.params.tenantId);
    if (!out) { res.status(404).json({ error: "Tenant not found" }); return; }
    res.json(out);
  } catch (error) { next(error); }
});

tenantsRouter.post("/:tenantId/isolation", async (req, res, next) => {
  try {
    const body = contracts.TenantConfigUpdateRequestSchema.parse({
      ...req.body,
      tenantId: req.params.tenantId,
    });
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await updateTenantIsolation(body, {
      requestId: req.requestId,
      actor: req.user?.role,
    });
    res.json(out);
  } catch (error) { next(error); }
});

tenantsRouter.get("/:tenantId/audit", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await getTenantAudit(orgId, req.params.tenantId, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});

tenantsRouter.post("/:tenantId/verify", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await verifyTenantIsolation(orgId, req.params.tenantId, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});
