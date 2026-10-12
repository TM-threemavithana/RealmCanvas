import { describe, it, expect } from "vitest";
import {
  SCHEMA_TABLE_NAMES,
  hasMinimumRole,
  ROLE_HIERARCHY,
  type OrganizationRole,
} from "@/server/db/schema";
import {
  loadMigrationSql,
  getRegisteredMigrations,
  inspectMigrationDdl,
} from "@/server/db/migrator";
import {
  parseDatabaseUrl,
  isPersistentDatabaseConfigured,
  getDatabaseStatus,
} from "@/server/db/client";
import { generateSeedDataset } from "@/server/db/seed";

describe("Persistent Database Layer & Relational Schema (RC-023)", () => {
  describe("Relational Schema Definitions (Section 8.1 & 8.2)", () => {
    it("defines all 13 canonical tables in schema table registry", () => {
      expect(SCHEMA_TABLE_NAMES).toHaveLength(13);
      expect(SCHEMA_TABLE_NAMES).toContain("organizations");
      expect(SCHEMA_TABLE_NAMES).toContain("users");
      expect(SCHEMA_TABLE_NAMES).toContain("memberships");
      expect(SCHEMA_TABLE_NAMES).toContain("showrooms");
      expect(SCHEMA_TABLE_NAMES).toContain("showroom_revisions");
      expect(SCHEMA_TABLE_NAMES).toContain("publications");
      expect(SCHEMA_TABLE_NAMES).toContain("products");
      expect(SCHEMA_TABLE_NAMES).toContain("product_variants");
      expect(SCHEMA_TABLE_NAMES).toContain("assets");
      expect(SCHEMA_TABLE_NAMES).toContain("placements");
      expect(SCHEMA_TABLE_NAMES).toContain("leads");
      expect(SCHEMA_TABLE_NAMES).toContain("analytics_events");
      expect(SCHEMA_TABLE_NAMES).toContain("audit_logs");
    });

    it("verifies role hierarchy ranking invariants", () => {
      expect(ROLE_HIERARCHY.owner).toBeGreaterThan(ROLE_HIERARCHY.editor);
      expect(ROLE_HIERARCHY.editor).toBeGreaterThan(ROLE_HIERARCHY.analyst);

      expect(hasMinimumRole("owner", "editor")).toBe(true);
      expect(hasMinimumRole("editor", "editor")).toBe(true);
      expect(hasMinimumRole("analyst", "editor")).toBe(false);
      expect(hasMinimumRole("analyst", "owner")).toBe(false);
    });
  });

  describe("PostgreSQL DDL Migration (0001_initial_schema.sql)", () => {
    it("loads migration SQL and finds all registered migration files", () => {
      const sql = loadMigrationSql("0001_initial_schema.sql");
      expect(sql).toBeDefined();
      expect(sql.length).toBeGreaterThan(500);

      const registered = getRegisteredMigrations();
      expect(registered.length).toBeGreaterThanOrEqual(1);
      expect(registered[0].id).toBe("0001_initial_schema");
    });

    it("declares all 13 canonical tables in DDL with valid syntax", () => {
      const sql = loadMigrationSql("0001_initial_schema.sql");
      const inspection = inspectMigrationDdl(sql);

      expect(inspection.missingTables).toEqual([]);
      expect(inspection.isValid).toBe(true);
      expect(inspection.tables).toHaveLength(13);

      for (const table of SCHEMA_TABLE_NAMES) {
        expect(inspection.tables).toContain(table);
      }
    });

    it("enforces multi-tenancy unique constraints and check constraints in SQL", () => {
      const sql = loadMigrationSql("0001_initial_schema.sql");

      // Unique constraints
      expect(sql).toContain("CONSTRAINT uq_organizations_slug UNIQUE (slug)");
      expect(sql).toContain("CONSTRAINT uq_users_auth_subject UNIQUE (auth_subject)");
      expect(sql).toContain("CONSTRAINT uq_memberships_org_user UNIQUE (organization_id, user_id)");
      expect(sql).toContain("CONSTRAINT uq_showrooms_org_slug UNIQUE (organization_id, slug)");
      expect(sql).toContain("CONSTRAINT uq_showroom_revisions_number UNIQUE (showroom_id, revision_number)");
      expect(sql).toContain("CONSTRAINT uq_products_org_slug UNIQUE (organization_id, slug)");
      expect(sql).toContain("CONSTRAINT uq_assets_object_key UNIQUE (object_key)");
      expect(sql).toContain("CONSTRAINT uq_placements_revision_slot UNIQUE (showroom_revision_id, slot_key)");

      // Check constraints
      expect(sql).toContain("CONSTRAINT chk_memberships_role CHECK (role IN ('owner', 'editor', 'analyst'))");
      expect(sql).toContain("CONSTRAINT chk_products_status CHECK (status IN ('draft', 'published', 'archived'))");
      expect(sql).toContain("CONSTRAINT chk_leads_consent CHECK (consent = TRUE)");

      // Foreign key cascades
      expect(sql).toContain("REFERENCES organizations(id) ON DELETE CASCADE");
      expect(sql).toContain("REFERENCES showrooms(id) ON DELETE CASCADE");
    });

    it("creates performance B-tree indexes for tenant isolation queries", () => {
      const sql = loadMigrationSql("0001_initial_schema.sql");

      expect(sql).toContain("idx_showrooms_organization_id");
      expect(sql).toContain("idx_products_organization_id");
      expect(sql).toContain("idx_publications_showroom_published");
      expect(sql).toContain("idx_leads_org_created");
      expect(sql).toContain("idx_analytics_org_recorded");
      expect(sql).toContain("idx_audit_logs_org_created");
    });
  });

  describe("Database Client & Environment Configuration", () => {
    it("parses valid PostgreSQL connection URLs", () => {
      const config = parseDatabaseUrl(
        "postgresql://test_user:test_pass@db.example.com:5433/realmcanvas_prod?sslmode=require"
      );

      expect(config.host).toBe("db.example.com");
      expect(config.port).toBe(5433);
      expect(config.database).toBe("realmcanvas_prod");
      expect(config.user).toBe("test_user");
      expect(config.ssl).toBe(true);
      expect(config.maxConnections).toBe(20);
    });

    it("throws clear error on unsupported protocol", () => {
      expect(() => parseDatabaseUrl("mysql://root:pass@localhost:3306/db")).toThrow(
        'Unsupported database protocol "mysql:". Expected "postgresql:"'
      );
    });

    it("reports in_memory_transient status when DATABASE_URL is unset", () => {
      const status = getDatabaseStatus();
      // In unit test environment, DATABASE_URL is not set by default
      if (!process.env.DATABASE_URL) {
        expect(status.mode).toBe("in_memory_transient");
        expect(status.configured).toBe(false);
      }
    });
  });

  describe("Pilot Seed Dataset Integrity", () => {
    it("generates relational seed dataset with foreign-key alignment", () => {
      const seed = generateSeedDataset();

      expect(seed.organization.slug).toBe("celestial-sound");
      expect(seed.users.alice.displayName).toBe("Alice Owner");
      expect(seed.memberships).toHaveLength(3);

      // Verify membership references valid org and users
      for (const m of seed.memberships) {
        expect(m.organizationId).toBe(seed.organization.id);
        const validUserIds = [seed.users.alice.id, seed.users.bob.id, seed.users.charlie.id];
        expect(validUserIds).toContain(m.userId);
      }

      // Verify showroom and placements
      expect(seed.showroom.organizationId).toBe(seed.organization.id);
      expect(seed.placements).toHaveLength(3);
      expect(seed.placements[0].slotKey).toBe("featured-hero");
      expect(seed.placements[0].productId).toBe(seed.products[0].id);

      // Verify publication links
      expect(seed.publication.showroomId).toBe(seed.showroom.id);
      expect(seed.publication.revisionId).toBe(seed.revision.id);
      expect(seed.showroom.activePublicationId).toBe(seed.publication.id);
    });
  });
});
