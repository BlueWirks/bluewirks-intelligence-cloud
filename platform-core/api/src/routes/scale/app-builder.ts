import { Router } from "express";
import * as contracts from "@bluewirks/contracts";
import { assertOrgScope } from "../../middleware/internalPolicy.js";
import {
  listApps, createApp, getApp, updateApp, deleteApp, deployApp, testApp,
} from "../../services/scale/app-builder.js";

export const appBuilderRouter = Router();

appBuilderRouter.post("/list", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await listApps(orgId, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});

appBuilderRouter.post("/create", async (req, res, next) => {
  try {
    const body = contracts.AiAppCreateRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await createApp(body, { requestId: req.requestId });
    res.status(201).json(out);
  } catch (error) { next(error); }
});

appBuilderRouter.get("/:appId", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await getApp(orgId, req.params.appId);
    if (!out) { res.status(404).json({ error: "App not found" }); return; }
    res.json(out);
  } catch (error) { next(error); }
});

appBuilderRouter.post("/:appId/update", async (req, res, next) => {
  try {
    const body = contracts.AiAppUpdateRequestSchema.parse({
      ...req.body,
      appId: req.params.appId,
    });
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await updateApp(body, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});

appBuilderRouter.delete("/:appId", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    await deleteApp(orgId, req.params.appId);
    res.json({ ok: true });
  } catch (error) { next(error); }
});

appBuilderRouter.post("/:appId/deploy", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await deployApp(orgId, req.params.appId);
    res.json(out);
  } catch (error) { next(error); }
});

appBuilderRouter.post("/:appId/test", async (req, res, next) => {
  try {
    const body = contracts.AiAppTestRequestSchema.parse({
      ...req.body,
      appId: req.params.appId,
    });
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await testApp(body, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});
