"use client";

import React from "react";

// Renderizador sencillo para los mini-tutoriales: soporta ## títulos,
// listas (- / 1.), bloques de código ``` y **negrita**.
function renderInline(text: string, keyBase: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={`${keyBase}-b${i}`} className="font-semibold text-white">
          {p.slice(2, -2)}
        </strong>
      );
    }
    if (p.startsWith("`") && p.endsWith("`")) {
      return (
        <code
          key={`${keyBase}-c${i}`}
          className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em] text-brand-200"
        >
          {p.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={`${keyBase}-t${i}`}>{p}</React.Fragment>;
  });
}

export default function MarkdownLite({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length) {
      blocks.push(
        <ul key={`ul-${i}`} className="my-2 ml-4 list-disc space-y-1 text-slate-300">
          {listBuffer.map((li, idx) => (
            <li key={idx}>{renderInline(li, `li-${i}-${idx}`)}</li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      flushList();
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      blocks.push(
        <pre
          key={`pre-${i}`}
          className="my-3 overflow-x-auto rounded-xl bg-black/40 p-3 font-mono text-sm text-emerald-200"
        >
          {code.join("\n")}
        </pre>
      );
      i++;
      continue;
    }

    if (line.startsWith("## ")) {
      flushList();
      blocks.push(
        <h4 key={`h-${i}`} className="mt-4 mb-1 text-base font-bold text-white">
          {renderInline(line.slice(3), `h-${i}`)}
        </h4>
      );
    } else if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      listBuffer.push(line.replace(/^\s*[-*]\s+/, "").replace(/^\s*\d+\.\s+/, ""));
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      blocks.push(
        <p key={`p-${i}`} className="my-2 text-sm leading-relaxed text-slate-300">
          {renderInline(line, `p-${i}`)}
        </p>
      );
    }
    i++;
  }
  flushList();

  return <div>{blocks}</div>;
}
