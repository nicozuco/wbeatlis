// Restarting the pointer demo on each visit keeps it tied to what the reader sees.
const card = document.querySelector('.final-cta');
if (card) {
  new IntersectionObserver(([entry]) => {
    card.toggleAttribute('data-cta-play', entry.isIntersecting);
  }, { threshold: 0.5 }).observe(card);
}
