// Regenera lib/seed-courses.ts a partir del Excel del plan de estudios.
// Úsalo cuando cambie la ruta de formación:
//     node scripts/generate-seed-courses.mjs
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readPlan } from "./lib/plan.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const XLSX = path.join(ROOT, "Plan de Estudios Platzi - Control estudiantes.xlsx");
const OUT = path.join(ROOT, "lib", "seed-courses.ts");
const XP_POR_CURSO = 100;

const { courses } = readPlan(XLSX);
const q = (s) => JSON.stringify(s);

const body = courses
  .map(
    (c) =>
      `  {\n` +
      `    title: ${q(c.title)},\n` +
      `    platform: "Platzi",\n` +
      `    order: ${c.order},\n` +
      `    xp: ${XP_POR_CURSO},\n` +
      `    hours: ${c.hours},\n` +
      `    grade: ${q(c.grade)},\n` +
      `    module: ${q(c.module)},\n` +
      `    component: ${q(c.component)},\n` +
      `  },`
  )
  .join("\n");

const totalHours = courses.reduce((a, c) => a + c.hours, 0);

writeFileSync(
  OUT,
  `import type { CourseDoc } from "./types";\n\n` +
    `// GENERADO por scripts/generate-seed-courses.mjs desde\n` +
    `// "Plan de Estudios Platzi - Control estudiantes.xlsx". No editar a mano:\n` +
    `// actualiza el Excel y vuelve a ejecutar el script.\n` +
    `//\n` +
    `// Ruta de formación: ${courses.length} cursos · ${totalHours} horas.\n` +
    `export const SEED_COURSES: Omit<CourseDoc, "_id" | "createdAt">[] = [\n` +
    `${body}\n];\n`,
  "utf8"
);

console.log(`lib/seed-courses.ts regenerado: ${courses.length} cursos · ${totalHours} horas.`);
