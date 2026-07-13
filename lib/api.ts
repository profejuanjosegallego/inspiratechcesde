import { NextResponse } from "next/server";
import { getSession } from "./auth";
import { ensureSeed } from "./db-init";
import type { SessionUser } from "./types";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Convierte ObjectId/Date de Mongo en algo seguro para JSON, recursivamente. */
export function serialize<T = unknown>(input: unknown): T {
  const walk = (value: unknown): unknown => {
    if (value === null || value === undefined) return value;
    // ObjectId: tiene el método toHexString
    if (typeof (value as { toHexString?: unknown }).toHexString === "function") {
      return (value as { toHexString: () => string }).toHexString();
    }
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map(walk);
    if (typeof value === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        out[k] = walk(v);
      }
      return out;
    }
    return value;
  };
  return walk(input) as T;
}

/** Requiere una sesión válida. Lanza una Response si no hay. */
export async function requireUser(): Promise<SessionUser> {
  await ensureSeed();
  const user = await getSession();
  if (!user) {
    throw fail("No autorizado. Inicia sesión.", 401);
  }
  return user;
}

/** Requiere que la sesión sea del profesor. */
export async function requireTeacher(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "profesor") {
    throw fail("Solo el profe puede hacer esto.", 403);
  }
  return user;
}

/** Envuelve un handler para atrapar las Response lanzadas por los guardias. */
export function handler(
  fn: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    try {
      return await fn(req);
    } catch (e) {
      if (e instanceof Response) return e;
      console.error(e);
      return fail("Error interno del servidor.", 500);
    }
  };
}
