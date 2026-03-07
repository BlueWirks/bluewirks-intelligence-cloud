import { Router } from "express";
import * as contracts from "@bluewirks/contracts";
import { assertOrgScope } from "../../middleware/internalPolicy.js";
import {
  listTemplates, createTemplate, getTemplate, updateTemplate,
  deleteTemplate, testTemplate,
} from "../../services/scale/prompt-studio.js";

export const promptStudioRouter = Router();

promptStudioRouter.post("/list", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await listTemplates(orgId, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});

promptStudioRouter.post("/create", async (req, res, next) => {
  try {
    const body = contracts.PromptTemplateCreateRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await createTemplate(body, { requestId: req.requestId });
    res.status(201).json(out);
  } catch (error) { next(error); }
});

promptStudioRouter.get("/:templateId", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await getTemplate(orgId, req.params.templateId);
    if (!out) { res.status(404).json({ error: "Template not found" }); return; }
    res.json(out);
  } catch (error) { next(error); }
});

promptStudioRouter.post("/:templateId/update", async (req, res, next) => {
  try {
    const body = contracts.PromptTemplateUpdateRequestSchema.parse({
      ...req.body,
      templateId: req.params.templateId,
    });
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await updateTemplate(body, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});

promptStudioRouter.delete("/:templateId", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    await deleteTemplate(orgId, req.params.templateId);
    res.json({ ok: true });
  } catch (error) { next(error); }
});

promptStudioRouter.post("/:templateId/test", async (req, res, next) => {
  try {
    const body = contracts.PromptTestRequestSchema.parse({
      ...req.body,
      templateId: req.params.templateId,
    });
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await testTemplate(body, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});
