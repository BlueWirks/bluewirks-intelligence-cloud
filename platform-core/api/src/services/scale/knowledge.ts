import { firestore } from "../firestore.js";
import { randomUUID } from "node:crypto";
import { Storage } from "@google-cloud/storage";
import { SCALE_COLLECTIONS } from "@bluewirks/contracts";
import type {
  KnowledgeWorkspaceCreateRequest, KnowledgeWorkspace,
  KnowledgeWorkspaceListResponse, KnowledgeUploadRequest,
  KnowledgeUploadResponse, KnowledgeDocument,
} from "@bluewirks/contracts";

const storage = new Storage();
const now = () => new Date().toISOString();

function workspaceCol(orgId: string) {
  return firestore.collection("orgs").doc(orgId).collection(SCALE_COLLECTIONS.knowledgeWorkspaces);
}

function docsCol(orgId: string, workspaceId: string) {
  return workspaceCol(orgId).doc(workspaceId).collection(SCALE_COLLECTIONS.knowledgeDocuments);
}

export async function listWorkspaces(
  orgId: string,
  context?: { requestId?: string },
): Promise<KnowledgeWorkspaceListResponse> {
  const snap = await workspaceCol(orgId).orderBy("createdAt", "desc").get();
  const workspaces = snap.docs.map((d) => d.data() as KnowledgeWorkspace);

  return {
    orgId,
    workspaces,
    queriedAt: now(),
  };
}

export async function createWorkspace(
  input: KnowledgeWorkspaceCreateRequest,
  context?: { requestId?: string },
): Promise<KnowledgeWorkspace> {
  const id = randomUUID();
  const ts = now();
  const workspace: KnowledgeWorkspace = {
    id,
    orgId: input.orgId,
    name: input.name,
    description: input.description,
    documentCount: 0,
    totalChunks: 0,
    createdAt: ts,
    updatedAt: ts,
  };

  await workspaceCol(input.orgId).doc(id).set(workspace);
  return workspace;
}

export async function getWorkspace(
  orgId: string,
  workspaceId: string,
): Promise<KnowledgeWorkspace | null> {
  const doc = await workspaceCol(orgId).doc(workspaceId).get();
  return doc.exists ? (doc.data() as KnowledgeWorkspace) : null;
}

export async function uploadDocument(
  input: KnowledgeUploadRequest,
  context?: { requestId?: string },
): Promise<KnowledgeUploadResponse> {
  const bucket = process.env.ASSETS_BUCKET || "bluewirks-hub-assets";
  const docId = randomUUID();
  const objectPath = `orgs/${input.orgId}/knowledge/${input.workspaceId}/${docId}/${input.filename}`;
  const gcsUri = `gs://${bucket}/${objectPath}`;

  // Create signed upload URL
  const [url] = await storage
    .bucket(bucket)
    .file(objectPath)
    .getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000,
      contentType: input.contentType,
    });

  // Create document record
  const doc: KnowledgeDocument = {
    id: docId,
    workspaceId: input.workspaceId,
    orgId: input.orgId,
    filename: input.filename,
    contentType: input.contentType,
    gcsUri,
    status: "uploading",
    chunkCount: 0,
    uploadedAt: now(),
  };

  await docsCol(input.orgId, input.workspaceId).doc(docId).set(doc);

  // Increment workspace document count
  const wsRef = workspaceCol(input.orgId).doc(input.workspaceId);
  await wsRef.update({ documentCount: (await wsRef.get()).data()?.documentCount + 1 || 1, updatedAt: now() });

  return {
    documentId: docId,
    uploadUrl: url,
    gcsUri,
    expiresInSeconds: 900,
  };
}

export async function listDocuments(
  orgId: string,
  workspaceId: string,
): Promise<KnowledgeDocument[]> {
  const snap = await docsCol(orgId, workspaceId).orderBy("uploadedAt", "desc").get();
  return snap.docs.map((d) => d.data() as KnowledgeDocument);
}

export async function deleteDocument(
  orgId: string,
  workspaceId: string,
  documentId: string,
): Promise<void> {
  await docsCol(orgId, workspaceId).doc(documentId).delete();

  const wsRef = workspaceCol(orgId).doc(workspaceId);
  const ws = await wsRef.get();
  const count = Math.max(0, ((ws.data()?.documentCount as number) || 1) - 1);
  await wsRef.update({ documentCount: count, updatedAt: now() });
}
