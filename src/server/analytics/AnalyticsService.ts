/**
 * RealmCanvas Consent-Aware Analytics Service
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 8.2, Section 8.4, Section 9.2, Section 9.5, Section 10)
 */

import crypto from "crypto";
import {
  ALLOWED_ANALYTICS_EVENT_TYPES,
  type AnalyticsEvent,
  type AnalyticsEventType,
  type AnalyticsFilter,
  type AnalyticsSummary,
  type RawAnalyticsEventInput,
} from "./AnalyticsSchema";
import type { IAnalyticsRepository } from "./AnalyticsRepository";
import type { TenantService } from "../tenancy/TenantService";

/**
 * Strict allowed property keys per event type.
 * Unbounded custom properties outside this map are stripped.
 */
export const EVENT_ALLOWED_KEYS: Record<AnalyticsEventType, readonly string[]> = {
  landing_viewed: ["referrerDomain", "hasWebGL", "appVersion"],
  experience_entered: ["entryMode", "appVersion"],
  scene_ready: ["loadDurationMs", "renderTier", "appVersion"],
  zone_visited: ["zoneKey", "fromZoneKey", "appVersion"],
  product_inspected: ["productId", "slotKey", "appVersion"],
  variant_selected: ["productId", "variantId", "appVersion"],
  cta_clicked: ["productId", "ctaUrl", "ctaLabel", "appVersion"],
  lead_form_opened: ["productId", "appVersion"],
  lead_submitted: ["productId", "appVersion"],
  fallback_entered: ["reason", "appVersion"],
  graphics_error: ["errorCode", "errorMessage", "appVersion"],
};

/**
 * Prohibited PII property identifiers per Section 9.5 and Section 10.
 * Any event containing these keys is strictly rejected.
 */
const FORBIDDEN_PII_PATTERNS = [
  /^email$/i,
  /^name$/i,
  /^full_?name$/i,
  /^first_?name$/i,
  /^last_?name$/i,
  /^phone$/i,
  /^mobile$/i,
  /^address$/i,
  /^ssn$/i,
  /^password$/i,
  /^pass$/i,
  /^credit_?card$/i,
  /^ip$/i,
  /^ip_?address$/i,
  /^user_?id$/i,
  /^search$/i,
  /^query$/i,
];

export interface IngestResult {
  accepted: number;
  rejected: number;
  errors: string[];
}

export class AnalyticsService {
  constructor(
    private repo: IAnalyticsRepository,
    private tenantService: TenantService
  ) {}

  /**
   * Hashes a raw session token to ensure PII / device identity cannot be traced (Section 8.2).
   */
  public static hashSessionToken(sessionToken: string): string {
    return crypto.createHash("sha256").update(sessionToken.trim()).digest("hex");
  }

  /**
   * High-volume batch ingestion interface with non-blocking error containment (Section 8.4).
   * Validates allowlist, rejects PII, strips unbounded attributes, and records valid events.
   * Failed events never disrupt valid events or crash calling caller flow.
   */
  public async ingestEvents(
    organizationId: string,
    inputs: RawAnalyticsEventInput[]
  ): Promise<IngestResult> {
    if (!organizationId || typeof organizationId !== "string") {
      return {
        accepted: 0,
        rejected: inputs.length,
        errors: ["Missing or invalid organizationId"],
      };
    }

    const validBatch: AnalyticsEvent[] = [];
    const errors: string[] = [];

    for (let i = 0; i < inputs.length; i++) {
      const raw = inputs[i];

      // 1. Validate Showroom ID
      if (!raw.showroomId || typeof raw.showroomId !== "string") {
        errors.push(`Item [${i}]: Missing required showroomId.`);
        continue;
      }

      // 2. Validate Allowlisted Event Type
      if (!ALLOWED_ANALYTICS_EVENT_TYPES.includes(raw.eventType as AnalyticsEventType)) {
        errors.push(`Item [${i}]: Event type "${raw.eventType}" is not in the allowed analytics event list.`);
        continue;
      }
      const eventType = raw.eventType as AnalyticsEventType;

      // 3. PII & Bounded Payload Check
      const rawData = raw.eventData || {};
      let hasForbiddenPii = false;
      let forbiddenKey = "";

      for (const key of Object.keys(rawData)) {
        if (FORBIDDEN_PII_PATTERNS.some((pattern) => pattern.test(key))) {
          hasForbiddenPii = true;
          forbiddenKey = key;
          break;
        }
      }

      if (hasForbiddenPii) {
        errors.push(`Item [${i}]: Prohibited PII or unbounded field "${forbiddenKey}" detected in payload.`);
        continue;
      }

      // 4. Strip Unallowed Properties
      const allowedKeys = EVENT_ALLOWED_KEYS[eventType];
      const sanitizedData: Record<string, string | number | boolean | undefined> = {};

      for (const key of allowedKeys) {
        if (key in rawData) {
          const val = rawData[key];
          if (
            typeof val === "string" ||
            typeof val === "number" ||
            typeof val === "boolean"
          ) {
            sanitizedData[key] = val;
          }
        }
      }

      // 5. Hash Session Token
      let sessionTokenHash: string | undefined;
      if (raw.sessionToken) {
        sessionTokenHash = AnalyticsService.hashSessionToken(raw.sessionToken);
      } else if (raw.sessionTokenHash) {
        // Verify hex format
        const cleanHash = raw.sessionTokenHash.toLowerCase().trim();
        if (/^[a-f0-9]{64}$/.test(cleanHash)) {
          sessionTokenHash = cleanHash;
        }
      }

      // 6. Resolve Timestamp
      let recordedAt: Date;
      if (raw.recordedAt) {
        recordedAt = raw.recordedAt instanceof Date ? raw.recordedAt : new Date(raw.recordedAt);
        if (isNaN(recordedAt.getTime())) {
          recordedAt = new Date();
        }
      } else {
        recordedAt = new Date();
      }

      validBatch.push({
        id: crypto.randomUUID(),
        organizationId,
        showroomId: raw.showroomId,
        publicationId: raw.publicationId,
        sessionTokenHash,
        eventType,
        eventData: sanitizedData,
        recordedAt,
      });
    }

    if (validBatch.length > 0) {
      await this.repo.recordBatch(validBatch);
    }

    return {
      accepted: validBatch.length,
      rejected: inputs.length - validBatch.length,
      errors,
    };
  }

  /**
   * Queries aggregated analytics metrics for an organization.
   * Requires "analyst", "editor", or "owner" role within the tenant organization.
   */
  public async getAnalyticsSummary(
    actorUserId: string,
    organizationId: string,
    filter?: AnalyticsFilter
  ): Promise<AnalyticsSummary> {
    // Server-side tenant membership & role guard
    await this.tenantService.assertTenantAccess(actorUserId, organizationId, "analyst");

    // Fetch tenant-scoped summary
    return this.repo.getSummary(organizationId, filter);
  }
}
