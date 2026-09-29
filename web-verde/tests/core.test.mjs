import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calculateImpact, defaults } from '../js/calculator.js';
import { validateLead, isConfirmedReceipt } from '../js/form.js';
import { saveCalculation, readCalculation, describeCalculation } from '../js/calculation-handoff.js';

test('el ejemplo de la referencia muestra 4800 euros al mes, 57600 al año y 32 visitas perdidas', () => {
  assert.deepEqual(calculateImpact(defaults), {
    missed: 32, increasePoints: 10, additionalVisits: 8, additionalTreatments: 4,
    monthlyPotential: 4800, annualPotential: 57600,
  });
});
test('la mejora se limita a la asistencia disponible y nunca supera el 100 por ciento', () => {
  const nearFull = calculateImpact({ ...defaults, attendance: 95 });
  assert.equal(nearFull.increasePoints, 5);
  assert.equal(nearFull.additionalVisits, 4);
  assert.equal(nearFull.monthlyPotential, 2400);
  const full = calculateImpact({ ...defaults, attendance: 100 });
  assert.equal(full.missed, 0);
  assert.equal(full.additionalVisits, 0);
  assert.equal(full.monthlyPotential, 0);
});
test('admite ceros y conserva estimaciones fraccionarias sin redondear ingresos intermedios', () => {
  assert.equal(calculateImpact({ ...defaults, treatment: 0 }).monthlyPotential, 0);
  assert.equal(calculateImpact({ ...defaults, acceptance: 0 }).monthlyPotential, 0);
  assert.equal(calculateImpact({ ...defaults, appointments: 0 }).additionalVisits, 0);
  const fraction = calculateImpact({ appointments: 25, attendance: 96, acceptance: 25, treatment: 1250 });
  assert.equal(fraction.additionalTreatments, 0.25);
  assert.equal(fraction.monthlyPotential, 312.5);
  assert.equal(fraction.annualPotential, 3750);
});
test('limita negativos, porcentajes fuera de rango y valores no finitos', () => {
  assert.equal(calculateImpact({ ...defaults, appointments: -30 }).missed, 0);
  assert.equal(calculateImpact({ ...defaults, attendance: 120 }).monthlyPotential, 0);
  assert.equal(calculateImpact({ ...defaults, acceptance: 120 }).additionalTreatments, 8);
  assert.equal(calculateImpact({ ...defaults, treatment: Infinity }).monthlyPotential, 0);
  assert.equal(calculateImpact({ ...defaults, attendance: NaN }).missed, 80);
});
test('el formulario valida los obligatorios y permite teléfono vacío', () => {
  assert.deepEqual(Object.keys(validateLead({})), ['name', 'clinic', 'email']);
  assert.deepEqual(validateLead({ name: 'Demo', clinic: 'Clínica de ejemplo', email: 'demo@example.com', phone: '' }), {});
  assert.ok(validateLead({ name: 'Demo', clinic: 'Ejemplo', email: 'incorrecto' }).email);
});
test('el envío solo se confirma con respuesta afirmativa e identificador del receptor', () => {
  assert.equal(isConfirmedReceipt({ ok: true }, {}), false);
  assert.equal(isConfirmedReceipt({ ok: true }, { accepted: true }), false);
  assert.equal(isConfirmedReceipt({ ok: false }, { accepted: true, receiptId: 'test' }), false);
  assert.equal(isConfirmedReceipt({ ok: true }, { accepted: true, receiptId: ' ' }), false);
  assert.equal(isConfirmedReceipt({ ok: true }, { accepted: true, receiptId: 'test' }), true);
});
test('la página tiene un único H1 y todos los destinos internos existen', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
  const targets = [...html.matchAll(/href="#([^"\s]+)"/g)].map(m => m[1]);
  for (const target of targets) assert.ok(html.includes(`id="${target}"`), `Falta ${target}`);
  assert.ok(html.includes('Demostración ilustrativa. No realiza reservas reales.'));
});
test('las cifras de la calculadora llegan a la solicitud dentro de sus límites', () => {
  const store = new Map();
  const storage = () => ({ getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) });
  assert.equal(readCalculation(storage), null);
  saveCalculation(defaults, storage);
  assert.deepEqual(readCalculation(storage), { ...defaults });
  store.set('atlis:calculo', JSON.stringify({ appointments: 9000, attendance: -5, acceptance: 50.4, treatment: 1200 }));
  assert.deepEqual(readCalculation(storage), { appointments: 600, attendance: 0, acceptance: 50, treatment: 1200 });
  store.set('atlis:calculo', '{roto');
  assert.equal(readCalculation(storage), null);
  assert.equal(readCalculation(() => { throw new Error('bloqueado'); }), null);
  assert.ok(describeCalculation(defaults).summary.startsWith('4800 € al mes con 80 primeras visitas'));
});
test('los botones de demo llevan a la página independiente del formulario', async () => {
  const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8');
  const index = await read('index.html');
  const demo = await read('demo.html');
  assert.ok(!index.includes('id="demo-form"'));
  assert.ok(index.includes('href="./demo.html"'));
  assert.ok(demo.includes('id="demo-form"'));
  assert.equal((demo.match(/<h1[\s>]/g) || []).length, 1);
  for (const target of [...demo.matchAll(/href="#([^"\s]+)"/g)].map(m => m[1])) assert.ok(demo.includes(`id="${target}"`), `Falta ${target}`);
  for (const html of [index, demo, await read('privacidad.html'), await read('aviso-legal.html')]) {
    for (const page of new Set([...html.matchAll(/href="\.\/([^"#]+\.html)/g)].map(m => m[1]))) {
      await assert.doesNotReject(read(page), `Falta la página ${page}`);
    }
  }
});
