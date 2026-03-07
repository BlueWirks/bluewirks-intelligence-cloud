import { Router } from "express";
import { z } from "zod";
import { buildRolePrefix, orchestrateTools, type ChatRolePreset, type ChatToolRequest, type ToolInvocation } from "../services/tool-orchestrator.js";
import { listToolAudit, writeToolAudit } from "../services/tool-audit.js";

export const chatRouter = Router();

const ChatReq = z.object({
  threadId: z.string().optional(),
  orgId: z.string().min(1).optional(),
  message: z.string().min(1),
  rolePreset: z.enum(["default", "analyst", "engineer", "pm", "red_team", "executive"]).default("default"),
  tools: z.array(z.object({
    type: z.enum(["web_search", "image_to_text"]),
    enabled: z.boolean().default(true),
    input: z.object({
      query: z.string().min(1).optional(),
      imageUrl: z.string().url().optional(),
    }).default({}),
  })).default([]),
});

const ChatAuditQuery = z.object({
  orgId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  q: z.string().optional(),
});

const RetryReq = z.object({
  orgId: z.string().min(1).optional(),
  rolePreset: z.enum(["default", "analyst", "engineer", "pm", "red_team", "executive"]).default("default"),
  threadId: z.string().optional(),
  tool: z.object({
    type: z.enum(["web_search", "image_to_text"]),
    enabled: z.boolean().default(true),
    input: z.object({
      query: z.string().min(1).optional(),
      imageUrl: z.string().url().optional(),
    }).default({}),
  }),
});

const ChatRes = z.object({
  threadId: z.string().min(1),
  response: z.object({
    text: z.string().min(1),
    citations: z.array(z.any()).default([]),
    rolePreset: z.enum(["default", "analyst", "engineer", "pm", "red_team", "executive"]),
    toolInvocations: z.array(z.object({
      tool: z.enum(["web_search", "image_to_text"]),
      status: z.enum(["success", "error", "skipped"]),
      latencyMs: z.number().int().min(0),
      input: z.record(z.unknown()).default({}),
      output: z.record(z.unknown()).default({}),
      error: z.string().optional(),
    })).default([]),
  }),
});

function resolveOrgId(bodyOrgId: string | undefined, reqOrgId: string | undefined) {
  return bodyOrgId ?? reqOrgId ?? "dev-org";
}

function buildResponseText(rolePreset: ChatRolePreset, message: string, toolInvocations: ToolInvocation[]) {
  const rolePrefix = buildRolePrefix(rolePreset);

  const webSearchSummary = toolInvocations
    .filter((t) => t.tool === "web_search" && t.status === "success")
    .map((t) => {
      const out = t.output as { heading?: string; abstract?: string };
      return [out.heading, out.abstract].filter(Boolean).join(": ");
    })
    .filter(Boolean)
    .join("\n");

  const ocrSummary = toolInvocations
    .filter((t) => t.tool === "image_to_text" && t.status === "success")
    .map((t) => {
      const out = t.output as { extractedText?: string };
      return out.extractedText ?? "";
    })
    .filter(Boolean)
    .join("\n");

  return [
    `Role (${rolePreset}): ${rolePrefix}`,
    `You asked: "${message}"`,
    webSearchSummary ? `\nWeb findings:\n${webSearchSummary}` : "",
    ocrSummary ? `\nImage-to-text:\n${ocrSummary}` : "",
  ].filter(Boolean).join("\n");
}

async function generateChat(body: z.infer<typeof ChatReq>, reqOrgId?: string, requestId?: string) {
  const orgId = resolveOrgId(body.orgId, reqOrgId);
  const threadId = body.threadId ?? "thread_dev";
  const toolInvocations = await orchestrateTools(body.tools, body.rolePreset, orgId);
  const text = buildResponseText(body.rolePreset, body.message, toolInvocations);

  const response = ChatRes.parse({
    threadId,
    response: {
      text,
      citations: [],
      rolePreset: body.rolePreset,
      toolInvocations,
    },
  });

  void writeToolAudit({
    orgId,
    threadId,
    rolePreset: body.rolePreset,
    requestId,
    message: body.message,
    toolInvocations,
  }).catch(() => undefined);

  return response;
}

chatRouter.post("/", async (req, res) => {
  const body = ChatReq.parse(req.body);
  const response = await generateChat(body, req.user?.orgId, req.requestId);
  res.json(response);
});

chatRouter.post("/stream", async (req, res) => {
  const body = ChatReq.parse(req.body);
  const response = await generateChat(body, req.user?.orgId, req.requestId);

  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  res.write(`${JSON.stringify({
    type: "meta",
    threadId: response.threadId,
    rolePreset: response.response.rolePreset,
    toolInvocations: response.response.toolInvocations,
  })}\n`);

  const chunks = response.response.text.split(/(\s+)/).filter(Boolean);
  for (const part of chunks) {
    res.write(`${JSON.stringify({ type: "chunk", text: part })}\n`);
    // lightweight simulated stream cadence
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 15));
  }

  res.write(`${JSON.stringify({ type: "done", response })}\n`);
  res.end();
});

chatRouter.get("/audit", async (req, res, next) => {
  try {
    const q = ChatAuditQuery.parse(req.query);
    const orgId = resolveOrgId(q.orgId, req.user?.orgId);
    const items = await listToolAudit(orgId, q.limit, q.q);
    res.json({ orgId, count: items.length, items });
  } catch (error) {
    next(error);
  }
});

chatRouter.post("/tools/retry", async (req, res, next) => {
  try {
    const body = RetryReq.parse(req.body);
    const orgId = resolveOrgId(body.orgId, req.user?.orgId);
    const threadId = body.threadId ?? "thread_dev";
    const [invocation] = await orchestrateTools([body.tool as ChatToolRequest], body.rolePreset, orgId);

    void writeToolAudit({
      orgId,
      threadId,
      rolePreset: body.rolePreset,
      requestId: req.requestId,
      message: `tool retry: ${body.tool.type}`,
      toolInvocations: invocation ? [invocation] : [],
    }).catch(() => undefined);

    res.json({ orgId, threadId, invocation });
  } catch (error) {
    next(error);
  }
});
