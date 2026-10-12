import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  TokenAuthProvider,
  type AuthenticatedPrincipal,
} from "@/server/auth/AuthContext";
import {
  requireAuthenticated,
  requireTenantRole,
  createGuardedAction,
  AuthenticationRequiredError,
  ForbiddenTenantAccessError,
} from "@/server/auth/RoleGuards";
import { InMemoryTenantRepository } from "@/server/tenancy/TenantRepository";
import { TenantService } from "@/server/tenancy/TenantService";
import type { Organization, User } from "@/server/db/schema";

describe("Server-Side Auth and Role Guards (RC-012)", () => {
  let authProvider: TokenAuthProvider;
  let repo: InMemoryTenantRepository;
  let tenantService: TenantService;

  let alice: User;
  let bob: User;
  let charlie: User;

  let alicePrincipal: AuthenticatedPrincipal;
  let bobPrincipal: AuthenticatedPrincipal;
  let charliePrincipal: AuthenticatedPrincipal;

  let aliceToken: string;
  let bobToken: string;
  let charlieToken: string;

  let acmeOrg: Organization;
  let betaOrg: Organization;

  beforeEach(async () => {
    authProvider = new TokenAuthProvider();
    repo = new InMemoryTenantRepository();
    tenantService = new TenantService(repo);

    alice = await repo.createUser({
      authSubject: "auth0|alice",
      email: "alice@acme.com",
      displayName: "Alice Owner",
    });

    bob = await repo.createUser({
      authSubject: "auth0|bob",
      email: "bob@acme.com",
      displayName: "Bob Editor",
    });

    charlie = await repo.createUser({
      authSubject: "auth0|charlie",
      email: "charlie@acme.com",
      displayName: "Charlie Analyst",
    });

    alicePrincipal = {
      userId: alice.id,
      authSubject: alice.authSubject,
      email: alice.email,
      displayName: alice.displayName,
    };

    bobPrincipal = {
      userId: bob.id,
      authSubject: bob.authSubject,
      email: bob.email,
      displayName: bob.displayName,
    };

    charliePrincipal = {
      userId: charlie.id,
      authSubject: charlie.authSubject,
      email: charlie.email,
      displayName: charlie.displayName,
    };

    aliceToken = authProvider.createSessionToken(alicePrincipal);
    bobToken = authProvider.createSessionToken(bobPrincipal);
    charlieToken = authProvider.createSessionToken(charliePrincipal);

    // Alice creates Acme Corp (she is Owner)
    const { organization: acme } = await tenantService.createTenant(alice.id, {
      name: "Acme Corp",
      slug: "acme-corp",
    });
    acmeOrg = acme;

    // Bob is added as Editor in Acme Corp
    await tenantService.addMember(alice.id, acmeOrg.id, bob.id, "editor");

    // Charlie is added as Analyst in Acme Corp
    await tenantService.addMember(alice.id, acmeOrg.id, charlie.id, "analyst");

    // Bob creates Beta Org (he is Owner of Beta, Alice is NOT a member of Beta)
    const { organization: beta } = await tenantService.createTenant(bob.id, {
      name: "Beta Org",
      slug: "beta-org",
    });
    betaOrg = beta;
  });

  describe("Authentication Guard (401 Verification)", () => {
    it("resolves principal when valid Bearer session token is provided", async () => {
      const headers = { authorization: `Bearer ${aliceToken}` };
      const principal = await requireAuthenticated(authProvider, headers);

      expect(principal.userId).toBe(alice.id);
      expect(principal.email).toBe("alice@acme.com");
    });

    it("rejects request with 401 AuthenticationRequiredError when header is missing", async () => {
      const emptyHeaders = {};
      await expect(requireAuthenticated(authProvider, emptyHeaders)).rejects.toThrowError(
        AuthenticationRequiredError
      );
    });

    it("rejects request with 401 when token is invalid or malformed", async () => {
      const invalidHeaders = { authorization: "Bearer invalid_nonexistent_token" };
      await expect(requireAuthenticated(authProvider, invalidHeaders)).rejects.toThrowError(
        AuthenticationRequiredError
      );

      const nonBearerHeaders = { authorization: "Basic dXNlcjpwYXNz" };
      await expect(requireAuthenticated(authProvider, nonBearerHeaders)).rejects.toThrowError(
        AuthenticationRequiredError
      );
    });
  });

  describe("Tenant Role Guard (403 Privilege Verification)", () => {
    it("allows Owner to access Owner-level operations", async () => {
      const headers = { authorization: `Bearer ${aliceToken}` };
      const context = await requireTenantRole(
        authProvider,
        tenantService,
        headers,
        acmeOrg.id,
        "owner"
      );

      expect(context.principal.userId).toBe(alice.id);
      expect(context.membership.role).toBe("owner");
    });

    it("allows Editor to access Editor-level operations", async () => {
      const headers = { authorization: `Bearer ${bobToken}` };
      const context = await requireTenantRole(
        authProvider,
        tenantService,
        headers,
        acmeOrg.id,
        "editor"
      );

      expect(context.principal.userId).toBe(bob.id);
      expect(context.membership.role).toBe("editor");
    });

    it("blocks Editor from Owner-level operations with 403 ForbiddenTenantAccessError", async () => {
      const headers = { authorization: `Bearer ${bobToken}` };
      await expect(
        requireTenantRole(authProvider, tenantService, headers, acmeOrg.id, "owner")
      ).rejects.toThrowError(ForbiddenTenantAccessError);
    });

    it("blocks Analyst from Editor-level write operations with 403", async () => {
      const headers = { authorization: `Bearer ${charlieToken}` };
      await expect(
        requireTenantRole(authProvider, tenantService, headers, acmeOrg.id, "editor")
      ).rejects.toThrowError(ForbiddenTenantAccessError);
    });

    it("blocks cross-tenant access when user is not a member of target organization", async () => {
      // Alice is Owner of Acme, but NOT a member of Beta Org
      const headers = { authorization: `Bearer ${aliceToken}` };
      await expect(
        requireTenantRole(authProvider, tenantService, headers, betaOrg.id, "analyst")
      ).rejects.toThrowError(ForbiddenTenantAccessError);
    });
  });

  describe("Declarative Guarded Actions (Action Protection)", () => {
    it("executes handler successfully when authorization passes", async () => {
      const mockBusinessAction = vi.fn().mockResolvedValue({ success: true, published: true });

      const publishShowroomAction = createGuardedAction(
        {
          authProvider,
          tenantService,
          getOrganizationId: (input: { orgId: string; showroomId: string }) => input.orgId,
          requiredRole: "editor",
        },
        mockBusinessAction
      );

      const headers = { authorization: `Bearer ${bobToken}` }; // Bob is Editor
      const result = await publishShowroomAction(headers, {
        orgId: acmeOrg.id,
        showroomId: "showroom_01",
      });

      expect(result).toEqual({ success: true, published: true });
      expect(mockBusinessAction).toHaveBeenCalledTimes(1);
      expect(mockBusinessAction).toHaveBeenCalledWith(
        expect.objectContaining({
          principal: expect.objectContaining({ userId: bob.id }),
          membership: expect.objectContaining({ role: "editor" }),
        }),
        { orgId: acmeOrg.id, showroomId: "showroom_01" }
      );
    });

    it("blocks execution and does NOT invoke handler if unauthorized (403)", async () => {
      const mockBusinessAction = vi.fn().mockResolvedValue({ success: true });

      const deleteOrgAction = createGuardedAction(
        {
          authProvider,
          tenantService,
          getOrganizationId: (input: { orgId: string }) => input.orgId,
          requiredRole: "owner",
        },
        mockBusinessAction
      );

      // Charlie (Analyst) attempts owner action
      const headers = { authorization: `Bearer ${charlieToken}` };
      await expect(deleteOrgAction(headers, { orgId: acmeOrg.id })).rejects.toThrowError(
        ForbiddenTenantAccessError
      );

      // Handler must never have been called
      expect(mockBusinessAction).not.toHaveBeenCalled();
    });

    it("blocks execution and does NOT invoke handler if unauthenticated (401)", async () => {
      const mockBusinessAction = vi.fn().mockResolvedValue({ success: true });

      const guardedAction = createGuardedAction(
        {
          authProvider,
          tenantService,
          getOrganizationId: (input: { orgId: string }) => input.orgId,
          requiredRole: "editor",
        },
        mockBusinessAction
      );

      // No authorization header
      await expect(guardedAction({}, { orgId: acmeOrg.id })).rejects.toThrowError(
        AuthenticationRequiredError
      );

      expect(mockBusinessAction).not.toHaveBeenCalled();
    });
  });
});
