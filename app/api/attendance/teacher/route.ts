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
  const { userId, status, late, note, classDate } = await req.json();

  if (!ObjectId.isValid(userId)) return fail("Estudiante inválido.");
  if (status !== undefined && !["approved", "rejected", "pending"].includes(status)) {
    return fail("Estado inválido.");
  }
  if (status === undefined && note === undefined) {
    return fail("No hay nada que actualizar.");
  }

  // Fecha de la clase: por defecto hoy; se admite cualquier fecha PASADA (no
  // futura) para corregir asistencias/observaciones de días anteriores.
  const today = todayInBogota();
  let day = today;
  if (classDate !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(classDate)) return fail("Fecha inválida.");
    if (classDate > today) return fail("No se puede marcar una fecha futura.");
    day = classDate;
  }

  const db = await getDb();
  const student = await db
    .collection("users")
    .findOne({ _id: new ObjectId(userId), role: "estudiante" });
  if (!student) return fail("El estudiante no existe.", 404);

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
    { userId: new ObjectId(userId), classDate: day },
    { $set: set, $setOnInsert: setOnInsert },
    { upsert: true }
  );

  return json({ ok: true });
});
