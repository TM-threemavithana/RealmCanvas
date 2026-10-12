import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryTenantRepository } from "@/server/tenancy/TenantRepository";
import { TenantService } from "@/server/tenancy/TenantService";
import { InMemoryCatalogRepository } from "@/server/catalog/CatalogRepository";
import { CatalogService } from "@/server/catalog/CatalogService";
import { InMemoryShowroomRepository } from "@/server/showrooms/ShowroomRepository";
import {
  PublishingService,
  RevisionConflictError,
  PublishValidationError,
} from "@/server/showrooms/PublishingService";
import type { Organization, User } from "@/server/db/schema";
import type { Product } from "@/server/catalog/CatalogSchema";

describe("Draft Revision & Publish Transaction (RC-014)", () => {
  let tenantRepo: InMemoryTenantRepository;
  let tenantService: TenantService;
  let catalogRepo: InMemoryCatalogRepository;
  let catalogService: CatalogService;
  let showroomRepo: InMemoryShowroomRepository;
  let publishingService: PublishingService;

  let alice: User;
  let bob: User;
  let charlie: User;

  let acmeOrg: Organization;
  let betaOrg: Organization;

  let acmeProduct: Product;
  let betaProduct: Product;

  beforeEach(async () => {
    tenantRepo = new InMemoryTenantRepository();
    tenantService = new TenantService(tenantRepo);
    catalogRepo = new InMemoryCatalogRepository();
    catalogService = new CatalogService(catalogRepo, tenantService);
    showroomRepo = new InMemoryShowroomRepository();
    publishingService = new PublishingService(showroomRepo, tenantService, catalogService);

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

    const { organization: acme } = await tenantService.createTenant(alice.id, {
      name: "Acme Showrooms",
      slug: "acme-showrooms",
    });
    acmeOrg = acme;

    const { organization: beta } = await tenantService.createTenant(alice.id, {
      name: "Beta Showrooms",
      slug: "beta-showrooms",
    });
    betaOrg = beta;

    await tenantService.addMember(alice.id, acmeOrg.id, bob.id, "editor");
    await tenantService.addMember(alice.id, acmeOrg.id, charlie.id, "analyst");

    // Create an active product in Acme
    acmeProduct = await catalogService.createProduct(bob.id, acmeOrg.id, {
      name: "Aurora Headphones",
      slug: "aurora",
      summary: "Studio acoustics",
      status: "active",
      ctaLabel: "Buy Now",
      ctaUrl: "https://store.acme.com/aurora",
      specifications: [{ label: "Acoustics", value: "Titanium" }],
    });

    await catalogService.addVariant(bob.id, acmeOrg.id, acmeProduct.id, {
      label: "Midnight Obsidian",
      attributes: { bodyColor: "#080E1C" },
    });

    // Create a product in Beta Org
    betaProduct = await catalogService.createProduct(alice.id, betaOrg.id, {
      name: "Beta Transducer",
      slug: "beta-transducer",
      summary: "Secret acoustic device",
      status: "active",
      ctaUrl: "https://beta.com/transducer",
    });
  });

  describe("Showroom Creation & Revision 1 Initialization", () => {
    it("creates a showroom draft and initializes Revision 1", async () => {
      const { showroom, revision } = await publishingService.createShowroom(bob.id, acmeOrg.id, {
        slug: "autumn-celestial",
        title: "Autumn Celestial Showcase",
      });

      expect(showroom.id).toBeTruthy();
      expect(showroom.slug).toBe("autumn-celestial");
      expect(showroom.templateId).toBe("celestial-tech-pavilion-v1");
      expect(showroom.activePublicationId).toBeUndefined();

      expect(revision.showroomId).toBe(showroom.id);
      expect(revision.revisionNumber).toBe(1);
      expect(revision.draftConfig.templateId).toBe("celestial-tech-pavilion-v1");
      expect(revision.draftConfig.branding.displayName).toBe("Autumn Celestial Showcase");
      expect(revision.draftConfig.placements.length).toBe(0);
    });
  });

  describe("Optimistic Concurrency Control & Revision Conflict Testing (Section 8.4)", () => {
    it("successfully increments revision number on update with valid expectedRevisionNumber", async () => {
      const { showroom, revision: rev1 } = await publishingService.createShowroom(bob.id, acmeOrg.id, {
        slug: "spring-expo",
        title: "Spring Expo",
      });

      const updatedRev = await publishingService.updateDraft(
        bob.id,
        acmeOrg.id,
        showroom.id,
        rev1.revisionNumber, // 1
        {
          ...rev1.draftConfig,
          branding: { ...rev1.draftConfig.branding, displayName: "Spring Expo 2026" },
        }
      );

      expect(updatedRev.revisionNumber).toBe(2);
      expect(updatedRev.draftConfig.branding.displayName).toBe("Spring Expo 2026");

      const latest = await publishingService.getLatestDraftRevision(bob.id, acmeOrg.id, showroom.id);
      expect(latest.revisionNumber).toBe(2);
    });

    it("rejects concurrent draft updates on stale revision numbers with RevisionConflictError (409)", async () => {
      const { showroom } = await publishingService.createShowroom(bob.id, acmeOrg.id, {
        slug: "concurrency-test",
        title: "Concurrency Test",
      });

      // User 1 updates Revision 1 -> creates Revision 2
      await publishingService.updateDraft(bob.id, acmeOrg.id, showroom.id, 1, {
        templateId: "celestial-tech-pavilion-v1",
        branding: { displayName: "Update from User 1", accentColor: "#37DDEB" },
        placements: [],
      });

      // User 2 attempts to update using stale revision 1 -> CONFLICT
      await expect(
        publishingService.updateDraft(bob.id, acmeOrg.id, showroom.id, 1, {
          templateId: "celestial-tech-pavilion-v1",
          branding: { displayName: "Update from User 2", accentColor: "#8D6BEE" },
          placements: [],
        })
      ).rejects.toThrowError(RevisionConflictError);
    });

    it("rejects publish attempts on stale revision numbers with RevisionConflictError", async () => {
      const { showroom } = await publishingService.createShowroom(bob.id, acmeOrg.id, {
        slug: "publish-conflict",
        title: "Publish Conflict Test",
      });

      // Update to revision 2
      await publishingService.updateDraft(bob.id, acmeOrg.id, showroom.id, 1, {
        templateId: "celestial-tech-pavilion-v1",
        branding: { displayName: "Revision 2 Branding", accentColor: "#37DDEB" },
        placements: [],
      });

      // Attempt to publish using outdated expected revision 1
      await expect(
        publishingService.publishShowroom(bob.id, acmeOrg.id, showroom.id, 1)
      ).rejects.toThrowError(RevisionConflictError);
    });
  });

  describe("Publish Transaction & Cross-Tenant Security Invariant (Section 8.3 & Section 8.4)", () => {
    it("successfully compiles and atomically activates an immutable PublicSceneManifest", async () => {
      const { showroom, revision: rev1 } = await publishingService.createShowroom(bob.id, acmeOrg.id, {
        slug: "flagship-pavilion",
        title: "Flagship Pavilion",
      });

      // Add valid hero placement referencing Acme product
      await publishingService.updateDraft(bob.id, acmeOrg.id, showroom.id, rev1.revisionNumber, {
        templateId: "celestial-tech-pavilion-v1",
        branding: { displayName: "Flagship Pavilion", accentColor: "#37DDEB" },
        placements: [
          {
            slotKey: "featured-hero",
            productId: acmeProduct.id,
            interaction: "inspect_product",
            displayOptions: { label: "Hero Display" },
          },
        ],
      });

      // Publish revision 2
      const { publication, manifest } = await publishingService.publishShowroom(
        bob.id,
        acmeOrg.id,
        showroom.id,
        2
      );

      expect(publication.id).toBeTruthy();
      expect(publication.showroomId).toBe(showroom.id);
      expect(publication.revisionId).toBeTruthy();

      expect(manifest.schemaVersion).toBe(1);
      expect(manifest.publicationId).toBe(publication.id);
      expect(manifest.templateId).toBe("celestial-tech-pavilion-v1");
      expect(manifest.placements.length).toBe(1);
      expect(manifest.placements[0].slotKey).toBe("featured-hero");
      expect(manifest.products.length).toBe(1);
      expect(manifest.products[0].id).toBe(acmeProduct.id);
      expect(manifest.products[0].slug).toBe("aurora");

      // Verify active publication pointer is updated on the showroom
      const activeManifest = await publishingService.getActivePublishedManifest(showroom.id);
      expect(activeManifest).toEqual(manifest);
    });

    it("strictly blocks publishing placements referencing products from another organization", async () => {
      const { showroom, revision } = await publishingService.createShowroom(bob.id, acmeOrg.id, {
        slug: "cross-tenant-hack",
        title: "Cross Tenant Test",
      });

      // Attempt to configure a placement referencing betaProduct (from Beta Org!)
      await publishingService.updateDraft(bob.id, acmeOrg.id, showroom.id, revision.revisionNumber, {
        templateId: "celestial-tech-pavilion-v1",
        branding: { displayName: "Cross Tenant Attack", accentColor: "#37DDEB" },
        placements: [
          {
            slotKey: "featured-hero",
            productId: betaProduct.id, // Cross-tenant product ID!
            interaction: "inspect_product",
          },
        ],
      });

      // Publishing MUST fail with PublishValidationError
      await expect(
        publishingService.publishShowroom(bob.id, acmeOrg.id, showroom.id, 2)
      ).rejects.toThrowError(PublishValidationError);

      // Verify NO publication was created or activated
      const activeManifest = await publishingService.getActivePublishedManifest(showroom.id);
      expect(activeManifest).toBeNull();
    });
  });
});
