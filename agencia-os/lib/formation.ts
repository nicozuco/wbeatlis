import { addDays, startOfWeekKey } from "./agenda";
import recordingEntries from "./formation-recordings.json";
import datedSessions from "./formation-sessions.json";

// Programa publicado en el temario de MKT Hackers (agosto de 2026 a enero de 2027).
// Las dos tutorías no tienen fecha de fin en el documento y se generan por semana.
export const formationPrograms = [
  { id: "agents-tutoring", name: "Tutoría · Agentes IA", mentor: "Adrián Gallardo", level: "Inicial y avanzado", weekday: 0, time: "11:00", recurring: true },
  { id: "sales", name: "Masterclass de ventas", mentor: "Amaia Uceda", level: "Inicial y avanzado", weekday: 0, time: "17:00", recurring: false },
  { id: "agency", name: "Lanza tu Agencia IA", mentor: "Lautaro Ferrari", level: "Inicial y avanzado", weekday: 0, time: "19:00", recurring: false },
  { id: "agents-initial", name: "Agentes IA comerciales", mentor: "Adrián Gallardo", level: "Inicial", weekday: 1, time: "11:00", recurring: false },
  { id: "content-ai", name: "Contenido con IA", mentor: "Saúl Abreu", level: "Inicial y avanzado", weekday: 1, time: "19:00", recurring: false },
  { id: "claude", name: "Claude para emprendedores y negocios", mentor: "Adrián Gallardo", level: "Inicial y avanzado", weekday: 2, time: "11:00", recurring: false },
  { id: "mindset", name: "La cadena invisible · mentalidad de negocio", mentor: "Lidia Mullor", level: "Inicial y avanzado", weekday: 2, time: "17:00", recurring: false },
  { id: "automation-initial", name: "Automatización de procesos con IA", mentor: "Adrián Gallardo", level: "Inicial", weekday: 2, time: "19:00", recurring: false },
  { id: "agents-advanced", name: "Agentes IA comerciales", mentor: "Saúl Abreu", level: "Avanzado", weekday: 3, time: "11:00", recurring: false },
  { id: "automation-advanced", name: "Automatización de procesos con IA", mentor: "Luis Sastre Roca", level: "Avanzado", weekday: 3, time: "19:00", recurring: false },
  { id: "business-tutoring", name: "Tutoría · Negocio y publicidad", mentor: "Lautaro Ferrari", level: "Inicial y avanzado", weekday: 4, time: "13:00", recurring: true },
  { id: "meta-ads", name: "Meta Ads", mentor: "Lautaro Ferrari", level: "Inicial y avanzado", weekday: 4, time: "15:00", recurring: false },
] as const;

export type FormationProgram = (typeof formationPrograms)[number];
export type FormationProgramId = FormationProgram["id"];
export const formationProgramById = Object.fromEntries(formationPrograms.map((program) => [program.id, program])) as Record<FormationProgramId, FormationProgram>;

export const formationMentors: Record<FormationProgram["mentor"], { specialty: string; bio: string; profile: string | null }> = {
  "Adrián Gallardo": { specialty: "Automatizaciones y agentes de IA", bio: "Construye, conecta y entrega agentes de IA para negocios reales con WhatsApp, CRMs y más.", profile: "@adriangallardobenitez" },
  "Amaia Uceda": { specialty: "Ventas y cierre", bio: "Más de 10 años en ventas y más de 5 M€ facturados como closer, según el temario.", profile: "@amaia_uceda" },
  "Lautaro Ferrari": { specialty: "Captación de clientes", bio: "Enseña a vender servicios de IA desde el inicio con Meta Ads, incluso sin dominar la parte técnica.", profile: "@lautaro.ferrari_marketing" },
  "Saúl Abreu": { specialty: "Agentes IA comerciales avanzados y agencia de contenido", bio: "Sistemas de contenido viral y escalado orgánico rentable.", profile: "in/saulabreu" },
  "Luis Sastre Roca": { specialty: "Data Science e IA aplicada", bio: "Data Scientist e ingeniero de software con más de ocho años aplicando Python, machine learning y transformación digital.", profile: "in/luisastre" },
  "Lidia Mullor": { specialty: "Mentalidad de negocio", bio: "Educadora emocional que trabaja la gestión emocional, el enfoque y la toma de decisiones del emprendedor.", profile: null },
};

export type FormationSession = {
  id: string;
  programId: FormationProgramId;
  date: string;
  topic: string;
  cycle: number | null;
  sequence: number | null;
  cancelled: boolean;
  sourcePage: number | null;
  recurring: boolean;
  recording: FormationRecording | null;
};

export type FormationRecording = { title: string; url: string };

const formationRecordingById = new Map<string, FormationRecording>(recordingEntries.map(({ programId, date, title, url }) => [
  `${programId}-${date}`,
  { title, url },
]));

const publishedSessions: FormationSession[] = datedSessions.map((session) => ({
  ...session,
  programId: session.programId as FormationProgramId,
  id: `${session.programId}-${session.date}`,
  recurring: false,
  recording: formationRecordingById.get(`${session.programId}-${session.date}`) ?? null,
}));

export const formationSourceUrl = "/formacion/temario-clases-en-directo.pdf";

export function formationSessionsBetween(start: string, end: string): FormationSession[] {
  const sessions = publishedSessions.filter((session) => session.date >= start && session.date <= end);
  const firstWeek = startOfWeekKey(start);
  for (let monday = firstWeek; monday <= end; monday = addDays(monday, 7)) {
    for (const program of formationPrograms) {
      if (!program.recurring) continue;
      const date = addDays(monday, program.weekday);
      if (date < start || date > end || date < "2026-08-03") continue;
      sessions.push({
        id: `${program.id}-${date}`,
        programId: program.id,
        date,
        topic: "Tutoría en directo · preguntas abiertas",
        cycle: null,
        sequence: null,
        cancelled: false,
        sourcePage: program.id === "agents-tutoring" ? 4 : 13,
        recurring: true,
        recording: formationRecordingById.get(`${program.id}-${date}`) ?? null,
      });
    }
  }
  return sessions.sort((a, b) => a.date.localeCompare(b.date) || formationProgramById[a.programId].time.localeCompare(formationProgramById[b.programId].time) || a.programId.localeCompare(b.programId));
}
