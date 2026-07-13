import { getDb } from "@/lib/mongodb";
import { ensureSeed } from "@/lib/db-init";
import { hashPassword, makeCode } from "@/lib/auth";
import { handler, json, fail } from "@/lib/api";
import { sendVerificationEmail } from "@/lib/mail";
import type { UserDoc } from "@/lib/types";

const AVATARS = ["🦊", "🐼", "🦁", "🐯", "🐸", "🦉", "🐵", "🐨", "🦄", "🐲", "🦅", "🐺"];

export const POST = handler(async (req) => {
  await ensureSeed();
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return fail("Faltan datos (nombre, correo y contraseña).");
  }
  if (String(password).length < 6) {
    return fail("La contraseña debe tener al menos 6 caracteres.");
  }
  const mail = String(email).toLowerCase().trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) {
    return fail("El correo no tiene un formato válido.");
  }

  const db = await getDb();
  const existing = await db.collection<UserDoc>("users").findOne({ email: mail });
  if (existing && existing.verified) {
    return fail("Ese correo ya está registrado. Inicia sesión.", 409);
  }

  const code = makeCode();
  const expires = new Date(Date.now() + 30 * 60 * 1000);

  if (existing && !existing.verified) {
    // Reenviar código y actualizar datos
    await db.collection<UserDoc>("users").updateOne(
      { _id: existing._id },
      {
        $set: {
          name,
          passwordHash: await hashPassword(password),
          verificationCode: code,
          verificationExpires: expires,
        },
      }
    );
  } else {
    const user: UserDoc = {
      name,
      email: mail,
      passwordHash: await hashPassword(password),
      role: "estudiante",
      verified: false,
      verificationCode: code,
      verificationExpires: expires,
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      createdAt: new Date(),
    };
    await db.collection<UserDoc>("users").insertOne(user);
  }

  try {
    await sendVerificationEmail(mail, name, code);
  } catch (e) {
    console.error("Error enviando correo:", e);
    return fail(
      "No pudimos enviar el correo de verificación. Revisa el correo o inténtalo de nuevo."
    );
  }

  return json({ ok: true, email: mail });
});
