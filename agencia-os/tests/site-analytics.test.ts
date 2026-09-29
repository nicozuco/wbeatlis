import assert from "node:assert/strict";
import test from "node:test";
import { classifySource, deviceFrom, siteAnalytics, type SiteSessionRow } from "../lib/site-analytics";

test("clasifica el origen por etiqueta, app y página anterior", () => {
  assert.equal(classifySource({ utmSource: "IG", referrer: "https://www.google.com/" }), "Instagram");
  assert.equal(classifySource({ utmSource: "boletin" }), "Boletin");
  assert.equal(classifySource({ userAgent: "Mozilla/5.0 (iPhone) Instagram 300.0" }), "Instagram");
  assert.equal(classifySource({ userAgent: "Mozilla/5.0 [FBAN/FBIOS;FBAV/450.0]" }), "Facebook");
  assert.equal(classifySource({ referrer: "https://l.instagram.com/?u=x" }), "Instagram");
  assert.equal(classifySource({ referrer: "https://lm.facebook.com/l.php" }), "Facebook");
  assert.equal(classifySource({ referrer: "https://www.google.es/" }), "Google");
  assert.equal(classifySource({ referrer: "https://mail.google.com/" }), "Email");
  assert.equal(classifySource({ referrer: "https://chatgpt.com/" }), "Asistentes IA");
  assert.equal(classifySource({ referrer: "https://propuestas.atlisclinicas.com/deniz/" }), "Propuestas");
  assert.equal(classifySource({ referrer: "https://atlisclinicas.com/" }), "Directo");
  assert.equal(classifySource({ referrer: "https://blog.ejemplo.es/post" }), "blog.ejemplo.es");
  assert.equal(classifySource({ referrer: "no es una url" }), "Directo");
  assert.equal(classifySource({}), "Directo");
  assert.equal(deviceFrom("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)"), "Móvil");
  assert.equal(deviceFrom("Mozilla/5.0 (Macintosh)"), "Ordenador");
});

const session = (overrides: Partial<SiteSessionRow>): SiteSessionRow => ({ id: "a", site: "web", source: "Directo", landingPath: "/", currentPath: "/", device: "Móvil", city: null, pageviews: 1, converted: false, startedAt: "2026-09-29T10:00:00.000Z", lastSeenAt: "2026-09-29T10:00:00.000Z", ...overrides });

test("resume visitas, orígenes con su conversión y días sin visitas a cero", () => {
  const stats = siteAnalytics([
    session({ source: "Instagram", converted: true }),
    session({ id: "b", source: "Instagram" }),
    session({ id: "c", source: "Google", startedAt: "2026-09-27T10:00:00.000Z", city: "Valencia" }),
  ], [{ site: "web", path: "/", occurredAt: "2026-09-29T10:00:00.000Z" }, { site: "web", path: "/", occurredAt: "2026-09-29T10:01:00.000Z" }, { site: "web", path: "/demo.html", occurredAt: "2026-09-29T10:02:00.000Z" }], "2026-09-29T20:00:00.000Z", null);
  assert.equal(stats.sessions, 3);
  assert.equal(stats.conversions, 1);
  assert.deepEqual(stats.bySource.map((row) => [row.source, row.total, row.converted]), [["Instagram", 2, 1], ["Google", 1, 0]]);
  assert.equal(stats.bySource[0].rate, 50);
  assert.deepEqual(stats.days.map((day) => day.visitas), [1, 0, 2]);
  assert.deepEqual(stats.pages[0], { site: "web", path: "/", views: 2 });
  assert.deepEqual(stats.cities, [{ label: "Valencia", total: 1 }]);
});
