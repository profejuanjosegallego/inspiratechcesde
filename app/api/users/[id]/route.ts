import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getBucket } from "@/lib/gridfs";
import { json, fail, requireTeacher } from "@/lib/api";
import { hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

// El profe le asigna una contraseña nueva a un estudiante que la olvidó.
// También deja la cuenta verificada, para que pueda entrar de una vez.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireTeacher();
    const { id } = await params;
    if (!ObjectId.isValid(id)) return fail("Id inválido.");

    const { password } = await req.json().catch(() => ({}));
    const pass = typeof password === "string" ? password.trim() : "";
    if (pass.length < 6) return fail("La contraseña debe tener al menos 6 caracteres.");

    const db = await getDb();
    const userId = new ObjectId(id);
    const target = await db.collection("users").findOne({ _id: userId });
    if (!target) return fail("El usuario no existe.", 404);
    if (target.role !== "estudiante") {
      return fail("Solo puedes cambiar la contraseña de estudiantes.", 403);
    }

    await db.collection("users").updateOne(
      { _id: userId },
      {
        $set: {
          passwordHash: await hashPassword(pass),
          verified: true,
          verificationCode: null,
          verificationExpires: null,
        },
      }
    );
    return json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return fail("Error al cambiar la contraseña.", 500);
  }
}

// El profe elimina un estudiante y TODOS sus datos asociados: asistencia,
// certificados (con sus PDFs en GridFS), progreso, participación y mensajes.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const teacher = await requireTeacher();
    const { id } = await params;
    if (!ObjectId.isValid(id)) return fail("Id inválido.");

    const userId = new ObjectId(id);
    if (userId.toString() === teacher.id) {
      return fail("No puedes eliminar tu propia cuenta.");
    }

    const db = await getDb();
    const target = await db.collection("users").findOne({ _id: userId });
    if (!target) return fail("El usuario no existe.", 404);
    if (target.role === "profesor") {
      return fail("No se puede eliminar a un profesor.", 403);
    }

    // 1) Borrar los PDFs de certificados en GridFS.
    const progressDocs = await db
      .collection("progress")
      .find({ userId, fileId: { $ne: null } })
      .toArray();
    if (progressDocs.length) {
      const bucket = await getBucket();
      await Promise.all(
        progressDocs.map(async (p) => {
          if (!p.fileId) return;
          try {
            await bucket.delete(new ObjectId(p.fileId));
          } catch {
            /* el archivo ya no existe */
          }
        })
      );
    }

    // 2) Borrar los documentos relacionados y, por último, el usuario.
    await Promise.all([
      db.collection("attendance").deleteMany({ userId }),
      db.collection("progress").deleteMany({ userId }),
      db.collection("participation").deleteMany({ userId }),
      db.collection("messages").deleteMany({ userId }),
      db.collection("users").deleteOne({ _id: userId }),
    ]);

    return json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return fail("Error al eliminar el usuario.", 500);
  }
}
