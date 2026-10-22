"use client";

import { useSyncExternalStore } from "react";

type Mode = "system" | "light" | "dark";
const KEY = "bz-theme";
const OPTIONS: { value: Mode; label: string }[] = [
  { value: "system", label: "Auto" },
  { value: "light", label: "Clair" },
  { value: "dark", label: "Sombre" },
];

const listeners = new Set<() => void>();

function read(): Mode {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function apply(mode: Mode) {
  try {
    if (mode === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, mode);
  } catch {}
  const root = document.documentElement;
  if (mode === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", mode);
  listeners.forEach((l) => l());
}

export function ThemeToggle() {
  const mode = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => "system" as Mode,
  );

  return (
    <div className="rsvp" role="group" aria-label="Thème">
      {OPTIONS.map((o) => (
        <button key={o.value} type="button" aria-pressed={mode === o.value} data-v="theme" onClick={() => apply(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Script inline du <head> : applique le thème choisi avant le premier rendu. */
export const themeScript = `try{var t=localStorage.getItem("${KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;
