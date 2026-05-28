import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ContentImporter from "@/components/admin/ContentImporter";

export default async function ImportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  if (session.user.role !== "ADMIN") redirect("/admin");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/content" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-800">Import Content</h1>
      </div>
      <ContentImporter />
    </div>
  );
}
