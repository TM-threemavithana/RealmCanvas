/**
 * RealmCanvas Catalog Repository Interface & In-Memory Implementation
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 6.2, Section 8.2, Section 8.3)
 */

import type {
  Product,
  ProductVariant,
  ProductStatus,
} from "./CatalogSchema";

export interface CreateProductRepoInput {
  organizationId: string;
  slug: string;
  name: string;
  summary: string;
  status?: ProductStatus;
  ctaLabel?: string;
  ctaUrl: string;
  specifications?: Product["specifications"];
}

export interface UpdateProductRepoInput {
  name?: string;
  slug?: string;
  summary?: string;
  status?: ProductStatus;
  ctaLabel?: string;
  ctaUrl?: string;
  specifications?: Product["specifications"];
}

export interface CreateVariantRepoInput {
  productId: string;
  label: string;
  attributes: Record<string, string | number>;
  modelAssetId?: string;
  displayOrder?: number;
}

export interface ICatalogRepository {
  createProduct(input: CreateProductRepoInput): Promise<Product>;
  updateProduct(organizationId: string, productId: string, data: UpdateProductRepoInput): Promise<Product | null>;
  findProductById(organizationId: string, productId: string): Promise<Product | null>;
  findProductBySlug(organizationId: string, slug: string): Promise<Product | null>;
  listProductsByOrg(organizationId: string, filter?: { status?: ProductStatus }): Promise<Product[]>;

  createVariant(input: CreateVariantRepoInput): Promise<ProductVariant>;
  updateVariant(variantId: string, data: Partial<Omit<ProductVariant, "id" | "productId">>): Promise<ProductVariant | null>;
  listVariantsForProduct(productId: string): Promise<ProductVariant[]>;
  deleteVariant(variantId: string): Promise<boolean>;

  clear(): Promise<void>;
}

export class InMemoryCatalogRepository implements ICatalogRepository {
  private products = new Map<string, Product>();
  private variants = new Map<string, ProductVariant>();

  public async createProduct(input: CreateProductRepoInput): Promise<Product> {
    const existing = await this.findProductBySlug(input.organizationId, input.slug);
    if (existing) {
      throw new Error(`Product slug "${input.slug}" already exists in organization "${input.organizationId}"`);
    }

    const product: Product = {
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      slug: input.slug.toLowerCase().trim(),
      name: input.name.trim(),
      summary: input.summary.trim(),
      status: input.status ?? "draft",
      ctaLabel: input.ctaLabel ?? "Inquire Now",
      ctaUrl: input.ctaUrl.trim(),
      specifications: input.specifications ?? [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.products.set(product.id, product);
    return product;
  }

  public async updateProduct(
    organizationId: string,
    productId: string,
    data: UpdateProductRepoInput
  ): Promise<Product | null> {
    const product = this.products.get(productId);
    if (!product || product.organizationId !== organizationId) {
      return null;
    }

    if (data.slug && data.slug.toLowerCase().trim() !== product.slug) {
      const existing = await this.findProductBySlug(organizationId, data.slug);
      if (existing && existing.id !== productId) {
        throw new Error(`Product slug "${data.slug}" already exists in organization "${organizationId}"`);
      }
    }

    const updated: Product = {
      ...product,
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.slug !== undefined && { slug: data.slug.toLowerCase().trim() }),
      ...(data.summary !== undefined && { summary: data.summary.trim() }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.ctaLabel !== undefined && { ctaLabel: data.ctaLabel }),
      ...(data.ctaUrl !== undefined && { ctaUrl: data.ctaUrl.trim() }),
      ...(data.specifications !== undefined && { specifications: data.specifications }),
      updatedAt: new Date(),
    };

    this.products.set(productId, updated);
    return updated;
  }

  public async findProductById(organizationId: string, productId: string): Promise<Product | null> {
    const product = this.products.get(productId);
    if (!product || product.organizationId !== organizationId) {
      return null;
    }
    return product;
  }

  public async findProductBySlug(organizationId: string, slug: string): Promise<Product | null> {
    const normalized = slug.toLowerCase().trim();
    for (const product of this.products.values()) {
      if (product.organizationId === organizationId && product.slug === normalized) {
        return product;
      }
    }
    return null;
  }

  public async listProductsByOrg(
    organizationId: string,
    filter?: { status?: ProductStatus }
  ): Promise<Product[]> {
    const results: Product[] = [];
    for (const product of this.products.values()) {
      if (product.organizationId === organizationId) {
        if (!filter?.status || product.status === filter.status) {
          results.push(product);
        }
      }
    }
    return results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  public async createVariant(input: CreateVariantRepoInput): Promise<ProductVariant> {
    const variant: ProductVariant = {
      id: crypto.randomUUID(),
      productId: input.productId,
      label: input.label.trim(),
      attributes: input.attributes,
      modelAssetId: input.modelAssetId,
      displayOrder: input.displayOrder ?? 0,
    };

    this.variants.set(variant.id, variant);
    return variant;
  }

  public async updateVariant(
    variantId: string,
    data: Partial<Omit<ProductVariant, "id" | "productId">>
  ): Promise<ProductVariant | null> {
    const variant = this.variants.get(variantId);
    if (!variant) return null;

    const updated: ProductVariant = {
      ...variant,
      ...(data.label !== undefined && { label: data.label.trim() }),
      ...(data.attributes !== undefined && { attributes: data.attributes }),
      ...(data.modelAssetId !== undefined && { modelAssetId: data.modelAssetId }),
      ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
    };

    this.variants.set(variantId, updated);
    return updated;
  }

  public async listVariantsForProduct(productId: string): Promise<ProductVariant[]> {
    const results: ProductVariant[] = [];
    for (const variant of this.variants.values()) {
      if (variant.productId === productId) {
        results.push(variant);
      }
    }
    return results.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public async deleteVariant(variantId: string): Promise<boolean> {
    return this.variants.delete(variantId);
  }

  public async clear(): Promise<void> {
    this.products.clear();
    this.variants.clear();
  }
}
