import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ensureSeed } from "@/lib/db-init";
import { todayInBogota, longDateInBogota } from "@/lib/date";
import PanelClient from "@/components/panel/PanelClient";

export const dynamic = "force-dynamic";

export interface AttRow {
  _id: string | null;
  userId: string;
  name: string;
  avatar: string;
  classDate: string;
  checkInAt: string | null;
  status: "pending" | "approved" | "rejected" | "absent";
  late: boolean;
}

export interface CertRow {
  _id: string;
  userId: string;
  studentName: string;
  avatar: string;
  courseTitle: string;
  fileId: string | null;
  fileName: string | null;
  uploadedAt: string;
  status: string;
}

export default async function PanelPage() {
  await ensureSeed();
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "profesor") redirect("/dashboard");

  const db = await getDb();
  const today = todayInBogota();

  const [students, courses, attendanceDocs, certDocs] = await Promise.all([
    db.collection("users").find({ role: "estudiante" }).sort({ name: 1 }).toArray(),
    db.collection("courses").find().toArray(),
    db.collection("attendance").find({ classDate: today }).toArray(),
    db.collection("progress").find({ status: { $in: ["pending", "approved", "rejected"] } }).toArray(),
  ]);

  const userMap = new Map(students.map((s) => [s._id.toString(), s]));
  const courseMap = new Map(courses.map((c) => [c._id.toString(), c]));
  const attMap = new Map(attendanceDocs.map((a) => [a.userId.toString(), a]));

  // Asistencia de hoy: TODOS los estudiantes (los que no registraron = 'absent')
  const attendance: AttRow[] = students.map((s) => {
    const a = attMap.get(s._id.toString());
    return {
      _id: a ? a._id.toString() : null,
      userId: s._id.toString(),
      name: s.name,
      avatar: s.avatar,
      classDate: today,
      checkInAt: a ? new Date(a.checkInAt).toISOString() : null,
      status: a ? (a.status as AttRow["status"]) : "absent",
      late: a ? !!a.late : false,
    };
  });

  // Certificados (pendientes primero)
  const certs: CertRow[] = certDocs
    .map((p) => {
      const s = userMap.get(p.userId.toString());
      const c = courseMap.get(p.courseId.toString());
      return {
        _id: p._id.toString(),
        userId: p.userId.toString(),
        studentName: s?.name ?? "Estudiante",
        avatar: s?.avatar ?? "🙂",
        courseTitle: c?.title ?? "Curso",
        fileId: p.fileId ? p.fileId.toString() : null,
        fileName: p.fileName ?? null,
        uploadedAt: new Date(p.uploadedAt).toISOString(),
        status: p.status,
      };
    })
    .sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      return b.uploadedAt.localeCompare(a.uploadedAt);
    });

  return (
    <PanelClient
      todayLabel={longDateInBogota()}
      attendance={attendance}
      certs={certs}
    />
  );
}
