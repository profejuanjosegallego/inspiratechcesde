// Sincroniza la ruta de cursos y el estado de cada estudiante desde el Excel
// "Plan de Estudios Platzi - Control estudiantes.xlsx" (raíz del proyecto).
//
//   node scripts/import-plan.mjs            → simula y muestra qué haría
//   node scripts/import-plan.mjs --apply    → escribe en la base de datos
//
// Es idempotente: se puede volver a ejecutar cada vez que actualices el Excel.
// NUNCA pisa un certificado subido por el estudiante: los registros con PDF se
// respetan siempre. Solo administra los que él mismo creó (source: "plan").
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient, ObjectId } from "mongodb";
import { readPlan, norm } from "./lib/plan.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const XLSX = path.join(ROOT, "Plan de Estudios Platzi - Control estudiantes.xlsx");
const XP_POR_CURSO = 100;
const APPLY = process.argv.includes("--apply");

// ── .env.local ────────────────────────────────────────────────────────────────
for (const line of readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const log = (...a) => console.log(...a);
const tick = (n) => String(n).padStart(3, " ");

/**
 * Empareja cada hoja del Excel con un estudiante de la base.
 * Los nombres no coinciden literalmente ("Martin Mejía Escobar" en el Excel vs
 * "Martin Mejía" en la app), así que puntuamos por palabras compartidas entre
 * el nombre y también contra la parte local del correo.
 */
function matchStudent(sheetName, students) {
  const words = norm(sheetName).split(" ").filter((w) => w.length >= 3);
  const scored = students.map((u) => {
    const nameWords = new Set(norm(u.name).split(" "));
    const emailLocal = norm(u.email.split("@")[0]).replace(/[^a-z]/g, "");
    let score = 0;
    for (const w of words) {
      if (nameWords.has(w)) score += 2;
      if (w.length >= 4 && emailLocal.includes(w)) score += 1;
    }
    return { user: u, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best || best.score === 0) return { user: null, reason: "sin coincidencia" };
  if (scored[1] && scored[1].score === best.score) {
    return { user: null, reason: `ambiguo entre "${best.user.name}" y "${scored[1].user.name}"` };
  }
  return { user: best.user, score: best.score };
}

const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 });

try {
  const { courses, students: sheets } = readPlan(XLSX);
  log(`\nExcel: ${courses.length} cursos · ${sheets.length} hojas de estudiante`);
  log(APPLY ? "MODO: aplicar cambios\n" : "MODO: simulación (usa --apply para escribir)\n");

  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "inspiratech");

  const [dbStudents, teacher] = await Promise.all([
    db.collection("users").find({ role: "estudiante" }).toArray(),
    db.collection("users").findOne({ role: "profesor" }),
  ]);

  // ── 1. Cursos ───────────────────────────────────────────────────────────────
  log("── CURSOS ──");
  const existing = await db.collection("courses").find().toArray();
  const byTitle = new Map(existing.map((c) => [norm(c.title), c]));
  const planTitles = new Set(courses.map((c) => norm(c.title)));
  const now = new Date();
  let created = 0;
  let updated = 0;

  for (const c of courses) {
    const doc = {
      title: c.title,
      platform: "Platzi",
      order: c.order,
      xp: XP_POR_CURSO,
      hours: c.hours,
      grade: c.grade,
      module: c.module,
      component: c.component,
    };
    const found = byTitle.get(norm(c.title));
    if (!found) {
      created++;
      if (APPLY) {
        const r = await db.collection("courses").insertOne({ ...doc, createdAt: now });
        byTitle.set(norm(c.title), { ...doc, _id: r.insertedId });
      } else {
        byTitle.set(norm(c.title), { ...doc, _id: new ObjectId() });
      }
    } else {
      const changed = Object.keys(doc).some(
        (k) => String(found[k] ?? "") !== String(doc[k] ?? "")
      );
      if (changed) {
        updated++;
        if (APPLY) await db.collection("courses").updateOne({ _id: found._id }, { $set: doc });
      }
    }
  }
  log(`${tick(created)} creados · ${tick(updated)} actualizados`);

  // Cursos que ya no están en el plan (los de ejemplo). Solo se borran si nadie
  // los tiene en su progreso.
  const obsolete = existing.filter((c) => !planTitles.has(norm(c.title)));
  for (const c of obsolete) {
    const used = await db.collection("progress").countDocuments({ courseId: c._id });
    if (used > 0) {
      log(`    ⚠ "${c.title}" ya no está en el plan pero tiene ${used} registro(s): NO se borra.`);
      continue;
    }
    log(`    − eliminado (fuera del plan): "${c.title}"`);
    if (APPLY) await db.collection("courses").deleteOne({ _id: c._id });
  }

  // ── 2. Progreso por estudiante ──────────────────────────────────────────────
  log("\n── ESTUDIANTES ──");
  let addedProg = 0;
  let removedProg = 0;
  let keptProg = 0;
  const unmatched = [];

  for (const sheet of sheets) {
    const { user, reason } = matchStudent(sheet.sheetName, dbStudents);
    if (!user) {
      unmatched.push(`${sheet.sheetName} (${reason})`);
      log(`  ✗ "${sheet.sheetName}" → ${reason}`);
      continue;
    }

    const wanted = new Map();
    for (const title of sheet.completed) {
      const course = byTitle.get(norm(title));
      if (course) wanted.set(course._id.toString(), course);
    }

    const mine = await db.collection("progress").find({ userId: user._id }).toArray();
    const mineByCourse = new Map(mine.map((p) => [p.courseId.toString(), p]));

    let add = 0;
    let keep = 0;
    for (const [courseId] of wanted) {
      const prev = mineByCourse.get(courseId);
      if (prev) {
        keep++;
        continue; // ya existe (con PDF o del plan): no se toca
      }
      add++;
      if (APPLY) {
        await db.collection("progress").insertOne({
          userId: user._id,
          courseId: new ObjectId(courseId),
          status: "approved",
          fileId: null,
          fileName: null,
          note: "",
          source: "plan", // vino del Excel, no de un certificado subido
          uploadedAt: now,
          validatedAt: now,
          validatedBy: teacher?._id ?? null,
        });
      }
    }

    // Lo que el script creó antes y ya no está verde en el Excel se retira.
    let remove = 0;
    for (const p of mine) {
      if (p.source === "plan" && !wanted.has(p.courseId.toString())) {
        remove++;
        if (APPLY) await db.collection("progress").deleteOne({ _id: p._id });
      }
    }

    addedProg += add;
    keptProg += keep;
    removedProg += remove;
    const xp = wanted.size * XP_POR_CURSO;
    log(
      `  ✓ ${sheet.sheetName.padEnd(30)} → ${user.name.trim().padEnd(26)} ` +
        `${tick(wanted.size)}/${courses.length} cursos · ${String(xp).padStart(4)} XP` +
        `  (+${add} nuevos, ${keep} ya estaban, -${remove} retirados)`
    );
  }

  log(
    `\nProgreso: +${addedProg} creados · ${keptProg} sin cambios · -${removedProg} retirados`
  );
  if (unmatched.length) {
    log(`\n⚠ Hojas sin emparejar: ${unmatched.join(", ")}`);
  }
  if (!APPLY) log("\nNada se escribió. Repite con --apply para aplicarlo.");
  else log("\nListo. Cambios aplicados.");
} catch (e) {
  console.error("\nERROR:", e.message);
  process.exitCode = 1;
} finally {
  await client.close();
}
