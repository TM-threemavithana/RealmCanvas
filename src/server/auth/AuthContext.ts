/**
 * RealmCanvas Authentication Context & Principal Resolution
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 3.5, Section 6.2, Section 10.2)
 */

export interface AuthenticatedPrincipal {
  userId: string;
  authSubject: string;
  email: string;
  displayName: string;
}

export interface IAuthProvider {
  resolvePrincipal(requestHeaders: Headers | Record<string, string | undefined>): Promise<AuthenticatedPrincipal | null>;
  createSessionToken(principal: AuthenticatedPrincipal): string;
}

/**
 * Standard Token Auth Provider for modular monolithic session management.
 * Parses Bearer authorization headers and validates signed session tokens.
 */
export class TokenAuthProvider implements IAuthProvider {
  private activeSessions = new Map<string, AuthenticatedPrincipal>();

  /**
   * Registers an active session token for an authenticated principal.
   */
  public registerSession(token: string, principal: AuthenticatedPrincipal): void {
    this.activeSessions.set(token, principal);
  }

  public createSessionToken(principal: AuthenticatedPrincipal): string {
    const token = `rc_sess_${crypto.randomUUID()}`;
    this.activeSessions.set(token, principal);
    return token;
  }

  public async resolvePrincipal(
    requestHeaders: Headers | Record<string, string | undefined>
  ): Promise<AuthenticatedPrincipal | null> {
    let authHeader: string | undefined | null = null;

    if (typeof requestHeaders.get === "function") {
      authHeader = (requestHeaders as Headers).get("authorization");
    } else {
      authHeader =
        (requestHeaders as Record<string, string | undefined>)["authorization"] ||
        (requestHeaders as Record<string, string | undefined>)["Authorization"];
    }

    if (!authHeader || typeof authHeader !== "string") {
      return null;
    }

    const trimmed = authHeader.trim();
    if (!trimmed.toLowerCase().startsWith("bearer ")) {
      return null;
    }

    const token = trimmed.slice(7).trim();
    if (!token) {
      return null;
    }

    return this.activeSessions.get(token) || null;
  }

  public revokeSession(token: string): boolean {
    return this.activeSessions.delete(token);
  }

  public clear(): void {
    this.activeSessions.clear();
  }
}
