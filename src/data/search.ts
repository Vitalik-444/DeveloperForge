import type { Lang } from "../i18n";
import { translateText } from "../services/translate";
import { ACTRESSES, ACTRESS_RU, CATEGORIES, POPULAR_TERMS } from "./catalog";
import { RU_WORDS, STOP_WORDS } from "./ruWords";

const LAYOUT_EN = "qwertyuiop[]asdfghjkl;'zxcvbnm,.`";
const LAYOUT_RU = "йцукенгшщзхъфывапролджэячсмитьбюё";

const CYRILLIC = /[\u0430-\u044f]/;

export function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function swapLayout(value: string): string {
  return Array.from(value.toLowerCase())
    .map((char) => {
      const index = LAYOUT_EN.indexOf(char);
      return index >= 0 ? LAYOUT_RU[index] : char;
    })
    .join("");
}

const exact = new Map<string, string>();
const prefixes: Array<[string, string]> = [];
const TO_RU = new Map<string, string>();

function setExact(key: string, value: string) {
  const clean = normalize(key);
  if (clean && !exact.has(clean)) exact.set(clean, value);
}

for (const item of CATEGORIES) {
  setExact(item.label.ru, item.slug);
  setExact(item.label.en, item.slug);
  setExact(item.slug, item.slug);
  TO_RU.set(item.slug, item.label.ru);
}

for (const name of ACTRESSES) {
  setExact(name, name);
  const aliases = ACTRESS_RU[name] ?? [];
  for (const alias of aliases) setExact(alias, name);
  if (aliases[0]) TO_RU.set(name.toLowerCase(), aliases[0]);
}

export const ACTRESS_STEMS: Record<string, string[]> = {
  "Kuporovaa Krupa": ["купоров"],
};

for (const [name, stems] of Object.entries(ACTRESS_STEMS)) {
  for (const stem of stems) {
    prefixes.push([normalize(stem), name]);
  }
}

for (const term of POPULAR_TERMS) {
  setExact(term.ru, term.en);
  setExact(term.en, term.en);
  if (!TO_RU.has(term.en)) TO_RU.set(term.en, term.ru);
}

for (const entry of RU_WORDS) {
  for (const raw of entry.stems) {
    const strict = raw.startsWith("=");
    const stem = normalize(strict ? raw.slice(1) : raw);
    if (!stem) continue;
    if (strict || stem.includes(" ") || !CYRILLIC.test(stem)) setExact(stem, entry.en);
    else prefixes.push([stem, entry.en]);
  }
  if (!TO_RU.has(entry.en)) TO_RU.set(entry.en, entry.label);
}

prefixes.sort((a, b) => b[0].length - a[0].length);

function byStem(word: string): string | undefined {
  for (const [stem, en] of prefixes) {
    if (word.startsWith(stem)) return en;
  }
  return undefined;
}

interface WordResult {
  parts: string[];
  unresolved: string[];
}

function resolveWords(norm: string): WordResult {
  const words = norm.split(" ").filter(Boolean);
  const parts: string[] = [];
  const unresolved: string[] = [];
  let index = 0;

  while (index < words.length) {
    let matched = false;
    for (let size = Math.min(3, words.length - index); size >= 1 && !matched; size -= 1) {
      const chunk = words.slice(index, index + size).join(" ");
      const hit = exact.get(chunk) ?? (size === 1 ? byStem(chunk) : undefined);
      if (hit !== undefined) {
        if (!parts.includes(hit)) parts.push(hit);
        index += size;
        matched = true;
      }
    }
    if (matched) continue;

    const word = words[index];
    index += 1;
    if (STOP_WORDS.has(word)) continue;
    if (CYRILLIC.test(word)) unresolved.push(word);
    else parts.push(word);
  }

  return { parts, unresolved };
}

export interface Resolved {
  query: string;
  complete: boolean;
  parts: string[];
  unresolved: string[];
}

export function resolveTerm(input: string): Resolved {
  const clean = input.trim();
  const norm = normalize(clean);
  if (!norm) return { query: "all", complete: true, parts: [], unresolved: [] };

  const direct = exact.get(norm);
  if (direct) return { query: direct, complete: true, parts: [direct], unresolved: [] };

  if (!CYRILLIC.test(norm)) {
    const swapped = swapLayout(norm);
    if (CYRILLIC.test(swapped)) {
      const attempt = resolveWords(swapped);
      if (attempt.unresolved.length === 0 && attempt.parts.length > 0) {
        const query = attempt.parts.join(" ");
        return { query, complete: true, parts: attempt.parts, unresolved: [] };
      }
    }
    return { query: clean, complete: true, parts: [clean], unresolved: [] };
  }

  const { parts, unresolved } = resolveWords(norm);
  if (unresolved.length === 0) {
    const query = parts.join(" ") || "all";
    return { query, complete: true, parts, unresolved };
  }
  return { query: [...parts, ...unresolved].join(" "), complete: false, parts, unresolved };
}

export async function resolveTermAsync(input: string): Promise<{ query: string; translated: boolean }> {
  const resolved = resolveTerm(input);
  if (resolved.complete) return { query: resolved.query, translated: false };
  try {
    const english = await translateText(resolved.unresolved.join(" "), "ru|en");
    const cleaned = normalize(english);
    const query = [...resolved.parts, cleaned].filter(Boolean).join(" ");
    return { query: query || resolved.query, translated: true };
  } catch {
    return { query: resolved.query, translated: false };
  }
}

export function displayTerm(query: string, lang: Lang): string {
  if (lang === "en") return query;
  return TO_RU.get(query.toLowerCase()) ?? query;
}

export function displayActress(name: string, lang: Lang): string {
  return lang === "ru" ? ACTRESS_RU[name]?.[0] ?? name : name;
}

export function getTermPool(lang: Lang): string[] {
  const pool = [
    ...CATEGORIES.map((item) => item.label[lang]),
    ...ACTRESSES,
    ...POPULAR_TERMS.map((term) => term[lang]),
  ];
  if (lang === "ru") {
    for (const name of ACTRESSES) for (const alias of ACTRESS_RU[name] ?? []) pool.push(alias);
    for (const entry of RU_WORDS) pool.push(entry.label);
  }
  return Array.from(new Set(pool.map((item) => item.toLowerCase())));
}

function score(term: string, queries: string[]): number {
  const normTerm = normalize(term);
  const termWords = normTerm.split(" ");
  let best = Infinity;
  for (const query of queries) {
    if (normTerm === query) continue;
    const queryWords = query.split(" ");
    if (normTerm.startsWith(query)) best = Math.min(best, 1);
    else if (queryWords.every((word) => termWords.some((candidate) => candidate.startsWith(word)))) best = Math.min(best, 2);
    else if (normTerm.includes(query)) best = Math.min(best, 3);
  }
  return best;
}

export function matchSuggestions(rawQuery: string, pool: string[], lang: Lang, recent: string[], limit = 8): Array<{ label: string; recent: boolean }> {
  const q = normalize(rawQuery);
  if (!q) return [];

  const queries = [q];
  if (!CYRILLIC.test(q)) {
    const swapped = swapLayout(q);
    if (CYRILLIC.test(swapped)) queries.push(normalize(swapped));
  }

  const found: Array<{ label: string; rank: number; order: number }> = [];
  const seen = new Set<string>();
  const push = (label: string, rank: number, order: number) => {
    const key = normalize(label);
    if (!key || seen.has(key) || key === q) return;
    seen.add(key);
    found.push({ label, rank, order });
  };

  for (const candidate of queries) {
    const resolved = resolveTerm(candidate);
    if (resolved.complete && resolved.parts.length === 1 && resolved.query !== "all") {
      const label = displayTerm(resolved.query, lang);
      if (normalize(label) !== q) push(label, 0, -1);
    }
  }

  pool.forEach((term, order) => {
    const rank = score(term, queries);
    if (rank !== Infinity) push(term, rank, order);
  });

  found.sort((a, b) => a.rank - b.rank || a.order - b.order);
  const recentSet = new Set(recent.map(normalize));
  return found.slice(0, limit).map((item) => ({ label: item.label, recent: recentSet.has(normalize(item.label)) }));
}
