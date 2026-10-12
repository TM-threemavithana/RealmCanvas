import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryTenantRepository } from "@/server/tenancy/TenantRepository";
import {
  TenantService,
  TenantAccessDeniedError,
} from "@/server/tenancy/TenantService";
import { InMemoryAnalyticsRepository } from "@/server/analytics/AnalyticsRepository";
import {
  AnalyticsService,
} from "@/server/analytics/AnalyticsService";
import {
  ALLOWED_ANALYTICS_EVENT_TYPES,
  type AnalyticsEventType,
} from "@/server/analytics/AnalyticsSchema";
import type { Organization, User } from "@/server/db/schema";

describe("Consent-Aware Analytics Event Pipeline (RC-017)", () => {
  let tenantRepo: InMemoryTenantRepository;
  let tenantService: TenantService;
  let analyticsRepo: InMemoryAnalyticsRepository;
  let analyticsService: AnalyticsService;

  let alice: User; // Owner of Acme
  let bob: User; // Editor of Acme
  let charlie: User; // Analyst of Acme
  let eve: User; // Outsider

  let acmeOrg: Organization;
  let betaOrg: Organization;

  beforeEach(async () => {
    tenantRepo = new InMemoryTenantRepository();
    tenantService = new TenantService(tenantRepo);
    analyticsRepo = new InMemoryAnalyticsRepository();
    analyticsService = new AnalyticsService(analyticsRepo, tenantService);

    alice = await tenantRepo.createUser({
      authSubject: "auth0|alice",
      email: "alice@acme.com",
      displayName: "Alice Owner",
    });

    bob = await tenantRepo.createUser({
      authSubject: "auth0|bob",
      email: "bob@acme.com",
      displayName: "Bob Editor",
    });

    charlie = await tenantRepo.createUser({
      authSubject: "auth0|charlie",
      email: "charlie@acme.com",
      displayName: "Charlie Analyst",
    });

    eve = await tenantRepo.createUser({
      authSubject: "auth0|eve",
      email: "eve@external.com",
      displayName: "Eve Outsider",
    });

    const { organization: acme } = await tenantService.createTenant(alice.id, {
      name: "Acme Sound Labs",
      slug: "acme-sound",
    });
    acmeOrg = acme;

    const { organization: beta } = await tenantService.createTenant(alice.id, {
      name: "Beta Acoustics",
      slug: "beta-acoustics",
    });
    betaOrg = beta;

    await tenantService.addMember(alice.id, acmeOrg.id, bob.id, "editor");
    await tenantService.addMember(alice.id, acmeOrg.id, charlie.id, "analyst");
  });

  describe("Event Allowlist & Bounded Property Ingestion", () => {
    it("successfully ingests all 11 allowlisted event types with bounded properties", async () => {
      const inputs = ALLOWED_ANALYTICS_EVENT_TYPES.map((eventType) => ({
        showroomId: "showroom_aurora",
        publicationId: "pub_live_01",
        eventType,
        eventData: {
          appVersion: "1.0.0",
          productId: "prod_headphones",
          variantId: "var_obsidian",
          zoneKey: "zone_gallery",
          ctaUrl: "https://acme.com/shop",
          entryMode: "webgl",
        },
      }));

      const result = await analyticsService.ingestEvents(acmeOrg.id, inputs);
      expect(result.accepted).toBe(11);
      expect(result.rejected).toBe(0);
      expect(result.errors).toHaveLength(0);

      const events = await analyticsRepo.queryEvents(acmeOrg.id);
      expect(events).toHaveLength(11);
    });

    it("rejects unallowlisted event types without failing the entire batch", async () => {
      const inputs = [
        {
          showroomId: "showroom_01",
          eventType: "landing_viewed",
          eventData: { hasWebGL: true },
        },
        {
          showroomId: "showroom_01",
          eventType: "unsupported_malicious_beacon",
          eventData: { payload: "exploit" },
        },
        {
          showroomId: "showroom_01",
          eventType: "product_inspected",
          eventData: { productId: "prod_01" },
        },
      ];

      const result = await analyticsService.ingestEvents(acmeOrg.id, inputs);
      expect(result.accepted).toBe(2);
      expect(result.rejected).toBe(1);
      expect(result.errors[0]).toContain('Event type "unsupported_malicious_beacon" is not in the allowed');

      const events = await analyticsRepo.queryEvents(acmeOrg.id);
      expect(events).toHaveLength(2);
    });

    it("rejects events missing a showroomId", async () => {
      const inputs = [
        {
          showroomId: "",
          eventType: "landing_viewed",
        },
      ];

      const result = await analyticsService.ingestEvents(acmeOrg.id, inputs);
      expect(result.accepted).toBe(0);
      expect(result.rejected).toBe(1);
      expect(result.errors[0]).toContain("Missing required showroomId");
    });
  });

  describe("Privacy & PII Protection (Section 9.5 & Section 10)", () => {
    it("rejects events containing prohibited PII keys (email, name, phone, ip, search)", async () => {
      const piiInputs = [
        {
          showroomId: "showroom_01",
          eventType: "product_inspected",
          eventData: { productId: "prod_01", email: "visitor@example.com" },
        },
        {
          showroomId: "showroom_01",
          eventType: "zone_visited",
          eventData: { zoneKey: "zone_lab", name: "John Doe" },
        },
        {
          showroomId: "showroom_01",
          eventType: "landing_viewed",
          eventData: { ip: "192.168.1.1" },
        },
        {
          showroomId: "showroom_01",
          eventType: "cta_clicked",
          eventData: { ctaUrl: "https://shop.com", search: "forbidden query" },
        },
      ];

      const result = await analyticsService.ingestEvents(acmeOrg.id, piiInputs);
      expect(result.accepted).toBe(0);
      expect(result.rejected).toBe(4);
      expect(result.errors).toHaveLength(4);
      expect(result.errors[0]).toContain('Prohibited PII or unbounded field "email"');
      expect(result.errors[1]).toContain('Prohibited PII or unbounded field "name"');
      expect(result.errors[2]).toContain('Prohibited PII or unbounded field "ip"');
      expect(result.errors[3]).toContain('Prohibited PII or unbounded field "search"');
    });

    it("strips unknown custom property bags, retaining only defined schema fields", async () => {
      const input = {
        showroomId: "showroom_01",
        eventType: "product_inspected" as AnalyticsEventType,
        eventData: {
          productId: "prod_aurora",
          slotKey: "gallery-01",
          arbitraryKey1: "some unbounded value",
          randomMetadataBlob: { nested: true },
        },
      };

      const result = await analyticsService.ingestEvents(acmeOrg.id, [input]);
      expect(result.accepted).toBe(1);

      const events = await analyticsRepo.queryEvents(acmeOrg.id);
      expect(events[0].eventData).toEqual({
        productId: "prod_aurora",
        slotKey: "gallery-01",
      });
      expect(events[0].eventData).not.toHaveProperty("arbitraryKey1");
      expect(events[0].eventData).not.toHaveProperty("randomMetadataBlob");
    });

    it("hashes raw session tokens using SHA-256 and never persists plaintext tokens", async () => {
      const rawToken = "session_xyz_visitor_123456";
      const expectedHash = AnalyticsService.hashSessionToken(rawToken);

      const input = {
        showroomId: "showroom_01",
        sessionToken: rawToken,
        eventType: "landing_viewed" as AnalyticsEventType,
        eventData: { hasWebGL: true },
      };

      const result = await analyticsService.ingestEvents(acmeOrg.id, [input]);
      expect(result.accepted).toBe(1);

      const events = await analyticsRepo.queryEvents(acmeOrg.id);
      expect(events[0].sessionTokenHash).toBe(expectedHash);
      expect((events[0] as unknown as { sessionToken?: string }).sessionToken).toBeUndefined();
    });
  });

  describe("Reporting & Multi-Tenancy Aggregation", () => {
    it("aggregates events, unique sessions, top products, and top zones accurately", async () => {
      // Ingest test events for Acme
      await analyticsService.ingestEvents(acmeOrg.id, [
        {
          showroomId: "showroom_01",
          sessionToken: "sess_user_1",
          eventType: "landing_viewed",
        },
        {
          showroomId: "showroom_01",
          sessionToken: "sess_user_1",
          eventType: "zone_visited",
          eventData: { zoneKey: "zone_gallery" },
        },
        {
          showroomId: "showroom_01",
          sessionToken: "sess_user_1",
          eventType: "product_inspected",
          eventData: { productId: "prod_aurora" },
        },
        {
          showroomId: "showroom_01",
          sessionToken: "sess_user_2",
          eventType: "product_inspected",
          eventData: { productId: "prod_aurora" },
        },
        {
          showroomId: "showroom_01",
          sessionToken: "sess_user_2",
          eventType: "product_inspected",
          eventData: { productId: "prod_monitor" },
        },
        {
          showroomId: "showroom_01",
          sessionToken: "sess_user_2",
          eventType: "cta_clicked",
          eventData: { ctaUrl: "https://shop.com/prod" },
        },
        {
          showroomId: "showroom_01",
          sessionToken: "sess_user_2",
          eventType: "lead_submitted",
        },
      ]);

      // Charlie (Analyst) queries Acme summary
      const summary = await analyticsService.getAnalyticsSummary(charlie.id, acmeOrg.id);
      expect(summary.totalEvents).toBe(7);
      expect(summary.uniqueSessions).toBe(2);
      expect(summary.eventsByType.landing_viewed).toBe(1);
      expect(summary.eventsByType.product_inspected).toBe(3);
      expect(summary.ctaClicks).toBe(1);
      expect(summary.leadsSubmitted).toBe(1);

      expect(summary.topProducts).toEqual([
        { productId: "prod_aurora", inspections: 2 },
        { productId: "prod_monitor", inspections: 1 },
      ]);
      expect(summary.topZones).toEqual([
        { zoneKey: "zone_gallery", visits: 1 },
      ]);
    });

    it("strictly isolates analytics between organizations", async () => {
      // Ingest 3 events for Acme
      await analyticsService.ingestEvents(acmeOrg.id, [
        { showroomId: "showroom_acme", eventType: "landing_viewed" },
        { showroomId: "showroom_acme", eventType: "product_inspected", eventData: { productId: "p_acme" } },
      ]);

      // Ingest 5 events for Beta
      await analyticsService.ingestEvents(betaOrg.id, [
        { showroomId: "showroom_beta", eventType: "landing_viewed" },
        { showroomId: "showroom_beta", eventType: "landing_viewed" },
        { showroomId: "showroom_beta", eventType: "landing_viewed" },
      ]);

      // Alice is member of both, but querying acme only returns acme events
      const acmeSummary = await analyticsService.getAnalyticsSummary(alice.id, acmeOrg.id);
      expect(acmeSummary.totalEvents).toBe(2);

      const betaSummary = await analyticsService.getAnalyticsSummary(alice.id, betaOrg.id);
      expect(betaSummary.totalEvents).toBe(3);
    });

    it("blocks unauthorized outsiders from reading analytics summaries (TenantAccessDeniedError)", async () => {
      await expect(
        analyticsService.getAnalyticsSummary(eve.id, acmeOrg.id)
      ).rejects.toThrowError(TenantAccessDeniedError);
    });
  });
});
