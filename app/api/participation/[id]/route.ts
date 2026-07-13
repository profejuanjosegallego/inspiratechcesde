import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { json, fail, requireTeacher } from "@/lib/api";

// Quitar un registro de participación (profe), por si fue un error.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireTeacher();
    const { id } = await params;
    if (!ObjectId.isValid(id)) return fail("Id inválido.");
    const db = await getDb();
    await db.collection("participation").deleteOne({ _id: new ObjectId(id) });
    return json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return fail("Error al eliminar.", 500);
  }
}
