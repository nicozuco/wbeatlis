import { readCalculation, describeCalculation } from './calculation-handoff.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// Icons are decorative throughout; their adjacent labels carry their meaning.
$$('svg.icon').forEach(svg => svg.setAttribute('aria-hidden', 'true'));
$('#year').textContent = new Date().getFullYear();

// Booking happens in the GoHighLevel calendar embedded on demo.html.
// The figures the visitor simulated on the landing, if any, are shown to bring to the call.
const calculation = readCalculation();
if (calculation) {
  $('#form-calc-text').textContent = describeCalculation(calculation).summary;
  $('#form-calc-note').hidden = false;
}
