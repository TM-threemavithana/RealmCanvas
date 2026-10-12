/**
 * RealmCanvas Tenant Service & Server-Side Multi-Tenancy Guards
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 3.5, Section 6.2, Section 8.3, Section 10.2)
 */

import {
  type Organization,
  type User,
  type Membership,
  type OrganizationRole,
  hasMinimumRole,
} from "../db/schema";
import type { ITenantRepository } from "./TenantRepository";

export class TenantAccessDeniedError extends Error {
  constructor(message = "Access denied: actor is not a member of the requested organization.") {
    super(message);
    this.name = "TenantAccessDeniedError";
  }
}

export class InsufficientRoleError extends Error {
  constructor(message = "Insufficient permissions for the requested organization operation.") {
    super(message);
    this.name = "InsufficientRoleError";
  }
}

export class TenantNotFoundError extends Error {
  constructor(message = "Organization not found.") {
    super(message);
    this.name = "TenantNotFoundError";
  }
}

export class UserNotFoundError extends Error {
  constructor(message = "User not found.") {
    super(message);
    this.name = "UserNotFoundError";
  }
}

export class TenantService {
  constructor(private repo: ITenantRepository) {}

  /**
   * Enforces server-side tenant isolation (Section 8.3 Invariant #2).
   * Verifies that the actor user is an active member of the specified organization
   * with at least the required role. Throws on unauthorized access.
   */
  public async assertTenantAccess(
    actorUserId: string,
    targetOrganizationId: string,
    requiredRole: OrganizationRole = "analyst"
  ): Promise<Membership> {
    const membership = await this.repo.findMembership(targetOrganizationId, actorUserId);

    if (!membership || membership.status !== "active") {
      throw new TenantAccessDeniedError(
        `User "${actorUserId}" has no active membership in organization "${targetOrganizationId}".`
      );
    }

    if (!hasMinimumRole(membership.role, requiredRole)) {
      throw new InsufficientRoleError(
        `User "${actorUserId}" holds role "${membership.role}" but "${requiredRole}" is required.`
      );
    }

    return membership;
  }

  /**
   * Retrieves an organization record guarded by tenant boundary membership.
   */
  public async getScopedOrganization(
    actorUserId: string,
    organizationId: string
  ): Promise<Organization> {
    await this.assertTenantAccess(actorUserId, organizationId, "analyst");

    const org = await this.repo.findOrganizationById(organizationId);
    if (!org) {
      throw new TenantNotFoundError(`Organization "${organizationId}" does not exist.`);
    }

    return org;
  }

  /**
   * Creates a new organization and immediately provisions the creator as the "owner".
   */
  public async createTenant(
    actorUserId: string,
    input: { name: string; slug: string; plan?: Organization["plan"] }
  ): Promise<{ organization: Organization; membership: Membership }> {
    const user = await this.repo.findUserById(actorUserId);
    if (!user) {
      throw new UserNotFoundError(`Actor user "${actorUserId}" not found.`);
    }

    const org = await this.repo.createOrganization({
      name: input.name,
      slug: input.slug,
      plan: input.plan ?? "starter",
    });

    const membership = await this.repo.createMembership({
      organizationId: org.id,
      userId: user.id,
      role: "owner",
      status: "active",
    });

    return { organization: org, membership };
  }

  /**
   * Adds or invites a member to an organization.
   * Requires at least "owner" or "editor" role to invite.
   */
  public async addMember(
    actorUserId: string,
    organizationId: string,
    targetUserId: string,
    role: OrganizationRole
  ): Promise<Membership> {
    // Only an owner or editor can invite/add new members
    await this.assertTenantAccess(actorUserId, organizationId, "editor");

    const targetUser = await this.repo.findUserById(targetUserId);
    if (!targetUser) {
      throw new UserNotFoundError(`Target user "${targetUserId}" not found.`);
    }

    return this.repo.createMembership({
      organizationId,
      userId: targetUserId,
      role,
      status: "active",
    });
  }

  /**
   * Lists all members of an organization, protected by tenant membership.
   */
  public async listOrganizationMembers(
    actorUserId: string,
    organizationId: string
  ): Promise<Array<{ membership: Membership; user: User }>> {
    await this.assertTenantAccess(actorUserId, organizationId, "analyst");
    return this.repo.listMembershipsForOrg(organizationId);
  }

  /**
   * Lists all organizations accessible to a user.
   */
  public async listUserOrganizations(
    userId: string
  ): Promise<Array<{ membership: Membership; organization: Organization }>> {
    return this.repo.listMembershipsForUser(userId);
  }

  /**
   * Updates an existing member's role.
   * Only an "owner" can change member roles.
   */
  public async updateMemberRole(
    actorUserId: string,
    organizationId: string,
    targetUserId: string,
    newRole: OrganizationRole
  ): Promise<Membership> {
    // Only an owner can promote or demote members
    await this.assertTenantAccess(actorUserId, organizationId, "owner");

    const updated = await this.repo.updateMembershipRole(organizationId, targetUserId, newRole);
    if (!updated) {
      throw new TenantAccessDeniedError(
        `Target member "${targetUserId}" not found in organization "${organizationId}".`
      );
    }

    return updated;
  }
}
