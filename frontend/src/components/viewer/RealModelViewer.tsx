import { Suspense } from "react";
import { useGLTF } from "@react-three/drei";

function GLBScene({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

interface RealModelViewerProps {
  url: string;
}

export default function RealModelViewer({ url }: RealModelViewerProps) {
  return (
    <Suspense fallback={null}>
      <GLBScene url={url} />
    </Suspense>
  );
}
