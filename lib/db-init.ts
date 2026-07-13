import { getDb } from "./mongodb";
import { hashPassword } from "./auth";
import { SEED_STORIES } from "./seed-stories";
import type { CourseDoc, StoryDoc, UserDoc } from "./types";

let initialized = false;

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

/**
 * Idempotente: crea índices y datos base solo si faltan.
 * Se llama de forma perezosa en cada request (barato tras la primera vez).
 */
export async function ensureSeed() {
  if (initialized) return;
  const db = await getDb();

  // ── Índices ──
  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("stories").createIndex({ week: 1, order: 1 }),
    db
      .collection("attendance")
      .createIndex({ userId: 1, classDate: 1 }, { unique: true }),
    db
      .collection("progress")
      .createIndex({ userId: 1, courseId: 1 }, { unique: true }),
    db.collection("courses").createIndex({ order: 1 }),
    db.collection("messages").createIndex({ createdAt: 1 }),
    db.collection("participation").createIndex({ userId: 1 }),
  ]);

  // ── Profesor ──
  const teacherEmail = (process.env.TEACHER_EMAIL || "").toLowerCase();
  if (teacherEmail) {
    const exists = await db.collection("users").findOne({ email: teacherEmail });
    if (!exists) {
      const teacher: UserDoc = {
        name: process.env.TEACHER_NAME || "Profe",
        email: teacherEmail,
        passwordHash: await hashPassword(process.env.TEACHER_PASSWORD || "profe1234"),
        role: "profesor",
        verified: true,
        avatar: "🧑‍🏫",
        createdAt: new Date(),
      };
      await db.collection("users").insertOne(teacher);
    }
  }

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
    await db.collection("stories").insertMany(docs);
  }

  // ── Cursos Platzi ──
  const courseCount = await db.collection("courses").countDocuments();
  if (courseCount === 0) {
    const now = new Date();
    await db
      .collection("courses")
      .insertMany(SEED_COURSES.map((c) => ({ ...c, createdAt: now })));
  }

  initialized = true;
}
