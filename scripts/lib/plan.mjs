// Lee "Plan de Estudios Platzi - Control estudiantes.xlsx".
//
// Estructura del libro:
//   · Hoja 1        → el plan maestro (la ruta de formación).
//   · Hojas 2..N    → una por estudiante, con el MISMO plan; los cursos que ya
//                     terminó están pintados de VERDE en la columna "Cursos Platzi".
//
// Columnas (fila 5 = encabezados, los cursos empiezan en la 6):
//   A Componente · B Submódulo · C Grado · D Curso · E Horas · F Intensidad semestral
import { readWorkbook } from "./xlsx.mjs";

const COL = { component: "A", module: "B", grade: "C", title: "D", hours: "E" };
const FIRST_ROW = 6;
const MAX_ROW = 200; // tope de seguridad

/** ¿El relleno es un verde? (marca de "curso terminado"). */
function isGreen(fill) {
  if (!fill || !/^[0-9A-F]{6}$/.test(fill)) return false;
  const r = parseInt(fill.slice(0, 2), 16);
  const g = parseInt(fill.slice(2, 4), 16);
  const b = parseInt(fill.slice(4, 6), 16);
  // Verde dominante y suficientemente vivo (tolera cambios de tono).
  return g > 100 && g > r * 1.2 && g > b * 1.2;
}

/** Normaliza para comparar títulos/nombres: sin tildes, sin dobles espacios. */
export function norm(s) {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita los diacríticos ya separados por NFD
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function readPlan(filePath) {
  const wb = readWorkbook(filePath);
  if (wb.sheets.length < 2) throw new Error("El libro no tiene hojas de estudiantes.");

  const master = wb.sheets[0];

  // ── Cursos del plan ──
  const courses = [];
  for (let row = FIRST_ROW; row <= MAX_ROW; row++) {
    const title = master.cell(COL.title + row).value;
    const moduleName = master.cell(COL.module + row).value;
    if (norm(moduleName) === "total") break; // fila de totales → fin
    if (!title) continue;

    courses.push({
      row,
      order: courses.length + 1,
      title: title.replace(/\s+/g, " "),
      component: master.cell(COL.component + row).value,
      module: moduleName,
      grade: master.cell(COL.grade + row).value,
      hours: Number(master.cell(COL.hours + row).value) || 0,
    });
  }
  if (!courses.length) throw new Error("No se encontró ningún curso en la hoja del plan.");

  // ── Estado por estudiante ──
  const students = wb.sheets.slice(1).map((sheet) => {
    const completed = [];
    for (const c of courses) {
      const cell = sheet.cell(COL.title + c.row);
      // Si la hoja del estudiante desplazó filas, verificamos el título.
      const sameCourse = !cell.value || norm(cell.value) === norm(c.title);
      if (isGreen(cell.fill) && sameCourse) completed.push(c.title);
    }
    return { sheetName: sheet.name, completed };
  });

  return { courses, students };
}
