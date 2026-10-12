/**
 * RealmCanvas Tenant Repository Interface & In-Memory Implementation
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 6.2, Section 8.2, Section 8.3)
 */

import type {
  Organization,
  User,
  Membership,
  OrganizationRole,
} from "../db/schema";

export interface CreateOrganizationInput {
  slug: string;
  name: string;
  plan?: Organization["plan"];
}

export interface CreateUserInput {
  authSubject: string;
  email: string;
  displayName: string;
}

export interface CreateMembershipInput {
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  status?: Membership["status"];
}

export interface ITenantRepository {
  createOrganization(input: CreateOrganizationInput): Promise<Organization>;
  findOrganizationById(id: string): Promise<Organization | null>;
  findOrganizationBySlug(slug: string): Promise<Organization | null>;

  createUser(input: CreateUserInput): Promise<User>;
  findUserById(id: string): Promise<User | null>;
  findUserByAuthSubject(authSubject: string): Promise<User | null>;
  findUserByEmail(email: string): Promise<User | null>;

  createMembership(input: CreateMembershipInput): Promise<Membership>;
  findMembership(organizationId: string, userId: string): Promise<Membership | null>;
  listMembershipsForUser(userId: string): Promise<Array<{ membership: Membership; organization: Organization }>>;
  listMembershipsForOrg(organizationId: string): Promise<Array<{ membership: Membership; user: User }>>;
  updateMembershipRole(organizationId: string, userId: string, newRole: OrganizationRole): Promise<Membership | null>;
  clear(): Promise<void>;
}

export class InMemoryTenantRepository implements ITenantRepository {
  private organizations = new Map<string, Organization>();
  private users = new Map<string, User>();
  private memberships = new Map<string, Membership>(); // key: `${organizationId}:${userId}`

  public async createOrganization(input: CreateOrganizationInput): Promise<Organization> {
    const existing = await this.findOrganizationBySlug(input.slug);
    if (existing) {
      throw new Error(`Organization slug "${input.slug}" already exists`);
    }

    const org: Organization = {
      id: crypto.randomUUID(),
      slug: input.slug.toLowerCase().trim(),
      name: input.name.trim(),
      plan: input.plan ?? "starter",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.organizations.set(org.id, org);
    return org;
  }

  public async findOrganizationById(id: string): Promise<Organization | null> {
    return this.organizations.get(id) || null;
  }

  public async findOrganizationBySlug(slug: string): Promise<Organization | null> {
    const normalized = slug.toLowerCase().trim();
    for (const org of this.organizations.values()) {
      if (org.slug === normalized) {
        return org;
      }
    }
    return null;
  }

  public async createUser(input: CreateUserInput): Promise<User> {
    const existingSubject = await this.findUserByAuthSubject(input.authSubject);
    if (existingSubject) {
      throw new Error(`User with authSubject "${input.authSubject}" already exists`);
    }

    const user: User = {
      id: crypto.randomUUID(),
      authSubject: input.authSubject,
      email: input.email.toLowerCase().trim(),
      displayName: input.displayName.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(user.id, user);
    return user;
  }

  public async findUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  public async findUserByAuthSubject(authSubject: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.authSubject === authSubject) {
        return user;
      }
    }
    return null;
  }

  public async findUserByEmail(email: string): Promise<User | null> {
    const normalized = email.toLowerCase().trim();
    for (const user of this.users.values()) {
      if (user.email === normalized) {
        return user;
      }
    }
    return null;
  }

  public async createMembership(input: CreateMembershipInput): Promise<Membership> {
    const key = `${input.organizationId}:${input.userId}`;
    if (this.memberships.has(key)) {
      throw new Error(`Membership already exists for user "${input.userId}" in organization "${input.organizationId}"`);
    }

    const membership: Membership = {
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      userId: input.userId,
      role: input.role,
      status: input.status ?? "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.memberships.set(key, membership);
    return membership;
  }

  public async findMembership(organizationId: string, userId: string): Promise<Membership | null> {
    const key = `${organizationId}:${userId}`;
    return this.memberships.get(key) || null;
  }

  public async listMembershipsForUser(
    userId: string
  ): Promise<Array<{ membership: Membership; organization: Organization }>> {
    const results: Array<{ membership: Membership; organization: Organization }> = [];

    for (const membership of this.memberships.values()) {
      if (membership.userId === userId && membership.status === "active") {
        const org = this.organizations.get(membership.organizationId);
        if (org) {
          results.push({ membership, organization: org });
        }
      }
    }

    return results;
  }

  public async listMembershipsForOrg(
    organizationId: string
  ): Promise<Array<{ membership: Membership; user: User }>> {
    const results: Array<{ membership: Membership; user: User }> = [];

    for (const membership of this.memberships.values()) {
      if (membership.organizationId === organizationId) {
        const user = this.users.get(membership.userId);
        if (user) {
          results.push({ membership, user });
        }
      }
    }

    return results;
  }

  public async updateMembershipRole(
    organizationId: string,
    userId: string,
    newRole: OrganizationRole
  ): Promise<Membership | null> {
    const key = `${organizationId}:${userId}`;
    const membership = this.memberships.get(key);
    if (!membership) return null;

    const updated: Membership = {
      ...membership,
      role: newRole,
      updatedAt: new Date(),
    };

    this.memberships.set(key, updated);
    return updated;
  }

  public async clear(): Promise<void> {
    this.organizations.clear();
    this.users.clear();
    this.memberships.clear();
  }
}
