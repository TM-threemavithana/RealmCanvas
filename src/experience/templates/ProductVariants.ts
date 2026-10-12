/**
 * RealmCanvas Product Variants & PBR Material Configurations
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 3.2 FR-007, Section 4.3, Section 7.4)
 */

export interface ProductVariantConfig {
  id: string;
  label: string;
  description: string;
  bodyColor: string;
  bodyRoughness: number;
  bodyMetalness: number;
  accentColor: string;
  accentRoughness: number;
  accentMetalness: number;
  emissiveColor: string;
  emissiveIntensity: number;
  revealTrimColor: string;
  swatchColor: string;
}

export const PRODUCT_VARIANTS: Record<string, ProductVariantConfig> = {
  var_midnight: {
    id: "var_midnight",
    label: "Midnight Obsidian",
    description:
      "Deep mineral obsidian composite with brushed titanium accents and vibrant aether-cyan acoustic luminescence.",
    bodyColor: "#080E1C",
    bodyRoughness: 0.25,
    bodyMetalness: 0.85,
    accentColor: "#E7F0FF",
    accentRoughness: 0.2,
    accentMetalness: 0.95,
    emissiveColor: "#37DDEB",
    emissiveIntensity: 0.65,
    revealTrimColor: "#F5CA8A",
    swatchColor: "#080E1C",
  },
  var_titanium: {
    id: "var_titanium",
    label: "Pearl Titanium",
    description:
      "Luminous brushed pearl titanium with dark slate accents and subtle iris acoustic luminescence.",
    bodyColor: "#E7F0FF",
    bodyRoughness: 0.15,
    bodyMetalness: 0.92,
    accentColor: "#182C49",
    accentRoughness: 0.3,
    accentMetalness: 0.75,
    emissiveColor: "#8D6BEE",
    emissiveIntensity: 0.85,
    revealTrimColor: "#37DDEB",
    swatchColor: "#E7F0FF",
  },
};

export const DEFAULT_VARIANT_ID = "var_midnight";

/**
 * Resolves a variant configuration by ID.
 * Enforces TC-003: Invalid variant has no effect and safely falls back to default.
 */
export function getVariantById(id: string | undefined | null): ProductVariantConfig {
  if (id && PRODUCT_VARIANTS[id]) {
    return PRODUCT_VARIANTS[id];
  }

  if (id && id !== DEFAULT_VARIANT_ID) {
    console.warn(
      `[ProductVariants] Invalid variant ID "${id}". Safely falling back to default "${DEFAULT_VARIANT_ID}".`
    );
  }

  return PRODUCT_VARIANTS[DEFAULT_VARIANT_ID];
}
