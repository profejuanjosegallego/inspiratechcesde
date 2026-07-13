import { getDb } from "@/lib/mongodb";
import { handler, json, serialize, requireUser, requireTeacher } from "@/lib/api";

export const GET = handler(async () => {
  await requireUser();
  const db = await getDb();
  const courses = await db.collection("courses").find().sort({ order: 1 }).toArray();
  return json({ courses: serialize(courses) });
});

export const POST = handler(async (req) => {
  await requireTeacher();
  const body = await req.json();
  if (!body.title) return json({ error: "Falta el título." }, 400);
  const db = await getDb();
  const count = await db.collection("courses").countDocuments();
  const course = {
    title: String(body.title),
    platform: body.platform || "Platzi",
    order: body.order !== undefined ? Number(body.order) : count + 1,
    xp: body.xp !== undefined ? Number(body.xp) : 100,
    createdAt: new Date(),
  };
  const res = await db.collection("courses").insertOne(course);
  return json({ ok: true, id: res.insertedId.toString() });
});
