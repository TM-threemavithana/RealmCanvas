"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { interactionDispatcher } from "@/experience/interactions/InteractionRegistry";
import ProductPresenter from "@/experience/templates/ProductPresenter";

interface ArrivalPortalGreyboxProps {
  reducedMotion?: boolean;
  modelUrl?: string;
  onPedestalClick?: () => void;
}

export default function ArrivalPortalGreybox({
  reducedMotion = false,
  modelUrl,
  onPedestalClick,
}: ArrivalPortalGreyboxProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);

  useFrame((_, delta) => {
    if (!reducedMotion && ringRef.current) {
      ringRef.current.rotation.z += delta * 0.15;
    }
  });

  const handleInspect = () => {
    interactionDispatcher.dispatch({
      interaction: "inspect_product",
      slotKey: "featured-hero",
      productId: "prod_01_aurora",
    });
    if (onPedestalClick) {
      onPedestalClick();
    }
  };

  return (
    <group>
      {/* ATMOSPHERIC FOG & BACKGROUND COLOR */}
      <color attach="background" args={["#080E1C"]} />
      <fog attach="fog" args={["#080E1C", 5, 20]} />

      {/* BALANCED PBR SCENE LIGHTING */}
      <ambientLight color="#182C49" intensity={0.9} />
      <directionalLight
        position={[4, 7, 4]}
        color="#E7F0FF"
        intensity={1.6}
        castShadow={false}
      />
      <directionalLight
        position={[-3, 4, -4]}
        color="#F5CA8A"
        intensity={0.8}
        castShadow={false}
      />
      <pointLight
        position={[0, 3.2, 0]}
        color="#37DDEB"
        intensity={2.0}
        distance={6}
        decay={2}
      />

      {/* STEPPED CIRCULAR FLOOR TERRACE */}
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <cylinderGeometry args={[5.5, 5.8, 0.3, 48]} />
        <meshStandardMaterial
          color="#101E33"
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>

      {/* FLOOR LUMINESCENT ACCENT RING */}
      <mesh
        ref={ringRef}
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[2.8, 2.9, 48]} />
        <meshBasicMaterial
          color="#37DDEB"
          transparent
          opacity={0.45}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* MONOLITHIC BACKGROUND PORTAL ARCH */}
      <group position={[0, 1.8, -3.2]}>
        {/* Left Arch Column */}
        <mesh position={[-2.2, 0.2, 0]}>
          <boxGeometry args={[0.4, 4.2, 0.5]} />
          <meshStandardMaterial
            color="#182C49"
            roughness={0.5}
            metalness={0.4}
          />
        </mesh>
        {/* Right Arch Column */}
        <mesh position={[2.2, 0.2, 0]}>
          <boxGeometry args={[0.4, 4.2, 0.5]} />
          <meshStandardMaterial
            color="#182C49"
            roughness={0.5}
            metalness={0.4}
          />
        </mesh>
        {/* Top Arch Lintel */}
        <mesh position={[0, 2.3, 0]}>
          <boxGeometry args={[4.8, 0.4, 0.5]} />
          <meshStandardMaterial
            color="#182C49"
            roughness={0.5}
            metalness={0.4}
          />
        </mesh>
        {/* Luminous Inner Arch Trim */}
        <mesh position={[0, 2.05, 0.05]}>
          <boxGeometry args={[4.0, 0.05, 0.4]} />
          <meshBasicMaterial color="#8D6BEE" transparent opacity={0.65} />
        </mesh>
      </group>

      {/* HERO DISPLAY PEDESTAL */}
      <group
        position={[0, 0, 0]}
        onClick={handleInspect}
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
        {/* Pedestal Base */}
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.55, 0.65, 0.9, 36]} />
          <meshStandardMaterial
            color="#14243B"
            roughness={0.4}
            metalness={0.6}
          />
        </mesh>

        {/* Luminous Pedestal Halo Ring with Dynamic Hover Intensity */}
        <mesh position={[0, 0.905, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.48, isHovered ? 0.55 : 0.53, 36]} />
          <meshBasicMaterial
            color="#37DDEB"
            side={THREE.DoubleSide}
            transparent
            opacity={isHovered ? 1.0 : 0.75}
          />
        </mesh>
      </group>

      {/* RESILIENT HERO PRODUCT PRESENTER (PROCEDURAL + ASSET LOADER + 2D POSTER FALLBACK) */}
      <ProductPresenter
        title="Aurora Precision Headphones"
        productId="prod_01_aurora"
        slotKey="featured-hero"
        modelUrl={modelUrl}
        reducedMotion={reducedMotion}
        onInspect={handleInspect}
      />
    </group>
  );
}
