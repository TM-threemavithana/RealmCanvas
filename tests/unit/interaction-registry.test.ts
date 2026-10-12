import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  WHITELISTED_INTERACTIONS,
  VALID_SLOT_KEYS,
  isWhitelistedInteraction,
  isValidSlotKey,
  InteractionDispatcher,
  type InteractionPayload,
} from "@/experience/interactions/InteractionRegistry";

describe("Typed Interaction Registry & Event Dispatcher (RC-005)", () => {
  let dispatcher: InteractionDispatcher;

  beforeEach(() => {
    dispatcher = new InteractionDispatcher();
  });

  describe("Whitelist Validation (ADR-003)", () => {
    it("recognizes all 4 whitelisted interaction types", () => {
      expect(WHITELISTED_INTERACTIONS).toEqual([
        "inspect_product",
        "focus_location",
        "play_feature_demo",
        "open_cta",
      ]);

      for (const type of WHITELISTED_INTERACTIONS) {
        expect(isWhitelistedInteraction(type)).toBe(true);
      }
    });

    it("rejects arbitrary or unsafe interaction strings", () => {
      expect(isWhitelistedInteraction("eval_script")).toBe(false);
      expect(isWhitelistedInteraction("navigate_unsafe")).toBe(false);
      expect(isWhitelistedInteraction("")).toBe(false);
      expect(isWhitelistedInteraction(null)).toBe(false);
      expect(isWhitelistedInteraction(undefined)).toBe(false);
      expect(isWhitelistedInteraction(123)).toBe(false);
    });

    it("validates allowed template slot keys", () => {
      expect(isValidSlotKey("featured-hero")).toBe(true);
      expect(isValidSlotKey("gallery-01")).toBe(true);
      expect(isValidSlotKey("arbitrary-slot")).toBe(false);
      expect(isValidSlotKey("unknown")).toBe(false);
    });
  });

  describe("Event Subscription and Dispatch", () => {
    it("delivers valid payload to registered listener", () => {
      const listener = vi.fn();
      const unsubscribe = dispatcher.subscribe("inspect_product", listener);

      const payload: InteractionPayload = {
        interaction: "inspect_product",
        slotKey: "featured-hero",
        productId: "prod_01_aurora",
      };

      const result = dispatcher.dispatch(payload);
      expect(result).toBe(true);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(payload);

      unsubscribe();
    });

    it("stops delivering events after unsubscribe is called", () => {
      const listener = vi.fn();
      const unsubscribe = dispatcher.subscribe("inspect_product", listener);

      dispatcher.dispatch({
        interaction: "inspect_product",
        slotKey: "featured-hero",
      });
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();

      dispatcher.dispatch({
        interaction: "inspect_product",
        slotKey: "featured-hero",
      });
      expect(listener).toHaveBeenCalledTimes(1); // not called again
    });

    it("rejects dispatch of unwhitelisted interaction type without invoking listeners", () => {
      const listener = vi.fn();
      // Force test invalid dispatch
      const result = dispatcher.dispatch({
        interaction: "unwhitelisted_type" as unknown as "inspect_product",
        slotKey: "featured-hero",
      });

      expect(result).toBe(false);
      expect(listener).not.toHaveBeenCalled();
    });

    it("rejects dispatch with invalid slot key", () => {
      const listener = vi.fn();
      dispatcher.subscribe("inspect_product", listener);

      const result = dispatcher.dispatch({
        interaction: "inspect_product",
        slotKey: "invalid-slot-key" as unknown as "featured-hero",
      });

      expect(result).toBe(false);
      expect(listener).not.toHaveBeenCalled();
    });

    it("safely isolates handler exceptions from other listeners", () => {
      const failingListener = vi.fn(() => {
        throw new Error("Simulated listener failure");
      });
      const succeedingListener = vi.fn();

      dispatcher.subscribe("focus_location", failingListener);
      dispatcher.subscribe("focus_location", succeedingListener);

      const result = dispatcher.dispatch({
        interaction: "focus_location",
        slotKey: "gallery-01",
      });

      expect(result).toBe(true);
      expect(failingListener).toHaveBeenCalledTimes(1);
      expect(succeedingListener).toHaveBeenCalledTimes(1);
    });
  });
});
