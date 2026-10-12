/**
 * RealmCanvas Typed Interaction Registry & Event Dispatcher
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 3.2 FR-005, Section 6.3 ADR-003, Section 7.4)
 */

export const WHITELISTED_INTERACTIONS = [
  "inspect_product",
  "focus_location",
  "play_feature_demo",
  "open_cta",
] as const;

export type InteractionType = (typeof WHITELISTED_INTERACTIONS)[number];

export const VALID_SLOT_KEYS = [
  "featured-hero",
  "gallery-01",
  "gallery-02",
  "gallery-03",
  "gallery-04",
  "lab-hero",
] as const;

export type SlotKey = (typeof VALID_SLOT_KEYS)[number];

export interface InteractionPayload {
  interaction: InteractionType;
  slotKey: SlotKey;
  productId?: string;
  targetPosition?: [number, number, number];
  ctaUrl?: string;
  metadata?: Record<string, string | number | boolean>;
}

export type InteractionHandler = (payload: InteractionPayload) => void;

/**
 * Runtime type guard enforcing ADR-003: Safe whitelisted interactions only.
 */
export function isWhitelistedInteraction(type: unknown): type is InteractionType {
  return (
    typeof type === "string" &&
    (WHITELISTED_INTERACTIONS as readonly string[]).includes(type)
  );
}

/**
 * Runtime validator for SlotKey.
 */
export function isValidSlotKey(slot: unknown): slot is SlotKey {
  return (
    typeof slot === "string" &&
    (VALID_SLOT_KEYS as readonly string[]).includes(slot)
  );
}

/**
 * Central event dispatcher decoupling 3D scene raycast interactions
 * from external HTML state, overlays, and telemetry systems.
 */
export class InteractionDispatcher {
  private listeners: Map<InteractionType, Set<InteractionHandler>> = new Map();

  constructor() {
    for (const type of WHITELISTED_INTERACTIONS) {
      this.listeners.set(type, new Set());
    }
  }

  /**
   * Subscribes a handler to a specific whitelisted interaction type.
   * Returns an unsubscription callback.
   */
  public subscribe(type: InteractionType, handler: InteractionHandler): () => void {
    if (!isWhitelistedInteraction(type)) {
      console.warn(`[InteractionDispatcher] Refusing subscription to unwhitelisted type: "${String(type)}"`);
      return () => {};
    }

    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.add(handler);
    }

    return () => {
      const currentHandlers = this.listeners.get(type);
      if (currentHandlers) {
        currentHandlers.delete(handler);
      }
    };
  }

  /**
   * Dispatches an interaction payload to all registered listeners.
   * Validates interaction type against whitelist before execution.
   */
  public dispatch(payload: InteractionPayload): boolean {
    if (!payload || !isWhitelistedInteraction(payload.interaction)) {
      console.error(
        `[InteractionDispatcher] Rejected dispatch: interaction "${payload?.interaction}" is not whitelisted.`
      );
      return false;
    }

    if (!isValidSlotKey(payload.slotKey)) {
      console.error(
        `[InteractionDispatcher] Rejected dispatch: slotKey "${payload?.slotKey}" is not a valid template slot.`
      );
      return false;
    }

    const handlers = this.listeners.get(payload.interaction);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(payload);
        } catch (err) {
          console.error(
            `[InteractionDispatcher] Error in listener for "${payload.interaction}":`,
            err
          );
        }
      }
    }

    return true;
  }

  /**
   * Removes all registered listeners (useful during test resets or full teardown).
   */
  public clear(): void {
    for (const handlers of this.listeners.values()) {
      handlers.clear();
    }
  }
}

/**
 * Global singleton dispatcher instance for RealmCanvas Experience engine
 */
export const interactionDispatcher = new InteractionDispatcher();
