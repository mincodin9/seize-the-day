export type AppScheme = "light" | "dark";

export const colors = {
  light: {
    bg: "#EFF3FA",
    card: "#FFFFFF",
    text: "#111111",
    muted: "rgba(17,17,17,0.7)",
    border: "#E5E7EB",
    surface: "#F3F4F6",
  },
  dark: {
    bg: "#0B1220",
    card: "#111827",
    text: "#F9FAFB",
    muted: "rgba(249,250,251,0.7)",
    border: "#1F2937",
    surface: "#0F172A",
  },
} as const;
