/**
 * POST /api/v1/public/leads
 * Public, rate-limited lead submission endpoint.
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 9.2, Section 9.4)
 */

import { NextRequest } from "next/server";
import { services } from "@/server/services";
import {
  ConsentRequiredError,
  InvalidLeadEmailError,
  DuplicateInquiryError,
} from "@/server/leads/LeadService";
import { createErrorResponse, createSuccessResponse } from "@/server/api/ApiResponse";

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

  if (!payload.showroomId || typeof payload.showroomId !== "string") {
    return createErrorResponse(400, "VALIDATION_ERROR", "Field 'showroomId' is required.");
  }

  if (!payload.contact || typeof payload.contact !== "object") {
    return createErrorResponse(400, "VALIDATION_ERROR", "Field 'contact' is required.");
  }

  const contact = payload.contact as Record<string, unknown>;
  if (!contact.name || typeof contact.name !== "string") {
    return createErrorResponse(400, "VALIDATION_ERROR", "Field 'contact.name' is required.");
  }

  if (!contact.email || typeof contact.email !== "string") {
    return createErrorResponse(400, "VALIDATION_ERROR", "Field 'contact.email' is required.");
  }

  try {
    const confirmation = await services.leadService.submitInquiry({
      organizationId: payload.organizationId,
      showroomId: payload.showroomId,
      productId: typeof payload.productId === "string" ? payload.productId : undefined,
      contact: {
        name: contact.name,
        email: contact.email,
        phone: typeof contact.phone === "string" ? contact.phone : undefined,
        notes: typeof contact.notes === "string" ? contact.notes : undefined,
      },
      consent: payload.consent === true,
    });

    return createSuccessResponse(confirmation, 201);
  } catch (err) {
    if (err instanceof ConsentRequiredError) {
      return createErrorResponse(
        400,
        "CONSENT_REQUIRED",
        "Explicit opt-in consent is required to submit an inquiry."
      );
    }
    if (err instanceof InvalidLeadEmailError) {
      return createErrorResponse(400, "INVALID_EMAIL", err.message);
    }
    if (err instanceof DuplicateInquiryError) {
      return createErrorResponse(
        409,
        "DUPLICATE_INQUIRY",
        "A duplicate inquiry for this item was already submitted recently. Please wait before retrying."
      );
    }

    const message = err instanceof Error ? err.message : "Internal Server Error";
    return createErrorResponse(500, "INTERNAL_ERROR", message);
  }
}
