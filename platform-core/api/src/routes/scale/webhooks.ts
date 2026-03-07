import { Router } from "express";
import * as contracts from "@bluewirks/contracts";
import { assertOrgScope } from "../../middleware/internalPolicy.js";
import {
  listWebhooks, createWebhook, updateWebhook, deleteWebhook, testWebhook,
} from "../../services/scale/webhooks.js";

export const webhooksRouter = Router();

webhooksRouter.post("/list", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await listWebhooks(orgId, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});

webhooksRouter.post("/create", async (req, res, next) => {
  try {
    const body = contracts.WebhookCreateRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await createWebhook(body, { requestId: req.requestId });
    res.status(201).json(out);
  } catch (error) { next(error); }
});

webhooksRouter.post("/update", async (req, res, next) => {
  try {
    const body = contracts.WebhookUpdateRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await updateWebhook(body, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});

webhooksRouter.delete("/:webhookId", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    await deleteWebhook(orgId, req.params.webhookId);
    res.json({ ok: true });
  } catch (error) { next(error); }
});

webhooksRouter.post("/:webhookId/test", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await testWebhook(orgId, req.params.webhookId);
    res.json(out);
  } catch (error) { next(error); }
});
