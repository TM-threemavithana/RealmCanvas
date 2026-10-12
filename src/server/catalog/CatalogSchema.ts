/**
 * RealmCanvas Catalog Domain Schema & Typed DTOs
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 6.2, Section 7.4, Section 8.2, Section 10.1)
 */

export const PRODUCT_STATUSES = ["draft", "active", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface ProductVariant {
  id: string; // UUID PK
  productId: string; // FK -> products.id
  label: string;
  attributes: Record<string, string | number>;
  modelAssetId?: string;
  displayOrder: number;
}

export interface Product {
  id: string; // UUID PK
  organizationId: string; // FK -> organizations.id
  slug: string; // UNIQUE(organization_id, slug)
  name: string;
  summary: string;
  status: ProductStatus;
  ctaLabel: string;
  ctaUrl: string;
  specifications: ProductSpecification[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Public Product Representation
 * Safe projection schema exported to published manifests and preview renderers.
 * Complies with Section 7.4 & ADR-002: Zero internal secrets or sensitive columns.
 */
export interface PublicProduct {
  id: string;
  slug: string;
  title: string;
  summary: string;
  specifications: ProductSpecification[];
  variants: Array<{
    id: string;
    label: string;
    attributes: Record<string, string | number>;
  }>;
  cta: {
    label: string;
    url: string;
  };
  status: ProductStatus;
}
