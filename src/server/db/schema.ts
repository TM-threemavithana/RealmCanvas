/**
 * RealmCanvas Core Relational Schema & Typed DTOs
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 8.1, Section 8.2, Section 8.3)
 */

export type OrganizationPlan = "starter" | "pro" | "enterprise";

export interface Organization {
  id: string; // UUID PK
  slug: string; // UNIQUE
  name: string;
  plan: OrganizationPlan;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string; // UUID PK
  authSubject: string; // UNIQUE (external auth provider identifier)
  email: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ORGANIZATION_ROLES = ["owner", "editor", "analyst"] as const;
export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];

export const MEMBERSHIP_STATUSES = ["active", "invited", "suspended"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export interface Membership {
  id: string; // UUID PK
  organizationId: string; // FK -> organizations.id
  userId: string; // FK -> users.id
  role: OrganizationRole;
  status: MembershipStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Role capability rankings for permission checks
 * owner (3) > editor (2) > analyst (1)
 */
export const ROLE_HIERARCHY: Record<OrganizationRole, number> = {
  owner: 3,
  editor: 2,
  analyst: 1,
};

export function hasMinimumRole(
  userRole: OrganizationRole,
  requiredRole: OrganizationRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// ==========================================
// SHOWROOMS, REVISIONS & PUBLICATIONS
// ==========================================

export interface Showroom {
  id: string; // UUID PK
  organizationId: string; // FK -> organizations.id
  slug: string; // UNIQUE(organization_id, slug)
  title: string;
  templateId: string;
  activePublicationId?: string; // FK -> publications.id
  createdAt: Date;
  updatedAt: Date;
}

export interface ShowroomRevision {
  id: string; // UUID PK
  showroomId: string; // FK -> showrooms.id
  revisionNumber: number; // UNIQUE(showroom_id, revision_number)
  draftConfig: Record<string, unknown>;
  editedBy: string; // FK -> users.id
  updatedAt: Date;
}

export interface Publication {
  id: string; // UUID PK
  showroomId: string; // FK -> showrooms.id
  revisionId: string; // FK -> showroom_revisions.id
  manifest: Record<string, unknown>; // Immutable published scene manifest
  publishedBy: string; // FK -> users.id
  publishedAt: Date;
}

// ==========================================
// CATALOG, PRODUCTS & ASSETS
// ==========================================

export const PRODUCT_STATUSES = ["draft", "published", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export interface Product {
  id: string; // UUID PK
  organizationId: string; // FK -> organizations.id
  slug: string; // UNIQUE(organization_id, slug)
  name: string;
  summary: string;
  status: ProductStatus;
  ctaUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string; // UUID PK
  productId: string; // FK -> products.id
  label: string;
  attributes: Record<string, unknown>;
  modelAssetId?: string; // FK -> assets.id
  displayOrder: number;
  createdAt: Date;
}

export const ASSET_STATES = [
  "pending",
  "uploaded",
  "quarantined",
  "verified",
  "archived",
] as const;
export type AssetState = (typeof ASSET_STATES)[number];

export interface Asset {
  id: string; // UUID PK
  organizationId: string; // FK -> organizations.id
  objectKey: string; // UNIQUE
  contentType: string;
  bytes: number;
  state: AssetState;
  checksum?: string;
  createdAt: Date;
}

// ==========================================
// PLACEMENTS (SLOT TO PRODUCT BINDINGS)
// ==========================================

export interface Placement {
  id: string; // UUID PK
  showroomRevisionId: string; // FK -> showroom_revisions.id
  slotKey: string; // UNIQUE(showroom_revision_id, slot_key)
  productId: string; // FK -> products.id
  config: {
    scale?: number;
    rotation?: number;
    customLabel?: string;
  };
}

// ==========================================
// LEADS, CONVERSIONS & CRM
// ==========================================

export const LEAD_STATUSES = ["new", "contacted", "qualified", "archived"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface LeadContact {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
}

export interface Lead {
  id: string; // UUID PK
  organizationId: string; // FK -> organizations.id
  showroomId: string; // FK -> showrooms.id
  productId?: string; // FK -> products.id
  contact: LeadContact;
  consent: boolean;
  status: LeadStatus;
  createdAt: Date;
}

// ==========================================
// ANALYTICS & AUDIT LOGS
// ==========================================

export interface AnalyticsEventRecord {
  id: string; // UUID PK
  organizationId: string; // FK -> organizations.id
  showroomId: string; // FK -> showrooms.id
  publicationId?: string; // FK -> publications.id
  sessionTokenHash?: string;
  eventType: string;
  eventData: Record<string, unknown>;
  recordedAt: Date;
}

export interface AuditLog {
  id: string; // UUID PK
  organizationId?: string; // FK -> organizations.id
  actorId?: string; // FK -> users.id
  action: string;
  entity: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

// ==========================================
// SCHEMA TABLE METADATA REGISTRY
// ==========================================

export const SCHEMA_TABLE_NAMES = [
  "organizations",
  "users",
  "memberships",
  "showrooms",
  "showroom_revisions",
  "publications",
  "products",
  "product_variants",
  "assets",
  "placements",
  "leads",
  "analytics_events",
  "audit_logs",
] as const;

export type SchemaTableName = (typeof SCHEMA_TABLE_NAMES)[number];
