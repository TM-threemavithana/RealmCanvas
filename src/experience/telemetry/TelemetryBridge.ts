/**
 * RealmCanvas In-Scene Telemetry Bridge
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 7.5, Section 8.4, Section 9.5)
 */

import {
  ALLOWED_ANALYTICS_EVENT_TYPES,
  type AnalyticsEventType,
  type RawAnalyticsEventInput,
} from "@/server/analytics/AnalyticsSchema";

export interface TelemetryConfig {
  organizationId: string;
  showroomId: string;
  publicationId?: string;
  flushIntervalMs?: number;
  maxBatchSize?: number;
  endpointUrl?: string;
}

export class TelemetryBridge {
  private organizationId: string;
  private showroomId: string;
  private publicationId?: string;
  private endpointUrl: string;
  private flushIntervalMs: number;
  private maxBatchSize: number;

  private buffer: RawAnalyticsEventInput[] = [];
  private sessionToken: string;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(config: TelemetryConfig) {
    this.organizationId = config.organizationId;
    this.showroomId = config.showroomId;
    this.publicationId = config.publicationId;
    this.endpointUrl = config.endpointUrl || "/api/v1/public/events";
    this.flushIntervalMs = config.flushIntervalMs || 5000;
    this.maxBatchSize = config.maxBatchSize || 10;

    this.sessionToken = this.resolveSessionToken();
    this.startPeriodicFlush();
  }

  /**
   * Generates or retrieves an anonymous session token for visitor correlation.
   * Stored in sessionStorage; never linked to user PII.
   */
  private resolveSessionToken(): string {
    if (typeof window === "undefined" || !window.sessionStorage) {
      return `rc_anon_${crypto.randomUUID().slice(0, 16)}`;
    }

    try {
      let token = window.sessionStorage.getItem("rc_session_token");
      if (!token) {
        token = `rc_sess_${crypto.randomUUID().slice(0, 24)}`;
        window.sessionStorage.setItem("rc_session_token", token);
      }
      return token;
    } catch {
      return `rc_anon_${crypto.randomUUID().slice(0, 16)}`;
    }
  }

  /**
   * Emits an allowlisted analytics event to the client buffer.
   * Completely rejects unallowlisted event types and ignores null calls.
   */
  public emit(
    eventType: AnalyticsEventType,
    eventData: Record<string, string | number | boolean | undefined> = {}
  ): void {
    if (!ALLOWED_ANALYTICS_EVENT_TYPES.includes(eventType)) {
      return;
    }

    this.buffer.push({
      showroomId: this.showroomId,
      publicationId: this.publicationId,
      sessionToken: this.sessionToken,
      eventType,
      eventData,
      recordedAt: Date.now(),
    });

    if (this.buffer.length >= this.maxBatchSize) {
      void this.flush();
    }
  }

  /**
   * Flushes queued events to the public ingestion endpoint.
   * Network errors are absorbed gracefully per Section 8.4 (non-blocking).
   */
  public async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const batchToSend = [...this.buffer];
    this.buffer = [];

    try {
      if (typeof fetch !== "undefined") {
        await fetch(this.endpointUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId: this.organizationId,
            events: batchToSend,
          }),
          keepalive: true,
        });
      }
    } catch {
      // Re-queue events if network error occurs, up to max batch size limit
      if (this.buffer.length < this.maxBatchSize * 2) {
        this.buffer = [...batchToSend, ...this.buffer];
      }
    }
  }

  /**
   * Returns current count of queued events (useful for unit testing).
   */
  public getQueueLength(): number {
    return this.buffer.length;
  }

  /**
   * Starts periodic background flushing.
   */
  private startPeriodicFlush(): void {
    if (typeof window === "undefined") return;

    this.timer = setInterval(() => {
      void this.flush();
    }, this.flushIntervalMs);

    window.addEventListener("beforeunload", () => {
      void this.flush();
    });
  }

  /**
   * Disposes timer upon unmount.
   */
  public destroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    void this.flush();
  }
}
