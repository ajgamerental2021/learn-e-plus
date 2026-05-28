import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Expected CSV columns: word,translationTh,partOfSpeech,exampleSentence,exampleTranslation,levelCode,category,audioUrl
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const text = await file.text();
  const lines = text.trim().split("\n");
  if (lines.length < 2) return NextResponse.json({ error: "Empty CSV" }, { status: 400 });

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const requiredCols = ["word", "translationth"];
  for (const col of requiredCols) {
    if (!headers.includes(col)) {
      return NextResponse.json({ error: `Missing column: ${col}` }, { status: 400 });
    }
  }

  const col = (row: string[], name: string) => {
    const i = headers.indexOf(name);
    return i >= 0 ? row[i]?.trim() ?? "" : "";
  };

  // Cache level lookups
  const levelCache = new Map<string, string>();
  const getLevel = async (code: string) => {
    if (!code) return null;
    if (levelCache.has(code)) return levelCache.get(code)!;
    const level = await db.level.findFirst({ where: { code: code as never } });
    if (level) levelCache.set(code, level.id);
    return level?.id ?? null;
  };

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(",");
    const word = col(row, "word");
    const translationTh = col(row, "translationth");
    if (!word || !translationTh) { skipped++; continue; }

    const levelCode = col(row, "levelcode") || "A1";
    const levelId = await getLevel(levelCode);

    if (!levelId) { skipped++; continue; }

    try {
      const existing = await db.vocabularyItem.findFirst({ where: { word, levelId }, select: { id: true } });
      if (existing) {
        await db.vocabularyItem.update({
          where: { id: existing.id },
          data: { translationTh },
        });
      } else {
        await db.vocabularyItem.create({
          data: {
            word,
            translationTh,
            partOfSpeech: col(row, "partofspeech") || "noun",
            exampleSentence: col(row, "examplesentence") || undefined,
            exampleTranslation: col(row, "exampletranslation") || undefined,
            levelId,
            cefrLevel: levelCode as never,
            category: col(row, "category") || undefined,
            audioUrl: col(row, "audiourl") || undefined,
            isActive: true,
          },
        });
      }
      created++;
    } catch (e) {
      errors.push(`Row ${i + 1}: ${String(e)}`);
    }
  }

  return NextResponse.json({ created, skipped, errors: errors.slice(0, 10) });
}
