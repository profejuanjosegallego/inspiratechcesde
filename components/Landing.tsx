"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { KanbanSquare, Trophy, CalendarCheck, Rocket, Sparkles } from "lucide-react";

const features = [
  {
    icon: KanbanSquare,
    title: "Tablero de Historias",
    text: "Una HU por semana con código, criterios y mini-tutorial. Arrástralas de Por hacer a Terminado.",
    color: "from-brand-500 to-brand-700",
  },
  {
    icon: Trophy,
    title: "Progreso gamificado",
    text: "Sube tus certificados de Platzi, sube de nivel y compite en el ranking de la clase.",
    color: "from-magic-500 to-magic-600",
  },
  {
    icon: CalendarCheck,
    title: "Asistencia",
    text: "Registra tu llegada con la hora exacta. El profe valida para que nadie llegue tarde. ⏰",
    color: "from-emerald-500 to-teal-600",
  },
];

export default function Landing() {
  return (
    <main className="flex-1 overflow-hidden">
      {/* Emojis flotantes de fondo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
        {["🚀", "💡", "⚡", "🎯", "🧠", "🏆"].map((e, i) => (
          <motion.span
            key={i}
            className="absolute text-4xl md:text-6xl"
            style={{ left: `${10 + i * 15}%`, top: `${15 + (i % 3) * 25}%` }}
            animate={{ y: [0, -20, 0], rotate: [0, 8, -8, 0] }}
            transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut" }}
          >
            {e}
          </motion.span>
        ))}
      </div>

      <section className="relative mx-auto max-w-5xl px-6 pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm text-brand-200"
        >
          <Sparkles size={16} /> Academia de proyectos · Globant
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-6 text-5xl md:text-7xl font-black tracking-tight"
        >
          <span className="text-gradient">InspiraTech</span> 🚀
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mx-auto mt-5 max-w-2xl text-lg text-slate-300"
        >
          Construye tus 3 plataformas para Globant paso a paso. Historias de usuario
          semanales, progreso que sube de nivel y asistencia con validación. Todo en un solo lugar.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-magic-500 px-7 py-3.5 font-bold text-white shadow-lg shadow-brand-600/30 transition hover:scale-105"
          >
            <Rocket size={20} className="transition group-hover:-translate-y-0.5" />
            Crear mi cuenta
          </Link>
          <Link
            href="/login"
            className="rounded-2xl glass px-7 py-3.5 font-semibold text-slate-100 transition hover:bg-white/10"
          >
            Ya tengo cuenta
          </Link>
        </motion.div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="glass rounded-3xl p-6 transition hover:-translate-y-1 hover:bg-white/10"
            >
              <div
                className={`mb-4 inline-flex rounded-2xl bg-gradient-to-br ${f.color} p-3 text-white`}
              >
                <f.icon size={26} />
              </div>
              <h3 className="text-xl font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
