import { getDb } from "./mongodb";
import { hashPassword } from "./auth";
import { SEED_STORIES } from "./seed-stories";
import type { CourseDoc, StoryDoc, UserDoc } from "./types";

// Cacheamos la promesa del sembrado para que, si varias requests llegan a la
// vez a una instancia recién arrancada, TODAS esperen la MISMA ejecución en
// lugar de sembrar en paralelo (lo que causaría carreras y errores 500).
let seedPromise: Promise<void> | null = null;

// Cursos de Platzi de ejemplo. El profe puede editarlos/agregar más desde la app.
const SEED_COURSES: Omit<CourseDoc, "_id" | "createdAt">[] = [
  { title: "Curso de Introducción a la Web", platform: "Platzi", order: 1, xp: 100 },
  { title: "Curso de HTML y CSS", platform: "Platzi", order: 2, xp: 100 },
  { title: "Curso de Frontend con Bootstrap", platform: "Platzi", order: 3, xp: 120 },
  { title: "Curso de JavaScript", platform: "Platzi", order: 4, xp: 150 },
  { title: "Curso de Python", platform: "Platzi", order: 5, xp: 150 },
  { title: "Curso de Backend con FastAPI", platform: "Platzi", order: 6, xp: 180 },
  { title: "Curso de Bases de Datos con MongoDB", platform: "Platzi", order: 7, xp: 180 },
];

// ¿Es un error de "clave duplicada" (E11000)? Ocurre si dos requests intentan
// crear el mismo usuario/dato a la vez: es inofensivo, el dato ya quedó creado.
function isDuplicateKey(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: number }).code === 11000;
}

// Inserta un usuario semilla ignorando la carrera de "clave duplicada".
async function seedUser(user: UserDoc) {
  const db = await getDb();
  const exists = await db.collection("users").findOne({ email: user.email });
  if (exists) return;
  try {
    await db.collection("users").insertOne(user);
  } catch (e) {
    if (!isDuplicateKey(e)) throw e; // otra request lo creó primero → ok
  }
}

/**
 * Idempotente y a prueba de carreras: crea índices y datos base solo si faltan.
 * Se llama de forma perezosa en cada request; tras la primera vez es instantáneo
 * (devuelve la promesa ya resuelta). Si falla, se reintenta en la siguiente.
 */
export function ensureSeed(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed().catch((e) => {
      seedPromise = null; // permite reintentar en la próxima request
      throw e;
    });
  }
  return seedPromise;
}

async function runSeed() {
  const db = await getDb();

  // ── Índices ── (createIndex es idempotente y seguro en concurrencia)
  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("stories").createIndex({ week: 1, order: 1 }),
    db.collection("attendance").createIndex({ userId: 1, classDate: 1 }, { unique: true }),
    db.collection("progress").createIndex({ userId: 1, courseId: 1 }, { unique: true }),
    db.collection("courses").createIndex({ order: 1 }),
    db.collection("messages").createIndex({ createdAt: 1 }),
    db.collection("participation").createIndex({ userId: 1 }),
  ]);

  // ── Profesor ──
  const teacherEmail = (process.env.TEACHER_EMAIL || "").toLowerCase();
  if (teacherEmail) {
    await seedUser({
      name: process.env.TEACHER_NAME || "Profe",
      email: teacherEmail,
      passwordHash: await hashPassword(process.env.TEACHER_PASSWORD || "profe1234"),
      role: "profesor",
      verified: true,
      avatar: "🧑‍🏫",
      createdAt: new Date(),
    });
  }

  // ── Cuenta de Coordinación (solo lectura) ──
  // Credenciales sencillas por defecto: usuario "admin" / contraseña "admin".
  // Se pueden sobreescribir con COORD_EMAIL / COORD_NAME / COORD_PASSWORD.
  await seedUser({
    name: process.env.COORD_NAME || "Coordinación",
    email: (process.env.COORD_EMAIL || "admin").toLowerCase(),
    passwordHash: await hashPassword(process.env.COORD_PASSWORD || "admin"),
    role: "coordinacion",
    verified: true,
    avatar: "🧭",
    createdAt: new Date(),
  });

  // ── Historias de Usuario ──
  const storyCount = await db.collection("stories").countDocuments();
  if (storyCount === 0) {
    const now = new Date();
    const docs: StoryDoc[] = SEED_STORIES.map((s, i) => ({
      ...s,
      status: "todo",
      order: i,
      createdAt: now,
      updatedAt: now,
    }));
    try {
      await db.collection("stories").insertMany(docs, { ordered: false });
    } catch (e) {
      if (!isDuplicateKey(e)) throw e;
    }
  }

  // ── Cursos Platzi ──
  const courseCount = await db.collection("courses").countDocuments();
  if (courseCount === 0) {
    const now = new Date();
    try {
      await db.collection("courses").insertMany(
        SEED_COURSES.map((c) => ({ ...c, createdAt: now })),
        { ordered: false }
      );
    } catch (e) {
      if (!isDuplicateKey(e)) throw e;
    }
  }
}
