// Stato dell'app salvato in localStorage (solo su questo dispositivo).
const KEY = 'fitlife.v1';
const DRAFT_KEY = 'fitlife.draft.v1';

const empty = () => ({ profile: null, weights: [], food: [], workouts: [], plan: null, checked: [] });

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback(), ...JSON.parse(raw) } : fallback();
  } catch (e) { return fallback(); }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* quota o storage disattivato */ }
}

let state = read(KEY, empty);
let draft = read(DRAFT_KEY, () => ({ title: '', items: [] }));

export const getState = () => state;
export function update(fn) {
  const next = structuredClone(state);
  fn(next);
  state = next;
  write(KEY, state);
}

export const getDraft = () => draft;
/** Modifica la bozza dell'allenamento. Non ricrea lo stato: i campi di testo restano in focus. */
export function updateDraft(fn) { fn(draft); write(DRAFT_KEY, draft); }
export function resetDraft() { draft = { title: '', items: [] }; write(DRAFT_KEY, draft); }

let counter = 0;
export const newId = () => Date.now() * 1000 + (counter++ % 1000);

export function exportJSON() { return JSON.stringify({ app: 'FitLife', version: 1, data: state }, null, 1); }
export function importJSON(text) {
  const obj = JSON.parse(text);
  if (!obj || obj.app !== 'FitLife' || !obj.data) throw new Error('File non valido');
  state = { ...empty(), ...obj.data };
  write(KEY, state);
}
