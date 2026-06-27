import { db } from "@/lib/db";
import { connection } from "next/server";

export default async function AdminContentPage() {
  await connection();

  const [courses, lessons, vocab, levels] = await Promise.all([
    db.course.findMany({
      include: {
        level: { select: { code: true } },
        _count: { select: { units: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.lesson.count({ where: { isPublished: true } }),
    db.vocabularyItem.groupBy({
      by: ["levelId"],
      _count: true,
      where: { isActive: true },
    }),
    db.level.findMany({ orderBy: { orderNum: "asc" }, select: { id: true, code: true, nameTh: true } }),
  ]);

  const vocabByLevel = Object.fromEntries(vocab.map((v) => [v.levelId, v._count]));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Content Management</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{courses.length}</p>
          <p className="text-xs text-gray-400 mt-1">Courses</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{lessons}</p>
          <p className="text-xs text-gray-400 mt-1">Active Lessons</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{vocab.reduce((s, v) => s + v._count, 0)}</p>
          <p className="text-xs text-gray-400 mt-1">Vocabulary Items</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-700">Courses</h2>
        </div>
        <div className="divide-y">
          {courses.map((c) => (
            <div key={c.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">{c.nameTh}</p>
                <p className="text-xs text-gray-400">{c.level?.code} · {c._count.units} units</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${c.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {c.isPublished ? "Published" : "Draft"}
              </span>
            </div>
          ))}
          {courses.length === 0 && (
            <p className="px-5 py-6 text-sm text-gray-400 text-center">No courses yet</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-700">Vocabulary by Level</h2>
        </div>
        <div className="divide-y">
          {levels.map((l) => (
            <div key={l.id} className="px-5 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-700">{l.nameTh} ({l.code})</span>
              <span className="text-sm font-medium text-gray-800">{vocabByLevel[l.id] ?? 0} words</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
