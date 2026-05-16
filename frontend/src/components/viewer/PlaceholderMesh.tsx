import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MaterialProfile } from "../../lib/materials";

type MaterialMode = "solid" | "wireframe" | "toon";

interface PlaceholderMeshProps {
  materialMode: MaterialMode;
  materialProfile?: MaterialProfile | null;
}

function hexToColor(hex: string): string {
  return hex || "#06b6d4";
}

interface ProfileMaterialProps {
  profile: MaterialProfile;
  accent?: boolean;
}

function ProfileMaterial({ profile, accent }: ProfileMaterialProps) {
  const baseColor = accent ? hexToColor(profile.secondary_color) : hexToColor(profile.base_color);
  const emissiveColor = hexToColor(profile.emissive_color);
  const emissiveIntensity = profile.emissive_intensity * (accent ? 1.2 : 1.0);
  const opacity = profile.opacity;
  const transparent = opacity < 1.0;

  if (profile.shader_type === "toon") {
    return (
      <meshToonMaterial
        color={baseColor}
        emissive={emissiveIntensity > 0 ? emissiveColor : "#000000"}
        emissiveIntensity={emissiveIntensity}
        opacity={opacity}
        transparent={transparent}
      />
    );
  }

  if (profile.shader_type === "holographic") {
    return (
      <meshStandardMaterial
        color={baseColor}
        emissive={emissiveColor}
        emissiveIntensity={emissiveIntensity}
        metalness={0.0}
        roughness={0.0}
        opacity={opacity}
        transparent
        side={THREE.DoubleSide}
      />
    );
  }

  if (profile.shader_type === "matte") {
    return (
      <meshStandardMaterial
        color={baseColor}
        emissive={"#000000"}
        emissiveIntensity={0}
        metalness={0.0}
        roughness={profile.roughness}
        opacity={opacity}
        transparent={transparent}
      />
    );
  }

  if (profile.shader_type === "emissive") {
    return (
      <meshStandardMaterial
        color={baseColor}
        emissive={emissiveColor}
        emissiveIntensity={emissiveIntensity * 1.8}
        metalness={profile.metallic}
        roughness={profile.roughness}
        opacity={opacity}
        transparent={transparent}
      />
    );
  }

  // pbr and metallic both use meshStandardMaterial
  return (
    <meshStandardMaterial
      color={baseColor}
      emissive={emissiveIntensity > 0 ? emissiveColor : "#000000"}
      emissiveIntensity={emissiveIntensity}
      metalness={profile.metallic}
      roughness={profile.roughness}
      opacity={opacity}
      transparent={transparent}
    />
  );
}

// Legacy material (no profile)
function PartMaterial({ mode, accent }: { mode: MaterialMode; accent?: boolean }) {
  if (mode === "wireframe") {
    return (
      <meshStandardMaterial
        color={accent ? "#7c3aed" : "#06b6d4"}
        emissive={accent ? "#7c3aed" : "#06b6d4"}
        emissiveIntensity={0.4}
        wireframe
      />
    );
  }
  if (mode === "toon") {
    return <meshToonMaterial color={accent ? "#312e81" : "#164e63"} />;
  }
  if (accent) {
    return (
      <meshStandardMaterial
        color="#1e1040"
        emissive="#7c3aed"
        emissiveIntensity={0.35}
        metalness={0.9}
        roughness={0.1}
      />
    );
  }
  return (
    <meshStandardMaterial
      color="#0f1a2e"
      emissive="#06b6d4"
      emissiveIntensity={0.18}
      metalness={0.8}
      roughness={0.2}
    />
  );
}

export default function PlaceholderMesh({ materialMode, materialProfile }: PlaceholderMeshProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.28;
    }
  });

  const useProfile = !!materialProfile && materialMode !== "wireframe";

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh position={[0, 1.72, 0]}>
        <sphereGeometry args={[0.22, 20, 20]} />
        {useProfile
          ? <ProfileMaterial profile={materialProfile!} accent />
          : <PartMaterial mode={materialMode} accent />}
      </mesh>

      {/* Torso */}
      <mesh position={[0, 0.97, 0]}>
        <boxGeometry args={[0.54, 0.82, 0.28]} />
        {useProfile
          ? <ProfileMaterial profile={materialProfile!} />
          : <PartMaterial mode={materialMode} />}
      </mesh>

      {/* Hips */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.46, 0.22, 0.26]} />
        {useProfile
          ? <ProfileMaterial profile={materialProfile!} accent />
          : <PartMaterial mode={materialMode} accent />}
      </mesh>

      {/* Left arm */}
      <mesh position={[-0.38, 0.92, 0]} rotation={[0, 0, 0.22]}>
        <cylinderGeometry args={[0.085, 0.075, 0.64, 8]} />
        {useProfile
          ? <ProfileMaterial profile={materialProfile!} />
          : <PartMaterial mode={materialMode} />}
      </mesh>

      {/* Right arm */}
      <mesh position={[0.38, 0.92, 0]} rotation={[0, 0, -0.22]}>
        <cylinderGeometry args={[0.085, 0.075, 0.64, 8]} />
        {useProfile
          ? <ProfileMaterial profile={materialProfile!} />
          : <PartMaterial mode={materialMode} />}
      </mesh>

      {/* Left leg */}
      <mesh position={[-0.16, 0.0, 0]}>
        <cylinderGeometry args={[0.1, 0.085, 0.78, 8]} />
        {useProfile
          ? <ProfileMaterial profile={materialProfile!} />
          : <PartMaterial mode={materialMode} />}
      </mesh>

      {/* Right leg */}
      <mesh position={[0.16, 0.0, 0]}>
        <cylinderGeometry args={[0.1, 0.085, 0.78, 8]} />
        {useProfile
          ? <ProfileMaterial profile={materialProfile!} />
          : <PartMaterial mode={materialMode} />}
      </mesh>

      {/* Shoulder gems */}
      <mesh position={[-0.3, 1.35, 0]}>
        <octahedronGeometry args={[0.065, 0]} />
        {useProfile
          ? <ProfileMaterial profile={materialProfile!} accent />
          : <PartMaterial mode={materialMode} accent />}
      </mesh>
      <mesh position={[0.3, 1.35, 0]}>
        <octahedronGeometry args={[0.065, 0]} />
        {useProfile
          ? <ProfileMaterial profile={materialProfile!} accent />
          : <PartMaterial mode={materialMode} accent />}
      </mesh>
    </group>
  );
}
