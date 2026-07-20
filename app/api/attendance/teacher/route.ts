import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { handler, json, fail, requireTeacher } from "@/lib/api";
import { todayInBogota } from "@/lib/date";

// El profe marca / actualiza la asistencia de HOY de un estudiante, exista o no
// un registro previo (upsert por userId + fecha). Permite:
//  - marcar estado (A tiempo / Tarde / Falta) → status + late
//  - añadir el MOTIVO de la falta o una OBSERVACIÓN de la clase → note
// Se puede enviar solo el estado, solo la nota, o ambos.
export const POST = handler(async (req) => {
  const teacher = await requireTeacher();
  const { userId, status, late, note } = await req.json();

  if (!ObjectId.isValid(userId)) return fail("Estudiante inválido.");
  if (status !== undefined && !["approved", "rejected", "pending"].includes(status)) {
    return fail("Estado inválido.");
  }
  if (status === undefined && note === undefined) {
    return fail("No hay nada que actualizar.");
  }

  const db = await getDb();
  const student = await db
    .collection("users")
    .findOne({ _id: new ObjectId(userId), role: "estudiante" });
  if (!student) return fail("El estudiante no existe.", 404);

  const today = todayInBogota();

  // Solo incluimos en $set los campos enviados, y el resto va en $setOnInsert
  // (sin solaparse, para no chocar en el upsert).
  const set: Record<string, unknown> = {};
  const setOnInsert: Record<string, unknown> = { checkInAt: null };

  if (status !== undefined) {
    set.status = status;
    set.late = !!late;
    set.validatedBy = new ObjectId(teacher.id);
    set.validatedAt = new Date();
  } else {
    setOnInsert.status = "pending";
    setOnInsert.late = false;
  }

  if (note !== undefined) {
    set.note = String(note).slice(0, 1000);
  } else {
    setOnInsert.note = "";
  }

  await db.collection("attendance").updateOne(
    { userId: new ObjectId(userId), classDate: today },
    { $set: set, $setOnInsert: setOnInsert },
    { upsert: true }
  );

  return json({ ok: true });
});
