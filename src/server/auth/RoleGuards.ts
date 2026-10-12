/**
 * RealmCanvas Server-Side Role Guards & Action Protection
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 3.5, Section 6.2, Section 8.3, Section 10.2)
 */

import type { OrganizationRole, Membership } from "../db/schema";
import type { TenantService } from "../tenancy/TenantService";
import type { AuthenticatedPrincipal, IAuthProvider } from "./AuthContext";

export class AuthenticationRequiredError extends Error {
  public readonly statusCode = 401;
  constructor(message = "Authentication required. Please provide a valid session token.") {
    super(message);
    this.name = "AuthenticationRequiredError";
  }
}

export class ForbiddenTenantAccessError extends Error {
  public readonly statusCode = 403;
  constructor(message = "Forbidden. User does not possess the required tenant membership or role.") {
    super(message);
    this.name = "ForbiddenTenantAccessError";
  }
}

export interface GuardContext {
  principal: AuthenticatedPrincipal;
  membership: Membership;
}

/**
 * Extracts and verifies the authenticated principal from incoming request headers.
 * Throws AuthenticationRequiredError (HTTP 401) if token is missing or invalid.
 */
export async function requireAuthenticated(
  authProvider: IAuthProvider,
  headers: Headers | Record<string, string | undefined>
): Promise<AuthenticatedPrincipal> {
  const principal = await authProvider.resolvePrincipal(headers);
  if (!principal) {
    throw new AuthenticationRequiredError();
  }
  return principal;
}

/**
 * Authorizes a request against tenant boundaries and minimum role level.
 * Throws 401 if unauthenticated, or 403 if user is not in the organization or lacks required role.
 */
export async function requireTenantRole(
  authProvider: IAuthProvider,
  tenantService: TenantService,
  headers: Headers | Record<string, string | undefined>,
  organizationId: string,
  requiredRole: OrganizationRole = "analyst"
): Promise<GuardContext> {
  const principal = await requireAuthenticated(authProvider, headers);

  try {
    const membership = await tenantService.assertTenantAccess(
      principal.userId,
      organizationId,
      requiredRole
    );

    return { principal, membership };
  } catch (err: unknown) {
    // Sanitize internal error and throw typed 403 Forbidden
    const message = err instanceof Error ? err.message : "Tenant access denied";
    throw new ForbiddenTenantAccessError(message);
  }
}

/**
 * Higher-order wrapper to guard administrative mutation functions.
 * Protects business service execution by enforcing role authorization before execution.
 */
export function createGuardedAction<TInput, TOutput>(
  config: {
    authProvider: IAuthProvider;
    tenantService: TenantService;
    getOrganizationId: (input: TInput) => string;
    requiredRole: OrganizationRole;
  },
  handler: (context: GuardContext, input: TInput) => Promise<TOutput>
): (headers: Headers | Record<string, string | undefined>, input: TInput) => Promise<TOutput> {
  return async (headers, input) => {
    const orgId = config.getOrganizationId(input);
    const context = await requireTenantRole(
      config.authProvider,
      config.tenantService,
      headers,
      orgId,
      config.requiredRole
    );

    return handler(context, input);
  };
}
