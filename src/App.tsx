import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, matchPath, useLocation, useNavigate } from "react-router-dom";
import {
  Bookmark, Check, ChevronLeft, ChevronRight, CircleAlert, Clock, Compass, Flame,
  Heart, History as HistoryIcon, LayoutGrid, Menu, Play, Trash2, Settings as SettingsIcon, Shield, Users, Zap,
} from "lucide-react";
import ActressList from "./components/ActressList";
import AgeGate from "./components/AgeGate";
import CategoryGrid from "./components/CategoryGrid";
import Drawer from "./components/Drawer";
import SearchBox from "./components/SearchBox";
import SettingsPage from "./components/SettingsPage";
import SourceSwitch from "./components/SourceSwitch";
import VideoCard from "./components/VideoCard";
import WatchPage from "./components/WatchPage";
import { ACTRESSES, CATEGORIES, CATEGORY_GROUPS, categoriesOfGroup, OTHER_ACTRESSES, RUSSIAN_ACTRESSES } from "./data/catalog";
import { displayTerm, resolveTerm, resolveTermAsync } from "./data/search";
import { useI18n } from "./i18n";
import { searchVideos, type VideoOrder } from "./services/videoApi";
import ThemeEffects from "./components/ThemeEffects";
import { useSettings } from "./settings";
import { WATCH_HISTORY_KEY, WATCH_HISTORY_LIMIT, WATCH_LATER_KEY } from "./storage";
import type { Video } from "./types/video";

const FAVORITES_KEY = "noir-favorites-v1";
const AGE_KEY = "noir-age-confirmed-v1";
const LEGACY_FAVORITES_KEY = "velvet-favorites-v1";
type View = "discover" | "categories" | "actresses" | "favorites" | "watchlater" | "history" | "watch" | "settings";

type PageItem = number | "ellipsis-left" | "ellipsis-right";

function getPageItems(current: number, total: number): PageItem[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  if (current <= 4) return [1, 2, 3, 4, 5, "ellipsis-right", total];
  if (current >= total - 3) return [1, "ellipsis-left", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "ellipsis-left", current - 1, current, current + 1, "ellipsis-right", total];
}

function readFavorites(): Video[] {
  try {
    const value = localStorage.getItem(FAVORITES_KEY) ?? localStorage.getItem(LEGACY_FAVORITES_KEY);
    return value ? (JSON.parse(value) as Video[]) : [];
  } catch {
    return [];
  }
}

function readWatchLater(): Video[] {
  try {
    const value = localStorage.getItem(WATCH_LATER_KEY);
    return value ? (JSON.parse(value) as Video[]) : [];
  } catch {
    return [];
  }
}

function readHistory(): Video[] {
  try {
    const value = localStorage.getItem(WATCH_HISTORY_KEY);
    const parsed = value ? (JSON.parse(value) as Video[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function App() {
  const { t, tn, lang, locale } = useI18n();
  const { settings, update } = useSettings();
  const [ageConfirmed, setAgeConfirmed] = useState(() => sessionStorage.getItem(AGE_KEY) === "yes");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("all");
  const [order, setOrder] = useState<VideoOrder>(settings.defaultOrder);
  const [videos, setVideos] = useState<Video[]>([]);
  const [favorites, setFavorites] = useState<Video[]>(readFavorites);
  const [watchLater, setWatchLater] = useState<Video[]>(readWatchLater);
  const [watchHistory, setWatchHistory] = useState<Video[]>(readHistory);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [historyVersion, setHistoryVersion] = useState(0);
  const cacheRef = useRef(new Map<string, Video>());
  const typedRef = useRef(new Map<string, string>());
  const location = useLocation();
  const navigate = useNavigate();

  const watchMatch = matchPath("/watch/:id", location.pathname);
  const watchId = watchMatch?.params.id ?? "";
  const view: View = watchId
    ? "watch"
    : location.pathname === "/favorites"
      ? "favorites"
      : location.pathname === "/watch-later"
        ? "watchlater"
      : location.pathname === "/history"
        ? "history"
      : location.pathname === "/categories"
        ? "categories"
        : location.pathname === "/actresses"
          ? "actresses"
          : location.pathname === "/settings"
            ? "settings"
            : "discover";

  const remember = useCallback((items: Video[]) => {
    for (const item of items) cacheRef.current.set(item.id, item);
  }, []);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    remember(favorites);
  }, [favorites, remember]);

  useEffect(() => {
    try {
      localStorage.setItem(WATCH_LATER_KEY, JSON.stringify(watchLater));
    } catch {
      return;
    }
    remember(watchLater);
  }, [watchLater, remember]);

  useEffect(() => {
    try {
      localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(watchHistory));
    } catch {
      return;
    }
    remember(watchHistory);
  }, [watchHistory, remember]);

  useEffect(() => {
    if (!ageConfirmed) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    searchVideos({ query, page, order, source: settings.source, signal: controller.signal })
      .then((result) => {
        remember(result.videos);
        setVideos(result.videos);
        setTotalPages(Math.max(1, result.total_pages || 1));
        setTotalCount(result.total_count || result.videos.length);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : t("err.generic"));
        setVideos([]);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [ageConfirmed, query, page, order, settings.source, retryCount, remember]);

  useEffect(() => {
    setOrder(settings.defaultOrder);
    setPage(1);
  }, [settings.defaultOrder]);

  useEffect(() => {
    setQueryInput(query === "all" ? "" : labelFor(query));
  }, [lang]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 900) setDrawerOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const labelFor = (value: string) => {
    const shown = displayTerm(value, lang);
    if (lang === "ru" && shown === value) return typedRef.current.get(value) ?? value;
    return shown;
  };

  const suggestionTerms = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of [...videos, ...Array.from(cacheRef.current.values())]) {
      for (const raw of (item.keywords ?? "").split(",")) {
        const term = raw.trim().toLowerCase();
        if (term.length > 2 && term.length < 24) counts.set(term, (counts.get(term) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 60)
      .map(([term]) => term);
  }, [videos, loading]);

  const toggleFavorite = (video: Video) => {
    remember([video]);
    setFavorites((current) =>
      current.some((item) => item.id === video.id)
        ? current.filter((item) => item.id !== video.id)
        : [video, ...current],
    );
  };

  const toggleWatchLater = (video: Video) => {
    remember([video]);
    setWatchLater((current) =>
      current.some((item) => item.id === video.id)
        ? current.filter((item) => item.id !== video.id)
        : [video, ...current],
    );
  };

  const addToHistory = useCallback((video: Video) => {
    setWatchHistory((current) => {
      if (current[0]?.id === video.id) return current;
      return [video, ...current.filter((item) => item.id !== video.id)].slice(0, WATCH_HISTORY_LIMIT);
    });
  }, []);

  const clearWatchHistory = useCallback(() => setWatchHistory([]), []);

  const openVideo = (video: Video) => {
    remember([video]);
    navigate(`/watch/${video.id}`);
  };

  const pickTerm = useCallback((term: string) => {
    const apply = (clean: string, typed?: string) => {
      if (typed) typedRef.current.set(clean, typed);
      const shown = displayTerm(clean, lang);
      setQueryInput(clean === "all" ? "" : lang === "ru" && shown === clean ? typed ?? clean : shown);
      setQuery(clean);
      setPage(1);
      setDrawerOpen(false);
      navigate("/");
      requestAnimationFrame(() => {
        document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
      });
    };

    const resolved = resolveTerm(term);
    if (resolved.complete) {
      apply(resolved.query || "all");
      return;
    }
    setQueryInput(term);
    resolveTermAsync(term).then((result) => apply(result.query || "all", term.trim()));
  }, [navigate, lang]);

  const confirmAge = () => {
    sessionStorage.setItem(AGE_KEY, "yes");
    setAgeConfirmed(true);
  };

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const resetPage = useCallback(() => setPage(1), []);

  const goPage = (next: number) => {
    if (next === page || next < 1 || next > totalPages) return;
    setPage(next);
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
  };

  const pageItems = useMemo(() => getPageItems(page, totalPages), [page, totalPages]);

  if (!ageConfirmed) return <AgeGate onConfirm={confirmAge} />;

  const heading =
    view === "favorites"
      ? { eyebrow: t("head.yourCollection"), title: t("head.favTitle"), sub: tn("head.savedCount", favorites.length) }
      : view === "watchlater"
      ? { eyebrow: t("head.yourCollection"), title: t("head.laterTitle"), sub: tn("head.savedCount", watchLater.length) }
      : view === "history"
      ? { eyebrow: t("head.yourCollection"), title: t("head.historyTitle"), sub: tn("head.historyCount", watchHistory.length) }
      : {
          eyebrow: t("head.liveResults"),
          title: query === "all" ? t("head.explore") : t("head.resultsFor", { query: labelFor(query) }),
          sub: loading ? t("head.fetching") : t("head.available", { n: totalCount.toLocaleString(locale) }),
        };

  const currentList = view === "favorites" ? favorites : view === "watchlater" ? watchLater : view === "history" ? watchHistory : videos;
  const tickerWords = t("ticker").split("|");

  return (
    <div className={settings.blurThumbs ? "app-shell blur-thumbs" : "app-shell"}>
      <ThemeEffects theme={settings.theme} />
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand" onClick={() => { setQuery("all"); setQueryInput(""); setPage(1); }}>
            <span className="brand-mark">N</span>
            <span className="brand-word">NOIR<span>.</span></span>
          </Link>

          <SearchBox key={historyVersion} value={queryInput} onChange={setQueryInput} onSubmit={pickTerm} extraTerms={suggestionTerms} />

          <nav className="header-nav">
            <Link to="/" className={view === "discover" ? "nav-link active" : "nav-link"}>
              <Compass size={16} /> {t("nav.discover")}
            </Link>
            <Link to="/categories" className={view === "categories" ? "nav-link active" : "nav-link"}>
              <LayoutGrid size={16} /> {t("nav.categories")}
            </Link>
            <Link to="/actresses" className={view === "actresses" ? "nav-link active" : "nav-link"}>
              <Users size={16} /> {t("nav.actresses")}
            </Link>
            <Link to="/favorites" className={view === "favorites" ? "nav-link active" : "nav-link"}>
              <Heart size={16} /> {t("nav.favorites")} <span className="nav-count">{favorites.length}</span>
            </Link>
            <Link to="/watch-later" className={view === "watchlater" ? "nav-link active" : "nav-link"}>
              <Clock size={16} /> {t("nav.watchLater")} <span className="nav-count">{watchLater.length}</span>
            </Link>
            <Link to="/history" className={view === "history" ? "nav-link icon-only active" : "nav-link icon-only"} aria-label={t("nav.history")} title={t("nav.history")}>
              <HistoryIcon size={17} />
            </Link>
            <Link to="/settings" className={view === "settings" ? "nav-link icon-only active" : "nav-link icon-only"} aria-label={t("nav.settings")} title={t("nav.settings")}>
              <SettingsIcon size={17} />
            </Link>
          </nav>
          <button className="mobile-menu-button" onClick={() => setDrawerOpen(true)} aria-label={t("nav.openMenu")}>
            <Menu size={22} />
          </button>
        </div>
      </header>

      <main className="page-content">
        {view === "watch" && (
          <WatchPage
            key={watchId}
            id={watchId}
            initial={cacheRef.current.get(watchId)}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            watchLater={watchLater}
            onToggleWatchLater={toggleWatchLater}
            onOpen={openVideo}
            onPickTerm={pickTerm}
            remember={remember}
            onWatched={addToHistory}
          />
        )}

        {view === "settings" && (
          <SettingsPage
            onClearHistory={() => setHistoryVersion((current) => current + 1)}
            onClearWatchHistory={clearWatchHistory}
          />
        )}

        {view === "actresses" && (
          <section className="categories-page">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{t("act.eyebrow")}</p>
                <h2>{t("act.title")}</h2>
                <p className="section-subtitle">{t("act.sub", { n: ACTRESSES.length })}</p>
              </div>
              <div className="heading-controls"><SourceSwitch onChange={resetPage} /></div>
            </div>
            <ActressList names={RUSSIAN_ACTRESSES} offset={0} onPick={pickTerm} />
            <ActressList names={OTHER_ACTRESSES} offset={RUSSIAN_ACTRESSES.length} onPick={pickTerm} />
          </section>
        )}

        {view === "categories" && (
          <section className="categories-page">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{t("cat.eyebrow")}</p>
                <h2>{t("cat.title")}</h2>
                <p className="section-subtitle">{t("cat.sub", { n: CATEGORIES.length })}</p>
              </div>
              <div className="heading-controls"><SourceSwitch onChange={resetPage} /></div>
            </div>
            <CategoryGrid onPick={pickTerm} />
          </section>
        )}

        {(view === "discover" || view === "favorites" || view === "watchlater" || view === "history") && (
          <>
            {view === "discover" && (
              <section className="hero">
                <div className="hero-grid" />
                <span className="corner tl" />
                <span className="corner tr" />
                <span className="corner bl" />
                <span className="corner br" />
                <div className="hero-copy">
                  <div className="eyebrow"><Zap size={13} /> {t("hero.eyebrow")}</div>
                  <h1>{t("hero.title1")}<br /><span>{t("hero.title2")}</span></h1>
                  <p>{t("hero.text")}</p>
                  <div className="hero-buttons">
                    <button className="button primary" onClick={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })}>
                      <Play size={15} fill="currentColor" /> {t("hero.explore")}
                    </button>
                    <button className="button secondary" onClick={() => { setOrder("latest"); setPage(1); }}>
                      <Flame size={15} /> {t("hero.latest")}
                    </button>
                    <Link className="button ghost" to="/categories"><LayoutGrid size={15} /> {t("hero.categories")}</Link>
                  </div>
                  <div className="hero-footnote"><Shield size={13} /> {t("hero.footnote")}</div>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <div className="hero-symbol">N<span>.</span></div>
                  <div className="hero-stats">
                    <div className="hero-stat"><b>{totalCount ? totalCount.toLocaleString(locale) : "—"}</b><span>{t("hero.statVideos")}</span></div>
                    <div className="hero-stat"><b>{CATEGORIES.length}</b><span>{t("hero.statCategories")}</span></div>
                    <div className="hero-stat"><b>{String(favorites.length).padStart(2, "0")}</b><span>{t("hero.statSaved")}</span></div>
                  </div>
                </div>
              </section>
            )}

            {view === "discover" && (
              <div className="ticker" aria-hidden="true">
                <div className="ticker-track">
                  {[...tickerWords, ...tickerWords, ...tickerWords, ...tickerWords].map((word, index) => (
                    <span key={index}>{word}<i /></span>
                  ))}
                </div>
              </div>
            )}

            {view === "discover" && (
              <div className="quick-searches">
                <span className="quick-label">{t("quick.label")}</span>
                <div className="chip-scroll">
                  <button className={query === "all" ? "quick-chip selected" : "quick-chip"} onClick={() => pickTerm("all")}>{t("quick.all")}</button>
                  {CATEGORY_GROUPS.map((group) => (
                    <Fragment key={group.id}>
                      <span className="quick-group">{group.label[lang]}</span>
                      {categoriesOfGroup(group.id).map((item) => (
                        <button key={item.slug} className={query === item.slug ? "quick-chip selected" : "quick-chip"} onClick={() => pickTerm(item.slug)}>
                          {item.label[lang]}
                        </button>
                      ))}
                    </Fragment>
                  ))}
                </div>
              </div>
            )}

            <section className="catalog-section" id="catalog">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">{heading.eyebrow}</p>
                  <h2>{heading.title}</h2>
                  <p className="section-subtitle">{heading.sub}</p>
                </div>
                {view === "history" && watchHistory.length > 0 && (
                  <div className="heading-controls">
                    <button type="button" className="button secondary small" onClick={clearWatchHistory}>
                      <Trash2 size={14} /> {t("head.historyClear")}
                    </button>
                  </div>
                )}
                {view === "discover" && (
                  <div className="heading-controls">
                  <SourceSwitch onChange={resetPage} />
                  <label className="sort-control">
                    <span>{t("sort.label")}</span>
                    <select value={order} onChange={(event) => { setOrder(event.target.value as VideoOrder); setPage(1); }}>
                      <option value="most-popular">{t("sort.popular")}</option>
                      <option value="top-weekly">{t("sort.weekly")}</option>
                      <option value="top-monthly">{t("sort.monthly")}</option>
                      <option value="top-rated">{t("sort.rated")}</option>
                      <option value="latest">{t("sort.latest")}</option>
                      <option value="longest">{t("sort.longest")}</option>
                      <option value="shortest">{t("sort.shortest")}</option>
                    </select>
                  </label>
                  </div>
                )}
              </div>

              {view === "discover" && loading ? (
                <div className="video-grid">
                  {Array.from({ length: 12 }).map((_, index) => (
                    <div className="skeleton-card" key={index}><div className="skeleton-thumb" /><div className="skeleton-line" /><div className="skeleton-short" /></div>
                  ))}
                </div>
              ) : view === "discover" && error ? (
                <div className="state-card error-state">
                  <CircleAlert size={30} />
                  <h3>{t("err.title")}</h3>
                  <p>{error}</p>
                  <p className="muted">{t("err.hint")}</p>
                  <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center" }}>
                    <button className="button primary" onClick={() => setRetryCount((current) => current + 1)}>{t("err.retry")}</button>
                    {settings.source !== "both" && (
                      <button className="button secondary" onClick={() => { update({ source: "both" }); setPage(1); }}>
                        {t("source.both")}
                      </button>
                    )}
                  </div>
                  <a
                    className="text-link"
                    href={error.toLowerCase().includes("pornhub") ? "https://www.pornhub.com/webmasters" : "https://www.eporner.com/api/v2/"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("err.docs")} <ChevronRight size={15} />
                  </a>
                </div>
              ) : currentList.length === 0 ? (
                <div className="state-card">
                  {view === "watchlater" ? <Clock size={30} /> : view === "history" ? <HistoryIcon size={30} /> : <Bookmark size={30} />}
                  <h3>{view === "favorites" ? t("empty.favTitle") : view === "watchlater" ? t("empty.laterTitle") : view === "history" ? t("empty.historyTitle") : t("empty.noVideos")}</h3>
                  <p>{view === "favorites" ? t("empty.favText") : view === "watchlater" ? t("empty.laterText") : view === "history" ? t("empty.historyText") : t("empty.tryOther")}</p>
                  {(view === "favorites" || view === "watchlater" || view === "history") && <button className="button primary" onClick={() => navigate("/")}>{t("empty.discover")}</button>}
                </div>
              ) : (
                <div className="video-grid">
                  {currentList.map((video, index) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      index={index}
                      favorite={favorites.some((item) => item.id === video.id)}
                      onToggleFavorite={toggleFavorite}
                      watchLater={watchLater.some((item) => item.id === video.id)}
                      onToggleWatchLater={toggleWatchLater}
                      onOpen={openVideo}
                    />
                  ))}
                </div>
              )}

              {view === "discover" && !loading && !error && videos.length > 0 && (
                <nav className="pagination" aria-label={t("page.aria")}>
                  <button className="page-button" disabled={page <= 1} onClick={() => goPage(page - 1)}>
                    <ChevronLeft size={16} /> {t("page.prev")}
                  </button>
                  <div className="page-numbers">
                    {pageItems.map((item) => typeof item === "number" ? (
                      <button
                        key={item}
                        className={item === page ? "page-number active" : "page-number"}
                        aria-label={t("page.numberAria", { n: item })}
                        aria-current={item === page ? "page" : undefined}
                        onClick={() => goPage(item)}
                      >
                        {item}
                      </button>
                    ) : (
                      <span className="page-ellipsis" key={item} aria-hidden="true">…</span>
                    ))}
                  </div>
                  <span className="page-status">{t("page.word")} <strong>{page}</strong> / {totalPages}</span>
                  <button className="page-button" disabled={page >= totalPages} onClick={() => goPage(page + 1)}>
                    {t("page.next")} <ChevronRight size={16} />
                  </button>
                </nav>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="site-footer">
        <div className="footer-brand"><span className="brand-mark small">N</span><span className="brand-word">NOIR<span>.</span></span></div>
        <p>{t("footer.text")}</p>
        <div className="footer-links">
          <a href="https://www.eporner.com/api/v2/" target="_blank" rel="noreferrer">{t("footer.api")}</a>
          <span>·</span><span><Check size={12} /> {t("footer.adults")}</span>
        </div>
      </footer>

      <div className="safety-note"><Shield size={12} /> {t("safety.note")}</div>

      <Drawer open={drawerOpen} onClose={closeDrawer} view={view} favoritesCount={favorites.length} watchLaterCount={watchLater.length} historyCount={watchHistory.length} onPickTerm={pickTerm} />
    </div>
  );
}

export default App;
