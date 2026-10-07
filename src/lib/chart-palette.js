import { resolveActiveTheme } from "@/lib/themes";

/**
 * Series colours for the gradesheet charts.
 *
 * Recharts and the hand-rolled mobile SVG both take literal colour strings, and
 * the legend plus the tooltip paint from the same values — so the palette is
 * picked in JS rather than in CSS.
 *
 * `base` is exactly what the charts have always used, unchanged, for Light and
 * Dark. `vanilla` keeps Vanilla Proyas inside its own palette: the cumulative
 * CGPA line takes the espresso colour of the site header, the semester bars and
 * the projected line sit on the terracotta ramp, and the dots use the surface
 * tone instead of pure white.
 */
export const CHART_PALETTES = {
  base: {
    grid: "#374151",
    tick: "#6b7280",
    cursor: "#3b82f6",
    bar: "#93c5fd",
    line: "#2563eb",
    projected: "#10b981",
    dot: "#ffffff",
  },
  vanilla: {
    grid: "#c9b896",
    tick: "#6f6158",
    cursor: "#fbe9e2",
    bar: "#d4744f",
    line: "#4b3935", // the espresso header colour
    projected: "#c2512f",
    dot: "#fcf8ef",
  },
};

/** Palette for the theme that is actually showing (falls back to `base`). */
export function chartPalette(theme, resolvedTheme) {
  return CHART_PALETTES[resolveActiveTheme(theme, resolvedTheme)] ?? CHART_PALETTES.base;
}
