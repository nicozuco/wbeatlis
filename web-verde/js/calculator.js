export const defaults = Object.freeze({ appointments: 80, attendance: 60, acceptance: 50, treatment: 1200 });
export const limits = Object.freeze({ appointments: 600, attendance: 100, acceptance: 100, treatment: 15000 });

export function bounded(value, maximum = Number.MAX_SAFE_INTEGER) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(maximum, Math.max(0, number)) : 0;
}

// Model an increase of up to 10 percentage points, capped at 100% attendance.
// Revenue is potential treatment revenue, before any costs or taxes.
export function calculateImpact(values) {
  const appointments = bounded(values.appointments, limits.appointments);
  const attendance = bounded(values.attendance, limits.attendance);
  const acceptance = bounded(values.acceptance, limits.acceptance);
  const treatment = bounded(values.treatment, limits.treatment);
  const increasePoints = Math.min(10, 100 - attendance);
  const missed = appointments * (100 - attendance) / 100;
  const additionalVisits = appointments * increasePoints / 100;
  const additionalTreatments = additionalVisits * acceptance / 100;
  const monthlyPotential = additionalTreatments * treatment;
  return { missed, increasePoints, additionalVisits, additionalTreatments, monthlyPotential, annualPotential: monthlyPotential * 12 };
}

export const formatNumber = (value, decimals = 2) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: decimals }).format(value);
