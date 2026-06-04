import "dotenv/config";
import {
  ContentType,
  Difficulty,
  LevelCode,
  PrismaClient,
  QuestionType,
  SkillType,
  TestType,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter } as never);

type Phrase = {
  front: string;
  back: string;
  pronunciation?: string;
  example?: string;
};

type LessonSeed = {
  slug: string;
  nameTh: string;
  nameEn: string;
  skill: SkillType;
  minutes?: number;
  outcome: string;
  pattern: string;
  phrases: Phrase[];
  conversation: Array<{ speaker: string; text: string; translationTh: string }>;
  exercises: Array<{ sentence: string; answer: string; hint?: string }>;
};

type UnitSeed = {
  slug: string;
  nameTh: string;
  nameEn: string;
  descriptionTh: string;
  lessons: LessonSeed[];
};

type CourseSeed = {
  level: LevelCode;
  nameTh: string;
  nameEn: string;
  descriptionTh: string;
  units: UnitSeed[];
};

const levelMeta: Record<LevelCode, { nameTh: string; nameEn: string; description: string; order: number; active: boolean }> = {
  PRE_A1: { nameTh: "เริ่มต้น (Starter)", nameEn: "Starter", description: "เริ่มจากศูนย์ อ่านคำง่าย ๆ และพูดประโยคสั้น", order: 1, active: true },
  A1: { nameTh: "ผู้เริ่มต้น (Beginner)", nameEn: "Beginner", description: "สื่อสารเรื่องใกล้ตัวด้วยประโยคพื้นฐาน", order: 2, active: true },
  A2: { nameTh: "ขั้นต้น (Elementary)", nameEn: "Elementary", description: "สนทนาชีวิตประจำวันและเล่าเรื่องสั้น", order: 3, active: true },
  B1: { nameTh: "ระดับกลาง (Intermediate)", nameEn: "Intermediate", description: "อธิบายประสบการณ์ แผน และความคิดเห็น", order: 4, active: true },
  B2: { nameTh: "ระดับกลาง-สูง (Upper Intermediate)", nameEn: "Upper Intermediate", description: "สื่อสารงานและประเด็นซับซ้อนได้ชัดเจน", order: 5, active: true },
  C1: { nameTh: "ขั้นสูง (Advanced)", nameEn: "Advanced", description: "ใช้ภาษาเชิงวิชาการและงานอาชีพอย่างยืดหยุ่น", order: 6, active: true },
  C2: { nameTh: "เชี่ยวชาญ (Proficiency)", nameEn: "Proficiency", description: "ใช้ภาษาอังกฤษระดับเชี่ยวชาญและละเอียดอ่อน", order: 7, active: true },
};

const skillThai: Record<SkillType, string> = {
  VOCABULARY: "คำศัพท์",
  GRAMMAR: "ไวยากรณ์",
  LISTENING: "การฟัง",
  SPEAKING: "การพูด",
  READING: "การอ่าน",
  WRITING: "การเขียน",
};

function phrase(front: string, back: string, example?: string, pronunciation?: string): Phrase {
  return { front, back, example, pronunciation };
}

function makeConversation(topic: string, a: Phrase, b: Phrase) {
  return [
    { speaker: "Tutor", text: a.example ?? a.front, translationTh: a.back },
    { speaker: "Learner", text: b.example ?? b.front, translationTh: b.back },
    { speaker: "Tutor", text: `Good. Try using "${a.front}" in your own sentence.`, translationTh: `ดีมาก ลองใช้ "${a.front}" ในประโยคของคุณเอง` },
    { speaker: "Learner", text: `I can use it when I talk about ${topic}.`, translationTh: `ฉันใช้ได้เวลาพูดเรื่อง${topic}` },
  ];
}

function lesson(
  slug: string,
  nameTh: string,
  nameEn: string,
  skill: SkillType,
  outcome: string,
  pattern: string,
  phrases: Phrase[],
  exercises: Array<{ sentence: string; answer: string; hint?: string }>,
  minutes = 12
): LessonSeed {
  return {
    slug,
    nameTh,
    nameEn,
    skill,
    minutes,
    outcome,
    pattern,
    phrases,
    conversation: makeConversation(nameTh, phrases[0], phrases[1] ?? phrases[0]),
    exercises,
  };
}

const curriculum: CourseSeed[] = [
  {
    level: LevelCode.PRE_A1,
    nameTh: "English Starter Path",
    nameEn: "English Starter Path",
    descriptionTh: "พื้นฐานตั้งแต่ตัวอักษร ตัวเลข คำใกล้ตัว และประโยคสั้นมาก",
    units: [
      {
        slug: "letters-sounds",
        nameTh: "ตัวอักษรและเสียง",
        nameEn: "Letters and Sounds",
        descriptionTh: "รู้จักตัวอักษร สระ และเสียงเริ่มต้น",
        lessons: [
          lesson("alphabet-a-m", "ตัวอักษร A-M", "Alphabet A-M", SkillType.VOCABULARY, "จำตัวอักษร A ถึง M และคำตัวอย่าง", "A is for apple. B is for book.", [
            phrase("A a", "เอ - apple - แอปเปิ้ล", "A is for apple.", "เอ"),
            phrase("B b", "บี - book - หนังสือ", "B is for book.", "บี"),
            phrase("C c", "ซี - cat - แมว", "C is for cat.", "ซี"),
            phrase("M m", "เอ็ม - moon - ดวงจันทร์", "M is for moon.", "เอ็ม"),
          ], [{ sentence: "A is for _____.", answer: "apple" }, { sentence: "B is for _____.", answer: "book" }, { sentence: "C is for _____.", answer: "cat" }]),
          lesson("alphabet-n-z", "ตัวอักษร N-Z", "Alphabet N-Z", SkillType.VOCABULARY, "จำตัวอักษร N ถึง Z พร้อมคำตัวอย่าง", "N is for nose. Z is for zebra.", [
            phrase("N n", "เอ็น - nose - จมูก", "N is for nose.", "เอ็น"),
            phrase("P p", "พี - pen - ปากกา", "P is for pen.", "พี"),
            phrase("S s", "เอส - sun - พระอาทิตย์", "S is for sun.", "เอส"),
            phrase("Z z", "ซี/เซ็ด - zebra - ม้าลาย", "Z is for zebra.", "ซี"),
          ], [{ sentence: "N is for _____.", answer: "nose" }, { sentence: "P is for _____.", answer: "pen" }, { sentence: "S is for _____.", answer: "sun" }]),
          lesson("vowels", "สระ A E I O U", "Vowels A E I O U", SkillType.READING, "แยกสระและพยัญชนะเบื้องต้น", "A, E, I, O, U are vowels.", [
            phrase("vowel", "สระ", "A is a vowel."),
            phrase("consonant", "พยัญชนะ", "B is a consonant."),
            phrase("short sound", "เสียงสั้น", "Cat has a short a sound."),
            phrase("long sound", "เสียงยาว", "Cake has a long a sound."),
          ], [{ sentence: "A, E, I, O, U are _____.", answer: "vowels" }, { sentence: "B is a _____.", answer: "consonant" }, { sentence: "Cat has a short _____ sound.", answer: "a" }]),
          lesson("classroom-words", "คำในห้องเรียน", "Classroom Words", SkillType.LISTENING, "ฟังและรู้จักคำสั่งง่าย ๆ ในห้องเรียน", "Listen and repeat: book, pen, desk.", [
            phrase("book", "หนังสือ", "Open your book."),
            phrase("pen", "ปากกา", "Take a pen."),
            phrase("desk", "โต๊ะเรียน", "Sit at your desk."),
            phrase("repeat", "พูดตาม", "Repeat after me."),
          ], [{ sentence: "Open your _____.", answer: "book" }, { sentence: "Take a _____.", answer: "pen" }, { sentence: "Repeat after _____.", answer: "me" }]),
        ],
      },
      {
        slug: "numbers-colors",
        nameTh: "ตัวเลข สี และสิ่งของ",
        nameEn: "Numbers, Colors, and Objects",
        descriptionTh: "นับเลข บอกสี และเรียกสิ่งของใกล้ตัว",
        lessons: [
          lesson("numbers-1-10", "ตัวเลข 1-10", "Numbers 1-10", SkillType.VOCABULARY, "นับเลข 1 ถึง 10 ได้", "I have one book. I have two pens.", [
            phrase("one", "หนึ่ง", "I have one book.", "วัน"),
            phrase("two", "สอง", "I have two pens.", "ทู"),
            phrase("five", "ห้า", "I have five stars.", "ไฟฟ์"),
            phrase("ten", "สิบ", "I can count to ten.", "เทน"),
          ], [{ sentence: "I have _____ book.", answer: "one" }, { sentence: "I have _____ pens.", answer: "two" }, { sentence: "I can count to _____.", answer: "ten" }]),
          lesson("colors", "สีพื้นฐาน", "Basic Colors", SkillType.VOCABULARY, "บอกสีของสิ่งของง่าย ๆ", "The apple is red. The sky is blue.", [
            phrase("red", "สีแดง", "The apple is red.", "เร็ด"),
            phrase("blue", "สีน้ำเงิน", "The sky is blue.", "บลู"),
            phrase("green", "สีเขียว", "The leaf is green.", "กรีน"),
            phrase("yellow", "สีเหลือง", "The banana is yellow.", "เยลโล"),
          ], [{ sentence: "The apple is _____.", answer: "red" }, { sentence: "The sky is _____.", answer: "blue" }, { sentence: "The banana is _____.", answer: "yellow" }]),
          lesson("this-is", "This is / That is", "This is / That is", SkillType.GRAMMAR, "ใช้ This is และ That is เพื่อชี้สิ่งของ", "This is a pen. That is a bag.", [
            phrase("This is a pen.", "นี่คือปากกา"),
            phrase("That is a bag.", "นั่นคือกระเป๋า"),
            phrase("This is my book.", "นี่คือหนังสือของฉัน"),
            phrase("That is your desk.", "นั่นคือโต๊ะของคุณ"),
          ], [{ sentence: "_____ is a pen.", answer: "This" }, { sentence: "That _____ a bag.", answer: "is" }, { sentence: "This is my _____.", answer: "book" }]),
          lesson("how-many", "How many?", "How many?", SkillType.SPEAKING, "ถามและตอบจำนวนง่าย ๆ", "How many books? Three books.", [
            phrase("How many books?", "มีหนังสือกี่เล่ม"),
            phrase("Three books.", "หนังสือสามเล่ม"),
            phrase("How many pens?", "มีปากกากี่ด้าม"),
            phrase("Four pens.", "ปากกาสี่ด้าม"),
          ], [{ sentence: "How _____ books?", answer: "many" }, { sentence: "_____ books.", answer: "Three" }, { sentence: "How many _____?", answer: "pens" }]),
        ],
      },
      {
        slug: "people-family",
        nameTh: "คนและครอบครัว",
        nameEn: "People and Family",
        descriptionTh: "เรียกคนรอบตัวและแนะนำครอบครัวแบบง่าย",
        lessons: [
          lesson("family-words", "คำครอบครัว", "Family Words", SkillType.VOCABULARY, "รู้จัก mother, father, sister, brother", "This is my mother.", [
            phrase("mother", "แม่", "This is my mother."),
            phrase("father", "พ่อ", "This is my father."),
            phrase("sister", "พี่สาว/น้องสาว", "This is my sister."),
            phrase("brother", "พี่ชาย/น้องชาย", "This is my brother."),
          ], [{ sentence: "This is my _____.", answer: "mother" }, { sentence: "This is my _____.", answer: "father" }, { sentence: "This is my _____.", answer: "sister" }]),
          lesson("my-family", "My family", "My Family", SkillType.SPEAKING, "พูดแนะนำครอบครัวสั้น ๆ", "My family is small. I have one brother.", [
            phrase("My family is small.", "ครอบครัวของฉันเล็ก"),
            phrase("My family is big.", "ครอบครัวของฉันใหญ่"),
            phrase("I have one brother.", "ฉันมีพี่ชาย/น้องชายหนึ่งคน"),
            phrase("I have one sister.", "ฉันมีพี่สาว/น้องสาวหนึ่งคน"),
          ], [{ sentence: "My family is _____.", answer: "small" }, { sentence: "I have one _____.", answer: "brother" }, { sentence: "I have one _____.", answer: "sister" }]),
          lesson("he-she", "He / She", "He and She", SkillType.GRAMMAR, "ใช้ he และ she เพื่อพูดถึงคน", "He is my father. She is my mother.", [
            phrase("He is my father.", "เขาเป็นพ่อของฉัน"),
            phrase("She is my mother.", "เธอเป็นแม่ของฉัน"),
            phrase("He is a teacher.", "เขาเป็นครู"),
            phrase("She is a student.", "เธอเป็นนักเรียน"),
          ], [{ sentence: "_____ is my father.", answer: "He" }, { sentence: "_____ is my mother.", answer: "She" }, { sentence: "She is a _____.", answer: "student" }]),
          lesson("people-reading", "อ่านประโยคเกี่ยวกับคน", "Reading About People", SkillType.READING, "อ่านประโยคสั้นเกี่ยวกับคนในครอบครัว", "Tom is my brother. He is kind.", [
            phrase("Tom is my brother.", "ทอมเป็นพี่ชาย/น้องชายของฉัน"),
            phrase("He is kind.", "เขาใจดี"),
            phrase("Anna is my sister.", "แอนนาเป็นพี่สาว/น้องสาวของฉัน"),
            phrase("She is happy.", "เธอมีความสุข"),
          ], [{ sentence: "Tom is my _____.", answer: "brother" }, { sentence: "He is _____.", answer: "kind" }, { sentence: "She is _____.", answer: "happy" }]),
        ],
      },
      {
        slug: "daily-starter",
        nameTh: "ประโยคเริ่มใช้จริง",
        nameEn: "First Daily Sentences",
        descriptionTh: "ทักทาย ขอของ และเขียนประโยคสั้น",
        lessons: [
          lesson("hello-goodbye", "Hello / Goodbye", "Hello and Goodbye", SkillType.SPEAKING, "ทักทายและกล่าวลา", "Hello. Goodbye. See you.", [
            phrase("Hello.", "สวัสดี"),
            phrase("Goodbye.", "ลาก่อน"),
            phrase("See you.", "แล้วเจอกัน"),
            phrase("Good morning.", "สวัสดีตอนเช้า"),
          ], [{ sentence: "_____.", answer: "Hello" }, { sentence: "_____.", answer: "Goodbye" }, { sentence: "See _____.", answer: "you" }]),
          lesson("please-thank-you", "Please / Thank you", "Please and Thank You", SkillType.SPEAKING, "พูดสุภาพด้วย please และ thank you", "A pen, please. Thank you.", [
            phrase("Please.", "กรุณา/ได้โปรด"),
            phrase("Thank you.", "ขอบคุณ"),
            phrase("A book, please.", "ขอหนังสือหนึ่งเล่ม"),
            phrase("You are welcome.", "ยินดี"),
          ], [{ sentence: "A book, _____.", answer: "please" }, { sentence: "Thank _____.", answer: "you" }, { sentence: "You are _____.", answer: "welcome" }]),
          lesson("i-like", "I like...", "I Like...", SkillType.GRAMMAR, "พูดสิ่งที่ชอบแบบง่าย", "I like apples. I like cats.", [
            phrase("I like apples.", "ฉันชอบแอปเปิ้ล"),
            phrase("I like cats.", "ฉันชอบแมว"),
            phrase("I like blue.", "ฉันชอบสีน้ำเงิน"),
            phrase("I like books.", "ฉันชอบหนังสือ"),
          ], [{ sentence: "I _____ apples.", answer: "like" }, { sentence: "I like _____.", answer: "cats" }, { sentence: "I like _____.", answer: "blue" }]),
          lesson("write-first-sentences", "เขียนประโยคแรก", "Write First Sentences", SkillType.WRITING, "เขียนประโยคสั้น 3 แบบ", "This is a book. I like books.", [
            phrase("This is a book.", "นี่คือหนังสือ"),
            phrase("I like books.", "ฉันชอบหนังสือ"),
            phrase("My name is Tom.", "ฉันชื่อทอม"),
            phrase("I have one pen.", "ฉันมีปากกาหนึ่งด้าม"),
          ], [{ sentence: "This _____ a book.", answer: "is" }, { sentence: "I _____ books.", answer: "like" }, { sentence: "My name _____ Tom.", answer: "is" }]),
        ],
      },
    ],
  },
  {
    level: LevelCode.A1,
    nameTh: "A1 Daily English",
    nameEn: "A1 Daily English",
    descriptionTh: "สนทนาเรื่องตัวเอง ครอบครัว กิจวัตร และสถานที่ใกล้ตัว",
    units: [
      {
        slug: "introductions",
        nameTh: "แนะนำตัวและรู้จักกัน",
        nameEn: "Introductions",
        descriptionTh: "พูดชื่อ อายุ ประเทศ และข้อมูลพื้นฐาน",
        lessons: [
          lesson("my-name-is", "My name is...", "My Name Is", SkillType.SPEAKING, "แนะนำชื่อและถามชื่อผู้อื่น", "My name is Anna. What is your name?", [
            phrase("My name is Anna.", "ฉันชื่อแอนนา"),
            phrase("What is your name?", "คุณชื่ออะไร"),
            phrase("I am Tom.", "ฉันคือทอม"),
            phrase("Nice to meet you.", "ยินดีที่ได้รู้จัก"),
          ], [{ sentence: "My _____ is Anna.", answer: "name" }, { sentence: "What is your _____?", answer: "name" }, { sentence: "Nice to _____ you.", answer: "meet" }]),
          lesson("where-are-you-from", "Where are you from?", "Where Are You From", SkillType.SPEAKING, "ถามและตอบประเทศ/เมือง", "I am from Thailand.", [
            phrase("Where are you from?", "คุณมาจากไหน"),
            phrase("I am from Thailand.", "ฉันมาจากประเทศไทย"),
            phrase("I live in Bangkok.", "ฉันอยู่กรุงเทพฯ"),
            phrase("I am Thai.", "ฉันเป็นคนไทย"),
          ], [{ sentence: "Where are you _____?", answer: "from" }, { sentence: "I am from _____.", answer: "Thailand" }, { sentence: "I live _____ Bangkok.", answer: "in" }]),
          lesson("how-old-are-you", "How old are you?", "How Old Are You", SkillType.LISTENING, "ฟังและตอบเรื่องอายุ", "I am twenty years old.", [
            phrase("How old are you?", "คุณอายุเท่าไร"),
            phrase("I am twenty years old.", "ฉันอายุยี่สิบปี"),
            phrase("She is twelve.", "เธออายุสิบสอง"),
            phrase("He is thirty.", "เขาอายุสามสิบ"),
          ], [{ sentence: "How _____ are you?", answer: "old" }, { sentence: "I am twenty years _____.", answer: "old" }, { sentence: "She _____ twelve.", answer: "is" }]),
          lesson("personal-profile", "เขียนโปรไฟล์สั้น", "Short Personal Profile", SkillType.WRITING, "เขียนข้อมูลตัวเอง 4 ประโยค", "My name is Anna. I am from Thailand.", [
            phrase("My name is Anna.", "ฉันชื่อแอนนา"),
            phrase("I am 20 years old.", "ฉันอายุ 20 ปี"),
            phrase("I am from Thailand.", "ฉันมาจากประเทศไทย"),
            phrase("I like English.", "ฉันชอบภาษาอังกฤษ"),
          ], [{ sentence: "My name _____ Anna.", answer: "is" }, { sentence: "I am _____ Thailand.", answer: "from" }, { sentence: "I _____ English.", answer: "like" }]),
        ],
      },
      {
        slug: "daily-routines",
        nameTh: "กิจวัตรประจำวัน",
        nameEn: "Daily Routines",
        descriptionTh: "พูดกิจกรรม เวลา และความถี่",
        lessons: [
          lesson("morning-routine", "กิจวัตรตอนเช้า", "Morning Routine", SkillType.VOCABULARY, "พูดสิ่งที่ทำตอนเช้า", "I wake up at six. I brush my teeth.", [
            phrase("wake up", "ตื่นนอน", "I wake up at six."),
            phrase("brush my teeth", "แปรงฟัน", "I brush my teeth."),
            phrase("take a shower", "อาบน้ำ", "I take a shower."),
            phrase("eat breakfast", "กินอาหารเช้า", "I eat breakfast."),
          ], [{ sentence: "I wake _____ at six.", answer: "up" }, { sentence: "I brush my _____.", answer: "teeth" }, { sentence: "I eat _____.", answer: "breakfast" }]),
          lesson("telling-time", "บอกเวลา", "Telling Time", SkillType.GRAMMAR, "บอกเวลาง่าย ๆ", "It is seven o'clock.", [
            phrase("seven o'clock", "เจ็ดโมง", "It is seven o'clock."),
            phrase("half past eight", "แปดโมงครึ่ง", "It is half past eight."),
            phrase("quarter past nine", "เก้าโมงสิบห้า", "It is quarter past nine."),
            phrase("at six", "ตอนหกโมง", "I wake up at six."),
          ], [{ sentence: "It is seven _____.", answer: "o'clock" }, { sentence: "I wake up _____ six.", answer: "at" }, { sentence: "It is half _____ eight.", answer: "past" }]),
          lesson("present-simple", "Present Simple", "Present Simple", SkillType.GRAMMAR, "ใช้ present simple กับกิจวัตร", "I go to school. She goes to work.", [
            phrase("I go to school.", "ฉันไปโรงเรียน"),
            phrase("She goes to work.", "เธอไปทำงาน"),
            phrase("He eats breakfast.", "เขากินอาหารเช้า"),
            phrase("We study English.", "พวกเราเรียนภาษาอังกฤษ"),
          ], [{ sentence: "I _____ to school.", answer: "go" }, { sentence: "She _____ to work.", answer: "goes" }, { sentence: "We _____ English.", answer: "study" }]),
          lesson("routine-reading", "อ่านกิจวัตรสั้น ๆ", "Routine Reading", SkillType.READING, "อ่าน paragraph สั้นเกี่ยวกับกิจวัตร", "Anna wakes up at six. She goes to school at seven.", [
            phrase("Anna wakes up at six.", "แอนนาตื่นหกโมง"),
            phrase("She goes to school at seven.", "เธอไปโรงเรียนตอนเจ็ดโมง"),
            phrase("She studies English.", "เธอเรียนภาษาอังกฤษ"),
            phrase("She sleeps at ten.", "เธอนอนตอนสี่ทุ่ม"),
          ], [{ sentence: "Anna wakes up at _____.", answer: "six" }, { sentence: "She goes to school at _____.", answer: "seven" }, { sentence: "She studies _____.", answer: "English" }]),
        ],
      },
      {
        slug: "home-food",
        nameTh: "บ้านและอาหาร",
        nameEn: "Home and Food",
        descriptionTh: "พูดสิ่งของในบ้าน อาหาร และการสั่งง่าย ๆ",
        lessons: [
          lesson("rooms", "ห้องในบ้าน", "Rooms at Home", SkillType.VOCABULARY, "เรียกชื่อห้องในบ้าน", "This is the kitchen.", [
            phrase("kitchen", "ห้องครัว", "This is the kitchen."),
            phrase("bedroom", "ห้องนอน", "This is my bedroom."),
            phrase("bathroom", "ห้องน้ำ", "The bathroom is clean."),
            phrase("living room", "ห้องนั่งเล่น", "We sit in the living room."),
          ], [{ sentence: "This is the _____.", answer: "kitchen" }, { sentence: "This is my _____.", answer: "bedroom" }, { sentence: "We sit in the living _____.", answer: "room" }]),
          lesson("food-drinks", "อาหารและเครื่องดื่ม", "Food and Drinks", SkillType.VOCABULARY, "เรียกอาหารและเครื่องดื่มพื้นฐาน", "I like rice. I drink water.", [
            phrase("rice", "ข้าว", "I like rice."),
            phrase("water", "น้ำ", "I drink water."),
            phrase("coffee", "กาแฟ", "My father drinks coffee."),
            phrase("noodles", "ก๋วยเตี๋ยว", "I eat noodles."),
          ], [{ sentence: "I like _____.", answer: "rice" }, { sentence: "I drink _____.", answer: "water" }, { sentence: "I eat _____.", answer: "noodles" }]),
          lesson("ordering-food", "สั่งอาหารง่าย ๆ", "Ordering Food", SkillType.SPEAKING, "สั่งอาหารด้วยประโยคสุภาพ", "Can I have rice, please?", [
            phrase("Can I have rice, please?", "ขอข้าวได้ไหมครับ/ค่ะ"),
            phrase("I would like water.", "ฉันต้องการน้ำ"),
            phrase("How much is it?", "ราคาเท่าไร"),
            phrase("Here you are.", "นี่ครับ/ค่ะ"),
          ], [{ sentence: "Can I _____ rice, please?", answer: "have" }, { sentence: "I would _____ water.", answer: "like" }, { sentence: "How much _____ it?", answer: "is" }]),
          lesson("a-an-the", "a / an / the", "A, An, and The", SkillType.GRAMMAR, "ใช้ article ขั้นพื้นฐาน", "a book, an apple, the kitchen", [
            phrase("a book", "หนังสือหนึ่งเล่ม"),
            phrase("an apple", "แอปเปิ้ลหนึ่งลูก"),
            phrase("the kitchen", "ห้องครัวนั้น"),
            phrase("the water", "น้ำนั้น"),
          ], [{ sentence: "_____ book", answer: "a" }, { sentence: "_____ apple", answer: "an" }, { sentence: "_____ kitchen", answer: "the" }]),
        ],
      },
      {
        slug: "places-shopping",
        nameTh: "สถานที่และการซื้อของ",
        nameEn: "Places and Shopping",
        descriptionTh: "ถามทาง ซื้อของ และเขียนข้อความสั้น",
        lessons: [
          lesson("places-town", "สถานที่ในเมือง", "Places in Town", SkillType.VOCABULARY, "เรียกสถานที่รอบเมือง", "The bank is near the school.", [
            phrase("school", "โรงเรียน", "The school is near my house."),
            phrase("bank", "ธนาคาร", "The bank is open."),
            phrase("market", "ตลาด", "I go to the market."),
            phrase("hospital", "โรงพยาบาล", "The hospital is big."),
          ], [{ sentence: "I go to the _____.", answer: "market" }, { sentence: "The _____ is open.", answer: "bank" }, { sentence: "The hospital is _____.", answer: "big" }]),
          lesson("directions", "ถามทางง่าย ๆ", "Simple Directions", SkillType.SPEAKING, "ถามและบอกทางด้วย left/right/straight", "Go straight. Turn left.", [
            phrase("Go straight.", "ตรงไป"),
            phrase("Turn left.", "เลี้ยวซ้าย"),
            phrase("Turn right.", "เลี้ยวขวา"),
            phrase("It is near the school.", "มันอยู่ใกล้โรงเรียน"),
          ], [{ sentence: "Go _____.", answer: "straight" }, { sentence: "Turn _____.", answer: "left" }, { sentence: "It is _____ the school.", answer: "near" }]),
          lesson("shopping-prices", "ซื้อของและถามราคา", "Shopping and Prices", SkillType.LISTENING, "ฟังราคาและถามราคาสินค้า", "How much is this? It is fifty baht.", [
            phrase("How much is this?", "อันนี้ราคาเท่าไร"),
            phrase("It is fifty baht.", "ห้าสิบบาท"),
            phrase("I want this one.", "ฉันต้องการอันนี้"),
            phrase("That is expensive.", "อันนั้นแพง"),
          ], [{ sentence: "How much _____ this?", answer: "is" }, { sentence: "It is fifty _____.", answer: "baht" }, { sentence: "I want this _____.", answer: "one" }]),
          lesson("write-message", "เขียนข้อความสั้น", "Write a Short Message", SkillType.WRITING, "เขียนข้อความนัดหมายหรือขอข้อมูล", "Hi, can we meet at the market?", [
            phrase("Can we meet at the market?", "เราเจอกันที่ตลาดได้ไหม"),
            phrase("I will be there at ten.", "ฉันจะไปถึงตอนสิบโมง"),
            phrase("Please call me.", "กรุณาโทรหาฉัน"),
            phrase("See you soon.", "เจอกันเร็ว ๆ นี้"),
          ], [{ sentence: "Can we _____ at the market?", answer: "meet" }, { sentence: "Please _____ me.", answer: "call" }, { sentence: "See you _____.", answer: "soon" }]),
        ],
      },
    ],
  },
  {
    level: LevelCode.A2,
    nameTh: "A2 Practical English",
    nameEn: "A2 Practical English",
    descriptionTh: "ใช้ภาษาในชีวิตจริง เล่าอดีต วางแผน และอธิบายปัญหา",
    units: [
      {
        slug: "past-events",
        nameTh: "เล่าเรื่องในอดีต",
        nameEn: "Past Events",
        descriptionTh: "ใช้ past simple เล่าเหตุการณ์",
        lessons: [
          lesson("regular-past", "Regular past verbs", "Regular Past Verbs", SkillType.GRAMMAR, "เติม -ed กับกริยาปกติ", "I watched TV. She cleaned her room.", [
            phrase("watched", "ดูแล้ว", "I watched TV yesterday."),
            phrase("cleaned", "ทำความสะอาดแล้ว", "She cleaned her room."),
            phrase("visited", "ไปเยี่ยมแล้ว", "We visited our aunt."),
            phrase("played", "เล่นแล้ว", "They played football."),
          ], [{ sentence: "I _____ TV yesterday.", answer: "watched" }, { sentence: "She _____ her room.", answer: "cleaned" }, { sentence: "They _____ football.", answer: "played" }]),
          lesson("irregular-past", "Irregular past verbs", "Irregular Past Verbs", SkillType.GRAMMAR, "ใช้กริยาอดีตที่เปลี่ยนรูป", "go → went, eat → ate, see → saw", [
            phrase("went", "ไปแล้ว", "I went to school."),
            phrase("ate", "กินแล้ว", "I ate rice."),
            phrase("saw", "เห็นแล้ว", "I saw my friend."),
            phrase("bought", "ซื้อแล้ว", "I bought a book."),
          ], [{ sentence: "I _____ to school.", answer: "went" }, { sentence: "I _____ rice.", answer: "ate" }, { sentence: "I _____ my friend.", answer: "saw" }]),
          lesson("weekend-story", "เล่าเรื่องวันหยุด", "Weekend Story", SkillType.SPEAKING, "เล่าว่าทำอะไรในวันหยุด", "Last weekend, I went to the market.", [
            phrase("Last weekend", "สุดสัปดาห์ที่แล้ว", "Last weekend, I went to the market."),
            phrase("I visited my friend.", "ฉันไปเยี่ยมเพื่อน"),
            phrase("It was fun.", "มันสนุก"),
            phrase("I stayed at home.", "ฉันอยู่บ้าน"),
          ], [{ sentence: "Last _____, I went to the market.", answer: "weekend" }, { sentence: "It _____ fun.", answer: "was" }, { sentence: "I stayed at _____.", answer: "home" }]),
          lesson("past-reading", "อ่านเรื่องสั้นในอดีต", "Past Reading", SkillType.READING, "อ่าน paragraph ที่ใช้ past simple", "Yesterday, Nina went shopping. She bought a blue shirt.", [
            phrase("Yesterday, Nina went shopping.", "เมื่อวานนีน่าไปซื้อของ"),
            phrase("She bought a blue shirt.", "เธอซื้อเสื้อสีฟ้า"),
            phrase("Then she ate noodles.", "จากนั้นเธอกินก๋วยเตี๋ยว"),
            phrase("She went home at five.", "เธอกลับบ้านตอนห้าโมง"),
          ], [{ sentence: "Nina went _____ yesterday.", answer: "shopping" }, { sentence: "She bought a blue _____.", answer: "shirt" }, { sentence: "She went home at _____.", answer: "five" }]),
        ],
      },
      {
        slug: "plans-travel",
        nameTh: "แผนและการเดินทาง",
        nameEn: "Plans and Travel",
        descriptionTh: "พูดแผนในอนาคตและสถานการณ์เดินทาง",
        lessons: [
          lesson("going-to", "be going to", "Be Going To", SkillType.GRAMMAR, "พูดแผนในอนาคต", "I am going to study tonight.", [
            phrase("I am going to study tonight.", "คืนนี้ฉันจะเรียน"),
            phrase("She is going to travel.", "เธอกำลังจะเดินทาง"),
            phrase("We are going to eat out.", "พวกเราจะไปกินข้าวนอกบ้าน"),
            phrase("They are going to play football.", "พวกเขาจะไปเล่นฟุตบอล"),
          ], [{ sentence: "I am going to _____ tonight.", answer: "study" }, { sentence: "She is going to _____.", answer: "travel" }, { sentence: "We are going to eat _____.", answer: "out" }]),
          lesson("transport", "การเดินทาง", "Transport", SkillType.VOCABULARY, "เรียกวิธีเดินทาง", "I go by bus. She takes a taxi.", [
            phrase("bus", "รถบัส", "I go by bus."),
            phrase("taxi", "แท็กซี่", "She takes a taxi."),
            phrase("train", "รถไฟ", "We travel by train."),
            phrase("motorbike", "มอเตอร์ไซค์", "He rides a motorbike."),
          ], [{ sentence: "I go by _____.", answer: "bus" }, { sentence: "She takes a _____.", answer: "taxi" }, { sentence: "We travel by _____.", answer: "train" }]),
          lesson("hotel-check-in", "เช็คอินโรงแรม", "Hotel Check-in", SkillType.SPEAKING, "พูดประโยคพื้นฐานที่โรงแรม", "I have a reservation.", [
            phrase("I have a reservation.", "ฉันจองไว้แล้ว"),
            phrase("Can I see your passport?", "ขอดูพาสปอร์ตได้ไหม"),
            phrase("Your room is on the third floor.", "ห้องของคุณอยู่ชั้นสาม"),
            phrase("What time is breakfast?", "อาหารเช้ากี่โมง"),
          ], [{ sentence: "I have a _____.", answer: "reservation" }, { sentence: "Can I see your _____?", answer: "passport" }, { sentence: "What time is _____?", answer: "breakfast" }]),
          lesson("travel-email", "เขียนอีเมลแผนเที่ยว", "Travel Plan Email", SkillType.WRITING, "เขียนอีเมลบอกแผนการเดินทาง", "I am going to visit Chiang Mai next week.", [
            phrase("I am going to visit Chiang Mai.", "ฉันจะไปเชียงใหม่"),
            phrase("I will stay for two nights.", "ฉันจะพักสองคืน"),
            phrase("I want to see the mountains.", "ฉันอยากเห็นภูเขา"),
            phrase("Please send me the details.", "กรุณาส่งรายละเอียดให้ฉัน"),
          ], [{ sentence: "I am going to _____ Chiang Mai.", answer: "visit" }, { sentence: "I will stay for two _____.", answer: "nights" }, { sentence: "Please send me the _____.", answer: "details" }]),
        ],
      },
      {
        slug: "work-study",
        nameTh: "งานและการเรียน",
        nameEn: "Work and Study",
        descriptionTh: "ใช้ภาษาในโรงเรียน มหาวิทยาลัย และที่ทำงาน",
        lessons: [
          lesson("school-subjects", "วิชาเรียน", "School Subjects", SkillType.VOCABULARY, "เรียกวิชาและตารางเรียน", "I study math on Monday.", [
            phrase("math", "คณิตศาสตร์", "I study math."),
            phrase("science", "วิทยาศาสตร์", "She likes science."),
            phrase("English", "ภาษาอังกฤษ", "We study English."),
            phrase("history", "ประวัติศาสตร์", "He reads history books."),
          ], [{ sentence: "I study _____.", answer: "math" }, { sentence: "She likes _____.", answer: "science" }, { sentence: "We study _____.", answer: "English" }]),
          lesson("work-tasks", "งานประจำวัน", "Work Tasks", SkillType.SPEAKING, "อธิบายงานที่ทำ", "I answer emails. I join meetings.", [
            phrase("answer emails", "ตอบอีเมล", "I answer emails every morning."),
            phrase("join meetings", "เข้าประชุม", "I join meetings on Tuesday."),
            phrase("write reports", "เขียนรายงาน", "She writes reports."),
            phrase("call clients", "โทรหาลูกค้า", "He calls clients."),
          ], [{ sentence: "I answer _____.", answer: "emails" }, { sentence: "I join _____.", answer: "meetings" }, { sentence: "She writes _____.", answer: "reports" }]),
          lesson("comparatives", "Comparatives", "Comparatives", SkillType.GRAMMAR, "เปรียบเทียบด้วย -er / more", "This book is easier. English is more useful.", [
            phrase("easier", "ง่ายกว่า", "This lesson is easier."),
            phrase("faster", "เร็วกว่า", "The train is faster than the bus."),
            phrase("more useful", "มีประโยชน์กว่า", "English is more useful for work."),
            phrase("more expensive", "แพงกว่า", "This phone is more expensive."),
          ], [{ sentence: "This lesson is _____.", answer: "easier" }, { sentence: "The train is _____ than the bus.", answer: "faster" }, { sentence: "English is more _____ for work.", answer: "useful" }]),
          lesson("study-plan", "เขียนแผนการเรียน", "Study Plan", SkillType.WRITING, "เขียนเป้าหมายและตารางเรียน", "I will study English for 20 minutes every day.", [
            phrase("I will study every day.", "ฉันจะเรียนทุกวัน"),
            phrase("My goal is to speak clearly.", "เป้าหมายของฉันคือพูดให้ชัด"),
            phrase("I need more practice.", "ฉันต้องฝึกมากขึ้น"),
            phrase("I will review vocabulary.", "ฉันจะทบทวนคำศัพท์"),
          ], [{ sentence: "I will study every _____.", answer: "day" }, { sentence: "My goal is to speak _____.", answer: "clearly" }, { sentence: "I need more _____.", answer: "practice" }]),
        ],
      },
      {
        slug: "problems-opinions",
        nameTh: "ปัญหาและความคิดเห็น",
        nameEn: "Problems and Opinions",
        descriptionTh: "อธิบายปัญหา ขอความช่วยเหลือ และแสดงความคิดเห็น",
        lessons: [
          lesson("health-problems", "ปัญหาสุขภาพ", "Health Problems", SkillType.VOCABULARY, "บอกอาการป่วยง่าย ๆ", "I have a headache.", [
            phrase("headache", "ปวดหัว", "I have a headache."),
            phrase("stomachache", "ปวดท้อง", "She has a stomachache."),
            phrase("fever", "ไข้", "He has a fever."),
            phrase("sore throat", "เจ็บคอ", "I have a sore throat."),
          ], [{ sentence: "I have a _____.", answer: "headache" }, { sentence: "She has a _____.", answer: "stomachache" }, { sentence: "He has a _____.", answer: "fever" }]),
          lesson("asking-help", "ขอความช่วยเหลือ", "Asking for Help", SkillType.SPEAKING, "ขอความช่วยเหลืออย่างสุภาพ", "Could you help me, please?", [
            phrase("Could you help me, please?", "ช่วยฉันหน่อยได้ไหม"),
            phrase("I don't understand.", "ฉันไม่เข้าใจ"),
            phrase("Can you say that again?", "พูดอีกครั้งได้ไหม"),
            phrase("What should I do?", "ฉันควรทำอย่างไร"),
          ], [{ sentence: "Could you _____ me, please?", answer: "help" }, { sentence: "I don't _____.", answer: "understand" }, { sentence: "What should I _____?", answer: "do" }]),
          lesson("giving-opinions", "แสดงความคิดเห็น", "Giving Opinions", SkillType.SPEAKING, "พูด opinion ง่าย ๆ พร้อมเหตุผล", "I think it is useful because it is easy.", [
            phrase("I think it is useful.", "ฉันคิดว่ามันมีประโยชน์"),
            phrase("I agree.", "ฉันเห็นด้วย"),
            phrase("I don't agree.", "ฉันไม่เห็นด้วย"),
            phrase("because it is easy", "เพราะมันง่าย"),
          ], [{ sentence: "I _____ it is useful.", answer: "think" }, { sentence: "I don't _____.", answer: "agree" }, { sentence: "because it is _____.", answer: "easy" }]),
          lesson("short-review", "เขียนรีวิวสั้น", "Short Review", SkillType.WRITING, "เขียนรีวิวสินค้า/บริการสั้น ๆ", "The restaurant was clean. The food was good.", [
            phrase("The restaurant was clean.", "ร้านอาหารสะอาด"),
            phrase("The food was good.", "อาหารดี"),
            phrase("The service was friendly.", "บริการเป็นมิตร"),
            phrase("I will come back.", "ฉันจะกลับมาอีก"),
          ], [{ sentence: "The restaurant was _____.", answer: "clean" }, { sentence: "The food was _____.", answer: "good" }, { sentence: "I will come _____.", answer: "back" }]),
        ],
      },
    ],
  },
];

const advancedLevels: Array<{ level: LevelCode; nameTh: string; nameEn: string; descriptionTh: string; themes: string[]; skills: SkillType[] }> = [
  {
    level: LevelCode.B1,
    nameTh: "B1 Independent English",
    nameEn: "B1 Independent English",
    descriptionTh: "เล่าประสบการณ์ อธิบายเหตุผล และรับมือสถานการณ์ทั่วไป",
    themes: ["ประสบการณ์ส่วนตัว", "ข่าวและสังคม", "งานและเป้าหมาย", "การแก้ปัญหา"],
    skills: [SkillType.READING, SkillType.SPEAKING, SkillType.GRAMMAR, SkillType.WRITING],
  },
  {
    level: LevelCode.B2,
    nameTh: "B2 Professional English",
    nameEn: "B2 Professional English",
    descriptionTh: "สื่อสารงาน ประชุม นำเสนอ และถกประเด็นซับซ้อน",
    themes: ["การประชุม", "การนำเสนอ", "การเจรจา", "บทความเชิงวิเคราะห์"],
    skills: [SkillType.SPEAKING, SkillType.WRITING, SkillType.LISTENING, SkillType.READING],
  },
  {
    level: LevelCode.C1,
    nameTh: "C1 Advanced Communication",
    nameEn: "C1 Advanced Communication",
    descriptionTh: "สื่อสารเชิงลึก วิชาการ และงานอาชีพอย่างเป็นธรรมชาติ",
    themes: ["ภาษาเชิงวิชาการ", "การเขียนเชิงโน้มน้าว", "การอภิปราย", "ภาษาในองค์กร"],
    skills: [SkillType.READING, SkillType.WRITING, SkillType.SPEAKING, SkillType.LISTENING],
  },
  {
    level: LevelCode.C2,
    nameTh: "C2 Mastery English",
    nameEn: "C2 Mastery English",
    descriptionTh: "ใช้ภาษาแม่นยำ ละเอียด และเหมาะกับบริบทระดับสูง",
    themes: ["สำนวนและนัยยะ", "การสรุปข้อมูลซับซ้อน", "สไตล์และน้ำเสียง", "การวิจารณ์เชิงลึก"],
    skills: [SkillType.READING, SkillType.WRITING, SkillType.SPEAKING, SkillType.LISTENING],
  },
];

for (const advanced of advancedLevels) {
  curriculum.push(makeAdvancedCourse(advanced));
}

function makeAdvancedCourse(input: { level: LevelCode; nameTh: string; nameEn: string; descriptionTh: string; themes: string[]; skills: SkillType[] }): CourseSeed {
  return {
    level: input.level,
    nameTh: input.nameTh,
    nameEn: input.nameEn,
    descriptionTh: input.descriptionTh,
    units: input.themes.map((theme, unitIdx) => ({
      slug: `unit-${unitIdx + 1}-${simpleSlug(theme)}`,
      nameTh: theme,
      nameEn: `${input.level} ${theme}`,
      descriptionTh: `ฝึก${theme}ด้วยภาษาอังกฤษระดับ ${input.level}`,
      lessons: input.skills.map((skill, lessonIdx) => {
        const profile = advancedLessonProfile(input.level, theme, skill);
        return lesson(
          `${simpleSlug(theme)}-${simpleSlug(profile.skillName)}`,
          profile.nameTh,
          profile.nameEn,
          skill,
          profile.outcome,
          profile.pattern,
          profile.phrases,
          profile.exercises,
          18 + lessonIdx
        );
      }),
    })),
  };
}

function advancedLessonProfile(level: LevelCode, theme: string, skill: SkillType) {
  const skillName = skillThai[skill];
  const levelFocus: Record<LevelCode, { aim: string; tone: string; task: string }> = {
    PRE_A1: { aim: "ใช้คำสั้นและประโยคง่าย", tone: "very simple", task: "say one sentence" },
    A1: { aim: "สื่อสารข้อมูลพื้นฐาน", tone: "simple", task: "exchange basic information" },
    A2: { aim: "เล่าเรื่องชีวิตประจำวัน", tone: "clear and practical", task: "describe a familiar situation" },
    B1: { aim: "อธิบายประสบการณ์ เหตุผล และแผนได้ต่อเนื่อง", tone: "clear and connected", task: "give reasons and examples" },
    B2: { aim: "อภิปรายประเด็นงานหรือสังคมด้วยเหตุผลหลายมุม", tone: "professional and balanced", task: "compare options and justify a recommendation" },
    C1: { aim: "สื่อสารเชิงลึกด้วยโครงสร้างและ nuance ที่ชัด", tone: "precise and persuasive", task: "synthesize sources and argue a position" },
    C2: { aim: "ใช้ภาษาอย่างแม่นยำ ละเอียด และปรับน้ำเสียงได้", tone: "nuanced and sophisticated", task: "evaluate, reframe, and critique complex ideas" },
  };

  const focus = levelFocus[level];
  const nameTh = `${theme}: ${skillName}เชิงลึก`;
  const nameEn = `${theme}: Advanced ${skill}`;
  const outcome = `${focus.aim} ในหัวข้อ "${theme}" โดยฝึก${skillName}ผ่าน input, model language, controlled practice และ output task`;

  const patternBySkill: Record<SkillType, string> = {
    VOCABULARY: `Build a topic word bank → notice collocations → use each item in a sentence. Tone: ${focus.tone}.`,
    GRAMMAR: `Form → meaning → use: identify the structure, explain why it is used, then produce your own example about ${theme}.`,
    LISTENING: `Preview keywords → listen for signposts → note the speaker's purpose → summarize the message in 2-3 lines.`,
    SPEAKING: `Point → reason → example → follow-up question. Keep the response ${focus.tone} and complete the task: ${focus.task}.`,
    READING: `Skim for gist → scan for evidence → infer attitude → evaluate whether the argument is convincing.`,
    WRITING: `Plan → topic sentence → evidence → concession → conclusion. Keep paragraphs coherent and use transitions.`,
  };

  const phraseSets: Record<LevelCode, Phrase[]> = {
    PRE_A1: [],
    A1: [],
    A2: [],
    B1: [
      phrase("The main reason is...", "เหตุผลหลักคือ...", `The main reason is that ${theme} affects daily decisions.`),
      phrase("For example,...", "ตัวอย่างเช่น...", "For example, I changed my routine to save time."),
      phrase("I used to..., but now...", "เมื่อก่อนฉันเคย...แต่ตอนนี้...", "I used to avoid speaking, but now I practise every day."),
      phrase("In my experience,...", "จากประสบการณ์ของฉัน...", "In my experience, small habits matter."),
      phrase("I agree to some extent.", "ฉันเห็นด้วยในระดับหนึ่ง", "I agree to some extent, but there are exceptions."),
      phrase("The problem can be solved by...", "ปัญหานี้แก้ได้โดย...", "The problem can be solved by setting clearer goals."),
    ],
    B2: [
      phrase("From a practical standpoint,...", "จากมุมมองเชิงปฏิบัติ...", "From a practical standpoint, the proposal is realistic."),
      phrase("The trade-off is...", "ข้อแลกเปลี่ยนคือ...", "The trade-off is higher cost but better reliability."),
      phrase("A more sustainable option would be...", "ทางเลือกที่ยั่งยืนกว่าคือ...", "A more sustainable option would be to train the team."),
      phrase("The evidence suggests that...", "หลักฐานชี้ว่า...", "The evidence suggests that preparation improves outcomes."),
      phrase("I would recommend...", "ฉันขอแนะนำว่า...", "I would recommend a phased approach."),
      phrase("However, we should also consider...", "อย่างไรก็ตาม ควรพิจารณา...", "However, we should also consider the risks."),
    ],
    C1: [
      phrase("The issue is more nuanced than it first appears.", "ประเด็นนี้ละเอียดกว่าที่เห็นตอนแรก", "The issue is more nuanced than it first appears."),
      phrase("A key implication is...", "นัยสำคัญคือ...", "A key implication is that policy must be flexible."),
      phrase("This raises the question of...", "สิ่งนี้ทำให้เกิดคำถามว่า...", "This raises the question of accountability."),
      phrase("While the argument is compelling,...", "แม้ข้อโต้แย้งจะน่าเชื่อ...", "While the argument is compelling, it overlooks implementation costs."),
      phrase("To put it another way,...", "กล่าวอีกอย่างคือ...", "To put it another way, the constraint can become an advantage."),
      phrase("The conclusion follows only if...", "ข้อสรุปนี้ใช้ได้ก็ต่อเมื่อ...", "The conclusion follows only if the assumptions are correct."),
    ],
    C2: [
      phrase("The distinction is subtle but consequential.", "ความแตกต่างนี้ละเอียดแต่มีผลสำคัญ", "The distinction is subtle but consequential."),
      phrase("The wording carries an implicit assumption.", "ถ้อยคำนี้มีสมมติฐานแฝง", "The wording carries an implicit assumption about responsibility."),
      phrase("I would qualify that claim by saying...", "ฉันจะปรับข้อกล่าวอ้างนั้นว่า...", "I would qualify that claim by saying it applies only in stable contexts."),
      phrase("The argument is elegant, yet incomplete.", "ข้อโต้แย้งนี้งดงามแต่ยังไม่ครบถ้วน", "The argument is elegant, yet incomplete."),
      phrase("A charitable reading would be...", "การตีความอย่างเป็นธรรมคือ...", "A charitable reading would be that the author values clarity over detail."),
      phrase("The tone shifts from analytical to evaluative.", "น้ำเสียงเปลี่ยนจากวิเคราะห์เป็นประเมินค่า", "The tone shifts from analytical to evaluative in the final paragraph."),
    ],
  };

  const exercisesByLevel: Record<LevelCode, Array<{ sentence: string; answer: string; hint?: string }>> = {
    PRE_A1: [],
    A1: [],
    A2: [],
    B1: [
      { sentence: "The main _____ is that practice builds confidence.", answer: "reason", hint: "เหตุผล" },
      { sentence: "In my _____, small steps work best.", answer: "experience", hint: "ประสบการณ์" },
      { sentence: "The problem can be _____ by planning ahead.", answer: "solved", hint: "แก้ไข" },
    ],
    B2: [
      { sentence: "From a practical _____, the plan is realistic.", answer: "standpoint", hint: "มุมมอง" },
      { sentence: "The evidence _____ that preparation matters.", answer: "suggests", hint: "ชี้ให้เห็น" },
      { sentence: "We should also _____ the risks.", answer: "consider", hint: "พิจารณา" },
    ],
    C1: [
      { sentence: "The issue is more _____ than it first appears.", answer: "nuanced", hint: "ละเอียดซับซ้อน" },
      { sentence: "This raises the _____ of accountability.", answer: "question", hint: "คำถาม/ประเด็น" },
      { sentence: "The conclusion follows only if the _____ are correct.", answer: "assumptions", hint: "สมมติฐาน" },
    ],
    C2: [
      { sentence: "The distinction is subtle but _____.", answer: "consequential", hint: "มีผลสำคัญ" },
      { sentence: "The wording carries an implicit _____.", answer: "assumption", hint: "สมมติฐาน" },
      { sentence: "The tone shifts from analytical to _____.", answer: "evaluative", hint: "เชิงประเมินค่า" },
    ],
  };

  return {
    skillName,
    nameTh,
    nameEn,
    outcome,
    pattern: patternBySkill[skill],
    phrases: phraseSets[level],
    exercises: exercisesByLevel[level],
  };
}

function simpleSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function levelId(code: LevelCode) {
  return `level-${code.toLowerCase().replace("_", "-")}`;
}

function courseId(code: LevelCode) {
  return `course-${code.toLowerCase().replace("_", "-")}-complete`;
}

function unitId(code: LevelCode, unit: UnitSeed) {
  return `unit-${code.toLowerCase().replace("_", "-")}-${unit.slug}`;
}

function lessonId(code: LevelCode, unit: UnitSeed, item: LessonSeed) {
  return `lesson-${code.toLowerCase().replace("_", "-")}-${unit.slug}-${item.slug}`;
}

function questionId(code: LevelCode, unit: UnitSeed, idx: number) {
  return `q-${code.toLowerCase().replace("_", "-")}-${unit.slug}-${idx + 1}`;
}

async function main() {
  console.log("Seeding Learn E+ curriculum...");

  await retireLegacySeedContent();

  const levels = new Map<LevelCode, { id: string }>();
  for (const [code, meta] of Object.entries(levelMeta) as Array<[LevelCode, typeof levelMeta[LevelCode]]>) {
    const level = await db.level.upsert({
      where: { code },
      update: {
        nameTh: meta.nameTh,
        nameEn: meta.nameEn,
        description: meta.description,
        orderNum: meta.order,
        isActive: meta.active,
      },
      create: {
        id: levelId(code),
        code,
        nameTh: meta.nameTh,
        nameEn: meta.nameEn,
        description: meta.description,
        orderNum: meta.order,
        isActive: meta.active,
      },
    });
    levels.set(code, level);

    await db.levelExamSetting.upsert({
      where: { levelId: level.id },
      update: {
        minCourseCompletionPct: 80,
        minUnitTestAvgScore: 70,
        minLevelExamScore: 80,
        minSkillScore: 60,
        minHomeworkSubmitPct: 70,
        retakeAfterDays: 7,
      },
      create: {
        levelId: level.id,
        minCourseCompletionPct: 80,
        minUnitTestAvgScore: 70,
        minLevelExamScore: 80,
        minSkillScore: 60,
        minHomeworkSubmitPct: 70,
        retakeAfterDays: 7,
      },
    });
  }

  for (const courseSeed of curriculum) {
    const level = levels.get(courseSeed.level);
    if (!level) throw new Error(`Missing level ${courseSeed.level}`);

    const course = await db.course.upsert({
      where: { id: courseId(courseSeed.level) },
      update: {
        levelId: level.id,
        nameTh: courseSeed.nameTh,
        nameEn: courseSeed.nameEn,
        descriptionTh: courseSeed.descriptionTh,
        orderNum: levelMeta[courseSeed.level].order,
        isPublished: true,
      },
      create: {
        id: courseId(courseSeed.level),
        levelId: level.id,
        nameTh: courseSeed.nameTh,
        nameEn: courseSeed.nameEn,
        descriptionTh: courseSeed.descriptionTh,
        orderNum: levelMeta[courseSeed.level].order,
        isPublished: true,
      },
    });

    for (const [unitIndex, unitSeed] of courseSeed.units.entries()) {
      const unit = await db.unit.upsert({
        where: { id: unitId(courseSeed.level, unitSeed) },
        update: {
          courseId: course.id,
          nameTh: unitSeed.nameTh,
          nameEn: unitSeed.nameEn,
          descriptionTh: unitSeed.descriptionTh,
          orderNum: unitIndex + 1,
          isPublished: true,
        },
        create: {
          id: unitId(courseSeed.level, unitSeed),
          courseId: course.id,
          nameTh: unitSeed.nameTh,
          nameEn: unitSeed.nameEn,
          descriptionTh: unitSeed.descriptionTh,
          orderNum: unitIndex + 1,
          isPublished: true,
        },
      });

      const unitQuestions: string[] = [];
      for (const [lessonIndex, lessonSeed] of unitSeed.lessons.entries()) {
        const id = lessonId(courseSeed.level, unitSeed, lessonSeed);
        const savedLesson = await db.lesson.upsert({
          where: { id },
          update: {
            unitId: unit.id,
            nameTh: lessonSeed.nameTh,
            nameEn: lessonSeed.nameEn,
            descriptionTh: lessonSeed.outcome,
            skillType: lessonSeed.skill,
            orderNum: lessonIndex + 1,
            durationMinutes: lessonSeed.minutes ?? 12,
            isPublished: true,
          },
          create: {
            id,
            unitId: unit.id,
            nameTh: lessonSeed.nameTh,
            nameEn: lessonSeed.nameEn,
            descriptionTh: lessonSeed.outcome,
            skillType: lessonSeed.skill,
            orderNum: lessonIndex + 1,
            durationMinutes: lessonSeed.minutes ?? 12,
            isPublished: true,
          },
        });

        await seedLessonContent(savedLesson.id, lessonSeed);
        await seedHomework(savedLesson.id, unit.id, lessonSeed);
        await seedVocabulary(level.id, courseSeed.level, unitSeed, lessonSeed);

        const qid = questionId(courseSeed.level, unitSeed, lessonIndex);
        const correct = lessonSeed.phrases[0]?.front ?? lessonSeed.exercises[0]?.answer ?? "answer";
        await db.question.upsert({
          where: { id: qid },
          update: {
            levelId: level.id,
            skillType: lessonSeed.skill,
            questionType: QuestionType.MCQ,
            questionData: {
              text: `ข้อใดเกี่ยวกับ "${lessonSeed.nameTh}" ถูกต้องที่สุด?`,
              options: buildOptions(correct, unitSeed.lessons),
            },
            correctAnswer: correct,
            explanationTh: `คำตอบคือ "${correct}" เพราะเป็น key phrase ในบท "${lessonSeed.nameTh}"`,
            difficulty: lessonIndex < 2 ? Difficulty.EASY : Difficulty.MEDIUM,
            points: 1,
            tags: [courseSeed.level, unitSeed.slug, lessonSeed.slug],
            isActive: true,
          },
          create: {
            id: qid,
            levelId: level.id,
            skillType: lessonSeed.skill,
            questionType: QuestionType.MCQ,
            questionData: {
              text: `ข้อใดเกี่ยวกับ "${lessonSeed.nameTh}" ถูกต้องที่สุด?`,
              options: buildOptions(correct, unitSeed.lessons),
            },
            correctAnswer: correct,
            explanationTh: `คำตอบคือ "${correct}" เพราะเป็น key phrase ในบท "${lessonSeed.nameTh}"`,
            difficulty: lessonIndex < 2 ? Difficulty.EASY : Difficulty.MEDIUM,
            points: 1,
            tags: [courseSeed.level, unitSeed.slug, lessonSeed.slug],
            isActive: true,
          },
        });
        unitQuestions.push(qid);
      }

      await seedUnitTest(courseSeed.level, level.id, unit.id, unitSeed, unitQuestions);
    }
  }

  await seedAchievements();
  console.log(`Seed complete: ${curriculum.length} courses, ${curriculum.reduce((sum, c) => sum + c.units.length, 0)} units, ${curriculum.reduce((sum, c) => sum + c.units.reduce((n, u) => n + u.lessons.length, 0), 0)} lessons.`);
}

async function retireLegacySeedContent() {
  await db.course.updateMany({
    where: { id: { in: ["course-pre-a1-foundations", "course-a1-daily-conversation"] } },
    data: { isPublished: false },
  });
  await db.unit.updateMany({
    where: { id: { in: ["unit-pre-a1-alphabet", "unit-a1-introducing-yourself"] } },
    data: { isPublished: false },
  });
  await db.lesson.updateMany({
    where: {
      id: {
        in: [
          "lesson-pre-a1-alphabet-overview",
          "lesson-pre-a1-vowels",
          "lesson-pre-a1-numbers-1-10",
          "lesson-a1-my-name-is",
        ],
      },
    },
    data: { isPublished: false },
  });
}

async function seedLessonContent(lessonIdValue: string, lessonSeed: LessonSeed) {
  const textBody = [
    `เป้าหมาย: ${lessonSeed.outcome}`,
    "",
    `รูปแบบหลัก: ${lessonSeed.pattern}`,
    "",
    "ตัวอย่างที่ควรจำ:",
    ...lessonSeed.phrases.map((p) => `- ${p.front}: ${p.back}${p.example ? ` (${p.example})` : ""}`),
    "",
    "เรียนบทนี้ให้ครบ อ่านออกเสียงตาม และลองสร้างประโยคของตัวเอง 1 ประโยคก่อนกดจบบทเรียน",
  ].join("\n");

  const blocks = [
    {
      id: `${lessonIdValue}-text`,
      contentType: ContentType.TEXT,
      orderNum: 1,
      data: { title: lessonSeed.nameTh, body: textBody },
    },
    {
      id: `${lessonIdValue}-flashcards`,
      contentType: ContentType.FLASHCARD,
      orderNum: 2,
      data: { cards: lessonSeed.phrases },
    },
    {
      id: `${lessonIdValue}-conversation`,
      contentType: ContentType.CONVERSATION,
      orderNum: 3,
      data: { lines: lessonSeed.conversation },
    },
    {
      id: `${lessonIdValue}-exercise`,
      contentType: ContentType.EXERCISE,
      orderNum: 4,
      data: {
        type: "fill_blank",
        instruction: "เติมคำในช่องว่างให้ถูกต้อง แล้วตรวจคำตอบ",
        questions: lessonSeed.exercises,
      },
    },
  ];

  for (const block of blocks) {
    await db.lessonContent.upsert({
      where: { id: block.id },
      update: {
        lessonId: lessonIdValue,
        contentType: block.contentType,
        orderNum: block.orderNum,
        data: block.data,
      },
      create: {
        id: block.id,
        lessonId: lessonIdValue,
        contentType: block.contentType,
        orderNum: block.orderNum,
        data: block.data,
      },
    });
  }
}

async function seedHomework(lessonIdValue: string, unitIdValue: string, lessonSeed: LessonSeed) {
  const prompt =
    lessonSeed.skill === SkillType.WRITING
      ? `เขียน 5-6 ประโยคเกี่ยวกับ "${lessonSeed.nameTh}" โดยใช้คำ/รูปแบบจากบทเรียนอย่างน้อย 3 รายการ`
      : lessonSeed.skill === SkillType.SPEAKING
        ? `อัด/เขียน script สั้น ๆ 6 บรรทัดเกี่ยวกับ "${lessonSeed.nameTh}" แล้วส่งข้อความสรุปสิ่งที่พูด`
        : `ทำสรุปบท "${lessonSeed.nameTh}" เป็นภาษาไทยสั้น ๆ และแต่งประโยคอังกฤษของตัวเอง 3 ประโยค`;

  await db.homework.upsert({
    where: { id: `hw-${lessonIdValue}` },
    update: {
      lessonId: lessonIdValue,
      unitId: unitIdValue,
      nameTh: `การบ้าน: ${lessonSeed.nameTh}`,
      descriptionTh: prompt,
      skillType: lessonSeed.skill,
      maxScore: 100,
      dueOffsetDays: 3,
      isAutoGenerated: true,
      maxAttempts: 3,
      isActive: true,
    },
    create: {
      id: `hw-${lessonIdValue}`,
      lessonId: lessonIdValue,
      unitId: unitIdValue,
      nameTh: `การบ้าน: ${lessonSeed.nameTh}`,
      descriptionTh: prompt,
      skillType: lessonSeed.skill,
      maxScore: 100,
      dueOffsetDays: 3,
      isAutoGenerated: true,
      maxAttempts: 3,
      isActive: true,
    },
  });
}

async function seedVocabulary(levelIdValue: string, levelCode: LevelCode, unitSeed: UnitSeed, lessonSeed: LessonSeed) {
  for (const item of lessonSeed.phrases) {
    const word = item.front.split(" ")[0].replace(/[^a-zA-Z]/g, "").toLowerCase() || simpleSlug(item.front);
    const id = `vocab-${levelCode.toLowerCase().replace("_", "-")}-${unitSeed.slug}-${lessonSeed.slug}-${simpleSlug(item.front)}`;
    await db.vocabularyItem.upsert({
      where: { id },
      update: {
        levelId: levelIdValue,
        word: item.front,
        translationTh: item.back,
        pronunciationTh: item.pronunciation ?? pronunciationFor(item.front),
        partOfSpeech: inferPartOfSpeech(item.front),
        category: unitSeed.nameTh,
        exampleSentence: item.example ?? null,
        exampleTranslation: item.back,
        cefrLevel: levelCode,
        isActive: true,
      },
      create: {
        id,
        levelId: levelIdValue,
        word: item.front,
        translationTh: item.back,
        pronunciationTh: item.pronunciation ?? pronunciationFor(item.front),
        partOfSpeech: inferPartOfSpeech(word),
        category: unitSeed.nameTh,
        exampleSentence: item.example ?? null,
        exampleTranslation: item.back,
        cefrLevel: levelCode,
        isActive: true,
      },
    });
  }
}

async function seedUnitTest(levelCode: LevelCode, levelIdValue: string, unitIdValue: string, unitSeed: UnitSeed, unitQuestions: string[]) {
  const test = await db.test.upsert({
    where: { id: `test-${levelCode.toLowerCase().replace("_", "-")}-${unitSeed.slug}` },
    update: {
      type: TestType.UNIT_TEST,
      levelId: levelIdValue,
      unitId: unitIdValue,
      nameTh: `แบบทดสอบ: ${unitSeed.nameTh}`,
      descriptionTh: `ทบทวนบทเรียนในหน่วย ${unitSeed.nameTh}`,
      durationMins: 10,
      passingScore: 70,
      isRandomized: false,
      maxAttempts: 3,
      isActive: true,
    },
    create: {
      id: `test-${levelCode.toLowerCase().replace("_", "-")}-${unitSeed.slug}`,
      type: TestType.UNIT_TEST,
      levelId: levelIdValue,
      unitId: unitIdValue,
      nameTh: `แบบทดสอบ: ${unitSeed.nameTh}`,
      descriptionTh: `ทบทวนบทเรียนในหน่วย ${unitSeed.nameTh}`,
      durationMins: 10,
      passingScore: 70,
      isRandomized: false,
      maxAttempts: 3,
      isActive: true,
    },
  });

  const section = await db.testSection.upsert({
    where: { id: `section-${test.id}-main` },
    update: {
      testId: test.id,
      skillType: SkillType.VOCABULARY,
      nameTh: "ทบทวนหลัก",
      questionCount: unitQuestions.length,
      timeLimitMins: 10,
      orderNum: 1,
    },
    create: {
      id: `section-${test.id}-main`,
      testId: test.id,
      skillType: SkillType.VOCABULARY,
      nameTh: "ทบทวนหลัก",
      questionCount: unitQuestions.length,
      timeLimitMins: 10,
      orderNum: 1,
    },
  });

  for (const [index, qid] of unitQuestions.entries()) {
    await db.testSectionQuestion.upsert({
      where: { sectionId_questionId: { sectionId: section.id, questionId: qid } },
      update: { orderNum: index + 1 },
      create: {
        sectionId: section.id,
        questionId: qid,
        orderNum: index + 1,
      },
    });
  }
}

function buildOptions(correct: string, lessons: LessonSeed[]) {
  const options = [correct];
  for (const item of lessons.flatMap((l) => l.phrases.map((p) => p.front))) {
    if (options.length >= 4) break;
    if (!options.includes(item)) options.push(item);
  }
  while (options.length < 4) options.push(["Yes", "No", "Maybe", "Later"][options.length]);
  return options.sort((a, b) => a.localeCompare(b));
}

function inferPartOfSpeech(text: string) {
  if (text.includes(" ")) return "phrase";
  if (["a", "an", "the"].includes(text.toLowerCase())) return "article";
  if (text.endsWith("ed") || text.endsWith("ing")) return "verb";
  return "word";
}

function pronunciationFor(text: string) {
  const key = text.toLowerCase().trim();
  const dictionary: Record<string, string> = {
    ate: "เอท",
    went: "เว็นท์",
    saw: "ซอ",
    bought: "บอท",
    watched: "วอทช์ท",
    cleaned: "คลีนด์",
    visited: "วิสิทิด",
    played: "เพลย์ด",
    weekend: "วีค-เอนด์",
    reservation: "เร-เซอร์-เว-ชัน",
    passport: "พาส-พอร์ต",
    transport: "แทรนส์-พอร์ต",
    taxi: "แท็ก-ซี",
    train: "เทรน",
    motorbike: "โม-เทอร์-ไบค์",
    easier: "อี-ซี-เออร์",
    faster: "ฟาส-เทอร์",
    "more useful": "มอร์ ยูส-ฟูล",
    "more expensive": "มอร์ อิก-สเพน-ซิฟ",
    headache: "เฮด-เอค",
    stomachache: "สตัม-มัค-เอค",
    fever: "ฟี-เวอร์",
    "sore throat": "ซอร์ โธรท",
    "main point": "เมน พอยนท์",
    "supporting evidence": "ซัพ-พอร์-ทิง เอ-วิ-เดนซ์",
    "in my view": "อิน มาย วิว",
    "to summarize": "ทู ซัม-มะ-ไรซ์",
    "the main reason is...": "เดอะ เมน รี-ซัน อิซ",
    "for example,...": "ฟอร์ อิก-แซม-เพิล",
    "in my experience,...": "อิน มาย อิก-สพี-เรียนซ์",
    "from a practical standpoint,...": "ฟรอม อะ แพรค-ทิ-เคิล สแตนด์-พอยนท์",
    "the trade-off is...": "เดอะ เทรด-ออฟ อิซ",
    "the evidence suggests that...": "ดิ เอ-วิ-เดนซ์ ซัก-เจสท์ส แดท",
    "i would recommend...": "ไอ วูด เรค-คะ-เมนด์",
    "the issue is more nuanced than it first appears.": "ดิ อิช-ชู อิซ มอร์ นิว-ออนซ์ด แดน อิท เฟิร์สท์ อะ-เพียร์ส",
    "a key implication is...": "อะ คีย์ อิม-พลิ-เค-ชัน อิซ",
    "this raises the question of...": "ดิส เร-ซิส เดอะ เควส-ชัน ออฟ",
    "the distinction is subtle but consequential.": "เดอะ ดิส-ติงค์-ชัน อิซ ซับ-เทิล บัท คอน-ซี-เควน-เชิล",
    "the wording carries an implicit assumption.": "เดอะ เวิร์ด-ดิง แคร์-รีส์ แอน อิม-พลิ-ซิท อะ-ซัมพ์-ชัน",
    "the argument is elegant, yet incomplete.": "ดิ อาร์-กิว-เมนท์ อิซ เอ-ละ-แกนท์ เย็ท อิน-คอม-พลีท",
  };
  return dictionary[key] ?? null;
}

async function seedAchievements() {
  const achievements = [
    { code: "STREAK_3", nameTh: "เรียนต่อเนื่อง 3 วัน", descriptionTh: "เรียนภาษาอังกฤษติดต่อกัน 3 วัน", requirementType: "streak", requirementValue: 3 },
    { code: "STREAK_7", nameTh: "เรียนต่อเนื่อง 1 สัปดาห์", descriptionTh: "เรียนภาษาอังกฤษติดต่อกัน 7 วัน", requirementType: "streak", requirementValue: 7 },
    { code: "STREAK_30", nameTh: "เรียนต่อเนื่อง 1 เดือน", descriptionTh: "เรียนภาษาอังกฤษติดต่อกัน 30 วัน", requirementType: "streak", requirementValue: 30 },
    { code: "STREAK_100", nameTh: "เรียนต่อเนื่อง 100 วัน", descriptionTh: "เรียนภาษาอังกฤษติดต่อกัน 100 วัน", requirementType: "streak", requirementValue: 100 },
    { code: "VOCAB_50", nameTh: "นักสะสมคำศัพท์", descriptionTh: "เรียนคำศัพท์ครบ 50 คำ", requirementType: "vocab", requirementValue: 50 },
    { code: "VOCAB_200", nameTh: "คลังคำศัพท์", descriptionTh: "เรียนคำศัพท์ครบ 200 คำ", requirementType: "vocab", requirementValue: 200 },
    { code: "LESSON_10", nameTh: "ผู้เรียนตัวยง", descriptionTh: "เรียนบทเรียนครบ 10 บท", requirementType: "lesson", requirementValue: 10 },
    { code: "LESSON_50", nameTh: "เดินทางครึ่งหลักสูตร", descriptionTh: "เรียนบทเรียนครบ 50 บท", requirementType: "lesson", requirementValue: 50 },
    { code: "FIRST_TEST", nameTh: "ทดสอบครั้งแรก", descriptionTh: "ทำแบบทดสอบครั้งแรก", requirementType: "test", requirementValue: 1 },
  ];

  for (const achievement of achievements) {
    await db.achievement.upsert({
      where: { code: achievement.code },
      update: achievement,
      create: achievement,
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
