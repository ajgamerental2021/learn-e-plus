/**
 * Thai phonetic helpers for English words.
 *
 * Three things learners need and Google TTS alone does not give them:
 *  1. คำอ่านไทย  — how the whole word sounds, written in Thai script
 *  2. ตัวสะกดไทย — the letter names (bee/oh/ex) written in Thai script
 *  3. speech text that a Thai TTS voice reads slowly and clearly
 *
 * A curated dictionary covers the Pre-A1/A1 vocabulary. Anything outside it
 * falls back to a rule-based transliteration, flagged `approx` so the UI can
 * tell the learner the reading is only a close guess.
 */

export type ThaiReading = {
  text: string;
  /** True when a phrase was assembled word by word rather than read as a whole. */
  perWord: boolean;
};

// ── Letter names ─────────────────────────────────────────────────────────────

/** Thai reading of each English letter name. */
export const THAI_LETTER_NAMES: Record<string, string> = {
  A: "เอ",
  B: "บี",
  C: "ซี",
  D: "ดี",
  E: "อี",
  F: "เอฟ",
  G: "จี",
  H: "เอช",
  I: "ไอ",
  J: "เจ",
  K: "เค",
  L: "แอล",
  M: "เอ็ม",
  N: "เอ็น",
  O: "โอ",
  P: "พี",
  Q: "คิว",
  R: "อาร์",
  S: "เอส",
  T: "ที",
  U: "ยู",
  V: "วี",
  W: "ดับเบิลยู",
  X: "เอ็กซ์",
  Y: "วาย",
  Z: "แซด",
};

/** English letter name spelled out so a TTS voice says the NAME, not the sound. */
const ENGLISH_LETTER_NAMES: Record<string, string> = {
  A: "ay",
  B: "bee",
  C: "see",
  D: "dee",
  E: "ee",
  F: "eff",
  G: "jee",
  H: "aitch",
  I: "eye",
  J: "jay",
  K: "kay",
  L: "ell",
  M: "em",
  N: "en",
  O: "oh",
  P: "pee",
  Q: "cue",
  R: "ar",
  S: "ess",
  T: "tee",
  U: "you",
  V: "vee",
  W: "double you",
  X: "ex",
  Y: "why",
  Z: "zee",
};

const THAI_DIGIT_NAMES: Record<string, string> = {
  "0": "ซี-โร",
  "1": "วัน",
  "2": "ทู",
  "3": "ธรี",
  "4": "โฟร์",
  "5": "ไฟฟ์",
  "6": "ซิกซ์",
  "7": "เซเว่น",
  "8": "เอท",
  "9": "ไนน์",
};

// ── Word dictionary ──────────────────────────────────────────────────────────

/**
 * Curated readings. Keys are lowercase. Keep entries in learner-friendly
 * syllables separated by "-" so both the display and the Thai TTS break the
 * word the same way.
 */
const WORD_READINGS: Record<string, string> = {
  // A
  apple: "แอป-เพิล", ant: "แอนท์", arm: "อาร์ม", air: "แอร์",
  alligator: "แอ-ลิ-เก-เทอร์", anchor: "แอง-เคอร์", arrow: "แอ-โร", astronaut: "แอส-โทร-นอต",
  // B
  book: "บุ๊ก", bag: "แบ็ก", ball: "บอล", bed: "เบด",
  banana: "บะ-แน-นา", bird: "เบิร์ด", boat: "โบท", box: "บ็อกซ์",
  // C
  cat: "แคท", cup: "คัพ", car: "คาร์", cake: "เค้ก",
  cow: "คาว", chair: "แชร์", cookie: "คุก-กี้", crown: "คราวน์",
  // D
  dog: "ด็อก", desk: "เดสก์", door: "ดอร์", duck: "ดั๊ก",
  doll: "ดอล", drum: "ดรัม", dinosaur: "ได-นะ-ซอร์", diamond: "ได-มอนด์",
  // E
  egg: "เอ็ก", ear: "เอียร์", eye: "อาย", elephant: "เอ-ละ-เฟินท์",
  eraser: "อิ-เร-เซอร์", engine: "เอ็น-จิน", envelope: "เอ็น-เว-โลพ", eagle: "อี-เกิล",
  // F
  fish: "ฟิช", fan: "แฟน", food: "ฟู้ด", foot: "ฟุท",
  frog: "ฟร็อก", flag: "แฟล็ก", flower: "ฟลาว-เวอร์", fork: "ฟอร์ก",
  // G
  girl: "เกิร์ล", goat: "โกท", gift: "กิฟท์", green: "กรีน",
  grape: "เกรพ", glass: "กลาส", glove: "กลัฟ", guitar: "กิ-ทาร์",
  // H
  hat: "แฮท", hand: "แฮนด์", home: "โฮม", hot: "ฮ็อต",
  horse: "ฮอร์ส", house: "เฮาส์", heart: "ฮาร์ท", hamburger: "แฮม-เบอร์-เกอร์",
  // I
  ink: "อิงค์", ice: "ไอซ์", insect: "อิน-เซคท์", igloo: "อิก-ลู",
  island: "ไอ-แลนด์", iguana: "อิ-กวา-นา", idea: "ไอ-เดีย", instrument: "อิน-สทรู-เมินท์",
  // J
  juice: "จูซ", jam: "แจม", jar: "จาร์", jump: "จัมพ์",
  jacket: "แจค-เก็ต", jelly: "เจล-ลี่", jeep: "จีพ", jewel: "จู-เวล",
  // K
  kite: "ไคท์", key: "คี", king: "คิง", kid: "คิด",
  kangaroo: "แคง-กะ-รู", koala: "โค-อา-ละ", kettle: "เคท-เทิล", kiwi: "คี-วี",
  // L
  lion: "ไล-เอิน", lamp: "แลมพ์", leaf: "ลีฟ", leg: "เลก",
  lemon: "เลม-มอน", ladder: "แลด-เดอร์", lock: "ล็อก", lollipop: "ลอล-ลิ-พ็อพ",
  // M
  moon: "มูน", milk: "มิลค์", mom: "มัม", map: "แมพ",
  monkey: "มัง-คี", mouse: "เมาส์", mango: "แมง-โก", magnet: "แมก-เน็ต",
  // N
  nose: "โนซ", net: "เน็ท", nest: "เนสท์", night: "ไนท์",
  nurse: "เนิร์ส", nut: "นัท", noodle: "นู-เดิล", notebook: "โนท-บุ๊ก",
  // O
  orange: "ออ-เรินจ์", ox: "อ็อกซ์", owl: "เอาล์", open: "โอ-เพิน",
  ocean: "โอ-เชิน", onion: "อัน-เยิน", ostrich: "ออส-ทริช", octopus: "อ็อก-ทะ-พัส",
  // P
  pen: "เพ็น", pig: "พิก", pot: "พ็อท", pink: "พิงค์",
  pencil: "เพน-ซิล", pizza: "พิซ-ซา", panda: "แพน-ดา", pumpkin: "พัมพ์-คิน",
  // Q
  queen: "ควีน", quiz: "ควิซ", quiet: "ไคว-เอ็ท", quick: "ควิก",
  quail: "เควล", quilt: "ควิลท์", question: "เควส-เชิน", quarter: "ควอร์-เทอร์",
  // R
  rabbit: "แรบ-บิท", rain: "เรน", red: "เรด", rice: "ไรซ์",
  robot: "โร-บอท", ring: "ริง", rocket: "ร็อก-เก็ต", rose: "โรซ",
  // S
  sun: "ซัน", sock: "ซ็อก", star: "สตาร์", sit: "ซิท",
  ship: "ชิพ", snake: "สเนค", shoe: "ชู", sandwich: "แซนด์-วิช",
  // T
  tiger: "ไท-เกอร์", tea: "ที", toy: "ทอย", tree: "ทรี",
  table: "เท-เบิล", train: "เทรน", turtle: "เทอร์-เทิล", tomato: "ทะ-เม-โท",
  // U
  umbrella: "อัม-เบรล-ละ", up: "อัพ", uncle: "อัง-เคิล", uniform: "ยู-นิ-ฟอร์ม",
  unicorn: "ยู-นิ-คอร์น", ukulele: "ยู-คะ-เล-ลี", utensil: "ยู-เทน-ซิล", urchin: "เออร์-ชิน",
  // V
  van: "แวน", vase: "เวส", vest: "เวสท์", voice: "วอยซ์",
  violin: "ไว-อะ-ลิน", vegetable: "เวจ-ทะ-เบิล", volcano: "วอล-เค-โน", village: "วิล-ลิจ",
  // W
  water: "วอ-เทอร์", web: "เว็บ", window: "วิน-โด", walk: "วอล์ก",
  watch: "วอทช์", whale: "เวล", wheel: "วีล", worm: "เวิร์ม",
  // X
  "x-ray": "เอ็กซ์-เรย์", fox: "ฟ็อกซ์", six: "ซิกซ์",
  xylophone: "ไซ-ละ-โฟน", axe: "แอกซ์", mix: "มิกซ์", taxi: "แท็ก-ซี",
  // Y
  yellow: "เยล-โล", "yo-yo": "โย-โย", yard: "ยาร์ด", yes: "เยส",
  yacht: "ยอท", yarn: "ยาร์น", yogurt: "โย-เกิร์ต", yolk: "โยค",
  // Z
  zebra: "ซี-บรา", zero: "ซี-โร", zoo: "ซู", zip: "ซิป",
  zipper: "ซิพ-เพอร์", zigzag: "ซิก-แซก", zone: "โซน", zucchini: "ซู-คี-นี",
  // Everyday extras that show up in example sentences and daily words
  hello: "เฮล-โล", thank: "แธงค์", you: "ยู", please: "พลีซ", sorry: "ซอ-รี่",
  good: "กู๊ด", morning: "มอร์-นิ่ง", name: "เนม", friend: "เฟรนด์", school: "สคูล",
  teacher: "ที-เชอร์", student: "สทู-เดินท์", family: "แฟม-มิ-ลี่", mother: "มา-เธอร์",
  father: "ฟา-เธอร์", brother: "บรา-เธอร์", sister: "ซิส-เทอร์", happy: "แฮพ-พี่",
  today: "ทู-เดย์", tomorrow: "ทู-มอ-โร", yesterday: "เยส-เทอร์-เดย์",
};

/**
 * Every remaining token that appears in the seeded vocabulary, so phrases and
 * sentences can be assembled word by word without ever guessing.
 */
const EXTRA_READINGS: Record<string, string> = {
  a: "อะ", again: "อะ-เกน", agree: "อะ-กรี", also: "ออล-โซ", am: "แอม", an: "แอน",
  analytical: "แอ-นะ-ลิ-ทิ-เคิล", anna: "แอน-นา", another: "อะ-นา-เธอร์", answer: "แอน-เซอร์",
  apples: "แอป-เพิลส์", are: "อาร์", argument: "อาร์-กิว-เมินท์", at: "แอท", ate: "เอท",
  back: "แบ็ก", baht: "บาท", bangkok: "แบง-ค็อก", bank: "แบงค์", bathroom: "บาธ-รูม",
  be: "บี", because: "บิ-คอส", bedroom: "เบด-รูม", big: "บิก", blue: "บลู", books: "บุ๊กส์",
  bought: "บอท", breakfast: "เบรค-เฟิสท์", brush: "บรัช", bus: "บัส", but: "บัท", by: "บาย",
  call: "คอล", can: "แคน", capital: "แค-พิ-เทิล", cats: "แคทส์", charitable: "แช-ริ-ทะ-เบิล",
  chiang: "เชียง", claim: "เคลม", clean: "คลีน", clearly: "เคลียร์-ลี่", clients: "ไคล-เอินทส์",
  coffee: "คอฟ-ฟี่", come: "คัม", compelling: "คัม-เพล-ลิ่ง", conclusion: "เคิน-คลู-เชิน",
  consider: "เคิน-ซิ-เดอร์", consonant: "คอน-โซ-เนินท์", could: "คูด", day: "เดย์",
  details: "ดี-เทลส์", do: "ดู", "don't": "โดนท์", easy: "อี-ซี่", eat: "อีท", eats: "อีทส์",
  eight: "เอท", emails: "อี-เมลส์", english: "อิง-กลิช", evaluative: "อิ-แวล-ยู-เอ-ทิฟ",
  every: "เอฟ-รี่", evidence: "เอ-วิ-เดินซ์", expensive: "อิค-สเพน-ซิฟ", extent: "อิค-สเทนท์",
  fifty: "ฟิฟ-ที่", five: "ไฟฟ์", floor: "ฟลอร์", follows: "ฟอล-โลส์", football: "ฟุต-บอล",
  for: "ฟอร์", four: "โฟร์", friendly: "เฟรนด์-ลี่", from: "ฟรอม", fun: "ฟัน", go: "โก",
  goal: "โกล", goes: "โกส์", going: "โก-อิ้ง", goodbye: "กู๊ด-บาย", half: "ฮาล์ฟ", have: "แฮฟ",
  he: "ฮี", help: "เฮลพ์", here: "เฮียร์", history: "ฮิส-ทอ-รี่", hospital: "ฮอส-พิ-เทิล",
  how: "เฮา", however: "เฮา-เอฟ-เวอร์", i: "ไอ", if: "อิฟ", in: "อิน", is: "อิซ", it: "อิท",
  join: "จอยน์", kind: "ไคนด์", kitchen: "คิท-เชิน", last: "ลาสท์", left: "เลฟท์",
  letter: "เลท-เทอร์", like: "ไลค์", live: "ลิฟ", living: "ลิฟ-วิ่ง", long: "ลอง",
  mai: "ใหม่", main: "เมน", many: "เม-นี่", market: "มาร์-เก็ต", math: "แมธ", me: "มี",
  meet: "มีท", meetings: "มี-ทิ้งส์", more: "มอร์", mountains: "เมาน์-เทินส์", much: "มัช",
  my: "มาย", near: "เนียร์", need: "นีด", nice: "ไนซ์", nights: "ไนทส์", nina: "นี-นา",
  nine: "ไนน์", noodles: "นู-เดิลส์", now: "นาว", "o'clock": "โอ-คล็อก", old: "โอลด์",
  on: "ออน", one: "วัน", only: "โอน-ลี่", option: "อ็อพ-เชิน", out: "เอาท์",
  passport: "พาส-พอร์ต", past: "พาสท์", pens: "เพ็นส์", play: "เพลย์", point: "พอยนท์",
  practice: "แพรค-ทิส", problem: "พร็อบ-เลิ่ม", put: "พุท", qualify: "ควอ-ลิ-ไฟ",
  reading: "รี-ดิ้ง", repeat: "รี-พีท", reports: "รี-พอร์ตส์", reservation: "เร-เซอร์-เว-เชิน",
  restaurant: "เรส-เทอ-รองท์", review: "รี-วิว", right: "ไรท์", room: "รูม", say: "เซย์",
  saying: "เซ-อิ้ง", science: "ไซ-เอินซ์", see: "ซี", send: "เซนด์", service: "เซอร์-วิส",
  seven: "เซ-เว่น", she: "ชี", shifts: "ชิฟทส์", shirt: "เชิร์ต", shopping: "ช็อพ-ปิ้ง",
  short: "ชอร์ต", should: "ชูด", shower: "ชาว-เวอร์", sleeps: "สลีพส์", small: "สมอล",
  solved: "ซอลฟด์", some: "ซัม", soon: "ซูน", sound: "ซาวนด์", speak: "สปีค", stay: "สเตย์",
  stayed: "สเตยด์", straight: "สเทรท", studies: "สตัด-ดี้ส์", study: "สตัด-ดี้",
  summarize: "ซัม-มะ-ไรซ์", supporting: "ซัพ-พอร์-ทิ่ง", sustainable: "ซัส-เท-นะ-เบิล",
  take: "เทค", teeth: "ทีธ", ten: "เท็น", thai: "ไทย", thailand: "ไทย-แลนด์", that: "แดท",
  the: "เดอะ", then: "เดน", there: "แดร์", they: "เดย์", think: "ธิงค์", third: "เธิร์ด",
  thirty: "เธอร์-ที่", this: "ดิส", three: "ธรี", time: "ไทม์", to: "ทู", tom: "ทอม",
  tone: "โทน", tonight: "ทู-ไนท์", travel: "แทรฟ-เวิล", turn: "เทิร์น", twelve: "ทเวลฟ์",
  twenty: "ทเวน-ที่", two: "ทู", understand: "อัน-เดอร์-สแตนด์", used: "ยูสด์",
  useful: "ยูส-เฟิล", view: "วิว", visit: "วิ-สิท", visited: "วิ-สิ-ทิด",
  vocabulary: "โว-แค็บ-บิว-ลา-รี่", vowel: "วาว-เวิล", wake: "เวค", wakes: "เวคส์",
  want: "วอนท์", was: "วอส", way: "เวย์", we: "วี", weekend: "วีค-เอนด์", welcome: "เวล-คัม",
  went: "เวนท์", what: "วอท", where: "แวร์", while: "ไวล์", will: "วิล", word: "เวิร์ด",
  work: "เวิร์ค", would: "วูด", write: "ไรท์", years: "เยียร์ส", your: "ยัวร์",
};

// ── Public API ───────────────────────────────────────────────────────────────

/** Strip the punctuation that wraps a word inside a sentence. */
function lookupKey(word: string) {
  return word
    .trim()
    .toLowerCase()
    .replace(/^[^a-z0-9'-]+|[^a-z0-9'-]+$/g, "");
}

/** Upper-intermediate and academic vocabulary (B1–C2 courses). */
const ADVANCED_READINGS: Record<string, string> = {
  abstraction: "แอบ-สแทรค-เชิน", accept: "แอค-เซพท์", accessibility: "แอค-เซส-ซิ-บิล-ลิ-ที่",
  account: "อะ-เคานท์", accountability: "อะ-เคาน์-ทะ-บิล-ลิ-ที่", achieve: "อะ-ชีฟ",
  achievement: "อะ-ชีฟ-เมินท์", adapt: "อะ-แดพท์", advantage: "แอด-แวน-ทิจ",
  advocate: "แอด-โว-เคท", afternoon: "อาฟ-เทอร์-นูน", allocate: "แอล-โล-เคท",
  allude: "อะ-ลูด", already: "ออล-เรด-ดี้", although: "ออล-โธ", ambiguity: "แอม-บิ-กิว-อิ-ที่",
  ambiguous: "แอม-บิก-กิว-เอิส", analogy: "อะ-แนล-โล-จี้", appointment: "อะ-พอยนท์-เมินท์",
  arguably: "อาร์-กิว-อะ-บลี่", articulate: "อาร์-ทิก-กิว-เลท", as: "แอซ", assess: "อะ-เซส",
  assumption: "อะ-ซัมพ์-เชิน", autonomy: "ออ-ทอน-โน-มี่", available: "อะ-เว-ละ-เบิล",
  avoid: "อะ-วอยด์", awareness: "อะ-แวร์-เนส", bake: "เบค", barrier: "แบ-ริ-เออร์",
  bat: "แบท", bell: "เบล", benefit: "เบน-เน-ฟิท", black: "แบล็ค", boarding: "บอร์-ดิ้ง",
  boil: "บอยล์", borrow: "บอ-โร", broken: "โบร-เคิน", cancel: "แคน-เซิล", cap: "แคพ",
  capacity: "คะ-แพส-ซิ-ที่", careful: "แคร์-เฟิล", cashier: "แค-เชียร์", challenge: "แชล-เลินจ์",
  cheap: "ชีพ", chicken: "ชิค-เคิน", choice: "ชอยซ์", choose: "ชูซ", circle: "เซอร์-เคิล",
  clarify: "แคล-ริ-ไฟ", coherence: "โค-เฮีย-เรินซ์", collaboration: "คอล-ลา-บอ-เร-เชิน",
  comfortable: "คัมฟ์-เทอ-เบิล", commitment: "คะ-มิท-เมินท์", community: "คะ-มิว-นิ-ที่",
  compare: "คัม-แพร์", comprehensive: "คอม-พริ-เฮน-ซิฟ", compromise: "คอม-โพร-ไมซ์",
  concession: "เคิน-เซส-เชิน", confidence: "คอน-ฟิ-เดินซ์", confirm: "เคิน-เฟิร์ม",
  conjecture: "เคิน-เจค-เชอร์", consequence: "คอน-ซิ-เควินซ์", consequential: "คอน-ซิ-เควน-เชิล",
  consistent: "เคิน-ซิส-เทินท์", constraint: "เคิน-สเทรนท์", consumption: "เคิน-ซัมพ์-เชิน",
  contextualize: "เคิน-เทคส์-ชวล-ไลซ์", contribute: "เคิน-ทริบ-บิวท์",
  contribution: "คอน-ทริ-บิว-เชิน", controversy: "คอน-โทร-เวอร์-ซี่",
  conventional: "เคิน-เวน-เชิน-เนิล", conversely: "คอน-เวิร์ส-ลี่", cough: "คอฟ",
  counterargument: "เคาน์-เทอร์-อาร์-กิว-เมินท์", credibility: "เคร-ดิ-บิล-ลิ-ที่",
  criteria: "ไคร-เที-เรีย", crowded: "เคราด-ดิด", culture: "คัล-เชอร์", dangerous: "เดน-เจอ-เริส",
  deadline: "เดด-ไลน์", deal: "ดีล", decide: "ดิ-ไซด์", deconstruct: "ดี-เคิน-สทรัคท์",
  delay: "ดิ-เลย์", delineate: "ดิ-ลิน-นิ-เอท", demand: "ดิ-มานด์", develop: "ดิ-เวล-เลิพ",
  dichotomy: "ได-คอท-โท-มี่", differentiate: "ดิฟ-เฟอ-เรน-ชิ-เอท", dilemma: "ได-เลม-มา",
  dinner: "ดิน-เนอร์", dirty: "เดอร์-ที่", discount: "ดิส-เคานท์", discretion: "ดิส-เครช-เชิน",
  doctor: "ด็อค-เทอร์", draw: "ดรอ", driver: "ไดร-เวอร์", early: "เอิร์ล-ลี่",
  efficiency: "อิ-ฟิช-เชิน-ซี่", efficient: "อิ-ฟิช-เชินท์", elaborate: "อิ-แลบ-บอ-เรท",
  emphasize: "เอม-ฟะ-ไซซ์", empirical: "เอม-พิ-ริ-เคิล", encourage: "อิน-เค-ริจ",
  enhance: "อิน-ฮานซ์", environment: "อิน-ไว-เริน-เมินท์", equivocal: "อิ-ควิฟ-โว-เคิล",
  evaluate: "อิ-แวล-ยู-เอท", evening: "อีฟ-นิ่ง", expectation: "เอคส์-เพค-เท-เชิน",
  experience: "อิค-สเพีย-ริ-เอินซ์", explain: "อิค-สเพลน", extrapolate: "อิค-สแทรพ-โพ-เลท",
  fallacy: "แฟล-ละ-ซี่", far: "ฟาร์", figure: "ฟิก-เกอร์", fixed: "ฟิคซ์ท์",
  flexibility: "เฟลค-ซิ-บิล-ลิ-ที่", forward: "ฟอร์-เวิร์ด", framework: "เฟรม-เวิร์ค",
  fruit: "ฟรุท", fry: "ฟราย", give: "กิฟ", global: "โกล-เบิล", habit: "แฮบ-บิท",
  health: "เฮลธ์", hen: "เฮน", henceforth: "เฮนซ์-ฟอร์ธ", heuristic: "ฮิว-ริส-ทิค",
  hungry: "ฮัง-กรี่", hypothesis: "ไฮ-พอธ-ธิ-ซิส", imagine: "อิ-แมจ-จิน", impact: "อิม-แพคท์",
  implement: "อิม-พลิ-เมินท์", implication: "อิม-พลิ-เค-เชิน", implicit: "อิม-พลิส-ซิท",
  imply: "อิม-ไพล", improve: "อิม-พรูฟ", incentive: "อิน-เซน-ทิฟ", include: "อิน-คลูด",
  incompatibility: "อิน-เคิม-แพท-ทิ-บิล-ลิ-ที่", inconsistency: "อิน-เคิน-ซิส-เทิน-ซี่",
  indispensable: "อิน-ดิส-เพน-ซะ-เบิล", inequality: "อิน-อิ-ควอล-ลิ-ที่",
  inference: "อิน-เฟอ-เรินซ์", ingredient: "อิน-กรี-ดิ-เอินท์", initiative: "อิ-นิช-ชะ-ทิฟ",
  innovation: "อิน-โน-เว-เชิน", instead: "อิน-สเทด", insurance: "อิน-ชัว-เรินซ์",
  integrity: "อิน-เทก-กริ-ที่", interpret: "อิน-เทอร์-พริท", intrinsically: "อิน-ทริน-ซิ-เคิ่ล-ลี่",
  investment: "อิน-เวสท์-เมินท์", invite: "อิน-ไวท์", justification: "จัส-ทิ-ฟิ-เค-เชิน",
  justify: "จัส-ทิ-ไฟ", juxtapose: "จัคส์-ทะ-โพซ", large: "ลาร์จ", late: "เลท",
  legislation: "เลจ-จิส-เล-เชิน", line: "ไลน์", listen: "ลิส-เซิน", local: "โล-เคิล",
  look: "ลุค", luggage: "ลัก-กิจ", lunch: "ลันช์", maintain: "เมน-เทน",
  maintenance: "เมน-ทิ-เนินซ์", medicine: "เมด-ดิ-ซิน", meeting: "มี-ทิ่ง", mention: "เมน-เชิน",
  message: "เมส-สิจ", methodical: "มิ-ธอด-ดิ-เคิล", meticulousness: "มิ-ทิค-กิว-เลิส-เนส",
  mitigate: "มิท-ทิ-เกท", negligible: "เนก-ลิ-จิ-เบิล", negotiate: "นิ-โก-ชิ-เอท",
  nevertheless: "เนฟ-เวอร์-เธอ-เลส", notwithstanding: "นอท-วิธ-สแตน-ดิ้ง", nuance: "นู-อานซ์",
  opinion: "โอ-พิน-เนียน", opportunity: "ออพ-เพอร์-ทู-นิ-ที่", ostensibly: "ออส-เทน-ซิ-บลี่",
  other: "อา-เธอร์", oversight: "โอ-เวอร์-ไซท์", paradigm: "แพ-ระ-ไดม์", paradox: "แพ-ระ-ด็อคซ์",
  part: "พาร์ท", pass: "พาส", peripheral: "เพอ-ริฟ-เฟอ-เริล", personal: "เพอร์-เซิน-เนิล",
  perspective: "เพอร์-สเพค-ทิฟ", phenomenon: "ฟิ-นอม-มิ-นอน", platform: "แพลท-ฟอร์ม",
  plausible: "พลอ-ซิ-เบิล", precedent: "เพรส-ซิ-เดินท์", prefer: "พริ-เฟอร์",
  preliminary: "พริ-ลิม-มิ-เน-รี่", premise: "เพรม-มิส", prioritize: "ไพร-ออ-ริ-ไทซ์",
  priority: "ไพร-ออ-ริ-ที่", problematize: "พร็อบ-เลิม-มะ-ไทซ์", proposal: "โพร-โพ-เซิล",
  proposition: "พร็อพ-โพ-ซิ-เชิน", public: "พับ-ลิค", purpose: "เพอร์-เพิส", quickly: "ควิค-ลี่",
  rationale: "แร-ชะ-นาล", read: "รีด", reason: "รี-เซิน", receipt: "ริ-ซีท", recipe: "เรส-ซิ-พี่",
  recommend: "เรค-เคิม-เมนด์", reconcile: "เรค-เคิน-ไซล์", reduce: "ริ-ดิวซ์", refuse: "ริ-ฟิวซ์",
  refutation: "เรฟ-ฟิว-เท-เชิน", relationship: "ริ-เล-เชิน-ชิพ", reliability: "ริ-ไล-อะ-บิล-ลิ-ที่",
  reliable: "ริ-ไล-อะ-เบิล", reply: "ริ-ไพล", require: "ริ-ไคว-เออร์",
  requirement: "ริ-ไคว-เออร์-เมินท์", resilience: "ริ-ซิล-เลี่ยนซ์", resolve: "ริ-ซอลฟ์",
  responsibility: "ริ-สปอน-ซิ-บิล-ลิ-ที่", result: "ริ-ซัลท์", return: "ริ-เทิร์น",
  robust: "โร-บัสท์", sad: "แซด", same: "เซม", schedule: "สเคด-จูล", scrutinize: "สครู-ทิ-ไนซ์",
  scrutiny: "สครู-ทิ-นี่", serious: "เซี-เรี-เอิส", shortcoming: "ชอร์ต-คัม-มิ่ง",
  significant: "ซิก-นิฟ-ฟิ-เคินท์", similar: "ซิม-มิ-ลาร์", slowly: "สโลว์-ลี่",
  solution: "โซ-ลู-เชิน", square: "สแควร์", stakeholder: "สเทค-โฮล-เดอร์", station: "สเท-เชิน",
  street: "สทรีท", subjective: "ซับ-เจค-ทิฟ", substantiate: "ซับ-สแตน-ชิ-เอท",
  successful: "ซัค-เซส-เฟิล", suggest: "ซัก-เจสท์", support: "ซัพ-พอร์ต",
  sustainability: "ซัส-เท-นะ-บิล-ลิ-ที่", symptom: "ซิมพ์-เทิม", synthesis: "ซิน-ธิ-ซิส",
  synthesize: "ซิน-ธิ-ไซซ์", technology: "เทค-นอล-โล-จี้", temper: "เทม-เพอร์",
  tenable: "เทน-นะ-เบิล", tenet: "เทน-นิท", thirsty: "เธิร์ส-ที่", ticket: "ทิค-เก็ต",
  tired: "ไท-เออร์ด", token: "โท-เคิน", top: "ท็อพ", "trade-off": "เทรด-ออฟ",
  tradition: "ทระ-ดิช-เชิน", transparency: "แทรนส์-แพ-เริน-ซี่", undermine: "อัน-เดอร์-ไมน์",
  underpinning: "อัน-เดอร์-พิน-นิ่ง", unintended: "อัน-อิน-เทน-ดิด", untenable: "อัน-เทน-นะ-เบิล",
  valid: "แวล-ลิด", validity: "วะ-ลิด-ดิ-ที่", various: "แว-ริ-เอิส", viability: "ไว-อะ-บิล-ลิ-ที่",
  whereas: "แวร์-แอซ", white: "ไวท์", with: "วิธ", yet: "เยท",
};

/** Small numerals spelled out, so "I am 20 years old." reads naturally. */
const NUMBER_READINGS: Record<string, string> = {
  "0": "ซี-โร", "1": "วัน", "2": "ทู", "3": "ธรี", "4": "โฟร์", "5": "ไฟฟ์",
  "6": "ซิกซ์", "7": "เซ-เว่น", "8": "เอท", "9": "ไนน์", "10": "เท็น",
  "11": "อิ-เลฟ-เวิ่น", "12": "ทเวลฟ์", "13": "เธอร์-ทีน", "14": "โฟร์-ทีน",
  "15": "ฟิฟ-ทีน", "16": "ซิกซ์-ทีน", "17": "เซ-เวิน-ทีน", "18": "เอท-ทีน",
  "19": "ไนน์-ทีน", "20": "ทเวน-ที่", "30": "เธอร์-ที่", "40": "ฟอร์-ที่",
  "50": "ฟิฟ-ที่", "60": "ซิกซ์-ที่", "70": "เซ-เวิน-ที่", "80": "เอท-ที่",
  "90": "ไนน์-ที่", "100": "วัน-ฮัน-เดริด",
};

function lookupWord(word: string) {
  const key = lookupKey(word);
  return (
    WORD_READINGS[key] ??
    EXTRA_READINGS[key] ??
    ADVANCED_READINGS[key] ??
    NUMBER_READINGS[key] ??
    null
  );
}

/**
 * Thai reading of an English word or phrase, or `null` when we genuinely do not
 * know it.
 *
 * There is deliberately no rule-based guessing here: a wrong reading printed in
 * Thai script is worse than no reading at all, because learners trust it and
 * lock in the wrong pronunciation. When this returns `null` the UI should fall
 * back to the audio buttons rather than inventing something.
 */
export function thaiReading(word: string, stored?: string | null): ThaiReading | null {
  const trimmedStored = stored?.trim();
  if (trimmedStored) return { text: trimmedStored, perWord: false };

  const whole = lookupWord(word);
  if (whole) return { text: whole, perWord: false };

  // Phrases and sentences: assemble from the individual words, but only if
  // every one of them is known.
  const parts = word.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;

  const readings = parts.map(lookupWord);
  if (readings.some((r) => r === null)) return null;

  return { text: readings.join(" "), perWord: true };
}

/** Letter-by-letter spelling in Thai script, e.g. box → "บี - โอ - เอ็กซ์". */
export function thaiSpelling(word: string) {
  return word
    .toUpperCase()
    .split("")
    .map((char) => THAI_LETTER_NAMES[char] ?? THAI_DIGIT_NAMES[char] ?? (char === "-" ? "ยัติภังค์" : ""))
    .filter(Boolean)
    .join(" - ");
}

/**
 * Thai spelling text for a Thai TTS voice. Uses full stops so the voice pauses
 * between letters instead of running them into one blurred word.
 */
export function thaiSpellingSpeech(word: string) {
  return word
    .toUpperCase()
    .split("")
    .map((char) => THAI_LETTER_NAMES[char] ?? THAI_DIGIT_NAMES[char] ?? "")
    .filter(Boolean)
    .join(" ... ");
}

/**
 * English spelling text for an English TTS voice. Spells out the letter NAMES
 * ("bee. oh. ex.") so the voice never blends them back into the word.
 */
export function englishSpellingSpeech(word: string) {
  return word
    .toUpperCase()
    .split("")
    .map((char) => ENGLISH_LETTER_NAMES[char] ?? (/[0-9]/.test(char) ? char : ""))
    .filter(Boolean)
    .join(". ");
}

/**
 * Thai TTS text for the word itself. Hyphens between syllables become spaces —
 * a Thai voice reads "บ็อกซ์" cleanly but stumbles on the dashes.
 */
export function thaiReadingSpeech(reading: string) {
  // "ซี/เซ็ด" lists two accepted readings — speak only the first.
  return reading.split("/")[0].replace(/-/g, " ").replace(/\s+/g, " ").trim();
}
