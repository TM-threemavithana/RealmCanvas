import { describe, it, expect, vi } from "vitest";
import {
  NAVIGATION_DESTINATIONS,
  CAMERA_PRESETS,
  DEFAULT_DESTINATION_ID,
  getDestinationById,
  type NavigationDestination,
  type NavigationZoneId,
} from "@/experience/camera/NavigationDestinations";
import { interactionDispatcher } from "@/experience/interactions/InteractionRegistry";

describe("Camera Navigation & Canonical Pavilion Zones (RC-009)", () => {
  describe("Navigation Destination Registry (Section 4.2)", () => {
    it("defines all four canonical world zones in sequence", () => {
      const zoneIds = NAVIGATION_DESTINATIONS.map((d) => d.id);
      expect(zoneIds).toEqual([
        "zone_arrival",
        "zone_gallery",
        "zone_lab",
        "zone_lounge",
      ]);
    });

    it("assigns valid zone numbering and semantic labels", () => {
      expect(NAVIGATION_DESTINATIONS[0].zoneNumber).toBe("01");
      expect(NAVIGATION_DESTINATIONS[0].label).toBe("Arrival Portal");

      expect(NAVIGATION_DESTINATIONS[1].zoneNumber).toBe("02");
      expect(NAVIGATION_DESTINATIONS[1].label).toBe("Acoustic Gallery");

      expect(NAVIGATION_DESTINATIONS[2].zoneNumber).toBe("03");
      expect(NAVIGATION_DESTINATIONS[2].label).toBe("Architecture Lab");

      expect(NAVIGATION_DESTINATIONS[3].zoneNumber).toBe("04");
      expect(NAVIGATION_DESTINATIONS[3].label).toBe("Conversion Lounge");
    });

    it("verifies all destinations have complete descriptive metadata and valid presets", () => {
      NAVIGATION_DESTINATIONS.forEach((dest: NavigationDestination) => {
        expect(dest.id).toBeTruthy();
        expect(dest.label).toBeTruthy();
        expect(dest.shortLabel).toBeTruthy();
        expect(dest.tagline).toBeTruthy();
        expect(dest.description).toBeTruthy();

        expect(dest.preset).toBeDefined();
        expect(dest.preset.position.length).toBe(3);
        expect(dest.preset.target.length).toBe(3);
        expect(dest.preset.fov).toBeGreaterThanOrEqual(40);
        expect(dest.preset.fov).toBeLessThanOrEqual(65);
      });
    });
  });

  describe("Camera Presets Coordinates & Calibration (Section 4.4)", () => {
    it("contains presets for all zones, arrival alias, and hero inspect mode", () => {
      const requiredKeys = [
        "arrival",
        "zone_arrival",
        "zone_gallery",
        "zone_lab",
        "zone_lounge",
        "inspect",
      ];
      requiredKeys.forEach((key) => {
        expect(CAMERA_PRESETS[key as keyof typeof CAMERA_PRESETS]).toBeDefined();
      });
    });

    it("maintains backward compatibility with original arrival and inspect coordinates", () => {
      expect(CAMERA_PRESETS.arrival.position).toEqual([0, 1.8, 5.2]);
      expect(CAMERA_PRESETS.arrival.target).toEqual([0, 1.1, 0]);
      expect(CAMERA_PRESETS.arrival.fov).toBe(50);

      expect(CAMERA_PRESETS.zone_arrival.position).toEqual([0, 1.8, 5.2]);
      expect(CAMERA_PRESETS.zone_arrival.target).toEqual([0, 1.1, 0]);

      expect(CAMERA_PRESETS.inspect.position).toEqual([0, 1.3, 2.2]);
      expect(CAMERA_PRESETS.inspect.target).toEqual([0, 1.1, 0]);
      expect(CAMERA_PRESETS.inspect.fov).toBe(45);
    });

    it("calibrates camera targets within ergonomic human eye-level bounds (1.0m - 1.25m)", () => {
      Object.values(CAMERA_PRESETS).forEach((preset) => {
        const targetY = preset.target[1];
        expect(targetY).toBeGreaterThanOrEqual(1.0);
        expect(targetY).toBeLessThanOrEqual(1.25);
      });
    });
  });

  describe("getDestinationById Resolver & Fallback", () => {
    it("resolves destination by exact zone ID", () => {
      const gallery = getDestinationById("zone_gallery");
      expect(gallery.id).toBe("zone_gallery");
      expect(gallery.shortLabel).toBe("Gallery");

      const lab = getDestinationById("zone_lab");
      expect(lab.id).toBe("zone_lab");
      expect(lab.shortLabel).toBe("Lab");
    });

    it("safely falls back to default Arrival Portal when ID is invalid, null, or undefined", () => {
      expect(getDestinationById(undefined).id).toBe(DEFAULT_DESTINATION_ID);
      expect(getDestinationById(null).id).toBe(DEFAULT_DESTINATION_ID);
      expect(getDestinationById("invalid_zone_xyz").id).toBe(DEFAULT_DESTINATION_ID);
    });
  });

  describe("Interaction Dispatch Integration (FR-005 / Section 4.5)", () => {
    it("dispatches focus_location event when switching zones", () => {
      const listener = vi.fn();
      const unsubscribe = interactionDispatcher.subscribe("focus_location", listener);

      const targetZone: NavigationZoneId = "zone_gallery";
      interactionDispatcher.dispatch({
        interaction: "focus_location",
        slotKey: "featured-hero",
        metadata: { zoneId: targetZone },
      });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          interaction: "focus_location",
          slotKey: "featured-hero",
          metadata: { zoneId: "zone_gallery" },
        })
      );

      unsubscribe();
    });
  });
});
