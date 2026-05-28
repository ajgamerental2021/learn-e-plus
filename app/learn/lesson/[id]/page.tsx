import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LessonPlayer from "@/components/lesson/LessonPlayer";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { id } = await params;
  return <LessonPlayer lessonId={id} />;
}
