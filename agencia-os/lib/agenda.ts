// Fechas de la Agenda como claves "YYYY-MM-DD" en hora de Madrid. Trabajar con
// claves de día (y no con Date locales) evita que un cambio de horario o la zona
// horaria del servidor muevan algo de día.

export const AGENDA_TIME_ZONE = "Europe/Madrid";

export function dayKey(value: Date | string, timeZone = AGENDA_TIME_ZONE) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone }).format(new Date(value));
}

const fromKey = (key: string) => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
};

const toKey = (date: Date) => date.toISOString().slice(0, 10);

export function addDays(key: string, amount: number) {
  const date = fromKey(key);
  date.setUTCDate(date.getUTCDate() + amount);
  return toKey(date);
}

export function addMonths(key: string, amount: number) {
  const date = fromKey(key);
  return toKey(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1, 12)));
}

// Semanas de lunes a domingo.
export function startOfWeekKey(key: string) {
  return addDays(key, -((fromKey(key).getUTCDay() + 6) % 7));
}

export function weekKeys(key: string) {
  const start = startOfWeekKey(key);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

// Las 6 semanas que muestra la vista de mes.
export function monthGridKeys(key: string) {
  const start = startOfWeekKey(`${key.slice(0, 7)}-01`);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export function formatDayKey(key: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("es-ES", { ...options, timeZone: "UTC" }).format(fromKey(key));
}

export function formatTime(value: Date | string) {
  return new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: AGENDA_TIME_ZONE }).format(new Date(value));
}

export const isDayKey = (value: string | undefined): value is string => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(fromKey(value).getTime()));
