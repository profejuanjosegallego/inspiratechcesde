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
} from "lucide-react";
import type { RankRow } from "@/lib/leaderboard";
import type { CourseWithStatus } from "@/app/(app)/progreso/page";

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
  level,
  myRank,
  myUserId,
}: {
  isTeacher: boolean;
  courses: CourseWithStatus[];
  ranking: RankRow[];
  level: LevelData;
  myRank: number;
  myUserId: string;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

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
                      Nv {r.level} · {r.title} · {r.approved} cert.
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
