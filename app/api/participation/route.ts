import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { handler, json, fail, requireTeacher } from "@/lib/api";
import { todayInBogota } from "@/lib/date";

// Otorgar puntos de participación a un estudiante (profe). Pueden ser varias por sesión.
export const POST = handler(async (req) => {
  const teacher = await requireTeacher();
  const { userId, points, note, sessionDate } = await req.json();

  if (!ObjectId.isValid(userId)) return fail("Estudiante inválido.");
  const pts = Number(points);
  if (!Number.isFinite(pts) || pts === 0) return fail("Indica una cantidad de puntos válida.");

  const db = await getDb();
  const student = await db
    .collection("users")
    .findOne({ _id: new ObjectId(userId), role: "estudiante" });
  if (!student) return fail("El estudiante no existe.", 404);

  await db.collection("participation").insertOne({
    userId: new ObjectId(userId),
    points: pts,
    note: (note || "").toString().slice(0, 200),
    sessionDate: sessionDate || todayInBogota(),
    awardedBy: new ObjectId(teacher.id),
    createdAt: new Date(),
  });

  return json({ ok: true });
});
