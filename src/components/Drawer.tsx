import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Compass, Heart, History, LayoutGrid, Settings as SettingsIcon, Shield, Users, X } from "lucide-react";
import { CATEGORIES } from "../data/catalog";

const QUICK_SLUGS = ["amateur", "blonde", "brunette", "milf", "lesbian", "pov", "lingerie", "stockings", "doggystyle", "outdoor", "massage", "4k"];
import { LANGUAGES, useI18n } from "../i18n";
import SourceSwitch from "./SourceSwitch";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  view: string;
  favoritesCount: number;
  watchLaterCount: number;
  historyCount: number;
  onPickTerm: (term: string) => void;
}

export default function Drawer({ open, onClose, view, favoritesCount, watchLaterCount, historyCount, onPickTerm }: DrawerProps) {
  const { t, lang, setLang } = useI18n();
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <div className={open ? "drawer-root is-open" : "drawer-root"} aria-hidden={!open}>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer-panel" role="dialog" aria-modal="true" aria-label={t("nav.navigation")}>
        <div className="drawer-top">
          <span className="drawer-title">{t("nav.menu")}</span>
          <button className="icon-button" onClick={onClose} aria-label={t("nav.closeMenu")}><X size={18} /></button>
        </div>

        <nav className="drawer-nav">
          <Link to="/" className={view === "discover" ? "drawer-link active" : "drawer-link"} onClick={onClose}>
            <span className="drawer-num">01</span><Compass size={18} /> {t("nav.discover")}
          </Link>
          <Link to="/categories" className={view === "categories" ? "drawer-link active" : "drawer-link"} onClick={onClose}>
            <span className="drawer-num">02</span><LayoutGrid size={18} /> {t("nav.categories")}
          </Link>
          <Link to="/actresses" className={view === "actresses" ? "drawer-link active" : "drawer-link"} onClick={onClose}>
            <span className="drawer-num">03</span><Users size={18} /> {t("nav.actresses")}
          </Link>
          <Link to="/favorites" className={view === "favorites" ? "drawer-link active" : "drawer-link"} onClick={onClose}>
            <span className="drawer-num">04</span><Heart size={18} /> {t("nav.favorites")} <span className="nav-count">{favoritesCount}</span>
          </Link>
          <Link to="/watch-later" className={view === "watchlater" ? "drawer-link active" : "drawer-link"} onClick={onClose}>
            <span className="drawer-num">05</span><Clock size={18} /> {t("nav.watchLater")} <span className="nav-count">{watchLaterCount}</span>
          </Link>
          <Link to="/history" className={view === "history" ? "drawer-link active" : "drawer-link"} onClick={onClose}>
            <span className="drawer-num">06</span><History size={18} /> {t("nav.history")} <span className="nav-count">{historyCount}</span>
          </Link>
          <Link to="/settings" className={view === "settings" ? "drawer-link active" : "drawer-link"} onClick={onClose}>
            <span className="drawer-num">07</span><SettingsIcon size={18} /> {t("nav.settings")}
          </Link>
        </nav>

        <div className="drawer-section">
          <SourceSwitch />
          <div className="lang-switch drawer-lang" role="group" aria-label="Language">
            {LANGUAGES.map((item) => (
              <button
                key={item.code}
                type="button"
                className={lang === item.code ? "lang-option active" : "lang-option"}
                aria-pressed={lang === item.code}
                title={item.label}
                onClick={() => setLang(item.code)}
              >
                {item.short}
              </button>
            ))}
          </div>
        </div>

        <div className="drawer-section">
          <p className="drawer-label">{t("drawer.quick")}</p>
          <div className="drawer-chips">
            {QUICK_SLUGS.map((slug) => CATEGORIES.find((item) => item.slug === slug)).filter((item): item is NonNullable<typeof item> => Boolean(item)).map((item) => (
              <button key={item.slug} className="quick-chip" onClick={() => onPickTerm(item.slug)}>{item.label[lang]}</button>
            ))}
          </div>
        </div>

        <div className="drawer-foot"><Shield size={13} /> {t("drawer.foot")}</div>
      </aside>
    </div>
  );
}
