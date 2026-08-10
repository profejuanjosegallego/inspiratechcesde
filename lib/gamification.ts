// Personaje que sube de nivel según la XP acumulada (certificados aprobados).

// Escala calibrada sobre la ruta real del plan de estudios: 28 cursos × 100 XP
// = 2800 XP. El nivel máximo se alcanza al completar la ruta completa (la
// participación en clase suma aparte y puede adelantarlo).
export const LEVELS = [
  { level: 1, title: "Novato", emoji: "🐣", min: 0 },
  { level: 2, title: "Aprendiz", emoji: "🐤", min: 300 },
  { level: 3, title: "Explorador", emoji: "🦊", min: 700 },
  { level: 4, title: "Constructor", emoji: "🛠️", min: 1100 },
  { level: 5, title: "Hacker Jr.", emoji: "🥷", min: 1600 },
  { level: 6, title: "Dev Pro", emoji: "🧙", min: 2100 },
  { level: 7, title: "Maestro InspiraTech", emoji: "🏆", min: 2800 },
];

export function levelInfo(xp: number) {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.min) current = l;
  }
  const next = LEVELS.find((l) => l.min > xp);
  const floor = current.min;
  const ceil = next ? next.min : current.min;
  const span = ceil - floor || 1;
  const progress = next ? Math.min(100, Math.round(((xp - floor) / span) * 100)) : 100;
  return {
    ...current,
    xp,
    next,
    xpForNext: next ? next.min - xp : 0,
    progress,
    isMax: !next,
  };
}
