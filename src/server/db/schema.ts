/**
 * RealmCanvas Core Relational Schema & Typed DTOs
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 8.1, Section 8.2, Section 8.3)
 */

export type OrganizationPlan = "starter" | "pro" | "enterprise";

export interface Organization {
  id: string; // UUID PK
  slug: string; // UNIQUE
  name: string;
  plan: OrganizationPlan;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string; // UUID PK
  authSubject: string; // UNIQUE (external auth provider identifier)
  email: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ORGANIZATION_ROLES = ["owner", "editor", "analyst"] as const;
export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];

export const MEMBERSHIP_STATUSES = ["active", "invited", "suspended"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export interface Membership {
  id: string; // UUID PK
  organizationId: string; // FK -> organizations.id
  userId: string; // FK -> users.id
  role: OrganizationRole;
  status: MembershipStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Role capability rankings for permission checks
 * owner (3) > editor (2) > analyst (1)
 */
export const ROLE_HIERARCHY: Record<OrganizationRole, number> = {
  owner: 3,
  editor: 2,
  analyst: 1,
};

export function hasMinimumRole(userRole: OrganizationRole, requiredRole: OrganizationRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
