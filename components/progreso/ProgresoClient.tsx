"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Plus,
  Trash2,
  Loader2,
  Crown,
  Hand,
} from "lucide-react";
import type { RankRow } from "@/lib/leaderboard";
import type { CourseWithStatus, ParticipationEntry } from "@/app/(app)/progreso/page";

interface LevelData {
  level: number;
  title: string;
  emoji: string;
  xp: number;
  progress: number;
  xpForNext: number;
  isMax: boolean;
  nextTitle: string | null;
}

export default function ProgresoClient({
  isTeacher,
  courses,
  ranking,
  totalCourses,
  participationLog,
  level,
  myRank,
  myUserId,
}: {
  isTeacher: boolean;
  courses: CourseWithStatus[];
  ranking: RankRow[];
  totalCourses: number;
  participationLog: ParticipationEntry[];
  level: LevelData;
  myRank: number;
  myUserId: string;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  async function awardParticipation(userId: string, name: string) {
    const raw = prompt(`Puntos de participación para ${name}:`, "10");
    if (raw === null) return;
    const points = Number(raw);
    if (!points) {
      toast.error("Escribe un número de puntos válido.");
      return;
    }
    const note = prompt("Nota (opcional): ¿por qué la participación?") || "";
    const res = await fetch("/api/participation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, points, note }),
    });
    if (res.ok) {
      toast.success(`+${points} XP de participación para ${name.split(" ")[0]} 🙋`);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || "No se pudo registrar");
    }
  }

  async function deleteParticipation(id: string) {
    if (!confirm("¿Quitar este registro de participación?")) return;
    const res = await fetch(`/api/participation/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Participación eliminada");
      router.refresh();
    } else toast.error("No se pudo eliminar");
  }

  async function upload(courseId: string, file: File) {
    setUploading(courseId);
    try {
      const fd = new FormData();
      fd.append("courseId", courseId);
      fd.append("file", file);
      const res = await fetch("/api/progress", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir");
      toast.success("¡Certificado enviado! El profe lo revisará 📬");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(null);
    }
  }

  async function addCourse() {
    const title = prompt("Nombre del curso de Platzi:");
    if (!title) return;
    const xp = Number(prompt("XP que otorga (ej: 100):", "100")) || 100;
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, xp }),
    });
    if (res.ok) {
      toast.success("Curso agregado");
      router.refresh();
    } else toast.error("No se pudo agregar");
  }

  async function deleteCourse(id: string) {
    if (!confirm("¿Eliminar este curso?")) return;
    const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Curso eliminado");
      router.refresh();
    } else toast.error("No se pudo eliminar");
  }

  const maxXp = Math.max(1, ...ranking.map((r) => r.xp));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Progreso gamificado 🏆</h1>
        <p className="mt-1 text-slate-300">
          Cada curso de Platzi que completes suma XP y sube de nivel a tu personaje.
          Sube el PDF del certificado y el profe lo valida.
        </p>
      </div>

      {/* Personaje */}
      {!isTeacher && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass overflow-hidden rounded-3xl p-6"
        >
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, 3, -3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="grid h-28 w-28 place-items-center rounded-3xl bg-gradient-to-br from-brand-500 to-magic-500 text-6xl shadow-xl"
            >
              {level.emoji}
            </motion.div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <span className="rounded-full bg-brand-500/20 px-3 py-1 text-sm font-bold text-brand-200">
                  Nivel {level.level}
                </span>
                <span className="text-xl font-black text-white">{level.title}</span>
                {myRank === 1 && ranking.length > 1 && (
                  <span className="flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-bold text-yellow-300">
                    <Crown size={14} /> Líder
                  </span>
                )}
              </div>
              <div className="mt-3 h-4 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${level.progress}%` }}
                  transition={{ duration: 1 }}
                  className="relative h-full rounded-full bg-gradient-to-r from-brand-400 via-magic-400 to-lime-glow"
                >
                  <span className="absolute inset-0 xp-shimmer" />
                </motion.div>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                <b className="text-white">{level.xp} XP</b> ·{" "}
                {level.isMax
                  ? "¡Nivel máximo! 🎉"
                  : `faltan ${level.xpForNext} XP para ${level.nextTitle}`}{" "}
                · Puesto #{myRank} de {ranking.length}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Participación de clase (solo docente) */}
      {isTeacher && (
        <section className="glass rounded-3xl p-5">
          <div className="mb-1 flex items-center gap-2">
            <Hand className="text-magic-400" size={22} />
            <h2 className="text-xl font-bold text-white">Participación de clase</h2>
          </div>
          <p className="mb-4 text-sm text-slate-400">
            Otorga XP por participar en clase. Puedes dar varias por sesión; suman al nivel del estudiante. 🙋
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            {ranking.map((r) => (
              <div
                key={r.userId}
                className="flex items-center gap-3 rounded-xl bg-white/5 p-3"
              >
                <span className="text-2xl">{r.avatar}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{r.name}</p>
                  <p className="text-xs text-slate-400">
                    {r.participationXp} XP de participación
                  </p>
                </div>
                <button
                  onClick={() => awardParticipation(r.userId, r.name)}
                  className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-magic-500 to-brand-500 px-3 py-1.5 text-xs font-bold text-white transition hover:scale-105"
                >
                  <Plus size={14} /> Puntos
                </button>
              </div>
            ))}
            {ranking.length === 0 && (
              <p className="text-sm text-slate-400">
                Aún no hay estudiantes registrados.
              </p>
            )}
          </div>

          {participationLog.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Últimas participaciones
              </p>
              <ul className="space-y-1.5">
                {participationLog.map((p) => (
                  <li
                    key={p._id}
                    className="group flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2 text-sm"
                  >
                    <span>{p.avatar}</span>
                    <span className="font-medium text-white">
                      {p.studentName.split(" ")[0]}
                    </span>
                    <span className="rounded-full bg-magic-500/20 px-2 py-0.5 text-xs font-bold text-magic-300">
                      +{p.points} XP
                    </span>
                    {p.note && (
                      <span className="truncate text-xs text-slate-400">— {p.note}</span>
                    )}
                    <button
                      onClick={() => deleteParticipation(p._id)}
                      className="ml-auto text-slate-600 opacity-0 transition group-hover:opacity-100 hover:text-red-400"
                      title="Quitar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Consolidado por estudiante (solo docente) */}
      {isTeacher && (
        <section className="glass rounded-3xl p-5">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold text-white">Consolidado por estudiante</h2>
            <div className="flex items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm" style={{ background: "#3987e5" }} /> Cursos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm" style={{ background: "#199e70" }} /> Participación
              </span>
            </div>
          </div>
          <p className="mb-4 text-sm text-slate-400">
            XP total de cada estudiante, desglosado entre certificados de cursos y participación de clase.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-2 py-2">Estudiante</th>
                  <th className="px-2 py-2 text-center">Nivel</th>
                  <th className="px-2 py-2 text-center">Cert.</th>
                  <th className="px-2 py-2 text-right tabular-nums" style={{ color: "#5aa0ec" }}>
                    XP cursos
                  </th>
                  <th className="px-2 py-2 text-right tabular-nums" style={{ color: "#2bbd88" }}>
                    XP part.
                  </th>
                  <th className="px-2 py-2 text-right tabular-nums text-white">Total</th>
                  <th className="px-2 py-2">Desglose</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r) => (
                  <tr key={r.userId} className="border-t border-white/5">
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{r.avatar}</span>
                        <span className="whitespace-nowrap font-medium text-white">
                          {r.name.split(" ").slice(0, 2).join(" ")}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      <span className="rounded-md bg-brand-500/20 px-2 py-0.5 text-xs font-bold text-brand-200">
                        {r.level}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-center text-slate-300">
                      {r.approved}/{totalCourses}
                    </td>
                    <td className="px-2 py-2.5 text-right font-semibold tabular-nums text-slate-200">
                      {r.courseXp}
                    </td>
                    <td className="px-2 py-2.5 text-right font-semibold tabular-nums text-slate-200">
                      {r.participationXp}
                    </td>
                    <td className="px-2 py-2.5 text-right font-black tabular-nums text-white">
                      {r.xp}
                    </td>
                    <td className="px-2 py-2.5">
                      <div
                        className="flex h-4 items-center gap-[2px] overflow-hidden rounded-full"
                        style={{ width: `${Math.max(6, (r.xp / maxXp) * 100)}%`, minWidth: 40 }}
                      >
                        {r.courseXp > 0 && (
                          <div
                            className="h-full rounded-l-full"
                            style={{
                              background: "#3987e5",
                              flexGrow: r.courseXp,
                            }}
                            title={`Cursos: ${r.courseXp} XP`}
                          />
                        )}
                        {r.participationXp > 0 && (
                          <div
                            className="h-full rounded-r-full"
                            style={{
                              background: "#199e70",
                              flexGrow: r.participationXp,
                            }}
                            title={`Participación: ${r.participationXp} XP`}
                          />
                        )}
                        {r.xp === 0 && (
                          <div className="h-full w-full rounded-full bg-white/5" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {ranking.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-2 py-6 text-center text-slate-400">
                      Aún no hay estudiantes registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Ruta de cursos */}
        <div className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Ruta de cursos</h2>
            {isTeacher && (
              <button
                onClick={addCourse}
                className="flex items-center gap-1 rounded-lg bg-brand-500/20 px-3 py-1.5 text-sm font-medium text-brand-200 hover:bg-brand-500/30"
              >
                <Plus size={16} /> Curso
              </button>
            )}
          </div>
          <div className="space-y-3">
            {courses.map((c, i) => (
              <CourseRow
                key={c._id}
                course={c}
                index={i}
                isTeacher={isTeacher}
                uploading={uploading === c._id}
                onPick={() => fileInputs.current[c._id]?.click()}
                onDelete={() => deleteCourse(c._id)}
                inputRef={(el) => {
                  fileInputs.current[c._id] = el;
                }}
                onFile={(f) => upload(c._id, f)}
              />
            ))}
            {courses.length === 0 && (
              <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
                Aún no hay cursos configurados.
              </p>
            )}
          </div>
        </div>

        {/* Ranking */}
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-xl font-bold text-white">Ranking de la clase 🥇</h2>
          <div className="glass rounded-2xl p-4">
            {ranking.length === 0 && (
              <p className="text-sm text-slate-400">Todavía no hay estudiantes registrados.</p>
            )}
            <ul className="space-y-2">
              {ranking.map((r, i) => (
                <motion.li
                  key={r.userId}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-3 rounded-xl p-2.5 ${
                    r.userId === myUserId ? "bg-brand-500/15 ring-1 ring-brand-400/40" : ""
                  }`}
                >
                  <span className="w-6 text-center text-sm font-black text-slate-400">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </span>
                  <span className="text-2xl">{r.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      {r.name.split(" ").slice(0, 2).join(" ")}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Nv {r.level} · {r.approved} cert. · {r.participationXp} part.
                    </p>
                  </div>
                  <span className="text-sm font-black text-brand-200">{r.xp}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseRow({
  course,
  index,
  isTeacher,
  uploading,
  onPick,
  onDelete,
  inputRef,
  onFile,
}: {
  course: CourseWithStatus;
  index: number;
  isTeacher: boolean;
  uploading: boolean;
  onPick: () => void;
  onDelete: () => void;
  inputRef: (el: HTMLInputElement | null) => void;
  onFile: (f: File) => void;
}) {
  const status = course.status;
  const badge =
    status === "approved"
      ? { icon: CheckCircle2, text: "Aprobado", cls: "text-emerald-300 bg-emerald-500/15" }
      : status === "pending"
      ? { icon: Clock, text: "En revisión", cls: "text-amber-300 bg-amber-500/15" }
      : status === "rejected"
      ? { icon: XCircle, text: "Rechazado", cls: "text-red-300 bg-red-500/15" }
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`glass rounded-2xl p-4 ${
        status === "approved" ? "ring-1 ring-emerald-500/30" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-magic-500/40 to-brand-500/40 text-lg">
          {status === "approved" ? "⭐" : "📘"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-white">{course.title}</p>
          <p className="text-xs text-slate-400">
            {course.platform} · +{course.xp} XP
          </p>
        </div>
        {badge && (
          <span
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.cls}`}
          >
            <badge.icon size={13} /> {badge.text}
          </span>
        )}
        {isTeacher && (
          <button
            onClick={onDelete}
            className="rounded-lg p-2 text-slate-500 hover:bg-red-500/15 hover:text-red-300"
            title="Eliminar curso"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {status === "rejected" && course.note && (
        <p className="mt-2 rounded-lg bg-red-500/10 p-2 text-xs text-red-200">
          Nota del profe: {course.note}
        </p>
      )}

      {!isTeacher && (
        <div className="mt-3 flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
          {status !== "approved" && (
            <button
              onClick={onPick}
              disabled={uploading}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-500 to-magic-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:scale-[1.02] disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Upload size={15} />
              )}
              {status ? "Reemplazar PDF" : "Subir certificado"}
            </button>
          )}
          {course.fileId && (
            <a
              href={`/api/files/${course.fileId}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10"
            >
              <FileText size={15} /> Ver PDF
            </a>
          )}
        </div>
      )}
    </motion.div>
  );
}
