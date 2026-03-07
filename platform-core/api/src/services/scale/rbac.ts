import { firestore } from "../firestore.js";
import { randomUUID } from "node:crypto";
import { SCALE_COLLECTIONS } from "@bluewirks/contracts";
import type {
  RbacRoleCreateRequest, RbacRoleUpdateRequest,
  RbacRole, RbacRoleListResponse,
} from "@bluewirks/contracts";

const now = () => new Date().toISOString();

function rolesCol(orgId: string) {
  return firestore.collection("orgs").doc(orgId).collection(SCALE_COLLECTIONS.rbacRoles);
}

export async function listRoles(
  orgId: string,
  context?: { requestId?: string },
): Promise<RbacRoleListResponse> {
  const snap = await rolesCol(orgId).orderBy("createdAt", "desc").get();
  const roles = snap.docs.map((d) => d.data() as RbacRole);

  return {
    orgId,
    roles,
    queriedAt: now(),
  };
}

export async function createRole(
  input: RbacRoleCreateRequest,
  context?: { requestId?: string },
): Promise<RbacRole> {
  const id = randomUUID();
  const ts = now();
  const role: RbacRole = {
    id,
    orgId: input.orgId,
    name: input.name,
    description: input.description,
    permissions: input.permissions,
    isSystem: false,
    createdAt: ts,
    updatedAt: ts,
  };

  await rolesCol(input.orgId).doc(id).set(role);
  return role;
}

export async function updateRole(
  input: RbacRoleUpdateRequest,
  context?: { requestId?: string },
): Promise<RbacRole> {
  const ref = rolesCol(input.orgId).doc(input.roleId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("Role not found");

  const existing = doc.data() as RbacRole;
  if (existing.isSystem) throw new Error("Cannot modify system role");

  const updated: Partial<RbacRole> = { updatedAt: now() };
  if (input.name) updated.name = input.name;
  if (input.description !== undefined) updated.description = input.description;
  if (input.permissions) updated.permissions = input.permissions;

  await ref.update(updated);
  return { ...existing, ...updated } as RbacRole;
}

export async function deleteRole(
  orgId: string,
  roleId: string,
): Promise<void> {
  const ref = rolesCol(orgId).doc(roleId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("Role not found");

  const existing = doc.data() as RbacRole;
  if (existing.isSystem) throw new Error("Cannot delete system role");

  await ref.delete();
}
