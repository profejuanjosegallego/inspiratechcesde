"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Rocket, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar sesión");
      toast.success(`¡Hola, ${data.user.name}! 👋`);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass rounded-3xl p-8"
      >
        <Link href="/" className="text-2xl font-black text-gradient">
          InspiraTech 🚀
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-white">Bienvenido de nuevo</h1>
        <p className="mt-1 text-sm text-slate-400">Entra para seguir construyendo.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/40"
              placeholder="tucorreo@ejemplo.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/40"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-magic-500 px-4 py-3 font-bold text-white transition hover:scale-[1.02] disabled:opacity-60"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Rocket size={20} />}
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="font-semibold text-brand-300 hover:underline">
            Regístrate
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
