import { Router } from "express";
import * as contracts from "@bluewirks/contracts";
import { assertOrgScope } from "../../middleware/internalPolicy.js";
import {
  listWorkspaces, createWorkspace, getWorkspace,
  uploadDocument, listDocuments, deleteDocument,
} from "../../services/scale/knowledge.js";

export const knowledgeRouter = Router();

knowledgeRouter.post("/list", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await listWorkspaces(orgId, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});

knowledgeRouter.post("/create", async (req, res, next) => {
  try {
    const body = contracts.KnowledgeWorkspaceCreateRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await createWorkspace(body, { requestId: req.requestId });
    res.status(201).json(out);
  } catch (error) { next(error); }
});

knowledgeRouter.get("/:workspaceId", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await getWorkspace(orgId, req.params.workspaceId);
    if (!out) { res.status(404).json({ error: "Workspace not found" }); return; }
    res.json(out);
  } catch (error) { next(error); }
});

knowledgeRouter.post("/:workspaceId/upload", async (req, res, next) => {
  try {
    const body = contracts.KnowledgeUploadRequestSchema.parse({
      ...req.body,
      workspaceId: req.params.workspaceId,
    });
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await uploadDocument(body, { requestId: req.requestId });
    res.status(201).json(out);
  } catch (error) { next(error); }
});

knowledgeRouter.get("/:workspaceId/documents", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const out = await listDocuments(orgId, req.params.workspaceId);
    res.json({ documents: out });
  } catch (error) { next(error); }
});

knowledgeRouter.delete("/:workspaceId/documents/:documentId", async (req, res, next) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) { res.status(401).json({ error: "Unauthorized" }); return; }
    await deleteDocument(orgId, req.params.workspaceId, req.params.documentId);
    res.json({ ok: true });
  } catch (error) { next(error); }
});
