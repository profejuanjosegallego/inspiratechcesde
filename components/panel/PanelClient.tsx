"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { CalendarCheck, Award, Check, Clock3, X, FileText, Users, Trash2, BadgeCheck, MailWarning, MessageSquare, ChevronLeft, ChevronRight, SearchX, Download, KeyRound, Shuffle, Copy } from "lucide-react";
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
  selectedLabel,
  selectedDate,
  today,
  attendance,
  certs,
  students,
}: {
  todayLabel: string;
  selectedLabel: string;
  selectedDate: string;
  today: string;
  attendance: AttRow[];
  certs: CertRow[];
  students: StudentRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"asistencia" | "certificados" | "estudiantes">("asistencia");
  const [busy, setBusy] = useState<string | null>(null);
  const [navPending, startNav] = useTransition();

  const isToday = selectedDate === today;

  // Estudiante al que el profe le está asignando contraseña (modal abierto).
  const [pwFor, setPwFor] = useState<StudentRow | null>(null);
  const [pwValue, setPwValue] = useState("");
  const [pwDone, setPwDone] = useState<string | null>(null); // contraseña ya guardada

  function openPassword(s: StudentRow) {
    setPwFor(s);
    setPwValue(randomPassword());
    setPwDone(null);
  }

  async function savePassword() {
    if (!pwFor) return;
    const pass = pwValue.trim();
    if (pass.length < 6) {
      toast.error("Mínimo 6 caracteres");
      return;
    }
    setBusy(pwFor._id);
    const res = await fetch(`/api/users/${pwFor._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pass }),
    });
    setBusy(null);
    if (res.ok) {
      toast.success("Contraseña asignada 🔑");
      setPwDone(pass);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || "Error al cambiar la contraseña");
    }
  }

  const pendingCerts = certs.filter((c) => c.status === "pending").length;
  const pendingAtt = attendance.filter((a) => a.status === "pending").length;

  // Cambia la fecha de asistencia recargando el panel con ?date=...
  function goToDate(dateStr: string) {
    if (dateStr > today) return; // no futuras
    startNav(() => router.push(dateStr === today ? "/panel" : `/panel?date=${dateStr}`));
  }
  function shiftDay(delta: number) {
    const d = new Date(selectedDate + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + delta);
    goToDate(d.toISOString().slice(0, 10));
  }

  // Marca/actualiza la asistencia de la fecha elegida por userId (funcione o no
  // exista un registro previo), así el profe puede poner falta a quien no marcó.
  async function validateAtt(userId: string, status: string, late = false, note?: string) {
    setBusy(userId);
    const res = await fetch(`/api/attendance/teacher`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, status, late, classDate: selectedDate, ...(note !== undefined ? { note } : {}) }),
    });
    setBusy(null);
    if (res.ok) {
      toast.success("Asistencia actualizada");
      router.refresh();
    } else toast.error("Error al validar");
  }

  // Marcar falta pidiendo el motivo (queda como evidencia del proceso). Se
  // prellena con la nota actual para no borrarla al corregir un día pasado.
  async function markFalta(userId: string, current: string) {
    const reason = prompt("Motivo de la falta (opcional). Deja vacío si no aplica:", current || "");
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
      body: JSON.stringify({ userId, note, classDate: selectedDate }),
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

  async function validateCert(id: string, status: string, gone = false) {
    let note = "";
    if (status === "rejected") {
      note = prompt(
        gone
          ? "¿Dónde lo encuentra? (esta nota le llega al estudiante):"
          : "Motivo del rechazo (opcional):"
      ) || "";
    }
    setBusy(id);
    const res = await fetch(`/api/progress/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    });
    setBusy(null);
    if (res.ok) {
      toast.success(
        gone
          ? status === "approved"
            ? "Curso sacado de la ruta de ese estudiante 🚫"
            : "Aviso rechazado: el curso sigue en su ruta"
          : status === "approved"
          ? "¡Certificado aprobado! ⭐"
          : "Certificado rechazado"
      );
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
          label="Asistencia"
          badge={pendingAtt}
        />
        <TabButton
          active={tab === "certificados"}
          onClick={() => setTab("certificados")}
          icon={Award}
          label="Certificados y avisos"
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
        <div className="space-y-3">
          {/* Selector de fecha: hoy o días anteriores */}
          <div className="glass flex flex-wrap items-center gap-2 rounded-2xl p-3">
            <button
              onClick={() => shiftDay(-1)}
              className="rounded-lg bg-white/5 p-2 text-slate-300 hover:bg-white/10"
              aria-label="Día anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={(e) => e.target.value && goToDate(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none [color-scheme:dark] focus:border-brand-400"
            />
            <button
              onClick={() => shiftDay(1)}
              disabled={isToday}
              className="rounded-lg bg-white/5 p-2 text-slate-300 hover:bg-white/10 disabled:opacity-40"
              aria-label="Día siguiente"
            >
              <ChevronRight size={18} />
            </button>
            {!isToday && (
              <button
                onClick={() => goToDate(today)}
                className="rounded-lg bg-brand-500/20 px-3 py-1.5 text-xs font-semibold text-brand-200 hover:bg-brand-500/30"
              >
                Ir a hoy
              </button>
            )}
            <span className="ml-auto text-xs text-slate-400">
              <span className="capitalize">{selectedLabel}</span>
              {!isToday && " · editando fecha anterior"}
              {navPending && " · cargando…"}
            </span>
          </div>

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
                    {a.status === "pending" && " · sin validar"}
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

                {/* El estado SIEMPRE es editable, también en días pasados ya
                    validados: el actual queda resaltado y tocar otro lo corrige. */}
                <div className="flex flex-wrap gap-2">
                  <StatusButton
                    active={a.status === "approved" && !a.late}
                    disabled={busy === a.userId}
                    onClick={() => validateAtt(a.userId, "approved", false)}
                    tone="emerald"
                    icon={Check}
                    label="A tiempo"
                  />
                  <StatusButton
                    active={a.status === "approved" && a.late}
                    disabled={busy === a.userId}
                    onClick={() => validateAtt(a.userId, "approved", true)}
                    tone="amber"
                    icon={Clock3}
                    label="Tarde"
                  />
                  <StatusButton
                    active={a.status === "rejected"}
                    disabled={busy === a.userId}
                    onClick={() => markFalta(a.userId, a.note)}
                    tone="red"
                    icon={X}
                    label="Falta"
                  />
                </div>
              </li>
            ))}
            {attendance.length === 0 && (
              <li className="p-6 text-center text-sm text-slate-400">
                No hay estudiantes registrados todavía.
              </li>
            )}
            </ul>
          </div>
        </div>
      )}

      {tab === "certificados" && (
        <div className="space-y-3">
          {certs.length === 0 && (
            <p className="glass rounded-2xl p-6 text-center text-sm text-slate-400">
              No hay certificados subidos todavía.
            </p>
          )}
          {certs.map((c) => {
            // Un aviso de "no está en Platzi" no trae PDF: lo que se valida es
            // si el curso sale o no de la ruta de ese estudiante.
            const gone = c.kind === "unavailable";
            return (
            <motion.div
              key={c._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass flex flex-wrap items-center gap-3 rounded-2xl p-4"
            >
              <span className="text-2xl">{c.avatar}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">{c.studentName}</p>
                <p className="text-xs text-slate-400">
                  {c.courseGrade && <span className="text-slate-500">{c.courseGrade} · </span>}
                  {c.courseTitle}
                </p>
                {gone && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-amber-300">
                    <SearchX size={13} className="shrink-0" />
                    <span>
                      Dice que ya no está en Platzi
                      {c.reason && <span className="text-slate-400"> — “{c.reason}”</span>}
                    </span>
                  </p>
                )}
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
                    onClick={() => validateCert(c._id, "approved", gone)}
                    className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30"
                  >
                    <Check size={14} /> {gone ? "Sacarlo de la ruta" : "Aprobar"}
                  </button>
                  <button
                    disabled={busy === c._id}
                    onClick={() => validateCert(c._id, "rejected", gone)}
                    className="flex items-center gap-1 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/30"
                  >
                    <X size={14} /> {gone ? "Sí está" : "Rechazar"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      c.status === "approved"
                        ? gone
                          ? "bg-white/10 text-slate-300"
                          : "bg-emerald-500/15 text-emerald-300"
                        : "bg-red-500/15 text-red-300"
                    }`}
                  >
                    {c.status === "approved"
                      ? gone
                        ? "Fuera de la ruta 🚫"
                        : "Aprobado ⭐"
                      : gone
                      ? "Sigue en la ruta"
                      : "Rechazado"}
                  </span>
                  <button
                    disabled={busy === c._id}
                    onClick={() => validateCert(c._id, "pending", gone)}
                    className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-slate-400 hover:bg-white/10 hover:text-white"
                    title="Volver a dejarlo en revisión"
                  >
                    Deshacer
                  </button>
                </div>
              )}
            </motion.div>
            );
          })}
        </div>
      )}

      {tab === "estudiantes" && (
        <div className="space-y-3">
        <p className="px-1 text-xs text-slate-400">
          Usa <b className="text-slate-200">Descargar certificados</b> para bajar en un ZIP
          los PDF de cada estudiante.
        </p>
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
                  {s.certCount > 0 ? (
                    <a
                      href={`/api/certificates/download?userId=${s._id}`}
                      download
                      title={`Descargar los ${s.certCount} certificados de ${s.name} en un ZIP`}
                      className="flex items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/30"
                    >
                      <Download size={14} /> Descargar certificados ({s.certCount})
                    </a>
                  ) : (
                    <span className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-500">
                      <Download size={14} /> Sin certificados
                    </span>
                  )}
                  <button
                    disabled={busy === s._id}
                    onClick={() => openPassword(s)}
                    title="Asignarle una contraseña nueva"
                    className="flex items-center gap-1 rounded-lg bg-brand-500/15 px-3 py-1.5 text-xs font-semibold text-brand-200 transition hover:bg-brand-500/30 disabled:opacity-50"
                  >
                    <KeyRound size={14} /> Contraseña
                  </button>
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
        </div>
      )}

      {/* Modal: asignar contraseña */}
      {pwFor && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          onClick={() => setPwFor(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="glass w-full max-w-md space-y-4 rounded-2xl bg-slate-900/95 p-5"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{pwFor.avatar}</span>
              <div className="min-w-0">
                <p className="font-bold text-white">Nueva contraseña</p>
                <p className="truncate text-xs text-slate-400">
                  {pwFor.name} · {pwFor.email}
                </p>
              </div>
            </div>

            {pwDone ? (
              <>
                <p className="text-sm text-slate-300">
                  Listo. Díctale estos datos al estudiante para que entre:
                </p>
                <div className="space-y-1 rounded-xl bg-white/5 p-3 text-sm">
                  <p className="text-slate-400">
                    Correo: <span className="text-white">{pwFor.email}</span>
                  </p>
                  <p className="text-slate-400">
                    Contraseña:{" "}
                    <span className="font-mono text-lg font-bold text-white">{pwDone}</span>
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard
                        ?.writeText(`Correo: ${pwFor.email}\nContraseña: ${pwDone}`)
                        .then(() => toast.success("Copiado"));
                    }}
                    className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                  >
                    <Copy size={15} /> Copiar
                  </button>
                  <button
                    onClick={() => setPwFor(null)}
                    className="rounded-lg bg-gradient-to-r from-brand-500 to-magic-500 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  savePassword();
                }}
                className="space-y-4"
              >
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={pwValue}
                    onChange={(e) => setPwValue(e.target.value)}
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-white outline-none focus:border-brand-400"
                  />
                  <button
                    type="button"
                    onClick={() => setPwValue(randomPassword())}
                    title="Generar otra"
                    className="rounded-lg bg-white/5 px-3 text-slate-300 hover:bg-white/10"
                  >
                    <Shuffle size={16} />
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Reemplaza la contraseña anterior. Si la cuenta no estaba verificada, queda
                  verificada para que pueda entrar ya.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPwFor(null)}
                    className="rounded-lg bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={busy === pwFor._id}
                    className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-brand-500 to-magic-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    <KeyRound size={15} /> Guardar
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Contraseña fácil de dictar: sin letras/números que se confunden (0/O, 1/l/I).
function randomPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

// Clases completas (Tailwind no puede generar clases interpoladas).
const TONES = {
  emerald: {
    on: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25",
    off: "bg-white/5 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-300",
  },
  amber: {
    on: "bg-amber-500 text-white shadow-lg shadow-amber-500/25",
    off: "bg-white/5 text-slate-400 hover:bg-amber-500/20 hover:text-amber-300",
  },
  red: {
    on: "bg-red-500 text-white shadow-lg shadow-red-500/25",
    off: "bg-white/5 text-slate-400 hover:bg-red-500/20 hover:text-red-300",
  },
} as const;

function StatusButton({
  active,
  disabled,
  onClick,
  tone,
  icon: Icon,
  label,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  tone: keyof typeof TONES;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
        active ? TONES[tone].on : TONES[tone].off
      }`}
    >
      <Icon size={14} /> {label}
    </button>
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
