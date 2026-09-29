// Decorative loops run automatically while the section is visible.
// They pause on hover/focus, when reduced motion is requested, off-screen or when the tab is hidden.
const section = document.querySelector('#beneficios');
if (section) {
  const marquee = section.querySelector('.benefit-marquee');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let inView = false;

  function updateMotion() {
    section.dataset.motionPaused = String(reducedMotion.matches || !inView || document.hidden);
  }

  reducedMotion.addEventListener('change', updateMotion);
  document.addEventListener('visibilitychange', updateMotion);
  new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    updateMotion();
  }, { threshold: 0 }).observe(section);
  // Each repeated group spans at least the viewport, so the loop has no gap.
  const resize = () => section.style.setProperty('--benefit-track-width', `${marquee.clientWidth}px`);
  new ResizeObserver(resize).observe(marquee);
  resize();
  updateMotion();
  section.classList.add('benefits-motion-enabled');
}
