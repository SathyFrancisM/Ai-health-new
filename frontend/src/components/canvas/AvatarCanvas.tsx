"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Sphere, MeshDistortMaterial, Float, Environment, ContactShadows } from "@react-three/drei"
import { useRef, useMemo } from "react"
import * as THREE from "three"

function AvatarModel({ isSpeaking }: { isSpeaking: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Subtle breathing and rotation
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.y = t * 0.2;
    meshRef.current.position.y = Math.sin(t * 1.5) * 0.1;
    
    // Dynamic scale pulse when speaking
    if (isSpeaking) {
      const s = 1.2 + Math.sin(t * 20) * 0.1;
      meshRef.current.scale.set(s, s, s);
    } else {
      meshRef.current.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.1);
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={meshRef} args={[1, 100, 100]} scale={1.2}>
        <MeshDistortMaterial
          color="#0d9488"
          speed={isSpeaking ? 5 : 2}
          distort={0.4}
          radius={1}
          roughness={0.1}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  )
}

export function AvatarCanvas({ isSpeaking = false }: { isSpeaking?: boolean }) {
  return (
    <div className="w-full h-full min-h-[400px] relative">
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 35 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <AvatarModel isSpeaking={isSpeaking} />
        
        <ContactShadows 
          position={[0, -2, 0]} 
          opacity={0.4} 
          scale={10} 
          blur={2} 
          far={4.5} 
        />
        
        <Environment preset="city" />
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
      
      {/* Decorative pulse when speaking */}
      {isSpeaking && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className="w-64 h-64 bg-teal-400/20 rounded-full animate-ping opacity-50" />
        </div>
      )}
    </div>
  )
}
