/**
 * RealmCanvas Showrooms, Revisions, Publications & Manifest Schema
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 3.4, Section 7.4, Section 8.2, Section 8.4)
 */

import type { PublicProduct } from "../catalog/CatalogSchema";
import type { SlotKey, InteractionType } from "@/experience/interactions/InteractionRegistry";

export interface DraftPlacementConfig {
  slotKey: SlotKey;
  productId: string;
  interaction: InteractionType;
  displayOptions?: {
    defaultVariantId?: string;
    scale?: number;
    label?: string;
  };
}

export interface ShowroomDraftConfig {
  templateId: "celestial-tech-pavilion-v1";
  branding: {
    displayName: string;
    accentColor: string;
    logoUrl?: string;
  };
  placements: DraftPlacementConfig[];
}

export interface Showroom {
  id: string; // UUID PK
  organizationId: string; // FK -> organizations.id
  slug: string; // UNIQUE(organization_id, slug)
  title: string;
  templateId: "celestial-tech-pavilion-v1";
  activePublicationId?: string; // FK -> publications.id
  createdAt: Date;
  updatedAt: Date;
}

export interface ShowroomRevision {
  id: string; // UUID PK
  showroomId: string; // FK -> showrooms.id
  revisionNumber: number; // 1, 2, 3...
  draftConfig: ShowroomDraftConfig;
  editedBy: string; // FK -> users.id
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicPlacement {
  slotKey: SlotKey;
  productId: string;
  interaction: InteractionType;
  displayOptions: {
    defaultVariantId?: string;
    scale?: number;
    label?: string;
  };
}

/**
 * Immutable Public Scene Manifest
 * Validated snapshot rendered by the client-side 3D viewer.
 * Complies with Section 7.4 & ADR-002.
 */
export interface PublicSceneManifest {
  schemaVersion: 1;
  publicationId: string;
  templateId: "celestial-tech-pavilion-v1";
  branding: {
    displayName: string;
    accentColor: string;
    logoUrl?: string;
  };
  placements: PublicPlacement[];
  products: PublicProduct[];
}

export interface Publication {
  id: string; // UUID PK
  showroomId: string; // FK -> showrooms.id
  revisionId: string; // FK -> showroom_revisions.id
  manifest: PublicSceneManifest;
  publishedBy: string; // FK -> users.id
  publishedAt: Date;
}
