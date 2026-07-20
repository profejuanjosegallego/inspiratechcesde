"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  KanbanSquare,
  Trophy,
  CalendarCheck,
  MessageCircle,
  ShieldCheck,
  ClipboardList,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import type { SessionUser } from "@/lib/types";

const links = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/tablero", label: "Tablero HU", icon: KanbanSquare },
  { href: "/progreso", label: "Progreso", icon: Trophy },
  { href: "/asistencia", label: "Asistencia", icon: CalendarCheck },
  { href: "/chat", label: "Pregúntale al Profe", icon: MessageCircle },
];

export default function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Coordinación es solo lectura: únicamente ve su panel. Los demás roles ven
  // las secciones del estudiante (+ Panel/Coordinación si es profe).
  let nav: { href: string; label: string; icon: typeof LayoutDashboard }[];
  if (user.role === "coordinacion") {
    nav = [{ href: "/coordinacion", label: "Coordinación", icon: ClipboardList }];
  } else {
    nav = [...links];
    if (user.role === "profesor") {
      nav.push({ href: "/panel", label: "Panel Profe", icon: ShieldCheck });
      nav.push({ href: "/coordinacion", label: "Coordinación", icon: ClipboardList });
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const NavItems = ({ onClick }: { onClick?: () => void }) => (
    <>
      {nav.map((l) => {
        const active = pathname === l.href || pathname.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onClick}
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-gradient-to-r from-brand-500/30 to-magic-500/20 text-white ring-1 ring-brand-400/40"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <l.icon size={18} />
            {l.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex flex-1 flex-col">
      {/* Barra superior */}
      <header className="sticky top-0 z-40 glass border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-slate-300 hover:bg-white/10 md:hidden"
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>
            <Link href="/dashboard" className="text-xl font-black text-gradient">
              InspiraTech 🚀
            </Link>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            <NavItems />
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full glass px-3 py-1.5 sm:flex">
              <span className="text-xl">{user.avatar}</span>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-white">{user.name.split(" ")[0]}</p>
                <p className="text-[11px] capitalize text-brand-300">{user.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="rounded-xl p-2 text-slate-300 transition hover:bg-red-500/20 hover:text-red-300"
              title="Cerrar sesión"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Drawer móvil */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 24, stiffness: 220 }}
              className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col gap-2 bg-[#0f172a] p-4 md:hidden"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-lg font-black text-gradient">InspiraTech</span>
                <button onClick={() => setOpen(false)} className="p-2 text-slate-300">
                  <X size={22} />
                </button>
              </div>
              <NavItems onClick={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
