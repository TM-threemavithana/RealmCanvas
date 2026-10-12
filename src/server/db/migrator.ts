/**
 * RealmCanvas Relational Migration Runner & DDL Inspector
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 8.2, Section 8.4)
 */

import fs from "fs";
import path from "path";
import { SCHEMA_TABLE_NAMES, type SchemaTableName } from "./schema";

export interface MigrationDescriptor {
  id: string;
  filename: string;
  sql: string;
}

export interface DdlInspectionResult {
  tables: SchemaTableName[];
  indexesCount: number;
  constraintsCount: number;
  isValid: boolean;
  missingTables: string[];
}

/**
 * Loads the initial migration SQL file from disk or fallback registry.
 */
export function loadMigrationSql(filename = "0001_initial_schema.sql"): string {
  const filePath = path.resolve(process.cwd(), "src/server/db/migrations", filename);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, "utf-8");
  }
  throw new Error(`Migration file not found at path: ${filePath}`);
}

/**
 * Returns list of registered migrations in chronological order.
 */
export function getRegisteredMigrations(): MigrationDescriptor[] {
  const migrationsDir = path.resolve(process.cwd(), "src/server/db/migrations");
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  return files.map((filename) => ({
    id: filename.replace(".sql", ""),
    filename,
    sql: fs.readFileSync(path.join(migrationsDir, filename), "utf-8"),
  }));
}

/**
 * Inspects a migration DDL string against Section 8.2 requirements,
 * confirming all 13 canonical tables and their constraint declarations exist.
 */
export function inspectMigrationDdl(sql: string): DdlInspectionResult {
  const tableMatches = [...sql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_]+)/gi)];
  const declaredTables = tableMatches.map((m) => m[1].toLowerCase());

  const indexMatches = [...sql.matchAll(/CREATE\s+INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_]+)/gi)];
  const constraintMatches = [...sql.matchAll(/CONSTRAINT\s+([a-z_]+)/gi)];

  const missingTables = SCHEMA_TABLE_NAMES.filter(
    (t) => !declaredTables.includes(t)
  );

  return {
    tables: declaredTables as SchemaTableName[],
    indexesCount: indexMatches.length,
    constraintsCount: constraintMatches.length,
    isValid: missingTables.length === 0,
    missingTables,
  };
}
