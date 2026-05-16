export type EnvironmentPreset =
  | "studio_dark"
  | "neon_cyan"
  | "purple_void"
  | "sunset"
  | "hdr_neutral";

export interface LightDef {
  type: "directional" | "point";
  position: [number, number, number];
  color: string;
  intensity: number;
  distance?: number;
}

export interface EnvConfig {
  label: string;
  bg: string;
  ambient: { color: string; intensity: number };
  lights: LightDef[];
}

export const ENVIRONMENT_PRESETS: Record<EnvironmentPreset, EnvConfig> = {
  studio_dark: {
    label: "Studio Dark",
    bg: "#0c0c14",
    ambient: { color: "#ffffff", intensity: 0.35 },
    lights: [
      { type: "directional", position: [5, 8, 5], color: "#ffffff", intensity: 1.4 },
      { type: "directional", position: [-4, 3, -4], color: "#7c3aed", intensity: 0.5 },
      { type: "point", position: [0, 4, 3], color: "#06b6d4", intensity: 0.8, distance: 12 },
      { type: "point", position: [2, 1, -2], color: "#818cf8", intensity: 0.3, distance: 8 },
    ],
  },
  neon_cyan: {
    label: "Neon Cyan",
    bg: "#020d12",
    ambient: { color: "#0891b2", intensity: 0.4 },
    lights: [
      { type: "directional", position: [5, 8, 5], color: "#ffffff", intensity: 0.8 },
      { type: "directional", position: [-4, 3, -4], color: "#22d3ee", intensity: 0.9 },
      { type: "point", position: [0, 4, 3], color: "#06b6d4", intensity: 1.5, distance: 15 },
      { type: "point", position: [-2, 1, 2], color: "#0ea5e9", intensity: 1.0, distance: 10 },
    ],
  },
  purple_void: {
    label: "Purple Void",
    bg: "#06020e",
    ambient: { color: "#6d28d9", intensity: 0.3 },
    lights: [
      { type: "directional", position: [5, 8, 5], color: "#c4b5fd", intensity: 0.7 },
      { type: "directional", position: [-4, 3, -4], color: "#7c3aed", intensity: 1.0 },
      { type: "point", position: [0, 4, 3], color: "#a78bfa", intensity: 1.2, distance: 12 },
      { type: "point", position: [2, 1, -2], color: "#8b5cf6", intensity: 0.8, distance: 8 },
    ],
  },
  sunset: {
    label: "Sunset",
    bg: "#1a0a00",
    ambient: { color: "#f97316", intensity: 0.3 },
    lights: [
      { type: "directional", position: [5, 3, 5], color: "#fbbf24", intensity: 1.2 },
      { type: "directional", position: [-5, 5, -3], color: "#f97316", intensity: 0.6 },
      { type: "point", position: [3, 2, 3], color: "#fb923c", intensity: 1.0, distance: 15 },
      { type: "point", position: [-2, 1, -2], color: "#e11d48", intensity: 0.5, distance: 10 },
    ],
  },
  hdr_neutral: {
    label: "HDR Neutral",
    bg: "#111111",
    ambient: { color: "#ffffff", intensity: 0.6 },
    lights: [
      { type: "directional", position: [5, 10, 5], color: "#ffffff", intensity: 1.8 },
      { type: "directional", position: [-5, 5, -5], color: "#e2e8f0", intensity: 0.4 },
      { type: "point", position: [0, 5, 0], color: "#ffffff", intensity: 0.6, distance: 20 },
    ],
  },
};

export const CAMERA_PRESETS: Record<
  string,
  { position: [number, number, number]; target: [number, number, number] }
> = {
  front: { position: [0, 0, 3.5], target: [0, 0, 0] },
  back: { position: [0, 0, -3.5], target: [0, 0, 0] },
  left: { position: [-3.5, 0, 0], target: [0, 0, 0] },
  right: { position: [3.5, 0, 0], target: [0, 0, 0] },
  top: { position: [0, 4, 0.001], target: [0, 0, 0] },
  iso: { position: [2.2, 2.2, 2.2], target: [0, 0, 0] },
};
