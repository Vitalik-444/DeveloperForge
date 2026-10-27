import type { Video } from "../types/video";
import { ACTRESSES, ACTRESS_RU, CATEGORIES } from "./catalog";

// true  -> a video is shown under ONE actress and ONE category only (its "primary" one).
// false -> a video may appear under every actress / category it matches.
export const EXCLUSIVE_PLACEMENT = true;

export function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04ff]+/g, " ")
    .split(" ")
    .filter(Boolean);
}

const SUFFIXES = ["s", "es", "ing", "ed"];

// Whole-word match with simple plural / -ing forms. No more prefix matching ("anal" used to match "analysis").
function sameWord(word: string, token: string): boolean {
  return word === token || (token.length >= 4 && SUFFIXES.some((suffix) => word === token + suffix));
}

// Words must be adjacent and in order: "Lena Paul" no longer matches "Lena The Plug ... Paul".
function findPhrase(words: string[], phrase: string[]): number {
  if (!phrase.length) return -1;
  for (let start = 0; start + phrase.length <= words.length; start += 1) {
    let ok = true;
    for (let offset = 0; offset < phrase.length; offset += 1) {
      if (!sameWord(words[start + offset], phrase[offset])) {
        ok = false;
        break;
      }
    }
    if (ok) return start;
  }
  if (phrase.length > 1) return words.indexOf(phrase.join(""));
  return -1;
}

interface Subject {
  id: string;
  titleOnly?: boolean;
  phrases: string[][];
  generic: boolean;
  order: number;
}

// Categories where a video may appear even when another category is its "primary" one
// (clothing, places, positions... are almost always secondary tags, so exclusive placement left them nearly empty).
const SHARED_CATEGORIES = new Set(CATEGORIES.filter((item) => item.shared).map((item) => item.slug));

const GENERIC = new Set(["amateur", "couple", "group", "solo", "hardcore", "compilation", "4k", "pov", "webcam", "orgasm"]);

const CATEGORY_PHRASES: Record<string, string[]> = {
  "4k": ["4k", "uhd", "2160p", "2160"],
  milf: ["milf", "mom", "mommy", "stepmom", "step mom"],
  amateur: ["amateur", "homemade", "home made"],
  blonde: ["blonde", "blond"],
  redhead: ["redhead", "ginger"],
  latina: ["latina", "latin"],
  indian: ["indian", "desi"],
  arab: ["arab", "arabic"],
  japanese: ["japanese", "japan"],
  british: ["british", "uk"],
  french: ["french", "france"],
  petite: ["petite", "tiny"],
  bbw: ["bbw", "chubby", "plump"],
  "big ass": ["big ass", "big butt", "big booty", "huge ass", "fat ass"],
  "big tits": ["big tits", "big boobs", "huge tits", "huge boobs", "big natural tits", "big breasts"],
  tattoo: ["tattoo", "tattooed", "inked"],
  feet: ["feet", "foot", "footjob", "soles"],
  "high heels": ["high heels", "heels", "stilettos"],
  stockings: ["stockings", "stocking", "nylon"],
  lingerie: ["lingerie", "underwear", "panties", "panty", "bra", "bras", "thong", "g string", "gstring", "corset", "bodysuit", "negligee", "babydoll", "lace", "garter", "garters", "teddy", "see through", "sheer", "nightie", "nightgown"],
  blowjob: ["blowjob", "blow job"],
  deepthroat: ["deepthroat", "deep throat"],
  handjob: ["handjob", "hand job"],
  creampie: ["creampie", "cream pie"],
  threesome: ["threesome", "3some"],
  group: ["group", "group sex", "groupsex"],
  webcam: ["webcam", "web cam", "camgirl", "cam girl"],
  cosplay: ["cosplay", "cosplayer"],
  outdoor: ["outdoor", "outside", "public"],
  vintage: ["vintage", "retro"],
  romantic: ["romantic", "sensual"],
  fitness: ["fitness", "gym", "workout", "yoga"],
  casting: ["casting", "audition"],
  bath: ["bath", "bathtub"],
  pool: ["pool", "swimming pool"],
  tall: ["tall"],
  skinny: ["skinny", "slim", "thin"],
  "small tits": ["small tits", "small boobs", "small breasts", "flat chest"],
  "natural tits": ["natural tits", "natural boobs", "natural breasts"],
  freckles: ["freckles", "freckled"],
  piercing: ["piercing", "piercings", "pierced"],
  shaved: ["shaved", "shaved pussy", "bald pussy"],
  "short hair": ["short hair", "pixie"],
  chinese: ["chinese", "china"],
  korean: ["korean", "korea"],
  thai: ["thai", "thailand"],
  ukrainian: ["ukrainian", "ukraine"],
  polish: ["polish", "poland"],
  italian: ["italian", "italy"],
  spanish: ["spanish", "spain"],
  swedish: ["swedish", "sweden"],
  hungarian: ["hungarian", "hungary"],
  brazilian: ["brazilian", "brazil"],
  colombian: ["colombian", "colombia"],
  granny: ["granny", "grandma", "gilf"],
  wife: ["wife", "wifey"],
  girlfriend: ["girlfriend", "gf"],
  housewife: ["housewife", "house wife"],
  orgy: ["orgy"],
  gangbang: ["gangbang", "gang bang"],
  swingers: ["swingers", "swinger", "swinging"],
  missionary: ["missionary"],
  doggystyle: ["doggystyle", "doggy style", "doggy", "from behind"],
  cowgirl: ["cowgirl", "cow girl"],
  "reverse cowgirl": ["reverse cowgirl", "reverse cow girl"],
  spooning: ["spooning", "spoon"],
  "69": ["69", "sixty nine"],
  standing: ["standing", "stand up"],
  "face sitting": ["face sitting", "facesitting"],
  titfuck: ["titfuck", "tit fuck", "titjob", "tit job", "titty fuck"],
  "pussy licking": ["pussy licking", "cunnilingus", "eating pussy", "licking pussy", "pussy eating"],
  fingering: ["fingering", "finger fuck", "fingerfuck"],
  masturbation: ["masturbation", "masturbating", "masturbates"],
  facial: ["facial", "cum on face"],
  cumshot: ["cumshot", "cum shot", "cum in mouth"],
  "double penetration": ["double penetration", "dp"],
  "sex toys": ["sex toys", "sex toy", "toy", "toys", "dildo", "vibrator", "vibrators"],
  beach: ["beach", "seaside"],
  kitchen: ["kitchen"],
  hotel: ["hotel", "motel"],
  car: ["car sex", "in car", "car", "backseat", "back seat"],
  gym: ["gym", "locker room"],
  bedroom: ["bedroom"],
  sauna: ["sauna", "steam room", "banya"],
  couch: ["couch", "sofa", "living room"],
  balcony: ["balcony", "terrace"],
  roleplay: ["roleplay", "role play"],
  teacher: ["teacher"],
  nurse: ["nurse"],
  secretary: ["secretary"],
  maid: ["maid", "housekeeper"],
  photoshoot: ["photoshoot", "photo shoot", "photographer"],
  pickup: ["pickup", "pick up", "picked up", "stranger"],
  vacation: ["vacation", "holiday", "resort"],
  neighbor: ["neighbor", "neighbour"],
  cheating: ["cheating", "cheat", "affair", "unfaithful"],
  striptease: ["striptease", "strip tease", "stripper", "lap dance"],
  pantyhose: ["pantyhose", "tights"],
  fishnet: ["fishnet", "fishnets"],
  bikini: ["bikini", "swimsuit", "bathing suit"],
  uniform: ["uniform"],
  latex: ["latex", "rubber", "pvc"],
  leather: ["leather"],
  leggings: ["leggings", "yoga pants"],
  dress: ["dress", "sundress", "mini dress"],
  skirt: ["skirt", "miniskirt", "mini skirt"],
  spanking: ["spanking", "spank", "spanked"],
  cuckold: ["cuckold", "cuckolding", "hotwife"],
  strapon: ["strapon", "strap on", "pegging"],
  "dirty talk": ["dirty talk", "talking dirty"],
  vr: ["vr", "virtual reality"],
  hentai: ["hentai"],
  anime: ["anime"],
  cartoon: ["cartoon", "toon", "animation", "animated"],
  "3d hentai": ["3d hentai", "3d animation", "3d", "sfm", "blender"],
  "uncensored hentai": ["uncensored hentai", "hentai uncensored", "uncensored anime"],
  "60fps": ["60fps", "60 fps"],
  "1080p": ["1080p", "full hd", "fullhd"],
  "full movie": ["full movie", "full length"],
};

const ACTRESS_PHRASES: Record<string, string[]> = {
  "Kuporovaa Krupa": [
    "Kuporovaa Krupa",
    "Kuporova Krupa",
    "kuporovaakrupa",
    "kuporovaa",
    "kuporova",
  ],
};

const TITLE_ONLY_ACTRESSES = new Set<string>(["Loly Lips"]);

const ACTRESS_SUBJECTS: Subject[] = ACTRESSES.map((name, order) => {
  const custom = ACTRESS_PHRASES[name] ?? [];
  const ruAliases = ACTRESS_RU[name] ?? [];
  const phraseStrings = [name, ...custom, ...ruAliases];
  return {
    id: name,
    titleOnly: TITLE_ONLY_ACTRESSES.has(name),
    phrases: phraseStrings.map(tokens).filter((list) => list.length > 0),
    generic: false,
    order,
  };
});

const CATEGORY_SUBJECTS: Subject[] = CATEGORIES.map((item, order) => ({
  id: item.slug,
  phrases: (CATEGORY_PHRASES[item.slug] ?? [item.slug]).map(tokens),
  generic: GENERIC.has(item.slug),
  order,
}));

const ACTRESS_BY_KEY = new Map<string, string>();
for (const subject of ACTRESS_SUBJECTS) {
  for (const phrase of subject.phrases) {
    const k = phrase.join(" ");
    if (k && !ACTRESS_BY_KEY.has(k)) {
      ACTRESS_BY_KEY.set(k, subject.id);
    }
  }
}
const CATEGORY_BY_KEY = new Map<string, string>(CATEGORIES.map((item) => [tokens(item.slug).join(" "), item.slug]));

function exactKey(query: string): string {
  return tokens(query).join(" ");
}

export function isStrictQuery(query: string): boolean {
  const key = exactKey(query);
  return ACTRESS_BY_KEY.has(key) || CATEGORY_BY_KEY.has(key);
}

interface Prepared {
  title: string[];
  tags: string[][];
  lookalike: boolean;
}

function prepare(video: Video): Prepared {
  const title = tokens(video.title);
  const tags = (video.keywords ?? "")
    .split(",")
    .map(tokens)
    .filter((words) => words.length > 0);
  const lookalike = title.some((word) => word === "lookalike" || word === "doppelganger" || word === "wannabe");
  return { title, tags, lookalike };
}

// Earlier = stronger. Title hits beat tag hits; Infinity = no match.
function positionOf(prepared: Prepared, subject: Subject, ignoreTitle = false): number {
  let best = Infinity;
  for (const phrase of subject.phrases) {
    if (!ignoreTitle) {
      const index = findPhrase(prepared.title, phrase);
      if (index >= 0) best = Math.min(best, index);
    }
    if (subject.titleOnly) continue;
    prepared.tags.forEach((tag, tagIndex) => {
      if (findPhrase(tag, phrase) >= 0) best = Math.min(best, 1000 + tagIndex);
    });
  }
  return best;
}

export interface Placement {
  actress?: string;
  category?: string;
  actresses: string[];
  categories: string[];
}

const placements = new WeakMap<Video, Placement>();

export function classify(video: Video): Placement {
  const known = placements.get(video);
  if (known) return known;

  const prepared = prepare(video);
  const actresses: Array<{ id: string; pos: number; order: number }> = [];
  for (const subject of ACTRESS_SUBJECTS) {
    // "X lookalike" videos do not feature X herself, so a title hit does not count.
    const pos = positionOf(prepared, subject, prepared.lookalike);
    if (pos !== Infinity) actresses.push({ id: subject.id, pos, order: subject.order });
  }
  actresses.sort((a, b) => a.pos - b.pos || a.order - b.order);

  const categories: Array<{ id: string; pos: number; order: number; rank: number }> = [];
  for (const subject of CATEGORY_SUBJECTS) {
    const pos = positionOf(prepared, subject);
    if (pos !== Infinity) categories.push({ id: subject.id, pos, order: subject.order, rank: subject.generic ? 2 : SHARED_CATEGORIES.has(subject.id) ? 1 : 0 });
  }
  // Main categories (looks, origin, acts...) win over secondary tags (clothing, places...) and generic ones (amateur, pov, 4k...), then the earliest mention wins.
  categories.sort((a, b) => a.rank - b.rank || a.pos - b.pos || a.order - b.order);

  const result: Placement = {
    actress: actresses[0]?.id,
    category: categories[0]?.id,
    actresses: actresses.map((item) => item.id),
    categories: categories.map((item) => item.id),
  };
  placements.set(video, result);
  return result;
}

export function isRelevant(video: Video, query: string): boolean {
  const key = exactKey(query);
  const actress = ACTRESS_BY_KEY.get(key);
  const category = CATEGORY_BY_KEY.get(key);
  if (!actress && !category) return true;

  const placement = classify(video);
  if (actress) return EXCLUSIVE_PLACEMENT ? placement.actress === actress : placement.actresses.includes(actress);
  if (SHARED_CATEGORIES.has(category as string)) return placement.categories.includes(category as string);
  return EXCLUSIVE_PLACEMENT ? placement.category === category : placement.categories.includes(category as string);
}
