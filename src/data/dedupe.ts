import type { Video } from "../types/video";
import { ACTRESSES } from "./catalog";

const FILLER = new Set([
  "the", "and", "with", "her", "his", "for", "from", "that", "this", "she", "has", "into", "your", "you", "are", "was",
  "video", "videos", "full", "new", "porn", "sex", "hot", "best", "part", "scene", "movie", "official", "free", "xxx", "fucks", "fucking", "fuck",
]);

const NAME_TOKENS = new Set<string>();
for (const name of ACTRESSES) {
  for (const word of name.toLowerCase().split(/[^a-z0-9]+/)) if (word.length > 1) NAME_TOKENS.add(word);
}

export function titleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[\[(][^\])]*[\])]/g, " ")
    .replace(/\b(\d{3,4}p|4k|uhd|fullhd|full hd|hd|full video|full movie)\b/g, " ")
    .replace(/[^a-z0-9\u0400-\u04ff]+/g, "")
    .trim();
}

const tokenCache = new Map<string, Set<string>>();

function titleTokens(title: string): Set<string> {
  const cached = tokenCache.get(title);
  if (cached) return cached;
  const result = new Set<string>();
  const cleaned = title
    .toLowerCase()
    .replace(/[\[(][^\])]*[\])]/g, " ")
    .replace(/\b(\d{3,4}p|4k|uhd|fullhd|hd)\b/g, " ");
  for (const word of cleaned.split(/[^a-z0-9\u0400-\u04ff]+/)) {
    if (word.length < 3 || FILLER.has(word) || NAME_TOKENS.has(word)) continue;
    result.add(word.length > 4 && word.endsWith("s") ? word.slice(0, -1) : word);
  }
  if (tokenCache.size > 4000) tokenCache.clear();
  tokenCache.set(title, result);
  return result;
}

function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const word of a) if (b.has(word)) shared += 1;
  return shared / Math.min(a.size, b.size);
}

export function isSameVideo(a: Video, b: Video): boolean {
  if (a.id === b.id) return true;
  const keyA = titleKey(a.title);
  if (keyA.length >= 6 && keyA === titleKey(b.title)) {
    if (!a.length_sec || !b.length_sec) return true;
    if (Math.abs(a.length_sec - b.length_sec) <= 20) return true;
  }
  if (!a.length_sec || !b.length_sec) return false;
  const diff = Math.abs(a.length_sec - b.length_sec);
  const shortest = Math.min(a.length_sec, b.length_sec);
  const tokensA = titleTokens(a.title);
  const tokensB = titleTokens(b.title);
  const similarity = overlap(tokensA, tokensB);
  if (diff <= 2 && shortest >= 60 && similarity >= 0.5) return true;
  if (diff === 0 && shortest >= 180 && similarity >= 0.25) return true;
  if (diff <= 20 && Math.min(tokensA.size, tokensB.size) >= 3 && similarity >= 0.8) return true;
  return false;
}

export function dedupeVideos(videos: Video[], existing: Video[] = []): Video[] {
  const known: Video[] = [...existing];
  const seenIds = new Set<string>(existing.map((video) => video.id));
  const result: Video[] = [];
  for (const video of videos) {
    if (seenIds.has(video.id)) continue;
    if (known.some((other) => isSameVideo(video, other))) continue;
    known.push(video);
    seenIds.add(video.id);
    result.push(video);
  }
  return result;
}
