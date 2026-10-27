import { useEffect, useState } from "react";
import {
  Activity, ArrowUpRight, Clapperboard, Crown, Film, Flame, Globe, Link2, MapPin, Shirt, Sparkles, Tv, Users,
  type LucideIcon,
} from "lucide-react";
import { CATEGORIES, CATEGORY_GROUPS, categoriesOfGroup, type GroupId } from "../data/catalog";
import { useI18n } from "../i18n";
import { searchVideos } from "../services/videoApi";
import { useSettings } from "../settings";
import { CATEGORY_THUMBS_KEY as THUMBS_KEY } from "../storage";

function readThumbs(): Record<string, string> {
  try {
    const value = localStorage.getItem(THUMBS_KEY);
    return value ? (JSON.parse(value) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

const GROUP_ICONS: Record<GroupId, LucideIcon> = {
  looks: Sparkles,
  origin: Globe,
  types: Crown,
  partners: Users,
  positions: Activity,
  acts: Flame,
  places: MapPin,
  scenarios: Clapperboard,
  clothing: Shirt,
  kinks: Link2,
  hentai: Tv,
  format: Film,
};

interface CategoryGridProps {
  onPick: (slug: string) => void;
}

export default function CategoryGrid({ onPick }: CategoryGridProps) {
  const { lang } = useI18n();
  const { settings } = useSettings();
  const [thumbs, setThumbs] = useState<Record<string, string>>(readThumbs);

  const discardThumb = (slug: string) => {
    setThumbs((current) => {
      const { [slug]: _, ...remaining } = current;
      try {
        localStorage.setItem(THUMBS_KEY, JSON.stringify(remaining));
      } catch {
      }
      return remaining;
    });
  };

  useEffect(() => {
    if (!settings.tileImages) return;
    const controller = new AbortController();
    const stored = readThumbs();
    const used = new Set(Object.values(stored));
    const queue = CATEGORIES.filter((item) => !stored[item.slug]).map((item) => item.slug);

    const worker = async () => {
      while (queue.length > 0 && !controller.signal.aborted) {
        const slug = queue.shift()!;
        try {
          const data = await searchVideos({ query: slug, perPage: 4, order: "top-weekly", signal: controller.signal });
          const src = data.videos.map((item) => item.default_thumb?.src).find((url) => url && !used.has(url));
          if (src) {
            used.add(src);
            stored[slug] = src;
            setThumbs((current) => ({ ...current, [slug]: src }));
            try {
              localStorage.setItem(THUMBS_KEY, JSON.stringify(stored));
            } catch {
              continue;
            }
          }
        } catch {
          if (controller.signal.aborted) return;
        }
      }
    };

    Promise.all([worker(), worker(), worker(), worker()]);
    return () => controller.abort();
  }, [settings.tileImages]);

  const jumpTo = (id: GroupId) => {
    document.getElementById(`cat-group-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="category-groups">
      <nav className="group-nav" aria-label="Category groups">
        {CATEGORY_GROUPS.map((group) => {
          const Icon = GROUP_ICONS[group.id];
          return (
            <button key={group.id} type="button" className="group-chip" onClick={() => jumpTo(group.id)}>
              <Icon size={14} /> {group.label[lang]}
              <span className="group-chip-count">{categoriesOfGroup(group.id).length}</span>
            </button>
          );
        })}
      </nav>

      {CATEGORY_GROUPS.map((group, groupIndex) => {
        const Icon = GROUP_ICONS[group.id];
        const items = categoriesOfGroup(group.id);
        return (
          <section key={group.id} id={`cat-group-${group.id}`} className="category-group">
            <header className="category-group-head">
              <span className="category-group-icon"><Icon size={18} /></span>
              <div>
                <h3>{group.label[lang]}</h3>
                <p>{group.hint[lang]}</p>
              </div>
              <span className="category-group-count">{String(groupIndex + 1).padStart(2, "0")} · {items.length}</span>
            </header>
            <div className="category-grid">
              {items.map((item, index) => (
                <button key={item.slug} className="category-tile" onClick={() => onPick(item.slug)}>
                  {settings.tileImages && thumbs[item.slug] && <img className="category-img" src={thumbs[item.slug]} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => discardThumb(item.slug)} />}
                  <span className="category-shade" />
                  <span className="category-num">{String(index + 1).padStart(2, "0")}</span>
                  <span className="category-name">{item.label[lang]}</span>
                  <span className="category-hint">{item.hint[lang]}</span>
                  <ArrowUpRight className="category-arrow" size={18} />
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
