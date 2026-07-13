import { getDb } from "@/lib/mongodb";
import { ensureSeed } from "@/lib/db-init";
import { verifyPassword, setSession } from "@/lib/auth";
import { handler, json, fail } from "@/lib/api";
import type { UserDoc } from "@/lib/types";

export const POST = handler(async (req) => {
  await ensureSeed();
  const { email, password } = await req.json();
  if (!email || !password) return fail("Falta el correo o la contraseña.");

  const mail = String(email).toLowerCase().trim();
  const db = await getDb();
  const user = await db.collection<UserDoc>("users").findOne({ email: mail });

  if (!user) return fail("Correo o contraseña incorrectos.", 401);
  const okPass = await verifyPassword(password, user.passwordHash);
  if (!okPass) return fail("Correo o contraseña incorrectos.", 401);

  if (!user.verified) {
    return fail("Tu cuenta aún no está verificada. Revisa tu correo.", 403);
  }

  const session = {
    id: user._id!.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
  };
  await setSession(session);
  return json({ ok: true, user: session });
});
