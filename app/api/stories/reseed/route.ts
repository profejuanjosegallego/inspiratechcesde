import { getDb } from "@/lib/mongodb";
import { handler, json, requireTeacher } from "@/lib/api";
import { SEED_STORIES } from "@/lib/seed-stories";
import type { StoryDoc } from "@/lib/types";

// Reinicia el tablero: borra las HU actuales y carga las del seed (12 semanas).
// Solo el profe. Ojo: esto reemplaza el estado y los criterios marcados.
export const POST = handler(async () => {
  await requireTeacher();
  const db = await getDb();
  await db.collection("stories").deleteMany({});

  const now = new Date();
  const docs: StoryDoc[] = SEED_STORIES.map((s, i) => ({
    ...s,
    status: "todo",
    order: i,
    createdAt: now,
    updatedAt: now,
  }));
  await db.collection("stories").insertMany(docs);

  return json({ ok: true, count: docs.length });
});
