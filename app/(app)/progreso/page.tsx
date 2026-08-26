import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ensureSeed } from "@/lib/db-init";
import { serialize } from "@/lib/api";
import { computeLeaderboard } from "@/lib/leaderboard";
import { levelInfo } from "@/lib/gamification";
import ProgresoClient from "@/components/progreso/ProgresoClient";

export const dynamic = "force-dynamic";

export interface CourseWithStatus {
  _id: string;
  title: string;
  platform: string;
  xp: number;
  order: number;
  hours: number;
  grade: string; // "Noveno" | "Décimo" | "Once" ("" si es un curso suelto)
  module: string; // submódulo del plan de estudios
  status: "pending" | "approved" | "rejected" | null;
  kind: "certificate" | "unavailable";
  reason: string; // motivo que dio el estudiante al marcarlo como no disponible
  fileId: string | null;
  fileName: string | null;
  note: string;
}

// Estado de UN curso para UN estudiante, tal como lo ve el profe en el detalle
// desplegable del consolidado. `null` (curso ausente del mapa) = sin empezar.
export interface StudentCourseState {
  status: "pending" | "approved" | "rejected";
  kind: "certificate" | "unavailable";
  fileId: string | null;
  note: string;
  reason: string;
}

// userId → (courseId → estado). Solo se construye para el profe.
export type StudentProgressMap = Record<string, Record<string, StudentCourseState>>;

export interface ParticipationEntry {
  _id: string;
  userId: string;
  studentName: string;
  avatar: string;
  points: number;
  note: string;
  sessionDate: string;
}

export default async function ProgresoPage() {
  await ensureSeed();
  const user = (await getSession())!;
  const db = await getDb();

  const isTeacher = user.role === "profesor";

  // El profe necesita el progreso de todo el curso para el detalle por
  // estudiante; el estudiante solo el suyo.
  const [coursesRaw, progressRaw, ranking] = await Promise.all([
    db.collection("courses").find().sort({ order: 1 }).toArray(),
    db
      .collection("progress")
      .find(isTeacher ? {} : { userId: new ObjectId(user.id) })
      .toArray(),
    computeLeaderboard(db),
  ]);

  const myProgressRaw = isTeacher
    ? progressRaw.filter((p) => p.userId.toString() === user.id)
    : progressRaw;

  // Detalle por estudiante (solo profe): qué tiene cada uno en cada curso.
  const studentProgress: StudentProgressMap = {};
  if (isTeacher) {
    for (const p of progressRaw) {
      const uid = p.userId.toString();
      (studentProgress[uid] ??= {})[p.courseId.toString()] = {
        status: p.status,
        kind: (p.kind as StudentCourseState["kind"]) ?? "certificate",
        fileId: p.fileId ? p.fileId.toString() : null,
        note: p.note ?? "",
        reason: p.reason ?? "",
      };
    }
  }

  const progressMap = new Map(myProgressRaw.map((p) => [p.courseId.toString(), p]));

  const courses: CourseWithStatus[] = coursesRaw.map((c) => {
    const p = progressMap.get(c._id.toString());
    return {
      _id: c._id.toString(),
      title: c.title,
      platform: c.platform,
      xp: c.xp,
      order: c.order,
      hours: c.hours ?? 0,
      grade: c.grade ?? "",
      module: c.module ?? "",
      status: (p?.status as CourseWithStatus["status"]) ?? null,
      kind: (p?.kind as CourseWithStatus["kind"]) ?? "certificate",
      reason: p?.reason ?? "",
      fileId: p?.fileId ? p.fileId.toString() : null,
      fileName: p?.fileName ?? null,
      note: p?.note ?? "",
    };
  });

  const me = ranking.find((r) => r.userId === user.id);
  const myXp = me?.xp ?? 0;
  const level = levelInfo(myXp);
  const myRank = ranking.findIndex((r) => r.userId === user.id) + 1;

  // Registro reciente de participación (solo lo necesita el profe)
  let participationLog: ParticipationEntry[] = [];
  if (isTeacher) {
    const nameMap = new Map(ranking.map((r) => [r.userId, r]));
    const logRaw = await db
      .collection("participation")
      .find()
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();
    participationLog = logRaw.map((p) => {
      const s = nameMap.get(p.userId.toString());
      return {
        _id: p._id.toString(),
        userId: p.userId.toString(),
        studentName: s?.name ?? "Estudiante",
        avatar: s?.avatar ?? "🙂",
        points: p.points,
        note: p.note ?? "",
        sessionDate: p.sessionDate ?? "",
      };
    });
  }

  return (
    <ProgresoClient
      isTeacher={isTeacher}
      courses={serialize(courses)}
      studentProgress={studentProgress}
      ranking={ranking}
      totalCourses={me?.total ?? coursesRaw.length}
      participationLog={participationLog}
      level={{
        level: level.level,
        title: level.title,
        emoji: level.emoji,
        xp: myXp,
        progress: level.progress,
        xpForNext: level.xpForNext,
        isMax: level.isMax,
        nextTitle: level.next?.title ?? null,
      }}
      myRank={myRank}
      myUserId={user.id}
    />
  );
}
