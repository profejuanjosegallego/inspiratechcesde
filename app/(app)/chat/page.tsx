import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ensureSeed } from "@/lib/db-init";
import { serialize } from "@/lib/api";
import type { ChatMessage } from "@/lib/client-types";
import ChatClient from "@/components/chat/ChatClient";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  await ensureSeed();
  const user = (await getSession())!;
  const db = await getDb();

  const docs = await db
    .collection("messages")
    .find()
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  const messages = serialize<ChatMessage[]>(docs.reverse());

  return (
    <ChatClient
      initialMessages={messages}
      currentUserId={user.id}
      isTeacher={user.role === "profesor"}
    />
  );
}
