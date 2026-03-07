import { Router } from "express";
import { requireInternalAuth } from "../../middleware/internalAuth.js";
import { requireInternalOperatorRole } from "../../middleware/internalPolicy.js";

import { dlqRouter } from "./dlq.js";
import { costRouter } from "./cost.js";
import { retentionRouter } from "./retention.js";
import { promptEvalRouter } from "./prompt-eval.js";
import { chunksRouter } from "./chunks.js";
import { metricsRouter } from "./metrics.js";
import { rbacRouter } from "./rbac.js";
import { loadRouter } from "./load.js";
import { webhooksRouter } from "./webhooks.js";
import { exportRouter } from "./export.js";
import { anomalyRouter } from "./anomaly.js";
import { failoverRouter } from "./failover.js";
import { appBuilderRouter } from "./app-builder.js";
import { knowledgeRouter } from "./knowledge.js";
import { promptStudioRouter } from "./prompt-studio.js";
import { workflowsRouter } from "./workflows.js";
import { tenantsRouter } from "./tenants.js";

export const scaleRouter = Router();

// All scale routes require internal auth + operator role
scaleRouter.use(requireInternalAuth);
scaleRouter.use(requireInternalOperatorRole);

// Mount feature routers
scaleRouter.use("/dlq", dlqRouter);
scaleRouter.use("/cost", costRouter);
scaleRouter.use("/retention", retentionRouter);
scaleRouter.use("/prompt-eval", promptEvalRouter);
scaleRouter.use("/chunks", chunksRouter);
scaleRouter.use("/metrics", metricsRouter);
scaleRouter.use("/rbac", rbacRouter);
scaleRouter.use("/load", loadRouter);
scaleRouter.use("/webhooks", webhooksRouter);
scaleRouter.use("/export", exportRouter);
scaleRouter.use("/anomaly", anomalyRouter);
scaleRouter.use("/failover", failoverRouter);
scaleRouter.use("/apps", appBuilderRouter);
scaleRouter.use("/knowledge", knowledgeRouter);
scaleRouter.use("/prompt-studio", promptStudioRouter);
scaleRouter.use("/workflows", workflowsRouter);
scaleRouter.use("/tenants", tenantsRouter);
