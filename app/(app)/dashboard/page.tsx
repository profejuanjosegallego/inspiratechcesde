import Link from "next/link";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ensureSeed } from "@/lib/db-init";
import { levelInfo } from "@/lib/gamification";
import { todayInBogota, longDateInBogota } from "@/lib/date";
import DashboardCards from "@/components/DashboardCards";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await ensureSeed();
  const user = (await getSession())!;
  const db = await getDb();

  const [todo, inProgress, done] = await Promise.all([
    db.collection("stories").countDocuments({ status: "todo" }),
    db.collection("stories").countDocuments({ status: "in_progress" }),
    db.collection("stories").countDocuments({ status: "done" }),
  ]);

  const courses = await db.collection("courses").find().toArray();
  const totalCourses = courses.length;

  const myApproved = await db
    .collection("progress")
    .find({ userId: new ObjectId(user.id), status: "approved" })
    .toArray();
  const xp = myApproved.reduce((sum, p) => {
    const course = courses.find((c) => c._id.toString() === p.courseId.toString());
    return sum + (course?.xp || 0);
  }, 0);
  const level = levelInfo(xp);

  const today = todayInBogota();
  const attendance = await db
    .collection("attendance")
    .findOne({ userId: new ObjectId(user.id), classDate: today });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-400">{longDateInBogota()}</p>
        <h1 className="mt-1 text-3xl font-black text-white">
          ¡Hola, {user.name.split(" ")[0]}! <span className="text-3xl">{user.avatar}</span>
        </h1>
        <p className="mt-1 text-slate-300">
          {user.role === "profesor"
            ? "Aquí tienes el panorama de la clase. Recuerda validar asistencia y certificados."
            : "Sigue avanzando en tus historias de usuario y sube de nivel. 💪"}
        </p>
      </div>

      <DashboardCards
        role={user.role}
        stories={{ todo, inProgress, done }}
        level={level}
        courses={{ approved: myApproved.length, total: totalCourses }}
        attendance={
          attendance
            ? { status: attendance.status as string, late: !!attendance.late }
            : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink
          href="/tablero"
          emoji="🗂️"
          title="Tablero de Historias"
          desc="Mueve tus HU y marca criterios."
        />
        <QuickLink
          href="/progreso"
          emoji="🏆"
          title="Progreso gamificado"
          desc="Sube certificados y sube de nivel."
        />
        <QuickLink
          href="/asistencia"
          emoji="⏰"
          title="Asistencia"
          desc="Registra tu llegada de hoy."
        />
      </div>
    </div>
  );
}

function QuickLink({
  href,
  emoji,
  title,
  desc,
}: {
  href: string;
  emoji: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="glass group rounded-2xl p-5 transition hover:-translate-y-1 hover:bg-white/10"
    >
      <div className="text-3xl">{emoji}</div>
      <h3 className="mt-3 font-bold text-white">{title}</h3>
      <p className="text-sm text-slate-400">{desc}</p>
      <span className="mt-3 inline-block text-sm font-semibold text-brand-300 group-hover:underline">
        Ir →
      </span>
    </Link>
  );
}
