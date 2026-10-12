/**
 * RealmCanvas Catalog Service & Safe Commercial CTA Validation
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 6.2, Section 7.4, Section 8.3, Section 10.1)
 */

import type { TenantService } from "../tenancy/TenantService";
import type {
  ICatalogRepository,
  CreateProductRepoInput,
  UpdateProductRepoInput,
  CreateVariantRepoInput,
} from "./CatalogRepository";
import type {
  Product,
  ProductVariant,
  ProductStatus,
  PublicProduct,
} from "./CatalogSchema";

export class InvalidCtaUrlError extends Error {
  constructor(message = "CTA URL violates security scheme policy (must be HTTPS or relative path).") {
    super(message);
    this.name = "InvalidCtaUrlError";
  }
}

export class ProductNotFoundError extends Error {
  constructor(message = "Product not found in organization.") {
    super(message);
    this.name = "ProductNotFoundError";
  }
}

/**
 * Validates outbound CTA URLs according to Section 10.1 (Threat Model).
 * Strictly requires HTTPS scheme or trusted internal relative paths.
 * Rejects javascript:, data:, vbscript:, and insecure HTTP.
 */
export function validateCtaUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();

  // Allow relative internal paths
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export class CatalogService {
  constructor(
    private repo: ICatalogRepository,
    private tenantService: TenantService
  ) {}

  /**
   * Creates a new product scoped to an organization.
   * Requires "editor" or "owner" role.
   */
  public async createProduct(
    actorUserId: string,
    organizationId: string,
    input: Omit<CreateProductRepoInput, "organizationId">
  ): Promise<Product> {
    await this.tenantService.assertTenantAccess(actorUserId, organizationId, "editor");

    if (!validateCtaUrl(input.ctaUrl)) {
      throw new InvalidCtaUrlError(`CTA URL "${input.ctaUrl}" failed security scheme validation.`);
    }

    return this.repo.createProduct({
      ...input,
      organizationId,
    });
  }

  /**
   * Updates an existing product.
   * Requires "editor" or "owner" role.
   */
  public async updateProduct(
    actorUserId: string,
    organizationId: string,
    productId: string,
    input: UpdateProductRepoInput
  ): Promise<Product> {
    await this.tenantService.assertTenantAccess(actorUserId, organizationId, "editor");

    if (input.ctaUrl !== undefined && !validateCtaUrl(input.ctaUrl)) {
      throw new InvalidCtaUrlError(`CTA URL "${input.ctaUrl}" failed security scheme validation.`);
    }

    const updated = await this.repo.updateProduct(organizationId, productId, input);
    if (!updated) {
      throw new ProductNotFoundError(`Product "${productId}" not found in organization "${organizationId}".`);
    }

    return updated;
  }

  /**
   * Adds a variant to a product.
   * Requires "editor" or "owner" role.
   */
  public async addVariant(
    actorUserId: string,
    organizationId: string,
    productId: string,
    input: Omit<CreateVariantRepoInput, "productId">
  ): Promise<ProductVariant> {
    await this.tenantService.assertTenantAccess(actorUserId, organizationId, "editor");

    const product = await this.repo.findProductById(organizationId, productId);
    if (!product) {
      throw new ProductNotFoundError(`Product "${productId}" not found in organization "${organizationId}".`);
    }

    return this.repo.createVariant({
      ...input,
      productId,
    });
  }

  /**
   * Retrieves a product and its configured variants, scoped to the tenant.
   */
  public async getProduct(
    actorUserId: string,
    organizationId: string,
    productId: string
  ): Promise<{ product: Product; variants: ProductVariant[] }> {
    await this.tenantService.assertTenantAccess(actorUserId, organizationId, "analyst");

    const product = await this.repo.findProductById(organizationId, productId);
    if (!product) {
      throw new ProductNotFoundError(`Product "${productId}" not found in organization "${organizationId}".`);
    }

    const variants = await this.repo.listVariantsForProduct(productId);
    return { product, variants };
  }

  /**
   * Lists all products for an organization.
   */
  public async listProducts(
    actorUserId: string,
    organizationId: string,
    filter?: { status?: ProductStatus }
  ): Promise<Product[]> {
    await this.tenantService.assertTenantAccess(actorUserId, organizationId, "analyst");
    return this.repo.listProductsByOrg(organizationId, filter);
  }

  /**
   * Generates a safe PublicProduct preview projection.
   * Enforces Section 7.4 & ADR-002: strips internal organizationId, audit timestamps, and raw DB metadata.
   */
  public async generatePublicPreview(
    actorUserId: string,
    organizationId: string,
    productId: string
  ): Promise<PublicProduct> {
    const { product, variants } = await this.getProduct(actorUserId, organizationId, productId);

    return {
      id: product.id,
      slug: product.slug,
      title: product.name,
      summary: product.summary,
      specifications: product.specifications,
      variants: variants.map((v) => ({
        id: v.id,
        label: v.label,
        attributes: v.attributes,
      })),
      cta: {
        label: product.ctaLabel,
        url: product.ctaUrl,
      },
      status: product.status,
    };
  }
}
