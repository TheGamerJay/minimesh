import { Suspense, useEffect, useRef, useMemo, Component, ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export interface ModelStats {
  meshCount: number;
  materialCount: number;
  triangleEstimate: number;
  boundingBoxSize: { x: number; y: number; z: number };
}

// Maps PBR slot names to MeshStandardMaterial property keys
const SLOT_MAP: Record<string, (mat: THREE.MeshStandardMaterial, tex: THREE.Texture) => void> = {
  albedo:    (m, t) => { m.map = t; },
  normal:    (m, t) => { m.normalMap = t; },
  roughness: (m, t) => { m.roughnessMap = t; },
  metallic:  (m, t) => { m.metalnessMap = t; },
  emissive:  (m, t) => { m.emissiveMap = t; m.emissive.set(1, 1, 1); },
  ao:        (m, t) => { m.aoMap = t; },
  opacity:   (m, t) => { m.alphaMap = t; m.transparent = true; },
};

interface GLBSceneProps {
  url: string;
  onStats?: (stats: ModelStats) => void;
  onNormalized?: () => void;
  textureUrls?: Record<string, string>;
}

function GLBScene({ url, onStats, onNormalized, textureUrls }: GLBSceneProps) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);
  const doneRef = useRef(false);

  // Normalization — runs once per loaded scene
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
  useEffect(() => { doneRef.current = false; }, [url]);

  // Texture application — apply PBR textures to all standard materials
  const textureKey = useMemo(() => JSON.stringify(textureUrls ?? {}), [textureUrls]);
  useEffect(() => {
    const group = groupRef.current;
    if (!group || !textureUrls || Object.keys(textureUrls).length === 0) return;

    const loader = new THREE.TextureLoader();
    const loaded: THREE.Texture[] = [];

    group.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;
      const mesh = obj as THREE.Mesh;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      mats.forEach((mat) => {
        if (!(mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) return;
        const stdMat = mat as THREE.MeshStandardMaterial;

        Object.entries(textureUrls).forEach(([slot, url]) => {
          const applyFn = SLOT_MAP[slot];
          if (!applyFn || !url) return;
          loader.load(url, (tex) => {
            tex.flipY = false;
            loaded.push(tex);
            applyFn(stdMat, tex);
            stdMat.needsUpdate = true;
          });
        });
      });
    });

    return () => { loaded.forEach((t) => t.dispose()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textureKey, scene]);

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
  textureUrls?: Record<string, string>;  // Phase 18: PBR texture application
}

export default function RealModelViewer({ url, onStats, onNormalized, onError, textureUrls }: RealModelViewerProps) {
  return (
    <GLBErrorBoundary onError={onError ?? (() => {})}>
      <Suspense fallback={null}>
        <GLBScene url={url} onStats={onStats} onNormalized={onNormalized} textureUrls={textureUrls} />
      </Suspense>
    </GLBErrorBoundary>
  );
}
