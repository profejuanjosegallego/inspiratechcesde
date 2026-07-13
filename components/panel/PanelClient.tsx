"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { CalendarCheck, Award, Check, Clock3, X, FileText } from "lucide-react";
import type { AttRow, CertRow } from "@/app/(app)/panel/page";

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
}: {
  todayLabel: string;
  attendance: AttRow[];
  certs: CertRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"asistencia" | "certificados">("asistencia");
  const [busy, setBusy] = useState<string | null>(null);

  const pendingCerts = certs.filter((c) => c.status === "pending").length;
  const pendingAtt = attendance.filter((a) => a.status === "pending").length;

  async function validateAtt(id: string, status: string, late = false) {
    setBusy(id);
    const res = await fetch(`/api/attendance/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, late }),
    });
    setBusy(null);
    if (res.ok) {
      toast.success("Asistencia validada");
      router.refresh();
    } else toast.error("Error al validar");
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
                    {a.status === "absent"
                      ? "Sin registrar"
                      : `Llegó a las ${fmtTime(a.checkInAt)}`}
                  </p>
                </div>

                {a.status === "absent" ? (
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">
                    Sin registro
                  </span>
                ) : a.status === "pending" ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={busy === a._id}
                      onClick={() => validateAtt(a._id!, "approved", false)}
                      className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30"
                    >
                      <Check size={14} /> A tiempo
                    </button>
                    <button
                      disabled={busy === a._id}
                      onClick={() => validateAtt(a._id!, "approved", true)}
                      className="flex items-center gap-1 rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/30"
                    >
                      <Clock3 size={14} /> Tarde
                    </button>
                    <button
                      disabled={busy === a._id}
                      onClick={() => validateAtt(a._id!, "rejected", false)}
                      className="flex items-center gap-1 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/30"
                    >
                      <X size={14} /> Rechazar
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
