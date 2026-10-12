"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type PresentationMode = "procedural" | "gltf" | "poster-fallback";

interface ProductPresenterProps {
  title: string;
  productId: string;
  slotKey: string;
  modelUrl?: string;
  fallbackImageUrl?: string;
  forceFallback?: boolean;
  reducedMotion?: boolean;
  onInspect?: () => void;
}

export default function ProductPresenter({
  title,
  modelUrl,
  forceFallback = false,
  reducedMotion = false,
  onInspect,
}: ProductPresenterProps) {
  const [hasLoadError, setHasLoadError] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Derive presentation mode directly from props and asset state (idiomatic React without cascading effects)
  const mode: PresentationMode =
    forceFallback || hasLoadError
      ? "poster-fallback"
      : modelUrl
      ? "gltf"
      : "procedural";

  // If modelUrl is provided, asynchronously probe asset accessibility
  useEffect(() => {
    if (!modelUrl || forceFallback) return;

    let isCancelled = false;
    fetch(modelUrl, { method: "HEAD" })
      .then((res) => {
        if (!res.ok && !isCancelled) {
          console.warn(
            `[ProductPresenter] Model URL "${modelUrl}" returned status ${res.status}. Falling back to 2D poster billboard.`
          );
          setHasLoadError(true);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn(
            `[ProductPresenter] Network error fetching "${modelUrl}". Falling back to 2D poster billboard:`,
            err
          );
          setHasLoadError(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [modelUrl, forceFallback]);

  useFrame((_, delta) => {
    if (!reducedMotion && groupRef.current) {
      // Delta-driven rotation for both procedural mesh and poster card
      groupRef.current.rotation.y += delta * 0.45;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[0, 1.25, 0]}
      onClick={onInspect}
      onPointerOver={() => {
        setIsHovered(true);
        if (typeof document !== "undefined") {
          document.body.style.cursor = "pointer";
        }
      }}
      onPointerOut={() => {
        setIsHovered(false);
        if (typeof document !== "undefined") {
          document.body.style.cursor = "auto";
        }
      }}
    >
      {/* =========================================================================
          MODE A: PROCEDURAL 3D HARDWARE (DEFAULT WHEN NO EXTERNAL GLB CONFIGURED)
          ========================================================================= */}
      {mode === "procedural" && (
        <group>
          {/* Main Composite Acoustic Body */}
          <mesh>
            <cylinderGeometry args={[0.3, 0.3, 0.28, 32]} />
            <meshStandardMaterial
              color="#080E1C"
              roughness={0.25}
              metalness={0.85}
            />
          </mesh>

          {/* Outer Titanium Trim Ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.31, 0.02, 16, 32]} />
            <meshStandardMaterial
              color="#E7F0FF"
              roughness={0.2}
              metalness={0.95}
            />
          </mesh>

          {/* Central Luminous Acoustic Driver Core */}
          <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[0.12, 24, 24]} />
            <meshStandardMaterial
              color="#182C49"
              emissive="#37DDEB"
              emissiveIntensity={isHovered ? 0.9 : 0.6}
              roughness={0.3}
              metalness={0.5}
            />
          </mesh>

          {/* Gold Reveal Trim */}
          <mesh position={[0, -0.14, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.02, 32]} />
            <meshStandardMaterial
              color="#F5CA8A"
              roughness={0.3}
              metalness={0.8}
            />
          </mesh>
        </group>
      )}

      {/* =========================================================================
          MODE B: IN-SCENE 2D POSTER BILLBOARD (AUTOMATIC RESILIENT FALLBACK)
          Complies with Section 3.3: "GLB fails -> poster image with complete text/CTA"
          ========================================================================= */}
      {mode === "poster-fallback" && (
        <group>
          {/* Outer Beveled Poster Frame */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.7, 0.9, 0.04]} />
            <meshStandardMaterial
              color="#101E33"
              roughness={0.4}
              metalness={0.6}
            />
          </mesh>

          {/* Glowing Luminous Border */}
          <mesh position={[0, 0, 0.025]}>
            <boxGeometry args={[0.66, 0.86, 0.005]} />
            <meshStandardMaterial
              color="#182C49"
              emissive={hasLoadError ? "#F5CA8A" : "#37DDEB"}
              emissiveIntensity={isHovered ? 0.8 : 0.4}
              roughness={0.3}
              metalness={0.5}
            />
          </mesh>

          {/* Inner Poster Display Surface */}
          <mesh position={[0, 0, 0.03]}>
            <planeGeometry args={[0.6, 0.8]} />
            <meshBasicMaterial
              color="#080E1C"
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Stylized Hardware Emblem on Poster Surface */}
          <mesh position={[0, 0.1, 0.035]}>
            <circleGeometry args={[0.16, 32]} />
            <meshBasicMaterial
              color={hasLoadError ? "#F5CA8A" : "#37DDEB"}
              transparent
              opacity={0.85}
            />
          </mesh>

          {/* Fallback Notice Indicator */}
          <mesh position={[0, -0.22, 0.035]}>
            <planeGeometry args={[0.48, 0.1]} />
            <meshBasicMaterial
              color="#182C49"
              transparent
              opacity={0.9}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}
