import { getDb } from "@/lib/mongodb";
import { setSession } from "@/lib/auth";
import { handler, json, fail } from "@/lib/api";
import { sendWelcomeEmail } from "@/lib/mail";
import type { UserDoc } from "@/lib/types";

export const POST = handler(async (req) => {
  const { email, code } = await req.json();
  if (!email || !code) return fail("Falta el correo o el código.");

  const mail = String(email).toLowerCase().trim();
  const db = await getDb();
  const user = await db.collection<UserDoc>("users").findOne({ email: mail });

  if (!user) return fail("No encontramos esa cuenta.", 404);
  if (user.verified) return fail("La cuenta ya está verificada. Inicia sesión.");
  if (user.verificationCode !== String(code).trim()) {
    return fail("El código no es correcto.");
  }
  if (user.verificationExpires && new Date(user.verificationExpires) < new Date()) {
    return fail("El código venció. Pide uno nuevo.");
  }

  await db.collection<UserDoc>("users").updateOne(
    { _id: user._id },
    { $set: { verified: true }, $unset: { verificationCode: "", verificationExpires: "" } }
  );

  const session = {
    id: user._id!.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
  };
  await setSession(session);

  sendWelcomeEmail(mail, user.name).catch((e) => console.error("welcome mail:", e));

  return json({ ok: true, user: session });
});
