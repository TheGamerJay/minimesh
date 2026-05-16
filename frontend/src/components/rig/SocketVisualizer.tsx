import { Html } from "@react-three/drei";
import { AttachmentSocket } from "../../lib/modules";
import { RigBone } from "../../lib/rigs";

interface SocketVisualizerProps {
  sockets: AttachmentSocket[];
  bones?: RigBone[];
  showLabels?: boolean;
  activeSocketId?: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  armor: "#f59e0b",
  weapon: "#ef4444",
  wings: "#8b5cf6",
  accessory: "#22d3ee",
};

export default function SocketVisualizer({
  sockets,
  bones = [],
  showLabels = true,
  activeSocketId,
}: SocketVisualizerProps) {
  const boneMap: Record<string, RigBone> = {};
  bones.forEach((b) => { boneMap[b.name] = b; });

  return (
    <group>
      {sockets.map((s) => {
        const color = TYPE_COLORS[s.attachment_type] ?? "#ffffff";
        const isActive = activeSocketId === s.id;
        const pos = s.position as [number, number, number];
        const parentBone = boneMap[s.parent_bone];

        return (
          <group key={s.id}>
            {/* Connection line from socket to parent bone */}
            {parentBone && (
              <lineSegments>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    args={[
                      new Float32Array([
                        ...pos,
                        ...parentBone.position,
                      ]),
                      3,
                    ]}
                  />
                </bufferGeometry>
                <lineBasicMaterial
                  color={color}
                  transparent
                  opacity={0.3}
                />
              </lineSegments>
            )}

            {/* Socket marker */}
            <group position={pos}>
              {/* Outer glow */}
              <mesh>
                <sphereGeometry args={[isActive ? 0.06 : 0.044, 14, 14]} />
                <meshBasicMaterial
                  color={color}
                  transparent
                  opacity={isActive ? 0.9 : 0.55}
                />
              </mesh>
              {/* Inner core */}
              <mesh>
                <sphereGeometry args={[0.02, 8, 8]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>

              {/* Label */}
              {showLabels && (
                <Html center distanceFactor={7}>
                  <div
                    style={{
                      fontSize: "8px",
                      fontFamily: "monospace",
                      color: color,
                      background: "rgba(0,0,0,0.7)",
                      padding: "1px 4px",
                      borderRadius: "3px",
                      whiteSpace: "nowrap",
                      pointerEvents: "none",
                      border: `1px solid ${color}44`,
                      marginTop: "14px",
                    }}
                  >
                    {s.socket_name}
                  </div>
                </Html>
              )}
            </group>
          </group>
        );
      })}
    </group>
  );
}
