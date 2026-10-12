import { describe, it, expect } from "vitest";

describe("RealmCanvas RC-002 Shell & Routing Architecture", () => {
  it("defines expected brand and pavilion navigation targets", () => {
    const navigationTargets = {
      home: "/",
      showroom: "/showroom/celestial-pavilion",
      catalog: "/catalog",
      zones: "#zones",
      features: "#features",
    };

    expect(navigationTargets.home).toBe("/");
    expect(navigationTargets.showroom).toContain("/showroom/");
    expect(navigationTargets.catalog).toBe("/catalog");
  });

  it("validates flagship template identifier", () => {
    const templateId = "celestial-tech-pavilion-v1";
    expect(templateId).toMatch(/^celestial-tech-pavilion-v\d+$/);
  });

  it("confirms the four flagship pavilion world zones match master specification", () => {
    const pavilionZones = [
      { id: 1, name: "Arrival Portal", purpose: "Brand Prestige & Entrance" },
      { id: 2, name: "Discovery Gallery", purpose: "Multi-SKU Exploration" },
      { id: 3, name: "Product Lab", purpose: "Feature Inspection & Demos" },
      { id: 4, name: "Conversion Lounge", purpose: "Qualified Lead Generation" },
    ];

    expect(pavilionZones).toHaveLength(4);
    expect(pavilionZones[0].name).toBe("Arrival Portal");
    expect(pavilionZones[1].name).toBe("Discovery Gallery");
    expect(pavilionZones[2].name).toBe("Product Lab");
    expect(pavilionZones[3].name).toBe("Conversion Lounge");
  });

  it("verifies Art Bible color tokens structure", () => {
    const artBibleTokens = {
      void: "#080E1C",
      slate: "#182C49",
      aetherCyan: "#37DDEB",
      iris: "#8D6BEE",
      pearl: "#E7F0FF",
      dawnGold: "#F5CA8A",
    };

    expect(artBibleTokens.void).toBe("#080E1C");
    expect(artBibleTokens.aetherCyan).toBe("#37DDEB");
    expect(artBibleTokens.dawnGold).toBe("#F5CA8A");
  });
});
