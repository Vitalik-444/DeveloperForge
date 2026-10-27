import type { Lang } from "../i18n";

export type Localized = Record<Lang, string>;

export type GroupId =
  | "looks"
  | "origin"
  | "types"
  | "partners"
  | "positions"
  | "acts"
  | "places"
  | "scenarios"
  | "clothing"
  | "kinks"
  | "hentai"
  | "format";

export interface CategoryGroup {
  id: GroupId;
  label: Localized;
  hint: Localized;
}

export interface Category {
  slug: string;
  group: GroupId;
  label: Localized;
  hint: Localized;
  /** Video may appear on this page even when another category is its "primary" one. */
  shared: boolean;
}

const grp = (id: GroupId, en: string, ru: string, hintEn: string, hintRu: string): CategoryGroup => ({
  id,
  label: { en, ru },
  hint: { en: hintEn, ru: hintRu },
});

export const CATEGORY_GROUPS: CategoryGroup[] = [
  grp("looks", "Looks", "Внешность", "Hair, body & details", "Волосы, фигура и детали"),
  grp("origin", "Origin", "Национальность", "Country & region", "Страна и регион"),
  grp("types", "Age & type", "Возраст и образ", "Mature, wives, girlfriends", "Зрелые, жёны, подруги"),
  grp("partners", "Partners", "Партнёры", "Who is in the frame", "Кто в кадре"),
  grp("positions", "Positions", "Позы", "How it looks", "Как это выглядит"),
  grp("acts", "Acts", "Действия", "What happens", "Что происходит"),
  grp("places", "Places", "Места", "Where it happens", "Где всё происходит"),
  grp("scenarios", "Scenarios", "Сценарии", "Stories & roles", "Сюжеты и роли"),
  grp("clothing", "Clothing", "Одежда", "What she wears", "Что на ней надето"),
  grp("kinks", "Kinks & BDSM", "Фетиши и БДСМ", "Niche tastes", "Особые предпочтения"),
  grp("hentai", "Hentai", "Хентай", "Anime & animation", "Аниме и анимация"),
  grp("format", "Format & style", "Формат и стиль", "Quality & presentation", "Качество и подача"),
];

// Groups whose tags are usually secondary (a clothing item, a room, a position),
// so a video should show up there even if another category is its main one.
const SHARED_GROUPS = new Set<GroupId>(["places", "scenarios", "clothing", "positions", "format"]);

const make =
  (group: GroupId, shared = SHARED_GROUPS.has(group)) =>
  (slug: string, en: string, ru: string, hintEn: string, hintRu: string): Category => ({
    slug,
    group,
    shared,
    label: { en, ru },
    hint: { en: hintEn, ru: hintRu },
  });

const looks = make("looks", false);
const looksExtra = make("looks", true);
const origin = make("origin");
const types = make("types");
const partners = make("partners");
const positions = make("positions");
const acts = make("acts", false);
const actsExtra = make("acts", true);
const places = make("places");
const scenarios = make("scenarios");
const clothing = make("clothing");
const kinks = make("kinks", false);
const kinksExtra = make("kinks", true);
const hentai = make("hentai", false);
const format = make("format");

export const CATEGORIES: Category[] = [
  // --- Looks ---
  looks("blonde", "Blonde", "Блондинки", "Light hair", "Светлые волосы"),
  looks("brunette", "Brunette", "Брюнетки", "Dark hair", "Тёмные волосы"),
  looks("redhead", "Redhead", "Рыжие", "Red hair", "Рыжие волосы"),
  looks("petite", "Petite", "Миниатюрные", "Slim build", "Хрупкое телосложение"),
  looks("bbw", "BBW", "Пышные", "Curvy figures", "Пышные формы"),
  looks("big ass", "Big ass", "Большие попки", "Full curves", "Роскошные изгибы"),
  looks("big tits", "Big tits", "Большая грудь", "Generous bust", "Пышный бюст"),
  looks("hairy", "Hairy", "Волосатые", "Natural look", "Натуральный вид"),
  looks("tattoo", "Tattoo", "Татуировки", "Inked skin", "Тату на теле"),
  looks("glasses", "Glasses", "В очках", "Smart look", "Умный образ"),
  looks("fitness", "Fitness", "Фитнес", "Athletic bodies", "Спортивные тела"),
  looksExtra("tall", "Tall", "Высокие", "Long legs", "Длинные ноги"),
  looksExtra("skinny", "Skinny", "Стройные", "Slim figure", "Стройная фигура"),
  looksExtra("small tits", "Small tits", "Маленькая грудь", "Small bust", "Аккуратный бюст"),
  looksExtra("natural tits", "Natural tits", "Натуральная грудь", "No implants", "Без имплантов"),
  looksExtra("freckles", "Freckles", "Веснушки", "Sun-kissed skin", "Солнечная кожа"),
  looksExtra("piercing", "Piercing", "Пирсинг", "Studs & rings", "Серьги и кольца"),
  looksExtra("shaved", "Shaved", "Гладкие", "Smooth look", "Гладкая кожа"),
  looksExtra("short hair", "Short hair", "Короткая стрижка", "Pixie cuts", "Пикси и каре"),

  // --- Origin ---
  origin("asian", "Asian", "Азиатки", "East & Southeast Asia", "Восточная и Юго-Восточная Азия"),
  origin("latina", "Latina", "Латинки", "Latin America", "Латинская Америка"),
  origin("ebony", "Ebony", "Эбони", "Dark skin", "Тёмная кожа"),
  origin("japanese", "Japanese", "Японки", "Japan", "Япония"),
  origin("chinese", "Chinese", "Китаянки", "China", "Китай"),
  origin("korean", "Korean", "Кореянки", "Korea", "Корея"),
  origin("thai", "Thai", "Тайки", "Thailand", "Таиланд"),
  origin("indian", "Indian", "Индийские", "South Asia", "Южная Азия"),
  origin("arab", "Arab", "Арабские", "Middle East", "Ближний Восток"),
  origin("russian", "Russian", "Русские", "Slavic look", "Славянская внешность"),
  origin("ukrainian", "Ukrainian", "Украинки", "Ukraine", "Украина"),
  origin("polish", "Polish", "Польки", "Poland", "Польша"),
  origin("czech", "Czech", "Чешки", "Central Europe", "Центральная Европа"),
  origin("german", "German", "Немки", "Germany", "Германия"),
  origin("british", "British", "Британки", "United Kingdom", "Великобритания"),
  origin("french", "French", "Француженки", "France", "Франция"),
  origin("italian", "Italian", "Итальянки", "Italy", "Италия"),
  origin("spanish", "Spanish", "Испанки", "Spain", "Испания"),
  origin("swedish", "Swedish", "Шведки", "Sweden", "Швеция"),
  origin("hungarian", "Hungarian", "Венгерки", "Hungary", "Венгрия"),
  origin("brazilian", "Brazilian", "Бразильянки", "Brazil", "Бразилия"),
  origin("colombian", "Colombian", "Колумбийки", "Colombia", "Колумбия"),

  // --- Age & type ---
  types("mature", "Mature", "Зрелые", "Experienced adults", "Опытные взрослые"),
  types("milf", "MILF", "МИЛФ", "Confident & mature", "Уверенные и зрелые"),
  types("granny", "Granny", "Бабушки", "Silver foxes", "Седина и опыт"),
  types("wife", "Wife", "Жёны", "Married life", "Семейная пара"),
  types("girlfriend", "Girlfriend", "Подружки", "Girl next door", "Девушка по соседству"),
  types("housewife", "Housewife", "Домохозяйки", "Home alone", "Дом и уют"),

  // --- Partners ---
  partners("solo", "Solo", "Соло", "Single performer", "Один исполнитель"),
  partners("couple", "Couple", "Пары", "Two partners", "Двое партнёров"),
  partners("lesbian", "Lesbian", "Лесбиянки", "Women together", "Девушки вместе"),
  partners("threesome", "Threesome", "Тройничок", "Three people", "Трое участников"),
  partners("group", "Group", "Групповое", "Bigger company", "Большая компания"),
  partners("orgy", "Orgy", "Оргия", "Big party", "Большая вечеринка"),
  partners("gangbang", "Gangbang", "Гэнгбэнг", "One and many", "Одна и много"),
  partners("swingers", "Swingers", "Свингеры", "Partner swap", "Обмен партнёрами"),
  partners("interracial", "Interracial", "Межрасовое", "Mixed couples", "Смешанные пары"),

  // --- Positions ---
  positions("missionary", "Missionary", "Миссионерская", "Face to face", "Лицом к лицу"),
  positions("doggystyle", "Doggystyle", "Догги-стайл", "From behind", "Сзади"),
  positions("cowgirl", "Cowgirl", "Наездница", "On top", "Сверху"),
  positions("reverse cowgirl", "Reverse cowgirl", "Обратная наездница", "Facing away", "Спиной к партнёру"),
  positions("spooning", "Spooning", "Ложечка", "Side by side", "Лёжа на боку"),
  positions("69", "69", "69", "Mutual oral", "Взаимные ласки"),
  positions("standing", "Standing", "Стоя", "On your feet", "На ногах"),
  positions("face sitting", "Face sitting", "Фейсситтинг", "Sitting on face", "Сверху на лице"),

  // --- Acts ---
  acts("blowjob", "Blowjob", "Минет", "Oral pleasure", "Оральные ласки"),
  acts("deepthroat", "Deepthroat", "Глубокий минет", "Deep oral", "Глубокие оральные ласки"),
  acts("handjob", "Handjob", "Ручная работа", "Hands only", "Только руками"),
  acts("anal", "Anal", "Анал", "Back door", "Анальный секс"),
  acts("creampie", "Creampie", "Крем-пай", "Finish inside", "Финал внутри"),
  acts("squirt", "Squirt", "Сквирт", "Intense release", "Яркая разрядка"),
  acts("orgasm", "Orgasm", "Оргазм", "Real reactions", "Настоящие эмоции"),
  acts("hardcore", "Hardcore", "Хардкор", "Intense & explicit", "Жёстко и откровенно"),
  actsExtra("titfuck", "Titfuck", "Между грудью", "Boob play", "Секс грудью"),
  actsExtra("pussy licking", "Pussy licking", "Кунилингус", "Oral on her", "Ласки для неё"),
  actsExtra("fingering", "Fingering", "Пальчики", "Touch & tease", "Ласки пальцами"),
  actsExtra("masturbation", "Masturbation", "Мастурбация", "Self pleasure", "Для себя"),
  actsExtra("facial", "Facial", "На лицо", "Finish on face", "Финал на лице"),
  actsExtra("cumshot", "Cumshot", "Кончает", "Finish shots", "Яркий финал"),
  actsExtra("double penetration", "Double penetration", "Двойное проникновение", "Two at once", "Двое одновременно"),
  actsExtra("sex toys", "Sex toys", "Игрушки", "Toys & vibes", "Вибраторы и дилдо"),

  // --- Places ---
  places("outdoor", "Outdoor", "На природе", "Public & nature", "Публичные места и природа"),
  places("office", "Office", "Офис", "Work-hours fantasy", "Фантазии рабочих будней"),
  places("shower", "Shower", "Душ", "Water & steam", "Вода и пар"),
  places("bath", "Bath", "Ванна", "Bubbles & candles", "Пена и свечи"),
  places("pool", "Pool", "Бассейн", "Water & sun", "Вода и солнце"),
  places("beach", "Beach", "Пляж", "Sand & sea", "Песок и море"),
  places("kitchen", "Kitchen", "Кухня", "Counter top", "Кухонный стол"),
  places("hotel", "Hotel", "Отель", "Room service", "Номер на двоих"),
  places("car", "Car", "В машине", "Back seat", "Заднее сиденье"),
  places("gym", "Gym", "Спортзал", "Locker room", "Тренажёры и раздевалка"),
  places("bedroom", "Bedroom", "Спальня", "Cozy bed", "Классика"),
  places("sauna", "Sauna", "Сауна", "Steam & heat", "Пар и жар"),
  places("couch", "Couch", "Диван", "Living room", "Гостиная"),
  places("balcony", "Balcony", "Балкон", "Fresh air", "Свежий воздух"),

  // --- Scenarios ---
  scenarios("casting", "Casting", "Кастинг", "Auditions", "Пробы"),
  scenarios("massage", "Massage", "Массаж", "Oil & touch", "Масло и прикосновения"),
  scenarios("romantic", "Romantic", "Романтика", "Slow & sensual", "Нежно и чувственно"),
  scenarios("cosplay", "Cosplay", "Косплей", "Costumes & roleplay", "Костюмы и ролевые игры"),
  scenarios("parody", "Parody", "Пародии", "Spoofs & takes", "Шуточные версии"),
  scenarios("roleplay", "Roleplay", "Ролевые игры", "Play pretend", "Игра в роли"),
  scenarios("teacher", "Teacher", "Учительницы", "Class in session", "Урок для двоих"),
  scenarios("nurse", "Nurse", "Медсёстры", "Check-up", "Осмотр"),
  scenarios("secretary", "Secretary", "Секретарши", "Boss's desk", "Кабинет босса"),
  scenarios("maid", "Maid", "Горничные", "Room cleaning", "Уборка"),
  scenarios("photoshoot", "Photoshoot", "Фотосессия", "Behind the camera", "За кадром"),
  scenarios("pickup", "Pickup", "Знакомство", "Strangers meet", "Случайная встреча"),
  scenarios("vacation", "Vacation", "Отпуск", "Trip & resort", "Поездка и курорт"),
  scenarios("neighbor", "Neighbor", "Соседки", "Next door", "За стенкой"),
  scenarios("cheating", "Cheating", "Измена", "Secret affair", "Тайная связь"),
  scenarios("striptease", "Striptease", "Стриптиз", "Lap dance", "Танец и раздевание"),

  // --- Clothing ---
  clothing("lingerie", "Lingerie", "Бельё", "Lace & silk", "Кружево и шёлк"),
  clothing("stockings", "Stockings", "Чулки", "Nylon & garters", "Нейлон и подвязки"),
  clothing("pantyhose", "Pantyhose", "Колготки", "Sheer tights", "Тонкий нейлон"),
  clothing("fishnet", "Fishnet", "Сеточка", "Mesh patterns", "Рисунок-сетка"),
  clothing("high heels", "High heels", "Каблуки", "Stilettos", "Шпильки"),
  clothing("bikini", "Bikini", "Бикини", "Swimwear", "Купальники"),
  clothing("uniform", "Uniform", "Униформа", "Costume & uniform", "Форма и костюмы"),
  clothing("latex", "Latex", "Латекс", "Shiny & tight", "Блеск и облегание"),
  clothing("leather", "Leather", "Кожа", "Leather outfits", "Кожаные наряды"),
  clothing("leggings", "Leggings", "Леггинсы", "Yoga pants", "Лосины и йога-штаны"),
  clothing("dress", "Dress", "Платья", "Dresses", "Платья и сарафаны"),
  clothing("skirt", "Skirt", "Юбки", "Mini skirts", "Мини и не только"),

  // --- Kinks & BDSM ---
  kinks("bdsm", "BDSM", "БДСМ", "Power exchange", "Доминирование и подчинение"),
  kinks("bondage", "Bondage", "Бондаж", "Ropes & cuffs", "Верёвки и наручники"),
  kinks("femdom", "Femdom", "Фемдом", "Women in charge", "Главная — она"),
  kinks("fetish", "Fetish", "Фетиши", "Niche tastes", "Особые предпочтения"),
  kinks("feet", "Feet", "Ножки", "Soles & toes", "Стопы и пальчики"),
  kinksExtra("spanking", "Spanking", "Шлепки", "Spanking play", "Игры со шлепками"),
  kinksExtra("cuckold", "Cuckold", "Куколд", "Watching partner", "Наблюдает муж"),
  kinksExtra("strapon", "Strapon", "Страпон", "Strap-on play", "Девушка с накладкой"),
  kinksExtra("dirty talk", "Dirty talk", "Грязные разговоры", "Talk & tease", "Слова и стоны"),

  // --- Hentai ---
  hentai("hentai", "Hentai", "Хентай", "Animated adult stories", "Взрослые анимационные истории"),
  hentai("anime", "Anime", "Аниме", "Japanese animation", "Японская анимация"),
  hentai("cartoon", "Cartoon", "Мультфильмы", "Western animation", "Западная анимация"),
  hentai("3d hentai", "3D animation", "3D-анимация", "CGI & 3D renders", "3D-графика и рендеры"),
  hentai("uncensored hentai", "Uncensored", "Без цензуры", "No mosaic", "Без мозаики"),

  // --- Format & style ---
  format("amateur", "Amateur", "Любительское", "Home-made style", "Домашний стиль"),
  format("pov", "POV", "От первого лица", "First person view", "Вид от первого лица"),
  format("vintage", "Vintage", "Ретро", "Retro classics", "Классика прошлого"),
  format("webcam", "Webcam", "Вебкам", "Live-cam style", "Стиль онлайн-трансляций"),
  format("compilation", "Compilation", "Подборки", "Best moments", "Лучшие моменты"),
  format("4k", "4K", "4K", "Ultra HD", "Ультра HD"),
  format("vr", "VR", "VR", "Virtual reality", "Виртуальная реальность"),
  format("60fps", "60 FPS", "60 FPS", "Smooth motion", "Плавное видео"),
  format("1080p", "Full HD", "Full HD", "1080p", "1080p"),
  format("full movie", "Full movies", "Фильмы", "Full length", "Полные версии"),
];

export const categoriesOfGroup = (id: GroupId): Category[] => CATEGORIES.filter((item) => item.group === id);

export const RUSSIAN_ACTRESSES: string[] = [
  "Sweetie Fox",
  "Diana Rider",
  "Luxury Girl",
  "Eva Elfie",
  "Anna Polina",
  "Alina Rai",
  "Katya Clover",
  "Nancy Ace",
  "Kuporovaa Krupa",
  "Comatozze",
  "Loly Lips",
  "Mari Moore",
  "Katty West",
];

export const OTHER_ACTRESSES: string[] = [
  "Angela White",
  "Riley Reid",
  "Mia Malkova",
  "Abella Danger",
  "Adriana Chechik",
  "Lana Rhoades",
  "Lena Paul",
  "Nicole Aniston",
  "Alexis Texas",
  "Kendra Lust",
  "Brandi Love",
  "Mia Khalifa",
  "Sasha Grey",
  "Sunny Leone",
  "Jenna Jameson",
  "Tori Black",
  "Asa Akira",
  "Dani Daniels",
  "Elsa Jean",
  "Emily Willis",
  "Violet Myers",
  "Jessa Rhodes",
  "Gianna Michaels",
  "Sophie Dee",
  "Phoenix Marie",
  "Madison Ivy",
  "Ana Foxxx",
  "Jada Stevens",
  "Karla Kush",
  "Kayden Kross",
  "Stoya",
  "Remy LaCroix",
  "Aletta Ocean",
  "Julia Ann",
  "Cory Chase",
  "Alexis Fawx",
  "Ava Addams",
  "Lisa Ann",
  "Valentina Nappi",
  "Anissa Kate",
  "Sara Jay",
  "Tasha Reign",
  "Jill Kassidy",
  "Gabbie Carter",
  "Alina Lopez",
  "Natasha Nice",
  "Little Caprice",
  "Yua Mikami",
  "Eimi Fukada",
  "Hitomi Tanaka",
  "Maitland Ward",
  "Aidra Fox",
  "Eva Lovia",
  "Cherie DeVille",
  "Nina Hartley",
  "Rachel Starr",
  "Scarlit Scandal",
  "Shyblance",
];

export const ACTRESSES: string[] = [...RUSSIAN_ACTRESSES, ...OTHER_ACTRESSES];

export const ACTRESS_RU: Record<string, string[]> = {
  "Sweetie Fox": ["Свити Фокс", "Суити Фокс"],
  "Diana Rider": ["Диана Райдер", "Диана Рейдер"],
  "Luxury Girl": ["Лакшери Гёрл", "Люкшери Гёрл", "Лакшери Герл", "Лакшери Гирл"],
  "Eva Elfie": ["Ева Эльфи", "Ева Элфи"],
  "Anna Polina": ["Анна Полина"],
  "Alina Rai": ["Алина Рай"],
  "Katya Clover": ["Катя Кловер"],
  "Nancy Ace": ["Нэнси Эйс", "Нанси Эйс"],
  "Kuporovaa Krupa": [
    "Купорова Крупа",
    "Купорова крупа",
    "Купорова",
    "Купоровой крупы",
    "Купоровой крупе",
    "Купорову крупу",
    "Купоровой крупой",
    "Купоровой",
    "Купорову",
    "Kuporova Krupa",
    "Kuporova",
    "kuporovaakrupa",
    "kuporovaa",
  ],
  "Scarlit Scandal": ["Скарлит Скандал", "Скарлет Скандал", "Скарлит Скэндал", "Scarlet Scandal", "scarlitscandal"],
  "Shyblance": ["Шайбланс", "Шай Бланс", "Шибланс", "Shy Blance", "Shy Blanche"],
  "Comatozze": ["Коматозз", "Коматоз", "Коматозе", "Comatoze", "comatozze"],
  "Loly Lips": ["Лоли Липс", "Лолли Липс", "Lolly Lips", "lolylips"],
  "Mari Moore": ["Мари Мур", "Мэри Мур", "Мари Мор"],
  "Katty West": ["Кэтти Вест", "Катти Вест", "Кэти Вест", "Katy West", "Kathy West"],
  "Angela White": ["Анджела Вайт", "Анжела Уайт"],
  "Riley Reid": ["Райли Рид"],
  "Mia Malkova": ["Миа Малкова", "Мия Малкова"],
  "Abella Danger": ["Абелла Дэнджер", "Абелла Дейнджер"],
  "Adriana Chechik": ["Адриана Чечик"],
  "Lana Rhoades": ["Лана Роудс", "Лана Роадс"],
  "Lena Paul": ["Лена Пол"],
  "Nicole Aniston": ["Николь Энистон", "Николь Анистон"],
  "Alexis Texas": ["Алексис Техас"],
  "Kendra Lust": ["Кендра Ласт"],
  "Brandi Love": ["Брэнди Лав", "Бренди Лав"],
  "Mia Khalifa": ["Миа Халифа", "Мия Халифа"],
  "Sasha Grey": ["Саша Грей"],
  "Sunny Leone": ["Санни Леоне", "Сани Леоне"],
  "Jenna Jameson": ["Дженна Джеймсон"],
  "Tori Black": ["Тори Блэк"],
  "Dani Daniels": ["Дэни Дэниелс", "Дани Дэниелс"],
  "Elsa Jean": ["Эльза Джин"],
  "Emily Willis": ["Эмили Уиллис"],
  "Valentina Nappi": ["Валентина Наппи"],
  "Little Caprice": ["Литтл Каприз", "Литл Каприз"],
  "Yua Mikami": ["Юа Миками"],
  "Maitland Ward": ["Мэйтленд Уорд"],
  "Lisa Ann": ["Лиза Энн"],
  "Ava Addams": ["Ава Аддамс"],
};

export interface Term {
  en: string;
  ru: string;
}

export const POPULAR_TERMS: Term[] = [
  { en: "popular", ru: "популярное" },
  { en: "hd", ru: "hd" },
  { en: "new", ru: "новое" },
  { en: "homemade", ru: "домашнее" },
  { en: "stockings", ru: "чулки" },
  { en: "office", ru: "офис" },
  { en: "bikini", ru: "бикини" },
  { en: "shower", ru: "душ" },
  { en: "kitchen", ru: "кухня" },
  { en: "hotel", ru: "отель" },
  { en: "casting", ru: "кастинг" },
  { en: "babysitter", ru: "няня" },
  { en: "yoga", ru: "йога" },
  { en: "swimming pool", ru: "бассейн" },
  { en: "uniform", ru: "форма" },
];
