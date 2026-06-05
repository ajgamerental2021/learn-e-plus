import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { alphabetLetters, getAlphabetLetter } from "@/lib/alphabet-data";
import SpeakButton from "@/components/alphabet/SpeakButton";

export default async function AlphabetLetterPage({ params }: { params: Promise<{ letter: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { letter } = await params;
  const item = getAlphabetLetter(letter);
  if (!item) notFound();

  const currentIndex = alphabetLetters.findIndex((entry) => entry.letter === item.letter);
  const previous = alphabetLetters[currentIndex - 1];
  const next = alphabetLetters[currentIndex + 1];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/alphabet" className="text-sm text-gray-400 hover:text-gray-700">← กลับ Chart A-Z</Link>
        <div className="flex gap-2">
          {previous && <Link href={`/alphabet/${previous.letter}`} className="rounded-lg border bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">{previous.letter}</Link>}
          {next && <Link href={`/alphabet/${next.letter}`} className="rounded-lg border bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">{next.letter}</Link>}
        </div>
      </div>

      <section className="rounded-xl border bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-blue-600">ตัวอักษร</p>
            <h1 className="mt-1 text-7xl font-black text-gray-900">
              {item.letter} <span className="text-5xl text-gray-400">{item.lower}</span>
            </h1>
            <p className="mt-3 text-lg font-semibold text-blue-700">{item.pronunciationTh}</p>
            <p className="text-sm text-gray-500">เสียงเริ่มต้นโดยประมาณ: {item.soundHint}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SpeakButton text={item.letter} label={`ฟัง ${item.letter}`} />
            <SpeakButton text={item.words.map((word) => word.word).join(". ")} label="ฟังคำศัพท์" />
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        {item.words.map((entry) => (
          <article key={entry.word} className="rounded-xl border bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="text-4xl">{entry.icon}</span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{entry.word}</h2>
                  <p className="mt-1 text-sm text-gray-500">{entry.pronunciationTh} · {entry.translationTh}</p>
                </div>
              </div>
              <SpeakButton text={entry.word} />
            </div>
            <div className="mt-4 rounded-lg border bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-950">{entry.example}</p>
              <p className="mt-1 text-sm text-blue-700">{entry.exampleTh}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
