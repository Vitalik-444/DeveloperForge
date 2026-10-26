import type { Video } from "../types/video";

// Reposts of the same clip (Eporner vs Pornhub, or several uploads on one site) differ only by id,
// resolution tags and punctuation, so compare a cleaned-up title plus the duration.
export function titleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[\[(][^\])]*[\])]/g, " ")
    .replace(/\b(\d{3,4}p|4k|uhd|fullhd|full hd|hd|full video|full movie)\b/g, " ")
    .replace(/[^a-z0-9\u0400-\u04ff]+/g, "")
    .trim();
}

export function isSameVideo(a: Video, b: Video): boolean {
  if (a.id === b.id) return true;
  const keyA = titleKey(a.title);
  if (keyA.length < 6 || keyA !== titleKey(b.title)) return false;
  if (!a.length_sec || !b.length_sec) return true;
  return Math.abs(a.length_sec - b.length_sec) <= 20;
}

export function dedupeVideos(videos: Video[], existing: Video[] = []): Video[] {
  const buckets = new Map<string, Video[]>();
  const add = (video: Video) => {
    const key = titleKey(video.title);
    const list = buckets.get(key);
    if (list) list.push(video);
    else buckets.set(key, [video]);
  };
  const seenIds = new Set<string>();
  for (const video of existing) {
    add(video);
    seenIds.add(video.id);
  }

  const result: Video[] = [];
  for (const video of videos) {
    if (seenIds.has(video.id)) continue;
    const list = buckets.get(titleKey(video.title));
    if (list?.some((other) => isSameVideo(video, other))) continue;
    add(video);
    seenIds.add(video.id);
    result.push(video);
  }
  return result;
}
