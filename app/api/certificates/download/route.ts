import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getBucket } from "@/lib/gridfs";
import { fail, requireTeacher } from "@/lib/api";
import { zipStream, type ZipEntry } from "@/lib/zip";
import { todayInBogota } from "@/lib/date";

export const runtime = "nodejs";
export const maxDuration = 300;

// Quita caracteres que Windows/macOS no aceptan en nombres de archivo.
function safe(name: string) {
  return (
    name
      .replace(/[\\/:*?"<>|\x00-\x1f]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[. ]+$/, "")
      .slice(0, 100) || "sin nombre"
  );
}

const STATUS_SUFFIX: Record<string, string> = {
  approved: "",
  pending: " (en revisión)",
  rejected: " (rechazado)",
};

/**
 * El profe descarga en un ZIP los certificados PDF subidos por los estudiantes,
 * una carpeta por estudiante. Con ?userId=... solo los de ese estudiante.
 */
export async function GET(req: Request) {
  try {
    await requireTeacher();
    const userIdParam = new URL(req.url).searchParams.get("userId");
    if (userIdParam && !ObjectId.isValid(userIdParam)) return fail("Id inválido.");

    const db = await getDb();
    const filter: Record<string, unknown> = { fileId: { $ne: null } };
    if (userIdParam) filter.userId = new ObjectId(userIdParam);

    const [records, users, courses] = await Promise.all([
      db.collection("progress").find(filter).toArray(),
      db.collection("users").find({}, { projection: { name: 1 } }).toArray(),
      db.collection("courses").find({}, { projection: { title: 1 } }).toArray(),
    ]);
    if (!records.length) return fail("No hay certificados PDF para descargar.", 404);

    const userName = new Map(users.map((u) => [u._id.toString(), safe(u.name ?? "Estudiante")]));
    const courseTitle = new Map(courses.map((c) => [c._id.toString(), safe(c.title ?? "Curso")]));
    const bucket = await getBucket();

    const used = new Set<string>();
    const entries: ZipEntry[] = records
      .map((p) => {
        const student = userName.get(p.userId.toString()) ?? "Estudiante";
        const course = courseTitle.get(p.courseId.toString()) ?? safe(p.fileName ?? "certificado");
        return { p, student, course };
      })
      .sort((a, b) => a.student.localeCompare(b.student) || a.course.localeCompare(b.course))
      .map(({ p, student, course }) => {
        // Evita nombres repetidos dentro del ZIP.
        // Si es de un solo estudiante, los PDF van sueltos (su nombre ya está en el ZIP).
        const folder = userIdParam ? "" : `${student}/`;
        const base = `${folder}${course}${STATUS_SUFFIX[p.status] ?? ""}`;
        let name = `${base}.pdf`;
        for (let n = 2; used.has(name.toLowerCase()); n++) name = `${base} (${n}).pdf`;
        used.add(name.toLowerCase());
        return {
          name,
          date: p.uploadedAt ? new Date(p.uploadedAt) : undefined,
          read: async () => {
            const chunks: Buffer[] = [];
            for await (const chunk of bucket.openDownloadStream(new ObjectId(p.fileId))) {
              chunks.push(chunk as Buffer);
            }
            return new Uint8Array(Buffer.concat(chunks));
          },
        };
      });

    const who = userIdParam ? `-${userName.get(userIdParam) ?? "estudiante"}` : "";
    const fileName = `certificados${who}-${todayInBogota()}.zip`;
    const ascii = fileName.normalize("NFD").replace(/[^\x20-\x7e]/g, "").replace(/"/g, "");

    return new Response(zipStream(entries), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return fail("Error al preparar la descarga.", 500);
  }
}
