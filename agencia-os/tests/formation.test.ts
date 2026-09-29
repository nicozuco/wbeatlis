import assert from "node:assert/strict";
import test from "node:test";

import recordings from "../lib/formation-recordings.json";
import { formationProgramById, formationPrograms, formationSessionsBetween } from "../lib/formation";

test("formación: incluye el temario fechado, los mentores y las suspensiones", () => {
  const sessions = formationSessionsBetween("2026-08-01", "2027-01-31");
  const published = sessions.filter((session) => !session.recurring);
  assert.equal(formationPrograms.length, 12);
  assert.equal(new Set(formationPrograms.map((program) => program.mentor)).size, 6);
  assert.equal(published.length, 194);
  assert.equal(published.filter((session) => session.cancelled).length, 8);
  assert.ok(published.some((session) => session.programId === "mindset" && session.date === "2026-09-16" && session.topic.includes("creencias")));
  assert.ok(published.some((session) => session.programId === "sales" && session.date === "2027-01-11" && session.topic === "Auditoría de llamadas reales"));
  assert.ok(published.some((session) => session.programId === "agents-initial" && session.date === "2026-12-08" && session.cancelled));
  assert.ok(!published.some((session) => session.date === "2026-12-08" && session.programId === "agents-initial" && !session.cancelled));
});

test("formación: las tutorías semanales siguen apareciendo en meses futuros", () => {
  const sessions = formationSessionsBetween("2027-06-01", "2027-06-07");
  assert.deepEqual(sessions.map((session) => [session.date, session.programId]), [
    ["2027-06-04", "business-tutoring"],
    ["2027-06-07", "agents-tutoring"],
  ]);
  assert.equal(formationProgramById["business-tutoring"].time, "13:00");
});

test("formación: fechas, días y horas coinciden con cada programa publicado", () => {
  const sessions = formationSessionsBetween("2026-08-01", "2027-01-31");
  for (const session of sessions) {
    const weekday = (new Date(`${session.date}T12:00:00Z`).getUTCDay() + 6) % 7;
    assert.equal(weekday, formationProgramById[session.programId].weekday, session.id);
  }
});

test("formación: cada grabación del campus apunta a una clase de la fecha y programa correctos", () => {
  const sessions = formationSessionsBetween("2026-08-01", "2027-01-31");
  const byId = new Map(sessions.map((session) => [session.id, session]));
  const seen = new Set<string>();

  assert.equal(recordings.length, 74);
  for (const recording of recordings) {
    const id = `${recording.programId}-${recording.date}`;
    assert.ok(!seen.has(id), `Grabación duplicada: ${id}`);
    seen.add(id);
    const session = byId.get(id);
    assert.ok(session, `Clase ausente de la agenda: ${id}`);
    assert.equal(session.cancelled, false, id);
    assert.deepEqual(session.recording, { title: recording.title, url: recording.url }, id);
    const url = new URL(recording.url);
    assert.equal(url.hostname, "campus.mkthackers.com", id);
    assert.match(url.pathname, /^\/cursos\/[^/]+\/lecciones\/[^/]+\/$/, id);
  }

  assert.equal(sessions.filter((session) => session.recording).length, recordings.length);
  assert.equal(byId.get("agents-initial-2026-09-22")?.recording, null);
  assert.equal(byId.get("sales-2027-01-11")?.recording, null);
});
