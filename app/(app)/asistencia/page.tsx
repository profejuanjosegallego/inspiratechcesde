import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ensureSeed } from "@/lib/db-init";
import { serialize } from "@/lib/api";
import { todayInBogota, longDateInBogota } from "@/lib/date";
import AsistenciaClient from "@/components/asistencia/AsistenciaClient";

export const dynamic = "force-dynamic";

export interface AttendanceRow {
  _id: string;
  classDate: string;
  checkInAt: string;
  status: "pending" | "approved" | "rejected";
  late: boolean;
  note: string;
}

export default async function AsistenciaPage() {
  await ensureSeed();
  const user = (await getSession())!;
  const db = await getDb();
  const today = todayInBogota();

  const records = await db
    .collection("attendance")
    .find({ userId: new ObjectId(user.id) })
    .sort({ classDate: -1 })
    .toArray();

  const rows = serialize<AttendanceRow[]>(records);
  const todayRow = rows.find((r) => r.classDate === today) ?? null;

  return (
    <AsistenciaClient
      isTeacher={user.role === "profesor"}
      today={today}
      todayLabel={longDateInBogota()}
      todayRow={todayRow}
      history={rows}
    />
  );
}
