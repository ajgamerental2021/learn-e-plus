import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { alphabetLetters, getAlphabetLetter } from "@/lib/alphabet-data";
import SpeakButton from "@/components/alphabet/SpeakButton";
import { englishSpellingSpeech, thaiReadingSpeech, thaiSpelling, thaiSpellingSpeech } from "@/lib/thai-phonetics";

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
            <SpeakButton text={item.speechText} label={`ฟัง ${item.letter}`} />
            <SpeakButton text={item.speechText} label="ช้าๆ" slow className="bg-blue-500 hover:bg-blue-600" />
            <SpeakButton
              text={item.pronunciationTh}
              label="คำอ่านไทย"
              lang="th-TH"
              slow
              className="bg-emerald-600 hover:bg-emerald-700"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {item.words.map((entry) => (
          <article key={entry.word} className="rounded-xl border bg-white p-5">
            <div className="flex items-start gap-3">
              <span className="text-4xl">{entry.icon}</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{entry.word}</h2>
                <p className="mt-1 text-lg font-semibold text-blue-700">{entry.pronunciationTh}</p>
                <p className="text-sm text-gray-500">{entry.translationTh}</p>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
              <p className="text-xs font-medium text-indigo-700">สะกดทีละตัว</p>
              <p className="mt-1 font-semibold tracking-wide text-indigo-950">{thaiSpelling(entry.word)}</p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <SpeakButton text={entry.word} label="อังกฤษ" />
              <SpeakButton text={entry.word} label="ช้าๆ" slow className="bg-blue-500 hover:bg-blue-600" />
              <SpeakButton
                text={thaiReadingSpeech(entry.pronunciationTh)}
                label="คำอ่านไทย"
                lang="th-TH"
                slow
                className="bg-emerald-600 hover:bg-emerald-700"
              />
              <SpeakButton
                text={englishSpellingSpeech(entry.word)}
                label="สะกด"
                slow
                className="bg-indigo-600 hover:bg-indigo-700"
              />
              <SpeakButton
                text={thaiSpellingSpeech(entry.word)}
                label="สะกดไทย"
                lang="th-TH"
                slow
                className="bg-emerald-700 hover:bg-emerald-800"
              />
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
