/**
 * RealmCanvas Privacy-First Analytics Schema & Event Allowlist
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 8.2, Section 8.4, Section 9.2, Section 9.5, Section 10)
 */

export const ALLOWED_ANALYTICS_EVENT_TYPES = [
  "landing_viewed",
  "experience_entered",
  "scene_ready",
  "zone_visited",
  "product_inspected",
  "variant_selected",
  "cta_clicked",
  "lead_form_opened",
  "lead_submitted",
  "fallback_entered",
  "graphics_error",
] as const;

export type AnalyticsEventType = (typeof ALLOWED_ANALYTICS_EVENT_TYPES)[number];

/**
 * Bounded payload property definitions per allowlisted event type.
 * Enforces zero arbitrary bags, zero search queries, and zero raw PII.
 */
export interface EventDataMap {
  landing_viewed: {
    referrerDomain?: string;
    hasWebGL?: boolean;
    appVersion?: string;
  };
  experience_entered: {
    entryMode: "webgl" | "fallback";
    appVersion?: string;
  };
  scene_ready: {
    loadDurationMs?: number;
    renderTier?: "tier_a" | "tier_b" | "tier_c";
    appVersion?: string;
  };
  zone_visited: {
    zoneKey: string;
    fromZoneKey?: string;
    appVersion?: string;
  };
  product_inspected: {
    productId: string;
    slotKey?: string;
    appVersion?: string;
  };
  variant_selected: {
    productId: string;
    variantId: string;
    appVersion?: string;
  };
  cta_clicked: {
    productId?: string;
    ctaUrl: string;
    ctaLabel?: string;
    appVersion?: string;
  };
  lead_form_opened: {
    productId?: string;
    appVersion?: string;
  };
  lead_submitted: {
    productId?: string;
    appVersion?: string;
  };
  fallback_entered: {
    reason?: string;
    appVersion?: string;
  };
  graphics_error: {
    errorCode?: string;
    errorMessage?: string;
    appVersion?: string;
  };
}

export type AnyEventData = EventDataMap[AnalyticsEventType];

/**
 * Persisted analytics event model
 */
export interface AnalyticsEvent {
  id: string; // UUID PK
  organizationId: string; // FK -> organizations.id
  showroomId: string; // FK -> showrooms.id
  publicationId?: string; // FK -> publications.id (snapshot ID if published)
  sessionTokenHash?: string; // Cryptographic SHA-256 hash of visitor session
  eventType: AnalyticsEventType;
  eventData: Record<string, string | number | boolean | undefined>;
  recordedAt: Date;
}

/**
 * Raw incoming event from client ingest endpoint
 */
export interface RawAnalyticsEventInput {
  showroomId: string;
  publicationId?: string;
  sessionToken?: string; // Raw session token (will be hashed, NEVER persisted raw)
  sessionTokenHash?: string; // Or pre-hashed token
  eventType: string; // Validated against allowlist at runtime
  eventData?: Record<string, unknown>;
  recordedAt?: number | string | Date;
}

/**
 * Filter for querying analytics aggregations
 */
export interface AnalyticsFilter {
  showroomId?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Aggregated analytics reporting summary for authorized analysts/editors/owners
 */
export interface AnalyticsSummary {
  organizationId: string;
  showroomId?: string;
  timeRange: {
    startDate?: Date;
    endDate?: Date;
  };
  totalEvents: number;
  uniqueSessions: number;
  eventsByType: Record<AnalyticsEventType, number>;
  topProducts: Array<{ productId: string; inspections: number }>;
  topZones: Array<{ zoneKey: string; visits: number }>;
  topVariants: Array<{ variantId: string; selections: number }>;
  ctaClicks: number;
  leadsSubmitted: number;
}
