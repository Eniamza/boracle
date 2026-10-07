/**
 * The app's colour themes — one source of truth for next-themes and the theme
 * switcher UI.
 *
 * `id` is written straight onto `<html class="…">` (next-themes runs with
 * `attribute="class"`), so it has to match the selector defined in globals.css.
 *
 * `swatch` is the two-tone preview the switcher draws, [left half, right half]:
 * that theme's own surface colour and its own accent. Dark and Light are not new
 * colours — each pair is taken from the values those themes already use.
 */
export const THEMES = [
  {
    id: "light",
    label: "Light",
    // :root --background (#FFFFFF) + the app's light-mode blue (bg-blue-600).
    swatch: ["#FFFFFF", "#2563EB"],
  },
  {
    id: "vanilla",
    label: "Vanilla Proyas · Triple Cream, Caramel Drizzle, Espresso on Top",
    // Brand vanilla page + terracotta accent. The label is the disc's tooltip
    // and accessible name, so it can be as long as it wants — nothing renders
    // it as visible text.
    swatch: ["#F0E7D5", "#C2512F"],
  },
  {
    id: "dark",
    label: "Dark",
    // .dark --background (oklch 0.145 → #0A0A0A) + the app's dark-mode blue.
    swatch: ["#0A0A0A", "#1E3A8A"],
  },
];

export const THEME_IDS = THEMES.map(({ id }) => id);

/** Matches `defaultTheme` on the providers — deliberately not "first entry", so
 * reordering the list for the switcher UI cannot change the fallback. */
export const DEFAULT_THEME = "dark";

/**
 * Which swatch counts as active. An explicit choice wins; with `theme="system"`
 * we fall through to whatever next-themes resolved the OS preference to.
 */
export function resolveActiveTheme(theme, resolvedTheme) {
  return (
    [theme, resolvedTheme].find((candidate) => THEME_IDS.includes(candidate)) ??
    DEFAULT_THEME
  );
}
