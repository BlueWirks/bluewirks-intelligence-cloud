import { Router } from "express";
import * as contracts from "@bluewirks/contracts";
import { assertOrgScope } from "../../middleware/internalPolicy.js";
import {
  listWorkflows, createWorkflow, getWorkflow, updateWorkflow,
  deleteWorkflow, activateWorkflow, deactivateWorkflow,
} from "../../services/scale/workflows.js";

export const workflowsRouter = Router();

workflowsRouter.post("/list", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await listWorkflows(orgId, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});

workflowsRouter.post("/create", async (req, res, next) => {
  try {
    const body = contracts.WorkflowCreateRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await createWorkflow(body, { requestId: req.requestId });
    res.status(201).json(out);
  } catch (error) { next(error); }
});

workflowsRouter.get("/:workflowId", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await getWorkflow(orgId, req.params.workflowId);
    if (!out) { res.status(404).json({ error: "Workflow not found" }); return; }
    res.json(out);
  } catch (error) { next(error); }
});

workflowsRouter.post("/:workflowId/update", async (req, res, next) => {
  try {
    const body = contracts.WorkflowUpdateRequestSchema.parse({
      ...req.body,
      workflowId: req.params.workflowId,
    });
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await updateWorkflow(body, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});

workflowsRouter.delete("/:workflowId", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    await deleteWorkflow(orgId, req.params.workflowId);
    res.json({ ok: true });
  } catch (error) { next(error); }
});

workflowsRouter.post("/:workflowId/activate", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await activateWorkflow(orgId, req.params.workflowId);
    res.json(out);
  } catch (error) { next(error); }
});

workflowsRouter.post("/:workflowId/deactivate", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await deactivateWorkflow(orgId, req.params.workflowId);
    res.json(out);
  } catch (error) { next(error); }
});
