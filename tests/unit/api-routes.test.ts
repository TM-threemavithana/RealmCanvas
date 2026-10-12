import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { services } from "@/server/services";
import { POST as handlePostLead } from "@/app/api/v1/public/leads/route";
import { POST as handlePostEvents } from "@/app/api/v1/public/events/route";
import { GET as handleGetAnalyticsSummary } from "@/app/api/v1/admin/analytics/summary/route";
import { GET as handleGetShowroomManifest } from "@/app/api/v1/public/showrooms/[orgSlug]/[showroomSlug]/route";
import type { Organization, User } from "@/server/db/schema";

describe("API Route Handlers & Contracts (RC-020)", () => {
  let alice: User; // Owner
  let charlie: User; // Analyst
  let eve: User; // Outsider
  let acmeOrg: Organization;

  beforeEach(async () => {
    // Reset test repositories
    await services.tenantRepo.clear();
    await services.leadRepo.clear();
    await services.analyticsRepo.clear();
    await services.catalogRepo.clear();
    await services.showroomRepo.clear();

    alice = await services.tenantRepo.createUser({
      authSubject: "auth0|alice_api",
      email: "alice@acme.com",
      displayName: "Alice Owner",
    });

    charlie = await services.tenantRepo.createUser({
      authSubject: "auth0|charlie_api",
      email: "charlie@acme.com",
      displayName: "Charlie Analyst",
    });

    eve = await services.tenantRepo.createUser({
      authSubject: "auth0|eve_api",
      email: "eve@external.com",
      displayName: "Eve Outsider",
    });

    const { organization } = await services.tenantService.createTenant(alice.id, {
      name: "Acme Sound Labs",
      slug: "acme-sound",
    });
    acmeOrg = organization;

    await services.tenantService.addMember(alice.id, acmeOrg.id, charlie.id, "analyst");
  });

  describe("POST /api/v1/public/leads", () => {
    it("returns 201 Created when given valid contact data and consent", async () => {
      const request = new NextRequest("http://localhost:3000/api/v1/public/leads", {
        method: "POST",
        body: JSON.stringify({
          organizationId: acmeOrg.id,
          showroomId: "showroom_01",
          productId: "prod_aurora",
          contact: {
            name: "Jane Buyer",
            email: "jane@buyer.com",
            notes: "Looking to order 20 units.",
          },
          consent: true,
        }),
      });

      const response = await handlePostLead(request);
      expect(response.status).toBe(201);

      const json = await response.json();
      expect(json.leadId).toBeDefined();
      expect(json.status).toBe("new");
    });

    it("returns 400 Bad Request when consent is false", async () => {
      const request = new NextRequest("http://localhost:3000/api/v1/public/leads", {
        method: "POST",
        body: JSON.stringify({
          organizationId: acmeOrg.id,
          showroomId: "showroom_01",
          contact: {
            name: "Jane Buyer",
            email: "jane@buyer.com",
          },
          consent: false,
        }),
      });

      const response = await handlePostLead(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error.code).toBe("CONSENT_REQUIRED");
    });

    it("returns 409 Conflict when a rapid duplicate inquiry is submitted", async () => {
      const payload = {
        organizationId: acmeOrg.id,
        showroomId: "showroom_01",
        productId: "prod_aurora",
        contact: {
          name: "Repeat Buyer",
          email: "repeat@buyer.com",
        },
        consent: true,
      };

      // 1. First submission succeeds
      const req1 = new NextRequest("http://localhost:3000/api/v1/public/leads", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const res1 = await handlePostLead(req1);
      expect(res1.status).toBe(201);

      // 2. Second rapid submission within duplicate window -> 409 Conflict
      const req2 = new NextRequest("http://localhost:3000/api/v1/public/leads", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const res2 = await handlePostLead(req2);
      expect(res2.status).toBe(409);

      const json = await res2.json();
      expect(json.error.code).toBe("DUPLICATE_INQUIRY");
    });
  });

  describe("POST /api/v1/public/events", () => {
    it("returns 202 Accepted and processes batch events resiliently", async () => {
      const request = new NextRequest("http://localhost:3000/api/v1/public/events", {
        method: "POST",
        body: JSON.stringify({
          organizationId: acmeOrg.id,
          events: [
            {
              showroomId: "showroom_01",
              eventType: "landing_viewed",
              eventData: { hasWebGL: true },
            },
            {
              showroomId: "showroom_01",
              eventType: "product_inspected",
              eventData: { productId: "prod_aurora" },
            },
            {
              showroomId: "showroom_01",
              eventType: "forbidden_unallowlisted_beacon",
            },
          ],
        }),
      });

      const response = await handlePostEvents(request);
      expect(response.status).toBe(202);

      const json = await response.json();
      expect(json.accepted).toBe(2);
      expect(json.rejected).toBe(1);
      expect(json.errors).toHaveLength(1);
    });
  });

  describe("GET /api/v1/admin/analytics/summary", () => {
    it("returns 401 Unauthorized when actor header is missing", async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/v1/admin/analytics/summary?organizationId=${acmeOrg.id}`
      );

      const response = await handleGetAnalyticsSummary(request);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.error.code).toBe("UNAUTHENTICATED");
    });

    it("returns 403 Forbidden when actor is not a member of the organization", async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/v1/admin/analytics/summary?organizationId=${acmeOrg.id}`,
        {
          headers: {
            "x-actor-user-id": eve.id,
          },
        }
      );

      const response = await handleGetAnalyticsSummary(request);
      expect(response.status).toBe(403);

      const json = await response.json();
      expect(json.error.code).toBe("ACCESS_DENIED");
    });

    it("returns 200 OK with analytics summary when called by authorized Analyst", async () => {
      // Ingest 1 event
      await services.analyticsService.ingestEvents(acmeOrg.id, [
        { showroomId: "showroom_01", eventType: "landing_viewed" },
      ]);

      const request = new NextRequest(
        `http://localhost:3000/api/v1/admin/analytics/summary?organizationId=${acmeOrg.id}`,
        {
          headers: {
            "x-actor-user-id": charlie.id,
          },
        }
      );

      const response = await handleGetAnalyticsSummary(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.organizationId).toBe(acmeOrg.id);
      expect(json.totalEvents).toBe(1);
    });
  });

  describe("GET /api/v1/public/showrooms/[orgSlug]/[showroomSlug]", () => {
    it("returns 404 Not Found for non-existent organization", async () => {
      const request = new NextRequest("http://localhost:3000/api/v1/public/showrooms/ghost/pavilion");
      const response = await handleGetShowroomManifest(request, {
        params: Promise.resolve({ orgSlug: "ghost-org", showroomSlug: "pavilion" }),
      });

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("returns 404 when showroom exists but has no active publication snapshot", async () => {
      // Create unpublished showroom draft
      await services.showroomRepo.createShowroom({
        organizationId: acmeOrg.id,
        slug: "draft-pavilion",
        title: "Draft Pavilion",
        templateId: "celestial-tech-pavilion-v1",
      });

      const request = new NextRequest("http://localhost:3000/api/v1/public/showrooms/acme-sound/draft-pavilion");
      const response = await handleGetShowroomManifest(request, {
        params: Promise.resolve({ orgSlug: "acme-sound", showroomSlug: "draft-pavilion" }),
      });

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error.code).toBe("SHOWROOM_NOT_PUBLISHED");
    });
  });
});
