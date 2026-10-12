"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export interface CameraPreset {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export const CAMERA_PRESETS: Record<"arrival" | "inspect", CameraPreset> = {
  arrival: {
    position: [0, 1.8, 5.2],
    target: [0, 1.1, 0],
    fov: 50,
  },
  inspect: {
    position: [0, 1.3, 2.2],
    target: [0, 1.1, 0],
    fov: 45,
  },
};

interface CameraRigProps {
  mode?: "arrival" | "inspect";
  reducedMotion?: boolean;
}

export default function CameraRig({
  mode = "arrival",
  reducedMotion = false,
}: CameraRigProps) {
  const { camera } = useThree();
  const targetVec = useRef(new THREE.Vector3(...CAMERA_PRESETS[mode].target));
  const currentPos = useRef(new THREE.Vector3(...CAMERA_PRESETS[mode].position));

  useFrame(({ clock }) => {
    const preset = CAMERA_PRESETS[mode];
    const t = clock.getElapsedTime();

    // Calculate target position with gentle breathing sway when motion is enabled
    const swayX = reducedMotion ? 0 : Math.sin(t * 0.4) * 0.08;
    const swayY = reducedMotion ? 0 : Math.cos(t * 0.3) * 0.04;

    currentPos.current.set(
      preset.position[0] + swayX,
      preset.position[1] + swayY,
      preset.position[2]
    );

    // Smoothly interpolate camera position toward target
    camera.position.lerp(currentPos.current, 0.05);

    // Keep camera focused smoothly on target
    targetVec.current.set(...preset.target);
    camera.lookAt(targetVec.current);
  });

  return null;
}
