import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { SCHEMA_TABLE_NAMES } from "@/server/db/schema";
import { getDatabaseStatus } from "@/server/db/client";
import { TEMPLATE_SLOT_REGISTRY } from "@/server/showrooms/PlacementEditor";
import { ALLOWED_ANALYTICS_EVENT_TYPES } from "@/server/analytics/AnalyticsSchema";
import { PRODUCT_VARIANTS } from "@/experience/templates/ProductVariants";
import { NAVIGATION_DESTINATIONS } from "@/experience/camera/NavigationDestinations";

describe("Pilot Release Verification & Architecture Audit (RC-026)", () => {
  describe("Functional Requirements Traceability (FR-001 - FR-022)", () => {
    it("FR-001 & FR-011: Confirms public landing and 2D fallback catalog routes exist", () => {
      const pageLanding = path.resolve(process.cwd(), "src/app/page.tsx");
      const pageCatalog = path.resolve(process.cwd(), "src/app/catalog/page.tsx");
      const pageShowroom = path.resolve(process.cwd(), "src/app/showroom/[slug]/page.tsx");

      expect(fs.existsSync(pageLanding)).toBe(true);
      expect(fs.existsSync(pageCatalog)).toBe(true);
      expect(fs.existsSync(pageShowroom)).toBe(true);
    });

    it("FR-003 & FR-004: Confirms 4 canonical navigation zones with camera presets", () => {
      expect(NAVIGATION_DESTINATIONS).toHaveLength(4);
      const zoneIds = NAVIGATION_DESTINATIONS.map((z) => z.id);
      expect(zoneIds).toContain("zone_arrival");
      expect(zoneIds).toContain("zone_gallery");
      expect(zoneIds).toContain("zone_lab");
      expect(zoneIds).toContain("zone_lounge");
    });

    it("FR-007: Confirms hardware finish variants (Midnight Obsidian & Pearl Titanium)", () => {
      expect(PRODUCT_VARIANTS["var_midnight"]).toBeDefined();
      expect(PRODUCT_VARIANTS["var_titanium"]).toBeDefined();
      expect(PRODUCT_VARIANTS["var_midnight"].label).toBe("Midnight Obsidian");
      expect(PRODUCT_VARIANTS["var_titanium"].label).toBe("Pearl Titanium");
    });

    it("FR-015: Confirms 6 approved fixed placement slots in celestial pavilion", () => {
      expect(TEMPLATE_SLOT_REGISTRY).toHaveLength(6);
      const slotKeys = TEMPLATE_SLOT_REGISTRY.map((s) => s.slotKey);
      expect(slotKeys).toContain("featured-hero");
      expect(slotKeys).toContain("gallery-01");
      expect(slotKeys).toContain("gallery-02");
      expect(slotKeys).toContain("gallery-03");
      expect(slotKeys).toContain("gallery-04");
      expect(slotKeys).toContain("lab-hero");
    });

    it("FR-019: Confirms strict allowlist for analytics telemetry events", () => {
      expect(ALLOWED_ANALYTICS_EVENT_TYPES).toHaveLength(11);
      expect(ALLOWED_ANALYTICS_EVENT_TYPES).toContain("landing_viewed");
      expect(ALLOWED_ANALYTICS_EVENT_TYPES).toContain("experience_entered");
      expect(ALLOWED_ANALYTICS_EVENT_TYPES).toContain("scene_ready");
      expect(ALLOWED_ANALYTICS_EVENT_TYPES).toContain("zone_visited");
      expect(ALLOWED_ANALYTICS_EVENT_TYPES).toContain("product_inspected");
      expect(ALLOWED_ANALYTICS_EVENT_TYPES).toContain("variant_selected");
      expect(ALLOWED_ANALYTICS_EVENT_TYPES).toContain("cta_clicked");
      expect(ALLOWED_ANALYTICS_EVENT_TYPES).toContain("lead_form_opened");
      expect(ALLOWED_ANALYTICS_EVENT_TYPES).toContain("lead_submitted");
      expect(ALLOWED_ANALYTICS_EVENT_TYPES).toContain("fallback_entered");
      expect(ALLOWED_ANALYTICS_EVENT_TYPES).toContain("graphics_error");
    });

    it("FR-021: Confirms operational health check endpoint exists and resolves", () => {
      const healthRoute = path.resolve(process.cwd(), "src/app/api/health/route.ts");
      expect(fs.existsSync(healthRoute)).toBe(true);

      const dbStatus = getDatabaseStatus();
      expect(["persistent_postgresql", "in_memory_transient"]).toContain(dbStatus.mode);
    });
  });

  describe("Relational Database & Multi-Tenancy Architecture (Section 8)", () => {
    it("verifies all 13 canonical tables and SQL DDL migration integrity", () => {
      expect(SCHEMA_TABLE_NAMES).toHaveLength(13);
      const migrationFile = path.resolve(
        process.cwd(),
        "src/server/db/migrations/0001_initial_schema.sql"
      );
      expect(fs.existsSync(migrationFile)).toBe(true);

      const sql = fs.readFileSync(migrationFile, "utf-8");
      for (const table of SCHEMA_TABLE_NAMES) {
        expect(sql).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
      }
    });
  });

  describe("Containerized Production Artifacts (Section 16)", () => {
    it("confirms Dockerfile, .dockerignore, and docker-compose.yml exist", () => {
      const dockerfile = path.resolve(process.cwd(), "Dockerfile");
      const dockerignore = path.resolve(process.cwd(), ".dockerignore");
      const dockerCompose = path.resolve(process.cwd(), "docker-compose.yml");

      expect(fs.existsSync(dockerfile)).toBe(true);
      expect(fs.existsSync(dockerignore)).toBe(true);
      expect(fs.existsSync(dockerCompose)).toBe(true);

      const dockerfileContent = fs.readFileSync(dockerfile, "utf-8");
      expect(dockerfileContent).toContain("FROM node:22-alpine");
      expect(dockerfileContent).toContain("HEALTHCHECK");
      expect(dockerfileContent).toContain("USER nextjs");
    });
  });

  describe("Documentation & Operational Guides", () => {
    it("confirms Master Spec, Operations Guide, and AGENTS rules exist", () => {
      const masterSpec = path.resolve(process.cwd(), "docs/REALMCANVAS_MASTER_SPEC.md");
      const opsGuide = path.resolve(process.cwd(), "docs/PILOT_OPERATIONS_GUIDE.md");
      const agentRules = path.resolve(process.cwd(), "AGENTS.md");

      expect(fs.existsSync(masterSpec)).toBe(true);
      expect(fs.existsSync(opsGuide)).toBe(true);
      expect(fs.existsSync(agentRules)).toBe(true);
    });
  });
});
