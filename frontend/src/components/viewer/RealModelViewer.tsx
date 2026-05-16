import { Suspense, useEffect, useRef, Component, ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export interface ModelStats {
  meshCount: number;
  materialCount: number;
  triangleEstimate: number;
  boundingBoxSize: { x: number; y: number; z: number };
}

interface GLBSceneProps {
  url: string;
  onStats?: (stats: ModelStats) => void;
  onNormalized?: () => void;
}

function GLBScene({ url, onStats, onNormalized }: GLBSceneProps) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const group = groupRef.current;
    if (!group || doneRef.current) return;

    const box = new THREE.Box3().setFromObject(group);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 2.0 / maxDim : 1;

    group.scale.setScalar(scale);
    group.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

    doneRef.current = true;
    onNormalized?.();

    if (onStats) {
      let meshCount = 0;
      let triCount = 0;
      const materials = new Set<THREE.Material>();

      group.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          meshCount++;
          const geo = (obj as THREE.Mesh).geometry;
          if (geo.index) triCount += geo.index.count / 3;
          else if (geo.attributes.position) triCount += geo.attributes.position.count / 3;
          const mat = (obj as THREE.Mesh).material;
          if (Array.isArray(mat)) mat.forEach((m) => materials.add(m));
          else if (mat) materials.add(mat);
        }
      });

      onStats({
        meshCount,
        materialCount: materials.size,
        triangleEstimate: Math.round(triCount),
        boundingBoxSize: { x: +size.x.toFixed(2), y: +size.y.toFixed(2), z: +size.z.toFixed(2) },
      });
    }
  }, [scene, onStats, onNormalized]);

  // Reset normalization flag when URL changes
  useEffect(() => {
    doneRef.current = false;
  }, [url]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

// Error boundary for GLB load failures
class GLBErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

interface RealModelViewerProps {
  url: string;
  onStats?: (stats: ModelStats) => void;
  onNormalized?: () => void;
  onError?: () => void;
}

export default function RealModelViewer({ url, onStats, onNormalized, onError }: RealModelViewerProps) {
  return (
    <GLBErrorBoundary onError={onError ?? (() => {})}>
      <Suspense fallback={null}>
        <GLBScene url={url} onStats={onStats} onNormalized={onNormalized} />
      </Suspense>
    </GLBErrorBoundary>
  );
}
