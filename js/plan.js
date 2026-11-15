// Logica pura per schede di allenamento, stimoli muscolari, consigli e calendario.
import { EXERCISES } from './data.js';
import { infoFor, } from './exinfo.js';
import { MUSCLE_NAMES } from './body.js';
import * as L from './logic.js';

export const DAYS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
export const DAYS_LONG = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
export const weekdayIdx = iso => (L.parseISO(iso).getDay() + 6) % 7;
export const SET_SECONDS = 40; // durata media di una serie
export const WEEKLY_SETS_TARGET = 10; // serie settimanali "complete" per muscolo

const ex = (exerciseId, sets, reps, rest) => ({ exerciseId, sets, reps, rest });

export function defaultTemplates() {
  return [
    { id: 'upper', name: 'UPPER', kind: 'gym', exercises: [
      ex('bench', 4, 8, 120), ex('latpull', 4, 10, 90), ex('ohp', 3, 8, 90), ex('dbrow', 3, 10, 75),
      ex('sideraise', 3, 12, 60), ex('barbellcurl', 3, 10, 60), ex('triext', 3, 12, 60)] },
    { id: 'leg', name: 'LEG', kind: 'gym', exercises: [
      ex('squat', 4, 8, 120), ex('rdl', 3, 10, 120), ex('legpress', 3, 12, 90), ex('lunge', 3, 10, 75),
      ex('hipthrust', 3, 10, 90), ex('crunch', 3, 15, 45)] },
    { id: 'run', name: 'CORSA', kind: 'run', minutes: 30, exercises: [] },
  ];
}
export const defaultSchedule = () => ['upper', null, 'leg', null, 'upper', 'run', null];

/** Durata (minuti) e calorie stimate di una scheda. */
export function templateStats(t, kg = 75) {
  if (t.kind === 'run') {
    const minutes = t.minutes || 30;
    return { minutes, kcal: Math.round(9 * kg * minutes / 60), sets: 0, exercises: 0, rest: 0 };
  }
  const sets = t.exercises.reduce((a, e) => a + e.sets, 0);
  const sec = t.exercises.reduce((a, e) => a + e.sets * (SET_SECONDS + e.rest), 0);
  const minutes = Math.round(sec / 60 + 5); // + riscaldamento
  const rest = t.exercises.length ? Math.round(t.exercises.reduce((a, e) => a + e.rest, 0) / t.exercises.length) : 0;
  return { minutes, kcal: Math.round(5 * kg * minutes / 60), sets, exercises: t.exercises.length, rest };
}
export const fmtRest = s => (s >= 60 ? `${Math.floor(s / 60)}'${s % 60 ? String(s % 60).padStart(2, '0') + '"' : ''}` : `${s}"`);
export const fmtClock = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export function templateFor(state, iso) {
  const sch = state.schedule || defaultSchedule(), id = sch[weekdayIdx(iso)];
  return id ? (state.templates || defaultTemplates()).find(t => t.id === id) || null : null;
}

/** Serie effettive per muscolo negli ultimi 7 giorni (primari = 1, secondari = 0,5). */
export function weeklyCredit(workouts, endISO) {
  const from = L.addDays(endISO, -6), credit = {};
  const byId = Object.fromEntries(EXERCISES.map(e => [e.id, e]));
  for (const w of workouts) {
    if (w.date < from || w.date > endISO) continue;
    for (const e of w.exercises || []) {
      if (!byId[e.exerciseId]) continue;
      const info = infoFor(e.exerciseId), n = e.sets.length;
      info.p.forEach(m => { credit[m] = (credit[m] || 0) + n; });
      info.s.forEach(m => { credit[m] = (credit[m] || 0) + n * 0.5; });
    }
  }
  return credit;
}
export const stimulusPct = credit => Object.fromEntries(Object.keys(MUSCLE_NAMES).map(m => [m, Math.min(1, (credit[m] || 0) / WEEKLY_SETS_TARGET)]));

/** Consigli su alimentazione e allenamento. */
export function advice(state, todayISO) {
  const out = [], p = state.profile; if (!p) return out;
  const t = L.targets(p), days = [];
  for (let i = 0; i < 7; i++) {
    const d = L.addDays(todayISO, -i), list = state.food.filter(e => e.date === d);
    if (list.length) days.push(list);
  }
  if (days.length >= 2) {
    const avg = k => days.reduce((a, l) => a + l.reduce((b, e) => b + e[k], 0), 0) / days.length;
    const kcal = avg('kcal'), pr = avg('p'), c = avg('c'), f = avg('f');
    const pc = (v, tg) => Math.round(v / tg * 100);
    if (pr < t.protein * 0.85) out.push({ warn: true, text: `Proteine al ${pc(pr, t.protein)}% dell'obiettivo (media ${L.fmt(pr)} g su ${t.protein} g): aggiungi uova, yogurt greco, legumi o una porzione di carne/pesce magro.` });
    if (kcal < t.kcal * 0.85) out.push({ warn: true, text: `Mangi in media ${L.fmt(kcal)} kcal contro le ${t.kcal} del tuo obiettivo: sei sotto del ${100 - pc(kcal, t.kcal)}%.` });
    else if (kcal > t.kcal * 1.15) out.push({ warn: true, text: `Mangi in media ${L.fmt(kcal)} kcal, oltre le ${t.kcal} del tuo obiettivo.` });
    if (c < t.carbs * 0.75) out.push({ warn: false, text: `Carboidrati bassi (${pc(c, t.carbs)}% dell'obiettivo): possono servirti per l'energia degli allenamenti.` });
    if (f < t.fat * 0.7) out.push({ warn: false, text: `Grassi bassi (${pc(f, t.fat)}%): aggiungi olio d'oliva, frutta secca o pesce azzurro.` });
    if (!out.length) out.push({ warn: false, text: 'Alimentazione in linea con il tuo obiettivo negli ultimi giorni. Continua così.' });
  } else out.push({ warn: false, text: 'Registra i pasti per qualche giorno: ti dirò quali nutrienti ti mancano.' });

  const credit = weeklyCredit(state.workouts, todayISO), missing = ['chest', 'lats', 'quads', 'hams', 'glutes', 'deltS', 'biceps', 'triceps', 'abs']
    .filter(m => (credit[m] || 0) < 3).map(m => MUSCLE_NAMES[m].toLowerCase());
  if (state.workouts.length) {
    if (missing.length) out.push({ warn: false, text: `Questa settimana hai allenato poco: ${missing.slice(0, 4).join(', ')}.` });
    else out.push({ warn: false, text: 'Ottima distribuzione: tutti i grandi gruppi muscolari sono stati allenati questa settimana.' });
  } else out.push({ warn: false, text: 'Registra il primo allenamento per vedere i muscoli allenati sulla mappa.' });
  return out;
}

/** Cosa è successo in una data (per i puntini del calendario). */
export function dayInfo(state, iso) {
  const planned = !!templateFor(state, iso) && iso >= L.todayISO();
  return {
    food: state.food.some(e => e.date === iso),
    workout: state.workouts.some(w => w.date === iso),
    weight: state.weights.some(w => w.date === iso),
    photo: state.photos.some(p => p.date === iso),
    planned,
    menu: !!(state.plan && state.plan.days.some(d => d.date === iso)),
  };
}

/** Giorni dalla data più recente (null se mai). */
export function daysSince(list, todayISO) {
  if (!list.length) return null;
  const last = list.map(x => x.date).sort().at(-1);
  return Math.round((L.parseISO(todayISO) - L.parseISO(last)) / 86400000);
}
/** Griglia mensile (lunedì come primo giorno): 6 righe × 7 colonne di date ISO. */
export function monthGrid(year, month) {
  const first = L.toISO(new Date(year, month, 1, 12)), start = L.mondayOf(first), cells = [];
  for (let i = 0; i < 42; i++) { const d = L.addDays(start, i); cells.push({ iso: d, out: L.parseISO(d).getMonth() !== month }); }
  return cells;
}
