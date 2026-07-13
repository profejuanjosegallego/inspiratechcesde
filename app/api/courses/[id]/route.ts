import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { json, fail, requireTeacher } from "@/lib/api";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireTeacher();
    const { id } = await params;
    if (!ObjectId.isValid(id)) return fail("Id inválido.");
    const body = await req.json();
    const set: Record<string, unknown> = {};
    if (typeof body.title === "string") set.title = body.title;
    if (typeof body.platform === "string") set.platform = body.platform;
    if (body.xp !== undefined) set.xp = Number(body.xp);
    if (body.order !== undefined) set.order = Number(body.order);
    const db = await getDb();
    await db.collection("courses").updateOne({ _id: new ObjectId(id) }, { $set: set });
    return json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return fail("Error al actualizar.", 500);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireTeacher();
    const { id } = await params;
    if (!ObjectId.isValid(id)) return fail("Id inválido.");
    const db = await getDb();
    await db.collection("courses").deleteOne({ _id: new ObjectId(id) });
    // También quitamos el progreso asociado a ese curso
    await db.collection("progress").deleteMany({ courseId: new ObjectId(id) });
    return json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return fail("Error al eliminar.", 500);
  }
}
