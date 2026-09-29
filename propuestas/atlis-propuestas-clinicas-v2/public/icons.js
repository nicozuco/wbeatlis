// Iconos propios de Atlis. Sustituye los símbolos de texto (flechas, checks, estrellas…)
// por iconos SVG que heredan el color y el tamaño del texto. En móvil, algunos de esos
// símbolos se mostraban como emoji; aquí nunca se usan emoji.
(() => {
  const s = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const f = 'fill="currentColor" stroke="none"';
  const paths = {
    '↗': `<path ${s} d="M7 17 17 7M8.5 7H17v8.5"/>`,
    '→': `<path ${s} d="M5 12h14m-6-6 6 6-6 6"/>`,
    '←': `<path ${s} d="M19 12H5m6-6-6 6 6 6"/>`,
    '↓': `<path ${s} d="M12 5v14m-6-6 6 6 6-6"/>`,
    '↑': `<path ${s} d="M12 19V5m-6 6 6-6 6 6"/>`,
    '✓': `<path ${s} stroke-width="2.4" d="m5 12.5 4.5 4.5L19 7.5"/>`,
    '✦': `<path ${f} d="M12 2.5l2.1 6.4 6.4 2.1-6.4 2.1L12 19.5l-2.1-6.4L3.5 11l6.4-2.1z"/>`,
    '✳': `<path ${f} d="M12 2.5l2.1 6.4 6.4 2.1-6.4 2.1L12 19.5l-2.1-6.4L3.5 11l6.4-2.1z"/>`,
    '↻': `<path ${s} d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4.8h-4.8"/>`,
    '⌖': `<path ${s} d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 0 0-13 0c0 5.4 6.5 11 6.5 11z"/><circle ${s} cx="12" cy="10" r="2.3"/>`,
    '↳': `<path ${s} d="M6 4v7a4 4 0 0 0 4 4h9m-4-4 4 4-4 4"/>`,
    '◌': `<circle ${s} cx="12" cy="12" r="7.5" stroke-dasharray="2.2 3"/>`,
    '⋮': `<circle ${f} cx="12" cy="5.5" r="1.7"/><circle ${f} cx="12" cy="12" r="1.7"/><circle ${f} cx="12" cy="18.5" r="1.7"/>`,
    '➤': `<path ${f} d="M4 20.5 21 12 4 3.5l2.2 7.1L14 12l-7.8 1.4z"/>`,
    '＋': `<path ${s} d="M12 5v14M5 12h14"/>`,
    '×': `<path ${s} d="M6.5 6.5l11 11m0-11-11 11"/>`,
  };
  const chars = Object.keys(paths);
  const re = new RegExp(`[${chars.join('')}]`);
  const svg = ch => `<svg class="atlis-ico" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false">${paths[ch]}</svg>`;
  const SKIP = new Set(['SCRIPT', 'STYLE', 'OPTION', 'TEXTAREA', 'TITLE', 'SVG']);

  const swap = node => {
    const text = node.nodeValue;
    if (!text || !re.test(text)) return;
    const parent = node.parentNode;
    if (!parent || SKIP.has(parent.nodeName.toUpperCase()) || parent.closest?.('svg')) return;
    const frag = document.createDocumentFragment();
    let buf = '';
    for (const ch of text) {
      if (paths[ch]) {
        if (buf) { frag.append(buf); buf = ''; }
        const span = document.createElement('span');
        span.className = 'atlis-ico-wrap';
        span.innerHTML = svg(ch);
        frag.append(span);
      } else buf += ch;
    }
    if (buf) frag.append(buf);
    parent.replaceChild(frag, node);
  };
  const scan = root => {
    if (root.nodeType === 3) return swap(root);
    if (root.nodeType !== 1 || SKIP.has(root.nodeName.toUpperCase())) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const found = [];
    while (walker.nextNode()) if (re.test(walker.currentNode.nodeValue)) found.push(walker.currentNode);
    found.forEach(swap);
  };

  const style = document.createElement('style');
  style.textContent = '.atlis-ico-wrap{display:inline-flex;align-items:center;justify-content:center;vertical-align:-.14em;line-height:0}.atlis-ico{width:1em;height:1em;flex:none;overflow:visible}';
  document.head.append(style);

  new MutationObserver(list => {
    for (const m of list) {
      if (m.type === 'characterData') swap(m.target);
      else m.addedNodes.forEach(scan);
    }
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  document.addEventListener('DOMContentLoaded', () => scan(document.body));
  if (document.body) scan(document.body);
})();
