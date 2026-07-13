// Personaje que sube de nivel según la XP acumulada (certificados aprobados).

export const LEVELS = [
  { level: 1, title: "Novato", emoji: "🐣", min: 0 },
  { level: 2, title: "Aprendiz", emoji: "🐤", min: 150 },
  { level: 3, title: "Explorador", emoji: "🦊", min: 350 },
  { level: 4, title: "Constructor", emoji: "🛠️", min: 600 },
  { level: 5, title: "Hacker Jr.", emoji: "🥷", min: 900 },
  { level: 6, title: "Dev Pro", emoji: "🧙", min: 1300 },
  { level: 7, title: "Maestro InspiraTech", emoji: "🏆", min: 1800 },
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
