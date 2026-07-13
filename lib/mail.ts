import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 465);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || `InspiraTech <${user}>`;

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // 465 = SSL
      auth: { user, pass },
    });
  }
  return transporter;
}

function shell(title: string, body: string) {
  return `
  <div style="margin:0;padding:32px 0;background:#0b1020;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#111827;border:1px solid #1f2937;border-radius:20px;overflow:hidden;">
      <div style="padding:28px 32px;background:linear-gradient(90deg,#4f46e5,#d946ef);">
        <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:.5px;">🚀 InspiraTech</h1>
        <p style="margin:6px 0 0;color:#e9d5ff;font-size:13px;">Academia de proyectos · Globant</p>
      </div>
      <div style="padding:32px;color:#e5e7eb;">
        <h2 style="margin:0 0 12px;font-size:18px;color:#fff;">${title}</h2>
        ${body}
      </div>
      <div style="padding:18px 32px;background:#0f172a;color:#64748b;font-size:12px;">
        Si no reconoces este mensaje, puedes ignorarlo. — Equipo InspiraTech
      </div>
    </div>
  </div>`;
}

export async function sendVerificationEmail(to: string, name: string, code: string) {
  const body = `
    <p>¡Hola <b>${name}</b>! Bienvenido/a a la academia. Para activar tu cuenta usa este código:</p>
    <div style="margin:24px 0;text-align:center;">
      <span style="display:inline-block;padding:16px 28px;font-size:34px;letter-spacing:10px;font-weight:800;color:#fff;background:#1e293b;border:1px dashed #6366f1;border-radius:14px;">${code}</span>
    </div>
    <p style="color:#94a3b8;font-size:13px;">El código vence en 30 minutos.</p>`;
  await getTransporter().sendMail({
    from,
    to,
    subject: `Tu código InspiraTech: ${code}`,
    html: shell("Verifica tu cuenta ✨", body),
  });
}

export async function sendWelcomeEmail(to: string, name: string) {
  const body = `
    <p>¡Tu cuenta quedó activa, <b>${name}</b>! 🎉</p>
    <p>Ya puedes entrar, mover Historias de Usuario en el tablero, registrar tu asistencia y subir tus certificados de Platzi para subir de nivel.</p>
    <p style="margin-top:20px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login"
         style="display:inline-block;padding:12px 22px;background:linear-gradient(90deg,#4f46e5,#d946ef);color:#fff;text-decoration:none;border-radius:12px;font-weight:700;">
        Entrar a InspiraTech
      </a>
    </p>`;
  await getTransporter().sendMail({
    from,
    to,
    subject: "¡Bienvenido/a a InspiraTech! 🚀",
    html: shell("Cuenta activada 🎮", body),
  });
}
