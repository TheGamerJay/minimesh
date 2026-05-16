import { EnvironmentPreset, ENVIRONMENT_PRESETS } from "../../lib/viewerEnvironments";

interface Props {
  preset?: EnvironmentPreset;
  exposure?: number;
}

export default function EnvironmentLights({ preset = "studio_dark", exposure = 1 }: Props) {
  const env = ENVIRONMENT_PRESETS[preset];
  const intensityScale = exposure;

  return (
    <>
      <color attach="background" args={[env.bg]} />
      <ambientLight color={env.ambient.color} intensity={env.ambient.intensity * intensityScale} />
      {env.lights.map((light, i) => {
        if (light.type === "directional") {
          return (
            <directionalLight
              key={i}
              position={light.position}
              color={light.color}
              intensity={light.intensity * intensityScale}
              castShadow={i === 0}
            />
          );
        }
        return (
          <pointLight
            key={i}
            position={light.position}
            color={light.color}
            intensity={light.intensity * intensityScale}
            distance={light.distance}
          />
        );
      })}
    </>
  );
}
