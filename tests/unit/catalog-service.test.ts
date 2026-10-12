import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryTenantRepository } from "@/server/tenancy/TenantRepository";
import {
  TenantService,
  TenantAccessDeniedError,
  InsufficientRoleError,
} from "@/server/tenancy/TenantService";
import { InMemoryCatalogRepository } from "@/server/catalog/CatalogRepository";
import {
  CatalogService,
  InvalidCtaUrlError,
  ProductNotFoundError,
} from "@/server/catalog/CatalogService";
import type { Organization, User } from "@/server/db/schema";

describe("Catalog CRUD & Media Association (RC-013)", () => {
  let tenantRepo: InMemoryTenantRepository;
  let tenantService: TenantService;
  let catalogRepo: InMemoryCatalogRepository;
  let catalogService: CatalogService;

  let alice: User;
  let bob: User;
  let charlie: User;

  let acmeOrg: Organization;
  let betaOrg: Organization;

  beforeEach(async () => {
    tenantRepo = new InMemoryTenantRepository();
    tenantService = new TenantService(tenantRepo);
    catalogRepo = new InMemoryCatalogRepository();
    catalogService = new CatalogService(catalogRepo, tenantService);

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
      name: "Acme Sound Labs",
      slug: "acme-sound",
    });
    acmeOrg = acme;

    await tenantService.addMember(alice.id, acmeOrg.id, bob.id, "editor");
    await tenantService.addMember(alice.id, acmeOrg.id, charlie.id, "analyst");

    // Alice also creates Beta Org where Bob and Charlie are NOT members
    const { organization: beta } = await tenantService.createTenant(alice.id, {
      name: "Beta Acoustics",
      slug: "beta-acoustics",
    });
    betaOrg = beta;
  });

  describe("Product Creation & Tenant Scoping", () => {
    it("allows Editor to create a product with valid HTTPS CTA and specifications", async () => {
      const product = await catalogService.createProduct(bob.id, acmeOrg.id, {
        name: "Aurora Wireless Headphones",
        slug: "aurora-headphones",
        summary: "Studio reference grade headphones with titanium composite drivers.",
        status: "active",
        ctaLabel: "Pre-Order Now",
        ctaUrl: "https://store.acme.com/products/aurora",
        specifications: [
          { label: "Drivers", value: "45mm Custom Titanium" },
          { label: "Battery", value: "38 Hours" },
        ],
      });

      expect(product.id).toBeTruthy();
      expect(product.organizationId).toBe(acmeOrg.id);
      expect(product.slug).toBe("aurora-headphones");
      expect(product.status).toBe("active");
      expect(product.specifications.length).toBe(2);
    });

    it("rejects duplicate product slugs within the same organization", async () => {
      await catalogService.createProduct(bob.id, acmeOrg.id, {
        name: "Aurora Headphones",
        slug: "aurora-headphones",
        summary: "First product",
        ctaUrl: "https://store.acme.com/aurora",
      });

      await expect(
        catalogService.createProduct(bob.id, acmeOrg.id, {
          name: "Another Aurora",
          slug: "aurora-headphones",
          summary: "Duplicate slug",
          ctaUrl: "https://store.acme.com/aurora2",
        })
      ).rejects.toThrow(/already exists/i);
    });

    it("allows identical slugs in DIFFERENT organizations without collision", async () => {
      // Create product in Acme Org
      const p1 = await catalogService.createProduct(alice.id, acmeOrg.id, {
        name: "Flagship Monitor",
        slug: "flagship-monitor",
        summary: "Acme product",
        ctaUrl: "https://store.acme.com/flagship",
      });

      // Create product with same slug in Beta Org
      const p2 = await catalogService.createProduct(alice.id, betaOrg.id, {
        name: "Flagship Monitor",
        slug: "flagship-monitor",
        summary: "Beta product",
        ctaUrl: "https://store.beta.com/flagship",
      });

      expect(p1.id).not.toBe(p2.id);
      expect(p1.organizationId).toBe(acmeOrg.id);
      expect(p2.organizationId).toBe(betaOrg.id);
      expect(p1.slug).toBe("flagship-monitor");
      expect(p2.slug).toBe("flagship-monitor");
    });
  });

  describe("Commercial CTA Security Scheme Validation (Threat Model Section 10.1)", () => {
    it("allows valid HTTPS URLs and internal relative routes", async () => {
      const p1 = await catalogService.createProduct(bob.id, acmeOrg.id, {
        name: "Product HTTPS",
        slug: "prod-https",
        summary: "Valid https",
        ctaUrl: "https://checkout.acme.com/pay",
      });
      expect(p1.ctaUrl).toBe("https://checkout.acme.com/pay");

      const p2 = await catalogService.createProduct(bob.id, acmeOrg.id, {
        name: "Product Relative",
        slug: "prod-relative",
        summary: "Valid relative",
        ctaUrl: "/catalog",
      });
      expect(p2.ctaUrl).toBe("/catalog");
    });

    it("rejects insecure HTTP and malicious pseudo-protocol URLs with InvalidCtaUrlError", async () => {
      const maliciousUrls = [
        "http://insecure-store.com",
        "javascript:alert(document.cookie)",
        "javascript:void(0)",
        "data:text/html;base64,PHNjcmlwdD4=",
        "vbscript:msgbox(1)",
        "//malicious.com/double-slash",
        "ftp://files.example.com",
      ];

      for (const unsafeUrl of maliciousUrls) {
        await expect(
          catalogService.createProduct(bob.id, acmeOrg.id, {
            name: "Unsafe Product",
            slug: `unsafe-${Math.random()}`,
            summary: "Malicious CTA",
            ctaUrl: unsafeUrl,
          })
        ).rejects.toThrowError(InvalidCtaUrlError);
      }
    });
  });

  describe("Product Variants Management", () => {
    it("adds variants with PBR material attributes and preserves display order", async () => {
      const product = await catalogService.createProduct(bob.id, acmeOrg.id, {
        name: "Aurora Headphones",
        slug: "aurora",
        summary: "Reference monitor",
        ctaUrl: "https://store.acme.com/aurora",
      });

      const var1 = await catalogService.addVariant(bob.id, acmeOrg.id, product.id, {
        label: "Midnight Obsidian",
        attributes: { bodyColor: "#080E1C", bodyMetalness: 0.85 },
        displayOrder: 0,
      });

      const var2 = await catalogService.addVariant(bob.id, acmeOrg.id, product.id, {
        label: "Pearl Titanium",
        attributes: { bodyColor: "#E7F0FF", bodyMetalness: 0.92 },
        displayOrder: 1,
      });

      const details = await catalogService.getProduct(bob.id, acmeOrg.id, product.id);
      expect(details.variants.length).toBe(2);
      expect(details.variants[0].id).toBe(var1.id);
      expect(details.variants[1].id).toBe(var2.id);
    });
  });

  describe("Role Privilege & Multi-Tenancy Isolation", () => {
    it("blocks Analyst from creating or modifying products (InsufficientRoleError)", async () => {
      await expect(
        catalogService.createProduct(charlie.id, acmeOrg.id, {
          name: "Analyst Product",
          slug: "analyst-prod",
          summary: "Analyst cannot create",
          ctaUrl: "https://acme.com/buy",
        })
      ).rejects.toThrowError(InsufficientRoleError);
    });

    it("blocks User from accessing or updating products from another organization", async () => {
      const betaProduct = await catalogService.createProduct(alice.id, betaOrg.id, {
        name: "Secret Beta Product",
        slug: "beta-secret",
        summary: "Beta only",
        ctaUrl: "https://beta.com/secret",
      });

      // Bob (member of Acme, NOT Beta) attempts to read Beta product -> BLOCKED
      await expect(
        catalogService.getProduct(bob.id, betaOrg.id, betaProduct.id)
      ).rejects.toThrowError(TenantAccessDeniedError);

      // Bob attempts to update Beta product -> BLOCKED
      await expect(
        catalogService.updateProduct(bob.id, betaOrg.id, betaProduct.id, {
          name: "Tampered Product",
        })
      ).rejects.toThrowError(TenantAccessDeniedError);

      // Bob attempts to query Beta product under Acme ID -> ProductNotFoundError
      await expect(
        catalogService.getProduct(bob.id, acmeOrg.id, betaProduct.id)
      ).rejects.toThrowError(ProductNotFoundError);
    });
  });

  describe("Public Preview Projection (Section 7.4 & ADR-002)", () => {
    it("projects safe PublicProduct without exposing internal organization IDs or metadata", async () => {
      const product = await catalogService.createProduct(bob.id, acmeOrg.id, {
        name: "Aurora Wireless Headphones",
        slug: "aurora",
        summary: "Studio monitor",
        status: "active",
        ctaLabel: "Inquire Now",
        ctaUrl: "https://acme.com/aurora",
        specifications: [{ label: "Drivers", value: "45mm Titanium" }],
      });

      await catalogService.addVariant(bob.id, acmeOrg.id, product.id, {
        label: "Midnight Obsidian",
        attributes: { bodyColor: "#080E1C" },
      });

      const preview = await catalogService.generatePublicPreview(bob.id, acmeOrg.id, product.id);

      expect(preview.id).toBe(product.id);
      expect(preview.slug).toBe("aurora");
      expect(preview.title).toBe("Aurora Wireless Headphones");
      expect(preview.cta.url).toBe("https://acme.com/aurora");
      expect(preview.variants.length).toBe(1);

      // Verify that internal organizationId is NOT exposed in the public preview projection
      expect((preview as unknown as Record<string, unknown>).organizationId).toBeUndefined();
    });
  });
});
