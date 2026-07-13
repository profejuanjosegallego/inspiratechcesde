import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { json, fail, requireTeacher } from "@/lib/api";

// El profe aprueba o rechaza un certificado.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const teacher = await requireTeacher();
    const { id } = await params;
    if (!ObjectId.isValid(id)) return fail("Id inválido.");
    const { status, note } = await req.json();
    if (!["approved", "rejected", "pending"].includes(status)) {
      return fail("Estado inválido.");
    }
    const db = await getDb();
    await db.collection("progress").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          note: note || "",
          validatedAt: new Date(),
          validatedBy: new ObjectId(teacher.id),
        },
      }
    );
    return json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return fail("Error al validar.", 500);
  }
}
