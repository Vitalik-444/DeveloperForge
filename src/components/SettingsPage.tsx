import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { LANGUAGES, useI18n, type TKey } from "../i18n";
import type { VideoOrder } from "../services/videoApi";
import { ORDERS, SOURCES, THEMES, THEME_COLORS, useSettings, type Theme } from "../settings";
import type { Source } from "../types/video";
import { ACTRESS_THUMBS_KEY, CATEGORY_THUMBS_KEY, RECENT_KEY, TRANSLATE_KEY, WATCH_HISTORY_KEY } from "../storage";

interface SettingsPageProps {
  onClearHistory: () => void;
  onClearWatchHistory: () => void;
}

const ORDER_LABELS: Record<VideoOrder, TKey> = {
  "most-popular": "sort.popular",
  "top-weekly": "sort.weekly",
  "top-monthly": "sort.monthly",
  "top-rated": "sort.rated",
  latest: "sort.latest",
  longest: "sort.longest",
  shortest: "sort.shortest",
};

const SOURCE_LABELS: Record<Source, TKey> = {
  both: "source.both",
  eporner: "source.eporner",
  pornhub: "source.pornhub",
};

const THEME_LABELS: Record<Theme, TKey> = {
  dark: "theme.dark",
  light: "theme.light",
  system: "theme.system",
  midnight: "theme.midnight",
  forest: "theme.forest",
  crimson: "theme.crimson",
  violet: "theme.violet",
  rose: "theme.rose",
  amoled: "theme.amoled",
  sakura: "theme.sakura",
  autumn: "theme.autumn",
  halloween: "theme.halloween",
  newyear: "theme.newyear",
  snow: "theme.snow",
  desert: "theme.desert",
  love: "theme.love",
  leaves: "theme.leaves",
  ocean: "theme.ocean",
  gold: "theme.gold",
  cyber: "theme.cyber",
  lavender: "theme.lavender",
};

function swatchStyle(theme: Theme): React.CSSProperties {
  if (theme === "system") {
    return { "--sw-bg": `linear-gradient(135deg, ${THEME_COLORS.light.bg} 50%, ${THEME_COLORS.dark.bg} 50%)`, "--sw-accent": THEME_COLORS.dark.accent } as React.CSSProperties;
  }
  return { "--sw-bg": THEME_COLORS[theme].bg, "--sw-accent": THEME_COLORS[theme].accent } as React.CSSProperties;
}

interface SwitchRowProps {
  title: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function SwitchRow({ title, hint, checked, onChange }: SwitchRowProps) {
  return (
    <div className="settings-row">
      <div className="settings-text">
        <strong>{title}</strong>
        <span>{hint}</span>
      </div>
      <button type="button" role="switch" aria-checked={checked} aria-label={title} className={checked ? "switch is-on" : "switch"} onClick={() => onChange(!checked)}>
        <span className="switch-knob" />
      </button>
    </div>
  );
}

export default function SettingsPage({ onClearHistory, onClearWatchHistory }: SettingsPageProps) {
  const { t, lang, setLang } = useI18n();
  const { settings, update, reset } = useSettings();
  const [done, setDone] = useState("");

  const run = (id: string, action: () => void) => {
    action();
    setDone(id);
    window.setTimeout(() => setDone((current) => (current === id ? "" : current)), 2200);
  };

  const clearKeys = (...keys: string[]) => () => {
    for (const key of keys) {
      try {
        localStorage.removeItem(key);
      } catch {
        continue;
      }
    }
  };

  return (
    <section className="settings-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{t("settings.eyebrow")}</p>
          <h2>{t("settings.title")}</h2>
          <p className="section-subtitle">{t("settings.sub")}</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <h3>{t("settings.language")}</h3>
          <div className="settings-row column">
            <div className="settings-text"><span>{t("settings.languageHint")}</span></div>
            <div className="segmented" role="radiogroup" aria-label={t("settings.language")}>
              {LANGUAGES.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  role="radio"
                  aria-checked={lang === item.code}
                  className={lang === item.code ? "segment active" : "segment"}
                  onClick={() => setLang(item.code)}
                >
                  {lang === item.code && <Check size={14} />} {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="settings-card">
          <h3>{t("settings.appearance")}</h3>
          <div className="settings-row column">
            <div className="settings-text">
              <strong>{t("settings.theme")}</strong>
              <span>{t("settings.themeHint")}</span>
            </div>
            <div className="theme-grid" role="radiogroup" aria-label={t("settings.theme")}>
              {THEMES.map((theme) => (
                <button
                  key={theme}
                  type="button"
                  role="radio"
                  aria-checked={settings.theme === theme}
                  className={settings.theme === theme ? "theme-option active" : "theme-option"}
                  onClick={() => update({ theme })}
                >
                  <span className="theme-swatch" style={swatchStyle(theme)}>
                    <i />
                    {settings.theme === theme && <Check size={14} />}
                  </span>
                  <span className="theme-name">{t(THEME_LABELS[theme])}</span>
                </button>
              ))}
            </div>
          </div>
          <SwitchRow title={t("settings.effects")} hint={t("settings.effectsHint")} checked={settings.effects} onChange={(value) => update({ effects: value })} />
          <SwitchRow title={t("settings.blur")} hint={t("settings.blurHint")} checked={settings.blurThumbs} onChange={(value) => update({ blurThumbs: value })} />
          <SwitchRow title={t("settings.tileImages")} hint={t("settings.tileImagesHint")} checked={settings.tileImages} onChange={(value) => update({ tileImages: value })} />
        </div>

        <div className="settings-card">
          <h3>{t("settings.browsing")}</h3>
          <SwitchRow title={t("settings.translate")} hint={t("settings.translateHint")} checked={settings.translateTitles} onChange={(value) => update({ translateTitles: value })} />
          <div className="settings-row">
            <div className="settings-text">
              <strong>{t("settings.source")}</strong>
              <span>{t("settings.sourceHint")}</span>
            </div>
            <select className="settings-select" value={settings.source} aria-label={t("settings.source")} onChange={(event) => update({ source: event.target.value as Source })}>
              {SOURCES.map((item) => (
                <option key={item} value={item}>{t(SOURCE_LABELS[item])}</option>
              ))}
            </select>
          </div>
          <div className="settings-row">
            <div className="settings-text">
              <strong>{t("settings.defaultSort")}</strong>
              <span>{t("settings.defaultSortHint")}</span>
            </div>
            <select className="settings-select" value={settings.defaultOrder} aria-label={t("settings.defaultSort")} onChange={(event) => update({ defaultOrder: event.target.value as VideoOrder })}>
              {ORDERS.map((order) => (
                <option key={order} value={order}>{t(ORDER_LABELS[order])}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="settings-card">
          <h3>{t("settings.data")}</h3>
          <div className="settings-row">
            <div className="settings-text">
              <strong>{t("settings.clearWatchHistory")}</strong>
              <span>{t("settings.clearWatchHistoryHint")}</span>
            </div>
            <button type="button" className="button secondary small" onClick={() => run("watchHistory", () => { clearKeys(WATCH_HISTORY_KEY)(); onClearWatchHistory(); })}>
              {done === "watchHistory" ? t("settings.done") : t("settings.clear")}
            </button>
          </div>
          <div className="settings-row">
            <div className="settings-text">
              <strong>{t("settings.clearHistory")}</strong>
              <span>{t("settings.clearHistoryHint")}</span>
            </div>
            <button type="button" className="button secondary small" onClick={() => run("history", () => { clearKeys(RECENT_KEY)(); onClearHistory(); })}>
              {done === "history" ? t("settings.done") : t("settings.clear")}
            </button>
          </div>
          <div className="settings-row">
            <div className="settings-text">
              <strong>{t("settings.clearCache")}</strong>
              <span>{t("settings.clearCacheHint")}</span>
            </div>
            <button type="button" className="button secondary small" onClick={() => run("cache", clearKeys(CATEGORY_THUMBS_KEY, ACTRESS_THUMBS_KEY, TRANSLATE_KEY))}>
              {done === "cache" ? t("settings.done") : t("settings.clear")}
            </button>
          </div>
        </div>
      </div>

      <button type="button" className="button ghost settings-reset" onClick={() => run("reset", reset)}>
        <RotateCcw size={15} /> {done === "reset" ? t("settings.done") : t("settings.reset")}
      </button>
    </section>
  );
}
