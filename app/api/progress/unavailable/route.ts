import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getBucket } from "@/lib/gridfs";
import { handler, json, fail, requireUser } from "@/lib/api";

export const runtime = "nodejs";

/**
 * El estudiante marca un curso de la ruta como "ya no está en Platzi".
 * Queda en revisión (status "pending", kind "unavailable"): el profe lo aprueba
 * o lo rechaza desde su panel, igual que un certificado. Aprobado, el curso sale
 * del total de la ruta y no otorga XP.
 */
export const POST = handler(async (req) => {
  const user = await requireUser();
  if (user.role !== "estudiante") {
    return fail("Solo los estudiantes marcan cursos como no disponibles.", 403);
  }

  const body = await req.json().catch(() => ({}));
  const courseId = String(body.courseId || "");
  const reason = String(body.reason || "").trim().slice(0, 500);
  if (!ObjectId.isValid(courseId)) return fail("Curso inválido.");

  const db = await getDb();
  const course = await db.collection("courses").findOne({ _id: new ObjectId(courseId) });
  if (!course) return fail("El curso no existe.", 404);

  const key = { userId: new ObjectId(user.id), courseId: new ObjectId(courseId) };
  const existing = await db.collection("progress").findOne(key);
  if (existing?.status === "approved" && (existing.kind ?? "certificate") === "certificate") {
    return fail("Este curso ya tiene el certificado aprobado.", 409);
  }

  // Si había un PDF cargado, lo borramos: este registro ya no es un certificado.
  if (existing?.fileId) {
    try {
      const bucket = await getBucket();
      await bucket.delete(new ObjectId(existing.fileId));
    } catch {
      /* el archivo ya no existe */
    }
  }

  await db.collection("progress").updateOne(
    key,
    {
      $set: {
        kind: "unavailable",
        status: "pending",
        reason,
        fileId: null,
        fileName: null,
        note: "",
        uploadedAt: new Date(),
        validatedAt: null,
        validatedBy: null,
      },
      $setOnInsert: key,
    },
    { upsert: true }
  );

  return json({ ok: true });
});

/** El estudiante se retracta, mientras el profe no lo haya aprobado. */
export const DELETE = handler(async (req) => {
  const user = await requireUser();
  const courseId = new URL(req.url).searchParams.get("courseId") || "";
  if (!ObjectId.isValid(courseId)) return fail("Curso inválido.");

  const db = await getDb();
  const res = await db.collection("progress").deleteOne({
    userId: new ObjectId(user.id),
    courseId: new ObjectId(courseId),
    kind: "unavailable",
    status: { $ne: "approved" },
  });
  if (!res.deletedCount) {
    return fail("Ya lo validó el profe: pídele que lo reverse.", 409);
  }
  return json({ ok: true });
});
