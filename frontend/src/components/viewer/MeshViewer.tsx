import { useEffect, useRef, MutableRefObject } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import EnvironmentLights from "./EnvironmentLights";
import PlaceholderMesh from "./PlaceholderMesh";
import RealModelViewer, { ModelStats } from "./RealModelViewer";
import SkeletonOverlay from "../rig/SkeletonOverlay";
import GizmoOverlay from "../editing/GizmoOverlay";
import { RigBone } from "../../lib/rigs";
import { MaterialProfile } from "../../lib/materials";
import { EnvironmentPreset, CAMERA_PRESETS } from "../../lib/viewerEnvironments";

type MaterialMode = "solid" | "wireframe" | "toon";

export interface MeshViewerProps {
  materialMode: MaterialMode;
  autoRotate: boolean;
  showGrid: boolean;
  resetTrigger: number;
  showSkeleton?: boolean;
  skeletonBones?: RigBone[];
  materialProfile?: MaterialProfile | null;
  modelUrl?: string | null;
  modelType?: "glb" | "gltf" | "obj" | "fbx" | null;
  // Phase 17
  environment?: EnvironmentPreset;
  exposure?: number;
  turntableActive?: boolean;
  turntableSpeed?: number;
  cameraPreset?: string | null;
  onCameraPresetDone?: () => void;
  screenshotRef?: MutableRefObject<(() => void) | null>;
  onModelStats?: (stats: ModelStats) => void;
  onGlbError?: () => void;
  onGlbNormalized?: () => void;
  gridOpacity?: number;
  textureUrls?: Record<string, string>;   // Phase 18: PBR texture URLs
  editMode?: boolean;                      // Phase 20: show gizmo overlay
}

// Fills screenshotRef.current with a capture function that works from inside the Canvas
function ScreenshotCapture({ screenshotRef }: { screenshotRef: MutableRefObject<(() => void) | null> }) {
  const { gl } = useThree();
  useEffect(() => {
    screenshotRef.current = () => {
      const dataUrl = gl.domElement.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `minimesh_capture_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    return () => { screenshotRef.current = null; };
  }, [gl, screenshotRef]);
  return null;
}

// Smooth camera transition to named presets
function CameraController({
  preset,
  onDone,
  controlsRef,
}: {
  preset: string | null;
  onDone?: () => void;
  controlsRef: MutableRefObject<any>;
}) {
  const { camera } = useThree();
  const targetPos = useRef<THREE.Vector3 | null>(null);
  const targetLook = useRef<THREE.Vector3 | null>(null);
  const active = useRef(false);

  useEffect(() => {
    if (!preset) return;
    const p = CAMERA_PRESETS[preset];
    if (!p) return;
    targetPos.current = new THREE.Vector3(...p.position);
    targetLook.current = new THREE.Vector3(...p.target);
    active.current = true;
  }, [preset]);

  useFrame(() => {
    if (!active.current || !targetPos.current || !targetLook.current) return;
    const controls = controlsRef.current;

    camera.position.lerp(targetPos.current, 0.1);
    if (controls) {
      controls.target.lerp(targetLook.current, 0.1);
      controls.update();
    }

    if (camera.position.distanceTo(targetPos.current) < 0.02) {
      camera.position.copy(targetPos.current);
      if (controls) {
        controls.target.copy(targetLook.current);
        controls.update();
      }
      active.current = false;
      onDone?.();
    }
  });

  return null;
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
  environment,
  exposure,
  turntableActive,
  turntableSpeed,
  cameraPreset,
  onCameraPresetDone,
  screenshotRef,
  onModelStats,
  onGlbError,
  onGlbNormalized,
  textureUrls,
  editMode,
  glbFailed,
}: MeshViewerProps & { glbFailed: boolean }) {
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (resetTrigger > 0 && controlsRef.current) {
      controlsRef.current.reset();
    }
  }, [resetTrigger]);

  const showReal = !glbFailed && !!modelUrl && (modelType === "glb" || modelType === "gltf");
  const gridColor1 = `#1e293b`;
  const gridColor2 = `#0f172a`;

  return (
    <>
      <EnvironmentLights preset={environment} exposure={exposure} />

      {showReal ? (
        <RealModelViewer
          url={modelUrl!}
          onStats={onModelStats}
          onNormalized={onGlbNormalized}
          onError={onGlbError}
          textureUrls={textureUrls}
        />
      ) : (
        <PlaceholderMesh materialMode={materialMode} materialProfile={materialProfile} />
      )}

      {showSkeleton && skeletonBones && skeletonBones.length > 0 && (
        <SkeletonOverlay bones={skeletonBones} />
      )}

      {editMode && <GizmoOverlay visible />}

      {showGrid && (
        <gridHelper
          args={[12, 24, gridColor1, gridColor2]}
          position={[0, -0.42, 0]}
        />
      )}

      <OrbitControls
        ref={controlsRef}
        autoRotate={autoRotate || turntableActive}
        autoRotateSpeed={turntableActive ? (turntableSpeed ?? 1.2) : 1.2}
        enableDamping
        dampingFactor={0.06}
        minDistance={1.5}
        maxDistance={22}
        makeDefault
      />

      {cameraPreset && (
        <CameraController
          preset={cameraPreset}
          onDone={onCameraPresetDone}
          controlsRef={controlsRef}
        />
      )}

      {screenshotRef && <ScreenshotCapture screenshotRef={screenshotRef} />}
    </>
  );
}

export default function MeshViewer(props: MeshViewerProps & { glbFailed?: boolean }) {
  const { glbFailed = false, ...rest } = props;

  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        camera={{ position: [0, 1.1, 4.2], fov: 44 }}
        shadows
      >
        <SceneContents {...rest} glbFailed={glbFailed} />
      </Canvas>
    </div>
  );
}
