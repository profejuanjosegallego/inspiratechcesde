import type { Db } from "mongodb";
import { levelInfo } from "./gamification";

export interface RankRow {
  userId: string;
  name: string;
  avatar: string;
  xp: number;
  approved: number;
  level: number;
  title: string;
  emoji: string;
  progress: number;
}

// Ranking de estudiantes por XP (certificados aprobados).
export async function computeLeaderboard(db: Db): Promise<RankRow[]> {
  const [students, courses, approved] = await Promise.all([
    db.collection("users").find({ role: "estudiante" }).toArray(),
    db.collection("courses").find().toArray(),
    db.collection("progress").find({ status: "approved" }).toArray(),
  ]);

  const courseXp = new Map(courses.map((c) => [c._id.toString(), c.xp || 0]));

  const rows: RankRow[] = students.map((u) => {
    const mine = approved.filter((p) => p.userId.toString() === u._id.toString());
    const xp = mine.reduce((s, p) => s + (courseXp.get(p.courseId.toString()) || 0), 0);
    const lvl = levelInfo(xp);
    return {
      userId: u._id.toString(),
      name: u.name,
      avatar: u.avatar,
      xp,
      approved: mine.length,
      level: lvl.level,
      title: lvl.title,
      emoji: lvl.emoji,
      progress: lvl.progress,
    };
  });

  rows.sort((a, b) => b.xp - a.xp || b.approved - a.approved || a.name.localeCompare(b.name));
  return rows;
}
