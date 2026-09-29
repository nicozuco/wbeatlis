import { validateLead, isConfirmedReceipt } from './form.js';
import { formConfig } from './config.js';
import { readCalculation, describeCalculation } from './calculation-handoff.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// Icons are decorative throughout; their adjacent labels carry their meaning.
$$('svg.icon').forEach(svg => svg.setAttribute('aria-hidden', 'true'));
$('#year').textContent = new Date().getFullYear();

// The request carries the figures the visitor simulated on the landing, if any.
const calculation = readCalculation();
if (calculation) {
  const { field, summary } = describeCalculation(calculation);
  $('#form-calc-value').value = field;
  $('#form-calc-text').textContent = summary;
  $('#form-calc-note').hidden = false;
}

// Form: configured receivers must explicitly acknowledge receipt.
const form = $('#demo-form');
const formStatus = $('#form-status');
let submitting = false;
const configured = typeof formConfig.endpoint === 'string' && formConfig.endpoint.length > 0 && formConfig.privacyReady === true;
if (configured) $('#connection-notice').hidden = true;
function clearFieldError(input) {
  input.removeAttribute('aria-invalid');
  const error = $(`#${input.id}-error`);
  if (error) error.textContent = '';
}
$$('input', form).forEach(input => input.addEventListener('input', () => clearFieldError(input)));
form.addEventListener('submit', async e => {
  e.preventDefault();
  if (submitting) return;
  formStatus.textContent = '';
  const data = Object.fromEntries([...new FormData(form).entries()].map(([key, value]) => [key, String(value).trim()]));
  const errors = validateLead(data);
  $$('input', form).forEach(clearFieldError);
  if (Object.keys(errors).length) {
    for (const [field, message] of Object.entries(errors)) {
      $(`#${field}`).setAttribute('aria-invalid', 'true');
      $(`#${field}-error`).textContent = message;
    }
    $(`#${Object.keys(errors)[0]}`).focus();
    return;
  }
  if (!configured) {
    formStatus.className = 'form-status error';
    formStatus.textContent = 'El formulario aún no está conectado. No se ha enviado ningún dato. La recepción de solicitudes se activará después de completar la conexión y la información de privacidad.';
    formStatus.focus({ preventScroll: true });
    return;
  }
  const submit = $('.submit-button');
  submitting = true;
  submit.disabled = true;
  form.setAttribute('aria-busy', 'true');
  submit.querySelector('span').textContent = 'Enviando solicitud…';
  formStatus.className = 'form-status';
  formStatus.textContent = 'Enviando solicitud…';
  try {
    const response = await fetch(formConfig.endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data), signal: AbortSignal.timeout(15000), credentials: 'same-origin',
    });
    const result = await response.json().catch(() => null);
    if (!isConfirmedReceipt(response, result)) throw new Error('Reception not confirmed');
    formStatus.className = 'form-status success';
    formStatus.textContent = 'Solicitud recibida. Gracias por contarnos cómo trabajáis. El equipo revisará tu solicitud de demo.';
    form.reset();
  } catch {
    formStatus.className = 'form-status error';
    formStatus.textContent = 'No hemos podido confirmar la recepción. Conservamos los campos en pantalla para que puedas reintentar el envío.';
  } finally {
    submitting = false;
    submit.disabled = false;
    form.removeAttribute('aria-busy');
    submit.querySelector('span').textContent = formStatus.classList.contains('error') ? 'Reintentar envío' : 'Solicitar demo gratuita';
    formStatus.focus({ preventScroll: true });
  }
});
