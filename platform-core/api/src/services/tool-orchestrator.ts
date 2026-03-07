export type ChatRolePreset = "default" | "analyst" | "engineer" | "pm" | "red_team" | "executive";

export type ChatToolRequest = {
  type: "web_search" | "image_to_text";
  enabled: boolean;
  input: {
    query?: string;
    imageUrl?: string;
  };
};

export type ToolInvocation = {
  tool: "web_search" | "image_to_text";
  status: "success" | "error" | "skipped";
  latencyMs: number;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  error?: string;
};

type ToolType = ToolInvocation["tool"];
type ToolPermissionOverrides = Record<string, Partial<Record<ChatRolePreset, ToolType[]>>>;

const ROLE_TOOL_ACCESS: Record<ChatRolePreset, ToolType[]> = {
  default: ["web_search", "image_to_text"],
  analyst: ["web_search", "image_to_text"],
  engineer: ["web_search", "image_to_text"],
  pm: ["web_search"],
  red_team: ["web_search", "image_to_text"],
  executive: ["web_search"],
};

const ROLE_GUIDANCE: Record<ChatRolePreset, string> = {
  default: "Provide direct, helpful answers with concise structure.",
  analyst: "Prioritize evidence, assumptions, and risk tradeoffs.",
  engineer: "Prioritize implementation detail, constraints, and concrete steps.",
  pm: "Prioritize outcomes, scope, timelines, and user impact.",
  red_team: "Stress-test claims, identify failure modes, and challenge assumptions.",
  executive: "Prioritize high-level summary, decisions, and measurable impact.",
};

function readOverrides(): ToolPermissionOverrides {
  const raw = process.env.TOOL_PERMISSION_OVERRIDES;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as ToolPermissionOverrides;
  } catch {
    return {};
  }
}

function resolveAllowedTools(rolePreset: ChatRolePreset, orgId?: string): Set<ToolType> {
  const defaults = ROLE_TOOL_ACCESS[rolePreset] ?? ROLE_TOOL_ACCESS.default;
  if (!orgId) return new Set<ToolType>(defaults);

  const overrides = readOverrides();
  const orgRules = overrides[orgId];
  const orgAllowed = orgRules?.[rolePreset] ?? orgRules?.default;
  return new Set<ToolType>(orgAllowed ?? defaults);
}

async function runWebSearch(query: string): Promise<ToolInvocation> {
  const started = Date.now();

  if (!query.trim()) {
    return {
      tool: "web_search",
      status: "skipped",
      latencyMs: Date.now() - started,
      input: { query },
      output: {},
      error: "query missing",
    };
  }

  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1`;
    const res = await fetch(url, {
      headers: {
        "user-agent": "BlueWirks-Intelligence-Cloud/1.0",
      },
    });
    const data = (await res.json()) as {
      AbstractText?: string;
      AbstractURL?: string;
      Heading?: string;
      RelatedTopics?: Array<{ Text?: string; FirstURL?: string } | { Topics?: Array<{ Text?: string; FirstURL?: string }> }>;
    };

    const related = (data.RelatedTopics ?? [])
      .flatMap((topic) => ("Topics" in topic && Array.isArray(topic.Topics) ? topic.Topics : [topic]))
      .slice(0, 5)
      .map((item) => ({
        title: ("Text" in item ? item.Text : "")?.split(" - ")[0] ?? "Result",
        snippet: "Text" in item ? (item.Text ?? "") : "",
        url: "FirstURL" in item ? (item.FirstURL ?? "") : "",
      }))
      .filter((item) => item.snippet || item.url);

    return {
      tool: "web_search",
      status: "success",
      latencyMs: Date.now() - started,
      input: { query },
      output: {
        heading: data.Heading ?? "",
        abstract: data.AbstractText ?? "",
        abstractUrl: data.AbstractURL ?? "",
        results: related,
      },
    };
  } catch (error) {
    return {
      tool: "web_search",
      status: "error",
      latencyMs: Date.now() - started,
      input: { query },
      output: {},
      error: error instanceof Error ? error.message : "web search failed",
    };
  }
}

async function runImageToText(imageUrl?: string): Promise<ToolInvocation> {
  const started = Date.now();

  if (!imageUrl) {
    return {
      tool: "image_to_text",
      status: "skipped",
      latencyMs: Date.now() - started,
      input: {},
      output: {},
      error: "imageUrl missing",
    };
  }

  const visionEnabled = String(process.env.ENABLE_VISION_OCR ?? "false") === "true";
  const visionApiKey = process.env.GOOGLE_VISION_API_KEY;

  if (visionEnabled && visionApiKey) {
    try {
      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(visionApiKey)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { source: { imageUri: imageUrl } },
              features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
            },
          ],
        }),
      });

      const data = (await response.json()) as {
        responses?: Array<{
          fullTextAnnotation?: { text?: string };
          textAnnotations?: Array<{ description?: string }>;
          error?: { message?: string };
        }>;
      };

      const first = data.responses?.[0];
      const apiError = first?.error?.message;
      if (apiError) {
        return {
          tool: "image_to_text",
          status: "error",
          latencyMs: Date.now() - started,
          input: { imageUrl },
          output: {},
          error: apiError,
        };
      }

      const extracted = first?.fullTextAnnotation?.text
        ?? first?.textAnnotations?.[0]?.description
        ?? "";

      return {
        tool: "image_to_text",
        status: extracted ? "success" : "skipped",
        latencyMs: Date.now() - started,
        input: { imageUrl },
        output: {
          extractedText: extracted,
          confidence: extracted ? 0.9 : 0,
          mode: "google-vision",
        },
        ...(extracted ? {} : { error: "no text detected" }),
      };
    } catch (error) {
      return {
        tool: "image_to_text",
        status: "error",
        latencyMs: Date.now() - started,
        input: { imageUrl },
        output: {},
        error: error instanceof Error ? error.message : "vision request failed",
      };
    }
  }

  // Starter fallback when Vision OCR is disabled or not configured.
  return {
    tool: "image_to_text",
    status: "success",
    latencyMs: Date.now() - started,
    input: { imageUrl },
    output: {
      extractedText: [
        "[Starter OCR] Image received and processed.",
        "Detected lines are currently mocked in this starter build.",
        "Enable ENABLE_VISION_OCR=true + GOOGLE_VISION_API_KEY for live OCR.",
      ].join("\n"),
      confidence: 0.51,
      mode: "starter-mock",
    },
  };
}

export async function orchestrateTools(tools: ChatToolRequest[], rolePreset: ChatRolePreset = "default", orgId?: string): Promise<ToolInvocation[]> {
  const invocations: ToolInvocation[] = [];
  const allowed = resolveAllowedTools(rolePreset, orgId);

  for (const tool of tools) {
    if (!allowed.has(tool.type)) {
      invocations.push({
        tool: tool.type,
        status: "skipped",
        latencyMs: 0,
        input: tool.input,
        output: {},
        error: `role ${rolePreset} is not allowed to run ${tool.type}`,
      });
      continue;
    }

    if (!tool.enabled) {
      invocations.push({
        tool: tool.type,
        status: "skipped",
        latencyMs: 0,
        input: tool.input,
        output: {},
        error: "disabled",
      });
      continue;
    }

    if (tool.type === "web_search") {
      invocations.push(await runWebSearch(tool.input.query ?? ""));
      continue;
    }

    if (tool.type === "image_to_text") {
      invocations.push(await runImageToText(tool.input.imageUrl));
    }
  }

  return invocations;
}

export function buildRolePrefix(rolePreset: ChatRolePreset) {
  return ROLE_GUIDANCE[rolePreset];
}
