import { Router } from "express";
import * as contracts from "@bluewirks/contracts";
import { assertOrgScope } from "../../middleware/internalPolicy.js";
import { listRoles, createRole, updateRole, deleteRole } from "../../services/scale/rbac.js";

export const rbacRouter = Router();

rbacRouter.post("/list", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await listRoles(orgId, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});

rbacRouter.post("/create", async (req, res, next) => {
  try {
    const body = contracts.RbacRoleCreateRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await createRole(body, { requestId: req.requestId });
    res.status(201).json(out);
  } catch (error) { next(error); }
});

rbacRouter.post("/update", async (req, res, next) => {
  try {
    const body = contracts.RbacRoleUpdateRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await updateRole(body, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});

rbacRouter.delete("/:roleId", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    await deleteRole(orgId, req.params.roleId);
    res.json({ ok: true });
  } catch (error) { next(error); }
});

rbacRouter.get("/permissions", async (_req, res) => {
  res.json({ permissions: contracts.PermissionSchema.options });
});
