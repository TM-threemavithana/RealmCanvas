import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryTenantRepository } from "@/server/tenancy/TenantRepository";
import { TenantService } from "@/server/tenancy/TenantService";
import { InMemoryCatalogRepository } from "@/server/catalog/CatalogRepository";
import { CatalogService } from "@/server/catalog/CatalogService";
import { InMemoryShowroomRepository } from "@/server/showrooms/ShowroomRepository";
import { PublishingService } from "@/server/showrooms/PublishingService";
import {
  PlacementEditor,
  InvalidSlotError,
  InvalidPlacementScaleError,
  TEMPLATE_SLOT_REGISTRY,
} from "@/server/showrooms/PlacementEditor";
import type { Organization, User } from "@/server/db/schema";
import type { Product } from "@/server/catalog/CatalogSchema";
import type { Showroom } from "@/server/showrooms/ShowroomSchema";

describe("Fixed Placement Editor & Lifecycle (RC-015)", () => {
  let tenantRepo: InMemoryTenantRepository;
  let tenantService: TenantService;
  let catalogRepo: InMemoryCatalogRepository;
  let catalogService: CatalogService;
  let showroomRepo: InMemoryShowroomRepository;
  let publishingService: PublishingService;
  let placementEditor: PlacementEditor;

  let alice: User;
  let bob: User;
  let acmeOrg: Organization;

  let productA: Product;
  let productB: Product;
  let showroom: Showroom;

  beforeEach(async () => {
    tenantRepo = new InMemoryTenantRepository();
    tenantService = new TenantService(tenantRepo);
    catalogRepo = new InMemoryCatalogRepository();
    catalogService = new CatalogService(catalogRepo, tenantService);
    showroomRepo = new InMemoryShowroomRepository();
    publishingService = new PublishingService(showroomRepo, tenantService, catalogService);
    placementEditor = new PlacementEditor(publishingService, tenantService, catalogService);

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

    const { organization } = await tenantService.createTenant(alice.id, {
      name: "Acme Hardware",
      slug: "acme-hardware",
    });
    acmeOrg = organization;

    await tenantService.addMember(alice.id, acmeOrg.id, bob.id, "editor");

    // Create 2 products
    productA = await catalogService.createProduct(bob.id, acmeOrg.id, {
      name: "Headphones Alpha",
      slug: "alpha",
      summary: "Alpha flagship",
      status: "active",
      ctaUrl: "https://acme.com/alpha",
    });

    productB = await catalogService.createProduct(bob.id, acmeOrg.id, {
      name: "Headphones Beta",
      slug: "beta",
      summary: "Beta compact",
      status: "active",
      ctaUrl: "https://acme.com/beta",
    });

    // Create Showroom
    const created = await publishingService.createShowroom(bob.id, acmeOrg.id, {
      slug: "celestial-showroom",
      title: "Celestial Showroom",
    });
    showroom = created.showroom;
  });

  describe("Template Slot Registry", () => {
    it("exposes all approved fixed slots for celestial-tech-pavilion-v1", () => {
      const slots = placementEditor.getAvailableSlots();
      expect(slots.length).toBe(6);

      const slotKeys = slots.map((s) => s.slotKey);
      expect(slotKeys).toContain("featured-hero");
      expect(slotKeys).toContain("gallery-01");
      expect(slotKeys).toContain("gallery-02");
      expect(slotKeys).toContain("gallery-03");
      expect(slotKeys).toContain("gallery-04");
      expect(slotKeys).toContain("lab-hero");
    });
  });

  describe("Slot Assignment & Constraints", () => {
    it("assigns product to featured-hero slot and enforces UNIQUE slot_key constraint", async () => {
      // Assign productA to featured-hero
      const rev2 = await placementEditor.assignSlotPlacement(
        bob.id,
        acmeOrg.id,
        showroom.id,
        1,
        {
          slotKey: "featured-hero",
          productId: productA.id,
          displayOptions: { scale: 1.2, label: "Hero Alpha" },
        }
      );

      expect(rev2.revisionNumber).toBe(2);
      expect(rev2.draftConfig.placements.length).toBe(1);
      expect(rev2.draftConfig.placements[0].productId).toBe(productA.id);
      expect(rev2.draftConfig.placements[0].displayOptions?.scale).toBe(1.2);

      // Reassign featured-hero to productB (must replace productA, not duplicate slot)
      const rev3 = await placementEditor.assignSlotPlacement(
        bob.id,
        acmeOrg.id,
        showroom.id,
        2,
        {
          slotKey: "featured-hero",
          productId: productB.id,
        }
      );

      expect(rev3.revisionNumber).toBe(3);
      expect(rev3.draftConfig.placements.length).toBe(1);
      expect(rev3.draftConfig.placements[0].productId).toBe(productB.id);

      // Now add productA to gallery-01 (different slot -> total 2 placements)
      const rev4 = await placementEditor.assignSlotPlacement(
        bob.id,
        acmeOrg.id,
        showroom.id,
        3,
        {
          slotKey: "gallery-01",
          productId: productA.id,
        }
      );

      expect(rev4.revisionNumber).toBe(4);
      expect(rev4.draftConfig.placements.length).toBe(2);
    });

    it("enforces server-side scale constraints within [0.5, 2.0]", async () => {
      // Reject too small (< 0.5)
      await expect(
        placementEditor.assignSlotPlacement(bob.id, acmeOrg.id, showroom.id, 1, {
          slotKey: "featured-hero",
          productId: productA.id,
          displayOptions: { scale: 0.2 },
        })
      ).rejects.toThrowError(InvalidPlacementScaleError);

      // Reject too large (> 2.0)
      await expect(
        placementEditor.assignSlotPlacement(bob.id, acmeOrg.id, showroom.id, 1, {
          slotKey: "featured-hero",
          productId: productA.id,
          displayOptions: { scale: 2.5 },
        })
      ).rejects.toThrowError(InvalidPlacementScaleError);
    });

    it("rejects unapproved slot keys or unwhitelisted interactions", async () => {
      await expect(
        placementEditor.assignSlotPlacement(bob.id, acmeOrg.id, showroom.id, 1, {
          slotKey: "unapproved-chandelier",
          productId: productA.id,
        })
      ).rejects.toThrowError(InvalidSlotError);

      await expect(
        placementEditor.assignSlotPlacement(bob.id, acmeOrg.id, showroom.id, 1, {
          slotKey: "featured-hero",
          productId: productA.id,
          interaction: "execute_remote_code",
        })
      ).rejects.toThrowError(InvalidSlotError);
    });

    it("clears placement from a slot cleanly", async () => {
      // First assign
      await placementEditor.assignSlotPlacement(bob.id, acmeOrg.id, showroom.id, 1, {
        slotKey: "featured-hero",
        productId: productA.id,
      });

      // Clear slot
      const rev3 = await placementEditor.clearSlotPlacement(
        bob.id,
        acmeOrg.id,
        showroom.id,
        2,
        "featured-hero"
      );

      expect(rev3.draftConfig.placements.length).toBe(0);
    });
  });

  describe("Lifecycle Acceptance: Changes visible in preview then publication", () => {
    it("makes placement changes immediately visible in draft preview, then active in publication", async () => {
      // 1. Assign placement in draft
      await placementEditor.assignSlotPlacement(bob.id, acmeOrg.id, showroom.id, 1, {
        slotKey: "featured-hero",
        productId: productA.id,
        displayOptions: { label: "Hero Showcase", scale: 1.1 },
      });

      // 2. Verify changes visible immediately in draft preview
      const previewManifest = await placementEditor.getDraftPreviewManifest(
        bob.id,
        acmeOrg.id,
        showroom.id
      );

      expect(previewManifest.placements.length).toBe(1);
      expect(previewManifest.placements[0].slotKey).toBe("featured-hero");
      expect(previewManifest.placements[0].productId).toBe(productA.id);
      expect(previewManifest.products.length).toBe(1);
      expect(previewManifest.products[0].slug).toBe("alpha");

      // Verify public showroom is NOT yet published
      const initialActive = await publishingService.getActivePublishedManifest(showroom.id);
      expect(initialActive).toBeNull();

      // 3. Publish showroom
      const { manifest: publishedManifest } = await publishingService.publishShowroom(
        bob.id,
        acmeOrg.id,
        showroom.id,
        2
      );

      // 4. Verify changes are now active in publication for visitors
      const activeManifest = await publishingService.getActivePublishedManifest(showroom.id);
      expect(activeManifest).toEqual(publishedManifest);
      expect(activeManifest?.placements[0].slotKey).toBe("featured-hero");
      expect(activeManifest?.products[0].slug).toBe("alpha");
    });
  });
});
