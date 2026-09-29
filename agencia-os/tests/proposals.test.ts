import assert from "node:assert/strict";
import test from "node:test";
import { normalizeName, proposalAnalytics, type ProposalEventRow } from "../lib/proposals";

const event = (overrides: Partial<ProposalEventRow>): ProposalEventRow => ({ slug: "deniz", clinicName: "Clínica Déniz", event: "abierta", seconds: 10, device: "móvil", city: "Valencia", occurredAt: "2026-09-28T10:00:00.000Z", ...overrides });

test("resume cada propuesta con su paso más avanzado y su última visita", () => {
  const stats = proposalAnalytics([
    event({}),
    event({ event: "leida", occurredAt: "2026-09-28T10:02:00.000Z" }),
    event({ event: "demo_pulsada", occurredAt: "2026-09-28T10:03:00.000Z" }),
    event({ occurredAt: "2026-09-29T09:00:00.000Z", device: "ordenador", city: "" }),
    event({ slug: "odontology", clinicName: "Odontology", occurredAt: "2026-09-27T10:00:00.000Z" }),
  ]);
  assert.equal(stats.opened, 2);
  assert.equal(stats.visits, 3);
  assert.equal(stats.read, 1);
  assert.equal(stats.demo, 1);
  const [deniz, odontology] = stats.rows;
  assert.equal(deniz.slug, "deniz");
  assert.equal(deniz.stage, "demo_pulsada");
  assert.equal(deniz.visits, 2);
  assert.equal(deniz.lastAt, "2026-09-29T09:00:00.000Z");
  assert.equal(deniz.lastDevice, "ordenador");
  assert.equal(deniz.lastCity, "Valencia");
  assert.equal(odontology.stage, "abierta");
  assert.equal(stats.recent[0].occurredAt, "2026-09-29T09:00:00.000Z");
});

test("empareja con la ficha del CRM ignorando tildes y mayúsculas, y descarta eventos desconocidos", () => {
  assert.equal(normalizeName("Clínica  DÉNIZ"), "clinica deniz");
  const stats = proposalAnalytics([event({}), event({ event: "otro" })], [{ id: "c1", name: "clinica deniz" }]);
  assert.equal(stats.rows[0].clinicId, "c1");
  assert.equal(stats.recent.length, 1);
});
