import { Router } from "express";
import * as contracts from "@bluewirks/contracts";
import { assertOrgScope } from "../../middleware/internalPolicy.js";
import { visualizeChunks } from "../../services/scale/chunks.js";

export const chunksRouter = Router();

chunksRouter.post("/visualize", async (req, res, next) => {
  try {
    const body = contracts.ChunkVisualizeRequestSchema.parse(req.body);
    assertOrgScope(req.user?.orgId, body.orgId, req.requestId);
    const out = await visualizeChunks(body, { requestId: req.requestId });
    res.json(out);
  } catch (error) { next(error); }
});
