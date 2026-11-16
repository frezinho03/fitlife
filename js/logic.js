// Logica pura (nessun accesso al DOM): calcolo fabbisogni, generatore dieta, lista spesa, date.
import { FOODS, RECIPES } from './data.js';
import { EXTRA_FOODS, EXTRA_RECIPES } from './extra.js';
import { seasonScore } from './season.js';
import { USER_FOODS, FOOD_CATS } from './catalog.js';

export const SLOTS = [
  { id: 'BREAKFAST', label: 'Colazione', share: 0.22 },
  { id: 'LUNCH', label: 'Pranzo', share: 0.36 },
  { id: 'SNACK', label: 'Spuntino', share: 0.12 },
  { id: 'DINNER', label: 'Cena', share: 0.30 },
];
export const SLOT = Object.fromEntries(SLOTS.map(s => [s.id, s]));

export const ACTIVITIES = [
  { id: 'SEDENTARY', label: 'Sedentario (poco movimento)', factor: 1.2 },
  { id: 'LIGHT', label: 'Leggero (1-3 allenamenti a settimana)', factor: 1.375 },
  { id: 'MODERATE', label: 'Moderato (3-5 allenamenti a settimana)', factor: 1.55 },
  { id: 'HIGH', label: 'Alto (6-7 allenamenti a settimana)', factor: 1.725 },
];
export const GOALS = [
  { id: 'LOSE', label: 'Dimagrire', delta: -0.15, protPerKg: 2.0 },
  { id: 'MAINTAIN', label: 'Mantenere il peso', delta: 0, protPerKg: 1.6 },
  { id: 'GAIN', label: 'Mettere massa', delta: 0.10, protPerKg: 1.8 },
];
export const DIETS = [
  { id: 'OMNIVORE', label: 'Onnivoro' },
  { id: 'PESCATARIAN', label: 'Pescetariano' },
  { id: 'VEGETARIAN', label: 'Vegetariano' },
];
export const SEXES = [{ id: 'M', label: 'Uomo' }, { id: 'F', label: 'Donna' }];

export const CATEGORIES = {
  GRAIN: 'Cereali e derivati', FRUIT: 'Frutta', VEGETABLE: 'Verdure', MEAT: 'Carne', FISH: 'Pesce',
  EGG: 'Uova', DAIRY: 'Latticini', LEGUME: 'Legumi e tofu', NUTS: 'Frutta secca',
  FAT: 'Grassi e condimenti', SWEET: 'Dolci',
};
const CAT_ORDER = Object.keys(CATEGORIES);

export const MUSCLES = {
  CHEST: 'Petto', BACK: 'Schiena', LEGS: 'Gambe', GLUTES: 'Glutei', SHOULDERS: 'Spalle', ARMS: 'Braccia', CORE: 'Addome',
};
export const EQUIP = { BARBELL: 'Bilanciere', DUMBBELL: 'Manubri', BODYWEIGHT: 'Corpo libero', MACHINE: 'Macchina', KETTLEBELL: 'Kettlebell', BAND: 'Banda', CABLE: 'Cavi' };

const BASE_FOODS = [...FOODS, ...EXTRA_FOODS];
const FOOD = Object.fromEntries([...BASE_FOODS, ...USER_FOODS].map(f => [f.id, f]));
export const baseFoods = () => BASE_FOODS;
export const FOOD_CATEGORIES = FOOD_CATS;
export const foodsOfCat = cid => USER_FOODS.filter(f => f.ucat === cid);
const BASE_RECIPES = [...RECIPES, ...EXTRA_RECIPES];
let USER_RECIPES = [];
const RECIPE = {};
const reindex = () => { for (const k of Object.keys(RECIPE)) delete RECIPE[k]; [...BASE_RECIPES, ...USER_RECIPES].forEach(r => { RECIPE[r.id] = r; }); };
reindex();
/** Ricette create dall'utente: vengono aggiunte a quelle dell'app. */
export const setUserRecipes = list => { USER_RECIPES = Array.isArray(list) ? list : []; reindex(); };
export const allRecipes = () => [...BASE_RECIPES, ...USER_RECIPES];
export const allFoods = () => Object.values(FOOD);
export const food = id => FOOD[id];
export const recipe = id => RECIPE[id];

// ---------------------------------------------------------------- nutrizione
export function macrosFor(foodId, grams) {
  const f = FOOD[foodId], k = grams / 100;
  return { kcal: f.kcal * k, p: f.p * k, c: f.c * k, f: f.f * k };
}
const add = (a, b) => ({ kcal: a.kcal + b.kcal, p: a.p + b.p, c: a.c + b.c, f: a.f + b.f });
const zero = () => ({ kcal: 0, p: 0, c: 0, f: 0 });
export const scaleM = (m, k) => ({ kcal: m.kcal * k, p: m.p * k, c: m.c * k, f: m.f * k });

export function recipeMacros(r, scale = 1) {
  return scaleM(r.ing.reduce((acc, [id, g]) => add(acc, macrosFor(id, g)), zero()), scale);
}
export const recipeGrams = (r, scale = 1) => r.ing.reduce((s, [, g]) => s + g, 0) * scale;
export const isPescatarian = r => r.ing.every(([id]) => FOOD[id].cat !== 'MEAT');
export const isVegetarian = r => r.ing.every(([id]) => FOOD[id].cat !== 'MEAT' && FOOD[id].cat !== 'FISH');
export const mainCategories = r => [...new Set(r.ing.map(([id]) => FOOD[id].cat))].filter(c => c !== 'FAT');

const PLURALS = { uovo: 'uova', fetta: 'fette', mela: 'mele', arancia: 'arance', banana: 'banane' };
export function formatQty(foodId, grams) {
  const f = FOOD[foodId];
  const g = Math.max(5, Math.round(grams / 5) * 5);
  if (f.pieceG) {
    const n = Math.max(1, Math.round(grams / f.pieceG));
    const nome = n === 1 ? f.pieceName : (PLURALS[f.pieceName] || f.pieceName);
    return `${g} g (≈ ${n} ${nome})`;
  }
  return `${g} g`;
}

export function bmr(p) {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return p.sex === 'M' ? base + 5 : base - 161;
}
export function bmi(p) { const m = p.heightCm / 100; return p.weightKg / (m * m); }

export function targets(p) {
  const b = bmr(p);
  const act = ACTIVITIES.find(a => a.id === p.activity);
  const goal = GOALS.find(g => g.id === p.goal);
  const tdee = b * act.factor;
  const kcal = Math.max(1200, tdee * (1 + goal.delta));
  const protein = p.weightKg * goal.protPerKg;
  const fat = kcal * 0.25 / 9;
  const carbs = Math.max(0, (kcal - protein * 4 - fat * 9) / 4);
  return {
    bmr: Math.round(b), tdee: Math.round(tdee), kcal: Math.round(kcal),
    protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.round(fat),
  };
}

// ---------------------------------------------------------------- generatore dieta
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function eligible(profile, slot) {
  const excluded = (profile.excluded || '').split(/[,;\n]/).map(s => s.trim().toLowerCase()).filter(s => s.length >= 3);
  return allRecipes().filter(r => {
    if (r.slot !== slot || r.inPlan === false) return false;
    if (profile.diet === 'PESCATARIAN' && !isPescatarian(r)) return false;
    if (profile.diet === 'VEGETARIAN' && !isVegetarian(r)) return false;
    return !r.ing.some(([id]) => {
      const name = FOOD[id].name.toLowerCase();
      return excluded.some(ex => name.includes(ex) || r.name.toLowerCase().includes(ex));
    });
  });
}

export const scaleFor = (r, kcalTarget) => Math.min(2.2, Math.max(0.5, kcalTarget / recipeMacros(r).kcal));
export const plannedMacros = m => recipeMacros(RECIPE[m.recipeId], m.scale);
export const dayMacros = day => day.meals.reduce((acc, m) => add(acc, plannedMacros(m)), zero());

/** 7 giorni di menu: prova 40 combinazioni casuali e tiene quella con le proteine più vicine all'obiettivo. */
export function generatePlan(profile, tg, seed, startISO = todayISO()) {
  const pools = {};
  for (const s of SLOTS) { pools[s.id] = eligible(profile, s.id); if (!pools[s.id].length) return null; }
  let best = null, bestScore = Infinity;
  for (let attempt = 0; attempt < 40; attempt++) {
    const rnd = mulberry32(seed * 1000 + attempt);
    const recent = Object.fromEntries(SLOTS.map(s => [s.id, []]));
    const days = [];
    for (let d = 0; d < 7; d++) {
      const meals = SLOTS.map(s => {
        const pool = pools[s.id];
        let cand = pool.filter(r => !recent[s.id].includes(r.id));
        if (!cand.length) cand = pool;
        const month = parseISO(startISO).getMonth() + 1, w = cand.map(r => 0.15 + seasonScore(r, month)), tot = w.reduce((a, b) => a + b, 0);
        let x = rnd() * tot, ci = 0; while (ci < cand.length - 1 && x > w[ci]) { x -= w[ci]; ci++; }
        const chosen = cand[ci];
        recent[s.id].push(chosen.id);
        while (recent[s.id].length > 2) recent[s.id].shift();
        return { slot: s.id, recipeId: chosen.id, scale: scaleFor(chosen, tg.kcal * s.share) };
      });
      days.push({ date: addDays(startISO, d), meals });
    }
    const score = days.reduce((a, day) => a + Math.abs(dayMacros(day).p - tg.protein), 0);
    if (score < bestScore) { bestScore = score; best = days; }
  }
  return { seed, kcalTarget: tg.kcal, days: best };
}

export function shoppingList(plan) {
  const tot = {};
  for (const day of plan.days) for (const m of day.meals) {
    const r = RECIPE[m.recipeId];
    for (const [id, g] of r.ing) tot[id] = (tot[id] || 0) + g * m.scale;
  }
  return Object.entries(tot).map(([id, g]) => ({
    foodId: id, name: FOOD[id].name, cat: FOOD[id].cat, grams: Math.ceil(g / 10) * 10,
  })).sort((a, b) => CAT_ORDER.indexOf(a.cat) - CAT_ORDER.indexOf(b.cat) || a.name.localeCompare(b.name, 'it'));
}

// ---------------------------------------------------------------- date (stringhe YYYY-MM-DD, fuso locale)
const pad = n => String(n).padStart(2, '0');
export const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => toISO(new Date());
export const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
export const addDays = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); };
export function prettyDate(iso) {
  const s = parseISO(iso).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
export const shortDate = iso => { const d = parseISO(iso); return `${d.getDate()}/${d.getMonth() + 1}`; };
export function mondayOf(iso) { const d = parseISO(iso); const w = (d.getDay() + 6) % 7; return addDays(iso, -w); }

export const num = (s) => { const v = parseFloat(String(s).replace(',', '.')); return Number.isFinite(v) ? v : null; };
export const fmt = (v, dec = 0) => dec ? v.toFixed(dec).replace('.', ',') : String(Math.round(v));
export const clean = v => (Math.abs(v % 1) < 1e-9 ? String(Math.round(v)) : v.toFixed(1).replace('.', ','));
