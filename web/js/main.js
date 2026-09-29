import './benefits-motion.js';
import './final-cta.js';
import './experience.js';
import { calculateImpact, defaults, limits, bounded, formatNumber } from './calculator.js';
import { saveCalculation, readCalculation } from './calculation-handoff.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// Icons are decorative throughout; their adjacent labels carry their meaning.
$$('svg.icon').forEach(svg => svg.setAttribute('aria-hidden', 'true'));
$('#year').textContent = new Date().getFullYear();

// Navigation, including Escape and focus return for the mobile menu.
const menuToggle = $('.menu-toggle');
const mobileNav = $('#mobile-nav');
const setMenu = (open, returnFocus = false) => {
  mobileNav.hidden = !open;
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  // Preserve the tapped SVG node until the click finishes bubbling.
  menuToggle.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
  if (returnFocus) menuToggle.focus();
};
menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
$$('a', mobileNav).forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !mobileNav.hidden) setMenu(false, true); });
document.addEventListener('click', e => { if (!mobileNav.hidden && !e.composedPath().includes($('.site-header'))) setMenu(false); });
document.addEventListener('focusin', e => { if (!mobileNav.hidden && !$('.site-header').contains(e.target)) setMenu(false); });
matchMedia('(min-width: 1001px)').addEventListener('change', e => { if (e.matches) setMenu(false); });
let scheduled = false;
window.addEventListener('scroll', () => {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => { $('.site-header').classList.toggle('scrolled', scrollY > 30); scheduled = false; });
}, { passive: true });
$('.site-header').classList.toggle('scrolled', scrollY > 30);
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    $$('.desktop-nav a, .mobile-nav a').forEach(link => {
      const active = link.hash === `#${entry.target.id}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-15% 0px -60% 0px' });
$$('section[id]').forEach(section => sectionObserver.observe(section));

// Calculator: projected treatment revenue from up to 10 more attendance points.
const values = { ...defaults, ...readCalculation() };
let announcementTimer;
function updateCalculator(announce = true) {
  const result = calculateImpact(values);
  $('#result-monthly').textContent = formatNumber(result.monthlyPotential);
  $('#result-annual').textContent = formatNumber(result.annualPotential);
  $('#result-missed').textContent = formatNumber(result.missed);
  $('#impact-scenario-summary').textContent = result.increasePoints === 0
    ? 'Con una asistencia del 100 %, ya atiendes todas las primeras visitas programadas.'
    : `Con ${formatNumber(result.increasePoints)} puntos más de asistencia atiendes ${formatNumber(result.additionalVisits)} primeras visitas más al mes y cierras ${formatNumber(result.additionalTreatments)} tratamientos.`;
  $$('[data-range]').forEach(range => {
    const key = range.dataset.range;
    range.value = String(values[key]);
    const progress = (values[key] - Number(range.min)) / (Number(range.max) - Number(range.min)) * 100;
    range.style.setProperty('--range-progress', `${progress}%`);
    const suffix = ['attendance', 'acceptance'].includes(key) ? ' por ciento' : key === 'treatment' ? ' euros' : ' citas';
    range.setAttribute('aria-valuetext', `${formatNumber(values[key])}${suffix}`);
  });
  if (announce) {
    // Only figures the visitor has adjusted travel with the demo request.
    saveCalculation(values);
    clearTimeout(announcementTimer);
    announcementTimer = setTimeout(() => {
      $('#calculator-announcement').textContent = `${formatNumber(result.monthlyPotential)} euros mensuales de facturación potencial, ${formatNumber(result.annualPotential)} al año. ${formatNumber(result.missed)} primeras visitas perdidas al mes. ${$('#impact-scenario-summary').textContent}`;
    }, 450);
  }
}
$$('[data-key]').forEach(input => {
  input.addEventListener('input', () => {
    const key = input.dataset.key;
    const raw = Number(input.value);
    values[key] = bounded(input.value, limits[key]);
    if (input.value !== '' && (raw < 0 || raw > limits[key])) input.value = String(values[key]);
    updateCalculator();
  });
  input.addEventListener('blur', () => {
    const key = input.dataset.key;
    values[key] = Math.round(values[key]);
    input.value = String(values[key]);
    updateCalculator(false);
  });
});
$$('[data-range]').forEach(range => range.addEventListener('input', () => {
  const key = range.dataset.range;
  values[key] = Number(range.value);
  $(`[data-key="${key}"]`).value = range.value;
  updateCalculator();
}));
$$('[data-key]').forEach(input => { input.value = String(values[input.dataset.key]); });
updateCalculator(false);

// The closing lines continue behind the footer: their layer grows by the footer's height.
const closingArea = $('.closing-area');
const siteFooter = $('.site-footer');
if (closingArea && siteFooter) {
  new ResizeObserver(() => closingArea.style.setProperty('--footer-height', `${siteFooter.offsetHeight}px`)).observe(siteFooter);
}
