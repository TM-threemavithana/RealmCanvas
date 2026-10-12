import { describe, it, expect, beforeEach } from "vitest";
import {
  InMemoryTenantRepository,
} from "@/server/tenancy/TenantRepository";
import {
  TenantService,
  TenantAccessDeniedError,
  InsufficientRoleError,
} from "@/server/tenancy/TenantService";
import type { User } from "@/server/db/schema";

describe("Tenant Service & Multi-Tenancy Boundary Scaffolding (RC-011)", () => {
  let repo: InMemoryTenantRepository;
  let service: TenantService;

  let alice: User;
  let bob: User;
  let charlie: User;

  beforeEach(async () => {
    repo = new InMemoryTenantRepository();
    service = new TenantService(repo);

    alice = await repo.createUser({
      authSubject: "auth0|alice_123",
      email: "alice@acme.com",
      displayName: "Alice Acme",
    });

    bob = await repo.createUser({
      authSubject: "auth0|bob_456",
      email: "bob@beta.com",
      displayName: "Bob Beta",
    });

    charlie = await repo.createUser({
      authSubject: "auth0|charlie_789",
      email: "charlie@consultant.com",
      displayName: "Charlie Consultant",
    });
  });

  describe("Tenant Creation & Ownership Provisioning", () => {
    it("creates an organization and provisions creator as owner", async () => {
      const { organization, membership } = await service.createTenant(alice.id, {
        name: "Acme Corporation",
        slug: "acme-corp",
        plan: "pro",
      });

      expect(organization.id).toBeTruthy();
      expect(organization.slug).toBe("acme-corp");
      expect(organization.plan).toBe("pro");

      expect(membership.organizationId).toBe(organization.id);
      expect(membership.userId).toBe(alice.id);
      expect(membership.role).toBe("owner");
      expect(membership.status).toBe("active");
    });

    it("enforces slug uniqueness and rejects duplicate organization slugs", async () => {
      await service.createTenant(alice.id, {
        name: "Acme Corporation",
        slug: "acme-corp",
      });

      await expect(
        service.createTenant(bob.id, {
          name: "Acme Impostor",
          slug: "acme-corp",
        })
      ).rejects.toThrow(/already exists/i);
    });
  });

  describe("Negative Cross-Tenant Access Rejection (Section 8.3 & Section 10.2)", () => {
    it("strictly prevents User A from accessing User B's organization data", async () => {
      const { organization: acmeOrg } = await service.createTenant(alice.id, {
        name: "Acme Corporation",
        slug: "acme-corp",
      });

      const { organization: betaOrg } = await service.createTenant(bob.id, {
        name: "Beta Ltd",
        slug: "beta-ltd",
      });

      // Alice successfully reads Acme
      const acmeData = await service.getScopedOrganization(alice.id, acmeOrg.id);
      expect(acmeData.name).toBe("Acme Corporation");

      // Alice attempts to read Beta -> BLOCKED
      await expect(
        service.getScopedOrganization(alice.id, betaOrg.id)
      ).rejects.toThrowError(TenantAccessDeniedError);

      // Bob attempts to read Acme -> BLOCKED
      await expect(
        service.getScopedOrganization(bob.id, acmeOrg.id)
      ).rejects.toThrowError(TenantAccessDeniedError);

      // Alice attempts to list Beta members -> BLOCKED
      await expect(
        service.listOrganizationMembers(alice.id, betaOrg.id)
      ).rejects.toThrowError(TenantAccessDeniedError);

      // Bob attempts to add a member to Acme -> BLOCKED
      await expect(
        service.addMember(bob.id, acmeOrg.id, charlie.id, "editor")
      ).rejects.toThrowError(TenantAccessDeniedError);
    });
  });

  describe("Role Hierarchy & Privilege Guards", () => {
    it("allows owner to invite editors and analysts", async () => {
      const { organization: org } = await service.createTenant(alice.id, {
        name: "Acme Corporation",
        slug: "acme-corp",
      });

      const editorMembership = await service.addMember(alice.id, org.id, bob.id, "editor");
      expect(editorMembership.role).toBe("editor");

      const analystMembership = await service.addMember(alice.id, org.id, charlie.id, "analyst");
      expect(analystMembership.role).toBe("analyst");

      const members = await service.listOrganizationMembers(alice.id, org.id);
      expect(members.length).toBe(3);
    });

    it("prevents analyst from adding or inviting members", async () => {
      const { organization: org } = await service.createTenant(alice.id, {
        name: "Acme Corporation",
        slug: "acme-corp",
      });

      await service.addMember(alice.id, org.id, charlie.id, "analyst");

      // Charlie (analyst) attempts to add Bob
      await expect(
        service.addMember(charlie.id, org.id, bob.id, "editor")
      ).rejects.toThrowError(InsufficientRoleError);
    });

    it("allows owner to promote/demote member roles, but rejects non-owners", async () => {
      const { organization: org } = await service.createTenant(alice.id, {
        name: "Acme Corporation",
        slug: "acme-corp",
      });

      await service.addMember(alice.id, org.id, bob.id, "editor");
      await service.addMember(alice.id, org.id, charlie.id, "analyst");

      // Bob (editor) attempts to promote Charlie -> BLOCKED (only owner can modify roles)
      await expect(
        service.updateMemberRole(bob.id, org.id, charlie.id, "editor")
      ).rejects.toThrowError(InsufficientRoleError);

      // Alice (owner) successfully promotes Charlie to editor
      const updated = await service.updateMemberRole(alice.id, org.id, charlie.id, "editor");
      expect(updated.role).toBe("editor");
    });
  });

  describe("Multi-Organization Membership Resolution", () => {
    it("correctly lists only organizations where user has active membership", async () => {
      const { organization: org1 } = await service.createTenant(alice.id, {
        name: "First Venture",
        slug: "first-venture",
      });

      const { organization: org2 } = await service.createTenant(bob.id, {
        name: "Second Venture",
        slug: "second-venture",
      });

      // Add Charlie to both organizations
      await service.addMember(alice.id, org1.id, charlie.id, "editor");
      await service.addMember(bob.id, org2.id, charlie.id, "analyst");

      // Alice sees only Org 1
      const aliceOrgs = await service.listUserOrganizations(alice.id);
      expect(aliceOrgs.length).toBe(1);
      expect(aliceOrgs[0].organization.slug).toBe("first-venture");

      // Bob sees only Org 2
      const bobOrgs = await service.listUserOrganizations(bob.id);
      expect(bobOrgs.length).toBe(1);
      expect(bobOrgs[0].organization.slug).toBe("second-venture");

      // Charlie sees both Org 1 and Org 2
      const charlieOrgs = await service.listUserOrganizations(charlie.id);
      expect(charlieOrgs.length).toBe(2);
      const charlieSlugs = charlieOrgs.map((o) => o.organization.slug);
      expect(charlieSlugs).toContain("first-venture");
      expect(charlieSlugs).toContain("second-venture");
    });
  });
});
