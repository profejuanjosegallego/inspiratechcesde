import type { CellStatus, MatrixStudent } from "@/app/(app)/asistencia/page";

// Colores de ESTADO (paleta de estado validada) + símbolo, para no depender solo del color.
const META: Record<
  CellStatus,
  { bg: string; fg: string; sym: string; label: string; ring?: string }
> = {
  ontime: { bg: "#0ca30c", fg: "#ffffff", sym: "✓", label: "A tiempo" },
  late: { bg: "#fab219", fg: "#3a2a00", sym: "T", label: "Tarde" },
  rejected: { bg: "#d03b3b", fg: "#ffffff", sym: "✕", label: "Falta / rechazada" },
  pending: {
    bg: "rgba(57,135,229,0.18)",
    fg: "#8fbcf0",
    sym: "•",
    label: "Sin validar",
    ring: "#3987e5",
  },
  absent: { bg: "rgba(255,255,255,0.04)", fg: "#5b6472", sym: "·", label: "Sin registro" },
};

function dateLabel(d: string) {
  const date = new Date(d + "T12:00:00");
  const wd = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    weekday: "short",
  }).format(date);
  const dm = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "numeric",
  }).format(date);
  return { wd, dm };
}

function Cell({ status, title }: { status: CellStatus; title: string }) {
  const m = META[status];
  return (
    <div
      title={title}
      className="grid h-8 w-8 place-items-center rounded-md text-sm font-bold"
      style={{
        background: m.bg,
        color: m.fg,
        boxShadow: m.ring ? `inset 0 0 0 1.5px ${m.ring}` : undefined,
      }}
    >
      {m.sym}
    </div>
  );
}

export default function AttendanceMatrix({
  dates,
  students,
}: {
  dates: string[];
  students: MatrixStudent[];
}) {
  const presentPerDate = dates.map(
    (d) => students.filter((s) => s.cells[d] === "ontime" || s.cells[d] === "late").length
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Asistencia de la clase 📊</h1>
        <p className="mt-1 text-slate-300">
          Mapa de asistencia por estudiante y fecha. Pasa el cursor sobre una celda para ver el
          detalle.
        </p>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {(Object.keys(META) as CellStatus[]).map((k) => (
          <span key={k} className="flex items-center gap-1.5 text-slate-300">
            <span
              className="grid h-5 w-5 place-items-center rounded text-xs font-bold"
              style={{
                background: META[k].bg,
                color: META[k].fg,
                boxShadow: META[k].ring ? `inset 0 0 0 1.5px ${META[k].ring}` : undefined,
              }}
            >
              {META[k].sym}
            </span>
            {META[k].label}
          </span>
        ))}
      </div>

      {dates.length === 0 ? (
        <p className="glass rounded-2xl p-8 text-center text-slate-400">
          Todavía no hay registros de asistencia. Aparecerán aquí cuando los estudiantes marquen
          su llegada.
        </p>
      ) : (
        <div className="glass overflow-x-auto rounded-2xl p-4">
          <table className="border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-[#0f172a] px-2 text-left text-xs font-semibold text-slate-400">
                  Estudiante
                </th>
                {dates.map((d) => {
                  const { wd, dm } = dateLabel(d);
                  return (
                    <th key={d} className="px-0.5 pb-1 text-center">
                      <div className="text-[10px] font-medium capitalize text-slate-400">{wd}</div>
                      <div className="text-[11px] font-bold text-slate-200">{dm}</div>
                    </th>
                  );
                })}
                <th className="px-2 text-center text-xs font-semibold text-slate-400">%</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.userId}>
                  <td className="sticky left-0 z-10 bg-[#0f172a] pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{s.avatar}</span>
                      <span className="whitespace-nowrap text-sm font-medium text-white">
                        {s.name.split(" ").slice(0, 2).join(" ")}
                      </span>
                    </div>
                  </td>
                  {dates.map((d) => (
                    <td key={d} className="p-0">
                      <Cell
                        status={s.cells[d]}
                        title={`${s.name} · ${dateLabel(d).dm} · ${META[s.cells[d]].label}`}
                      />
                    </td>
                  ))}
                  <td className="px-2 text-center">
                    <span
                      className={`text-sm font-bold ${
                        s.rate >= 80
                          ? "text-emerald-300"
                          : s.rate >= 50
                          ? "text-amber-300"
                          : "text-red-300"
                      }`}
                    >
                      {s.rate}%
                    </span>
                  </td>
                </tr>
              ))}

              {/* Fila resumen: presentes por fecha */}
              <tr>
                <td className="sticky left-0 z-10 bg-[#0f172a] pr-3 pt-2 text-xs font-semibold text-slate-400">
                  Presentes
                </td>
                {presentPerDate.map((n, i) => (
                  <td key={dates[i]} className="pt-2 text-center">
                    <span className="text-xs font-bold text-slate-300">
                      {n}/{students.length}
                    </span>
                  </td>
                ))}
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
