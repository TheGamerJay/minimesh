export default function EnvironmentLights() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 5]} intensity={1.4} castShadow />
      <directionalLight position={[-4, 3, -4]} intensity={0.5} color="#7c3aed" />
      <pointLight position={[0, 4, 3]} intensity={0.8} color="#06b6d4" distance={12} />
      <pointLight position={[2, 1, -2]} intensity={0.3} color="#818cf8" distance={8} />
    </>
  );
}
