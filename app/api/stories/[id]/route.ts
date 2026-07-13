import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { json, fail, requireUser, requireTeacher } from "@/lib/api";
import type { StoryDoc } from "@/lib/types";

// Actualizar una historia: mover de columna, marcar criterios (cualquiera)
// o editar campos completos (solo profe).
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!ObjectId.isValid(id)) return fail("Id inválido.");
    const body = await req.json();
    const db = await getDb();

    const set: Partial<StoryDoc> = { updatedAt: new Date() };

    // Mover de columna (todos)
    if (body.status && ["todo", "in_progress", "done"].includes(body.status)) {
      set.status = body.status;
    }
    // Marcar/desmarcar criterios (todos)
    if (Array.isArray(body.acceptanceCriteria)) {
      set.acceptanceCriteria = body.acceptanceCriteria;
    }

    // Edición completa solo del profe
    if (user.role === "profesor") {
      for (const f of ["title", "role", "description", "code", "codeLang", "tutorial"]) {
        if (typeof body[f] === "string") (set as Record<string, unknown>)[f] = body[f];
      }
      if (body.estimation !== undefined) set.estimation = Number(body.estimation);
      if (body.week !== undefined) set.week = Number(body.week);
      if (Array.isArray(body.tags)) set.tags = body.tags;
    }

    await db
      .collection<StoryDoc>("stories")
      .updateOne({ _id: new ObjectId(id) }, { $set: set });
    return json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return fail("Error al actualizar la historia.", 500);
  }
}

// Eliminar (solo profe)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireTeacher();
    const { id } = await params;
    if (!ObjectId.isValid(id)) return fail("Id inválido.");
    const db = await getDb();
    await db.collection("stories").deleteOne({ _id: new ObjectId(id) });
    return json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return fail("Error al eliminar.", 500);
  }
}
