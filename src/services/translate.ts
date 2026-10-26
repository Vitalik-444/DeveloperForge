import { TRANSLATE_KEY } from "../storage";

type Pair = "en|ru" | "ru|en";

const MAX_ENTRIES = 3000;
const MAX_PARALLEL = 2;
const FLUSH_MS = 40;
const BATCH_ITEMS = 10;
const BATCH_CHARS = 1200;
const MAX_TEXT = 900;

let cache: Record<string, string> | null = null;
let saveTimer: number | undefined;
let running = 0;
let blockedUntil = 0;
let flushTimer: number | undefined;
let proxyDead = false;
const queue: Array<() => void> = [];
const inflight = new Map<string, Promise<string>>();

interface Pending {
  text: string;
  resolve: (value: string) => void;
  reject: (reason: Error) => void;
}

const pending: Record<Pair, Map<string, Pending>> = { "en|ru": new Map(), "ru|en": new Map() };

class HttpError extends Error {
  status: number;
  constructor(status: number) {
    super(`HTTP ${status}`);
    this.status = status;
  }
}

class MismatchError extends Error {}

function loadCache(): Record<string, string> {
  if (cache) return cache;
  try {
    localStorage.removeItem("noir-translate-v1");
    const raw = localStorage.getItem(TRANSLATE_KEY);
    cache = raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    cache = {};
  }
  return cache;
}

function saveCache() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    const store = loadCache();
    const keys = Object.keys(store);
    if (keys.length > MAX_ENTRIES) {
      for (const key of keys.slice(0, keys.length - MAX_ENTRIES)) delete store[key];
    }
    try {
      localStorage.setItem(TRANSLATE_KEY, JSON.stringify(store));
    } catch {
      return;
    }
  }, 600);
}

function keyOf(text: string, pair: Pair) {
  return `${pair}|${text}`;
}

export function hasCyrillic(text: string) {
  return /[а-яёіїєґ]/i.test(text);
}

export function peekTranslation(text: string, pair: Pair): string | undefined {
  return loadCache()[keyOf(text.replace(/\s+/g, " ").trim(), pair)];
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function schedule<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      running += 1;
      task()
        .then(resolve, reject)
        .finally(() => {
          running -= 1;
          queue.shift()?.();
        });
    };
    if (running < MAX_PARALLEL) run();
    else queue.push(run);
  });
}

async function fetchJson(url: string): Promise<unknown> {
  const wait = blockedUntil - Date.now();
  if (wait > 0) await sleep(wait);
  const response = await fetch(url);
  if (!response.ok) throw new HttpError(response.status);
  return response.json();
}

function isRetryable(error: unknown) {
  if (error instanceof HttpError) return error.status === 429 || error.status >= 500;
  return error instanceof TypeError;
}

// Retry with backoff; a global cooldown makes every other request wait too, so we do not hammer a rate-limited endpoint.
async function withRetry<T>(task: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (!isRetryable(error)) throw error;
      const delay = 1200 * 2 ** attempt + Math.random() * 400;
      blockedUntil = Math.max(blockedUntil, Date.now() + delay);
      await sleep(delay);
    }
  }
  throw lastError;
}

// Several titles go into ONE request (one per line), so a page of 24 cards costs 3 requests instead of 24.
async function googleLines(lines: string[], pair: Pair): Promise<string[]> {
  const [from, to] = pair.split("|");
  const params = new URLSearchParams({ client: "gtx", sl: from, tl: to, dt: "t", q: lines.join("\n") });
  const data = (await fetchJson(`https://translate.googleapis.com/translate_a/single?${params.toString()}`)) as [Array<[string | null]>];
  const text = (data[0] ?? []).map((part) => part?.[0] ?? "").join("");
  const out = text.trim().split("\n").map((line) => line.trim());
  if (out.length !== lines.length || out.some((line) => !line)) throw new MismatchError("Batch size mismatch");
  return out;
}

async function proxyLines(lines: string[], pair: Pair): Promise<string[]> {
  const [from, to] = pair.split("|");
  let response: Response;
  try {
    response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: lines.join("\n"), sl: from, tl: to }),
    });
  } catch {
    throw new Error("Proxy unreachable");
  }
  if (response.status === 429 || response.status >= 500) throw new HttpError(response.status);
  let data: { text?: string } | null = null;
  try {
    data = (await response.json()) as { text?: string };
  } catch {
    data = null;
  }
  if (!response.ok || !data || typeof data.text !== "string") {
    proxyDead = true;
    throw new Error("Proxy unavailable");
  }
  const out = data.text.trim().split("\n").map((line) => line.trim());
  if (out.length !== lines.length || out.some((line) => !line)) throw new MismatchError("Batch size mismatch");
  return out;
}

const MYMEMORY_JUNK = /MYMEMORY WARNING|QUERY LENGTH LIMIT|PLEASE SELECT TWO DISTINCT|INVALID LANGUAGE|NO QUERY SPECIFIED/i;

async function myMemory(text: string, pair: Pair): Promise<string> {
  if (text.length > 450) throw new Error("Too long for MyMemory");
  const params = new URLSearchParams({ q: text, langpair: pair });
  const data = (await fetchJson(`https://api.mymemory.translated.net/get?${params.toString()}`)) as {
    responseStatus?: number | string;
    responseData?: { translatedText?: string };
  };
  const result = data.responseData?.translatedText?.trim();
  if (!result || Number(data.responseStatus) !== 200 || MYMEMORY_JUNK.test(result)) throw new Error("Bad MyMemory answer");
  return result;
}

async function translateChunk(lines: string[], pair: Pair): Promise<Array<string | null>> {
  const providers = [proxyLines, googleLines];
  for (const provider of providers) {
    if (provider === proxyLines && proxyDead) continue;
    try {
      return await withRetry(() => provider(lines, pair), provider === proxyLines ? 2 : 3);
    } catch (error) {
      if (error instanceof MismatchError && lines.length > 1) {
        const middle = Math.ceil(lines.length / 2);
        const left = await translateChunk(lines.slice(0, middle), pair);
        const right = await translateChunk(lines.slice(middle), pair);
        return [...left, ...right];
      }
    }
  }
  // Google failed for this chunk: try the backup provider line by line.
  const results: Array<string | null> = [];
  for (const line of lines) {
    try {
      results.push(await withRetry(() => myMemory(line, pair), 2));
    } catch {
      results.push(null);
    }
  }
  return results;
}

async function runChunk(items: Pending[], pair: Pair) {
  const results = await translateChunk(items.map((item) => item.text), pair);
  const store = loadCache();
  items.forEach((item, index) => {
    const result = results[index];
    if (result) {
      store[keyOf(item.text, pair)] = result;
      item.resolve(result);
    } else {
      item.reject(new Error("Translation failed"));
    }
  });
  saveCache();
}

function flush() {
  for (const pair of ["en|ru", "ru|en"] as Pair[]) {
    const items = Array.from(pending[pair].values());
    pending[pair].clear();
    let chunk: Pending[] = [];
    let chars = 0;
    const send = () => {
      if (!chunk.length) return;
      const batch = chunk;
      chunk = [];
      chars = 0;
      void schedule(() => runChunk(batch, pair));
    };
    for (const item of items) {
      if (chunk.length >= BATCH_ITEMS || chars + item.text.length > BATCH_CHARS) send();
      chunk.push(item);
      chars += item.text.length;
    }
    send();
  }
}

export function translateText(text: string, pair: Pair): Promise<string> {
  const clean = text.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT);
  if (!clean) return Promise.resolve(text);
  const key = keyOf(clean, pair);
  const cached = loadCache()[key];
  if (cached) return Promise.resolve(cached);
  const existing = inflight.get(key);
  if (existing) return existing;

  const job = new Promise<string>((resolve, reject) => {
    pending[pair].set(key, { text: clean, resolve, reject });
    if (flushTimer === undefined) {
      flushTimer = window.setTimeout(() => {
        flushTimer = undefined;
        flush();
      }, FLUSH_MS);
    }
  }).finally(() => inflight.delete(key));

  inflight.set(key, job);
  return job;
}
