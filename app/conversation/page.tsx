import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LearnerNav from "@/components/layout/LearnerNav";
import ConversationChat from "@/components/conversation/ConversationChat";

export default async function ConversationPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <LearnerNav />
      <main className="pb-20 md:pb-0 md:pl-56">
        <div className="max-w-2xl mx-auto px-4 py-6 h-[calc(100vh-5rem)] md:h-screen flex flex-col">
          <h1 className="text-xl font-bold text-gray-800 mb-4 shrink-0">สนทนากับ AI Tutor</h1>
          <ConversationChat />
        </div>
      </main>
    </div>
  );
}
