"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import ContentRenderer from "./ContentRenderer";

interface LessonData {
  id: string;
  nameTh: string;
  nameEn: string;
  skillType: string;
  durationMinutes: number;
  contents: Array<{ id: string; contentType: string; data: Record<string, unknown>; orderNum: number }>;
  unit: {
    nameTh: string;
    course: { nameTh: string; id: string };
  };
  prevLesson: { id: string; nameTh: string } | null;
  nextLesson: { id: string; nameTh: string } | null;
  progress: Array<{ status: string }>;
}

const SKILL_LABEL: Record<string, string> = {
  VOCABULARY: "คำศัพท์",
  GRAMMAR: "ไวยากรณ์",
  LISTENING: "การฟัง",
  READING: "การอ่าน",
  WRITING: "การเขียน",
  SPEAKING: "การพูด",
};

const SKILL_COLOR: Record<string, string> = {
  VOCABULARY: "bg-purple-100 text-purple-700",
  GRAMMAR: "bg-blue-100 text-blue-700",
  LISTENING: "bg-orange-100 text-orange-700",
  READING: "bg-green-100 text-green-700",
  WRITING: "bg-pink-100 text-pink-700",
  SPEAKING: "bg-yellow-100 text-yellow-700",
};

export default function LessonPlayer({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    fetch(`/api/lessons/${lessonId}`)
      .then((r) => r.json())
      .then((d) => {
        setLesson(d);
        setCompleted(d.progress?.[0]?.status === "COMPLETED");
        setLoading(false);
      });
  }, [lessonId]);

  async function completeLesson() {
    if (!lesson) return;
    setCompleting(true);
    const timeSpentSecs = Math.round((Date.now() - startTimeRef.current) / 1000);

    await fetch(`/api/lessons/${lessonId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeSpentSecs }),
    });

    setCompleted(true);
    setCompleting(false);
  }

  function goNext() {
    if (lesson?.nextLesson) {
      router.push(`/learn/${lesson.unit.course.id}/${lesson.id.split("-")[0]}/placeholder`);
      // Use the actual next lesson URL
      router.push(`/learn/lesson/${lesson.nextLesson.id}`);
    } else {
      router.push(`/learn/${lesson?.unit.course.id}`);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">กำลังโหลดบทเรียน...</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">ไม่พบบทเรียน</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href={`/learn/${lesson.unit.course.id}`} className="text-gray-400 hover:text-gray-600">
              ←
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 truncate">{lesson.unit.course.nameTh} › {lesson.unit.nameTh}</p>
              <p className="text-sm font-semibold text-gray-800 truncate">{lesson.nameTh}</p>
            </div>
            <Badge className={SKILL_COLOR[lesson.skillType]}>
              {SKILL_LABEL[lesson.skillType]}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {lesson.contents.map((block) => (
          <ContentRenderer key={block.id} block={block} />
        ))}

        {/* Completion section */}
        <div className="bg-white rounded-xl border p-6 text-center">
          {completed ? (
            <div className="space-y-4">
              <div className="text-4xl">🎉</div>
              <p className="font-semibold text-green-700">เรียนจบบทนี้แล้ว!</p>
              <div className="flex gap-3">
                {lesson.prevLesson && (
                  <LinkButton href={`/learn/lesson/${lesson.prevLesson.id}`} variant="outline" className="flex-1 justify-center">← ก่อนหน้า</LinkButton>
                )}
                {lesson.nextLesson ? (
                  <LinkButton href={`/learn/lesson/${lesson.nextLesson.id}`} className="flex-1 justify-center">บทถัดไป →</LinkButton>
                ) : (
                  <LinkButton href={`/learn/${lesson.unit.course.id}`} className="flex-1 justify-center">กลับหน้า Course</LinkButton>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-500 text-sm">เรียนเนื้อหาครบแล้วใช่ไหม?</p>
              <Button
                onClick={completeLesson}
                disabled={completing}
                className="w-full"
                size="lg"
              >
                {completing ? "กำลังบันทึก..." : "เรียนจบบทนี้แล้ว ✓"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
