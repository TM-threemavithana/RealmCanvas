/**
 * POST /api/v1/public/events
 * Public, privacy-limited analytics event ingestion endpoint.
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 8.4, Section 9.2, Section 9.5)
 */

import { NextRequest } from "next/server";
import { services } from "@/server/services";
import { createErrorResponse, createSuccessResponse } from "@/server/api/ApiResponse";
import type { RawAnalyticsEventInput } from "@/server/analytics/AnalyticsSchema";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createErrorResponse(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  if (!body || typeof body !== "object") {
    return createErrorResponse(400, "INVALID_PAYLOAD", "Request body must be a JSON object.");
  }

  const payload = body as Record<string, unknown>;

  if (!payload.organizationId || typeof payload.organizationId !== "string") {
    return createErrorResponse(400, "VALIDATION_ERROR", "Field 'organizationId' is required.");
  }

  if (!Array.isArray(payload.events)) {
    return createErrorResponse(400, "VALIDATION_ERROR", "Field 'events' must be an array.");
  }

  const events = payload.events as RawAnalyticsEventInput[];

  // Non-blocking batch ingestion per Section 8.4
  const result = await services.analyticsService.ingestEvents(payload.organizationId, events);

  return createSuccessResponse(result, 202);
}
