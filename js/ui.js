// Interfaccia: viste, modali e gestione eventi. Nessuna dipendenza esterna.
import * as L from './logic.js';
import { FOODS, RECIPES, EXERCISES } from './data.js';
import { getState, update, getDraft, updateDraft, resetDraft, newId, exportJSON, importJSON } from './store.js';
import { foodIcon, mealIcon, plateArt, exerciseFigure } from './art.js';

const $ = sel => document.querySelector(sel);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const EX = Object.fromEntries(EXERCISES.map(e => [e.id, e]));
const COL = { green: '#2E9E6B', pink: '#EF476F', orange: '#F4A261', blue: '#3A86FF' };
const TABS = [
  ['today', '📅', 'Oggi'], ['diet', '🍽️', 'Dieta'], ['gym', '🏋️', 'Palestra'], ['progress', '📈', 'Progressi'], ['profile', '👤', 'Profilo'],
];
const QUICK_TITLES = ['Push', 'Pull', 'Gambe', 'Full body', 'Core'];

const ui = { date: L.todayISO(), dietTab: 'menu', gymTab: 'workouts', muscle: '', modal: null };

// ============================================================ helpers HTML
const header = (title, back) => `<div class="hdr"><a class="back" href="${back}" aria-label="Indietro">‹</a><h2>${esc(title)}</h2></div>`;
const chips = (name, opts, sel) => `<div class="chips">${opts.map(o =>
  `<label class="chip"><input type="radio" name="${name}" value="${o.id}" ${o.id === sel ? 'checked' : ''}><span>${esc(o.label)}</span></label>`).join('')}</div>`;
const radios = (name, opts, sel) => `<div class="radios">${opts.map(o =>
  `<label class="radio"><input type="radio" name="${name}" value="${o.id}" ${o.id === sel ? 'checked' : ''}><span>${esc(o.label)}</span></label>`).join('')}</div>`;
const macroBar = (label, v, target, color, unit = 'g') => `<div class="mbar"><div class="mrow"><span>${label}</span><span>${L.fmt(v)} / ${L.fmt(target)} ${unit}</span></div>
  <div class="track"><div class="fill" style="width:${target > 0 ? Math.min(100, v / target * 100) : 0}%;background:${color}"></div></div></div>`;
const macroLine = m => `${L.fmt(m.kcal)} kcal · P ${L.fmt(m.p)} g · C ${L.fmt(m.c)} g · G ${L.fmt(m.f)} g`;
const sortedWeights = s => [...s.weights].sort((a, b) => a.date.localeCompare(b.date));

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 1800);
}

// ============================================================ grafici SVG
function barChart(values, labels, color, target = null) {
  const W = 320, H = 130, n = Math.max(values.length, 1), slot = W / n, bw = slot * 0.62;
  const max = Math.max(...values, target || 0, 1) * 1.1;
  const bars = values.map((v, i) => {
    const h = H * v / max;
    return `<rect x="${(i * slot + (slot - bw) / 2).toFixed(1)}" y="${(H - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="${color}"/>`;
  }).join('');
  const tl = target ? `<line x1="0" x2="${W}" y1="${(H * (1 - target / max)).toFixed(1)}" y2="${(H * (1 - target / max)).toFixed(1)}" stroke="#4A4E69" stroke-width="1.5" stroke-dasharray="6 4"/>` : '';
  const lb = labels.map((t, i) => `<text x="${(i * slot + slot / 2).toFixed(1)}" y="${H + 13}" text-anchor="middle" font-size="9" fill="#6b7a72">${t}</text>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H + 18}" role="img">${bars}${tl}${lb}</svg>`;
}
function lineChart(values, labels, color, unit) {
  if (!values.length) return '';
  const W = 320, H = 130, mn = Math.min(...values), mx = Math.max(...values);
  const pad = Math.max((mx - mn) * 0.15, 0.5), lo = mn - pad, hi = mx + pad, n = values.length;
  const pt = i => [n === 1 ? W / 2 : W * i / (n - 1), H * (1 - (values[i] - lo) / (hi - lo))];
  const pts = values.map((_, i) => pt(i).map(v => v.toFixed(1)).join(',')).join(' ');
  const grid = [0, 1, 2, 3].map(g => `<line x1="0" x2="${W}" y1="${H * g / 3}" y2="${H * g / 3}" stroke="#000" stroke-opacity=".1"/>`).join('');
  const dots = values.map((_, i) => { const [x, y] = pt(i); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="${color}"/>`; }).join('');
  return `<div class="minmax"><span>min ${L.fmt(mn, 1)} ${unit}</span><span>max ${L.fmt(mx, 1)} ${unit}</span></div>
    <svg class="chart" viewBox="0 0 ${W} ${H + 18}" role="img">${grid}${n > 1 ? `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>` : ''}${dots}
    <text x="0" y="${H + 13}" font-size="9" fill="#6b7a72">${labels[0]}</text><text x="${W}" y="${H + 13}" text-anchor="end" font-size="9" fill="#6b7a72">${labels[labels.length - 1]}</text></svg>`;
}
function ring(value, target) {
  const c = 2 * Math.PI * 42, f = Math.max(0, Math.min(1, value / target));
  return `<svg class="ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="none" stroke="#000" stroke-opacity=".1" stroke-width="10"/>
    <circle cx="50" cy="50" r="42" fill="none" stroke="${COL.green}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(c * f).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 50 50)"/>
    <text x="50" y="57" text-anchor="middle" font-size="21" font-weight="700" fill="#173A2A">${L.fmt(value)}</text></svg>`;
}

// ============================================================ profilo
function profileForm(editing) {
  const p = getState().profile || {};
  const v = (k, d = '') => esc(p[k] ?? d);
  return `<div class="page">
    ${editing ? header('Modifica profilo', '#/profile') : `<h1>Benvenuto in FitLife</h1><p class="muted">Dimmi qualcosa di te: calcolo il tuo fabbisogno e creo una dieta su misura.</p>`}
    <form id="pform" autocomplete="off">
      <label class="fld">Nome<input name="name" value="${v('name')}" autocapitalize="words"></label>
      <h3>Sesso</h3>${chips('sex', L.SEXES, p.sex || 'M')}
      <div class="row3">
        <label class="fld">Età<input name="age" inputmode="numeric" value="${v('age')}"></label>
        <label class="fld">Altezza (cm)<input name="height" inputmode="numeric" value="${v('heightCm')}"></label>
        <label class="fld">Peso (kg)<input name="weight" inputmode="decimal" value="${p.weightKg != null ? esc(L.clean(p.weightKg)) : ''}"></label>
      </div>
      <h3>Livello di attività</h3>${radios('activity', L.ACTIVITIES, p.activity || 'MODERATE')}
      <h3>Obiettivo</h3>${chips('goal', L.GOALS, p.goal || 'MAINTAIN')}
      <h3>Tipo di alimentazione</h3>${chips('diet', L.DIETS, p.diet || 'OMNIVORE')}
      <h3>Alimenti da evitare <span class="muted">(opzionale)</span></h3>
      <label class="fld"><input name="excluded" placeholder="es. tonno, noci, latte" value="${v('excluded')}"></label>
      <div id="ppreview"></div>
      <button type="button" class="btn primary block" data-action="save-profile" id="psave">${editing ? 'Salva' : 'Crea la mia dieta'}</button>
      <p class="muted small">Le stime sono indicative e non sostituiscono il parere di un medico o di un dietista.</p>
    </form>
    ${editing ? '' : `<label class="btn block filebtn">Ho già un backup: importalo<input type="file" id="import-file" accept="application/json,.json" hidden></label>`}</div>`;
}
function readProfileForm() {
  const f = $('#pform'); if (!f) return null;
  const fd = new FormData(f);
  const age = parseInt(fd.get('age'), 10), h = parseInt(fd.get('height'), 10), w = L.num(fd.get('weight'));
  if (!(age >= 14 && age <= 90 && h >= 120 && h <= 230 && w >= 30 && w <= 250)) return null;
  return {
    name: String(fd.get('name') || '').trim() || 'Atleta', sex: fd.get('sex'), age, heightCm: h, weightKg: w,
    activity: fd.get('activity'), goal: fd.get('goal'), diet: fd.get('diet'), excluded: String(fd.get('excluded') || '').trim(),
  };
}
function updateProfilePreview() {
  const p = readProfileForm(), box = $('#ppreview'), btn = $('#psave');
  if (!box) return;
  if (btn) btn.disabled = !p;
  if (!p) { box.innerHTML = ''; return; }
  const t = L.targets(p);
  box.innerHTML = `<div class="card hl"><div class="muted">Il tuo obiettivo giornaliero</div><div class="big">${t.kcal} kcal</div>
    <div>Proteine ${t.protein} g · Carboidrati ${t.carbs} g · Grassi ${t.fat} g</div>
    <div class="muted small">Metabolismo basale ${t.bmr} kcal · Fabbisogno ${t.tdee} kcal</div></div>`;
}
function regeneratePlan() {
  const s = getState(); if (!s.profile) return;
  const plan = L.generatePlan(s.profile, L.targets(s.profile), Math.floor(Math.random() * 100000) + 1);
  update(st => { st.plan = plan; st.checked = []; });
}
function saveProfile(p) {
  const old = getState().profile;
  update(s => {
    s.profile = p;
    const t = L.todayISO(), last = sortedWeights(s).at(-1);
    if (!last || last.kg !== p.weightKg) { s.weights = s.weights.filter(w => w.date !== t); s.weights.push({ date: t, kg: p.weightKg }); }
  });
  if (!old || JSON.stringify({ ...old, name: '' }) !== JSON.stringify({ ...p, name: '' })) regeneratePlan();
}

// ============================================================ OGGI
function viewToday() {
  const s = getState(), p = s.profile, t = L.targets(p), date = ui.date, isToday = date === L.todayISO();
  const entries = s.food.filter(e => e.date === date);
  const sum = k => entries.reduce((a, e) => a + e[k], 0);
  const kcal = sum('kcal'), left = t.kcal - kcal;
  const planDay = s.plan && s.plan.days.find(d => d.date === date);
  const meals = L.SLOTS.map(slot => {
    const list = entries.filter(e => e.meal === slot.id);
    const planned = planDay && planDay.meals.find(m => m.slot === slot.id);
    const rows = list.map(e => `<div class="entry"><div class="grow"><div>${esc(e.name)}</div>
      <div class="muted small">${e.grams > 0 ? L.fmt(e.grams) + ' g · ' : ''}${L.fmt(e.kcal)} kcal · P ${L.fmt(e.p)} C ${L.fmt(e.c)} G ${L.fmt(e.f)}</div></div>
      <button class="icon" data-action="del-food" data-id="${e.id}" aria-label="Elimina">🗑</button></div>`).join('');
    let sug = '';
    if (!list.length && planned) {
      const r = L.recipe(planned.recipeId);
      sug = `<div class="entry"><a class="grow plain" href="#/recipe/${r.id}/${planned.scale.toFixed(3)}"><div class="tag">Dal tuo menu</div><div>${esc(r.name)}</div>
        <div class="muted small">${L.fmt(L.plannedMacros(planned).kcal)} kcal</div></a>
        <button class="btn text" data-action="eat-planned" data-slot="${slot.id}">Mangiato</button></div>`;
    }
    return `<div class="card"><div class="mhead">${mealIcon(slot.id, 40)}<div class="grow"><strong>${slot.label}</strong>
      <div class="muted small">${L.fmt(list.reduce((a, e) => a + e.kcal, 0))} / ${L.fmt(t.kcal * slot.share)} kcal</div></div>
      <button class="icon add" data-action="open-add" data-slot="${slot.id}" aria-label="Aggiungi">＋</button></div>${rows}${sug}</div>`;
  }).join('');
  return `<div class="page"><h1>Ciao ${esc(p.name)}!</h1>
    <div class="datenav"><button class="icon" data-action="date-prev" aria-label="Giorno precedente">‹</button>
      <strong>${isToday ? 'Oggi · ' : ''}${L.prettyDate(date)}</strong>
      <button class="icon" data-action="date-next" ${isToday ? 'disabled' : ''} aria-label="Giorno successivo">›</button></div>
    <div class="card hl"><div class="sumrow">${ring(kcal, t.kcal)}<div><div class="strong">di ${t.kcal} kcal</div>
      <div>${left >= 0 ? `Ti restano ${L.fmt(left)} kcal` : `Oltre l'obiettivo di ${L.fmt(-left)} kcal`}</div></div></div>
      ${macroBar('Proteine', sum('p'), t.protein, COL.pink)}${macroBar('Carboidrati', sum('c'), t.carbs, COL.orange)}${macroBar('Grassi', sum('f'), t.fat, COL.blue)}</div>
    ${meals}</div>`;
}

// ---- modale "aggiungi al diario"
function foodListHTML(q) {
  const list = FOODS.filter(f => f.name.toLowerCase().includes(q.trim().toLowerCase()));
  if (!list.length) return '<p class="muted">Nessun alimento trovato.</p>';
  return list.map(f => `<button class="listrow" data-action="pick-food" data-id="${f.id}">${foodIcon(f.cat, 40)}<span class="grow"><span class="block">${esc(f.name)}</span>
    <span class="muted small">${L.fmt(f.kcal)} kcal / 100 g</span></span></button>`).join('');
}
function recipeListHTML(slot) {
  return [...RECIPES].sort((a, b) => (a.slot === slot ? 0 : 1) - (b.slot === slot ? 0 : 1)).map(r =>
    `<button class="listrow" data-action="pick-recipe" data-id="${r.id}"><span class="grow"><span class="block">${esc(r.name)}</span>
     <span class="muted small">${L.SLOT[r.slot].label} · ${L.fmt(L.recipeMacros(r).kcal)} kcal a porzione</span></span></button>`).join('');
}
function addModal() {
  const m = ui.modal, slot = L.SLOT[m.slot];
  let body = '';
  if (m.tab === 'foods') {
    if (!m.sel) body = `<input class="search" data-input="food-query" placeholder="Cerca alimento" value="${esc(m.query)}"><div id="plist">${foodListHTML(m.query)}</div>`;
    else {
      const f = L.food(m.sel);
      body = `<div class="pickhead">${foodIcon(f.cat, 64)}<h3>${esc(f.name)}</h3></div>
        <label class="fld">Quantità (grammi)<input data-input="grams" inputmode="decimal" value="${m.grams}"></label>
        ${f.pieceG ? `<p class="muted small">1 ${f.pieceName} ≈ ${f.pieceG} g</p>` : ''}
        <p id="pmacros"></p><div class="btnrow"><button class="btn" data-action="modal-back">Indietro</button><button class="btn primary" data-action="add-food">Aggiungi</button></div>`;
    }
  } else if (m.tab === 'recipes') {
    if (!m.sel) body = `<div id="plist">${recipeListHTML(m.slot)}</div>`;
    else {
      const r = L.recipe(m.sel);
      body = `<h3>${esc(r.name)}</h3><label class="fld">Porzioni<input data-input="portions" inputmode="decimal" value="${m.portions}"></label>
        <p id="pmacros"></p><div class="btnrow"><button class="btn" data-action="modal-back">Indietro</button><button class="btn primary" data-action="add-recipe">Aggiungi</button></div>`;
    }
  } else {
    body = `<label class="fld">Nome<input id="c-name" placeholder="es. Pizza"></label>
      <label class="fld">Calorie (kcal)<input id="c-kcal" inputmode="decimal"></label>
      <div class="row3"><label class="fld">Proteine g<input id="c-p" inputmode="decimal"></label><label class="fld">Carbo g<input id="c-c" inputmode="decimal"></label><label class="fld">Grassi g<input id="c-f" inputmode="decimal"></label></div>
      <button class="btn primary" data-action="add-custom">Aggiungi</button>`;
  }
  return `<div class="sheet"><div class="hdr"><button class="icon" data-action="close-modal" aria-label="Chiudi">✕</button><h2>Aggiungi a ${slot.label.toLowerCase()}</h2></div>
    <div class="tabsbar">${[['foods', 'Alimenti'], ['recipes', 'Ricette'], ['custom', 'Libero']].map(([k, l]) =>
    `<button class="${m.tab === k ? 'on' : ''}" data-action="modal-tab" data-tab="${k}">${l}</button>`).join('')}</div><div class="sheetbody">${body}</div></div>`;
}
function updateModalPreview() {
  const m = ui.modal, box = $('#pmacros'); if (!m || !box) return;
  if (m.tab === 'foods' && m.sel) box.textContent = macroLine(L.macrosFor(m.sel, L.num(m.grams) || 0));
  if (m.tab === 'recipes' && m.sel) box.textContent = macroLine(L.recipeMacros(L.recipe(m.sel), L.num(m.portions) || 0));
}

// ============================================================ DIETA
function viewDiet() {
  const s = getState(), t = L.targets(s.profile), plan = s.plan, tab = ui.dietTab;
  const tabs = `<div class="tabsbar">${[['menu', 'Menu'], ['shop', 'Spesa'], ['recipes', 'Ricette']].map(([k, l]) =>
    `<button class="${tab === k ? 'on' : ''}" data-action="diet-tab" data-tab="${k}">${l}</button>`).join('')}</div>`;
  let body = '';
  if (tab === 'menu') {
    body = `<div class="card"><div>Obiettivo ${t.kcal} kcal · P ${t.protein} g · C ${t.carbs} g · G ${t.fat} g</div>
      <button class="btn primary" data-action="regen">🔄 ${plan ? 'Nuovo menu della settimana' : 'Crea il menu'}</button></div>`;
    if (!plan) body += `<p>Nessun menu disponibile. Se hai escluso molti alimenti potrebbero non esserci ricette compatibili: prova a modificare le esclusioni nel profilo.</p>`;
    else {
      if (plan.days.at(-1).date < L.todayISO()) body += `<p class="err">Questo menu è scaduto: creane uno nuovo.</p>`;
      body += plan.days.map(day => {
        const m = L.dayMacros(day), today = day.date === L.todayISO();
        return `<div class="card"><div class="between"><strong class="${today ? 'accent' : ''}">${L.prettyDate(day.date)}${today ? ' · oggi' : ''}</strong>
          <span class="muted small">${L.fmt(m.kcal)} kcal · P ${L.fmt(m.p)} g</span></div>
          ${day.meals.map(pm => { const r = L.recipe(pm.recipeId);
          return `<a class="mealrow" href="#/recipe/${r.id}/${pm.scale.toFixed(3)}">${mealIcon(pm.slot, 34)}<span class="grow"><span class="tag">${L.SLOT[pm.slot].label}</span>
            <span class="block">${esc(r.name)}</span></span><span class="muted small">${L.fmt(L.plannedMacros(pm).kcal)} kcal</span></a>`; }).join('')}</div>`;
      }).join('');
    }
  } else if (tab === 'shop') {
    if (!plan) body = '<p>Crea prima il menu: la lista della spesa viene calcolata da lì.</p>';
    else {
      const items = L.shoppingList(plan), done = items.filter(i => s.checked.includes(i.foodId)).length;
      body = `<div class="between"><span>${done}/${items.length} presi</span><button class="btn" data-action="clear-shop">Azzera</button></div>`;
      let cat = '';
      for (const it of items) {
        if (it.cat !== cat) { cat = it.cat; body += `<div class="cathead">${foodIcon(cat, 30)}<strong>${L.CATEGORIES[cat]}</strong></div>`; }
        const ck = s.checked.includes(it.foodId);
        body += `<label class="shoprow ${ck ? 'done' : ''}"><input type="checkbox" data-action="toggle-shop" data-id="${it.foodId}" ${ck ? 'checked' : ''}>
          <span class="grow">${esc(it.name)}</span><span>${it.grams >= 1000 ? L.fmt(it.grams / 1000, 1) + ' kg' : it.grams + ' g'}</span></label>`;
      }
    }
  } else {
    body = L.SLOTS.map(sl => `<h3>${sl.label}</h3>` + RECIPES.filter(r => r.slot === sl.id).map(r => {
      const m = L.recipeMacros(r);
      return `<a class="mealrow" href="#/recipe/${r.id}/1">${plateArt(L.mainCategories(r), 56)}<span class="grow"><span class="block">${esc(r.name)}</span>
        <span class="muted small">${L.fmt(m.kcal)} kcal · P ${L.fmt(m.p)} g · ${r.prep} min</span></span></a>`;
    }).join('')).join('');
  }
  return `<div class="page"><h1>La tua dieta</h1>${tabs}${body}</div>`;
}

function viewRecipe(id, scale) {
  const r = L.recipe(id);
  if (!r) return `<div class="page">${header('Ricetta non trovata', '#/diet')}</div>`;
  const m = L.recipeMacros(r, scale);
  return `<div class="page">${header(r.name, '#/diet')}
    <div class="center">${plateArt(L.mainCategories(r), 170)}</div>
    <p class="strong">${macroLine(m)}</p>
    <p class="muted small">${L.SLOT[r.slot].label} · ${r.prep} minuti${Math.abs(scale - 1) > 0.001 ? ` · porzione ×${scale.toFixed(2).replace('.', ',')}` : ''}</p>
    <h3>Ingredienti</h3>${r.ing.map(([fid, g]) => `<div class="ingr">${foodIcon(L.food(fid).cat, 30)}<span class="grow">${esc(L.food(fid).name)}</span><span>${L.formatQty(fid, g * scale)}</span></div>`).join('')}
    <h3>Preparazione</h3>${r.steps.map((st, i) => `<p class="step"><b>${i + 1}.</b> ${esc(st)}</p>`).join('')}
    <h3>Aggiungi al diario di oggi</h3>
    <select id="rslot">${L.SLOTS.map(sl => `<option value="${sl.id}" ${sl.id === r.slot ? 'selected' : ''}>${sl.label}</option>`).join('')}</select>
    <button class="btn primary block" data-action="eat-recipe" data-id="${r.id}" data-scale="${scale}">Segna come mangiato</button></div>`;
}

// ============================================================ PALESTRA
const logSummary = log => log.sets.map(s => s.kg > 0 ? `${s.reps}×${L.clean(s.kg)}` : `${s.reps} rip`).join(' · ') + (log.sets.some(s => s.kg > 0) ? ' kg' : '');
function lastLog(exId) {
  const w = [...getState().workouts].sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id)).find(w => w.exercises.some(e => e.exerciseId === exId));
  return w ? { date: w.date, log: w.exercises.find(e => e.exerciseId === exId) } : null;
}
const volume = w => w.exercises.reduce((a, e) => a + e.sets.reduce((b, s) => b + s.reps * s.kg, 0), 0);
const totalSets = w => w.exercises.reduce((a, e) => a + e.sets.length, 0);
const muscleChips = sel => `<div class="chips scroll"><button class="chip btn-chip ${sel === '' ? 'on' : ''}" data-action="muscle" data-v="">Tutti</button>${Object.entries(L.MUSCLES).map(([k, l]) =>
  `<button class="chip btn-chip ${sel === k ? 'on' : ''}" data-action="muscle" data-v="${k}">${l}</button>`).join('')}</div>`;

function viewGym() {
  const s = getState(), tab = ui.gymTab, draft = getDraft(), hasDraft = draft.items.length > 0;
  let body = '';
  if (tab === 'workouts') {
    const list = [...s.workouts].sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
    body = list.length ? list.map(w => `<div class="card"><div class="mhead"><div class="grow"><strong>${esc(w.title)}</strong>
      <div class="muted small">${L.prettyDate(w.date)} · ${totalSets(w)} serie · ${L.fmt(volume(w))} kg di volume</div></div>
      <button class="icon" data-action="del-workout" data-id="${w.id}" aria-label="Elimina">🗑</button></div>
      ${w.exercises.map(e => { const ex = EX[e.exerciseId]; return ex ? `<a class="mealrow" href="#/exercise/${ex.id}">${exerciseFigure(ex, 48)}<span class="grow"><span class="block">${esc(ex.name)}</span>
        <span class="muted small">${logSummary(e)}</span></span></a>` : ''; }).join('')}</div>`).join('')
      : '<p class="muted">Nessun allenamento registrato. Premi “Nuovo allenamento” per iniziare.</p>';
  } else {
    body = muscleChips(ui.muscle) + EXERCISES.filter(e => !ui.muscle || e.muscle === ui.muscle).map(e =>
      `<a class="mealrow" href="#/exercise/${e.id}">${exerciseFigure(e, 64)}<span class="grow"><span class="block">${esc(e.name)}</span>
       <span class="muted small">${L.MUSCLES[e.muscle]} · ${L.EQUIP[e.equip]}</span></span></a>`).join('');
  }
  return `<div class="page"><h1>Palestra</h1>
    <a class="btn primary block" href="#/workout">${hasDraft ? '▶ Riprendi allenamento in corso' : '＋ Nuovo allenamento'}</a>
    ${hasDraft ? '<button class="btn text" data-action="discard-draft">Scarta la bozza</button>' : ''}
    <div class="tabsbar">${[['workouts', 'Allenamenti'], ['exercises', 'Esercizi']].map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-action="gym-tab" data-tab="${k}">${l}</button>`).join('')}</div>${body}</div>`;
}

function viewExercise(id) {
  const ex = EX[id];
  if (!ex) return `<div class="page">${header('Esercizio non trovato', '#/gym')}</div>`;
  const hist = [...getState().workouts].sort((a, b) => a.date.localeCompare(b.date))
    .map(w => ({ date: w.date, log: w.exercises.find(e => e.exerciseId === id) })).filter(h => h.log);
  const tops = hist.map(h => Math.max(...h.log.sets.map(s => s.kg)));
  let prog = '<p class="muted">Non hai ancora registrato questo esercizio.</p>';
  if (hist.length) {
    prog = (tops.some(v => v > 0) && tops.length >= 2 ? `<p class="muted small">Carico massimo per allenamento (kg)</p>${lineChart(tops, hist.map(h => L.shortDate(h.date)), COL.blue, 'kg')}` : '') +
      hist.slice(-6).reverse().map(h => `<div class="between"><span>${L.prettyDate(h.date)}</span><span>${logSummary(h.log)}</span></div>`).join('');
  }
  return `<div class="page">${header(ex.name, '#/gym')}<div class="center">${exerciseFigure(ex, 240, true)}</div>
    <p class="strong">${L.MUSCLES[ex.muscle]} · ${L.EQUIP[ex.equip]}</p><p>${esc(ex.tips)}</p><h3>I tuoi progressi</h3>${prog}</div>`;
}

function draftCard(it) {
  const ex = EX[it.exerciseId], last = lastLog(it.exerciseId);
  return `<div class="card"><div class="mhead">${exerciseFigure(ex, 72, true)}<div class="grow"><strong>${esc(ex.name)}</strong>
    ${last ? `<div class="muted small">Ultima volta (${L.shortDate(last.date)}): ${logSummary(last.log)}</div>` : ''}</div>
    <button class="icon" data-action="draft-rm-ex" data-uid="${it.uid}" aria-label="Rimuovi esercizio">🗑</button></div>
    <div class="setrow head"><span>Serie</span><span>Ripetizioni</span><span>Peso (kg)</span><span></span></div>
    ${it.sets.map((s, i) => `<div class="setrow"><span class="strong">${i + 1}</span>
      <input inputmode="numeric" data-input="set" data-uid="${it.uid}" data-sid="${s.id}" data-field="reps" value="${esc(s.reps)}" placeholder="Rip">
      <input inputmode="decimal" data-input="set" data-uid="${it.uid}" data-sid="${s.id}" data-field="kg" value="${esc(s.kg)}" placeholder="Kg">
      <button class="icon" data-action="draft-rm-set" data-uid="${it.uid}" data-sid="${s.id}" aria-label="Rimuovi serie">✕</button></div>`).join('')}
    <button class="btn text" data-action="draft-add-set" data-uid="${it.uid}">＋ Serie</button></div>`;
}
function viewWorkout() {
  const d = getDraft();
  return `<div class="page">${header('Nuovo allenamento', '#/gym')}
    <label class="fld">Nome<input data-input="draft-title" value="${esc(d.title)}" placeholder="Push, Gambe…"></label>
    <div class="chips scroll">${QUICK_TITLES.map(t => `<button class="chip btn-chip ${d.title === t ? 'on' : ''}" data-action="draft-title" data-v="${t}">${t}</button>`).join('')}</div>
    ${d.items.map(draftCard).join('')}
    <button class="btn primary block" data-action="open-picker">＋ Aggiungi esercizio</button>
    <button class="btn primary block" data-action="save-workout" ${d.items.length ? '' : 'disabled'}>Salva allenamento</button>
    <p id="werr" class="err" hidden>Inserisci almeno una serie con ripetizioni.</p></div>`;
}
function pickerListHTML(m) {
  const list = EXERCISES.filter(e => (!m.muscle || e.muscle === m.muscle) && e.name.toLowerCase().includes(m.query.trim().toLowerCase()));
  return list.map(e => `<button class="listrow" data-action="pick-ex" data-id="${e.id}">${exerciseFigure(e, 56)}<span class="grow"><span class="block">${esc(e.name)}</span>
    <span class="muted small">${L.MUSCLES[e.muscle]} · ${L.EQUIP[e.equip]}</span></span></button>`).join('') || '<p class="muted">Nessun esercizio trovato.</p>';
}
function pickerModal() {
  const m = ui.modal;
  return `<div class="sheet"><div class="hdr"><button class="icon" data-action="close-modal" aria-label="Chiudi">✕</button><h2>Scegli un esercizio</h2></div>
    <div class="sheetbody"><input class="search" data-input="picker-query" placeholder="Cerca" value="${esc(m.query)}">
    <div class="chips scroll" id="pchips">${pickerChips(m.muscle)}</div><div id="plist">${pickerListHTML(m)}</div></div></div>`;
}
const pickerChips = sel => `<button class="chip btn-chip ${sel === '' ? 'on' : ''}" data-action="picker-muscle" data-v="">Tutti</button>${Object.entries(L.MUSCLES).map(([k, l]) =>
  `<button class="chip btn-chip ${sel === k ? 'on' : ''}" data-action="picker-muscle" data-v="${k}">${l}</button>`).join('')}`;

// ============================================================ PROGRESSI
function viewProgress() {
  const s = getState(), t = L.targets(s.profile), today = L.todayISO();
  const ws = sortedWeights(s);
  let weight = '';
  if (ws.length >= 2) {
    const delta = ws.at(-1).kg - ws[0].kg, last = ws.slice(-30);
    weight = `<p>Da ${L.clean(ws[0].kg)} a ${L.clean(ws.at(-1).kg)} kg (${delta >= 0 ? '+' : ''}${L.fmt(delta, 1)} kg)</p>
      ${lineChart(last.map(w => w.kg), last.map(w => L.shortDate(w.date)), COL.green, 'kg')}
      ${ws.slice(-4).reverse().map(w => `<div class="entry"><span class="small">${L.shortDate(w.date)}</span><span class="grow">${L.clean(w.kg)} kg</span><button class="icon" data-action="del-weight" data-date="${w.date}" aria-label="Elimina">🗑</button></div>`).join('')}`;
  } else weight = '<p class="muted small">Registra il peso in giorni diversi per vedere l\'andamento.</p>';

  const days = [6, 5, 4, 3, 2, 1, 0].map(n => L.addDays(today, -n));
  const per = days.map(d => s.food.filter(e => e.date === d));
  const logged = per.filter(l => l.length);
  const cal = logged.length
    ? `<p>Media (giorni registrati): ${L.fmt(logged.reduce((a, l) => a + l.reduce((b, e) => b + e.kcal, 0), 0) / logged.length)} kcal e ${L.fmt(logged.reduce((a, l) => a + l.reduce((b, e) => b + e.p, 0), 0) / logged.length)} g di proteine. Obiettivo: ${t.kcal} kcal e ${t.protein} g.</p><p class="muted small">La linea tratteggiata è il tuo obiettivo.</p>`
    : '<p class="muted small">Nessun pasto registrato negli ultimi giorni.</p>';

  const monday = L.mondayOf(today), weeks = [7, 6, 5, 4, 3, 2, 1, 0].map(n => L.addDays(monday, -7 * n));
  const counts = weeks.map(w0 => s.workouts.filter(w => w.date >= w0 && w.date < L.addDays(w0, 7)).length);
  const since = L.addDays(today, -30), recent = s.workouts.filter(w => w.date >= since);

  return `<div class="page"><h1>I tuoi progressi</h1>
    <h3>Peso corporeo</h3><div class="card"><div class="wrow"><label class="fld grow">Peso di oggi (kg)<input id="w-input" inputmode="decimal" value="${L.clean(s.profile.weightKg)}"></label>
      <button class="btn primary" data-action="save-weight">Salva</button></div>${weight}</div>
    <h3>Calorie degli ultimi 7 giorni</h3><div class="card">${barChart(per.map(l => l.reduce((a, e) => a + e.kcal, 0)), days.map(L.shortDate), COL.orange, t.kcal)}${cal}</div>
    <h3>Allenamenti per settimana</h3><div class="card">${barChart(counts, weeks.map(L.shortDate), COL.blue)}
      <p>Ultimi 30 giorni: ${recent.length} allenamenti, ${recent.reduce((a, w) => a + totalSets(w), 0)} serie, ${L.fmt(recent.reduce((a, w) => a + volume(w), 0))} kg di volume totale.</p></div></div>`;
}

// ============================================================ PROFILO
function viewProfile() {
  const p = getState().profile, t = L.targets(p);
  const lab = (arr, id) => arr.find(x => x.id === id).label;
  return `<div class="page"><h1>${esc(p.name)}</h1>
    <div class="card"><p class="strong">${lab(L.SEXES, p.sex)}, ${p.age} anni · ${p.heightCm} cm · ${L.clean(p.weightKg)} kg</p>
      <div>Obiettivo: ${lab(L.GOALS, p.goal)}</div><div>Alimentazione: ${lab(L.DIETS, p.diet)}</div><div>Attività: ${lab(L.ACTIVITIES, p.activity)}</div>
      ${p.excluded ? `<div>Eviti: ${esc(p.excluded)}</div>` : ''}<div>BMI: ${L.fmt(L.bmi(p), 1)}</div></div>
    <h3>Il tuo fabbisogno</h3><div class="card hl"><div class="big">${t.kcal} kcal al giorno</div><div>Proteine ${t.protein} g · Carboidrati ${t.carbs} g · Grassi ${t.fat} g</div>
      <div class="muted small">Metabolismo basale: ${t.bmr} kcal<br>Dispendio giornaliero stimato: ${t.tdee} kcal</div></div>
    <a class="btn primary block" href="#/edit">Modifica profilo</a>
    <button class="btn block" data-action="regen">Rigenera il menu settimanale</button>
    <h3>Backup dei dati</h3><p class="muted small">I dati sono solo su questo telefono. Esporta un backup ogni tanto: se cancelli i dati del sito o cambi telefono puoi reimportarlo.</p>
    <button class="btn block" data-action="export">Esporta backup</button>
    <label class="btn block filebtn">Importa backup<input type="file" id="import-file" accept="application/json,.json" hidden></label>
    <button class="btn block danger" data-action="reset">Cancella tutti i dati</button>
    <p class="muted small">Le calorie sono calcolate con la formula di Mifflin-St Jeor e modulate sull'obiettivo (−15% per dimagrire, +10% per la massa). Sono stime: per esigenze particolari rivolgiti a un medico o a un dietista.</p></div>`;
}

// ============================================================ render
export function render() {
  const s = getState(), view = $('#view'), tabs = $('#tabs');
  const [, route = 'today', a, b] = location.hash.split('/');
  if (!s.profile) { view.innerHTML = profileForm(false); tabs.hidden = true; updateProfilePreview(); return; }
  if (route === 'edit') { view.innerHTML = profileForm(true); tabs.hidden = true; updateProfilePreview(); return; }
  let html, top = true;
  switch (route) {
    case 'diet': html = viewDiet(); break;
    case 'gym': html = viewGym(); break;
    case 'progress': html = viewProgress(); break;
    case 'profile': html = viewProfile(); break;
    case 'recipe': html = viewRecipe(a, parseFloat(b) || 1); top = false; break;
    case 'exercise': html = viewExercise(a); top = false; break;
    case 'workout': html = viewWorkout(); top = false; break;
    default: html = viewToday();
  }
  view.innerHTML = html;
  const cur = top ? (route === 'today' || !TABS.some(t => t[0] === route) ? 'today' : route) : '';
  tabs.hidden = !top;
  tabs.innerHTML = TABS.map(([r, ic, lb]) => `<a href="#/${r}" class="${r === cur ? 'on' : ''}"><span>${ic}</span>${lb}</a>`).join('');
  renderModal();
}
function renderModal() {
  const box = $('#modal'), m = ui.modal;
  document.body.classList.toggle('noscroll', !!m);
  if (!m) { box.innerHTML = ''; return; }
  box.innerHTML = m.type === 'add' ? addModal() : pickerModal();
  updateModalPreview();
}

// ============================================================ azioni (click)
const toDraftSets = () => getDraft();
function saveWorkout() {
  const d = getDraft();
  const exercises = d.items.map(it => ({
    exerciseId: it.exerciseId,
    sets: it.sets.map(s => ({ reps: parseInt(s.reps, 10), kg: L.num(s.kg) || 0 })).filter(s => s.reps > 0),
  })).filter(e => e.sets.length);
  if (!exercises.length) { $('#werr').hidden = false; return; }
  update(s => { s.workouts.push({ id: newId(), date: L.todayISO(), title: d.title.trim() || 'Allenamento', exercises }); });
  resetDraft(); toast('Allenamento salvato ✓'); location.hash = '#/gym';
}
function addEntry(e) { update(s => { s.food.push({ id: newId(), ...e }); }); }
function eatRecipe(r, scale, slot, date) {
  const m = L.recipeMacros(r, scale);
  addEntry({ date, meal: slot, name: r.name, grams: L.recipeGrams(r, scale), kcal: m.kcal, p: m.p, c: m.c, f: m.f });
}

const actions = {
  'save-profile'() { const p = readProfileForm(); if (!p) return; const editing = !!getState().profile; saveProfile(p); location.hash = editing ? '#/profile' : '#/today'; render(); },
  'date-prev'() { ui.date = L.addDays(ui.date, -1); render(); },
  'date-next'() { if (ui.date < L.todayISO()) { ui.date = L.addDays(ui.date, 1); render(); } },
  'del-food'(d) { update(s => { s.food = s.food.filter(e => String(e.id) !== d.id); }); render(); },
  'eat-planned'(d) {
    const day = getState().plan.days.find(x => x.date === ui.date), pm = day && day.meals.find(m => m.slot === d.slot);
    if (pm) { eatRecipe(L.recipe(pm.recipeId), pm.scale, d.slot, ui.date); render(); }
  },
  'open-add'(d) { ui.modal = { type: 'add', slot: d.slot, tab: 'foods', query: '', sel: null, grams: '100', portions: '1' }; renderModal(); },
  'close-modal'() { ui.modal = null; renderModal(); },
  'modal-tab'(d) { Object.assign(ui.modal, { tab: d.tab, sel: null }); renderModal(); },
  'modal-back'() { ui.modal.sel = null; renderModal(); },
  'pick-food'(d) { const f = L.food(d.id); Object.assign(ui.modal, { sel: d.id, grams: String(f.pieceG || 100) }); renderModal(); },
  'pick-recipe'(d) { Object.assign(ui.modal, { sel: d.id, portions: '1' }); renderModal(); },
  'add-food'() {
    const m = ui.modal, g = L.num(m.grams); if (!(g > 0)) return;
    const f = L.food(m.sel), mm = L.macrosFor(m.sel, g);
    addEntry({ date: ui.date, meal: m.slot, name: f.name, grams: g, kcal: mm.kcal, p: mm.p, c: mm.c, f: mm.f });
    ui.modal = null; render(); toast('Aggiunto ✓');
  },
  'add-recipe'() {
    const m = ui.modal, s = L.num(m.portions); if (!(s > 0)) return;
    eatRecipe(L.recipe(m.sel), s, m.slot, ui.date); ui.modal = null; render(); toast('Aggiunto ✓');
  },
  'add-custom'() {
    const k = L.num($('#c-kcal').value); if (!(k > 0)) return;
    addEntry({ date: ui.date, meal: ui.modal.slot, name: $('#c-name').value.trim() || 'Pasto libero', grams: 0, kcal: k,
      p: L.num($('#c-p').value) || 0, c: L.num($('#c-c').value) || 0, f: L.num($('#c-f').value) || 0 });
    ui.modal = null; render(); toast('Aggiunto ✓');
  },
  'diet-tab'(d) { ui.dietTab = d.tab; render(); },
  'regen'() { regeneratePlan(); render(); toast('Nuovo menu creato ✓'); },
  'toggle-shop'(d) { update(s => { s.checked = s.checked.includes(d.id) ? s.checked.filter(x => x !== d.id) : [...s.checked, d.id]; }); render(); },
  'clear-shop'() { update(s => { s.checked = []; }); render(); },
  'eat-recipe'(d) { eatRecipe(L.recipe(d.id), parseFloat(d.scale) || 1, $('#rslot').value, L.todayISO()); toast('Aggiunto al diario di oggi ✓'); },
  'gym-tab'(d) { ui.gymTab = d.tab; render(); },
  'muscle'(d) { ui.muscle = d.v; render(); },
  'del-workout'(d) { if (confirm('Eliminare questo allenamento?')) { update(s => { s.workouts = s.workouts.filter(w => String(w.id) !== d.id); }); render(); } },
  'discard-draft'() { if (confirm('Scartare l\'allenamento in corso?')) { resetDraft(); render(); } },
  'draft-title'(d) { updateDraft(x => { x.title = d.v; }); render(); },
  'open-picker'() { ui.modal = { type: 'picker', query: '', muscle: '' }; renderModal(); },
  'picker-muscle'(d) { ui.modal.muscle = d.v; $('#pchips').innerHTML = pickerChips(d.v); $('#plist').innerHTML = pickerListHTML(ui.modal); },
  'pick-ex'(d) {
    const last = lastLog(d.id), first = last && last.log.sets[0];
    updateDraft(x => { x.items.push({ uid: newId(), exerciseId: d.id, sets: [{ id: newId(), reps: first ? String(first.reps) : '', kg: first ? L.clean(first.kg).replace(',', '.') : '' }] }); });
    ui.modal = null; render();
  },
  'draft-rm-ex'(d) { updateDraft(x => { x.items = x.items.filter(i => String(i.uid) !== d.uid); }); render(); },
  'draft-add-set'(d) {
    updateDraft(x => { const it = x.items.find(i => String(i.uid) === d.uid), p = it.sets.at(-1); it.sets.push({ id: newId(), reps: p ? p.reps : '', kg: p ? p.kg : '' }); });
    render();
  },
  'draft-rm-set'(d) { updateDraft(x => { const it = x.items.find(i => String(i.uid) === d.uid); it.sets = it.sets.filter(s => String(s.id) !== d.sid); }); render(); },
  'save-workout'() { saveWorkout(); },
  'save-weight'() {
    const w = L.num($('#w-input').value); if (!(w >= 30 && w <= 250)) return;
    update(s => { const t = L.todayISO(); s.weights = s.weights.filter(x => x.date !== t); s.weights.push({ date: t, kg: w }); s.profile.weightKg = w; });
    render(); toast('Peso salvato ✓');
  },
  'del-weight'(d) { update(s => { s.weights = s.weights.filter(w => w.date !== d.date); }); render(); },
  async 'export'() {
    const text = exportJSON(), name = `fitlife-backup-${L.todayISO()}.json`;
    const file = new File([text], name, { type: 'application/json' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Backup FitLife' }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  },
  'reset'() {
    if (confirm('Cancellare tutti i dati (profilo, diario, allenamenti)? Non si può annullare.')) {
      localStorage.removeItem('fitlife.v1'); localStorage.removeItem('fitlife.draft.v1'); location.hash = ''; location.reload();
    }
  },
};

// ============================================================ input
const inputs = {
  'food-query'(el) { ui.modal.query = el.value; $('#plist').innerHTML = foodListHTML(el.value); },
  'grams'(el) { ui.modal.grams = el.value; updateModalPreview(); },
  'portions'(el) { ui.modal.portions = el.value; updateModalPreview(); },
  'picker-query'(el) { ui.modal.query = el.value; $('#plist').innerHTML = pickerListHTML(ui.modal); },
  'draft-title'(el) { updateDraft(x => { x.title = el.value; }); },
  'set'(el) {
    updateDraft(x => { const s = x.items.find(i => String(i.uid) === el.dataset.uid).sets.find(s => String(s.id) === el.dataset.sid); s[el.dataset.field] = el.value; });
  },
};

export function bindEvents() {
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el || el.tagName === 'INPUT') return;
    const fn = actions[el.dataset.action]; if (fn) fn(el.dataset, el);
  });
  document.addEventListener('change', e => {
    const el = e.target;
    if (el.matches && el.matches('input[type=checkbox][data-action]')) { actions[el.dataset.action](el.dataset, el); return; }
    if (el.id === 'import-file' && el.files[0]) {
      el.files[0].text().then(t => {
        try { importJSON(t); toast('Backup importato ✓'); location.hash = '#/today'; render(); } catch (err) { alert('File di backup non valido.'); }
      });
    }
  });
  document.addEventListener('input', e => {
    const el = e.target;
    if (el.closest && el.closest('#pform')) { updateProfilePreview(); return; }
    const fn = el.dataset && inputs[el.dataset.input]; if (fn) fn(el);
  });
  document.addEventListener('submit', e => e.preventDefault());
}
