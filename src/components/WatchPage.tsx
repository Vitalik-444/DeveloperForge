import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, CircleAlert, Eye, Heart, Star, Clock, Calendar, Download } from "lucide-react";
import VideoCard from "./VideoCard";
import { useTranslated } from "../hooks/useTranslated";
import { useI18n } from "../i18n";
import { displayTerm } from "../data/search";
import { useSettings } from "../settings";
import { getVideo, parseKeywords, searchRelated } from "../services/videoApi";
import type { Video } from "../types/video";

interface WatchPageProps {
  id: string;
  initial?: Video;
  favorites: Video[];
  onToggleFavorite: (video: Video) => void;
  watchLater: Video[];
  onToggleWatchLater: (video: Video) => void;
  onOpen: (video: Video) => void;
  onPickTerm: (term: string) => void;
  remember: (videos: Video[]) => void;
  onWatched?: (video: Video) => void;
}

interface TagChipProps {
  tag: string;
  translate: boolean;
  onPick: (term: string) => void;
}

function TagChip({ tag, translate, onPick }: TagChipProps) {
  const known = displayTerm(tag, "ru");
  const local = known !== tag;
  const label = useTranslated(tag, translate && !local);
  return <button className="quick-chip" onClick={() => onPick(tag)}>#{translate && local ? known : label}</button>;
}

export default function WatchPage({ id, initial, favorites, onToggleFavorite, watchLater, onToggleWatchLater, onOpen, onPickTerm, remember, onWatched }: WatchPageProps) {
  const { t, locale, lang } = useI18n();
  const { settings } = useSettings();
  const translate = lang === "ru" && settings.translateTitles;
  const [video, setVideo] = useState<Video | null>(initial ?? null);
  const title = useTranslated(video?.title ?? "", translate);
  const [related, setRelated] = useState<Video[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    if (initial && initial.id === id) {
      setVideo(initial);
      return;
    }
    setVideo(null);
    const controller = new AbortController();
    getVideo(id, controller.signal)
      .then((result) => {
        setVideo(result);
        remember([result]);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : t("watch.couldNot"));
      });
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (video) onWatched?.(video);
  }, [video?.id]);

  useEffect(() => {
    if (!video) return;
    const controller = new AbortController();
    setLoadingRelated(true);
    setRelated([]);
    searchRelated(video, controller.signal)
      .then((items) => {
        setRelated(items);
        remember(items);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setRelated([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingRelated(false);
      });
    return () => controller.abort();
  }, [video?.id]);

  if (error) {
    return (
      <div className="watch-page">
        <div className="state-card error-state">
          <CircleAlert size={30} />
          <h3>{t("watch.unavailable")}</h3>
          <p>{error}</p>
          <Link className="button primary" to="/">{t("watch.back")}</Link>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="watch-page">
        <div className="watch-main">
          <div className="embed-frame skeleton-thumb" />
          <div className="skeleton-line" style={{ marginTop: 22 }} />
          <div className="skeleton-short" />
        </div>
      </div>
    );
  }

  const isFavorite = favorites.some((item) => item.id === video.id);
  const isLater = watchLater.some((item) => item.id === video.id);
  const keywords = parseKeywords(video).slice(0, 12);
  const rating = Number(video.rate || 0).toFixed(1);

  return (
    <div className="watch-page">
      <Link to="/" className="back-link"><ArrowLeft size={15} /> {t("watch.back")}</Link>
      <div className="watch-layout">
        <section className="watch-main">
          <div className="embed-wrap">
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />
            <div className="embed-frame">
              <iframe src={video.embed} title={video.title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
            </div>
          </div>

          <p className="eyebrow">{t("watch.now")}</p>
          <h1 className="watch-title">{title}</h1>
          {title !== video.title && <p className="original-title">{t("watch.original")}: {video.title}</p>}

          <div className="stat-row">
            <span className="stat"><Eye size={14} /> {Number(video.views || 0).toLocaleString(locale)}</span>
            <span className="stat"><Star size={14} /> {rating}</span>
            <span className="stat"><Clock size={14} /> {video.length_min || "—"}</span>
            {video.added && <span className="stat"><Calendar size={14} /> {video.added.slice(0, 10)}</span>}
          </div>

          <div className="watch-actions">
            <button className={`button secondary ${isFavorite ? "favorite-active" : ""}`} onClick={() => onToggleFavorite(video)}>
              <Heart size={15} fill={isFavorite ? "currentColor" : "none"} /> {isFavorite ? t("watch.saved") : t("watch.save")}
            </button>
            <button className={`button secondary ${isLater ? "favorite-active" : ""}`} aria-pressed={isLater} onClick={() => onToggleWatchLater(video)}>
              <Clock size={15} /> {isLater ? t("watch.laterSaved") : t("watch.later")}
            </button>
            <a className="button secondary" href={video.url} target="_blank" rel="noreferrer" title={t("watch.downloadHint")}>
              <Download size={15} /> {t("watch.download")}
            </a>
            <a className="button primary" href={video.url} target="_blank" rel="noreferrer">{t("watch.openSource")} <ChevronRight size={15} /></a>
          </div>

          {keywords.length > 0 && (
            <div className="tag-row">
              {keywords.map((tag) => (
                <TagChip key={tag} tag={tag} translate={translate} onPick={onPickTerm} />
              ))}
            </div>
          )}

          <p className="modal-disclaimer">{t("watch.disclaimer")}</p>
        </section>

        <aside className="watch-side">
          <div className="side-head">
            <p className="eyebrow">{t("watch.upNext")}</p>
            <h2>{t("watch.more")}</h2>
          </div>
          {loadingRelated ? (
            <div className="related-list">
              {Array.from({ length: 6 }).map((_, index) => (
                <div className="related-skeleton" key={index}>
                  <div className="skeleton-thumb" />
                  <div><div className="skeleton-line" /><div className="skeleton-short" /></div>
                </div>
              ))}
            </div>
          ) : related.length === 0 ? (
            <p className="muted side-empty">{t("watch.noRelated")}</p>
          ) : (
            <div className="related-list">
              {related.map((item) => (
                <VideoCard
                  key={item.id}
                  video={item}
                  compact
                  favorite={favorites.some((fav) => fav.id === item.id)}
                  onToggleFavorite={onToggleFavorite}
                  watchLater={watchLater.some((later) => later.id === item.id)}
                  onToggleWatchLater={onToggleWatchLater}
                  onOpen={onOpen}
                />
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
