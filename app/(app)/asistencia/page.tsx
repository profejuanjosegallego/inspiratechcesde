import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ensureSeed } from "@/lib/db-init";
import { serialize } from "@/lib/api";
import { todayInBogota, longDateInBogota } from "@/lib/date";
import AsistenciaClient from "@/components/asistencia/AsistenciaClient";
import AttendanceMatrix from "@/components/asistencia/AttendanceMatrix";

export const dynamic = "force-dynamic";

export interface AttendanceRow {
  _id: string;
  classDate: string;
  checkInAt: string;
  status: "pending" | "approved" | "rejected";
  late: boolean;
  note: string;
}

export type CellStatus = "ontime" | "late" | "rejected" | "pending" | "absent";

export interface MatrixStudent {
  userId: string;
  name: string;
  avatar: string;
  cells: Record<string, CellStatus>;
  present: number;
  late: number;
  rate: number;
}

export default async function AsistenciaPage() {
  await ensureSeed();
  const user = (await getSession())!;
  const db = await getDb();
  const today = todayInBogota();

  // ── Vista PROFE: matriz fecha × estudiante ──
  if (user.role === "profesor") {
    const [students, records] = await Promise.all([
      db.collection("users").find({ role: "estudiante" }).sort({ name: 1 }).toArray(),
      db.collection("attendance").find().toArray(),
    ]);

    const dates = Array.from(new Set(records.map((r) => r.classDate as string))).sort();

    const byKey = new Map<string, { status: string; late: boolean }>();
    for (const r of records) {
      byKey.set(`${r.userId.toString()}|${r.classDate}`, {
        status: r.status,
        late: !!r.late,
      });
    }

    const matrix: MatrixStudent[] = students.map((s) => {
      const cells: Record<string, CellStatus> = {};
      let present = 0;
      let late = 0;
      for (const d of dates) {
        const rec = byKey.get(`${s._id.toString()}|${d}`);
        let cell: CellStatus = "absent";
        if (rec) {
          if (rec.status === "approved") {
            cell = rec.late ? "late" : "ontime";
            present++;
            if (rec.late) late++;
          } else if (rec.status === "rejected") {
            cell = "rejected";
          } else {
            cell = "pending";
          }
        }
        cells[d] = cell;
      }
      return {
        userId: s._id.toString(),
        name: s.name,
        avatar: s.avatar,
        cells,
        present,
        late,
        rate: dates.length ? Math.round((present / dates.length) * 100) : 0,
      };
    });

    return <AttendanceMatrix dates={dates} students={matrix} />;
  }

  // ── Vista ESTUDIANTE ──
  const records = await db
    .collection("attendance")
    .find({ userId: new ObjectId(user.id) })
    .sort({ classDate: -1 })
    .toArray();

  const rows = serialize<AttendanceRow[]>(records);
  const todayRow = rows.find((r) => r.classDate === today) ?? null;

  return (
    <AsistenciaClient
      isTeacher={false}
      today={today}
      todayLabel={longDateInBogota()}
      todayRow={todayRow}
      history={rows}
    />
  );
}
