/**
 * RealmCanvas Analytics Repository Interface & In-Memory Implementation
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 8.2, Section 8.4, Section 9.2)
 */

import {
  ALLOWED_ANALYTICS_EVENT_TYPES,
  type AnalyticsEvent,
  type AnalyticsEventType,
  type AnalyticsFilter,
  type AnalyticsSummary,
} from "./AnalyticsSchema";

export interface IAnalyticsRepository {
  recordBatch(events: AnalyticsEvent[]): Promise<number>;
  queryEvents(organizationId: string, filter?: AnalyticsFilter): Promise<AnalyticsEvent[]>;
  getSummary(organizationId: string, filter?: AnalyticsFilter): Promise<AnalyticsSummary>;
  clear(): Promise<void>;
}

export class InMemoryAnalyticsRepository implements IAnalyticsRepository {
  private events: AnalyticsEvent[] = [];

  public async recordBatch(events: AnalyticsEvent[]): Promise<number> {
    for (const event of events) {
      this.events.push(event);
    }
    return events.length;
  }

  public async queryEvents(organizationId: string, filter?: AnalyticsFilter): Promise<AnalyticsEvent[]> {
    return this.events.filter((ev) => {
      if (ev.organizationId !== organizationId) return false;
      if (filter?.showroomId && ev.showroomId !== filter.showroomId) return false;
      if (filter?.startDate && ev.recordedAt < filter.startDate) return false;
      if (filter?.endDate && ev.recordedAt > filter.endDate) return false;
      return true;
    });
  }

  public async getSummary(organizationId: string, filter?: AnalyticsFilter): Promise<AnalyticsSummary> {
    const matching = await this.queryEvents(organizationId, filter);

    // Initialize all allowlisted event type counts to 0
    const eventsByType: Record<AnalyticsEventType, number> = ALLOWED_ANALYTICS_EVENT_TYPES.reduce(
      (acc, type) => {
        acc[type] = 0;
        return acc;
      },
      {} as Record<AnalyticsEventType, number>
    );

    const sessionSet = new Set<string>();
    const productCounts = new Map<string, number>();
    const zoneCounts = new Map<string, number>();
    const variantCounts = new Map<string, number>();

    let ctaClicks = 0;
    let leadsSubmitted = 0;

    for (const ev of matching) {
      // Event type count
      if (ev.eventType in eventsByType) {
        eventsByType[ev.eventType] = (eventsByType[ev.eventType] || 0) + 1;
      }

      // Unique sessions
      if (ev.sessionTokenHash) {
        sessionSet.add(ev.sessionTokenHash);
      }

      // Specific event aggregations
      if (ev.eventType === "product_inspected" && typeof ev.eventData.productId === "string") {
        const pId = ev.eventData.productId;
        productCounts.set(pId, (productCounts.get(pId) || 0) + 1);
      } else if (ev.eventType === "zone_visited" && typeof ev.eventData.zoneKey === "string") {
        const zKey = ev.eventData.zoneKey;
        zoneCounts.set(zKey, (zoneCounts.get(zKey) || 0) + 1);
      } else if (ev.eventType === "variant_selected" && typeof ev.eventData.variantId === "string") {
        const vId = ev.eventData.variantId;
        variantCounts.set(vId, (variantCounts.get(vId) || 0) + 1);
      } else if (ev.eventType === "cta_clicked") {
        ctaClicks++;
      } else if (ev.eventType === "lead_submitted") {
        leadsSubmitted++;
      }
    }

    const topProducts = Array.from(productCounts.entries())
      .map(([productId, inspections]) => ({ productId, inspections }))
      .sort((a, b) => b.inspections - a.inspections);

    const topZones = Array.from(zoneCounts.entries())
      .map(([zoneKey, visits]) => ({ zoneKey, visits }))
      .sort((a, b) => b.visits - a.visits);

    const topVariants = Array.from(variantCounts.entries())
      .map(([variantId, selections]) => ({ variantId, selections }))
      .sort((a, b) => b.selections - a.selections);

    return {
      organizationId,
      showroomId: filter?.showroomId,
      timeRange: {
        startDate: filter?.startDate,
        endDate: filter?.endDate,
      },
      totalEvents: matching.length,
      uniqueSessions: sessionSet.size,
      eventsByType,
      topProducts,
      topZones,
      topVariants,
      ctaClicks,
      leadsSubmitted,
    };
  }

  public async clear(): Promise<void> {
    this.events = [];
  }
}
