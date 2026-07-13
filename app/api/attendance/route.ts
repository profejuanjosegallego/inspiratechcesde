import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { handler, json, fail, serialize, requireUser } from "@/lib/api";
import { todayInBogota } from "@/lib/date";

// Registrar mi asistencia de hoy (estudiante)
export const POST = handler(async () => {
  const user = await requireUser();
  const db = await getDb();
  const today = todayInBogota();
  const now = new Date();

  const existing = await db
    .collection("attendance")
    .findOne({ userId: new ObjectId(user.id), classDate: today });
  if (existing) {
    return fail("Ya registraste tu asistencia de hoy.", 409);
  }

  await db.collection("attendance").insertOne({
    userId: new ObjectId(user.id),
    classDate: today,
    checkInAt: now,
    status: "pending",
    late: false,
    validatedBy: null,
    validatedAt: null,
    note: "",
  });

  return json({ ok: true, checkInAt: now.toISOString() });
});

// Mi historial (estudiante)
export const GET = handler(async () => {
  const user = await requireUser();
  const db = await getDb();
  const records = await db
    .collection("attendance")
    .find({ userId: new ObjectId(user.id) })
    .sort({ classDate: -1 })
    .toArray();
  return json({ records: serialize(records) });
});
