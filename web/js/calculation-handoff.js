import { calculateImpact, bounded, limits, formatNumber } from './calculator.js';

// The calculator lives on the landing and the request on demo.html.
// Figures travel in the tab session, and only once the visitor has adjusted them.
const key = 'atlis:calculo';
const fields = ['appointments', 'attendance', 'acceptance', 'treatment'];
const session = () => globalThis.sessionStorage;

export function saveCalculation(values, getStorage = session) {
  try {
    getStorage().setItem(key, JSON.stringify(Object.fromEntries(fields.map(field => [field, values[field]]))));
  } catch { /* Storage may be blocked; the request still works without the figures. */ }
}

// Stored values come back through the calculator's own limits, whatever was written.
export function readCalculation(getStorage = session) {
  try {
    const saved = JSON.parse(getStorage().getItem(key));
    if (!saved || typeof saved !== 'object' || !fields.every(field => Number.isFinite(Number(saved[field])))) return null;
    return Object.fromEntries(fields.map(field => [field, Math.round(bounded(saved[field], limits[field]))]));
  } catch {
    return null;
  }
}

export function describeCalculation(values) {
  const result = calculateImpact(values);
  return {
    field: [
      `citas/mes: ${formatNumber(values.appointments, 0)}`,
      `asistencia: ${formatNumber(values.attendance, 0)} %`,
      `aceptacion: ${formatNumber(values.acceptance, 0)} %`,
      `tratamiento medio: ${formatNumber(values.treatment, 0)} EUR`,
      `potencial mensual: ${formatNumber(result.monthlyPotential)} EUR`,
      `potencial anual: ${formatNumber(result.annualPotential)} EUR`,
      `primeras visitas perdidas/mes: ${formatNumber(result.missed)}`,
    ].join(' | '),
    summary: `${formatNumber(result.monthlyPotential)} € al mes con ${formatNumber(values.appointments, 0)} primeras visitas y un ${formatNumber(values.attendance, 0)} % de asistencia.`,
  };
}
