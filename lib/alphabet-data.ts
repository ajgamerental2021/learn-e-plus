export type AlphabetWord = {
  word: string;
  pronunciationTh: string;
  translationTh: string;
  example: string;
  exampleTh: string;
  icon: string;
};

export type AlphabetLetter = {
  letter: string;
  lower: string;
  pronunciationTh: string;
  speechText: string;
  soundHint: string;
  starterWord: AlphabetWord;
  words: AlphabetWord[];
};

const baseAlphabetLetters: AlphabetLetter[] = [
  letter("A", "เอ", "แอะ/เอ", [
    word("apple", "แอป-เพิล", "แอปเปิ้ล", "I eat an apple.", "ฉันกินแอปเปิ้ล", "🍎"),
    word("ant", "แอนท์", "มด", "An ant is small.", "มดตัวเล็ก", "🐜"),
    word("arm", "อาร์ม", "แขน", "This is my arm.", "นี่คือแขนของฉัน", "💪"),
    word("air", "แอร์", "อากาศ", "I need air.", "ฉันต้องการอากาศ", "💨"),
  ]),
  letter("B", "บี", "บ", [
    word("book", "บุ๊ก", "หนังสือ", "I read a book.", "ฉันอ่านหนังสือ", "📘"),
    word("bag", "แบ็ก", "กระเป๋า", "This is my bag.", "นี่คือกระเป๋าของฉัน", "🎒"),
    word("ball", "บอล", "ลูกบอล", "The ball is red.", "ลูกบอลสีแดง", "⚽"),
    word("bed", "เบด", "เตียง", "I sleep on a bed.", "ฉันนอนบนเตียง", "🛏️"),
  ]),
  letter("C", "ซี", "ค/ซ", [
    word("cat", "แคท", "แมว", "The cat is cute.", "แมวน่ารัก", "🐱"),
    word("cup", "คัพ", "แก้ว", "I have a cup.", "ฉันมีแก้ว", "🥤"),
    word("car", "คาร์", "รถ", "The car is blue.", "รถสีฟ้า", "🚗"),
    word("cake", "เค้ก", "เค้ก", "I like cake.", "ฉันชอบเค้ก", "🍰"),
  ]),
  letter("D", "ดี", "ด", [
    word("dog", "ด็อก", "สุนัข", "The dog runs.", "สุนัขวิ่ง", "🐶"),
    word("desk", "เดสก์", "โต๊ะเรียน", "This is a desk.", "นี่คือโต๊ะเรียน", "🪑"),
    word("door", "ดอร์", "ประตู", "Open the door.", "เปิดประตู", "🚪"),
    word("duck", "ดั๊ก", "เป็ด", "A duck can swim.", "เป็ดว่ายน้ำได้", "🦆"),
  ]),
  letter("E", "อี", "เอะ/อี", [
    word("egg", "เอ็ก", "ไข่", "I eat an egg.", "ฉันกินไข่", "🥚"),
    word("ear", "เอียร์", "หู", "This is my ear.", "นี่คือหูของฉัน", "👂"),
    word("eye", "อาย", "ตา", "I have two eyes.", "ฉันมีตาสองข้าง", "👁️"),
    word("elephant", "เอ-ละ-เฟินท์", "ช้าง", "The elephant is big.", "ช้างตัวใหญ่", "🐘"),
  ]),
  letter("F", "เอฟ", "ฟ", [
    word("fish", "ฟิช", "ปลา", "A fish can swim.", "ปลาว่ายน้ำได้", "🐟"),
    word("fan", "แฟน", "พัดลม", "The fan is on.", "พัดลมเปิดอยู่", "🌀"),
    word("food", "ฟู้ด", "อาหาร", "I like food.", "ฉันชอบอาหาร", "🍽️"),
    word("foot", "ฟุท", "เท้า", "This is my foot.", "นี่คือเท้าของฉัน", "🦶"),
  ]),
  letter("G", "จี", "ก/จ", [
    word("girl", "เกิร์ล", "เด็กผู้หญิง", "The girl smiles.", "เด็กผู้หญิงยิ้ม", "👧"),
    word("goat", "โกท", "แพะ", "A goat eats grass.", "แพะกินหญ้า", "🐐"),
    word("gift", "กิฟท์", "ของขวัญ", "This is a gift.", "นี่คือของขวัญ", "🎁"),
    word("green", "กรีน", "สีเขียว", "The leaf is green.", "ใบไม้สีเขียว", "🟩"),
  ]),
  letter("H", "เอช", "ฮ", [
    word("hat", "แฮท", "หมวก", "I wear a hat.", "ฉันใส่หมวก", "🧢"),
    word("hand", "แฮนด์", "มือ", "This is my hand.", "นี่คือมือของฉัน", "✋"),
    word("home", "โฮม", "บ้าน", "I go home.", "ฉันกลับบ้าน", "🏠"),
    word("hot", "ฮ็อต", "ร้อน", "The soup is hot.", "ซุปร้อน", "🔥"),
  ]),
  letter("I", "ไอ", "อิ/ไอ", [
    word("ink", "อิงค์", "หมึก", "The ink is blue.", "หมึกสีฟ้า", "🖊️"),
    word("ice", "ไอซ์", "น้ำแข็ง", "Ice is cold.", "น้ำแข็งเย็น", "🧊"),
    word("insect", "อิน-เซคท์", "แมลง", "An insect is small.", "แมลงตัวเล็ก", "🪲"),
    word("igloo", "อิก-ลู", "บ้านน้ำแข็ง", "An igloo is white.", "บ้านน้ำแข็งสีขาว", "🏔️"),
  ]),
  letter("J", "เจ", "จ", [
    word("juice", "จูซ", "น้ำผลไม้", "I drink juice.", "ฉันดื่มน้ำผลไม้", "🧃"),
    word("jam", "แจม", "แยม", "Jam is sweet.", "แยมหวาน", "🍓"),
    word("jar", "จาร์", "ขวดโหล", "The jar is empty.", "ขวดโหลว่างเปล่า", "🫙"),
    word("jump", "จัมพ์", "กระโดด", "I can jump.", "ฉันกระโดดได้", "⬆️"),
  ]),
  letter("K", "เค", "ค", [
    word("kite", "ไคท์", "ว่าว", "The kite is high.", "ว่าวอยู่สูง", "🪁"),
    word("key", "คี", "กุญแจ", "I have a key.", "ฉันมีกุญแจ", "🔑"),
    word("king", "คิง", "กษัตริย์", "The king is kind.", "กษัตริย์ใจดี", "👑"),
    word("kid", "คิด", "เด็ก", "The kid is happy.", "เด็กมีความสุข", "🧒"),
  ]),
  letter("L", "แอล", "ล", [
    word("lion", "ไล-เอิน", "สิงโต", "A lion is strong.", "สิงโตแข็งแรง", "🦁"),
    word("lamp", "แลมพ์", "โคมไฟ", "The lamp is on.", "โคมไฟเปิดอยู่", "💡"),
    word("leaf", "ลีฟ", "ใบไม้", "The leaf is green.", "ใบไม้สีเขียว", "🍃"),
    word("leg", "เลก", "ขา", "This is my leg.", "นี่คือขาของฉัน", "🦵"),
  ]),
  letter("M", "เอ็ม", "ม", [
    word("moon", "มูน", "ดวงจันทร์", "The moon is bright.", "ดวงจันทร์สว่าง", "🌙"),
    word("milk", "มิลค์", "นม", "I drink milk.", "ฉันดื่มนม", "🥛"),
    word("mom", "มัม", "แม่", "My mom is kind.", "แม่ของฉันใจดี", "👩"),
    word("map", "แมพ", "แผนที่", "I see a map.", "ฉันเห็นแผนที่", "🗺️"),
  ]),
  letter("N", "เอ็น", "น", [
    word("nose", "โนซ", "จมูก", "This is my nose.", "นี่คือจมูกของฉัน", "👃"),
    word("net", "เน็ท", "ตาข่าย", "The net is big.", "ตาข่ายใหญ่", "🥅"),
    word("nest", "เนสท์", "รัง", "A bird has a nest.", "นกมีรัง", "🪹"),
    word("night", "ไนท์", "กลางคืน", "It is night.", "ตอนนี้เป็นกลางคืน", "🌃"),
  ]),
  letter("O", "โอ", "ออ/โอ", [
    word("orange", "ออ-เรินจ์", "ส้ม", "I eat an orange.", "ฉันกินส้ม", "🍊"),
    word("ox", "อ็อกซ์", "วัวตัวผู้", "The ox is strong.", "วัวแข็งแรง", "🐂"),
    word("owl", "เอาล์", "นกฮูก", "The owl is awake.", "นกฮูกตื่นอยู่", "🦉"),
    word("open", "โอ-เพิน", "เปิด", "Open the book.", "เปิดหนังสือ", "📖"),
  ]),
  letter("P", "พี", "พ", [
    word("pen", "เพ็น", "ปากกา", "I have a pen.", "ฉันมีปากกา", "🖊️"),
    word("pig", "พิก", "หมู", "The pig is pink.", "หมูสีชมพู", "🐷"),
    word("pot", "พ็อท", "หม้อ", "The pot is hot.", "หม้อร้อน", "🍲"),
    word("pink", "พิงค์", "สีชมพู", "The flower is pink.", "ดอกไม้สีชมพู", "🌸"),
  ]),
  letter("Q", "คิว", "คว", [
    word("queen", "ควีน", "ราชินี", "The queen is nice.", "ราชินีใจดี", "👸"),
    word("quiz", "ควิซ", "แบบทดสอบ", "The quiz is easy.", "แบบทดสอบง่าย", "📝"),
    word("quiet", "ไคว-เอ็ท", "เงียบ", "Please be quiet.", "กรุณาเงียบ", "🤫"),
    word("quick", "ควิก", "เร็ว", "The rabbit is quick.", "กระต่ายเร็ว", "⚡"),
  ]),
  letter("R", "อาร์", "ร", [
    word("rabbit", "แรบ-บิท", "กระต่าย", "The rabbit hops.", "กระต่ายกระโดด", "🐇"),
    word("rain", "เรน", "ฝน", "Rain is falling.", "ฝนกำลังตก", "🌧️"),
    word("red", "เรด", "สีแดง", "The apple is red.", "แอปเปิ้ลสีแดง", "🟥"),
    word("rice", "ไรซ์", "ข้าว", "I eat rice.", "ฉันกินข้าว", "🍚"),
  ]),
  letter("S", "เอส", "ซ/ส", [
    word("sun", "ซัน", "พระอาทิตย์", "The sun is hot.", "พระอาทิตย์ร้อน", "☀️"),
    word("sock", "ซ็อก", "ถุงเท้า", "This is my sock.", "นี่คือถุงเท้าของฉัน", "🧦"),
    word("star", "สตาร์", "ดาว", "I see a star.", "ฉันเห็นดาว", "⭐"),
    word("sit", "ซิท", "นั่ง", "I sit down.", "ฉันนั่งลง", "🪑"),
  ]),
  letter("T", "ที", "ท/ต", [
    word("tiger", "ไท-เกอร์", "เสือ", "The tiger is fast.", "เสือวิ่งเร็ว", "🐯"),
    word("tea", "ที", "ชา", "I drink tea.", "ฉันดื่มชา", "🍵"),
    word("toy", "ทอย", "ของเล่น", "This toy is fun.", "ของเล่นนี้สนุก", "🧸"),
    word("tree", "ทรี", "ต้นไม้", "The tree is tall.", "ต้นไม้สูง", "🌳"),
  ]),
  letter("U", "ยู", "อั/ยู", [
    word("umbrella", "อัม-เบรล-ละ", "ร่ม", "I use an umbrella.", "ฉันใช้ร่ม", "☂️"),
    word("up", "อัพ", "ขึ้น", "Look up.", "มองขึ้นไป", "⬆️"),
    word("uncle", "อัง-เคิล", "ลุง/น้า/อา", "My uncle is tall.", "ลุงของฉันสูง", "👨"),
    word("uniform", "ยู-นิ-ฟอร์ม", "เครื่องแบบ", "I wear a uniform.", "ฉันใส่เครื่องแบบ", "🎽"),
  ]),
  letter("V", "วี", "ว/ฟ", [
    word("van", "แวน", "รถตู้", "The van is white.", "รถตู้สีขาว", "🚐"),
    word("vase", "เวส", "แจกัน", "The vase is blue.", "แจกันสีฟ้า", "🏺"),
    word("vest", "เวสท์", "เสื้อกั๊ก", "I wear a vest.", "ฉันใส่เสื้อกั๊ก", "🦺"),
    word("voice", "วอยซ์", "เสียง", "Her voice is soft.", "เสียงของเธอนุ่ม", "🎙️"),
  ]),
  letter("W", "ดับเบิลยู", "ว", [
    word("water", "วอ-เทอร์", "น้ำ", "I drink water.", "ฉันดื่มน้ำ", "💧"),
    word("web", "เว็บ", "ใย/เว็บ", "A spider has a web.", "แมงมุมมีใย", "🕸️"),
    word("window", "วิน-โด", "หน้าต่าง", "Open the window.", "เปิดหน้าต่าง", "🪟"),
    word("walk", "วอล์ก", "เดิน", "I walk to school.", "ฉันเดินไปโรงเรียน", "🚶"),
  ]),
  letter("X", "เอ็กซ์", "กซ/เอ็กซ์", [
    word("x-ray", "เอ็กซ์-เรย์", "เอกซเรย์", "I see an x-ray.", "ฉันเห็นภาพเอกซเรย์", "🩻"),
    word("box", "บ็อกซ์", "กล่อง", "The box is big.", "กล่องใหญ่", "📦"),
    word("fox", "ฟ็อกซ์", "สุนัขจิ้งจอก", "The fox is quick.", "สุนัขจิ้งจอกเร็ว", "🦊"),
    word("six", "ซิกซ์", "หก", "I see six pens.", "ฉันเห็นปากกาหกด้าม", "6️⃣"),
  ]),
  letter("Y", "วาย", "ย", [
    word("yellow", "เยล-โล", "สีเหลือง", "The sun is yellow.", "พระอาทิตย์สีเหลือง", "🟨"),
    word("yo-yo", "โย-โย", "โยโย่", "I play with a yo-yo.", "ฉันเล่นโยโย่", "🪀"),
    word("yard", "ยาร์ด", "สนาม", "The yard is big.", "สนามกว้าง", "🏡"),
    word("yes", "เยส", "ใช่", "Yes, I can.", "ใช่ ฉันทำได้", "✅"),
  ]),
  letter("Z", "ซี/เซ็ด", "ซ", [
    word("zebra", "ซี-บรา", "ม้าลาย", "The zebra has stripes.", "ม้าลายมีลาย", "🦓"),
    word("zero", "ซี-โร", "ศูนย์", "Zero means none.", "ศูนย์แปลว่าไม่มี", "0️⃣"),
    word("zoo", "ซู", "สวนสัตว์", "I go to the zoo.", "ฉันไปสวนสัตว์", "🏞️"),
    word("zip", "ซิป", "รูดซิป", "Zip the bag.", "รูดซิปกระเป๋า", "🤐"),
  ]),
];

export function getAlphabetLetter(letterValue: string) {
  return alphabetLetters.find((item) => item.letter.toLowerCase() === letterValue.toLowerCase());
}

function letter(letterValue: string, pronunciationTh: string, soundHint: string, words: AlphabetWord[]): AlphabetLetter {
  return {
    letter: letterValue,
    lower: letterValue.toLowerCase(),
    pronunciationTh,
    speechText: letterValue,
    soundHint,
    starterWord: words[0],
    words,
  };
}

function word(wordValue: string, pronunciationTh: string, translationTh: string, example: string, exampleTh: string, icon: string): AlphabetWord {
  return { word: wordValue, pronunciationTh, translationTh, example, exampleTh, icon };
}

function basicWord(wordValue: string, pronunciationTh: string, translationTh: string, icon: string): AlphabetWord {
  const article = /^[aeiou]/i.test(wordValue) ? "an" : "a";
  return word(wordValue, pronunciationTh, translationTh, `This is ${article} ${wordValue}.`, `นี่คือ${translationTh}`, icon);
}

const letterSpeech: Record<string, string> = {
  A: "ay",
  B: "bee",
  C: "see",
  D: "dee",
  E: "ee",
  F: "eff",
  G: "gee",
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
  R: "are",
  S: "ess",
  T: "tee",
  U: "you",
  V: "vee",
  W: "double you",
  X: "ex",
  Y: "why",
  Z: "zee",
};

const extraWords: Record<string, AlphabetWord[]> = {
  A: [
    basicWord("alligator", "แอ-ลิ-เก-เทอร์", "จระเข้", "🐊"),
    basicWord("anchor", "แอง-เคอร์", "สมอเรือ", "⚓"),
    basicWord("arrow", "แอ-โร", "ลูกศร", "➡️"),
    basicWord("astronaut", "แอส-โทร-นอต", "นักบินอวกาศ", "🧑‍🚀"),
  ],
  B: [
    basicWord("banana", "บะ-แน-นา", "กล้วย", "🍌"),
    basicWord("bird", "เบิร์ด", "นก", "🐦"),
    basicWord("boat", "โบท", "เรือ", "⛵"),
    basicWord("box", "บ็อกซ์", "กล่อง", "📦"),
  ],
  C: [
    basicWord("cow", "คาว", "วัว", "🐄"),
    basicWord("chair", "แชร์", "เก้าอี้", "🪑"),
    basicWord("cookie", "คุก-กี้", "คุกกี้", "🍪"),
    basicWord("crown", "คราวน์", "มงกุฎ", "👑"),
  ],
  D: [
    basicWord("doll", "ดอล", "ตุ๊กตา", "🪆"),
    basicWord("drum", "ดรัม", "กลอง", "🥁"),
    basicWord("dinosaur", "ได-นะ-ซอร์", "ไดโนเสาร์", "🦕"),
    basicWord("diamond", "ได-มอนด์", "เพชร", "💎"),
  ],
  E: [
    basicWord("eraser", "อิ-เร-เซอร์", "ยางลบ", "🧽"),
    basicWord("engine", "เอ็น-จิน", "เครื่องยนต์", "⚙️"),
    basicWord("envelope", "เอ็น-เว-โลพ", "ซองจดหมาย", "✉️"),
    basicWord("eagle", "อี-เกิล", "นกอินทรี", "🦅"),
  ],
  F: [
    basicWord("frog", "ฟร็อก", "กบ", "🐸"),
    basicWord("flag", "แฟล็ก", "ธง", "🚩"),
    basicWord("flower", "ฟลาว-เวอร์", "ดอกไม้", "🌼"),
    basicWord("fork", "ฟอร์ก", "ส้อม", "🍴"),
  ],
  G: [
    basicWord("grape", "เกรพ", "องุ่น", "🍇"),
    basicWord("glass", "กลาส", "แก้ว", "🥛"),
    basicWord("glove", "กลัฟ", "ถุงมือ", "🧤"),
    basicWord("guitar", "กิ-ทาร์", "กีตาร์", "🎸"),
  ],
  H: [
    basicWord("horse", "ฮอร์ส", "ม้า", "🐴"),
    basicWord("house", "เฮาส์", "บ้าน", "🏡"),
    basicWord("heart", "ฮาร์ท", "หัวใจ", "❤️"),
    basicWord("hamburger", "แฮม-เบอร์-เกอร์", "แฮมเบอร์เกอร์", "🍔"),
  ],
  I: [
    basicWord("island", "ไอ-แลนด์", "เกาะ", "🏝️"),
    basicWord("iguana", "อิ-กวา-นา", "อีกัวนา", "🦎"),
    basicWord("idea", "ไอ-เดีย", "ความคิด", "💡"),
    basicWord("instrument", "อิน-สทรู-เมินท์", "เครื่องดนตรี", "🎼"),
  ],
  J: [
    basicWord("jacket", "แจค-เก็ต", "เสื้อแจ็กเก็ต", "🧥"),
    basicWord("jelly", "เจล-ลี่", "เยลลี่", "🍮"),
    basicWord("jeep", "จีพ", "รถจี๊ป", "🚙"),
    basicWord("jewel", "จู-เวล", "อัญมณี", "💍"),
  ],
  K: [
    basicWord("kangaroo", "แคง-กะ-รู", "จิงโจ้", "🦘"),
    basicWord("koala", "โค-อา-ละ", "โคอาลา", "🐨"),
    basicWord("kettle", "เคท-เทิล", "กาต้มน้ำ", "🫖"),
    basicWord("kiwi", "คี-วี", "กีวี", "🥝"),
  ],
  L: [
    basicWord("lemon", "เลม-มอน", "มะนาว", "🍋"),
    basicWord("ladder", "แลด-เดอร์", "บันได", "🪜"),
    basicWord("lock", "ล็อก", "กุญแจล็อก", "🔒"),
    basicWord("lollipop", "ลอล-ลิ-พ็อพ", "อมยิ้ม", "🍭"),
  ],
  M: [
    basicWord("monkey", "มัง-คี", "ลิง", "🐵"),
    basicWord("mouse", "เมาส์", "หนู", "🐭"),
    basicWord("mango", "แมง-โก", "มะม่วง", "🥭"),
    basicWord("magnet", "แมก-เน็ต", "แม่เหล็ก", "🧲"),
  ],
  N: [
    basicWord("nurse", "เนิร์ส", "พยาบาล", "🧑‍⚕️"),
    basicWord("nut", "นัท", "ถั่ว", "🥜"),
    basicWord("noodle", "นู-เดิล", "เส้นก๋วยเตี๋ยว", "🍜"),
    basicWord("notebook", "โนท-บุ๊ก", "สมุด", "📓"),
  ],
  O: [
    basicWord("ocean", "โอ-เชิน", "มหาสมุทร", "🌊"),
    basicWord("onion", "อัน-เยิน", "หัวหอม", "🧅"),
    basicWord("ostrich", "ออส-ทริช", "นกกระจอกเทศ", "🐦"),
    basicWord("octopus", "อ็อก-ทะ-พัส", "ปลาหมึกยักษ์", "🐙"),
  ],
  P: [
    basicWord("pencil", "เพน-ซิล", "ดินสอ", "✏️"),
    basicWord("pizza", "พิซ-ซา", "พิซซ่า", "🍕"),
    basicWord("panda", "แพน-ดา", "แพนด้า", "🐼"),
    basicWord("pumpkin", "พัมพ์-คิน", "ฟักทอง", "🎃"),
  ],
  Q: [
    basicWord("quail", "เควล", "นกกระทา", "🐦"),
    basicWord("quilt", "ควิลท์", "ผ้าห่ม", "🛌"),
    basicWord("question", "เควส-เชิน", "คำถาม", "❓"),
    basicWord("quarter", "ควอร์-เทอร์", "หนึ่งส่วนสี่", "🪙"),
  ],
  R: [
    basicWord("robot", "โร-บอท", "หุ่นยนต์", "🤖"),
    basicWord("ring", "ริง", "แหวน", "💍"),
    basicWord("rocket", "ร็อก-เก็ต", "จรวด", "🚀"),
    basicWord("rose", "โรซ", "ดอกกุหลาบ", "🌹"),
  ],
  S: [
    basicWord("ship", "ชิพ", "เรือใหญ่", "🚢"),
    basicWord("snake", "สเนค", "งู", "🐍"),
    basicWord("shoe", "ชู", "รองเท้า", "👟"),
    basicWord("sandwich", "แซนด์-วิช", "แซนด์วิช", "🥪"),
  ],
  T: [
    basicWord("table", "เท-เบิล", "โต๊ะ", "🪑"),
    basicWord("train", "เทรน", "รถไฟ", "🚆"),
    basicWord("turtle", "เทอร์-เทิล", "เต่า", "🐢"),
    basicWord("tomato", "ทะ-เม-โท", "มะเขือเทศ", "🍅"),
  ],
  U: [
    basicWord("unicorn", "ยู-นิ-คอร์น", "ยูนิคอร์น", "🦄"),
    basicWord("ukulele", "ยู-คะ-เล-ลี", "อูคูเลเล่", "🎸"),
    basicWord("utensil", "ยู-เทน-ซิล", "อุปกรณ์กินอาหาร", "🍴"),
    basicWord("urchin", "เออร์-ชิน", "เม่นทะเล", "🪸"),
  ],
  V: [
    basicWord("violin", "ไว-อะ-ลิน", "ไวโอลิน", "🎻"),
    basicWord("vegetable", "เวจ-ทะ-เบิล", "ผัก", "🥦"),
    basicWord("volcano", "วอล-เค-โน", "ภูเขาไฟ", "🌋"),
    basicWord("village", "วิล-ลิจ", "หมู่บ้าน", "🏘️"),
  ],
  W: [
    basicWord("watch", "วอทช์", "นาฬิกาข้อมือ", "⌚"),
    basicWord("whale", "เวล", "วาฬ", "🐋"),
    basicWord("wheel", "วีล", "ล้อ", "🛞"),
    basicWord("worm", "เวิร์ม", "หนอน", "🪱"),
  ],
  X: [
    basicWord("xylophone", "ไซ-ละ-โฟน", "ไซโลโฟน", "🎼"),
    basicWord("axe", "แอกซ์", "ขวาน", "🪓"),
    basicWord("mix", "มิกซ์", "การผสม", "🥣"),
    basicWord("taxi", "แท็ก-ซี", "แท็กซี่", "🚕"),
  ],
  Y: [
    basicWord("yacht", "ยอท", "เรือยอชต์", "⛵"),
    basicWord("yarn", "ยาร์น", "เส้นไหมพรม", "🧶"),
    basicWord("yogurt", "โย-เกิร์ต", "โยเกิร์ต", "🥣"),
    basicWord("yolk", "โยค", "ไข่แดง", "🍳"),
  ],
  Z: [
    basicWord("zipper", "ซิพ-เพอร์", "ซิป", "🤐"),
    basicWord("zigzag", "ซิก-แซก", "เส้นซิกแซก", "〰️"),
    basicWord("zone", "โซน", "เขต", "🧭"),
    basicWord("zucchini", "ซู-คี-นี", "ซูกินี", "🥒"),
  ],
};

export const alphabetLetters: AlphabetLetter[] = baseAlphabetLetters.map((item) => {
  const words = [...item.words, ...(extraWords[item.letter] ?? [])];
  return {
    ...item,
    speechText: letterSpeech[item.letter] ?? item.letter,
    starterWord: words[0],
    words,
  };
});

export const alphabetSpeechText = alphabetLetters.map((item) => item.speechText).join(". ");
