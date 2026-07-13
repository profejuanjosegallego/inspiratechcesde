import { Code2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 px-4 py-5 text-center">
      <p className="flex flex-wrap items-center justify-center gap-1.5 text-sm text-slate-400">
        <Code2 size={15} className="text-brand-300" />
        Programado por
        <span className="font-semibold text-gradient">
          Mg. Profesor Juan José Gallego Mesa
        </span>
      </p>
      <p className="mt-1 text-xs text-slate-500">
        InspiraTech · Academia de Proyectos © 2026
      </p>
    </footer>
  );
}
