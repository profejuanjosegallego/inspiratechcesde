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
  status: "pending" | "approved" | "rejected" | null;
  fileId: string | null;
  fileName: string | null;
  note: string;
}

export default async function ProgresoPage() {
  await ensureSeed();
  const user = (await getSession())!;
  const db = await getDb();

  const [coursesRaw, myProgressRaw, ranking] = await Promise.all([
    db.collection("courses").find().sort({ order: 1 }).toArray(),
    db.collection("progress").find({ userId: new ObjectId(user.id) }).toArray(),
    computeLeaderboard(db),
  ]);

  const progressMap = new Map(myProgressRaw.map((p) => [p.courseId.toString(), p]));

  const courses: CourseWithStatus[] = coursesRaw.map((c) => {
    const p = progressMap.get(c._id.toString());
    return {
      _id: c._id.toString(),
      title: c.title,
      platform: c.platform,
      xp: c.xp,
      order: c.order,
      status: (p?.status as CourseWithStatus["status"]) ?? null,
      fileId: p?.fileId ? p.fileId.toString() : null,
      fileName: p?.fileName ?? null,
      note: p?.note ?? "",
    };
  });

  const me = ranking.find((r) => r.userId === user.id);
  const myXp = me?.xp ?? 0;
  const level = levelInfo(myXp);
  const myRank = ranking.findIndex((r) => r.userId === user.id) + 1;

  return (
    <ProgresoClient
      isTeacher={user.role === "profesor"}
      courses={serialize(courses)}
      ranking={ranking}
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
