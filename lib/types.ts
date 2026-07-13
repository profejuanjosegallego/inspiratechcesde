import type { ObjectId } from "mongodb";

export type Role = "profesor" | "estudiante";

export interface UserDoc {
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  verified: boolean;
  verificationCode?: string | null;
  verificationExpires?: Date | null;
  avatar: string; // emoji del personaje
  createdAt: Date;
}

export type StoryStatus = "todo" | "in_progress" | "done";

export interface AcceptanceCriterion {
  text: string;
  done: boolean;
}

export interface StoryDoc {
  _id?: ObjectId;
  week: number;
  order: number; // orden dentro de una columna
  title: string;
  role: string; // "Como <rol>"
  description: string; // "quiero ... para ..."
  code: string; // fragmento de código guía
  codeLang: string; // lenguaje para el resaltado
  estimation: number; // puntos de historia
  status: StoryStatus;
  acceptanceCriteria: AcceptanceCriterion[];
  tutorial: string; // mini-tutorial en markdown ligero
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseDoc {
  _id?: ObjectId;
  title: string;
  platform: string; // "Platzi"
  order: number;
  xp: number; // experiencia que otorga
  createdAt: Date;
}

export type ProgressStatus = "pending" | "approved" | "rejected";

export interface ProgressDoc {
  _id?: ObjectId;
  userId: ObjectId;
  courseId: ObjectId;
  status: ProgressStatus;
  fileId?: ObjectId | null; // GridFS del certificado PDF
  fileName?: string;
  note?: string; // comentario del profe si se rechaza
  uploadedAt: Date;
  validatedAt?: Date | null;
  validatedBy?: ObjectId | null;
}

export interface ParticipationDoc {
  _id?: ObjectId;
  userId: ObjectId;
  points: number;
  note?: string;
  sessionDate: string; // YYYY-MM-DD
  awardedBy: ObjectId;
  createdAt: Date;
}

export type AttendanceStatus = "pending" | "approved" | "rejected";

export interface AttendanceDoc {
  _id?: ObjectId;
  userId: ObjectId;
  classDate: string; // YYYY-MM-DD
  checkInAt: Date; // momento exacto de llegada
  status: AttendanceStatus;
  late: boolean;
  validatedBy?: ObjectId | null;
  validatedAt?: Date | null;
  note?: string;
}

// Objeto de sesión (payload del JWT)
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
}
