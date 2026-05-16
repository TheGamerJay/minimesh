import { Line } from "@react-three/drei";

interface Props {
  visible?: boolean;
}

export default function GizmoOverlay({ visible = true }: Props) {
  if (!visible) return null;

  return (
    <group>
      {/* ── X axis (red) — move arrow ── */}
      <Line points={[[0, 0, 0], [0.7, 0, 0]]} color="#ef4444" lineWidth={2} />
      <mesh position={[0.82, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.04, 0.14, 8]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {/* ── Y axis (green) — move arrow ── */}
      <Line points={[[0, 0, 0], [0, 0.7, 0]]} color="#22c55e" lineWidth={2} />
      <mesh position={[0, 0.82, 0]}>
        <coneGeometry args={[0.04, 0.14, 8]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>

      {/* ── Z axis (blue) — move arrow ── */}
      <Line points={[[0, 0, 0], [0, 0, 0.7]]} color="#3b82f6" lineWidth={2} />
      <mesh position={[0, 0, 0.82]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.04, 0.14, 8]} />
        <meshBasicMaterial color="#3b82f6" />
      </mesh>

      {/* ── Rotate rings (torus) ── */}
      {/* XZ plane ring (Y rotation) — green */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.52, 0.008, 8, 48]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.55} />
      </mesh>
      {/* YZ plane ring (X rotation) — red */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.52, 0.008, 8, 48]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.55} />
      </mesh>
      {/* XY plane ring (Z rotation) — blue */}
      <mesh>
        <torusGeometry args={[0.52, 0.008, 8, 48]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.55} />
      </mesh>

      {/* ── Scale cubes at axis midpoints ── */}
      <mesh position={[0.42, 0, 0]}>
        <boxGeometry args={[0.06, 0.06, 0.06]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.06, 0.06, 0.06]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.42]}>
        <boxGeometry args={[0.06, 0.06, 0.06]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.8} />
      </mesh>

      {/* ── Origin sphere ── */}
      <mesh>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}
