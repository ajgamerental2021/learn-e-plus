import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { alphabetLetters, alphabetSpeechText } from "@/lib/alphabet-data";
import SpeakButton from "@/components/alphabet/SpeakButton";

export default async function AlphabetChartPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-5">
      <section className="rounded-xl border bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-blue-600">Starter</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">ท่อง A-Z</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              Chart ตัวอักษรอังกฤษ A-Z พร้อมคำอ่านไทยและคำศัพท์ตัวอย่าง กดตัวอักษรเพื่อเข้าไปฝึกคำศัพท์ของตัวนั้นเพิ่มเติม
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SpeakButton text={alphabetSpeechText} label="ฟัง A-Z" slow />
            <SpeakButton
              text={alphabetLetters.map((item) => item.pronunciationTh).join(" ... ")}
              label="A-Z แบบไทย"
              lang="th-TH"
              slow
              className="bg-emerald-600 hover:bg-emerald-700"
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {alphabetLetters.map((item) => (
          <Link
            key={item.letter}
            href={`/alphabet/${item.letter}`}
            className="group rounded-xl border bg-white p-4 transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-4xl font-black text-gray-900">
                  {item.letter} <span className="text-2xl text-gray-400">{item.lower}</span>
                </p>
                <p className="mt-1 text-sm font-semibold text-blue-700">{item.pronunciationTh}</p>
                <p className="text-xs text-gray-400">เสียงเริ่มต้น: {item.soundHint}</p>
              </div>
              <span className="text-3xl">{item.starterWord.icon}</span>
            </div>
            <div className="mt-4 rounded-lg bg-gray-50 p-3 group-hover:bg-white">
              <p className="text-sm font-semibold text-gray-800">{item.starterWord.word}</p>
              <p className="text-xs text-gray-500">{item.starterWord.pronunciationTh} · {item.starterWord.translationTh}</p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
