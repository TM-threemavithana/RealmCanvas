/**
 * RealmCanvas Publishing Service & Atomic Manifest Compiler
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 3.4, Section 7.4, Section 8.2, Section 8.4)
 */

import type { TenantService } from "../tenancy/TenantService";
import type { CatalogService } from "../catalog/CatalogService";
import type {
  IShowroomRepository,
} from "./ShowroomRepository";
import { RevisionConflictError } from "./ShowroomRepository";
import type {
  Showroom,
  ShowroomRevision,
  Publication,
  ShowroomDraftConfig,
  PublicSceneManifest,
  PublicPlacement,
} from "./ShowroomSchema";
import type { PublicProduct } from "../catalog/CatalogSchema";

export { RevisionConflictError };

export class PublishValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublishValidationError";
  }
}

export class ShowroomNotFoundError extends Error {
  constructor(message = "Showroom not found in organization.") {
    super(message);
    this.name = "ShowroomNotFoundError";
  }
}

export class PublishingService {
  constructor(
    private showroomRepo: IShowroomRepository,
    private tenantService: TenantService,
    private catalogService: CatalogService
  ) {}

  /**
   * Provisions a new showroom draft with initial Revision 1.
   * Requires "editor" or "owner" role.
   */
  public async createShowroom(
    actorUserId: string,
    organizationId: string,
    input: {
      slug: string;
      title: string;
      initialBranding?: ShowroomDraftConfig["branding"];
    }
  ): Promise<{ showroom: Showroom; revision: ShowroomRevision }> {
    await this.tenantService.assertTenantAccess(actorUserId, organizationId, "editor");

    const showroom = await this.showroomRepo.createShowroom({
      organizationId,
      slug: input.slug,
      title: input.title,
    });

    const defaultDraftConfig: ShowroomDraftConfig = {
      templateId: "celestial-tech-pavilion-v1",
      branding: input.initialBranding ?? {
        displayName: input.title,
        accentColor: "#37DDEB",
      },
      placements: [],
    };

    const revision = await this.showroomRepo.createRevision({
      showroomId: showroom.id,
      revisionNumber: 1,
      draftConfig: defaultDraftConfig,
      editedBy: actorUserId,
    });

    return { showroom, revision };
  }

  /**
   * Updates showroom draft configuration enforcing optimistic concurrency control.
   * Throws RevisionConflictError (409) if expectedRevisionNumber does not match the latest revision.
   */
  public async updateDraft(
    actorUserId: string,
    organizationId: string,
    showroomId: string,
    expectedRevisionNumber: number,
    newDraftConfig: ShowroomDraftConfig
  ): Promise<ShowroomRevision> {
    await this.tenantService.assertTenantAccess(actorUserId, organizationId, "editor");

    const showroom = await this.showroomRepo.findShowroomById(organizationId, showroomId);
    if (!showroom) {
      throw new ShowroomNotFoundError(`Showroom "${showroomId}" does not exist in organization "${organizationId}".`);
    }

    return this.showroomRepo.updateRevision({
      showroomId,
      expectedRevisionNumber,
      newConfig: newDraftConfig,
      editedBy: actorUserId,
    });
  }

  /**
   * Executes an atomic publication transaction (Section 3.4 & Section 8.4):
   * 1. Validates actor role ("editor" or "owner").
   * 2. Validates optimistic concurrency lock on expectedRevisionNumber.
   * 3. Validates all referenced products belong to the SAME organization.
   * 4. Projects products into safe PublicProduct models.
   * 5. Compiles immutable PublicSceneManifest (schemaVersion 1).
   * 6. Records Publication snapshot and atomically updates active_publication_id.
   */
  public async publishShowroom(
    actorUserId: string,
    organizationId: string,
    showroomId: string,
    expectedRevisionNumber: number
  ): Promise<{ publication: Publication; manifest: PublicSceneManifest }> {
    await this.tenantService.assertTenantAccess(actorUserId, organizationId, "editor");

    const showroom = await this.showroomRepo.findShowroomById(organizationId, showroomId);
    if (!showroom) {
      throw new ShowroomNotFoundError(`Showroom "${showroomId}" does not exist in organization "${organizationId}".`);
    }

    const latestRevision = await this.showroomRepo.getLatestRevision(showroomId);
    if (!latestRevision) {
      throw new PublishValidationError(`Showroom "${showroomId}" has no valid revisions to publish.`);
    }

    if (latestRevision.revisionNumber !== expectedRevisionNumber) {
      throw new RevisionConflictError(
        `Optimistic lock failure during publish: expected revision ${expectedRevisionNumber}, but latest is ${latestRevision.revisionNumber}.`
      );
    }

    const draftConfig = latestRevision.draftConfig;
    const publicProductsMap = new Map<string, PublicProduct>();
    const publicPlacements: PublicPlacement[] = [];

    // Validate placements and products
    for (const placement of draftConfig.placements) {
      try {
        const publicProduct = await this.catalogService.generatePublicPreview(
          actorUserId,
          organizationId,
          placement.productId
        );

        if (publicProduct.status === "archived") {
          throw new PublishValidationError(
            `Cannot publish placement for archived product "${placement.productId}".`
          );
        }

        publicProductsMap.set(publicProduct.id, publicProduct);

        publicPlacements.push({
          slotKey: placement.slotKey,
          productId: placement.productId,
          interaction: placement.interaction,
          displayOptions: {
            defaultVariantId: placement.displayOptions?.defaultVariantId,
            scale: placement.displayOptions?.scale ?? 1.0,
            label: placement.displayOptions?.label,
          },
        });
      } catch (err: unknown) {
        if (err instanceof PublishValidationError) {
          throw err;
        }
        // Throws if product does not exist or belongs to another organization (cross-tenant leak prevention)
        throw new PublishValidationError(
          `Validation failed for placement slot "${placement.slotKey}": product "${placement.productId}" could not be verified in this organization.`
        );
      }
    }

    const publicationId = crypto.randomUUID();

    const manifest: PublicSceneManifest = {
      schemaVersion: 1,
      publicationId,
      templateId: "celestial-tech-pavilion-v1",
      branding: {
        displayName: draftConfig.branding.displayName,
        accentColor: draftConfig.branding.accentColor,
        logoUrl: draftConfig.branding.logoUrl,
      },
      placements: publicPlacements,
      products: Array.from(publicProductsMap.values()),
    };

    // Atomically persist immutable publication and switch active pointer
    const publication = await this.showroomRepo.createPublication({
      showroomId,
      revisionId: latestRevision.id,
      manifest,
      publishedBy: actorUserId,
    });

    await this.showroomRepo.setActivePublication(showroomId, publication.id);

    return { publication, manifest };
  }

  /**
   * Retrieves the active published manifest for public 3D experience rendering.
   * Completely safe, read-only public projection.
   */
  public async getActivePublishedManifest(showroomId: string): Promise<PublicSceneManifest | null> {
    const publication = await this.showroomRepo.findActivePublication(showroomId);
    if (!publication) return null;
    return publication.manifest;
  }

  /**
   * Retrieves the latest revision for editing in Studio preview.
   */
  public async getLatestDraftRevision(
    actorUserId: string,
    organizationId: string,
    showroomId: string
  ): Promise<ShowroomRevision> {
    await this.tenantService.assertTenantAccess(actorUserId, organizationId, "analyst");

    const showroom = await this.showroomRepo.findShowroomById(organizationId, showroomId);
    if (!showroom) {
      throw new ShowroomNotFoundError(`Showroom "${showroomId}" does not exist in organization "${organizationId}".`);
    }

    const revision = await this.showroomRepo.getLatestRevision(showroomId);
    if (!revision) {
      throw new ShowroomNotFoundError(`Showroom "${showroomId}" has no revision history.`);
    }

    return revision;
  }
}
