"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  KanbanSquare,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Hourglass,
  Clock3,
} from "lucide-react";
import type { CoordStudent, CoordBacklog, CoordAttendance } from "@/app/(app)/coordinacion/page";

function fmtDate(dateStr: string) {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(dateStr + "T12:00:00"));
}

const STATUS: Record<
  CoordAttendance["status"],
  { icon: typeof CheckCircle2; text: string; cls: string }
> = {
  approved: { icon: CheckCircle2, text: "Asistió", cls: "text-emerald-300 bg-emerald-500/15" },
  pending: { icon: Hourglass, text: "Sin validar", cls: "text-amber-300 bg-amber-500/15" },
  rejected: { icon: XCircle, text: "Falta", cls: "text-red-300 bg-red-500/15" },
};

export default function CoordinacionClient({
  todayLabel,
  students,
  backlog,
}: {
  todayLabel: string;
  students: CoordStudent[];
  backlog: CoordBacklog;
}) {
  const [tab, setTab] = useState<"estudiantes" | "backlog">("estudiantes");
  const [selectedId, setSelectedId] = useState<string | null>(students[0]?._id ?? null);
  const selected = students.find((s) => s._id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Coordinación 🧭</h1>
        <p className="mt-1 capitalize text-slate-300">{todayLabel} · Solo lectura</p>
      </div>

      <div className="flex gap-2">
        <TabButton active={tab === "estudiantes"} onClick={() => setTab("estudiantes")} icon={Users} label="Estudiantes" />
        <TabButton active={tab === "backlog"} onClick={() => setTab("backlog")} icon={KanbanSquare} label="Backlog" />
      </div>

      {tab === "estudiantes" && (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          {/* Lista de estudiantes */}
          <div className="glass h-fit overflow-hidden rounded-2xl">
            <ul className="max-h-[70vh] divide-y divide-white/5 overflow-y-auto">
              {students.map((s) => (
                <li key={s._id}>
                  <button
                    onClick={() => setSelectedId(s._id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                      selectedId === s._id ? "bg-brand-500/15" : "hover:bg-white/5"
                    }`}
                  >
                    <span className="text-2xl">{s.avatar}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{s.name}</p>
                      <p className="text-xs text-slate-400">
                        {s.present} asistencias · {s.absent} faltas
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        s.rate >= 80 ? "text-emerald-300" : s.rate >= 50 ? "text-amber-300" : "text-red-300"
                      }`}
                    >
                      {s.rate}%
                    </span>
                  </button>
                </li>
              ))}
              {students.length === 0 && (
                <li className="p-6 text-center text-sm text-slate-400">No hay estudiantes.</li>
              )}
            </ul>
          </div>

          {/* Detalle del estudiante seleccionado */}
          <div className="space-y-4">
            {!selected ? (
              <p className="glass rounded-2xl p-8 text-center text-slate-400">
                Selecciona un estudiante para ver su historial y observaciones.
              </p>
            ) : (
              <>
                <div className="glass flex flex-wrap items-center gap-4 rounded-2xl p-5">
                  <span className="text-4xl">{selected.avatar}</span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold text-white">{selected.name}</h2>
                    <p className="truncate text-sm text-slate-400">{selected.email}</p>
                  </div>
                  <div className="flex gap-4 text-center">
                    <Stat n={selected.present} label="Asistió" cls="text-emerald-300" />
                    <Stat n={selected.late} label="Tarde" cls="text-amber-300" />
                    <Stat n={selected.absent} label="Faltas" cls="text-red-300" />
                  </div>
                </div>

                <div className="glass overflow-hidden rounded-2xl">
                  <p className="border-b border-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Historial y observaciones
                  </p>
                  {selected.records.length === 0 ? (
                    <p className="p-6 text-center text-sm text-slate-400">
                      Este estudiante aún no tiene registros de clase.
                    </p>
                  ) : (
                    <ul className="divide-y divide-white/5">
                      {selected.records.map((r) => {
                        const s = STATUS[r.status];
                        return (
                          <li key={r.classDate} className="px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-semibold capitalize text-white">
                                {fmtDate(r.classDate)}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}
                              >
                                <s.icon size={13} />
                                {s.text}
                                {r.status === "approved" && r.late && (
                                  <>
                                    {" "}
                                    <Clock3 size={11} /> tarde
                                  </>
                                )}
                              </span>
                            </div>
                            {r.note && (
                              <p className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-sm text-slate-200">
                                <MessageSquare size={14} className="mt-0.5 shrink-0 text-brand-300" />
                                {r.note}
                              </p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {tab === "backlog" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <BacklogStat n={backlog.todo} label="Por hacer" cls="from-slate-500/20 text-slate-200" />
            <BacklogStat n={backlog.inProgress} label="En progreso" cls="from-amber-500/20 text-amber-200" />
            <BacklogStat n={backlog.done} label="Terminadas" cls="from-emerald-500/20 text-emerald-200" />
          </div>

          <div className="glass overflow-hidden rounded-2xl">
            <ul className="divide-y divide-white/5">
              {backlog.stories.map((st, i) => (
                <li key={i} className="flex items-center gap-3 px-4 py-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/5 text-xs font-bold text-slate-300">
                    S{st.week}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm text-white">{st.title}</p>
                  <span className="shrink-0 text-xs text-slate-400">{st.estimation} pts</span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      st.status === "done"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : st.status === "in_progress"
                        ? "bg-amber-500/15 text-amber-300"
                        : "bg-white/5 text-slate-400"
                    }`}
                  >
                    {st.status === "done" ? "Terminada" : st.status === "in_progress" ? "En progreso" : "Por hacer"}
                  </span>
                </li>
              ))}
              {backlog.stories.length === 0 && (
                <li className="p-6 text-center text-sm text-slate-400">No hay historias en el backlog.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ n, label, cls }: { n: number; label: string; cls: string }) {
  return (
    <div>
      <p className={`text-2xl font-black ${cls}`}>{n}</p>
      <p className="text-[11px] text-slate-400">{label}</p>
    </div>
  );
}

function BacklogStat({ n, label, cls }: { n: number; label: string; cls: string }) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br to-transparent p-4 ${cls}`}>
      <p className="text-3xl font-black">{n}</p>
      <p className="text-xs opacity-80">{label}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
        active ? "bg-gradient-to-r from-brand-500 to-magic-500 text-white" : "glass text-slate-300 hover:bg-white/10"
      }`}
    >
      <Icon size={18} />
      {label}
    </motion.button>
  );
}
