// Visual channel representations only. No messaging or calendar API is used.
const tabs = [...document.querySelectorAll('[data-channel-tab]')];
const panel = document.getElementById('channel-panel');
const title = document.getElementById('channel-title');
const subtitle = document.getElementById('channel-subtitle');

function selectChannel(index) {
  const selected = tabs[index];
  tabs.forEach((tab, i) => {
    tab.setAttribute('aria-selected', String(i === index));
    tab.tabIndex = i === index ? 0 : -1;
  });
  panel.dataset.channel = selected.dataset.channelTab;
  panel.setAttribute('aria-labelledby', selected.id);
  const web = selected.dataset.channelTab === 'web';
  title.textContent = 'Tu clínica dental';
  subtitle.textContent = web ? 'Chat de la web · en línea' : 'en línea';
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectChannel(index));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    selectChannel(next);
    tabs[next].focus();
  });
});

const eventButton = document.querySelector('.gcal-event');
const eventDetails = document.getElementById('calendar-event-details');
eventButton.addEventListener('click', () => {
  const open = eventButton.getAttribute('aria-expanded') !== 'true';
  eventButton.setAttribute('aria-expanded', String(open));
  eventDetails.hidden = !open;
});
