import { Readable } from "stream";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getBucket } from "@/lib/gridfs";
import { handler, json, fail, serialize, requireUser } from "@/lib/api";

export const runtime = "nodejs";

// Mi progreso (estudiante) o de todos si eres profe
export const GET = handler(async () => {
  const user = await requireUser();
  const db = await getDb();
  const filter = user.role === "profesor" ? {} : { userId: new ObjectId(user.id) };
  const progress = await db.collection("progress").find(filter).toArray();
  return json({ progress: serialize(progress) });
});

// Subir certificado PDF para un curso
export const POST = handler(async (req) => {
  const user = await requireUser();
  const form = await req.formData();
  const courseId = String(form.get("courseId") || "");
  const file = form.get("file");

  if (!ObjectId.isValid(courseId)) return fail("Curso inválido.");
  if (!(file instanceof File)) return fail("Falta el archivo PDF.");
  if (file.type !== "application/pdf") return fail("El archivo debe ser un PDF.");
  if (file.size > 8 * 1024 * 1024) return fail("El PDF no puede pesar más de 8 MB.");

  const db = await getDb();
  const course = await db.collection("courses").findOne({ _id: new ObjectId(courseId) });
  if (!course) return fail("El curso no existe.", 404);

  // Si ya había un certificado para este curso, borramos el archivo anterior
  const existing = await db
    .collection("progress")
    .findOne({ userId: new ObjectId(user.id), courseId: new ObjectId(courseId) });
  const bucket = await getBucket();
  if (existing?.fileId) {
    try {
      await bucket.delete(new ObjectId(existing.fileId));
    } catch {
      /* archivo ya no existe */
    }
  }

  // Guardar el nuevo PDF en GridFS
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadStream = bucket.openUploadStream(file.name, {
    metadata: { userId: user.id, courseId, contentType: "application/pdf" },
  });
  await new Promise<void>((resolve, reject) => {
    Readable.from(buffer).pipe(uploadStream).on("finish", () => resolve()).on("error", reject);
  });

  await db.collection("progress").updateOne(
    { userId: new ObjectId(user.id), courseId: new ObjectId(courseId) },
    {
      $set: {
        status: "pending",
        fileId: uploadStream.id,
        fileName: file.name,
        uploadedAt: new Date(),
        validatedAt: null,
        validatedBy: null,
        note: "",
      },
      $setOnInsert: {
        userId: new ObjectId(user.id),
        courseId: new ObjectId(courseId),
      },
    },
    { upsert: true }
  );

  return json({ ok: true });
});
