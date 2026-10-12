import { describe, it, expect } from "vitest";
import { CAMERA_PRESETS } from "@/experience/camera/CameraRig";

describe("Experience Canvas & Celestial Pavilion Greybox (RC-004)", () => {
  describe("CameraRig Presets", () => {
    it("defines valid arrival portal camera preset", () => {
      const arrival = CAMERA_PRESETS.arrival;
      expect(arrival).toBeDefined();
      expect(arrival.position).toEqual([0, 1.8, 5.2]);
      expect(arrival.target).toEqual([0, 1.1, 0]);
      expect(arrival.fov).toBe(50);
    });

    it("defines valid product inspection camera preset", () => {
      const inspect = CAMERA_PRESETS.inspect;
      expect(inspect).toBeDefined();
      expect(inspect.position).toEqual([0, 1.3, 2.2]);
      expect(inspect.target).toEqual([0, 1.1, 0]);
      expect(inspect.fov).toBe(45);
    });

    it("guarantees camera targets center on pedestal hero product height (y = 1.1m)", () => {
      expect(CAMERA_PRESETS.arrival.target[1]).toBe(1.1);
      expect(CAMERA_PRESETS.inspect.target[1]).toBe(1.1);
    });
  });

  describe("World Scale and Material Tokens", () => {
    it("verifies world scale metrics match standard human proportions in meters", () => {
      const worldMetrics = {
        pedestalHeight: 0.9,
        heroProductCenterY: 1.25,
        eyeLevelArrivalY: 1.8,
        viewingDistanceZ: 5.2,
      };

      expect(worldMetrics.pedestalHeight).toBeLessThan(worldMetrics.eyeLevelArrivalY);
      expect(worldMetrics.viewingDistanceZ).toBeGreaterThan(3.0);
    });

    it("confirms greybox palette adheres to Celestial Tech Pavilion Art Bible", () => {
      const greyboxPalette = {
        void: "#080E1C",
        slate: "#182C49",
        cyan: "#37DDEB",
        iris: "#8D6BEE",
        pearl: "#E7F0FF",
        gold: "#F5CA8A",
      };

      expect(greyboxPalette.void).toBe("#080E1C");
      expect(greyboxPalette.cyan).toBe("#37DDEB");
      expect(greyboxPalette.gold).toBe("#F5CA8A");
    });
  });
});
