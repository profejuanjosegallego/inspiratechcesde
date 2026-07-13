import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { handler, json, fail, serialize, requireUser } from "@/lib/api";

// Listar mensajes. Con ?since=ISO trae solo los nuevos (para el sondeo).
export const GET = handler(async (req) => {
  await requireUser();
  const url = new URL(req.url);
  const since = url.searchParams.get("since");
  const db = await getDb();

  const query = since ? { createdAt: { $gt: new Date(since) } } : {};
  const docs = await db
    .collection("messages")
    .find(query)
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  return json({ messages: serialize(docs.reverse()) });
});

// Enviar un mensaje al chat grupal.
export const POST = handler(async (req) => {
  const user = await requireUser();
  const { text } = await req.json();
  const clean = String(text || "").trim();
  if (!clean) return fail("El mensaje está vacío.");
  if (clean.length > 2000) return fail("El mensaje es demasiado largo.");

  const db = await getDb();
  const doc = {
    userId: new ObjectId(user.id),
    name: user.name,
    avatar: user.avatar,
    role: user.role,
    text: clean,
    createdAt: new Date(),
  };
  const res = await db.collection("messages").insertOne(doc);
  return json({ ok: true, message: serialize({ ...doc, _id: res.insertedId }) });
});
