import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { displayActress } from "../data/search";
import { useI18n } from "../i18n";
import { searchVideos } from "../services/videoApi";
import { useSettings } from "../settings";
import { ACTRESS_THUMBS_KEY as THUMBS_KEY } from "../storage";

function readThumbs(): Record<string, string> {
  try {
    const value = localStorage.getItem(THUMBS_KEY);
    return value ? (JSON.parse(value) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function saveThumb(name: string, src: string) {
  try {
    localStorage.setItem(THUMBS_KEY, JSON.stringify({ ...readThumbs(), [name]: src }));
  } catch {
    return;
  }
}

interface ActressListProps {
  names: string[];
  offset?: number;
  onPick: (name: string) => void;
}

export default function ActressList({ names, offset = 0, onPick }: ActressListProps) {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const [thumbs, setThumbs] = useState<Record<string, string>>(readThumbs);

  const discardThumb = (name: string) => {
    setThumbs((current) => {
      const { [name]: _, ...remaining } = current;
      return remaining;
    });
    try {
      const { [name]: _, ...stored } = readThumbs();
      localStorage.setItem(THUMBS_KEY, JSON.stringify(stored));
    } catch {
      return;
    }
  };

  useEffect(() => {
    if (!settings.tileImages) return;
    const controller = new AbortController();
    const stored = readThumbs();
    const used = new Set(Object.values(stored));
    const queue = names.filter((name) => !stored[name]);

    const worker = async () => {
      while (queue.length > 0 && !controller.signal.aborted) {
        const name = queue.shift()!;
        try {
          const data = await searchVideos({ query: name, perPage: 4, order: "most-popular", signal: controller.signal });
          const src = data.videos.map((item) => item.default_thumb?.src).find((url) => url && !used.has(url));
          if (src) {
            used.add(src);
            setThumbs((current) => ({ ...current, [name]: src }));
            saveThumb(name, src);
          }
        } catch {
          if (controller.signal.aborted) return;
        }
      }
    };

    Promise.all([worker(), worker(), worker(), worker()]);
    return () => controller.abort();
  }, [settings.tileImages, names]);

  return (
    <div className="category-grid actress-group">
      {names.map((name, index) => (
        <button key={name} className="category-tile" onClick={() => onPick(name)}>
          {settings.tileImages && thumbs[name] && <img className="category-img" src={thumbs[name]} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => discardThumb(name)} />}
          <span className="category-shade" />
          <span className="category-num">{String(offset + index + 1).padStart(2, "0")}</span>
          <span className="category-name">{displayActress(name, lang)}</span>
          <span className="category-hint">{t("act.hint")}</span>
          <ArrowUpRight className="category-arrow" size={18} />
        </button>
      ))}
    </div>
  );
}
