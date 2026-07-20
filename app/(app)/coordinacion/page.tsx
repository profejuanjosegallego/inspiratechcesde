import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ensureSeed } from "@/lib/db-init";
import { longDateInBogota } from "@/lib/date";
import CoordinacionClient from "@/components/coordinacion/CoordinacionClient";

export const dynamic = "force-dynamic";

export interface CoordAttendance {
  classDate: string;
  status: "pending" | "approved" | "rejected";
  late: boolean;
  note: string;
  checkInAt: string | null;
}

export interface CoordStudent {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  present: number;
  late: number;
  absent: number;
  rate: number;
  records: CoordAttendance[];
}

export interface CoordBacklog {
  todo: number;
  inProgress: number;
  done: number;
  stories: { week: number; title: string; status: string; estimation: number }[];
}

export default async function CoordinacionPage() {
  await ensureSeed();
  const user = (await getSession())!;
  // Solo coordinación y profe pueden ver esta vista (solo lectura).
  if (user.role !== "coordinacion" && user.role !== "profesor") redirect("/dashboard");

  const db = await getDb();
  const [students, attendance, stories] = await Promise.all([
    db.collection("users").find({ role: "estudiante" }).sort({ name: 1 }).toArray(),
    db.collection("attendance").find().toArray(),
    db.collection("stories").find().sort({ week: 1, order: 1 }).toArray(),
  ]);

  const byUser = new Map<string, CoordAttendance[]>();
  for (const r of attendance) {
    const arr = byUser.get(r.userId.toString()) ?? [];
    arr.push({
      classDate: r.classDate as string,
      status: r.status as CoordAttendance["status"],
      late: !!r.late,
      note: (r.note as string) ?? "",
      checkInAt: r.checkInAt ? new Date(r.checkInAt).toISOString() : null,
    });
    byUser.set(r.userId.toString(), arr);
  }

  const totalDates = new Set(attendance.map((r) => r.classDate as string)).size;

  const studentRows: CoordStudent[] = students.map((s) => {
    const records = (byUser.get(s._id.toString()) ?? []).sort((a, b) =>
      b.classDate.localeCompare(a.classDate)
    );
    let present = 0;
    let late = 0;
    let absent = 0;
    for (const r of records) {
      if (r.status === "approved") {
        present++;
        if (r.late) late++;
      } else if (r.status === "rejected") {
        absent++;
      }
    }
    return {
      _id: s._id.toString(),
      name: s.name,
      email: s.email,
      avatar: s.avatar,
      present,
      late,
      absent,
      rate: totalDates ? Math.round((present / totalDates) * 100) : 0,
      records,
    };
  });

  const backlog: CoordBacklog = {
    todo: stories.filter((s) => s.status === "todo").length,
    inProgress: stories.filter((s) => s.status === "in_progress").length,
    done: stories.filter((s) => s.status === "done").length,
    stories: stories.map((s) => ({
      week: s.week as number,
      title: s.title as string,
      status: s.status as string,
      estimation: s.estimation as number,
    })),
  };

  return (
    <CoordinacionClient
      todayLabel={longDateInBogota()}
      students={studentRows}
      backlog={backlog}
    />
  );
}
