"use client";

import * as React from "react";
import { Moon, Palette, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { THEMES, resolveActiveTheme } from "@/lib/themes";
import { cn } from "@/lib/utils";

/**
 * Theme switcher: closed it is the familiar single icon button; tapping it
 * spreads the themes out side by side as two-tone circles — each half the
 * theme's surface colour, half its accent. Choosing one applies it and folds the
 * row back up.
 */

/** [left half, right half] → 50/50 split circle. */
function swatchStyle([surface, accent]) {
  return { background: `linear-gradient(90deg, ${surface} 50%, ${accent} 50%)` };
}

// Same look the toggle always had, so Dark and Light are untouched.
const TRIGGER_CLASS =
  "bg-white dark:bg-blue-900 hover:bg-gray-100 dark:hover:bg-blue-800 transition-all duration-300";

export function ThemeSwitcher() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);
  const discRefs = React.useRef({});

  const active = resolveActiveTheme(theme, resolvedTheme);

  // Avoid hydration mismatch: next-themes has nothing to report until it has
  // read the stored preference off the document.
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Clicking past the row, or pressing Escape, folds it back into the button.
  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Land the cursor on the current theme when the row opens, so Enter keeps the
  // existing choice and Tab reaches the other two.
  React.useEffect(() => {
    if (open) discRefs.current[active]?.focus();
  }, [open, active]);

  if (!mounted) {
    return (
      <Button className={TRIGGER_CLASS} variant="outline" size="icon">
        <span className="sr-only">Change theme</span>
      </Button>
    );
  }

  const chooseTheme = (id) => {
    setTheme(id);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      {/* Anchored to the button's bottom-right corner, so the row grows leftwards
          and stays on screen from either placement (header / floating). */}
      <div
        role="group"
        aria-label="Colour themes"
        className={cn(
          "absolute right-0 bottom-0 z-50 flex items-center gap-1.5 rounded-full border bg-white p-1 shadow-sm",
          "border-neutral-200 dark:border-neutral-800 dark:bg-blue-900",
          "origin-bottom-right transition-all duration-300 ease-out",
          "motion-reduce:transition-none",
          open ? "scale-100 opacity-100" : "pointer-events-none scale-75 opacity-0",
        )}
      >
        {THEMES.map(({ id, label, swatch }, index) => (
          <button
            key={id}
            ref={(node) => {
              discRefs.current[id] = node;
            }}
            type="button"
            onClick={() => chooseTheme(id)}
            title={label}
            aria-label={
              id === active ? `${label} — currently active` : `Switch to ${label}`
            }
            aria-pressed={id === active}
            tabIndex={open ? 0 : -1}
            style={{ ...swatchStyle(swatch), transitionDelay: open ? `${index * 45}ms` : "0ms" }}
            className={cn(
              "size-7 shrink-0 cursor-pointer rounded-full outline-1 -outline-offset-1 outline-black/10",
              "transition-all duration-300 ease-out hover:scale-110",
              "motion-reduce:transition-none motion-reduce:[transition-delay:0ms]",
              "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-neutral-500",
              open ? "scale-100 opacity-100" : "pointer-events-none scale-0 opacity-0",
              id === active && "outline-neutral-900/70 dark:outline-white/70",
            )}
          />
        ))}
      </div>

      <Button
        onClick={() => setOpen((value) => !value)}
        className={cn(TRIGGER_CLASS, open && "pointer-events-none scale-0 opacity-0")}
        variant="outline"
        size="icon"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0 vanilla:-rotate-90 vanilla:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100" />
        <Palette className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-500 vanilla:rotate-0 vanilla:scale-100" />
        <span className="sr-only">Change theme</span>
      </Button>
    </div>
  );
}
