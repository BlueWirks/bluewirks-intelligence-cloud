import { firestore } from "./firestore.js";
import type { ChatRolePreset, ToolInvocation } from "./tool-orchestrator.js";

interface WriteAuditInput {
  orgId: string;
  threadId: string;
  rolePreset: ChatRolePreset;
  requestId?: string;
  message: string;
  toolInvocations: ToolInvocation[];
}

export interface ToolAuditEntry {
  id: string;
  orgId: string;
  threadId: string;
  rolePreset: ChatRolePreset;
  requestId?: string;
  message: string;
  tool: ToolInvocation["tool"];
  status: ToolInvocation["status"];
  latencyMs: number;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  error?: string;
  createdAt: string;
}

function collectionRef(orgId: string) {
  return firestore
    .collection("orgs")
    .doc(orgId)
    .collection("tool_audit");
}

export async function writeToolAudit(input: WriteAuditInput): Promise<void> {
  if (!input.toolInvocations.length) return;

  const createdAt = new Date().toISOString();
  const batch = firestore.batch();
  const col = collectionRef(input.orgId);

  for (const inv of input.toolInvocations) {
    const ref = col.doc();
    batch.set(ref, {
      orgId: input.orgId,
      threadId: input.threadId,
      rolePreset: input.rolePreset,
      requestId: input.requestId,
      message: input.message,
      tool: inv.tool,
      status: inv.status,
      latencyMs: inv.latencyMs,
      input: inv.input,
      output: inv.output,
      error: inv.error,
      createdAt,
    });
  }

  await batch.commit();
}

export async function listToolAudit(orgId: string, limit = 50, query?: string): Promise<ToolAuditEntry[]> {
  const lim = Math.max(1, Math.min(limit, 200));

  const snapshot = await collectionRef(orgId)
    .orderBy("createdAt", "desc")
    .limit(lim)
    .get();

  const entries = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<ToolAuditEntry, "id">) }));

  if (!query?.trim()) return entries;

  const q = query.trim().toLowerCase();
  return entries.filter((entry) => [
    entry.tool,
    entry.status,
    entry.message,
    entry.rolePreset,
    entry.threadId,
    entry.error ?? "",
  ].join(" ").toLowerCase().includes(q));
}
