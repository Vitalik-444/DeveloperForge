import type { Source, Video, VideoSearchResponse } from "../types/video";
import { dedupeVideos, isSameVideo } from "../data/dedupe";
import { isRelevant, isStrictQuery, tokens } from "../data/relevance";
import { PORNHUB_PREFIX, getPornhubVideo, searchPornhub } from "./pornhubApi";

const DIRECT_BASE = "https://www.eporner.com/api/v2";
const PROXY_BASE = "/api/eporner";
let proxyDead = false;

async function epornerJson<T>(path: string, params: URLSearchParams, signal?: AbortSignal): Promise<T> {
  const query = params.toString();
  if (!proxyDead) {
    try {
      const response = await fetch(`${PROXY_BASE}/${path}?${query}`, { method: "GET", signal, headers: { Accept: "application/json" } });
      if (response.ok) return (await response.json()) as T;
      if (response.status === 404 || response.status === 405) proxyDead = true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      if (error instanceof SyntaxError) proxyDead = true;
    }
  }
  const response = await fetch(`${DIRECT_BASE}/${path}?${query}`, { method: "GET", signal, headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Eporner API returned ${response.status}. Please try again later.`);
  }
  return (await response.json()) as T;
}

export type VideoOrder =
  | "most-popular"
  | "top-weekly"
  | "top-monthly"
  | "top-rated"
  | "latest"
  | "longest"
  | "shortest";

async function searchEporner({
  query = "all",
  page = 1,
  order = "most-popular",
  perPage = 24,
  signal,
}: {
  query?: string;
  page?: number;
  order?: VideoOrder;
  perPage?: number;
  signal?: AbortSignal;
} = {}): Promise<VideoSearchResponse> {
  const params = new URLSearchParams({
    query: query.trim() || "all",
    per_page: String(perPage),
    page: String(page),
    thumbsize: "big",
    order,
    gay: "0",
    lq: "0",
    format: "json",
  });

  const data = await epornerJson<VideoSearchResponse>("video/search/", params, signal);
  if (!Array.isArray(data.videos)) {
    throw new Error("The API returned an unexpected response.");
  }
  return data;
}

async function getEpornerVideo(id: string, signal?: AbortSignal): Promise<Video> {
  const params = new URLSearchParams({ id, thumbsize: "big", format: "json" });
  const data = await epornerJson<Video>("video/id/", params, signal);
  if (!data || typeof data.id !== "string" || !data.embed) {
    throw new Error("This video is no longer available.");
  }
  return data;
}

function interleave(first: Video[], second: Video[]): Video[] {
  const result: Video[] = [];
  let i = 0;
  let j = 0;
  while (i < first.length || j < second.length) {
    const firstRatio = first.length ? i / first.length : 1;
    const secondRatio = second.length ? j / second.length : 1;
    if (i < first.length && (j >= second.length || firstRatio <= secondRatio)) {
      result.push(first[i]);
      i += 1;
    } else {
      result.push(second[j]);
      j += 1;
    }
  }
  return result;
}

const CACHE_TTL = 10 * 60_000;
const CACHE_MAX = 150;
const resultCache = new Map<string, { at: number; data: VideoSearchResponse }>();

// ---- Actress / category searches -------------------------------------------------------------
// These results are filtered client-side (one video = one actress / category), so many API items are dropped.
// To keep every page full we read API pages one after another into a per-search "stream" and cut our own pages from it.
const STRICT_FETCH_SIZE = 40;
const MAX_FETCHES_PER_CALL = 6;
const MAX_API_PAGES = 100;
const MAX_STREAMS = 40;

interface Stream {
  items: Video[];
  nextPage: number;
  exhausted: boolean;
  at: number;
  lock: Promise<unknown>;
}

const streams = new Map<string, Stream>();

function getStream(key: string): Stream {
  let stream = streams.get(key);
  if (!stream || Date.now() - stream.at > CACHE_TTL) {
    stream = { items: [], nextPage: 1, exhausted: false, at: Date.now(), lock: Promise.resolve() };
    streams.set(key, stream);
    if (streams.size > MAX_STREAMS) {
      const oldest = streams.keys().next().value;
      if (oldest !== undefined) streams.delete(oldest);
    }
  }
  return stream;
}

function firstFailure(results: Array<PromiseSettledResult<unknown>>): unknown {
  const failed = results.find((item): item is PromiseRejectedResult => item.status === "rejected");
  return failed?.reason;
}

async function searchStrict({
  query,
  page,
  order,
  perPage,
  source,
  signal,
}: {
  query: string;
  page: number;
  order: VideoOrder;
  perPage: number;
  source: Source;
  signal?: AbortSignal;
}): Promise<VideoSearchResponse> {
  const useEporner = source !== "pornhub";
  const usePornhub = source !== "eporner";
  const stream = getStream(`${source}|${order}|${tokens(query).join(" ")}`);

  const run = async () => {
    const wanted = page * perPage;
    let fetches = 0;
    while (stream.items.length < wanted && !stream.exhausted && fetches < MAX_FETCHES_PER_CALL) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      const apiPage = stream.nextPage;
      const [eporner, pornhub] = await Promise.allSettled([
        useEporner ? searchEporner({ query, page: apiPage, order, perPage: STRICT_FETCH_SIZE, signal }) : Promise.resolve(null),
        usePornhub ? searchPornhub({ query, page: apiPage, order, signal }) : Promise.resolve(null),
      ]);
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

      const first = eporner.status === "fulfilled" ? eporner.value : null;
      const second = pornhub.status === "fulfilled" ? pornhub.value : null;
      if (!first && !second) {
        const failure = firstFailure([eporner, pornhub]);
        if (stream.items.length === 0 && failure) throw failure;
        break;
      }

      const fresh = interleave(
        (first?.videos ?? []).filter((item) => isRelevant(item, query)),
        (second?.videos ?? []).filter((item) => isRelevant(item, query)),
      );
      stream.items.push(...dedupeVideos(fresh, stream.items));
      stream.nextPage = apiPage + 1;

      const raw = (first?.videos.length ?? 0) + (second?.videos.length ?? 0);
      const lastPage = Math.max(first?.total_pages ?? 0, second?.total_pages ?? 0);
      if (raw === 0 || apiPage >= lastPage || apiPage >= MAX_API_PAGES) stream.exhausted = true;
      fetches += 1;
    }
  };

  // Calls for the same search run one after another so the stream never gets two writers.
  const job = stream.lock.then(run, run);
  stream.lock = job.catch(() => undefined);
  await job;

  const start = (page - 1) * perPage;
  const videos = stream.items.slice(start, start + perPage);
  if (order === "longest") videos.sort((a, b) => b.length_sec - a.length_sec);
  if (order === "shortest") videos.sort((a, b) => a.length_sec - b.length_sec);

  const found = stream.items.length;
  const totalPages = stream.exhausted ? Math.max(1, Math.ceil(found / perPage)) : Math.max(page, Math.ceil(found / perPage) + 1);

  return {
    count: videos.length,
    start,
    per_page: perPage,
    page,
    // Honest number: only videos that really passed the filter (not the raw API total).
    total_count: found,
    total_pages: totalPages,
    videos,
  };
}

// ---- Free-text searches ----------------------------------------------------------------------
export async function searchVideos({
  query = "all",
  page = 1,
  order = "most-popular",
  perPage = 24,
  source = "both",
  signal,
}: {
  query?: string;
  page?: number;
  order?: VideoOrder;
  perPage?: number;
  source?: Source;
  signal?: AbortSignal;
} = {}): Promise<VideoSearchResponse> {
  if (isStrictQuery(query)) return searchStrict({ query, page, order, perPage, source, signal });

  const useEporner = source !== "pornhub";
  const usePornhub = source !== "eporner";
  const group = `${source}|${order}|${perPage}|${tokens(query).join(" ") || "all"}|`;
  const cacheKey = `${group}${page}`;

  const hit = resultCache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.data;

  const [eporner, pornhub] = await Promise.allSettled([
    useEporner ? searchEporner({ query, page, order, perPage, signal }) : Promise.resolve(null),
    usePornhub ? searchPornhub({ query, page, order, signal }) : Promise.resolve(null),
  ]);

  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const answered = [eporner, pornhub].some((item) => item.status === "fulfilled" && item.value);
  if (!answered) throw firstFailure([eporner, pornhub]) ?? new Error("The API returned an unexpected response.");

  const first = eporner.status === "fulfilled" ? eporner.value : null;
  const second = pornhub.status === "fulfilled" ? pornhub.value : null;

  // 1) drop reposts inside this page (also across the two sources)
  let videos = dedupeVideos(interleave(first?.videos ?? [], second?.videos ?? []));

  // 2) drop videos that were already shown on other pages of the same search
  const others: Video[] = [];
  for (const [key, entry] of resultCache) {
    if (key.startsWith(group) && key !== cacheKey) others.push(...entry.data.videos);
  }
  videos = dedupeVideos(videos, others);

  if (order === "longest") videos.sort((a, b) => b.length_sec - a.length_sec);
  if (order === "shortest") videos.sort((a, b) => a.length_sec - b.length_sec);

  const data: VideoSearchResponse = {
    count: videos.length,
    start: 0,
    per_page: videos.length,
    page,
    total_count: (first?.total_count ?? 0) + (second?.total_count ?? 0),
    total_pages: Math.max(first?.total_pages ?? 1, second?.total_pages ?? 1),
    videos,
  };

  resultCache.set(cacheKey, { at: Date.now(), data });
  if (resultCache.size > CACHE_MAX) {
    const oldest = resultCache.keys().next().value;
    if (oldest !== undefined) resultCache.delete(oldest);
  }
  return data;
}

export async function getVideo(id: string, signal?: AbortSignal): Promise<Video> {
  return id.startsWith(PORNHUB_PREFIX) ? getPornhubVideo(id, signal) : getEpornerVideo(id, signal);
}

export function parseKeywords(video: Video): string[] {
  return (video.keywords ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 1 && item.length < 28);
}

export async function searchRelated(video: Video, signal?: AbortSignal): Promise<Video[]> {
  const keywords = parseKeywords(video).slice(0, 3);
  const seen = new Set<string>([video.id]);
  const result: Video[] = [];

  const collect = (items: Video[]) => {
    for (const item of items) {
      if (seen.has(item.id) || isSameVideo(item, video) || result.some((other) => isSameVideo(item, other))) continue;
      seen.add(item.id);
      result.push(item);
    }
  };

  for (const keyword of keywords) {
    if (result.length >= 12) break;
    try {
      const data = await searchVideos({ query: keyword, perPage: 16, order: "most-popular", signal });
      collect(data.videos);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
    }
  }

  if (result.length < 8) {
    const data = await searchVideos({ query: "all", perPage: 16, order: "top-weekly", signal });
    collect(data.videos);
  }

  return result.slice(0, 12);
}
