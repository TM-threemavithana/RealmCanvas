/**
 * GET /api/v1/admin/analytics/summary
 * Authenticated, role-gated analytics aggregation endpoint.
 * Requires Analyst+ role within the specified organization.
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 9.2, Section 8.3)
 */

import { NextRequest } from "next/server";
import { services } from "@/server/services";
import {
  TenantAccessDeniedError,
  InsufficientRoleError,
} from "@/server/tenancy/TenantService";
import { createErrorResponse, createSuccessResponse } from "@/server/api/ApiResponse";
import type { AnalyticsFilter } from "@/server/analytics/AnalyticsSchema";

export async function GET(request: NextRequest) {
  const actorUserId = request.headers.get("x-actor-user-id");
  if (!actorUserId) {
    return createErrorResponse(
      401,
      "UNAUTHENTICATED",
      "Missing required authentication identity header 'x-actor-user-id'."
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const organizationId = searchParams.get("organizationId");
  if (!organizationId) {
    return createErrorResponse(
      400,
      "VALIDATION_ERROR",
      "Query parameter 'organizationId' is required."
    );
  }

  const showroomId = searchParams.get("showroomId") || undefined;
  const startDateStr = searchParams.get("startDate");
  const endDateStr = searchParams.get("endDate");

  const filter: AnalyticsFilter = {
    showroomId,
    startDate: startDateStr ? new Date(startDateStr) : undefined,
    endDate: endDateStr ? new Date(endDateStr) : undefined,
  };

  try {
    const summary = await services.analyticsService.getAnalyticsSummary(
      actorUserId,
      organizationId,
      filter
    );

    return createSuccessResponse(summary, 200);
  } catch (err) {
    if (err instanceof TenantAccessDeniedError) {
      return createErrorResponse(403, "ACCESS_DENIED", err.message);
    }
    if (err instanceof InsufficientRoleError) {
      return createErrorResponse(403, "INSUFFICIENT_ROLE", err.message);
    }

    const message = err instanceof Error ? err.message : "Internal Server Error";
    return createErrorResponse(500, "INTERNAL_ERROR", message);
  }
}
