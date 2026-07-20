"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { CalendarCheck, Clock, CheckCircle2, XCircle, Hourglass } from "lucide-react";
import type { AttendanceRow } from "@/app/(app)/asistencia/page";

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}
function fmtDate(dateStr: string) {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(dateStr + "T12:00:00"));
}

const STATUS = {
  approved: { icon: CheckCircle2, text: "Validada", cls: "text-emerald-300 bg-emerald-500/15" },
  pending: { icon: Hourglass, text: "Pendiente", cls: "text-amber-300 bg-amber-500/15" },
  rejected: { icon: XCircle, text: "Rechazada", cls: "text-red-300 bg-red-500/15" },
};

export default function AsistenciaClient({
  isTeacher,
  todayLabel,
  todayRow,
  history,
}: {
  isTeacher: boolean;
  today: string;
  todayLabel: string;
  todayRow: AttendanceRow | null;
  history: AttendanceRow[];
}) {
  const router = useRouter();
  const [clock, setClock] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tick = () =>
      setClock(
        new Intl.DateTimeFormat("es-CO", {
          timeZone: "America/Bogota",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }).format(new Date())
      );
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  async function checkIn() {
    setLoading(true);
    try {
      const res = await fetch("/api/attendance", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      toast.success("¡Asistencia registrada! ⏰ El profe la validará.");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Asistencia ⏰</h1>
        <p className="mt-1 text-slate-300">
          Registra tu llegada al iniciar la clase. Se guarda la hora exacta y el profe la valida.
        </p>
      </div>

      {!isTeacher && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass overflow-hidden rounded-3xl p-8 text-center"
        >
          <p className="text-sm capitalize text-slate-400">{todayLabel}</p>
          <div className="my-3 font-mono text-5xl font-black text-white tabular-nums">
            {clock}
          </div>

          {!todayRow ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={checkIn}
              disabled={loading}
              className="mx-auto mt-2 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:scale-105 disabled:opacity-60"
            >
              <CalendarCheck size={24} />
              {loading ? "Registrando..." : "Registrar mi llegada"}
            </motion.button>
          ) : (
            <div className="mx-auto mt-2 max-w-sm">
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-white/5 p-4">
                <Clock className="text-brand-300" size={22} />
                <span className="text-white">
                  {todayRow.checkInAt ? (
                    <>
                      Llegaste a las <b>{fmtTime(todayRow.checkInAt)}</b>
                    </>
                  ) : (
                    "Registro marcado por el profe"
                  )}
                </span>
              </div>
              <StatusBadge status={todayRow.status} late={todayRow.late} big />
            </div>
          )}
        </motion.div>
      )}

      {isTeacher && (
        <p className="rounded-2xl bg-brand-500/10 p-4 text-sm text-brand-200">
          👉 Para validar la asistencia de los estudiantes ve al <b>Panel Profe</b>.
        </p>
      )}

      {/* Historial */}
      <div>
        <h2 className="mb-3 text-xl font-bold text-white">
          {isTeacher ? "Mi historial" : "Mi historial de asistencia"}
        </h2>
        <div className="glass overflow-hidden rounded-2xl">
          {history.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">
              Aún no tienes registros de asistencia.
            </p>
          ) : (
            <ul className="divide-y divide-white/5">
              {history.map((r) => (
                <li key={r._id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="font-semibold capitalize text-white">{fmtDate(r.classDate)}</p>
                    <p className="text-xs text-slate-400">Llegada: {fmtTime(r.checkInAt)}</p>
                  </div>
                  <StatusBadge status={r.status} late={r.late} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  late,
  big,
}: {
  status: "pending" | "approved" | "rejected";
  late: boolean;
  big?: boolean;
}) {
  const s = STATUS[status];
  return (
    <span
      className={`mt-2 inline-flex items-center gap-1.5 rounded-full font-semibold ${s.cls} ${
        big ? "px-4 py-2 text-sm" : "px-2.5 py-1 text-xs"
      }`}
    >
      <s.icon size={big ? 16 : 13} />
      {s.text}
      {status === "approved" && late && " · tarde"}
    </span>
  );
}
