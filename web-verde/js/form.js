export function validateLead(values) {
  const errors = {};
  if (!String(values.name ?? '').trim()) errors.name = 'Escribe tu nombre.';
  else if (values.name.length > 100) errors.name = 'El nombre no puede superar 100 caracteres.';
  if (!String(values.clinic ?? '').trim()) errors.clinic = 'Escribe el nombre de tu clínica.';
  else if (values.clinic.length > 160) errors.clinic = 'El nombre de la clínica no puede superar 160 caracteres.';
  if (!String(values.email ?? '').trim()) errors.email = 'Escribe tu email profesional.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) || values.email.length > 254) errors.email = 'Introduce un email válido, como tu@clinica.es.';
  if (values.phone && !/^[+\d\s().-]{6,30}$/.test(values.phone)) errors.phone = 'Revisa el formato del teléfono o deja este campo vacío.';
  return errors;
}

// A 2xx HTTP response alone does not prove that a lead was accepted.
export function isConfirmedReceipt(response, payload) {
  return response.ok === true && payload?.accepted === true && typeof payload.receiptId === 'string' && payload.receiptId.trim().length > 0;
}
