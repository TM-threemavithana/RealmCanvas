"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  CAMERA_PRESETS,
  type CameraPreset,
  type CameraRigMode,
  type NavigationZoneId,
  NAVIGATION_DESTINATIONS,
  getDestinationById,
  DEFAULT_DESTINATION_ID,
} from "./NavigationDestinations";

export {
  CAMERA_PRESETS,
  type CameraPreset,
  type CameraRigMode,
  type NavigationZoneId,
  NAVIGATION_DESTINATIONS,
  getDestinationById,
  DEFAULT_DESTINATION_ID,
};

interface CameraRigProps {
  mode?: CameraRigMode;
  reducedMotion?: boolean;
}

export default function CameraRig({
  mode = "zone_arrival",
  reducedMotion = false,
}: CameraRigProps) {
  const presetKey: CameraRigMode = CAMERA_PRESETS[mode] ? mode : "zone_arrival";
  const preset = CAMERA_PRESETS[presetKey];

  const targetVec = useRef(new THREE.Vector3(...preset.target));
  const currentPos = useRef(new THREE.Vector3(...preset.position));
  const destinationTarget = useRef(new THREE.Vector3(...preset.target));

  useFrame((state, delta) => {
    const cam = state.camera;
    const activePreset = CAMERA_PRESETS[presetKey];

    if (reducedMotion) {
      // Instant camera jump without animation or breathing sway per NFR-009 / Section 4.6
      cam.position.set(...activePreset.position);
      targetVec.current.set(...activePreset.target);
      cam.lookAt(targetVec.current);

      if (cam instanceof THREE.PerspectiveCamera && cam.fov !== activePreset.fov) {
        cam.fov = activePreset.fov;
        cam.updateProjectionMatrix();
      }
      return;
    }

    const t = state.clock.getElapsedTime();
    // Calculate gentle breathing sway when motion is enabled (quenched during inspect mode)
    const isInspecting = presetKey === "inspect";
    const swayAmplitude = isInspecting ? 0 : 1;
    const swayX = Math.sin(t * 0.4) * 0.06 * swayAmplitude;
    const swayY = Math.cos(t * 0.3) * 0.03 * swayAmplitude;

    currentPos.current.set(
      activePreset.position[0] + swayX,
      activePreset.position[1] + swayY,
      activePreset.position[2]
    );

    // Delta-driven exponential smoothing for 60fps/30fps consistency
    const lerpFactor = Math.min(1, Math.max(0, 1 - Math.exp(-delta * 3.5)));

    // Smoothly interpolate camera position toward target
    cam.position.lerp(currentPos.current, lerpFactor);

    // Smoothly interpolate lookAt orientation
    destinationTarget.current.set(...activePreset.target);
    targetVec.current.lerp(destinationTarget.current, lerpFactor);
    cam.lookAt(targetVec.current);

    // Smoothly adjust FOV if PerspectiveCamera
    if (
      cam instanceof THREE.PerspectiveCamera &&
      Math.abs(cam.fov - activePreset.fov) > 0.05
    ) {
      cam.fov = THREE.MathUtils.lerp(cam.fov, activePreset.fov, lerpFactor);
      cam.updateProjectionMatrix();
    }
  });

  return null;
}
