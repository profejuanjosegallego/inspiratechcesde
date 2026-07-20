"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { CalendarCheck, Award, Check, Clock3, X, FileText, Users, Trash2, BadgeCheck, MailWarning, MessageSquare } from "lucide-react";
import type { AttRow, CertRow, StudentRow } from "@/app/(app)/panel/page";

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export default function PanelClient({
  todayLabel,
  attendance,
  certs,
  students,
}: {
  todayLabel: string;
  attendance: AttRow[];
  certs: CertRow[];
  students: StudentRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"asistencia" | "certificados" | "estudiantes">("asistencia");
  const [busy, setBusy] = useState<string | null>(null);

  const pendingCerts = certs.filter((c) => c.status === "pending").length;
  const pendingAtt = attendance.filter((a) => a.status === "pending").length;

  // Marca/actualiza la asistencia de hoy por userId (funcione o no exista un
  // registro previo), así el profe puede poner falta a quien no marcó llegada.
  async function validateAtt(userId: string, status: string, late = false, note?: string) {
    setBusy(userId);
    const res = await fetch(`/api/attendance/teacher`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, status, late, ...(note !== undefined ? { note } : {}) }),
    });
    setBusy(null);
    if (res.ok) {
      toast.success("Asistencia actualizada");
      router.refresh();
    } else toast.error("Error al validar");
  }

  // Marcar falta pidiendo el motivo (queda como evidencia del proceso).
  async function markFalta(userId: string) {
    const reason = prompt("Motivo de la falta (opcional). Deja vacío si no aplica:");
    if (reason === null) return; // canceló → no se marca
    validateAtt(userId, "rejected", false, reason);
  }

  // Observación de la clase para un estudiante (sirve como evidencia; solo la
  // ven el profe y coordinación).
  async function addObservation(userId: string, current: string) {
    const note = prompt("Observación de la clase para este estudiante:", current || "");
    if (note === null) return;
    setBusy(userId);
    const res = await fetch(`/api/attendance/teacher`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, note }),
    });
    setBusy(null);
    if (res.ok) {
      toast.success("Observación guardada");
      router.refresh();
    } else toast.error("Error al guardar la observación");
  }

  async function deleteUser(id: string, name: string) {
    if (
      !confirm(
        `¿Eliminar a ${name} y TODOS sus datos (asistencia, certificados, progreso, participación y mensajes)?\n\nEsta acción no se puede deshacer.`
      )
    )
      return;
    setBusy(id);
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) {
      toast.success("Usuario eliminado");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || "Error al eliminar");
    }
  }

  async function validateCert(id: string, status: string) {
    let note = "";
    if (status === "rejected") {
      note = prompt("Motivo del rechazo (opcional):") || "";
    }
    setBusy(id);
    const res = await fetch(`/api/progress/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    });
    setBusy(null);
    if (res.ok) {
      toast.success(status === "approved" ? "¡Certificado aprobado! ⭐" : "Certificado rechazado");
      router.refresh();
    } else toast.error("Error al validar");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Panel del Profe 🧑‍🏫</h1>
        <p className="mt-1 capitalize text-slate-300">{todayLabel}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <TabButton
          active={tab === "asistencia"}
          onClick={() => setTab("asistencia")}
          icon={CalendarCheck}
          label="Asistencia de hoy"
          badge={pendingAtt}
        />
        <TabButton
          active={tab === "certificados"}
          onClick={() => setTab("certificados")}
          icon={Award}
          label="Certificados"
          badge={pendingCerts}
        />
        <TabButton
          active={tab === "estudiantes"}
          onClick={() => setTab("estudiantes")}
          icon={Users}
          label="Estudiantes"
          badge={0}
        />
      </div>

      {tab === "asistencia" && (
        <div className="glass overflow-hidden rounded-2xl">
          <ul className="divide-y divide-white/5">
            {attendance.map((a) => (
              <li key={a.userId} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="text-2xl">{a.avatar}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">{a.name}</p>
                  <p className="text-xs text-slate-400">
                    {a.checkInAt
                      ? `Llegó a las ${fmtTime(a.checkInAt)}`
                      : a.status === "absent"
                      ? "Sin registrar"
                      : "Marcado por el profe"}
                  </p>
                  {a.note && (
                    <p className="mt-0.5 flex items-start gap-1 text-xs italic text-slate-300">
                      <MessageSquare size={12} className="mt-0.5 shrink-0 text-brand-300" />
                      {a.note}
                    </p>
                  )}
                </div>

                <button
                  disabled={busy === a.userId}
                  onClick={() => addObservation(a.userId, a.note)}
                  title="Observación de la clase"
                  className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
                >
                  <MessageSquare size={14} /> {a.note ? "Editar" : "Observación"}
                </button>

                {a.status === "pending" || a.status === "absent" ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={busy === a.userId}
                      onClick={() => validateAtt(a.userId, "approved", false)}
                      className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30"
                    >
                      <Check size={14} /> A tiempo
                    </button>
                    <button
                      disabled={busy === a.userId}
                      onClick={() => validateAtt(a.userId, "approved", true)}
                      className="flex items-center gap-1 rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/30"
                    >
                      <Clock3 size={14} /> Tarde
                    </button>
                    <button
                      disabled={busy === a.userId}
                      onClick={() => (a.status === "absent" ? markFalta(a.userId) : validateAtt(a.userId, "rejected", false))}
                      className="flex items-center gap-1 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/30"
                    >
                      <X size={14} /> {a.status === "absent" ? "Marcar falta" : "Rechazar"}
                    </button>
                  </div>
                ) : (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      a.status === "approved"
                        ? a.late
                          ? "bg-amber-500/15 text-amber-300"
                          : "bg-emerald-500/15 text-emerald-300"
                        : "bg-red-500/15 text-red-300"
                    }`}
                  >
                    {a.status === "approved"
                      ? a.late
                        ? "Validada · tarde"
                        : "Validada ✔"
                      : "Rechazada"}
                  </span>
                )}
              </li>
            ))}
            {attendance.length === 0 && (
              <li className="p-6 text-center text-sm text-slate-400">
                No hay estudiantes registrados todavía.
              </li>
            )}
          </ul>
        </div>
      )}

      {tab === "certificados" && (
        <div className="space-y-3">
          {certs.length === 0 && (
            <p className="glass rounded-2xl p-6 text-center text-sm text-slate-400">
              No hay certificados subidos todavía.
            </p>
          )}
          {certs.map((c) => (
            <motion.div
              key={c._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass flex flex-wrap items-center gap-3 rounded-2xl p-4"
            >
              <span className="text-2xl">{c.avatar}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">{c.studentName}</p>
                <p className="text-xs text-slate-400">{c.courseTitle}</p>
              </div>
              {c.fileId && (
                <a
                  href={`/api/files/${c.fileId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10"
                >
                  <FileText size={14} /> Ver PDF
                </a>
              )}
              {c.status === "pending" ? (
                <div className="flex gap-2">
                  <button
                    disabled={busy === c._id}
                    onClick={() => validateCert(c._id, "approved")}
                    className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30"
                  >
                    <Check size={14} /> Aprobar
                  </button>
                  <button
                    disabled={busy === c._id}
                    onClick={() => validateCert(c._id, "rejected")}
                    className="flex items-center gap-1 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/30"
                  >
                    <X size={14} /> Rechazar
                  </button>
                </div>
              ) : (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    c.status === "approved"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-red-500/15 text-red-300"
                  }`}
                >
                  {c.status === "approved" ? "Aprobado ⭐" : "Rechazado"}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {tab === "estudiantes" && (
        <div className="glass overflow-hidden rounded-2xl">
          <ul className="divide-y divide-white/5">
            {students.map((s) => (
              <li key={s._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="text-2xl">{s.avatar}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">{s.name}</p>
                  <p className="truncate text-xs text-slate-400">{s.email}</p>
                </div>

                <div className="flex items-center gap-3">
                  {s.verified ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-300">
                      <BadgeCheck size={14} /> Verificado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-300">
                      <MailWarning size={14} /> Sin verificar
                    </span>
                  )}
                  <span className="hidden text-xs text-slate-400 sm:inline">
                    {s.attendanceCount} asistencias
                  </span>
                  <button
                    disabled={busy === s._id}
                    onClick={() => deleteUser(s._id, s.name)}
                    className="flex items-center gap-1 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/30 disabled:opacity-50"
                  >
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </li>
            ))}
            {students.length === 0 && (
              <li className="p-6 text-center text-sm text-slate-400">
                No hay estudiantes registrados todavía.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  badge: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-gradient-to-r from-brand-500 to-magic-500 text-white"
          : "glass text-slate-300 hover:bg-white/10"
      }`}
    >
      <Icon size={18} />
      {label}
      {badge > 0 && (
        <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}
