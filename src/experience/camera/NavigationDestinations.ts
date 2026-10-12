/**
 * RealmCanvas Navigation Destinations & Camera Presets
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 4.2, Section 4.4, Section 4.6, Section 7.4)
 */

export type NavigationZoneId =
  | "zone_arrival"
  | "zone_gallery"
  | "zone_lab"
  | "zone_lounge";

export type CameraRigMode = NavigationZoneId | "inspect" | "arrival";

export interface CameraPreset {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export interface NavigationDestination {
  id: NavigationZoneId;
  label: string;
  shortLabel: string;
  zoneNumber: string;
  tagline: string;
  description: string;
  preset: CameraPreset;
}

export const NAVIGATION_DESTINATIONS: readonly NavigationDestination[] = [
  {
    id: "zone_arrival",
    label: "Arrival Portal",
    shortLabel: "Arrival",
    zoneNumber: "01",
    tagline: "Celestial Entry Threshold",
    description: "Circular entry terrace, monolithic arch, and hero product orientation.",
    preset: {
      position: [0, 1.8, 5.2],
      target: [0, 1.1, 0],
      fov: 50,
    },
  },
  {
    id: "zone_gallery",
    label: "Acoustic Gallery",
    shortLabel: "Gallery",
    zoneNumber: "02",
    tagline: "Flagship Lineup Promenade",
    description: "Curved panoramic perspective viewing multiple display pedestal slots.",
    preset: {
      position: [-3.4, 1.7, 3.2],
      target: [-0.4, 1.1, 0.2],
      fov: 52,
    },
  },
  {
    id: "zone_lab",
    label: "Architecture Lab",
    shortLabel: "Lab",
    zoneNumber: "03",
    tagline: "Engineering Telemetry",
    description: "Spotlighted technical inspection, acoustic transducers, and exploded specifications.",
    preset: {
      position: [3.2, 1.7, 2.9],
      target: [0.3, 1.2, 0.1],
      fov: 48,
    },
  },
  {
    id: "zone_lounge",
    label: "Conversion Lounge",
    shortLabel: "Lounge",
    zoneNumber: "04",
    tagline: "Commercial Consultations",
    description: "Warm atmospheric sanctuary for bespoke consultation, pre-orders, and quote requests.",
    preset: {
      position: [0, 1.6, 3.8],
      target: [0, 1.0, -1.2],
      fov: 54,
    },
  },
] as const;

export const DEFAULT_DESTINATION_ID: NavigationZoneId = "zone_arrival";

export const CAMERA_PRESETS: Record<CameraRigMode, CameraPreset> = {
  arrival: {
    position: [0, 1.8, 5.2],
    target: [0, 1.1, 0],
    fov: 50,
  },
  zone_arrival: {
    position: [0, 1.8, 5.2],
    target: [0, 1.1, 0],
    fov: 50,
  },
  zone_gallery: {
    position: [-3.4, 1.7, 3.2],
    target: [-0.4, 1.1, 0.2],
    fov: 52,
  },
  zone_lab: {
    position: [3.2, 1.7, 2.9],
    target: [0.3, 1.2, 0.1],
    fov: 48,
  },
  zone_lounge: {
    position: [0, 1.6, 3.8],
    target: [0, 1.0, -1.2],
    fov: 54,
  },
  inspect: {
    position: [0, 1.3, 2.2],
    target: [0, 1.1, 0],
    fov: 45,
  },
};

/**
 * Resolves a zone destination by ID with safe fallback to Arrival Portal.
 */
export function getDestinationById(id: string | undefined | null): NavigationDestination {
  const found = NAVIGATION_DESTINATIONS.find((d) => d.id === id);
  return found || NAVIGATION_DESTINATIONS[0];
}
