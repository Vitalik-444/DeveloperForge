export interface EpornerThumbnail {
  size: string;
  width: number;
  height: number;
  src: string;
}

export interface Video {
  id: string;
  title: string;
  keywords?: string;
  views: number;
  rate: string;
  url: string;
  added: string;
  length_sec: number;
  length_min: string;
  embed: string;
  default_thumb?: EpornerThumbnail;
  thumbs?: EpornerThumbnail[];
}

export interface VideoSearchResponse {
  count: number;
  start: number;
  per_page: number;
  page: number;
  total_count: number;
  total_pages: number;
  videos: Video[];
}

export type Source = "both" | "eporner" | "pornhub";
