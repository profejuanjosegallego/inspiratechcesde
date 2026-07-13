import { getDb } from "@/lib/mongodb";
import { makeCode } from "@/lib/auth";
import { handler, json, fail } from "@/lib/api";
import { sendVerificationEmail } from "@/lib/mail";
import type { UserDoc } from "@/lib/types";

export const POST = handler(async (req) => {
  const { email } = await req.json();
  if (!email) return fail("Falta el correo.");
  const mail = String(email).toLowerCase().trim();

  const db = await getDb();
  const user = await db.collection<UserDoc>("users").findOne({ email: mail });
  if (!user) return fail("No encontramos esa cuenta.", 404);
  if (user.verified) return fail("La cuenta ya está verificada.");

  const code = makeCode();
  await db.collection<UserDoc>("users").updateOne(
    { _id: user._id },
    {
      $set: {
        verificationCode: code,
        verificationExpires: new Date(Date.now() + 30 * 60 * 1000),
      },
    }
  );
  await sendVerificationEmail(mail, user.name, code);
  return json({ ok: true });
});
