"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { X, Trash2, BookOpen, ChevronDown, CheckSquare, Square } from "lucide-react";
import type { Story, StoryStatus } from "@/lib/client-types";
import CodeBlock from "@/components/CodeBlock";
import MarkdownLite from "@/components/MarkdownLite";

const STATUS_LABEL: Record<StoryStatus, string> = {
  todo: "Por hacer",
  in_progress: "En proceso",
  done: "Terminado",
};

export default function StoryModal({
  story,
  isTeacher,
  onClose,
  onUpdate,
  onDelete,
}: {
  story: Story;
  isTeacher: boolean;
  onClose: () => void;
  onUpdate: (s: Story) => void;
  onDelete: (id: string) => void;
}) {
  const [showTutorial, setShowTutorial] = useState(false);
  const [saving, setSaving] = useState(false);

  const done = story.acceptanceCriteria.filter((c) => c.done).length;
  const total = story.acceptanceCriteria.length;

  async function toggleCriterion(index: number) {
    const criteria = story.acceptanceCriteria.map((c, i) =>
      i === index ? { ...c, done: !c.done } : c
    );
    const updated = { ...story, acceptanceCriteria: criteria };
    onUpdate(updated);
    try {
      await fetch(`/api/stories/${story._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acceptanceCriteria: criteria }),
      });
    } catch {
      toast.error("No se pudo guardar el criterio");
    }
  }

  async function changeStatus(status: StoryStatus) {
    const updated = { ...story, status };
    onUpdate(updated);
    await fetch(`/api/stories/${story._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    // reordenar posiciones lo maneja el tablero; aquí solo cambia la columna
  }

  async function remove() {
    if (!confirm("¿Eliminar esta historia?")) return;
    setSaving(true);
    const res = await fetch(`/api/stories/${story._id}`, { method: "DELETE" });
    setSaving(false);
    if (res.ok) {
      toast.success("Historia eliminada");
      onDelete(story._id);
    } else {
      toast.error("No se pudo eliminar");
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="my-8 w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0f172a] shadow-2xl"
        >
          {/* Encabezado */}
          <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-brand-500/20 px-2 py-0.5 text-xs font-bold text-brand-200">
                  Semana {story.week}
                </span>
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-semibold text-slate-300">
                  {story.estimation} pts
                </span>
                {story.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-magic-500/15 px-2 py-0.5 text-xs text-magic-400"
                  >
                    #{t}
                  </span>
                ))}
              </div>
              <h2 className="text-xl font-black text-white">{story.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="max-h-[70vh] space-y-6 overflow-y-auto p-5">
            {/* Descripción */}
            <section>
              <p className="text-sm leading-relaxed text-slate-200">
                <span className="font-semibold text-brand-300">{story.role}</span>{" "}
                {story.description}
              </p>
            </section>

            {/* Estado / mover */}
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Estado
              </p>
              <div className="flex flex-wrap gap-2">
                {(["todo", "in_progress", "done"] as StoryStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => changeStatus(st)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      story.status === st
                        ? "bg-gradient-to-r from-brand-500 to-magic-500 text-white"
                        : "bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {STATUS_LABEL[st]}
                  </button>
                ))}
              </div>
            </section>

            {/* Criterios de aceptación */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Criterios de aceptación
                </p>
                <span className="text-xs font-semibold text-emerald-300">
                  {done}/{total} ✓
                </span>
              </div>
              <ul className="space-y-2">
                {story.acceptanceCriteria.map((c, i) => (
                  <li key={i}>
                    <button
                      onClick={() => toggleCriterion(i)}
                      className="flex w-full items-start gap-2 rounded-lg p-2 text-left transition hover:bg-white/5"
                    >
                      {c.done ? (
                        <CheckSquare className="mt-0.5 shrink-0 text-emerald-400" size={18} />
                      ) : (
                        <Square className="mt-0.5 shrink-0 text-slate-500" size={18} />
                      )}
                      <span
                        className={`text-sm ${
                          c.done ? "text-slate-400 line-through" : "text-slate-200"
                        }`}
                      >
                        {c.text}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            {/* Código guía */}
            {story.code && (
              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Código de apoyo
                </p>
                <CodeBlock code={story.code} lang={story.codeLang} />
              </section>
            )}

            {/* Mini-tutorial colapsable */}
            {story.tutorial && (
              <section>
                <button
                  onClick={() => setShowTutorial((v) => !v)}
                  className="flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-brand-500/20 to-magic-500/10 px-4 py-3 text-left transition hover:from-brand-500/30"
                >
                  <span className="flex items-center gap-2 font-semibold text-white">
                    <BookOpen size={18} className="text-brand-300" /> Mini-tutorial paso a paso
                  </span>
                  <motion.span animate={{ rotate: showTutorial ? 180 : 0 }}>
                    <ChevronDown size={18} className="text-slate-300" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {showTutorial && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-4">
                        <MarkdownLite content={story.tutorial} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            )}

            {isTeacher && (
              <div className="border-t border-white/10 pt-4">
                <button
                  onClick={remove}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-red-500/15 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/25 disabled:opacity-50"
                >
                  <Trash2 size={16} /> Eliminar historia
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
