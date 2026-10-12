"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ArrivalPortalGreyboxProps {
  reducedMotion?: boolean;
  onPedestalClick?: () => void;
}

export default function ArrivalPortalGreybox({
  reducedMotion = false,
  onPedestalClick,
}: ArrivalPortalGreyboxProps) {
  const productRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!reducedMotion && productRef.current) {
      // Gentle delta-driven rotation of the hero product (no high-frequency React state updates)
      productRef.current.rotation.y += delta * 0.45;
    }
    if (!reducedMotion && ringRef.current) {
      ringRef.current.rotation.z += delta * 0.15;
    }
  });

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
        onClick={onPedestalClick}
        onPointerOver={() => {
          if (typeof document !== "undefined") {
            document.body.style.cursor = "pointer";
          }
        }}
        onPointerOut={() => {
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

        {/* Luminous Pedestal Halo Ring */}
        <mesh position={[0, 0.905, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.48, 0.53, 36]} />
          <meshBasicMaterial
            color="#37DDEB"
            side={THREE.DoubleSide}
            transparent
            opacity={0.8}
          />
        </mesh>
      </group>

      {/* PROCEDURAL HERO HARDWARE PRODUCT (AETHER SOUND PRO SPEAKER/DRIVER) */}
      <group ref={productRef} position={[0, 1.25, 0]}>
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
            emissiveIntensity={0.6}
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
    </group>
  );
}
