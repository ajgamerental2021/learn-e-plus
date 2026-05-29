import { PrismaClient, LevelCode, SkillType, ContentType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter } as never);

async function main() {
  console.log("🌱 Seeding database...");

  // ── LEVELS ───────────────────────────────────────────────────────────────
  const levels = await Promise.all([
    db.level.upsert({
      where: { code: "PRE_A1" },
      update: {},
      create: { code: "PRE_A1", nameTh: "เริ่มต้น (Starter)", nameEn: "Starter", description: "สำหรับผู้ที่เริ่มจากศูนย์", orderNum: 1, isActive: true },
    }),
    db.level.upsert({
      where: { code: "A1" },
      update: {},
      create: { code: "A1", nameTh: "ผู้เริ่มต้น (Beginner)", nameEn: "Beginner", description: "ประโยคพื้นฐาน", orderNum: 2, isActive: true },
    }),
    db.level.upsert({
      where: { code: "A2" },
      update: {},
      create: { code: "A2", nameTh: "ขั้นต้น (Elementary)", nameEn: "Elementary", description: "สนทนาชีวิตประจำวัน", orderNum: 3, isActive: true },
    }),
    db.level.upsert({
      where: { code: "B1" },
      update: {},
      create: { code: "B1", nameTh: "ระดับกลาง (Intermediate)", nameEn: "Intermediate", description: "พูดอธิบายความคิดเห็น", orderNum: 4, isActive: false },
    }),
    db.level.upsert({
      where: { code: "B2" },
      update: {},
      create: { code: "B2", nameTh: "ระดับกลาง-สูง (Upper Intermediate)", nameEn: "Upper Intermediate", description: "Business Communication", orderNum: 5, isActive: false },
    }),
    db.level.upsert({
      where: { code: "C1" },
      update: {},
      create: { code: "C1", nameTh: "ขั้นสูง (Advanced)", nameEn: "Advanced", description: "Academic English", orderNum: 6, isActive: false },
    }),
    db.level.upsert({
      where: { code: "C2" },
      update: {},
      create: { code: "C2", nameTh: "เชี่ยวชาญ (Proficiency)", nameEn: "Proficiency", description: "ระดับเจ้าของภาษา", orderNum: 7, isActive: false },
    }),
  ]);

  const [preA1, a1, a2] = levels;

  // ── LEVEL EXAM SETTINGS ───────────────────────────────────────────────────
  for (const level of levels) {
    await db.levelExamSetting.upsert({
      where: { levelId: level.id },
      update: {},
      create: {
        levelId: level.id,
        minCourseCompletionPct: 80,
        minUnitTestAvgScore: 70,
        minLevelExamScore: 80,
        minSkillScore: 60,
        minHomeworkSubmitPct: 80,
        retakeAfterDays: 7,
      },
    });
  }

  // ── PRE-A1 VOCABULARY ────────────────────────────────────────────────────
  const vocabData = [
    // Alphabet & Numbers
    { word: "apple", pronunciationTh: "แอปเปิ้ล", translationTh: "แอปเปิ้ล", partOfSpeech: "noun", category: "food", exampleSentence: "I eat an apple.", exampleTranslation: "ฉันกินแอปเปิ้ล", cefrLevel: LevelCode.PRE_A1 },
    { word: "book", pronunciationTh: "บุ๊ค", translationTh: "หนังสือ", partOfSpeech: "noun", category: "school", exampleSentence: "This is my book.", exampleTranslation: "นี่คือหนังสือของฉัน", cefrLevel: LevelCode.PRE_A1 },
    { word: "cat", pronunciationTh: "แคท", translationTh: "แมว", partOfSpeech: "noun", category: "animals", exampleSentence: "The cat is cute.", exampleTranslation: "แมวตัวนั้นน่ารัก", cefrLevel: LevelCode.PRE_A1 },
    { word: "dog", pronunciationTh: "ด็อก", translationTh: "สุนัข", partOfSpeech: "noun", category: "animals", exampleSentence: "I have a dog.", exampleTranslation: "ฉันมีสุนัข", cefrLevel: LevelCode.PRE_A1 },
    { word: "one", pronunciationTh: "วัน", translationTh: "หนึ่ง", partOfSpeech: "number", category: "numbers", exampleSentence: "I have one book.", exampleTranslation: "ฉันมีหนังสือหนึ่งเล่ม", cefrLevel: LevelCode.PRE_A1 },
    { word: "two", pronunciationTh: "ทู", translationTh: "สอง", partOfSpeech: "number", category: "numbers", exampleSentence: "I have two cats.", exampleTranslation: "ฉันมีแมวสองตัว", cefrLevel: LevelCode.PRE_A1 },
    { word: "red", pronunciationTh: "เร็ด", translationTh: "สีแดง", partOfSpeech: "adjective", category: "colors", exampleSentence: "This apple is red.", exampleTranslation: "แอปเปิ้ลนี้สีแดง", cefrLevel: LevelCode.PRE_A1 },
    { word: "blue", pronunciationTh: "บลู", translationTh: "สีน้ำเงิน", partOfSpeech: "adjective", category: "colors", exampleSentence: "The sky is blue.", exampleTranslation: "ท้องฟ้าสีน้ำเงิน", cefrLevel: LevelCode.PRE_A1 },
    // A1 vocabulary
    { word: "hello", pronunciationTh: "เฮลโล่", translationTh: "สวัสดี", partOfSpeech: "interjection", category: "greetings", exampleSentence: "Hello! My name is Tom.", exampleTranslation: "สวัสดี! ฉันชื่อทอม", cefrLevel: LevelCode.A1 },
    { word: "goodbye", pronunciationTh: "กู๊ดบาย", translationTh: "ลาก่อน", partOfSpeech: "interjection", category: "greetings", exampleSentence: "Goodbye! See you tomorrow.", exampleTranslation: "ลาก่อน! พบกันพรุ่งนี้", cefrLevel: LevelCode.A1 },
    { word: "family", pronunciationTh: "แฟมิลี่", translationTh: "ครอบครัว", partOfSpeech: "noun", category: "family", exampleSentence: "My family is big.", exampleTranslation: "ครอบครัวของฉันใหญ่มาก", cefrLevel: LevelCode.A1 },
    { word: "school", pronunciationTh: "สกูล", translationTh: "โรงเรียน", partOfSpeech: "noun", category: "school", exampleSentence: "I go to school every day.", exampleTranslation: "ฉันไปโรงเรียนทุกวัน", cefrLevel: LevelCode.A1 },
    { word: "teacher", pronunciationTh: "ทีเชอร์", translationTh: "ครู", partOfSpeech: "noun", category: "school", exampleSentence: "My teacher is kind.", exampleTranslation: "ครูของฉันใจดี", cefrLevel: LevelCode.A1 },
    { word: "friend", pronunciationTh: "เฟรนด์", translationTh: "เพื่อน", partOfSpeech: "noun", category: "people", exampleSentence: "She is my best friend.", exampleTranslation: "เธอเป็นเพื่อนที่ดีที่สุดของฉัน", cefrLevel: LevelCode.A1 },
    // A2 vocabulary
    { word: "restaurant", pronunciationTh: "เรสเทอรองท์", translationTh: "ร้านอาหาร", partOfSpeech: "noun", category: "places", exampleSentence: "Let's go to a restaurant.", exampleTranslation: "ไปร้านอาหารกันเถอะ", cefrLevel: LevelCode.A2 },
    { word: "journey", pronunciationTh: "เจอร์นี่", translationTh: "การเดินทาง", partOfSpeech: "noun", category: "travel", exampleSentence: "The journey was long.", exampleTranslation: "การเดินทางยาวนาน", cefrLevel: LevelCode.A2 },
    { word: "weekend", pronunciationTh: "วีคเอนด์", translationTh: "วันหยุดสุดสัปดาห์", partOfSpeech: "noun", category: "time", exampleSentence: "I relax on the weekend.", exampleTranslation: "ฉันพักผ่อนในวันหยุดสุดสัปดาห์", cefrLevel: LevelCode.A2 },
    { word: "shopping", pronunciationTh: "ช็อปปิ้ง", translationTh: "การซื้อของ", partOfSpeech: "noun", category: "daily life", exampleSentence: "I enjoy shopping.", exampleTranslation: "ฉันชอบการซื้อของ", cefrLevel: LevelCode.A2 },
  ];

  for (const v of vocabData) {
    const level = v.cefrLevel === LevelCode.PRE_A1 ? preA1 : v.cefrLevel === LevelCode.A1 ? a1 : a2;
    await db.vocabularyItem.upsert({
      where: { id: `vocab-${v.word}` },
      update: { pronunciationTh: v.pronunciationTh },
      create: { id: `vocab-${v.word}`, levelId: level.id, ...v },
    });
  }

  // ── PRE-A1 COURSE ─────────────────────────────────────────────────────────
  const preA1Course = await db.course.upsert({
    where: { id: "course-pre-a1-foundations" },
    update: {},
    create: {
      id: "course-pre-a1-foundations",
      levelId: preA1.id,
      nameTh: "รากฐานภาษาอังกฤษ",
      nameEn: "English Foundations",
      descriptionTh: "เรียนตัวอักษร เสียง ตัวเลข สี และคำศัพท์พื้นฐาน",
      orderNum: 1,
      isPublished: true,
    },
  });

  // Unit 1: Alphabet
  const unit1 = await db.unit.upsert({
    where: { id: "unit-pre-a1-alphabet" },
    update: {},
    create: {
      id: "unit-pre-a1-alphabet",
      courseId: preA1Course.id,
      nameTh: "ตัวอักษร A–Z",
      nameEn: "The Alphabet A–Z",
      descriptionTh: "เรียนรู้ตัวอักษรภาษาอังกฤษทั้ง 26 ตัว",
      orderNum: 1,
      isPublished: true,
    },
  });

  // Lesson 1.1 inside unit1
  const lesson1 = await db.lesson.upsert({
    where: { id: "lesson-pre-a1-alphabet-overview" },
    update: {},
    create: {
      id: "lesson-pre-a1-alphabet-overview",
      unitId: unit1.id,
      nameTh: "ตัวอักษร A–Z คืออะไร?",
      nameEn: "What is the Alphabet?",
      skillType: SkillType.VOCABULARY,
      orderNum: 1,
      durationMinutes: 10,
      isPublished: true,
    },
  });

  await db.lessonContent.upsert({
    where: { id: "lc-pre-a1-alphabet-text1" },
    update: {},
    create: {
      id: "lc-pre-a1-alphabet-text1",
      lessonId: lesson1.id,
      contentType: ContentType.TEXT,
      orderNum: 1,
      data: {
        title: "ตัวอักษรภาษาอังกฤษ",
        body: "ภาษาอังกฤษมีตัวอักษรทั้งหมด **26 ตัว** แบ่งเป็นตัวพิมพ์ใหญ่ (Uppercase) และตัวพิมพ์เล็ก (Lowercase)\n\nA B C D E F G H I J K L M N O P Q R S T U V W X Y Z",
      },
    },
  });

  await db.lessonContent.upsert({
    where: { id: "lc-pre-a1-alphabet-flashcard1" },
    update: {},
    create: {
      id: "lc-pre-a1-alphabet-flashcard1",
      lessonId: lesson1.id,
      contentType: ContentType.FLASHCARD,
      orderNum: 2,
      data: {
        cards: [
          { front: "A a", back: "เอ — apple (แอปเปิ้ล)", exampleWord: "Apple" },
          { front: "B b", back: "บี — book (หนังสือ)", exampleWord: "Book" },
          { front: "C c", back: "ซี — cat (แมว)", exampleWord: "Cat" },
          { front: "D d", back: "ดี — dog (สุนัข)", exampleWord: "Dog" },
          { front: "E e", back: "อี — egg (ไข่)", exampleWord: "Egg" },
          { front: "F f", back: "เอฟ — fish (ปลา)", exampleWord: "Fish" },
          { front: "G g", back: "จี — girl (เด็กผู้หญิง)", exampleWord: "Girl" },
          { front: "H h", back: "เอช — house (บ้าน)", exampleWord: "House" },
        ],
      },
    },
  });

  // Lesson 1.2
  const lesson2 = await db.lesson.upsert({
    where: { id: "lesson-pre-a1-vowels" },
    update: {},
    create: {
      id: "lesson-pre-a1-vowels",
      unitId: unit1.id,
      nameTh: "สระ (Vowels) A E I O U",
      nameEn: "Vowels: A E I O U",
      skillType: SkillType.VOCABULARY,
      orderNum: 2,
      durationMinutes: 10,
      isPublished: true,
    },
  });

  await db.lessonContent.upsert({
    where: { id: "lc-pre-a1-vowels-text" },
    update: {},
    create: {
      id: "lc-pre-a1-vowels-text",
      lessonId: lesson2.id,
      contentType: ContentType.TEXT,
      orderNum: 1,
      data: {
        title: "สระในภาษาอังกฤษ",
        body: "ตัวอักษร 5 ตัวที่เรียกว่า **สระ (Vowels)** คือ\n\n**A E I O U**\n\nตัวอักษรที่เหลืออีก 21 ตัว เรียกว่า **พยัญชนะ (Consonants)**",
      },
    },
  });

  // Unit 2: Numbers & Colors
  const unit2 = await db.unit.upsert({
    where: { id: "unit-pre-a1-numbers-colors" },
    update: {},
    create: {
      id: "unit-pre-a1-numbers-colors",
      courseId: preA1Course.id,
      nameTh: "ตัวเลขและสี",
      nameEn: "Numbers and Colors",
      orderNum: 2,
      isPublished: true,
    },
  });

  const lesson3 = await db.lesson.upsert({
    where: { id: "lesson-pre-a1-numbers-1-10" },
    update: {},
    create: {
      id: "lesson-pre-a1-numbers-1-10",
      unitId: unit2.id,
      nameTh: "ตัวเลข 1–10",
      nameEn: "Numbers 1 to 10",
      skillType: SkillType.VOCABULARY,
      orderNum: 1,
      durationMinutes: 10,
      isPublished: true,
    },
  });

  const numbersCards = {
    cards: [
      { front: "1", back: "one — หนึ่ง", pronunciation: "วัน" },
      { front: "2", back: "two — สอง", pronunciation: "ทู" },
      { front: "3", back: "three — สาม", pronunciation: "ธรี" },
      { front: "4", back: "four — สี่", pronunciation: "โฟร์" },
      { front: "5", back: "five — ห้า", pronunciation: "ไฟฟ์" },
      { front: "6", back: "six — หก", pronunciation: "ซิกส์" },
      { front: "7", back: "seven — เจ็ด", pronunciation: "เซเวน" },
      { front: "8", back: "eight — แปด", pronunciation: "เอท" },
      { front: "9", back: "nine — เก้า", pronunciation: "ไนน์" },
      { front: "10", back: "ten — สิบ", pronunciation: "เทน" },
    ],
  };
  await db.lessonContent.upsert({
    where: { id: "lc-pre-a1-numbers-flashcard" },
    update: { data: numbersCards },
    create: {
      id: "lc-pre-a1-numbers-flashcard",
      lessonId: lesson3.id,
      contentType: ContentType.FLASHCARD,
      orderNum: 1,
      data: numbersCards,
    },
  });

  // ── A1 COURSE ─────────────────────────────────────────────────────────────
  const a1Course = await db.course.upsert({
    where: { id: "course-a1-daily-conversation" },
    update: {},
    create: {
      id: "course-a1-daily-conversation",
      levelId: a1.id,
      nameTh: "สนทนาพื้นฐาน",
      nameEn: "Daily Conversation Basics",
      descriptionTh: "เรียนรู้ประโยคพื้นฐานสำหรับการสนทนาในชีวิตประจำวัน",
      orderNum: 1,
      isPublished: true,
    },
  });

  const a1Unit1 = await db.unit.upsert({
    where: { id: "unit-a1-introducing-yourself" },
    update: {},
    create: {
      id: "unit-a1-introducing-yourself",
      courseId: a1Course.id,
      nameTh: "การแนะนำตัวเอง",
      nameEn: "Introducing Yourself",
      orderNum: 1,
      isPublished: true,
    },
  });

  const a1Lesson1 = await db.lesson.upsert({
    where: { id: "lesson-a1-my-name-is" },
    update: {},
    create: {
      id: "lesson-a1-my-name-is",
      unitId: a1Unit1.id,
      nameTh: "ฉันชื่อ...",
      nameEn: "My Name Is...",
      skillType: SkillType.VOCABULARY,
      orderNum: 1,
      durationMinutes: 10,
      isPublished: true,
    },
  });

  await db.lessonContent.upsert({
    where: { id: "lc-a1-my-name-text" },
    update: {},
    create: {
      id: "lc-a1-my-name-text",
      lessonId: a1Lesson1.id,
      contentType: ContentType.TEXT,
      orderNum: 1,
      data: {
        title: "การแนะนำตัวเอง",
        body: "เมื่อเราต้องการแนะนำตัวเองในภาษาอังกฤษ เราใช้ประโยคเหล่านี้",
      },
    },
  });

  await db.lessonContent.upsert({
    where: { id: "lc-a1-my-name-conversation" },
    update: {},
    create: {
      id: "lc-a1-my-name-conversation",
      lessonId: a1Lesson1.id,
      contentType: ContentType.CONVERSATION,
      orderNum: 2,
      data: {
        lines: [
          { speaker: "Tom", text: "Hello! My name is Tom.", translationTh: "สวัสดี! ฉันชื่อทอม" },
          { speaker: "Amy", text: "Hi Tom! I'm Amy. Nice to meet you.", translationTh: "สวัสดีทอม! ฉันชื่อเอมี่ ยินดีที่ได้รู้จัก" },
          { speaker: "Tom", text: "Nice to meet you too!", translationTh: "ยินดีที่ได้รู้จักเช่นกัน!" },
        ],
      },
    },
  });

  await db.lessonContent.upsert({
    where: { id: "lc-a1-my-name-exercise" },
    update: {},
    create: {
      id: "lc-a1-my-name-exercise",
      lessonId: a1Lesson1.id,
      contentType: ContentType.EXERCISE,
      orderNum: 3,
      data: {
        type: "fill_blank",
        instruction: "เติมคำในช่องว่างให้ถูกต้อง",
        questions: [
          { sentence: "_____ name is Maria.", answer: "My", hint: "สรรพนามแสดงความเป็นเจ้าของ" },
          { sentence: "Hi! I _____ Sarah.", answer: "am", hint: "Verb to be" },
          { sentence: "Nice to _____ you.", answer: "meet", hint: "กริยาที่แปลว่า 'พบ'" },
        ],
      },
    },
  });

  // ── ACHIEVEMENTS ──────────────────────────────────────────────────────────
  const achievements = [
    { code: "STREAK_3", nameTh: "เรียนต่อเนื่อง 3 วัน", descriptionTh: "เรียนภาษาอังกฤษติดต่อกัน 3 วัน", requirementType: "streak", requirementValue: 3 },
    { code: "STREAK_7", nameTh: "เรียนต่อเนื่อง 1 สัปดาห์", descriptionTh: "เรียนภาษาอังกฤษติดต่อกัน 7 วัน", requirementType: "streak", requirementValue: 7 },
    { code: "STREAK_30", nameTh: "เรียนต่อเนื่อง 1 เดือน", descriptionTh: "เรียนภาษาอังกฤษติดต่อกัน 30 วัน", requirementType: "streak", requirementValue: 30 },
    { code: "STREAK_100", nameTh: "เรียนต่อเนื่อง 100 วัน", descriptionTh: "เรียนภาษาอังกฤษติดต่อกัน 100 วัน", requirementType: "streak", requirementValue: 100 },
    { code: "VOCAB_50", nameTh: "นักสะสมคำศัพท์", descriptionTh: "เรียนคำศัพท์ครบ 50 คำ", requirementType: "vocab", requirementValue: 50 },
    { code: "VOCAB_200", nameTh: "คลังคำศัพท์", descriptionTh: "เรียนคำศัพท์ครบ 200 คำ", requirementType: "vocab", requirementValue: 200 },
    { code: "LESSON_10", nameTh: "ผู้เรียนตัวยง", descriptionTh: "เรียนบทเรียนครบ 10 บท", requirementType: "lesson", requirementValue: 10 },
    { code: "FIRST_TEST", nameTh: "ทดสอบครั้งแรก", descriptionTh: "ทำแบบทดสอบครั้งแรก", requirementType: "test", requirementValue: 1 },
  ];

  for (const a of achievements) {
    await db.achievement.upsert({
      where: { code: a.code },
      update: {},
      create: a,
    });
  }

  console.log("✅ Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
