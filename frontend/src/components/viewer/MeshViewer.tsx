import { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import EnvironmentLights from "./EnvironmentLights";
import PlaceholderMesh from "./PlaceholderMesh";
import RealModelViewer from "./RealModelViewer";
import SkeletonOverlay from "../rig/SkeletonOverlay";
import { RigBone } from "../../lib/rigs";
import { MaterialProfile } from "../../lib/materials";

type MaterialMode = "solid" | "wireframe" | "toon";

interface MeshViewerProps {
  materialMode: MaterialMode;
  autoRotate: boolean;
  showGrid: boolean;
  resetTrigger: number;
  showSkeleton?: boolean;
  skeletonBones?: RigBone[];
  materialProfile?: MaterialProfile | null;
  modelUrl?: string | null;
  modelType?: "glb" | "gltf" | "obj" | "fbx" | null;
}

function SceneContents({
  materialMode,
  autoRotate,
  showGrid,
  resetTrigger,
  showSkeleton,
  skeletonBones,
  materialProfile,
  modelUrl,
  modelType,
}: {
  materialMode: MaterialMode;
  autoRotate: boolean;
  showGrid: boolean;
  resetTrigger: number;
  showSkeleton?: boolean;
  skeletonBones?: RigBone[];
  materialProfile?: MaterialProfile | null;
  modelUrl?: string | null;
  modelType?: "glb" | "gltf" | "obj" | "fbx" | null;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (resetTrigger > 0 && controlsRef.current) {
      controlsRef.current.reset();
    }
  }, [resetTrigger]);

  const showReal = !!modelUrl && (modelType === "glb" || modelType === "gltf");

  return (
    <>
      <color attach="background" args={["#0c0c14"]} />

      <EnvironmentLights />

      {showReal ? (
        <RealModelViewer url={modelUrl!} />
      ) : (
        <PlaceholderMesh materialMode={materialMode} materialProfile={materialProfile} />
      )}

      {showSkeleton && skeletonBones && skeletonBones.length > 0 && (
        <SkeletonOverlay bones={skeletonBones} />
      )}

      {showGrid && (
        <gridHelper
          args={[12, 24, "#1e293b", "#0f172a"]}
          position={[0, -0.42, 0]}
        />
      )}

      <OrbitControls
        ref={controlsRef}
        autoRotate={autoRotate}
        autoRotateSpeed={1.2}
        enableDamping
        dampingFactor={0.06}
        minDistance={1.5}
        maxDistance={22}
        makeDefault
      />
    </>
  );
}

export default function MeshViewer({
  materialMode,
  autoRotate,
  showGrid,
  resetTrigger,
  showSkeleton,
  skeletonBones,
  materialProfile,
  modelUrl,
  modelType,
}: MeshViewerProps) {
  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true }}
        camera={{ position: [0, 1.1, 4.2], fov: 44 }}
        shadows
      >
        <SceneContents
          materialMode={materialMode}
          autoRotate={autoRotate}
          showGrid={showGrid}
          resetTrigger={resetTrigger}
          showSkeleton={showSkeleton}
          skeletonBones={skeletonBones}
          materialProfile={materialProfile}
          modelUrl={modelUrl}
          modelType={modelType}
        />
      </Canvas>
    </div>
  );
}
