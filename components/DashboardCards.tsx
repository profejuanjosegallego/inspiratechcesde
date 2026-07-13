"use client";

import { motion } from "framer-motion";
import { ListTodo, Loader, CheckCircle2, Trophy } from "lucide-react";

type LevelInfo = {
  level: number;
  title: string;
  emoji: string;
  xp: number;
  progress: number;
  xpForNext: number;
  isMax: boolean;
};

export default function DashboardCards({
  role,
  stories,
  level,
  courses,
  attendance,
}: {
  role: string;
  stories: { todo: number; inProgress: number; done: number };
  level: LevelInfo;
  courses: { approved: number; total: number };
  attendance: { status: string; late: boolean } | null;
}) {
  const cards = [
    {
      label: "Por hacer",
      value: stories.todo,
      icon: ListTodo,
      color: "from-slate-500 to-slate-700",
    },
    {
      label: "En proceso",
      value: stories.inProgress,
      icon: Loader,
      color: "from-amber-500 to-orange-600",
    },
    {
      label: "Terminadas",
      value: stories.done,
      icon: CheckCircle2,
      color: "from-emerald-500 to-teal-600",
    },
    {
      label: "Certificados",
      value: `${courses.approved}/${courses.total}`,
      icon: Trophy,
      color: "from-magic-500 to-magic-600",
    },
  ];

  const attendanceLabel = !attendance
    ? { text: "Sin registrar hoy", color: "text-slate-400", emoji: "⚪" }
    : attendance.status === "approved"
    ? {
        text: attendance.late ? "Validada (tarde)" : "Validada ✔",
        color: attendance.late ? "text-amber-300" : "text-emerald-300",
        emoji: attendance.late ? "🟡" : "🟢",
      }
    : attendance.status === "rejected"
    ? { text: "Rechazada", color: "text-red-300", emoji: "🔴" }
    : { text: "Pendiente de validar", color: "text-brand-300", emoji: "🔵" };

  return (
    <div className="space-y-6">
      {/* Tarjeta de personaje / nivel */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass overflow-hidden rounded-3xl p-6"
      >
        <div className="flex items-center gap-5">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-magic-500 text-4xl shadow-lg"
          >
            {level.emoji}
          </motion.div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-brand-300">Nivel {level.level}</span>
              <span className="text-lg font-black text-white">{level.title}</span>
            </div>
            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${level.progress}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="relative h-full rounded-full bg-gradient-to-r from-brand-400 to-magic-400"
              >
                <span className="absolute inset-0 xp-shimmer" />
              </motion.div>
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              {level.isMax
                ? "¡Nivel máximo alcanzado! 🏆"
                : `${level.xp} XP · te faltan ${level.xpForNext} XP para el siguiente nivel`}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
            className="glass rounded-2xl p-4"
          >
            <div
              className={`mb-3 inline-flex rounded-xl bg-gradient-to-br ${c.color} p-2 text-white`}
            >
              <c.icon size={18} />
            </div>
            <p className="text-2xl font-black text-white">{c.value}</p>
            <p className="text-xs text-slate-400">{c.label}</p>
          </motion.div>
        ))}

        {/* Asistencia de hoy */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-4"
        >
          <div className="mb-3 inline-flex rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 p-2 text-white text-lg leading-none">
            {attendanceLabel.emoji}
          </div>
          <p className={`text-sm font-bold ${attendanceLabel.color}`}>{attendanceLabel.text}</p>
          <p className="text-xs text-slate-400">Asistencia hoy</p>
        </motion.div>
      </div>

      {role === "profesor" && (
        <p className="text-sm text-brand-300">
          👉 Entra al <b>Panel Profe</b> para validar asistencias y certificados.
        </p>
      )}
    </div>
  );
}
