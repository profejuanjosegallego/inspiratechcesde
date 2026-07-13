"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Rocket, Loader2, MailCheck } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "code">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function register(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo registrar");
      toast.success("Te enviamos un código a tu correo 📬");
      setStep("code");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Código incorrecto");
      toast.success("¡Cuenta activada! 🎉");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    try {
      const res = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      toast.success("Código reenviado 📬");
    } catch {
      toast.error("No se pudo reenviar el código");
    }
  }

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/40";

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

        <AnimatePresence mode="wait">
          {step === "form" ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h1 className="mt-6 text-2xl font-bold text-white">Crea tu cuenta</h1>
              <p className="mt-1 text-sm text-slate-400">Únete a la academia InspiraTech.</p>
              <form onSubmit={register} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    Nombre completo
                  </label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputCls}
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Correo</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls}
                    placeholder="tucorreo@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputCls}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-magic-500 px-4 py-3 font-bold text-white transition hover:scale-[1.02] disabled:opacity-60"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Rocket size={20} />}
                  Registrarme
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="code"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="mt-6 flex items-center gap-3">
                <MailCheck className="text-brand-300" size={28} />
                <h1 className="text-2xl font-bold text-white">Verifica tu correo</h1>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                Escribe el código de 6 dígitos que enviamos a <b>{email}</b>.
              </p>
              <form onSubmit={verify} className="mt-6 space-y-4">
                <input
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className={`${inputCls} text-center text-3xl tracking-[0.5em]`}
                  placeholder="______"
                  inputMode="numeric"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 font-bold text-white transition hover:scale-[1.02] disabled:opacity-60"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : "Activar cuenta"}
                </button>
              </form>
              <button
                onClick={resend}
                className="mt-4 w-full text-center text-sm text-brand-300 hover:underline"
              >
                Reenviar código
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-6 text-center text-sm text-slate-400">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-semibold text-brand-300 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
