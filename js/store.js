// Stato dell'app salvato in localStorage; le foto del fisico in IndexedDB (solo su questo dispositivo).
const KEY = 'fitlife.v1';
const DRAFT_KEY = 'fitlife.draft.v1';

export const DEFAULT_SETTINGS = {
  theme: 'auto', tiles: ['train', 'food', 'calendar', 'health'], weightEvery: 7, photoEvery: 30, restSec: 90,
};
const empty = () => ({ profile: null, weights: [], food: [], workouts: [], plan: null, checked: [], settings: {}, templates: null, schedule: null, photos: [], notes: '', userRecipes: [] });

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
let draft = read(DRAFT_KEY, () => ({ title: '', items: [], startedAt: 0, templateId: null }));

export const getState = () => state;
export function update(fn) {
  const next = structuredClone(state);
  fn(next);
  state = next;
  write(KEY, state);
}
export function settings() {
  const s = { ...DEFAULT_SETTINGS, ...state.settings };
  // se in futuro si aggiungono riquadri, compaiono in coda
  const known = DEFAULT_SETTINGS.tiles;
  s.tiles = [...s.tiles.filter(t => known.includes(t)), ...known.filter(t => !s.tiles.includes(t))];
  return s;
}
export const setSetting = (k, v) => update(s => { s.settings = { ...s.settings, [k]: v }; });

export const getDraft = () => draft;
/** Modifica la bozza dell'allenamento. Non ricrea lo stato: i campi di testo restano in focus. */
export function updateDraft(fn) { fn(draft); write(DRAFT_KEY, draft); }
export function resetDraft() { draft = { title: '', items: [], startedAt: 0, templateId: null }; write(DRAFT_KEY, draft); }

let counter = 0;
export const newId = () => Date.now() * 1000 + (counter++ % 1000);

// ---------------------------------------------------------------- foto (IndexedDB)
function db() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('fitlife-photos', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('p');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
const tx = (mode, fn) => db().then(d => new Promise((res, rej) => {
  const t = d.transaction('p', mode), os = t.objectStore('p'), req = fn(os);
  t.oncomplete = () => res(req && req.result); t.onerror = () => rej(t.error);
}));
export const putPhoto = (id, dataUrl) => tx('readwrite', os => os.put(dataUrl, String(id)));
export const getPhoto = id => tx('readonly', os => os.get(String(id)));
export const delPhoto = id => tx('readwrite', os => os.delete(String(id)));

/** Riduce la foto a max 900px e la converte in JPEG: pesa circa 80–150 KB. */
export function shrinkImage(file, max = 900) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Immagine non leggibile')); };
    img.src = url;
  });
}

// ---------------------------------------------------------------- backup
export async function exportJSON() {
  const photos = {};
  for (const p of state.photos) { try { photos[p.id] = await getPhoto(p.id); } catch (e) { /* foto mancante */ } }
  return JSON.stringify({ app: 'FitLife', version: 2, data: state, photos }, null, 1);
}
export async function importJSON(text) {
  const obj = JSON.parse(text);
  if (!obj || obj.app !== 'FitLife' || !obj.data) throw new Error('File non valido');
  state = { ...empty(), ...obj.data };
  write(KEY, state);
  for (const [id, url] of Object.entries(obj.photos || {})) { if (url) await putPhoto(id, url); }
}
