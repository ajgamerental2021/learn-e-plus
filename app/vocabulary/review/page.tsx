import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import VocabReview from "@/components/vocabulary/VocabReview";
import Link from "next/link";

export default async function VocabReviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/vocabulary" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-lg font-bold text-gray-800">ทบทวนคำศัพท์</h1>
      </div>
      <VocabReview />
    </div>
  );
}
