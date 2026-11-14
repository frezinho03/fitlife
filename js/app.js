import { render, bindEvents } from './ui.js';

bindEvents();
window.addEventListener('hashchange', () => { window.scrollTo(0, 0); render(); });
render();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* offline non disponibile, l'app funziona comunque */ });
}
