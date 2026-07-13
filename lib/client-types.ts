// Tipos serializados que usan los componentes de cliente.

export type StoryStatus = "todo" | "in_progress" | "done";

export interface Story {
  _id: string;
  week: number;
  order: number;
  title: string;
  role: string;
  description: string;
  code: string;
  codeLang: string;
  estimation: number;
  status: StoryStatus;
  acceptanceCriteria: { text: string; done: boolean }[];
  tutorial: string;
  tags: string[];
}

export interface ClientCourse {
  _id: string;
  title: string;
  platform: string;
  order: number;
  xp: number;
}
