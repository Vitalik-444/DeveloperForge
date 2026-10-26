import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpLeft, Clock, Search, TrendingUp, X } from "lucide-react";
import { POPULAR_TERMS } from "../data/catalog";
import { displayTerm, getTermPool, matchSuggestions } from "../data/search";
import { useI18n } from "../i18n";
import { RECENT_KEY } from "../storage";

function readRecent(): string[] {
  try {
    const value = localStorage.getItem(RECENT_KEY);
    return value ? (JSON.parse(value) as string[]) : [];
  } catch {
    return [];
  }
}

interface Suggestion {
  label: string;
  kind: "recent" | "popular" | "match";
}

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (term: string) => void;
  extraTerms: string[];
}

function highlight(label: string, query: string) {
  const fold = (text: string) => text.toLowerCase().replace(/ё/g, "е");
  const index = fold(label).indexOf(fold(query));
  if (!query || index < 0) return <>{label}</>;
  return (
    <>
      {label.slice(0, index)}
      <mark>{label.slice(index, index + query.length)}</mark>
      {label.slice(index + query.length)}
    </>
  );
}

export default function SearchBox({ value, onChange, onSubmit, extraTerms }: SearchBoxProps) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState<string[]>(readRecent);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo<Suggestion[]>(() => {
    const q = value.trim();
    if (!q) {
      const items: Suggestion[] = recent.slice(0, 5).map((label) => ({ label, kind: "recent" }));
      for (const term of POPULAR_TERMS) {
        const label = term[lang];
        if (items.length >= 10) break;
        if (!items.some((item) => item.label === label)) items.push({ label, kind: "popular" });
      }
      return items;
    }
    const pool = Array.from(new Set([...recent, ...getTermPool(lang), ...extraTerms.map((term) => displayTerm(term, lang).toLowerCase())]));
    return matchSuggestions(q, pool, lang, recent).map((item) => ({
      label: item.label,
      kind: item.recent ? "recent" : "match",
    }));
  }, [value, recent, extraTerms, lang]);

  useEffect(() => {
    setActive(-1);
  }, [value, open]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, []);

  const commit = (term: string) => {
    const clean = term.trim();
    if (clean) {
      const next = [clean.toLowerCase(), ...recent.filter((item) => item !== clean.toLowerCase())].slice(0, 8);
      setRecent(next);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        return;
      }
    }
    setOpen(false);
    inputRef.current?.blur();
    onSubmit(clean);
  };

  const removeRecent = (label: string) => {
    const next = recent.filter((item) => item !== label);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      return;
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((current) => (current + 1) % Math.max(1, suggestions.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
    } else if (event.key === "Escape") {
      setOpen(false);
    } else if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (active >= 0 && suggestions[active]) {
        onChange(suggestions[active].label);
        commit(suggestions[active].label);
      } else {
        commit(value);
      }
    }
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    commit(value);
  };

  const showPanel = open && suggestions.length > 0;

  return (
    <div className="search-wrap" ref={wrapRef}>
      <form className={showPanel ? "search-form is-open" : "search-form"} onSubmit={submit} role="search">
        <Search size={17} />
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => { onChange(event.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t("search.placeholder")}
          aria-label={t("search.aria")}
          aria-autocomplete="list"
          aria-expanded={showPanel}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          inputMode="search"
          enterKeyHint="search"
        />
        {value && (
          <button type="button" className="clear-search" onClick={() => { onChange(""); inputRef.current?.focus(); }} aria-label={t("search.clear")}>
            <X size={15} />
          </button>
        )}
        <button className="search-submit" type="submit" aria-label={t("search.submit")}>
          <span className="submit-text">{t("search.submit")}</span>
          <Search className="submit-icon" size={16} />
        </button>
      </form>

      {showPanel && (
        <div className="suggest-panel" role="listbox">
          <div className="suggest-head">
            <span>{value.trim() ? t("search.suggestions") : t("search.recentTrending")}</span>
            <span>{suggestions.length}</span>
          </div>
          {suggestions.map((item, index) => (
            <div
              key={`${item.kind}-${item.label}`}
              className={index === active ? "suggest-item active" : "suggest-item"}
              role="option"
              aria-selected={index === active}
              onMouseEnter={() => setActive(index)}
            >
              <button
                type="button"
                className="suggest-main"
                onMouseDown={(event) => event.preventDefault()}
                onPointerDown={(event) => { if (event.pointerType === "touch") event.preventDefault(); }}
                onClick={() => { onChange(item.label); commit(item.label); }}
              >
                <span className="suggest-icon">
                  {item.kind === "recent" ? <Clock size={14} /> : item.kind === "popular" ? <TrendingUp size={14} /> : <Search size={14} />}
                </span>
                <span className="suggest-label">{highlight(item.label, value.trim())}</span>
              </button>
              {item.kind === "recent" ? (
                <button type="button" className="suggest-action" onMouseDown={(event) => event.preventDefault()} onClick={() => removeRecent(item.label)} aria-label={t("search.remove", { label: item.label })}>
                  <X size={13} />
                </button>
              ) : (
                <button type="button" className="suggest-action" onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(item.label); inputRef.current?.focus(); }} aria-label={t("search.use", { label: item.label })}>
                  <ArrowUpLeft size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
