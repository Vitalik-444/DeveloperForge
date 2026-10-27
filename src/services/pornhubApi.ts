import type { Video, VideoSearchResponse } from "../types/video";
import type { VideoOrder } from "./videoApi";

// Pornhub Webmasters (HubTraffic) API, called through our own proxy (see vite.config.ts / vercel.json).
const API_BASE = "/api/pornhub";
const EMBED_BASE = "https://www.pornhub.com/embed/";
const PAGE_SIZE = 20;

export const PORNHUB_PREFIX = "ph-";

interface RawThumb {
  size?: string;
  width?: number | string;
  height?: number | string;
  src?: string;
}

interface RawVideo {
  video_id: string | number;
  title?: string;
  duration?: string;
  views?: number | string;
  rating?: number | string;
  url?: string;
  publish_date?: string;
  default_thumb?: string | RawThumb;
  thumb?: string;
  thumbs?: RawThumb[];
  tags?: Array<string | { tag_name?: string }>;
  pornstars?: Array<string | { pornstar_name?: string }>;
  categories?: Array<string | { category?: string }>;
}

// Search returns flat items, but some endpoints wrap them as { video: {...} } — support both.
type RawItem = RawVideo | { video?: RawVideo };

interface SearchPayload {
  videos?: RawItem[];
  count?: number | string;
}

interface DetailPayload {
  video?: RawVideo;
}

function unwrap(item: RawItem | undefined): RawVideo | undefined {
  if (!item) return undefined;
  return "video" in item && item.video ? item.video : (item as RawVideo);
}

// Always serve thumbnails over https so they are not blocked as mixed content.
function secure(src?: string): string | undefined {
  if (!src) return undefined;
  return src.startsWith("//") ? `https:${src}` : src.replace(/^http:\/\//i, "https://");
}

function toSeconds(duration?: string): number {
  if (!duration) return 0;
  const parts = duration.split(":").map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part))) return 0;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function pickThumb(raw: RawVideo): Video["default_thumb"] {
  const first = raw.thumbs?.find((item) => item.src);
  const fromDefault = typeof raw.default_thumb === "string" ? raw.default_thumb : raw.default_thumb?.src;
  const src = secure(fromDefault || raw.thumb || first?.src);
  if (!src) return undefined;
  return {
    size: "large",
    width: Number(first?.width ?? 0) || 0,
    height: Number(first?.height ?? 0) || 0,
    src,
  };
}

function normalize(raw: RawVideo | undefined): Video | null {
  if (!raw || raw.video_id === undefined || raw.video_id === null) return null;
  const sourceId = String(raw.video_id);
  // Performers first, then categories, then tags, so the actress / category filters can use them when present.
  const stars = (raw.pornstars ?? []).map((item) => (typeof item === "string" ? item : item.pornstar_name ?? ""));
  const cats = (raw.categories ?? []).map((item) => (typeof item === "string" ? item : item.category ?? ""));
  const tagNames = (raw.tags ?? []).map((tag) => (typeof tag === "string" ? tag : tag.tag_name ?? ""));
  const keywords = Array.from(new Set([...stars, ...cats, ...tagNames].map((item) => item.trim()).filter(Boolean))).join(",");
  const thumb = pickThumb(raw);

  return {
    id: `${PORNHUB_PREFIX}${sourceId}`,
    title: raw.title ?? "Untitled",
    keywords,
    views: Number(raw.views ?? 0) || 0,
    // Pornhub rating is 0–100, the UI expects 0–5.
    rate: String(Math.round((Number(raw.rating ?? 0) / 20) * 10) / 10 || 0),
    url: raw.url ?? `https://www.pornhub.com/view_video.php?viewkey=${sourceId}`,
    added: raw.publish_date ?? "",
    length_sec: toSeconds(raw.duration),
    length_min: raw.duration ?? "",
    embed: `${EMBED_BASE}${sourceId}`,
    default_thumb: thumb,
    thumbs: thumb ? [thumb] : [],
  };
}

function mapOrder(order: VideoOrder): { ordering: string; period?: string } {
  switch (order) {
    case "top-weekly":
      return { ordering: "mostviewed", period: "weekly" };
    case "top-monthly":
      return { ordering: "mostviewed", period: "monthly" };
    case "top-rated":
      return { ordering: "rating", period: "alltime" };
    case "latest":
    case "longest":
    case "shortest":
      return { ordering: "newest" };
    default:
      return { ordering: "mostviewed", period: "alltime" };
  }
}

const DIRECT_BASE = "https://www.pornhub.com/webmasters";

async function readJson(response: Response): Promise<{ data: unknown; message: string }> {
  const text = await response.text();
  try {
    const data = JSON.parse(text) as { message?: string; error?: string };
    return { data, message: data?.message ?? data?.error ?? "" };
  } catch {
    return { data: null, message: "" };
  }
}

async function request<T>(path: string, params: Record<string, string>, signal?: AbortSignal): Promise<T> {
  const query = new URLSearchParams(params).toString();
  let problem = "";

  try {
    const response = await fetch(`${API_BASE}/${path}?${query}`, { method: "GET", signal, headers: { Accept: "application/json" } });
    const { data, message } = await readJson(response);
    if (response.ok && data) return validate<T>(data);
    problem = message || `HTTP ${response.status}`;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;

    // Fallback directly to official base in case proxy is disabled or on a custom setup
    try {
      const response = await fetch(`${DIRECT_BASE}/${path}?${query}`, { method: "GET", signal, headers: { Accept: "application/json" } });
      const { data } = await readJson(response);
      if (response.ok && data) return validate<T>(data);
      problem = `HTTP ${response.status}`;
    } catch (directError) {
      if (directError instanceof DOMException && directError.name === "AbortError") throw directError;
      problem = "proxy unreachable";
    }
  }

  throw new Error(`Pornhub: ${problem}`);
}

function validate<T>(data: unknown): T {
  const body = data as T & { code?: string; message?: string };
  if (body && typeof body === "object" && "code" in body && body.code && !("videos" in body) && !("video" in body)) {
    throw new Error(body.message || `Pornhub API error ${body.code}.`);
  }
  return body;
}

export async function searchPornhub({
  query = "all",
  page = 1,
  order = "most-popular",
  signal,
}: {
  query?: string;
  page?: number;
  order?: VideoOrder;
  signal?: AbortSignal;
} = {}): Promise<VideoSearchResponse> {
  const { ordering, period } = mapOrder(order);
  const params: Record<string, string> = {
    page: String(page),
    thumbsize: "large",
    ordering,
  };
  if (period) params.period = period;
  const term = query.trim();
  if (term && term !== "all") params.search = term;

  const payload = await request<SearchPayload>("search", params, signal);
  const videos = (payload.videos ?? [])
    .map((item) => normalize(unwrap(item)))
    .filter((item): item is Video => item !== null);

  // The API does not return a total, so allow one more page while results keep coming.
  const total = Number(payload.count) || (videos.length ? page * PAGE_SIZE + PAGE_SIZE : (page - 1) * PAGE_SIZE);

  return {
    count: videos.length,
    start: (page - 1) * PAGE_SIZE,
    per_page: PAGE_SIZE,
    page,
    total_count: total,
    total_pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    videos,
  };
}

export async function getPornhubVideo(id: string, signal?: AbortSignal): Promise<Video> {
  const sourceId = id.startsWith(PORNHUB_PREFIX) ? id.slice(PORNHUB_PREFIX.length) : id;
  const payload = await request<DetailPayload>("video_by_id", { id: sourceId, thumbsize: "large" }, signal);
  const video = normalize(payload.video);
  if (!video) throw new Error("This video is no longer available.");
  return video;
}
