import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ensureSeed } from "@/lib/db-init";
import { serialize } from "@/lib/api";
import type { Story } from "@/lib/client-types";
import KanbanBoard from "@/components/kanban/KanbanBoard";

export const dynamic = "force-dynamic";

export default async function TableroPage() {
  await ensureSeed();
  const user = (await getSession())!;
  const db = await getDb();
  const raw = await db
    .collection("stories")
    .find()
    .sort({ order: 1, week: 1 })
    .toArray();
  const stories = serialize<Story[]>(raw);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Tablero de Historias de Usuario 🗂️</h1>
        <p className="mt-1 text-slate-300">
          Una HU por semana. Arrástralas entre columnas y marca los criterios de aceptación.
          Toca una tarjeta para ver el código y el mini-tutorial.
        </p>
      </div>
      <KanbanBoard initialStories={stories} isTeacher={user.role === "profesor"} />
    </div>
  );
}
