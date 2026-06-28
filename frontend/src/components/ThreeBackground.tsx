"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, Float, Edges } from '@react-three/drei';
import * as THREE from 'three';

function AnimatedInventoryBoxes() {
  const group = useRef<THREE.Group>(null);

  // Slowly rotate the entire group
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.getElapsedTime() * 0.03;
      group.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.05) * 0.05;
    }
  });

  return (
    <group ref={group}>
      {/* Large Indigo Box */}
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1.5}>
        <RoundedBox args={[2, 2, 2]} radius={0.15} position={[-4, 1, -5]}>
          <meshPhysicalMaterial
            color="#6366f1"
            clearcoat={1}
            clearcoatRoughness={0.1}
            metalness={0.7}
            roughness={0.2}
            transparent={true}
            opacity={0.8}
          />
          <Edges scale={1} threshold={15} color="#4f46e5" />
        </RoundedBox>
      </Float>

      {/* Medium Purple Box */}
      <Float speed={1.2} rotationIntensity={0.8} floatIntensity={2}>
        <RoundedBox args={[1.5, 1.5, 1.5]} radius={0.1} position={[4, -1, -8]}>
          <meshPhysicalMaterial
            color="#a855f7"
            clearcoat={1}
            clearcoatRoughness={0.1}
            metalness={0.7}
            roughness={0.2}
            transparent={true}
            opacity={0.7}
          />
          <Edges scale={1} threshold={15} color="#9333ea" />
        </RoundedBox>
      </Float>

      {/* Small Blue Box */}
      <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        <RoundedBox args={[1, 1, 1]} radius={0.08} position={[0, -3, -4]}>
          <meshPhysicalMaterial
            color="#3b82f6"
            clearcoat={1}
            clearcoatRoughness={0.1}
            metalness={0.7}
            roughness={0.2}
            transparent={true}
            opacity={0.9}
          />
          <Edges scale={1} threshold={15} color="#2563eb" />
        </RoundedBox>
      </Float>
    </group>
  );
}

export default function ThreeBackground() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    // Check initial local storage setting
    const stored = localStorage.getItem('3d_background_enabled');
    if (stored !== null) {
      setEnabled(stored === 'true');
    }

    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent;
      setEnabled(customEvent.detail.enabled);
    };

    window.addEventListener('toggle_3d_background', handleToggle);
    return () => {
      window.removeEventListener('toggle_3d_background', handleToggle);
    };
  }, []);

  if (!enabled) {
    return <div className="fixed inset-0 z-[-50] pointer-events-none w-full h-full bg-[#0f172a]" />;
  }

  return (
    <div className="fixed inset-0 z-[-50] pointer-events-none w-full h-full bg-[#0f172a]">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }} dpr={[1, 2]}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
        <directionalLight position={[-10, -10, -5]} intensity={1.5} color="#c084fc" />
        <AnimatedInventoryBoxes />
      </Canvas>
    </div>
  );
}
