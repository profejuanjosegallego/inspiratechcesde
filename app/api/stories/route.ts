import { getDb } from "@/lib/mongodb";
import { handler, json, serialize, requireUser, requireTeacher } from "@/lib/api";
import type { StoryDoc } from "@/lib/types";

// Listar todas las historias
export const GET = handler(async () => {
  await requireUser();
  const db = await getDb();
  const stories = await db
    .collection<StoryDoc>("stories")
    .find()
    .sort({ order: 1, week: 1 })
    .toArray();
  return json({ stories: serialize(stories) });
});

// Crear una nueva historia (solo profe)
export const POST = handler(async (req) => {
  await requireTeacher();
  const body = await req.json();
  const db = await getDb();
  const now = new Date();

  const count = await db.collection("stories").countDocuments();
  const story: StoryDoc = {
    week: Number(body.week) || count + 1,
    order: count,
    title: body.title || "Nueva historia",
    role: body.role || "Como usuario",
    description: body.description || "",
    code: body.code || "",
    codeLang: body.codeLang || "text",
    estimation: Number(body.estimation) || 3,
    status: "todo",
    acceptanceCriteria: Array.isArray(body.acceptanceCriteria)
      ? body.acceptanceCriteria
      : [],
    tutorial: body.tutorial || "",
    tags: Array.isArray(body.tags) ? body.tags : [],
    createdAt: now,
    updatedAt: now,
  };
  const res = await db.collection<StoryDoc>("stories").insertOne(story);
  return json({ ok: true, id: res.insertedId.toString() });
});
