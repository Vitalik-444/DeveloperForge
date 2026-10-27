import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en, type Dict } from "./en";
import { ru } from "./ru";

export type Lang = "en" | "ru";
export type TKey = keyof Dict;

export const LANG_KEY = "noir-lang-v1";

export const LANGUAGES: { code: Lang; label: string; short: string }[] = [
  { code: "en", label: "English", short: "EN" },
  { code: "ru", label: "Русский", short: "RU" },
];

const DICTS: Record<Lang, Dict> = { en, ru };

function isLang(value: unknown): value is Lang {
  return value === "en" || value === "ru";
}

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (isLang(saved)) return saved;
  } catch {
  }
  const browser = (typeof navigator !== "undefined" ? navigator.language : "").toLowerCase();
  return /^(ru|uk|be)/.test(browser) ? "ru" : "en";
}

type Vars = Record<string, string | number>;

interface I18nValue {
  lang: Lang;
  locale: string;
  setLang: (lang: Lang) => void;
  t: (key: TKey, vars?: Vars) => string;
  tn: (key: TKey, n: number, vars?: Vars) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function format(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === LANG_KEY && isLang(event.newValue)) setLangState(event.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo<I18nValue>(() => {
    const dict = DICTS[lang];
    const t = (key: TKey, vars?: Vars) => format(dict[key] ?? en[key], vars);
    const tn = (key: TKey, n: number, vars?: Vars) => {
      const forms = (dict[key] ?? en[key]).split("|");
      const form = forms[n === 1 ? 0 : 1] ?? forms[0];
      return format(form, { n, ...vars });
    };
    return { lang, locale: lang === "ru" ? "ru-RU" : "en", setLang, t, tn };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return value;
}
