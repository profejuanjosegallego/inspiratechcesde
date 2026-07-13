"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0b1020]">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-3 py-1.5">
        <span className="font-mono text-xs uppercase tracking-wide text-slate-400">
          {lang}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-300 transition hover:bg-white/10"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}
