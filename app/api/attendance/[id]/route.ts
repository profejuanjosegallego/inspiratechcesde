import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { json, fail, requireTeacher } from "@/lib/api";

// El profe valida la asistencia: aprobar (a tiempo o tarde) o rechazar.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const teacher = await requireTeacher();
    const { id } = await params;
    if (!ObjectId.isValid(id)) return fail("Id inválido.");
    const { status, late } = await req.json();
    if (!["approved", "rejected", "pending"].includes(status)) {
      return fail("Estado inválido.");
    }
    const db = await getDb();
    await db.collection("attendance").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          late: !!late,
          validatedBy: new ObjectId(teacher.id),
          validatedAt: new Date(),
        },
      }
    );
    return json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return fail("Error al validar la asistencia.", 500);
  }
}
