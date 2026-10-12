/**
 * GET /api/v1/public/showrooms/[orgSlug]/[showroomSlug]
 * Public endpoint delivering the immutable published scene manifest.
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 9.2, Section 9.3)
 */

import { NextRequest } from "next/server";
import { services } from "@/server/services";
import { createErrorResponse, createSuccessResponse } from "@/server/api/ApiResponse";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ orgSlug: string; showroomSlug: string }> }
) {
  const { orgSlug, showroomSlug } = await context.params;

  if (!orgSlug || !showroomSlug) {
    return createErrorResponse(400, "VALIDATION_ERROR", "Missing required route parameters.");
  }

  // 1. Resolve Organization
  const organization = await services.tenantRepo.findOrganizationBySlug(orgSlug);
  if (!organization) {
    return createErrorResponse(
      404,
      "NOT_FOUND",
      `Organization "${orgSlug}" not found.`
    );
  }

  // 2. Resolve Showroom
  const showroom = await services.showroomRepo.findShowroomBySlug(
    organization.id,
    showroomSlug
  );
  if (!showroom) {
    return createErrorResponse(
      404,
      "NOT_FOUND",
      `Showroom "${showroomSlug}" not found in organization "${orgSlug}".`
    );
  }

  // 3. Resolve Active Publication Snapshot (Section 8.2 & Section 9.2)
  if (!showroom.activePublicationId) {
    return createErrorResponse(
      404,
      "SHOWROOM_NOT_PUBLISHED",
      `Showroom "${showroomSlug}" does not currently have an active publication snapshot.`
    );
  }

  const publication = await services.showroomRepo.findPublicationById(
    showroom.activePublicationId
  );
  if (!publication) {
    return createErrorResponse(
      500,
      "PUBLICATION_CORRUPTED",
      "Active publication pointer could not be resolved."
    );
  }

  return createSuccessResponse(publication.manifest, 200, {
    "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
  });
}
