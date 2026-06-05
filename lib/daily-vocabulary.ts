import { LevelCode } from "@prisma/client";
import { db } from "@/lib/db";

const LEVEL_ORDER: Record<LevelCode, number> = {
  PRE_A1: 1,
  A1: 2,
  A2: 3,
  B1: 4,
  B2: 5,
  C1: 6,
  C2: 7,
};

export function bangkokDateOnly(input = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return new Date(`${formatter.format(input)}T00:00:00.000Z`);
}

export async function getOrCreateDailyVocabulary(userId: string, date = bangkokDateOnly()) {
  const existing = await db.dailyVocabularyAssignment.findUnique({
    where: { userId_assignedDate: { userId, assignedDate: date } },
    include: { vocabulary: { include: { level: { select: { code: true, nameTh: true } } } } },
  });
  if (existing) return existing;

  const used = await db.dailyVocabularyAssignment.findMany({
    where: { userId },
    select: { vocabularyId: true },
  });
  const usedIds = used.map((item) => item.vocabularyId);

  const candidates = await db.vocabularyItem.findMany({
    where: {
      isActive: true,
      id: { notIn: usedIds },
      word: { not: "" },
    },
    take: 400,
    include: { level: { select: { code: true, nameTh: true } } },
  });

  if (candidates.length === 0) return null;

  const sorted = candidates.sort((a, b) => {
    const levelDiff = LEVEL_ORDER[a.cefrLevel] - LEVEL_ORDER[b.cefrLevel];
    if (levelDiff !== 0) return levelDiff;
    const lengthDiff = cleanWord(a.word).length - cleanWord(b.word).length;
    if (lengthDiff !== 0) return lengthDiff;
    return a.word.localeCompare(b.word);
  });

  const easiestLevel = sorted[0].cefrLevel;
  const easiestLength = cleanWord(sorted[0].word).length;
  const pool = sorted
    .filter((item) => item.cefrLevel === easiestLevel && cleanWord(item.word).length <= easiestLength + 2)
    .slice(0, 26);
  const vocabulary = pool[Math.floor(Math.random() * pool.length)] ?? sorted[0];

  return db.dailyVocabularyAssignment.create({
    data: {
      userId,
      vocabularyId: vocabulary.id,
      assignedDate: date,
      promptData: {
        word: vocabulary.word,
        pronunciationTh: vocabulary.pronunciationTh,
        translationTh: vocabulary.translationTh,
        exampleSentence: vocabulary.exampleSentence,
        exampleTranslation: vocabulary.exampleTranslation,
        cefrLevel: vocabulary.cefrLevel,
      },
    },
    include: { vocabulary: { include: { level: { select: { code: true, nameTh: true } } } } },
  });
}

function cleanWord(word: string) {
  return word.replace(/[^a-zA-Z]/g, "");
}
