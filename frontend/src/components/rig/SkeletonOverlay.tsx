import { useMemo } from "react";
import { RigBone } from "../../lib/rigs";

interface SkeletonOverlayProps {
  bones: RigBone[];
}

export default function SkeletonOverlay({ bones }: SkeletonOverlayProps) {
  const boneMap = useMemo(() => {
    const m: Record<string, RigBone> = {};
    bones.forEach((b) => {
      m[b.name] = b;
    });
    return m;
  }, [bones]);

  const linePositions = useMemo(() => {
    const pts: number[] = [];
    bones.forEach((b) => {
      if (b.parent && boneMap[b.parent]) {
        const p = boneMap[b.parent];
        pts.push(...b.position, ...p.position);
      }
    });
    return new Float32Array(pts);
  }, [bones, boneMap]);

  return (
    <group>
      {linePositions.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[linePositions, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#00e5ff" transparent opacity={0.75} />
        </lineSegments>
      )}

      {bones.map((b) => (
        <mesh key={b.name} position={b.position}>
          <sphereGeometry args={[0.032, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
    </group>
  );
}
