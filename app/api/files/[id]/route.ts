import { Readable } from "stream";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getBucket } from "@/lib/gridfs";
import { getSession } from "@/lib/auth";
import { fail } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return fail("No autorizado.", 401);
  const { id } = await params;
  if (!ObjectId.isValid(id)) return fail("Id inválido.");

  const db = await getDb();
  const fileId = new ObjectId(id);

  // Verificar acceso: el profe ve todo; el estudiante solo lo suyo.
  const record = await db.collection("progress").findOne({ fileId });
  if (!record) return fail("Archivo no encontrado.", 404);
  if (user.role !== "profesor" && record.userId.toString() !== user.id) {
    return fail("No puedes ver este archivo.", 403);
  }

  const bucket = await getBucket();
  const files = await bucket.find({ _id: fileId }).toArray();
  if (!files.length) return fail("Archivo no encontrado.", 404);

  const nodeStream = bucket.openDownloadStream(fileId);
  const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream;

  return new Response(webStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${files[0].filename || "certificado.pdf"}"`,
    },
  });
}
