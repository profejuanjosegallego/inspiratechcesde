import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { handler, json, fail, requireUser } from "@/lib/api";

// Guardar el nuevo orden/columna tras arrastrar (cualquiera puede reorganizar).
export const PUT = handler(async (req) => {
  await requireUser();
  const { items } = await req.json();
  if (!Array.isArray(items)) return fail("Formato inválido.");

  const db = await getDb();
  const ops = items
    .filter((it) => ObjectId.isValid(it.id))
    .map((it) => ({
      updateOne: {
        filter: { _id: new ObjectId(it.id) },
        update: {
          $set: {
            status: it.status,
            order: Number(it.order) || 0,
            updatedAt: new Date(),
          },
        },
      },
    }));

  if (ops.length) await db.collection("stories").bulkWrite(ops);
  return json({ ok: true });
});
