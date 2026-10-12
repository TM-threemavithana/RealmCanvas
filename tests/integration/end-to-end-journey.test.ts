import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { services } from "@/server/services";
import { GET as handleGetShowroom } from "@/app/api/v1/public/showrooms/[orgSlug]/[showroomSlug]/route";
import { POST as handlePostEvents } from "@/app/api/v1/public/events/route";
import { POST as handlePostLeads } from "@/app/api/v1/public/leads/route";
import { GET as handleGetAnalyticsSummary } from "@/app/api/v1/admin/analytics/summary/route";
import type { Organization, User } from "@/server/db/schema";
import { RevisionConflictError } from "@/server/showrooms/PublishingService";

describe("End-to-End System Integration Journey (RC-024)", () => {
  let acmeOrg: Organization;
  let alice: User; // Owner
  let charlie: User; // Analyst
  let eve: User; // Outsider
  let showroomId: string;
  let heroProductId: string;

  beforeEach(async () => {
    // 1. Reset repositories
    await services.tenantRepo.clear();
    await services.catalogRepo.clear();
    await services.showroomRepo.clear();
    await services.leadRepo.clear();
    await services.analyticsRepo.clear();

    // 2. Setup organization and members
    alice = await services.tenantRepo.createUser({
      authSubject: "auth0|alice_e2e",
      email: "alice@acme.test",
      displayName: "Alice Owner",
    });

    charlie = await services.tenantRepo.createUser({
      authSubject: "auth0|charlie_e2e",
      email: "charlie@acme.test",
      displayName: "Charlie Analyst",
    });

    eve = await services.tenantRepo.createUser({
      authSubject: "auth0|eve_e2e",
      email: "eve@external.test",
      displayName: "Eve Outsider",
    });

    const tenantResult = await services.tenantService.createTenant(alice.id, {
      name: "Acme High-End Audio",
      slug: "acme-audio",
    });
    acmeOrg = tenantResult.organization;

    await services.tenantService.addMember(alice.id, acmeOrg.id, charlie.id, "analyst");

    // 3. Create hero product
    const product = await services.catalogService.createProduct(alice.id, acmeOrg.id, {
      slug: "acme-headphones",
      name: "Acme Flagship Headphones",
      summary: "Audiophile reference headphones with titanium enclosures.",
      ctaUrl: "https://example.com/products/acme-headphones",
    });
    heroProductId = product.id;

    // 4. Create showroom with initial revision 1
    const created = await services.publishingService.createShowroom(alice.id, acmeOrg.id, {
      slug: "celestial-pavilion",
      title: "Celestial Audio Pavilion",
    });
    showroomId = created.showroom.id;

    // 5. Initial draft placement and publication
    await services.placementEditor.assignSlotPlacement(
      alice.id,
      acmeOrg.id,
      showroomId,
      1,
      {
        slotKey: "featured-hero",
        productId: heroProductId,
        displayOptions: { scale: 1.0 },
      }
    );

    await services.publishingService.publishShowroom(
      alice.id,
      acmeOrg.id,
      showroomId,
      2
    );
  });

  describe("Journey 1: Public Visitor Conversion Funnel (TC-001 - TC-005, TC-013)", () => {
    it("completes full visitor journey from manifest fetch to lead submission and analytics", async () => {
      // Step 1: Visitor loads public showroom manifest
      const manifestReq = new NextRequest(
        `http://localhost:3000/api/v1/public/showrooms/${acmeOrg.slug}/celestial-pavilion`
      );
      const manifestRes = await handleGetShowroom(manifestReq, {
        params: Promise.resolve({
          orgSlug: acmeOrg.slug,
          showroomSlug: "celestial-pavilion",
        }),
      });

      expect(manifestRes.status).toBe(200);
      const manifestJson = await manifestRes.json();
      expect(manifestJson.templateId).toBe("celestial-tech-pavilion-v1");
      expect(manifestJson.placements).toHaveLength(1);
      expect(manifestJson.placements[0].slotKey).toBe("featured-hero");
      expect(manifestJson.products).toHaveLength(1);
      expect(manifestJson.products[0].title).toBe("Acme Flagship Headphones");

      // Step 2: Visitor emits telemetry events (experience_entered, product_inspected)
      const telemetryReq = new NextRequest("http://localhost:3000/api/v1/public/events", {
        method: "POST",
        body: JSON.stringify({
          organizationId: acmeOrg.id,
          events: [
            {
              showroomId,
              sessionToken: "rc_sess_visitor_abc",
              eventType: "experience_entered",
              eventData: { entryMode: "webgl" },
            },
            {
              showroomId,
              sessionToken: "rc_sess_visitor_abc",
              eventType: "product_inspected",
              eventData: { productId: heroProductId, slotKey: "featured-hero" },
            },
          ],
        }),
      });

      const telemetryRes = await handlePostEvents(telemetryReq);
      expect(telemetryRes.status).toBe(202);
      const telemetryJson = await telemetryRes.json();
      expect(telemetryJson.accepted).toBe(2);

      // Step 3: Visitor submits quote request with consent
      const leadReq = new NextRequest("http://localhost:3000/api/v1/public/leads", {
        method: "POST",
        body: JSON.stringify({
          organizationId: acmeOrg.id,
          showroomId,
          productId: heroProductId,
          contact: {
            name: "Dr. Sound Buyer",
            email: "buyer@studios.com",
            phone: "+1-555-0199",
            notes: "Studio upgrade inquiry",
          },
          consent: true,
        }),
      });

      const leadRes = await handlePostLeads(leadReq);
      expect(leadRes.status).toBe(201);
      const leadJson = await leadRes.json();
      expect(leadJson.leadId).toBeDefined();

      // Step 4: Duplicate lead request within 10-minute window yields 409 Conflict (TC-013)
      const duplicateLeadReq = new NextRequest("http://localhost:3000/api/v1/public/leads", {
        method: "POST",
        body: JSON.stringify({
          organizationId: acmeOrg.id,
          showroomId,
          productId: heroProductId,
          contact: {
            name: "Dr. Sound Buyer",
            email: "buyer@studios.com",
            phone: "+1-555-0199",
            notes: "Studio upgrade inquiry",
          },
          consent: true,
        }),
      });

      const duplicateLeadRes = await handlePostLeads(duplicateLeadReq);
      expect(duplicateLeadRes.status).toBe(409);
      const dupJson = await duplicateLeadRes.json();
      expect(dupJson.error.code).toBe("DUPLICATE_INQUIRY");
    });
  });

  describe("Journey 2: Merchant Studio Publishing & Concurrency Conflict (TC-006 - TC-008)", () => {
    it("handles placement updates, optimistic revision conflicts, and atomic live updates", async () => {
      // Step 1: Owner assigns slot placement, bumping draft revision to Rev #3
      const placementResult = await services.placementEditor.assignSlotPlacement(
        alice.id,
        acmeOrg.id,
        showroomId,
        2,
        {
          slotKey: "gallery-01",
          productId: heroProductId,
          displayOptions: { scale: 1.5 },
        }
      );
      expect(placementResult.revisionNumber).toBe(3);

      // Step 2: Optimistic concurrency conflict (TC-008)
      // Attempting to publish using stale revision number 2 throws RevisionConflictError
      await expect(
        services.publishingService.publishShowroom(
          alice.id,
          acmeOrg.id,
          showroomId,
          2 // Stale revision number!
        )
      ).rejects.toThrow(RevisionConflictError);

      // Step 3: Publish with valid revision number 3
      const { publication, manifest } = await services.publishingService.publishShowroom(
        alice.id,
        acmeOrg.id,
        showroomId,
        3
      );
      expect(publication.id).toBeDefined();
      expect(manifest.publicationId).toBe(publication.id);

      // Step 4: Verify live showroom manifest now reflects 2 assigned slots
      const manifestReq = new NextRequest(
        `http://localhost:3000/api/v1/public/showrooms/${acmeOrg.slug}/celestial-pavilion`
      );
      const manifestRes = await handleGetShowroom(manifestReq, {
        params: Promise.resolve({
          orgSlug: acmeOrg.slug,
          showroomSlug: "celestial-pavilion",
        }),
      });
      const manifestJson = await manifestRes.json();
      expect(manifestJson.placements).toHaveLength(2);
      expect(manifestJson.publicationId).toBe(publication.id);

      // Step 5: Analyst Charlie queries analytics summary
      const analyticsReq = new NextRequest(
        `http://localhost:3000/api/v1/admin/analytics/summary?organizationId=${acmeOrg.id}&showroomId=${showroomId}`,
        { headers: { "x-actor-user-id": charlie.id } }
      );
      const analyticsRes = await handleGetAnalyticsSummary(analyticsReq);
      expect(analyticsRes.status).toBe(200);

      // Step 6: Tenant isolation (TC-006) - Outsider Eve receives 403 Forbidden
      const outsiderReq = new NextRequest(
        `http://localhost:3000/api/v1/admin/analytics/summary?organizationId=${acmeOrg.id}&showroomId=${showroomId}`,
        { headers: { "x-actor-user-id": eve.id } }
      );
      const outsiderRes = await handleGetAnalyticsSummary(outsiderReq);
      expect(outsiderRes.status).toBe(403);
    });
  });
});
