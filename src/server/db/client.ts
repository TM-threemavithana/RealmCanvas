/**
 * RealmCanvas Database Client & Connection Manager
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 8.2, Section 12.3)
 */

export interface DatabaseConfig {
  url: string;
  host: string;
  port: number;
  database: string;
  user: string;
  ssl: boolean;
  maxConnections: number;
  connectionTimeoutMs: number;
}

export function parseDatabaseUrl(url: string): DatabaseConfig {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
      throw new Error(`Unsupported database protocol "${parsed.protocol}". Expected "postgresql:"`);
    }

    const sslParam = parsed.searchParams.get("sslmode");
    const isSsl = sslParam === "require" || sslParam === "prefer" || parsed.searchParams.get("ssl") === "true";

    return {
      url,
      host: parsed.hostname || "localhost",
      port: parsed.port ? parseInt(parsed.port, 10) : 5432,
      database: parsed.pathname.replace(/^\//, "") || "realmcanvas_dev",
      user: parsed.username || "postgres",
      ssl: isSsl,
      maxConnections: 20,
      connectionTimeoutMs: 10000,
    };
  } catch (err) {
    throw new Error(
      `Invalid DATABASE_URL configuration: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * Checks whether persistent PostgreSQL is configured in current environment.
 */
export function isPersistentDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL?.trim();
  return Boolean(url && (url.startsWith("postgresql://") || url.startsWith("postgres://")));
}

/**
 * Database client metadata and status report
 */
export interface DatabaseStatus {
  mode: "persistent_postgresql" | "in_memory_transient";
  configured: boolean;
  connection?: {
    host: string;
    port: number;
    database: string;
    user: string;
    ssl: boolean;
  };
}

export function getDatabaseStatus(): DatabaseStatus {
  const url = process.env.DATABASE_URL?.trim();
  if (url && (url.startsWith("postgresql://") || url.startsWith("postgres://"))) {
    try {
      const config = parseDatabaseUrl(url);
      return {
        mode: "persistent_postgresql",
        configured: true,
        connection: {
          host: config.host,
          port: config.port,
          database: config.database,
          user: config.user,
          ssl: config.ssl,
        },
      };
    } catch {
      return {
        mode: "in_memory_transient",
        configured: false,
      };
    }
  }

  return {
    mode: "in_memory_transient",
    configured: false,
  };
}
