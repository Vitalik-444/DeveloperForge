import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { VideoOrder } from "./services/videoApi";
import type { Source } from "./types/video";

export type Theme = "dark" | "light" | "system" | "midnight" | "forest" | "crimson" | "violet" | "rose" | "amoled" | "sakura" | "autumn" | "halloween" | "ocean" | "gold" | "cyber" | "lavender";

export const THEMES: Theme[] = ["dark", "light", "system", "midnight", "forest", "crimson", "violet", "rose", "amoled", "sakura", "autumn", "halloween", "ocean", "gold", "cyber", "lavender"];

export const THEME_COLORS: Record<Exclude<Theme, "system">, { bg: string; accent: string }> = {
  dark: { bg: "#070707", accent: "#ff6a00" },
  light: { bg: "#f4f1ec", accent: "#e55a00" },
  midnight: { bg: "#060a14", accent: "#3b82f6" },
  forest: { bg: "#060d09", accent: "#22c55e" },
  crimson: { bg: "#0a0506", accent: "#ef233c" },
  violet: { bg: "#09060f", accent: "#a855f7" },
  rose: { bg: "#0d0609", accent: "#ff4d8d" },
  amoled: { bg: "#000000", accent: "#f5f5f5" },
  sakura: { bg: "#fdf0f3", accent: "#e8527f" },
  autumn: { bg: "#140b06", accent: "#e8832a" },
  halloween: { bg: "#0b0614", accent: "#ff7a00" },
  ocean: { bg: "#041018", accent: "#06b6d4" },
  gold: { bg: "#0c0905", accent: "#d4a73a" },
  cyber: { bg: "#08060f", accent: "#00e5ff" },
  lavender: { bg: "#f4f1fb", accent: "#7c5cdb" },
};

export interface Settings {
  theme: Theme;
  blurThumbs: boolean;
  tileImages: boolean;
  translateTitles: boolean;
  defaultOrder: VideoOrder;
  source: Source;
}

export const SETTINGS_KEY = "noir-settings-v1";

export const SOURCES: Source[] = ["both", "eporner", "pornhub"];

export const ORDERS: VideoOrder[] = ["most-popular", "top-weekly", "top-monthly", "top-rated", "latest", "longest", "shortest"];

export const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  blurThumbs: false,
  tileImages: true,
  translateTitles: true,
  defaultOrder: "most-popular",
  source: "both",
};

function readSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      theme: THEMES.includes(parsed.theme as Theme) ? (parsed.theme as Theme) : DEFAULT_SETTINGS.theme,
      blurThumbs: typeof parsed.blurThumbs === "boolean" ? parsed.blurThumbs : DEFAULT_SETTINGS.blurThumbs,
      tileImages: typeof parsed.tileImages === "boolean" ? parsed.tileImages : DEFAULT_SETTINGS.tileImages,
      translateTitles: typeof parsed.translateTitles === "boolean" ? parsed.translateTitles : DEFAULT_SETTINGS.translateTitles,
      defaultOrder: ORDERS.includes(parsed.defaultOrder as VideoOrder) ? (parsed.defaultOrder as VideoOrder) : DEFAULT_SETTINGS.defaultOrder,
      source: SOURCES.includes(parsed.source as Source) ? (parsed.source as Source) : DEFAULT_SETTINGS.source,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

interface SettingsValue {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(readSettings);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      return;
    }
  }, [settings]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const apply = () => {
      const resolved: Exclude<Theme, "system"> = settings.theme === "system" ? (media.matches ? "light" : "dark") : settings.theme;
      document.documentElement.dataset.theme = resolved;
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[resolved].bg);
      document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", resolved === "light" || resolved === "sakura" || resolved === "lavender" ? "light" : "dark");
    };
    apply();
    if (settings.theme !== "system") return;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [settings.theme]);

  const update = useCallback((patch: Partial<Settings>) => setSettings((current) => ({ ...current, ...patch })), []);
  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  const value = useMemo(() => ({ settings, update, reset }), [settings, update, reset]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error("useSettings must be used inside <SettingsProvider>");
  return value;
}
