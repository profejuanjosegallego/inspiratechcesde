"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Send, Trash2, GraduationCap } from "lucide-react";
import type { ChatMessage } from "@/lib/client-types";

function fmtTime(iso: string) {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export default function ChatClient({
  initialMessages,
  currentUserId,
  isTeacher,
}: {
  initialMessages: ChatMessage[];
  currentUserId: string;
  isTeacher: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    endRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, [scrollToBottom]);

  // Sondeo: cada 4s trae los mensajes nuevos.
  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const last = messages[messages.length - 1];
        const url = last ? `/api/messages?since=${encodeURIComponent(last.createdAt)}` : "/api/messages";
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (!active || !data.messages?.length) return;
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m._id));
          const fresh = (data.messages as ChatMessage[]).filter((m) => !ids.has(m._id));
          return fresh.length ? [...prev, ...fresh] : prev;
        });
      } catch {
        /* red intermitente: reintenta en el próximo tick */
      }
    };
    const t = setInterval(poll, 4000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [messages]);

  // Auto-scroll cuando llegan mensajes (si el usuario está cerca del fondo).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
    if (nearBottom) scrollToBottom();
  }, [messages, scrollToBottom]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const clean = text.trim();
    if (!clean || sending) return;
    setSending(true);
    setText("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo enviar");
      setMessages((prev) =>
        prev.some((m) => m._id === data.message._id) ? prev : [...prev, data.message]
      );
      setTimeout(() => scrollToBottom(), 50);
    } catch (err) {
      toast.error((err as Error).message);
      setText(clean);
    } finally {
      setSending(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("¿Borrar este mensaje?")) return;
    const prev = messages;
    setMessages((m) => m.filter((x) => x._id !== id));
    const res = await fetch(`/api/messages/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setMessages(prev);
      toast.error("No se pudo borrar");
    }
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] min-h-[24rem] flex-col">
      <div className="mb-4">
        <h1 className="text-3xl font-black text-white">Pregúntale al Profe 💬</h1>
        <p className="mt-1 text-slate-300">
          Chat del grupo: los 7 estudiantes y el profe. Pregunta lo que necesites, ¡todos aprenden juntos!
        </p>
      </div>

      {/* Mensajes */}
      <div
        ref={scrollRef}
        className="glass no-scrollbar flex-1 space-y-3 overflow-y-auto rounded-2xl p-4"
      >
        {messages.length === 0 && (
          <div className="grid h-full place-items-center text-center">
            <div>
              <div className="text-5xl">👋</div>
              <p className="mt-3 text-slate-400">
                Aún no hay mensajes. ¡Rompe el hielo con la primera pregunta!
              </p>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const mine = m.userId === currentUserId;
            const teacher = m.role === "profesor";
            const canDelete = mine || isTeacher;
            return (
              <motion.div
                key={m._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`group flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg ${
                    teacher ? "bg-gradient-to-br from-yellow-400 to-amber-500" : "bg-white/10"
                  }`}
                  title={m.name}
                >
                  {m.avatar}
                </span>

                <div className={`max-w-[75%] ${mine ? "items-end text-right" : ""}`}>
                  <div className="mb-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                    <span className={`font-semibold ${teacher ? "text-amber-300" : "text-slate-300"}`}>
                      {mine ? "Tú" : m.name.split(" ")[0]}
                    </span>
                    {teacher && (
                      <span className="flex items-center gap-0.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                        <GraduationCap size={11} /> Profe
                      </span>
                    )}
                    <span>· {fmtTime(m.createdAt)}</span>
                  </div>
                  <div
                    className={`inline-block whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm ${
                      mine
                        ? "bg-gradient-to-br from-brand-500 to-magic-500 text-white"
                        : teacher
                        ? "bg-amber-500/15 text-amber-50 ring-1 ring-amber-500/30"
                        : "bg-white/10 text-slate-100"
                    }`}
                  >
                    {m.text}
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => remove(m._id)}
                      className="ml-2 align-middle text-slate-600 opacity-0 transition group-hover:opacity-100 hover:text-red-400"
                      title="Borrar"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Escribir */}
      <form onSubmit={send} className="mt-3 flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(e as unknown as React.FormEvent);
            }
          }}
          rows={1}
          placeholder="Escribe tu pregunta…  (Enter para enviar, Shift+Enter para salto de línea)"
          className="max-h-32 flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/40"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-r from-brand-500 to-magic-500 text-white transition hover:scale-105 disabled:opacity-50"
          aria-label="Enviar"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
