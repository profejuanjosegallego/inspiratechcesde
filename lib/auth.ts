import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { SessionUser } from "./types";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-cambia-esto"
);
const COOKIE = "inspiratech_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 días

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createToken(user: SessionUser) {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as SessionUser["role"],
      avatar: payload.avatar as string,
    };
  } catch {
    return null;
  }
}

export async function setSession(user: SessionUser) {
  const token = await createToken(user);
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export const SESSION_COOKIE = COOKIE;

// Genera un código de verificación de 6 dígitos
export function makeCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
