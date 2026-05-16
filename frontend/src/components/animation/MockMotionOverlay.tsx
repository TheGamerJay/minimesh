import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RigBone } from "../../lib/rigs";

interface MockMotionOverlayProps {
  bones: RigBone[];
  clipType: string;
  isPlaying: boolean;
  speed: number;
  duration: number;
  loop: boolean;
  restartTrigger: number;
  onTimeUpdate: (t: number) => void;
  onEnded: () => void;
}

function getBoneOffset(
  name: string,
  clipType: string,
  t: number
): [number, number, number] {
  switch (clipType) {
    case "idle": {
      const y = Math.sin(t * Math.PI * 2) * 0.025;
      return [0, ["spine", "head", "neck"].includes(name) ? y : y * 0.5, 0];
    }
    case "walk": {
      const c = Math.sin(t * Math.PI * 2);
      if (name === "left_arm") return [0, 0, c * 0.12];
      if (name === "right_arm") return [0, 0, -c * 0.12];
      if (name === "left_leg") return [0, Math.max(0, c) * 0.08, 0];
      if (name === "right_leg") return [0, Math.max(0, -c) * 0.08, 0];
      if (name === "spine") return [0, Math.abs(c) * 0.015, 0];
      return [0, 0, 0];
    }
    case "run": {
      const c = Math.sin(t * Math.PI * 4);
      if (name === "left_arm") return [0, 0, c * 0.2];
      if (name === "right_arm") return [0, 0, -c * 0.2];
      if (name === "left_leg") return [0, Math.max(0, c) * 0.14, 0];
      if (name === "right_leg") return [0, Math.max(0, -c) * 0.14, 0];
      if (name === "spine") return [0, Math.abs(c) * 0.025, 0];
      return [0, 0, 0];
    }
    case "jump": {
      const arc = Math.sin(t * Math.PI) * 0.35;
      return [0, arc, 0];
    }
    case "attack": {
      const slash = Math.sin(t * Math.PI * 2) * 0.3;
      if (name === "right_arm") return [slash, slash * 0.5, 0];
      if (name === "spine") return [0, 0, slash * 0.08];
      return [0, 0, 0];
    }
    case "fly": {
      const flap = Math.sin(t * Math.PI * 4) * 0.18;
      if (name === "left_wing" || name === "right_wing") return [0, flap, 0];
      return [0, Math.sin(t * Math.PI) * 0.04, 0];
    }
    case "turntable":
      return [0, 0, 0];
    default:
      return [0, 0, 0];
  }
}

export default function MockMotionOverlay({
  bones,
  clipType,
  isPlaying,
  speed,
  duration,
  loop,
  restartTrigger,
  onTimeUpdate,
  onEnded,
}: MockMotionOverlayProps) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const geoRef = useRef<THREE.BufferGeometry>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meshRefs = useRef<any[]>([]);

  // Sync all changing props to refs so useFrame never sees stale closures
  const isPlayingRef = useRef(isPlaying);
  const speedRef = useRef(speed);
  const durationRef = useRef(duration);
  const loopRef = useRef(loop);
  const clipTypeRef = useRef(clipType);
  const bonesRef = useRef(bones);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onEndedRef = useRef(onEnded);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { loopRef.current = loop; }, [loop]);
  useEffect(() => { clipTypeRef.current = clipType; }, [clipType]);
  useEffect(() => { bonesRef.current = bones; }, [bones]);
  useEffect(() => { onTimeUpdateRef.current = onTimeUpdate; }, [onTimeUpdate]);
  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);

  useEffect(() => {
    if (restartTrigger > 0) {
      timeRef.current = 0;
      onTimeUpdateRef.current(0);
    }
  }, [restartTrigger]);

  useFrame((_, delta) => {
    const ct = clipTypeRef.current;
    const dur = durationRef.current;
    const bs = bonesRef.current;

    if (isPlayingRef.current && dur > 0) {
      timeRef.current += delta * speedRef.current;
      if (timeRef.current >= dur) {
        if (loopRef.current) {
          timeRef.current = timeRef.current % dur;
        } else {
          timeRef.current = dur;
          onEndedRef.current();
        }
      }
      onTimeUpdateRef.current(timeRef.current);
    }

    const t = dur > 0 ? timeRef.current / dur : 0;

    if (ct === "turntable" && groupRef.current) {
      groupRef.current.rotation.y = t * Math.PI * 2;
    }

    const boneMap: Record<string, RigBone> = {};
    bs.forEach((b) => { boneMap[b.name] = b; });

    const posMap: Record<string, THREE.Vector3> = {};
    bs.forEach((b, i) => {
      const [ox, oy, oz] = getBoneOffset(b.name, ct, t);
      const pos = new THREE.Vector3(
        b.position[0] + ox,
        b.position[1] + oy,
        b.position[2] + oz
      );
      posMap[b.name] = pos;
      const mesh = meshRefs.current[i];
      if (mesh) mesh.position.copy(pos);
    });

    const lineData: number[] = [];
    bs.forEach((b) => {
      if (b.parent && posMap[b.parent] && posMap[b.name]) {
        const from = posMap[b.name];
        const to = posMap[b.parent];
        lineData.push(from.x, from.y, from.z, to.x, to.y, to.z);
      }
    });

    if (geoRef.current && lineData.length > 0) {
      geoRef.current.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(lineData), 3)
      );
    }
  });

  const boneMapInit: Record<string, RigBone> = {};
  bones.forEach((b) => { boneMapInit[b.name] = b; });
  const initLines: number[] = [];
  bones.forEach((b) => {
    if (b.parent && boneMapInit[b.parent]) {
      initLines.push(...b.position, ...boneMapInit[b.parent].position);
    }
  });

  return (
    <group ref={groupRef}>
      {initLines.length > 0 && (
        <lineSegments>
          <bufferGeometry ref={geoRef}>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(initLines), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#00e5ff" transparent opacity={0.85} />
        </lineSegments>
      )}
      {bones.map((b, i) => (
        <mesh
          key={b.name}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={(el: any) => { meshRefs.current[i] = el; }}
          position={b.position}
        >
          <sphereGeometry args={[0.032, 8, 8]} />
          <meshBasicMaterial
            color={clipType === "turntable" ? "#a78bfa" : "#ffffff"}
          />
        </mesh>
      ))}
    </group>
  );
}
