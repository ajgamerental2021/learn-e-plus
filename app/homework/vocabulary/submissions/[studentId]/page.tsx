import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import DailyVocabularySubmissionActions from "@/components/homework/DailyVocabularySubmissionActions";

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "ยังไม่เริ่ม",
  IN_PROGRESS: "กำลังทำ",
  SUBMITTED: "ส่งแล้ว",
  UNDER_REVIEW: "รอตรวจ",
  NEEDS_REVISION: "ต้องแก้ไข",
  COMPLETED: "เสร็จแล้ว",
  LATE: "เกินกำหนด",
  MISSED: "ไม่ได้ส่ง",
};

export default async function DailyVocabularySubmissionsPage({ params }: { params: Promise<{ studentId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { studentId } = await params;
  const role = (session.user as { role?: string }).role;
  const isStaff = role === "ADMIN" || role === "TEACHER";
  const isOwnPage = session.user.id === studentId;
  const guardianLink = role === "PARENT"
    ? await db.guardianStudent.findUnique({
        where: { guardianId_studentId: { guardianId: session.user.id, studentId } },
        select: { id: true },
      })
    : null;

  if (!isStaff && !guardianLink && !isOwnPage) notFound();

  const student = await db.user.findUnique({
    where: { id: studentId },
    include: { profile: { include: { currentLevel: { select: { nameTh: true } } } } },
  });
  if (!student) notFound();

  const submissions = await db.dailyVocabularyAssignment.findMany({
    where: { userId: studentId, submittedAt: { not: null } },
    orderBy: { submittedAt: "desc" },
    take: 180,
    include: {
      reactions: {
        select: {
          userId: true,
          emoji: true,
        },
      },
      vocabulary: {
        select: {
          word: true,
          translationTh: true,
          pronunciationTh: true,
          exampleSentence: true,
          exampleTranslation: true,
          cefrLevel: true,
        },
      },
    },
  });

  const backHref = isStaff ? "/admin/homework" : role === "PARENT" ? "/dashboard" : "/homework/vocabulary";
  const displayName = student.profile?.displayName ?? student.username ?? student.email;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={backHref} className="text-sm text-gray-400 hover:text-gray-700">← กลับ</Link>
          <h1 className="mt-2 text-xl font-bold text-gray-900">ประวัติการบ้านท่องศัพท์</h1>
          <p className="mt-1 text-sm text-gray-500">
            {displayName} · {student.profile?.currentLevel?.nameTh ?? "ยังไม่ได้กำหนดระดับ"}
          </p>
        </div>
        <div className="rounded-xl border bg-white px-4 py-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{submissions.length}</p>
          <p className="text-xs text-gray-500">งานที่ส่งแล้ว</p>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center">
          <p className="font-semibold text-gray-800">ยังไม่มีประวัติการส่ง</p>
          <p className="mt-1 text-sm text-gray-500">เมื่อนักเรียนส่งการบ้านท่องศัพท์ รายการจะขึ้นที่นี่</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((item) => (
            <article key={item.id} className="rounded-xl border bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{item.vocabulary.cefrLevel}</p>
                  <h2 className="mt-1 text-2xl font-bold text-gray-900">{item.vocabulary.word}</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {item.vocabulary.pronunciationTh ?? "ยังไม่มีคำอ่านไทย"} · {item.vocabulary.translationTh}
                  </p>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                  {STATUS_LABEL[item.status] ?? item.status}
                </span>
              </div>

              {item.vocabulary.exampleSentence && (
                <div className="mt-4 rounded-lg border bg-gray-50 p-3">
                  <p className="text-sm font-semibold text-gray-800">{item.vocabulary.exampleSentence}</p>
                  <p className="mt-1 text-sm text-gray-500">{item.vocabulary.exampleTranslation}</p>
                </div>
              )}

              <DailyVocabularySubmissionActions
                assignmentId={item.id}
                word={item.vocabulary.word}
                initialReaction={item.reactions.find((reaction) => reaction.userId === session.user.id)?.emoji ?? null}
                initialCounts={Object.entries(item.reactions.reduce<Record<string, number>>((counts, reaction) => {
                  counts[reaction.emoji] = (counts[reaction.emoji] ?? 0) + 1;
                  return counts;
                }, {})).map(([emoji, count]) => ({ emoji, count }))}
              />

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs font-medium text-gray-500">คำที่พูด</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{item.spokenText || "-"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs font-medium text-gray-500">พิมพ์สะกดคำ</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{item.spellingText || "-"}</p>
                </div>
              </div>

              {item.audioDataUrl ? (
                <div className="mt-4 rounded-lg border-2 border-blue-100 bg-blue-50 p-3">
                  <p className="mb-2 text-sm font-semibold text-blue-900">เสียงที่ส่ง</p>
                  <audio controls src={item.audioDataUrl} className="w-full rounded-md bg-white" />
                </div>
              ) : (
                <p className="mt-4 rounded-lg border bg-gray-50 p-3 text-sm text-gray-400">ไม่มีไฟล์เสียงแนบมา</p>
              )}

              <p className="mt-3 text-xs text-gray-400">
                ส่งเมื่อ {item.submittedAt ? new Date(item.submittedAt).toLocaleString("th-TH", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }) : "-"}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
