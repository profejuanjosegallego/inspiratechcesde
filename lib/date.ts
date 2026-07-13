const TZ = "America/Bogota";

/** Fecha de hoy en Colombia como YYYY-MM-DD. */
export function todayInBogota(d: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  return parts; // en-CA da formato YYYY-MM-DD
}

/** Hora legible (ej: 3:05 p. m.) en Colombia. */
export function timeInBogota(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/** Fecha larga legible (ej: lunes 13 de julio). */
export function longDateInBogota(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr + "T12:00:00") : new Date();
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}
