import { useState } from "react";
import { Clock, Download, ExternalLink, Heart, Play } from "lucide-react";
import { useTranslated } from "../hooks/useTranslated";
import { useI18n } from "../i18n";
import { useSettings } from "../settings";
import type { Video } from "../types/video";

interface VideoCardProps {
  video: Video;
  favorite: boolean;
  onToggleFavorite: (video: Video) => void;
  watchLater: boolean;
  onToggleWatchLater: (video: Video) => void;
  onOpen: (video: Video) => void;
  compact?: boolean;
  index?: number;
}

function formatViews(value: number, locale: string) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export default function VideoCard({ video, favorite, onToggleFavorite, watchLater, onToggleWatchLater, onOpen, compact = false, index }: VideoCardProps) {
  const { t, locale, lang } = useI18n();
  const { settings } = useSettings();
  const title = useTranslated(video.title, lang === "ru" && settings.translateTitles);
  const thumbnail = video.default_thumb?.src;
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const rating = Math.max(0, Math.min(5, Number(video.rate || 0)));

  return (
    <article className={compact ? "video-card compact" : "video-card"}>
      <button className="thumbnail-button" onClick={() => onOpen(video)} aria-label={t("card.open", { title })}>
        {thumbnail && !thumbnailFailed ? (
          <img src={thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setThumbnailFailed(true)} />
        ) : (
          <div className="thumbnail-placeholder"><Play size={28} /></div>
        )}
        {typeof index === "number" && <span className="thumb-index">{String(index + 1).padStart(2, "0")}</span>}
        <span className="duration">{video.length_min || t("card.video")}</span>
        <span className="play-overlay"><Play size={22} fill="currentColor" /></span>
      </button>
      <div className="video-info">
        <button className="video-title" onClick={() => onOpen(video)} title={title}>{title}</button>
        <div className="video-meta">
          <span>{t("card.views", { n: formatViews(video.views, locale) })}</span>
          <span className="meta-dot" />
          <span className="rating">★ {rating.toFixed(1)}</span>
        </div>
        <div className="rating-bar"><span style={{ width: `${(rating / 5) * 100}%` }} /></div>
        <div className="card-actions">
          <div className="card-buttons">
          <button
            className={`icon-button ${favorite ? "is-favorite" : ""}`}
            onClick={() => onToggleFavorite(video)}
            aria-label={favorite ? t("card.favRemove") : t("card.favAdd")}
            title={favorite ? t("card.favRemove") : t("card.favAdd")}
          >
            <Heart size={16} fill={favorite ? "currentColor" : "none"} />
          </button>
          <button
            className={`icon-button ${watchLater ? "is-later" : ""}`}
            onClick={() => onToggleWatchLater(video)}
            aria-pressed={watchLater}
            aria-label={watchLater ? t("card.laterRemove") : t("card.laterAdd")}
            title={watchLater ? t("card.laterRemove") : t("card.laterAdd")}
          >
            <Clock size={16} />
          </button>
          <a className="icon-button" href={video.url} target="_blank" rel="noreferrer" aria-label={t("card.download")} title={t("card.download")} onClick={(event) => event.stopPropagation()}>
            <Download size={16} />
          </a>
          </div>
          <a className="external-link" href={video.url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
            {t("card.source")} <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </article>
  );
}
