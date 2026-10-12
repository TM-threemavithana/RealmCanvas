/**
 * RealmCanvas Fixed Placement Editor & Slot Validation
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 3.4, Section 7.4, Section 8.2, Section 10.1)
 */

import {
  VALID_SLOT_KEYS,
  isValidSlotKey,
  WHITELISTED_INTERACTIONS,
  isWhitelistedInteraction,
  type SlotKey,
  type InteractionType,
} from "@/experience/interactions/InteractionRegistry";
import type { TenantService } from "../tenancy/TenantService";
import type { CatalogService } from "../catalog/CatalogService";
import type { PublishingService } from "./PublishingService";
import type {
  ShowroomRevision,
  DraftPlacementConfig,
  PublicSceneManifest,
} from "./ShowroomSchema";

export const MIN_PLACEMENT_SCALE = 0.5;
export const MAX_PLACEMENT_SCALE = 2.0;

export class InvalidSlotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSlotError";
  }
}

export class InvalidPlacementScaleError extends Error {
  constructor(message = `Placement scale must be between ${MIN_PLACEMENT_SCALE}x and ${MAX_PLACEMENT_SCALE}x.`) {
    super(message);
    this.name = "InvalidPlacementScaleError";
  }
}

export interface SlotDescriptor {
  slotKey: SlotKey;
  label: string;
  zone: string;
  description: string;
  defaultInteraction: InteractionType;
}

export const TEMPLATE_SLOT_REGISTRY: readonly SlotDescriptor[] = [
  {
    slotKey: "featured-hero",
    label: "Hero Arrival Pedestal",
    zone: "Zone 01: Arrival Portal",
    description: "Central monolithic pedestal highlighted under the arrival arch.",
    defaultInteraction: "inspect_product",
  },
  {
    slotKey: "gallery-01",
    label: "Gallery North Pedestal",
    zone: "Zone 02: Acoustic Gallery",
    description: "Curved promenade entry display showcasing primary flagship model.",
    defaultInteraction: "inspect_product",
  },
  {
    slotKey: "gallery-02",
    label: "Gallery Central East",
    zone: "Zone 02: Acoustic Gallery",
    description: "Promenade showcase display overlooking the celestial terrace.",
    defaultInteraction: "inspect_product",
  },
  {
    slotKey: "gallery-03",
    label: "Gallery Central West",
    zone: "Zone 02: Acoustic Gallery",
    description: "Panoramic curved balcony pedestal slot.",
    defaultInteraction: "inspect_product",
  },
  {
    slotKey: "gallery-04",
    label: "Gallery South Pedestal",
    zone: "Zone 02: Acoustic Gallery",
    description: "Promenade exit display leading to the architecture lab.",
    defaultInteraction: "inspect_product",
  },
  {
    slotKey: "lab-hero",
    label: "Architecture Lab Telemetry Rig",
    zone: "Zone 03: Architecture Lab",
    description: "Floating acoustic test rig for engineering specs and exploded components.",
    defaultInteraction: "inspect_product",
  },
] as const;

export interface AssignPlacementInput {
  slotKey: string;
  productId: string;
  interaction?: string;
  displayOptions?: {
    defaultVariantId?: string;
    scale?: number;
    label?: string;
  };
}

export class PlacementEditor {
  constructor(
    private publishingService: PublishingService,
    private tenantService: TenantService,
    private catalogService: CatalogService
  ) {}

  /**
   * Returns all approved template slots available for assignment.
   */
  public getAvailableSlots(): readonly SlotDescriptor[] {
    return TEMPLATE_SLOT_REGISTRY;
  }

  /**
   * Assigns or updates a product in a fixed template slot.
   * Enforces server-side slot whitelisting, interaction whitelisting, and scale clamping (Section 7.4).
   * Enforces UNIQUE(slot_key) within the revision by replacing any prior placement on the slot.
   */
  public async assignSlotPlacement(
    actorUserId: string,
    organizationId: string,
    showroomId: string,
    expectedRevisionNumber: number,
    input: AssignPlacementInput
  ): Promise<ShowroomRevision> {
    await this.tenantService.assertTenantAccess(actorUserId, organizationId, "editor");

    // Validate Slot Key
    if (!isValidSlotKey(input.slotKey)) {
      throw new InvalidSlotError(
        `Slot "${input.slotKey}" is not a valid template slot. Approved slots: ${VALID_SLOT_KEYS.join(", ")}`
      );
    }

    // Validate Interaction Type
    const interaction: InteractionType = (input.interaction as InteractionType) || "inspect_product";
    if (!isWhitelistedInteraction(interaction)) {
      throw new InvalidSlotError(
        `Interaction "${input.interaction}" is not whitelisted. Approved interactions: ${WHITELISTED_INTERACTIONS.join(", ")}`
      );
    }

    // Validate and clamp Scale (Section 7.4 server-side constraint)
    const scale = input.displayOptions?.scale ?? 1.0;
    if (scale < MIN_PLACEMENT_SCALE || scale > MAX_PLACEMENT_SCALE) {
      throw new InvalidPlacementScaleError(
        `Placement scale ${scale}x is invalid. Scale must be within [${MIN_PLACEMENT_SCALE}, ${MAX_PLACEMENT_SCALE}].`
      );
    }

    // Verify Product exists in caller's organization
    const product = await this.catalogService.getProduct(
      actorUserId,
      organizationId,
      input.productId
    );

    // Fetch latest revision to update draft configuration
    const latestRevision = await this.publishingService.getLatestDraftRevision(
      actorUserId,
      organizationId,
      showroomId
    );

    const existingPlacements = latestRevision.draftConfig.placements;
    // Remove any existing placement for this slot to ensure UNIQUE(slot_key)
    const filteredPlacements = existingPlacements.filter((p) => p.slotKey !== input.slotKey);

    const newPlacement: DraftPlacementConfig = {
      slotKey: input.slotKey,
      productId: product.product.id,
      interaction,
      displayOptions: {
        defaultVariantId: input.displayOptions?.defaultVariantId,
        scale,
        label: input.displayOptions?.label ?? product.product.name,
      },
    };

    const updatedPlacements = [...filteredPlacements, newPlacement];

    return this.publishingService.updateDraft(
      actorUserId,
      organizationId,
      showroomId,
      expectedRevisionNumber,
      {
        ...latestRevision.draftConfig,
        placements: updatedPlacements,
      }
    );
  }

  /**
   * Clears a placement slot from the draft configuration.
   */
  public async clearSlotPlacement(
    actorUserId: string,
    organizationId: string,
    showroomId: string,
    expectedRevisionNumber: number,
    slotKey: string
  ): Promise<ShowroomRevision> {
    await this.tenantService.assertTenantAccess(actorUserId, organizationId, "editor");

    if (!isValidSlotKey(slotKey)) {
      throw new InvalidSlotError(`Slot "${slotKey}" is not a valid template slot.`);
    }

    const latestRevision = await this.publishingService.getLatestDraftRevision(
      actorUserId,
      organizationId,
      showroomId
    );

    const updatedPlacements = latestRevision.draftConfig.placements.filter(
      (p) => p.slotKey !== slotKey
    );

    return this.publishingService.updateDraft(
      actorUserId,
      organizationId,
      showroomId,
      expectedRevisionNumber,
      {
        ...latestRevision.draftConfig,
        placements: updatedPlacements,
      }
    );
  }

  /**
   * Compiles an immediate draft preview projection without publishing.
   * Allows business editors to preview their draft changes before committing to an active publication.
   */
  public async getDraftPreviewManifest(
    actorUserId: string,
    organizationId: string,
    showroomId: string
  ): Promise<PublicSceneManifest> {
    const latestRevision = await this.publishingService.getLatestDraftRevision(
      actorUserId,
      organizationId,
      showroomId
    );

    const draftConfig = latestRevision.draftConfig;
    const products = [];

    for (const p of draftConfig.placements) {
      const publicProduct = await this.catalogService.generatePublicPreview(
        actorUserId,
        organizationId,
        p.productId
      );
      products.push(publicProduct);
    }

    return {
      schemaVersion: 1,
      publicationId: `preview_rev_${latestRevision.revisionNumber}`,
      templateId: draftConfig.templateId,
      branding: draftConfig.branding,
      placements: draftConfig.placements.map((p) => ({
        slotKey: p.slotKey,
        productId: p.productId,
        interaction: p.interaction,
        displayOptions: {
          defaultVariantId: p.displayOptions?.defaultVariantId,
          scale: p.displayOptions?.scale ?? 1.0,
          label: p.displayOptions?.label,
        },
      })),
      products,
    };
  }
}
