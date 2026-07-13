import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { json, fail, requireUser } from "@/lib/api";

// Borrar un mensaje: el profe borra cualquiera; el estudiante solo el suyo.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!ObjectId.isValid(id)) return fail("Id inválido.");
    const db = await getDb();
    const msg = await db.collection("messages").findOne({ _id: new ObjectId(id) });
    if (!msg) return fail("Mensaje no encontrado.", 404);
    if (user.role !== "profesor" && msg.userId.toString() !== user.id) {
      return fail("No puedes borrar este mensaje.", 403);
    }
    await db.collection("messages").deleteOne({ _id: new ObjectId(id) });
    return json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return fail("Error al borrar.", 500);
  }
}
