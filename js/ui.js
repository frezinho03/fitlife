// Interfaccia: viste, modali e gestione eventi. Nessuna dipendenza esterna.
import * as L from './logic.js';
import { EXERCISES } from './data.js';
import * as S from './season.js';
import { getState, update, settings, setSetting, getDraft, updateDraft, resetDraft, newId, exportJSON, importJSON, putPhoto, getPhoto, delPhoto, shrinkImage } from './store.js';
import { foodIcon, mealIcon, plateArt } from './art.js';
const exerciseFigure = (ex, size) => muscleIcon(highlightFor(infoFor(ex.id)), size);
import { bodyMap, highlightFor, MUSCLE_NAMES, setBuild, setSex, muscleIcon } from './body.js';
import { infoFor } from './exinfo.js';
import * as P from './plan.js';

const $ = sel => document.querySelector(sel);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const EX = Object.fromEntries(EXERCISES.map(e => [e.id, e]));
const COL = { green: '#10B981', pink: '#EF476F', orange: '#F59E0B', blue: '#3B82F6' };
const ic = d => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const ICON = {
  home: ic('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
  diary: ic('<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/>'),
  diet: ic('<path d="M7 3v8a2 2 0 0 0 2 2v8"/><path d="M5 3v6M9 3v6"/><path d="M17 3c-2 2-3 5-3 8h3v10"/>'),
  gym: ic('<path d="M3 9v6M6 6v12M18 6v12M21 9v6M6 12h12"/>'),
  chart: ic('<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>'),
  gear: ic('<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.7h4l.4-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/>'),
};
const TABS = [['home', 'Home'], ['today', 'Diario'], ['diet', 'Dieta'], ['gym', 'Palestra'], ['progress', 'Progressi']];
const TAB_OF = { home: 'home', today: 'today', diet: 'diet', gym: 'gym', progress: 'progress', calendar: 'home', plan: 'gym', photos: 'progress', profile: '' };
const GRIP = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="6" r="1.7"/><circle cx="15" cy="6" r="1.7"/><circle cx="9" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="9" cy="18" r="1.7"/><circle cx="15" cy="18" r="1.7"/></svg>';
const QUICK_TITLES = ['Push', 'Pull', 'Gambe', 'Full body', 'Core'];

const _n = new Date();
const ui = { date: L.todayISO(), dietTab: 'menu', gymTab: 'workouts', muscle: '', modal: null, cal: { y: _n.getFullYear(), m: _n.getMonth(), sel: L.todayISO() } };

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
  const tl = target ? `<line x1="0" x2="${W}" y1="${(H * (1 - target / max)).toFixed(1)}" y2="${(H * (1 - target / max)).toFixed(1)}" stroke="currentColor" stroke-width="1.5" stroke-dasharray="6 4"/>` : '';
  const lb = labels.map((t, i) => `<text x="${(i * slot + slot / 2).toFixed(1)}" y="${H + 13}" text-anchor="middle" font-size="9">${t}</text>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H + 18}" role="img">${bars}${tl}${lb}</svg>`;
}
function lineChart(values, labels, color, unit) {
  if (!values.length) return '';
  const W = 320, H = 130, mn = Math.min(...values), mx = Math.max(...values);
  const pad = Math.max((mx - mn) * 0.15, 0.5), lo = mn - pad, hi = mx + pad, n = values.length;
  const pt = i => [n === 1 ? W / 2 : W * i / (n - 1), H * (1 - (values[i] - lo) / (hi - lo))];
  const pts = values.map((_, i) => pt(i).map(v => v.toFixed(1)).join(',')).join(' ');
  const grid = [0, 1, 2, 3].map(g => `<line x1="0" x2="${W}" y1="${H * g / 3}" y2="${H * g / 3}" stroke="currentColor" stroke-opacity=".18"/>`).join('');
  const dots = values.map((_, i) => { const [x, y] = pt(i); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="${color}"/>`; }).join('');
  return `<div class="minmax"><span>min ${L.fmt(mn, 1)} ${unit}</span><span>max ${L.fmt(mx, 1)} ${unit}</span></div>
    <svg class="chart" viewBox="0 0 ${W} ${H + 18}" role="img">${grid}${n > 1 ? `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>` : ''}${dots}
    <text x="0" y="${H + 13}" font-size="9">${labels[0]}</text><text x="${W}" y="${H + 13}" text-anchor="end" font-size="9">${labels[labels.length - 1]}</text></svg>`;
}
function ring(value, target) {
  const c = 2 * Math.PI * 42, f = Math.max(0, Math.min(1, value / target));
  return `<svg class="ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" stroke-opacity=".14" stroke-width="10"/>
    <circle cx="50" cy="50" r="42" fill="none" stroke="${COL.green}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(c * f).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 50 50)"/>
    <text x="50" y="57" text-anchor="middle" font-size="21" font-weight="700">${L.fmt(value)}</text></svg>`;
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
  return `<div class="page"><h1>Diario</h1>
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
  const list = L.allFoods().filter(f => f.name.toLowerCase().includes(q.trim().toLowerCase()));
  if (!list.length) return '<p class="muted">Nessun alimento trovato.</p>';
  return list.map(f => `<button class="listrow" data-action="pick-food" data-id="${f.id}">${foodIcon(f.cat, 40)}<span class="grow"><span class="block">${esc(f.name)}</span>
    <span class="muted small">${L.fmt(f.kcal)} kcal / 100 g</span></span></button>`).join('');
}
function recipeListHTML(slot) {
  return [...L.allRecipes()].sort((a, b) => (a.slot === slot ? 0 : 1) - (b.slot === slot ? 0 : 1)).map(r =>
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
    body = recipesTab();
  }
  return `<div class="page"><h1>La tua dieta</h1>${tabs}${body}</div>`;
}

function viewRecipe(id, scale) {
  const r = L.recipe(id);
  if (!r) return `<div class="page">${header('Ricetta non trovata', '#/diet')}</div>`;
  const m = L.recipeMacros(r, scale);
  return `<div class="page">${header(r.name, '#/diet')}
    <div class="center">${plateArt(L.mainCategories(r), 170)}</div>
    ${r.user ? `<p class="center"><a class="btn sm" href="#/myrecipe/${r.id}">✏️ Modifica la mia ricetta</a></p>` : S.seasonScore(r, monthNow()) >= 0.7 ? '<p class="center"><span class="pill g">di stagione</span></p>' : ''}
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
      <div class="muted small">${L.prettyDate(w.date)} · ${w.kind === 'run' ? `${w.min} min${w.km ? ` · ${L.fmt(w.km, 1)} km` : ''}` : `${totalSets(w)} serie · ${L.fmt(volume(w))} kg di volume`}${w.kcal ? ` · ~${w.kcal} kcal` : ''}</div></div>
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
    ${hasDraft ? '<a class="btn primary block" href="#/workout">▶ Riprendi allenamento in corso</a>' : '<button class="btn primary block" data-action="open-start">▶ Avvia un allenamento</button>'}
    ${hasDraft ? '<button class="btn text" data-action="discard-draft">Scarta la bozza</button>' : ''}
    <a class="btn block" href="#/plan">📋 Schede e giorni di allenamento</a>
    <div class="tabsbar">${[['workouts', 'Allenamenti'], ['exercises', 'Esercizi']].map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-action="gym-tab" data-tab="${k}">${l}</button>`).join('')}</div>${body}</div>`;
}

function viewExercise(id) {
  const ex = EX[id];
  if (!ex) return `<div class="page">${header('Esercizio non trovato', '#/gym')}</div>`;
  const info = infoFor(id);
  const hist = [...getState().workouts].sort((a, b) => a.date.localeCompare(b.date))
    .map(w => ({ date: w.date, log: w.exercises.find(e => e.exerciseId === id) })).filter(h => h.log);
  const tops = hist.map(h => Math.max(...h.log.sets.map(s => s.kg)));
  let prog = '<p class="muted">Non hai ancora registrato questo esercizio.</p>';
  if (hist.length) {
    prog = (tops.some(v => v > 0) && tops.length >= 2 ? `<p class="muted small">Carico massimo per allenamento (kg)</p>${lineChart(tops, hist.map(h => L.shortDate(h.date)), COL.blue, 'kg')}` : '') +
      hist.slice(-6).reverse().map(h => `<div class="between"><span>${L.prettyDate(h.date)}</span><span>${logSummary(h.log)}</span></div>`).join('');
  }
  const pills = (list, cls) => list.map(m => `<span class="pill ${cls}">${MUSCLE_NAMES[m]}</span>`).join('');
  return `<div class="page">${header(ex.name, '#/gym')}
    <h3>Muscoli coinvolti</h3>
    <div class="vpanel">${bodyMap(highlightFor(info))}<div class="cap">Rosso pieno = primari · rosso tenue = secondari</div></div>
    <p style="margin-top:10px">${pills(info.p, 'p')}${pills(info.s, 's')}</p>
    <p class="muted small">${L.EQUIP[ex.equip]} · indicazione di partenza: ${info.reps} ripetizioni, riposo ${P.fmtRest(info.rest)} tra le serie</p>
    <h3>Come si esegue</h3><ol class="nums">${info.steps.map(t => `<li><span>${esc(t)}</span></li>`).join('')}</ol>
    <h3>Errori da evitare</h3><ul class="bul">${info.mistakes.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    <h3>Respirazione</h3><p>${esc(info.breath)}</p>
    <h3>I tuoi progressi</h3>${prog}</div>`;
}

function draftCard(it) {
  const ex = EX[it.exerciseId], last = lastLog(it.exerciseId), rest = it.rest || settings().restSec;
  return `<div class="card"><div class="mhead"><a href="#/exercise/${ex.id}">${exerciseFigure(ex, 72, false)}</a><div class="grow"><strong>${esc(ex.name)}</strong>
    ${last ? `<div class="muted small">Ultima volta (${L.shortDate(last.date)}): ${logSummary(last.log)}</div>` : ''}
    <label class="small muted">Riposo <input class="restin" inputmode="text" data-input="rest" data-uid="${it.uid}" value="${fmtDur(rest)}" style="width:64px;padding:4px;border:1px solid var(--fieldline);border-radius:8px;background:var(--field);text-align:center"> min:sec</label></div>
    <button class="icon" data-action="draft-rm-ex" data-uid="${it.uid}" aria-label="Rimuovi esercizio">🗑</button></div>
    <div class="setrow head"><span>Serie</span><span>Ripetizioni</span><span>Peso (kg)</span><span>Fatta</span><span></span></div>
    ${it.sets.map((s, i) => `<div class="setrow ${s.done ? 'done' : ''}"><span class="strong">${i + 1}</span>
      <input inputmode="numeric" data-input="set" data-uid="${it.uid}" data-sid="${s.id}" data-field="reps" value="${esc(s.reps)}" placeholder="Rip">
      <input inputmode="decimal" data-input="set" data-uid="${it.uid}" data-sid="${s.id}" data-field="kg" value="${esc(s.kg)}" placeholder="Kg">
      <button class="ok ${s.done ? 'on' : ''}" data-action="set-done" data-uid="${it.uid}" data-sid="${s.id}" aria-label="Serie completata">✓</button>
      <button class="icon" data-action="draft-rm-set" data-uid="${it.uid}" data-sid="${s.id}" aria-label="Rimuovi serie">✕</button></div>`).join('')}
    <button class="btn text" data-action="draft-add-set" data-uid="${it.uid}">＋ Serie</button></div>`;
}
const chronoText = () => { const d = getDraft(), sec = d.startedAt ? Math.max(0, Math.floor((Date.now() - d.startedAt) / 1000)) : 0; return `${String(Math.floor(sec / 3600)).padStart(2, '0')}:${String(Math.floor(sec / 60) % 60).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`; };
let chronoH = 0;
function syncChrono() {
  clearInterval(chronoH);
  if (location.hash === '#/workout') chronoH = setInterval(() => { const el = $('#chrono'); if (el) el.textContent = chronoText(); else clearInterval(chronoH); }, 1000);
}
/** "1:30" -> 90, "90" -> 90 */
const parseDur = v => { const t = String(v).trim().replace(',', '.'); if (t.includes(':')) { const [m, sec] = t.split(':'); return (parseInt(m, 10) || 0) * 60 + (parseInt(sec, 10) || 0); } return Math.round(parseFloat(t)) || 0; };
const fmtDur = sec => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
function viewWorkout() {
  const d = getDraft(), tpl = d.templateId && (getState().templates || P.defaultTemplates()).find(t => t.id === d.templateId);
  return `<div class="page">${header(tpl ? tpl.name : 'Nuovo allenamento', '#/gym')}
    <div class="chrono"><div><span class="tag">Tempo di allenamento</span><b id="chrono">${chronoText()}</b></div><div class="muted small">Spunta ✓ a ogni serie fatta: parte il riposo.</div></div>
    <label class="fld">Nome<input data-input="draft-title" value="${esc(d.title)}" placeholder="Push, Gambe…"></label>
    <div class="chips scroll">${QUICK_TITLES.map(t => `<button class="chip btn-chip ${d.title === t ? 'on' : ''}" data-action="draft-title" data-v="${t}">${t}</button>`).join('')}</div>
    ${d.items.map(draftCard).join('')}
    <button class="btn block" data-action="open-picker">＋ Aggiungi esercizio</button>
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
    <h3>Foto del fisico</h3>${photoCard(s)}
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
    ${settingsCard()}
    <button class="btn block" data-action="regen">Rigenera il menu settimanale</button>
    <h3>Backup dei dati</h3><p class="muted small">I dati sono solo su questo telefono. Esporta un backup ogni tanto: se cancelli i dati del sito o cambi telefono puoi reimportarlo.</p>
    <button class="btn block" data-action="export">Esporta backup</button>
    <label class="btn block filebtn">Importa backup<input type="file" id="import-file" accept="application/json,.json" hidden></label>
    <button class="btn block danger" data-action="reset">Cancella tutti i dati</button>
    <p class="muted small">Le calorie sono calcolate con la formula di Mifflin-St Jeor e modulate sull'obiettivo (−15% per dimagrire, +10% per la massa). Sono stime: per esigenze particolari rivolgiti a un medico o a un dietista.</p></div>`;
}

// ============================================================ HOME (riquadri riordinabili)
const D3 = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
const monthName = (y, m) => cap(new Date(y, m, 1, 12).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }));
const tplsOf = s => s.templates || P.defaultTemplates();
const LEGEND = `<div class="legend"><span><i class="dg"></i>Pasti</span><span><i class="dh"></i>Allenamento</span><span><i class="do"></i>Peso</span><span><i class="db"></i>Foto</span><span><i class="dp"></i>Previsto</span></div>`;

function dotsHTML(info) {
  return `<span class="dots">${info.food ? '<i class="dg"></i>' : ''}${info.workout ? '<i class="dh"></i>' : ''}${info.weight ? '<i class="do"></i>' : ''}${info.photo ? '<i class="db"></i>' : ''}${info.planned && !info.workout ? '<i class="dp"></i>' : ''}</span>`;
}
function calGrid(y, m, sel, mini) {
  const s = getState(), today = L.todayISO();
  return `<div class="cal ${mini ? 'mini' : ''}">${P.DAYS.map(d => `<div class="h">${d}</div>`).join('')}${P.monthGrid(y, m).map(c =>
    `<button class="cd ${c.out ? 'out' : ''} ${c.iso === today ? 'today' : ''} ${c.iso === sel ? 'sel' : ''}" data-action="open-day" data-date="${c.iso}">${L.parseISO(c.iso).getDate()}${dotsHTML(P.dayInfo(s, c.iso))}</button>`).join('')}</div>`;
}
const tileShell = (id, title, sub, more, body) => `<section class="tile" data-tile="${id}"><div class="thead"><div class="ttl">${title}<small>${sub}</small></div>${more}
  <div class="handle" data-handle aria-label="Trascina per riordinare">${GRIP}</div></div>${body}</section>`;
const stat = (v, l) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`;

function tileTrain() {
  const s = getState(), kg = s.profile.weightKg, today = L.todayISO(), mon = L.mondayOf(today), tpls = tplsOf(s), sch = s.schedule || P.defaultSchedule();
  const week = [0, 1, 2, 3, 4, 5, 6].map(i => {
    const d = L.addDays(mon, i), t = tpls.find(x => x.id === sch[i]), done = s.workouts.some(w => w.date === d);
    return `<button class="wd ${d === today ? 'today' : ''} ${done ? 'done' : ''}" data-action="open-day" data-date="${d}">${P.DAYS[i]}<b>${L.parseISO(d).getDate()}</b><em>${t ? esc(t.name.slice(0, 5)) : '·'}</em></button>`;
  }).join('');
  const t = P.templateFor(s, today), done = s.workouts.some(w => w.date === today);
  let body;
  if (t) {
    const st = P.templateStats(t, kg);
    body = `<div class="strong">Oggi: ${esc(t.name)}</div><div class="stats">${t.kind === 'run'
      ? stat(st.minutes, 'minuti') + stat('~' + st.kcal, 'kcal')
      : stat(st.exercises, 'esercizi') + stat(st.sets, 'serie') + stat(st.minutes + "'", 'durata') + stat('~' + st.kcal, 'kcal')}</div>
      ${t.kind === 'run' ? '' : `<div class="muted small">Riposo medio tra le serie: ${P.fmtRest(st.rest)}</div>`}
      ${done ? '<p class="accent strong">✓ Allenamento di oggi completato</p>' : `<button class="btn primary block" data-action="start-template" data-id="${t.id}">▶ Inizia ${esc(t.name)}</button>`}
      <button class="btn text" data-action="open-start">Scegli un'altra scheda</button>`;
  } else {
    const nx = [1, 2, 3, 4, 5, 6, 7].map(n => ({ n, t: tpls.find(x => x.id === sch[(P.weekdayIdx(today) + n) % 7]), i: (P.weekdayIdx(today) + n) % 7 })).find(x => x.t);
    body = `<p><strong>Oggi riposo</strong>${nx ? ` · prossimo: ${D3[nx.i]} ${esc(nx.t.name)}` : ''}</p><button class="btn primary block" data-action="open-start">▶ Avvia comunque un allenamento</button>`;
  }
  return tileShell('train', 'Allenamenti', 'La tua settimana', '<a class="more" href="#/plan">Schede</a>', `<div class="week">${week}</div>${body}`);
}
function tileFood() {
  const s = getState(), plan = s.plan, t = L.targets(s.profile), today = L.todayISO();
  if (!plan) return tileShell('food', 'Menu settimanale', 'Cosa mangiare', '', '<button class="btn primary block" data-action="regen">Crea il menu</button>');
  const days = plan.days.slice(0, 7);
  const head = '<div></div>' + days.map(d => `<div class="dl ${d.date === today ? 't' : ''}">${P.DAYS[P.weekdayIdx(d.date)]}<b>${L.parseISO(d.date).getDate()}</b></div>`).join('');
  const rows = L.SLOTS.map(sl => `<div class="sl">${mealIcon(sl.id, 18)}</div>` + days.map(d => {
    const m = d.meals.find(x => x.slot === sl.id); if (!m) return '<div class="fcell"></div>';
    const r = L.recipe(m.recipeId), eaten = s.food.some(e => e.date === d.date && e.meal === sl.id);
    return `<a class="fcell ${eaten ? 'eaten' : ''}" href="#/recipe/${r.id}/${m.scale.toFixed(3)}" aria-label="${esc(r.name)}">${plateArt(L.mainCategories(r), 40)}</a>`;
  }).join('')).join('');
  const kcal = s.food.filter(e => e.date === today).reduce((a, e) => a + e.kcal, 0);
  return tileShell('food', 'Menu settimanale', `Obiettivo ${t.kcal} kcal al giorno`, '<a class="more" href="#/diet">Apri</a>',
    `<div class="fgrid">${head}${rows}</div><p class="muted small">Tocca un piatto per ricetta e quantità. Bordo verde = già mangiato.</p>
     ${macroBar('Oggi', kcal, t.kcal, COL.green, 'kcal')}<div class="btnrow"><a class="btn sm grow" href="#/diet">Lista della spesa</a><a class="btn sm grow" href="#/today">Diario</a></div>`);
}
function tileCalendar() {
  const n = new Date();
  return tileShell('calendar', 'Calendario', monthName(n.getFullYear(), n.getMonth()), '<a class="more" href="#/calendar">Apri</a>', calGrid(n.getFullYear(), n.getMonth(), L.todayISO(), true) + LEGEND);
}
function tileHealth() {
  const s = getState(), today = L.todayISO(), pct = P.stimulusPct(P.weeklyCredit(s.workouts, today)), kg = s.profile.weightKg;
  const rows = Object.entries(pct).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const ws = sortedWeights(s), delta = ws.length > 1 ? ws.at(-1).kg - ws[0].kg : null;
  return tileShell('health', 'Salute', 'Muscoli, alimentazione, corpo', '<a class="more" href="#/progress">Progressi</a>',
    `<div class="vpanel">${bodyMap(pct)}<div class="cap">Muscoli allenati negli ultimi 7 giorni</div></div>
     ${rows.length ? `<div class="mrows" style="margin-top:10px">${rows.map(([m, v]) => `<div class="mr"><span>${MUSCLE_NAMES[m]}</span><div class="track"><div class="fill" style="width:${Math.round(v * 100)}%;background:var(--hot)"></div></div><b>${Math.round(v * 100)}%</b></div>`).join('')}</div>` : ''}
     <h3 style="margin-top:14px">Consigli</h3>${P.advice(s, today).map(a => `<div class="advice ${a.warn ? 'warn' : ''}">${esc(a.text)}</div>`).join('')}
     <div class="between" style="margin-top:10px"><span>Peso <b>${L.clean(kg)} kg</b>${delta !== null ? ` <span class="muted small">(${delta >= 0 ? '+' : ''}${L.fmt(delta, 1)} dall'inizio)</span>` : ''}</span></div>
     <div class="btnrow"><a class="btn sm grow" href="#/progress">⚖️ Peso</a><a class="btn sm grow" href="#/photos">📷 Foto</a></div>
     <label class="fld">Note personali<textarea data-input="notes" placeholder="Sensazioni, infortuni, obiettivi…">${esc(s.notes)}</textarea></label>`);
}
function remindersHTML() {
  const s = getState(), st = settings(), today = L.todayISO(), wd = P.daysSince(s.weights, today), pd = P.daysSince(s.photos, today);
  let h = '';
  if (st.weightEvery > 0 && (wd === null || wd >= st.weightEvery) && st.snoozeW !== today)
    h += `<div class="banner"><div class="grow"><strong>È ora di pesarti</strong><span class="muted small">${wd === null ? 'Non hai ancora registrato il peso.' : `Ultimo peso ${wd} giorni fa.`}</span></div>
      <a class="btn primary sm" href="#/progress">Inserisci</a><button class="btn text" data-action="snooze" data-k="snoozeW">Dopo</button></div>`;
  if (st.photoEvery > 0 && (pd === null || pd >= st.photoEvery) && st.snoozeP !== today)
    h += `<div class="banner"><div class="grow"><strong>Foto del fisico</strong><span class="muted small">${pd === null ? 'Scatta la prima foto per vedere i progressi.' : `L'ultima è di ${pd} giorni fa.`}</span></div>
      <label class="btn primary sm">Scatta<input type="file" accept="image/*" class="photo-input" hidden></label><button class="btn text" data-action="snooze" data-k="snoozeP">Dopo</button></div>`;
  return h;
}
function viewHome() {
  const s = getState(), st = settings(), tiles = { train: tileTrain, food: tileFood, calendar: tileCalendar, health: tileHealth };
  const d = cap(L.parseISO(L.todayISO()).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }));
  return `<div class="page"><div class="between"><div><div class="muted small">${d}</div><h1 style="margin-bottom:0">Ciao ${esc(s.profile.name)}</h1></div>
    <a class="icon" href="#/profile" aria-label="Impostazioni">${ICON.gear}</a></div>${remindersHTML()}
    <div id="tiles">${st.tiles.map(id => tiles[id]()).join('')}</div>
    <p class="muted small center" style="text-align:center">Trascina ⠿ per riordinare i riquadri</p></div>`;
}

// ---- trascinamento dei riquadri (dito o mouse). Usa `order` CSS: il nodo non cambia posto nel DOM, quindi il puntatore resta agganciato.
function startDrag(handle, e) {
  const tile = handle.closest('.tile'), box = tile.parentElement;
  e.preventDefault();
  let seq = [...box.querySelectorAll('.tile')];
  seq.forEach((t, i) => { t.style.order = i; });
  const grab = e.clientY - tile.getBoundingClientRect().top;
  tile.classList.add('drag');
  try { handle.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
  const move = ev => {
    if (ev.clientY < 80) window.scrollBy(0, -14); else if (ev.clientY > innerHeight - 100) window.scrollBy(0, 14);
    tile.style.transform = '';
    const sibs = seq.filter(t => t !== tile), mid = ev.clientY - grab + tile.offsetHeight / 2;
    const idx = sibs.filter(t => { const r = t.getBoundingClientRect(); return r.top + r.height / 2 < mid; }).length;
    seq = [...sibs.slice(0, idx), tile, ...sibs.slice(idx)];
    seq.forEach((t, i) => { t.style.order = i; });
    tile.style.transform = `translateY(${ev.clientY - grab - tile.getBoundingClientRect().top}px)`;
  };
  const end = () => {
    handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', end); handle.removeEventListener('pointercancel', end);
    tile.classList.remove('drag'); tile.style.transform = '';
    seq.forEach(t => { box.appendChild(t); t.style.order = ''; });
    setSetting('tiles', seq.map(t => t.dataset.tile));
  };
  handle.addEventListener('pointermove', move); handle.addEventListener('pointerup', end); handle.addEventListener('pointercancel', end);
}

// ============================================================ CALENDARIO
function viewCalendar() {
  const s = getState(), { y, m, sel } = ui.cal, t = P.templateFor(s, sel), isToday = sel === L.todayISO(), kg = s.profile.weightKg, tg = L.targets(s.profile);
  const works = s.workouts.filter(w => w.date === sel), planDay = s.plan && s.plan.days.find(d => d.date === sel);
  const entries = s.food.filter(e => e.date === sel), kcal = entries.reduce((a, e) => a + e.kcal, 0);
  const wt = s.weights.find(w => w.date === sel), photo = s.photos.find(p => p.date === sel);
  const workoutHTML = works.map(w => `<div class="card"><strong>${esc(w.title)}</strong><div class="muted small">${w.kind === 'run' ? `${w.min} min${w.km ? ` · ${L.fmt(w.km, 1)} km` : ''}` : `${totalSets(w)} serie · ${L.fmt(volume(w))} kg`}${w.kcal ? ` · ~${w.kcal} kcal` : ''}</div>
    ${w.exercises.map(e => { const x = EX[e.exerciseId]; return x ? `<a class="mealrow" href="#/exercise/${x.id}">${exerciseFigure(x, 40)}<span class="grow"><span class="block">${esc(x.name)}</span><span class="muted small">${logSummary(e)}</span></span></a>` : ''; }).join('')}</div>`).join('') ||
    (t ? `<div class="card"><span class="tag">Previsto</span><strong>${esc(t.name)}</strong><div class="muted small">${t.kind === 'run' ? `${t.minutes} min` : `${P.templateStats(t, kg).exercises} esercizi · ~${P.templateStats(t, kg).minutes} min`}</div>
      ${isToday ? `<button class="btn primary block" data-action="start-template" data-id="${t.id}">Inizia ${esc(t.name)}</button>` : ''}</div>` : '<p class="muted">Nessun allenamento in questo giorno.</p>');
  const menuHTML = planDay ? `<div class="card">${planDay.meals.map(pm => { const r = L.recipe(pm.recipeId), eaten = entries.some(e => e.meal === pm.slot);
    return `<a class="mealrow" href="#/recipe/${r.id}/${pm.scale.toFixed(3)}">${plateArt(L.mainCategories(r), 40)}<span class="grow"><span class="tag">${L.SLOT[pm.slot].label}${eaten ? ' · ✓' : ''}</span><span class="block">${esc(r.name)}</span></span><span class="muted small">${L.fmt(L.plannedMacros(pm).kcal)} kcal</span></a>`; }).join('')}</div>` : '<p class="muted">Nessun menu pianificato per questo giorno.</p>';
  return `<div class="page">${header('Calendario', '#/home')}
    <div class="datenav"><button class="icon" data-action="month" data-d="-1" aria-label="Mese precedente">‹</button><strong>${monthName(y, m)}</strong><button class="icon" data-action="month" data-d="1" aria-label="Mese successivo">›</button></div>
    ${calGrid(y, m, sel, false)}${LEGEND}
    <h3>${cap(L.prettyDate(sel))}</h3><h3 style="margin-top:6px">Allenamento</h3>${workoutHTML}
    <h3>Menu</h3>${menuHTML}
    <h3>Diario</h3><div class="card"><div class="between"><span>${entries.length ? `${L.fmt(kcal)} / ${tg.kcal} kcal registrate` : 'Nessun pasto registrato'}</span><button class="btn sm" data-action="goto-diary" data-date="${sel}">Apri</button></div></div>
    <h3>Corpo</h3><div class="card"><div>${wt ? `Peso: <strong>${L.clean(wt.kg)} kg</strong>` : '<span class="muted">Nessun peso registrato</span>'}</div>
      ${photo ? `<button class="ph" style="width:120px;height:160px;margin-top:8px;border:0;padding:0;border-radius:12px;overflow:hidden" data-action="view-photo" data-id="${photo.id}"><img data-photo="${photo.id}" alt="" style="width:100%;height:100%;object-fit:cover"></button>` : ''}
      ${isToday ? '<div class="btnrow"><a class="btn sm grow" href="#/progress">⚖️ Peso</a><a class="btn sm grow" href="#/photos">📷 Foto</a></div>' : ''}</div></div>`;
}

// ============================================================ SCHEDE
function mutTpl(id, fn) { update(s => { s.templates = s.templates || P.defaultTemplates(); const t = s.templates.find(x => x.id === id); if (t) fn(t, s); }); }
function viewPlan() {
  const s = getState(), tpls = tplsOf(s), sch = s.schedule || P.defaultSchedule(), kg = s.profile.weightKg;
  return `<div class="page">${header('Schede di allenamento', '#/gym')}
    <p class="muted small">Scegli in quali giorni fare ogni scheda. Durata e calorie sono stime (riposo incluso).</p>
    ${tpls.map(t => { const st = P.templateStats(t, kg); return `<div class="card tpl"><div class="between"><strong>${esc(t.name)}</strong><a class="more" href="#/tpl/${t.id}">Modifica</a></div>
      <div class="muted small">${t.kind === 'run' ? `Corsa · ${st.minutes} min · ~${st.kcal} kcal` : `${st.exercises} esercizi · ${st.sets} serie · ~${st.minutes} min · ~${st.kcal} kcal · riposo medio ${P.fmtRest(st.rest)}`}</div>
      <div class="days">${D3.map((d, i) => `<button class="${sch[i] === t.id ? 'on' : ''}" data-action="set-day" data-tpl="${t.id}" data-day="${i}">${d}</button>`).join('')}</div></div>`; }).join('')}
    <button class="btn block" data-action="new-tpl">＋ Nuova scheda</button>
    <label class="fld">Riposo predefinito tra le serie (secondi)<input inputmode="numeric" data-input="def-rest" value="${settings().restSec}"></label></div>`;
}
function viewTpl(id) {
  const t = tplsOf(getState()).find(x => x.id === id);
  if (!t) return `<div class="page">${header('Scheda non trovata', '#/plan')}</div>`;
  const rows = t.exercises.map((e, i) => { const x = EX[e.exerciseId]; return `<div class="exrow"><a class="plain" href="#/exercise/${x.id}" style="text-align:left">${esc(x.name)}</a>
    ${['sets', 'reps', 'rest'].map(f => `<input inputmode="numeric" data-input="tpl-field" data-tpl="${t.id}" data-i="${i}" data-field="${f}" value="${e[f]}">`).join('')}
    <button class="icon" data-action="tpl-up" data-tpl="${t.id}" data-i="${i}" aria-label="Sposta su" ${i ? '' : 'disabled'}>↑</button><button class="icon" data-action="tpl-rm" data-tpl="${t.id}" data-i="${i}" aria-label="Rimuovi">✕</button></div>`; }).join('');
  return `<div class="page">${header('Modifica scheda', '#/plan')}
    <label class="fld">Nome<input data-input="tpl-name" data-tpl="${t.id}" value="${esc(t.name)}"></label>
    ${t.kind === 'run' ? `<label class="fld">Durata prevista (minuti)<input inputmode="numeric" data-input="tpl-minutes" data-tpl="${t.id}" value="${t.minutes || 30}"></label>`
      : `<div class="exrow head"><span>Esercizio</span><span>Serie</span><span>Rip.</span><span>Riposo s</span><span></span><span></span></div>${rows}
         <button class="btn block" data-action="tpl-add" data-tpl="${t.id}">＋ Aggiungi esercizio</button>`}
    <button class="btn block danger" data-action="tpl-del" data-tpl="${t.id}">Elimina scheda</button></div>`;
}
function startTemplate(id) {
  const s = getState(), t = tplsOf(s).find(x => x.id === id); if (!t) return;
  ui.modal = null; renderModal();
  if (t.kind === 'run') { ui.run = { min: String(t.minutes || 30), km: '' }; location.hash = '#/run'; return; }
  const d = getDraft();
  if (d.items.length && d.templateId !== id && !confirm('Hai un allenamento in corso. Vuoi sostituirlo?')) return;
  if (d.templateId !== id || !d.items.length) {
    resetDraft();
    updateDraft(x => {
      x.title = t.name; x.templateId = id; x.startedAt = Date.now();
      x.items = t.exercises.map(e => {
        const last = lastLog(e.exerciseId), first = last && last.log.sets[0];
        return { uid: newId(), exerciseId: e.exerciseId, rest: e.rest, sets: Array.from({ length: e.sets }, () => ({ id: newId(), reps: String(e.reps), kg: first && first.kg ? L.clean(first.kg).replace(',', '.') : '', done: false })) };
      });
    });
  }
  location.hash = '#/workout';
}
function viewRun() {
  const r = ui.run || (ui.run = { min: '30', km: '' }), kg = getState().profile.weightKg, min = L.num(r.min) || 0, km = L.num(r.km) || 0;
  return `<div class="page">${header('Corsa', '#/gym')}
    <div class="card"><div class="row2"><label class="fld">Durata (minuti)<input inputmode="numeric" data-input="run-min" value="${esc(r.min)}"></label>
      <label class="fld">Distanza (km)<input inputmode="decimal" data-input="run-km" value="${esc(r.km)}"></label></div>
      <p id="run-est" class="muted">${runEstimate(min, km, kg)}</p></div>
    <button class="btn primary block" data-action="save-run">Salva corsa</button></div>`;
}
const runKcal = (min, km, kg) => Math.round(km > 0 ? kg * km * 1.0 : 9 * kg * min / 60);
const runEstimate = (min, km, kg) => min > 0 ? `~${runKcal(min, km, kg)} kcal${km > 0 && min > 0 ? ` · ritmo ${P.fmtClock(Math.round(min * 60 / km))} /km` : ''}` : '';

// ============================================================ FOTO e IMPOSTAZIONI
function photoCard(s) {
  const pd = P.daysSince(s.photos, L.todayISO()), last = [...s.photos].sort((a, b) => b.date.localeCompare(a.date))[0];
  return `<a class="card plain" href="#/photos" style="display:flex;gap:12px;align-items:center">
    ${last ? `<div style="width:64px;height:84px;border-radius:10px;overflow:hidden;background:var(--panel)"><img data-photo="${last.id}" alt="" style="width:100%;height:100%;object-fit:cover"></div>` : '<span style="font-size:2rem">📷</span>'}
    <div class="grow"><strong>${s.photos.length ? `${s.photos.length} foto` : 'Nessuna foto'}</strong><div class="muted small">${pd === null ? 'Aggiungi la prima per iniziare a confrontare i progressi.' : `Ultima ${pd === 0 ? 'oggi' : pd + ' giorni fa'}`}</div></div><span class="accent">›</span></a>`;
}
function viewPhotos() {
  const s = getState(), list = [...s.photos].sort((a, b) => b.date.localeCompare(a.date));
  const cmp = list.length >= 2 ? `<h3>Prima e dopo</h3><div class="cmp"><div><img data-photo="${list.at(-1).id}" alt=""><span>${L.prettyDate(list.at(-1).date)}</span></div><div><img data-photo="${list[0].id}" alt=""><span>${L.prettyDate(list[0].date)}</span></div></div>` : '';
  return `<div class="page">${header('Foto del fisico', '#/progress')}
    <label class="btn primary block">📷 Aggiungi foto<input type="file" accept="image/*" class="photo-input" hidden></label>
    <p class="muted small">Le foto restano solo su questo telefono. Per confronti utili: stessa posa, luce e orario.</p>${cmp}
    <h3>Tutte le foto</h3>${list.length ? `<div class="pgrid">${list.map(p => `<button class="ph" data-action="view-photo" data-id="${p.id}"><img data-photo="${p.id}" alt=""><span>${L.prettyDate(p.date)}</span></button>`).join('')}</div>` : '<p class="muted">Ancora nessuna foto.</p>'}</div>`;
}
function startModal() {
  const s = getState(), kg = s.profile.weightKg, d = getDraft();
  return `<div class="sheet"><div class="hdr"><button class="icon" data-action="close-modal" aria-label="Chiudi">✕</button><h2>Avvia un allenamento</h2></div>
    <div class="sheetbody">${d.items.length ? `<a class="btn primary block" href="#/workout" data-action="close-modal">▶ Riprendi “${esc(d.title || 'allenamento')}” in corso</a>` : ''}
    ${tplsOf(s).map(t => { const st = P.templateStats(t, kg); return `<button class="card listrow" style="display:block;border:1px solid var(--line);border-radius:18px;padding:14px;margin:10px 0" data-action="start-template" data-id="${t.id}">
      <strong>${esc(t.name)}</strong><div class="muted small">${t.kind === 'run' ? `Corsa · ${st.minutes} min` : `${st.exercises} esercizi · ${st.sets} serie · ~${st.minutes} min · riposo medio ${P.fmtRest(st.rest)}`}</div></button>`; }).join('')}
    <button class="btn block" data-action="start-free">＋ Allenamento libero (scegli tu gli esercizi)</button></div></div>`;
}
function photoModal() {
  const p = getState().photos.find(x => String(x.id) === String(ui.modal.id));
  return `<div class="sheet"><div class="hdr"><button class="icon" data-action="close-modal" aria-label="Chiudi">✕</button><h2>${p ? L.prettyDate(p.date) : 'Foto'}</h2></div>
    <div class="sheetbody"><img data-photo="${ui.modal.id}" alt="" style="width:100%;border-radius:14px"><button class="btn block danger" data-action="del-photo" data-id="${ui.modal.id}">Elimina foto</button></div></div>`;
}
async function loadPhotos() {
  for (const img of document.querySelectorAll('img[data-photo]')) {
    if (img.getAttribute('src')) continue;
    try { const url = await getPhoto(img.dataset.photo); if (url) img.src = url; } catch (e) { /* IndexedDB non disponibile */ }
  }
}
async function addPhoto(file) {
  try {
    const url = await shrinkImage(file), id = newId();
    await putPhoto(id, url);
    update(s => { s.photos.push({ id, date: L.todayISO() }); });
    toast('Foto salvata ✓'); render();
  } catch (e) { alert('Non riesco a salvare la foto.'); }
}
function settingsCard() {
  const st = settings(), sel = (id, opts, v) => `<select data-input="${id}">${opts.map(([val, lab]) => `<option value="${val}" ${String(v) === String(val) ? 'selected' : ''}>${lab}</option>`).join('')}</select>`;
  return `<h3>Aspetto</h3><div class="seg">${[['auto', 'Automatico'], ['light', 'Chiaro'], ['dark', 'Scuro']].map(([v, l]) => `<button class="${st.theme === v ? 'on' : ''}" data-action="theme" data-v="${v}">${l}</button>`).join('')}</div>
    <h3>Promemoria</h3><div class="card"><label class="fld">Peso: ricordamelo<br>${sel('weight-every', [[0, 'Mai'], [3, 'Ogni 3 giorni'], [7, 'Ogni settimana'], [14, 'Ogni 2 settimane'], [30, 'Ogni mese']], st.weightEvery)}</label>
      <label class="fld">Foto del fisico: ricordamelo<br>${sel('photo-every', [[0, 'Mai'], [7, 'Ogni settimana'], [14, 'Ogni 2 settimane'], [30, 'Ogni mese'], [60, 'Ogni 2 mesi']], st.photoEvery)}</label>
      <p class="muted small">I promemoria compaiono in alto nella Home quando apri l'app (iPhone non permette notifiche senza un server).</p></div>
    <button class="btn block" data-action="reset-tiles">Ripristina ordine dei riquadri</button>`;
}
export function applyTheme() {
  const t = settings().theme, r = document.documentElement;
  if (t === 'light' || t === 'dark') r.dataset.theme = t; else delete r.dataset.theme;
  const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches), m = document.querySelector('meta[name=theme-color]');
  if (m) m.content = dark ? '#070A09' : '#F4F7F5';
}

// ============================================================ timer di riposo
const rest = { end: 0, total: 0, h: 0 };
function beep() {
  try {
    const a = beep.ctx, o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 880;
    g.gain.setValueAtTime(0.25, a.currentTime); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.5); o.start(); o.stop(a.currentTime + 0.5);
  } catch (e) { /* audio non disponibile */ }
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
}
function startRest(sec) {
  try { beep.ctx = beep.ctx || new (window.AudioContext || window.webkitAudioContext)(); if (beep.ctx.resume) beep.ctx.resume(); } catch (e) { /* ok */ }
  rest.total = sec; rest.end = Date.now() + sec * 1000; clearInterval(rest.h);
  $('#rest').innerHTML = `<div class="t"><small id="rl">Riposo</small><span id="rt"></span></div><button data-action="rest-add" data-s="-15">−15</button><button data-action="rest-add" data-s="15">+15</button>
    <button class="skip" data-action="rest-stop">Salta</button><div class="bar"><i id="rb"></i></div>`;
  $('#rest').hidden = false; rest.h = setInterval(tickRest, 250); tickRest();
}
function stopRest() { clearInterval(rest.h); rest.end = 0; const b = $('#rest'); if (b) b.hidden = true; }
function tickRest() {
  const left = Math.ceil((rest.end - Date.now()) / 1000);
  if (left <= 0) {
    clearInterval(rest.h); beep(); $('#rl').textContent = 'Riposo finito'; $('#rt').textContent = 'Via! 💪'; $('#rb').style.width = '100%';
    rest.h = setTimeout(stopRest, 4000); return;
  }
  $('#rt').textContent = P.fmtClock(left); $('#rb').style.width = Math.max(0, Math.min(100, (1 - left / rest.total) * 100)) + '%';
}

// ============================================================ RICETTE: stagione, mie ricette, "ho questi ingredienti"
const monthNow = () => new Date().getMonth() + 1;
const dietOk = (p, r) => !(p.diet === 'PESCATARIAN' && !L.isPescatarian(r)) && !(p.diet === 'VEGETARIAN' && !L.isVegetarian(r));
const shortFood = id => L.food(id).name.replace(/\s*\(.*\)/, '').toLowerCase();
const recRow = (r, extra = '') => { const m = L.recipeMacros(r); return `<a class="mealrow" href="#/recipe/${r.id}/1">${plateArt(L.mainCategories(r), 56)}<span class="grow"><span class="block">${esc(r.name)}</span>
  <span class="muted small">${L.fmt(m.kcal)} kcal · P ${L.fmt(m.p)} g · ${r.prep} min</span>${extra}</span></a>`; };
function recipesTab() {
  const s = getState(), mo = monthNow(), p = s.profile, all = L.allRecipes().filter(r => dietOk(p, r));
  const picks = all.map(r => ({ r, sc: S.seasonScore(r, mo) })).filter(x => x.sc >= 0.7).sort((a, b) => b.sc - a.sc).slice(0, 8);
  const mine = s.userRecipes || [];
  return `<div class="card hl"><strong>In stagione: ${S.seasonName(mo)}</strong><p class="small">${esc(S.seasonProduce(mo).join(', '))}</p></div>
    <div class="btnrow"><a class="btn primary grow" href="#/fridge">🧺 Ho questi ingredienti</a><a class="btn grow" href="#/myrecipe/new">＋ Nuova ricetta</a></div>
    <h3>Consigliate in questo periodo</h3>${picks.map(x => recRow(x.r, '<span class="pill g">di stagione</span>')).join('') || '<p class="muted">Nessuna ricetta consigliata.</p>'}
    ${mine.length ? `<h3>Le mie ricette</h3>${mine.map(r => recRow(r)).join('')}` : ''}
    ${L.SLOTS.map(sl => `<h3>${sl.label}</h3>` + all.filter(r => r.slot === sl.id).map(r => recRow(r)).join('')).join('')}`;
}

function newRec() { return { key: 'new', id: null, name: '', slot: 'LUNCH', prep: '20', ing: [{ foodId: 'chicken', g: '100' }], steps: '' }; }
function recFrom(r) { return { key: r.id, id: r.id, name: r.name, slot: r.slot, prep: String(r.prep), ing: r.ing.map(([foodId, g]) => ({ foodId, g: String(g) })), steps: r.steps.join('\n') }; }
function recMacroText() {
  const r = ui.rec, ing = r.ing.filter(i => L.num(i.g) > 0).map(i => [i.foodId, L.num(i.g)]);
  return ing.length ? macroLine(L.recipeMacros({ ing }, 1)) + ' (per porzione)' : '';
}
function viewMyRecipe(id) {
  if (!ui.rec || ui.rec.key !== id) { const ex = (getState().userRecipes || []).find(r => r.id === id); ui.rec = ex ? recFrom(ex) : newRec(); }
  const r = ui.rec, foods = [...L.allFoods()].sort((a, b) => a.name.localeCompare(b.name, 'it'));
  return `<div class="page">${header(r.id ? 'Modifica ricetta' : 'Nuova ricetta', '#/diet')}
    <label class="fld">Nome<input data-input="rec-name" value="${esc(r.name)}" placeholder="Es. Pollo al limone con riso"></label>
    <div class="row2"><label class="fld">Pasto<select data-input="rec-slot">${L.SLOTS.map(sl => `<option value="${sl.id}" ${sl.id === r.slot ? 'selected' : ''}>${sl.label}</option>`).join('')}</select></label>
    <label class="fld">Minuti<input inputmode="numeric" data-input="rec-prep" value="${esc(r.prep)}"></label></div>
    <h3>Ingredienti</h3>${r.ing.map((i, n) => `<div class="exrow" style="grid-template-columns:1fr 70px 30px"><select data-input="rec-food" data-i="${n}" style="margin:0">${foods.map(f => `<option value="${f.id}" ${f.id === i.foodId ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}</select>
      <input inputmode="decimal" data-input="rec-g" data-i="${n}" value="${esc(i.g)}" aria-label="Grammi"><button class="icon" data-action="rec-rm-ing" data-i="${n}" aria-label="Rimuovi">✕</button></div>`).join('')}
    <button class="btn block" data-action="rec-add-ing">＋ Ingrediente (grammi)</button>
    <p id="rec-macros" class="strong">${recMacroText()}</p>
    <label class="fld">Preparazione (un passaggio per riga)<textarea data-input="rec-steps" placeholder="Cuoci il riso…&#10;Salta le verdure…">${esc(r.steps)}</textarea></label>
    <button class="btn primary block" data-action="rec-save">Salva ricetta</button>
    ${r.id ? '<button class="btn block danger" data-action="rec-del">Elimina ricetta</button>' : ''}</div>`;
}
function saveRec() {
  const r = ui.rec, ing = r.ing.filter(i => L.num(i.g) > 0).map(i => [i.foodId, L.num(i.g)]);
  if (!r.name.trim() || !ing.length) { alert('Inserisci un nome e almeno un ingrediente con i grammi.'); return; }
  const rec = { id: r.id || 'u' + newId(), name: r.name.trim(), slot: r.slot, prep: parseInt(r.prep, 10) || 15, ing, steps: r.steps.split('\n').map(x => x.trim()).filter(Boolean), user: true };
  if (!rec.steps.length) rec.steps = ['Prepara gli ingredienti e cuocili come preferisci.'];
  update(s => { s.userRecipes = s.userRecipes || []; const i = s.userRecipes.findIndex(x => x.id === rec.id); if (i >= 0) s.userRecipes[i] = rec; else s.userRecipes.push(rec); });
  L.setUserRecipes(getState().userRecipes); ui.rec = null; toast('Ricetta salvata ✓'); location.hash = '#/recipe/' + rec.id + '/1';
}

// "Ho questi ingredienti": suggerisce ricette esistenti e compone un piatto con regole semplici (non usa intelligenza artificiale).
function viewFridge() {
  const s = getState(), have = ui.fridge || (ui.fridge = []), p = s.profile, mo = monthNow();
  const chips = Object.entries(L.CATEGORIES).map(([cat, label]) => { const fs = L.allFoods().filter(f => f.cat === cat); return fs.length ? `<h3>${label}</h3><div class="chips">${fs.map(f =>
    `<button class="chip btn-chip ${have.includes(f.id) ? 'on' : ''}" data-action="fridge-toggle" data-id="${f.id}">${esc(f.name.replace(/\s*\(.*\)/, ''))}</button>`).join('')}</div>` : ''; }).join('');
  let results = '';
  if (have.length) {
    const rows = L.allRecipes().filter(r => dietOk(p, r)).map(r => { const need = r.ing.map(([id]) => id).filter(id => id !== 'oil'), miss = need.filter(id => !have.includes(id));
      return { r, cover: need.length ? 1 - miss.length / need.length : 0, miss, sc: S.seasonScore(r, mo) }; })
      .filter(x => x.cover >= 0.6).sort((a, b) => b.cover - a.cover || b.sc - a.sc).slice(0, 8);
    results = `<h3>Ricette che puoi fare</h3>${rows.map(x => recRow(x.r, `<span class="small ${x.miss.length ? 'muted' : 'accent'}">${x.miss.length ? 'Ti manca: ' + esc(x.miss.map(shortFood).join(', ')) : '✓ Hai tutto'}</span>`)).join('') || '<p class="muted">Nessuna ricetta quasi completa: prova a selezionare altri ingredienti o crea un piatto qui sotto.</p>'}
      <button class="btn primary block" data-action="fridge-compose">✨ Crea un piatto con questi ingredienti</button>`;
  }
  return `<div class="page">${header('Cosa hai in casa?', '#/diet')}<p class="muted small">Tocca gli ingredienti che hai: ti suggerisco le ricette più vicine. L'olio extravergine è sempre dato per disponibile.</p>${chips}${results}</div>`;
}
function composeRecipe(ids) {
  const F = id => L.food(id), pick = (...cats) => ids.filter(id => cats.includes(F(id).cat));
  const prot = pick('MEAT', 'FISH', 'EGG', 'LEGUME', 'DAIRY').filter(id => id !== 'whey')[0];
  const carb = pick('GRAIN')[0], veg = pick('VEGETABLE').slice(0, 2), fruit = pick('FRUIT')[0], nut = pick('NUTS', 'FAT').filter(id => id !== 'oil')[0];
  const ing = [], steps = [], PG = { MEAT: 160, FISH: 180, EGG: 120, LEGUME: 150, DAIRY: 150 }, CG = { potato: 220, bread: 70, oats: 60 };
  const savory = !!(prot && ['MEAT', 'FISH', 'EGG', 'LEGUME'].includes(F(prot).cat)) || !!carb || veg.length > 0;
  const slot = !savory ? (ids.includes('oats') ? 'BREAKFAST' : 'SNACK') : 'LUNCH';
  if (carb) { ing.push([carb, CG[carb] || 80]); steps.push(carb === 'potato' ? 'Taglia le patate a cubetti e cuocile in forno a 200 °C per 30 minuti.' : carb === 'bread' ? 'Tosta il pane.' : `Cuoci ${shortFood(carb)} secondo i tempi indicati sulla confezione.`); }
  veg.forEach(v => { ing.push([v, 150]); });
  if (veg.length) steps.push(`Taglia ${veg.map(shortFood).join(' e ')} e saltali in padella con un filo d'olio per 8–10 minuti.`);
  if (prot) { ing.push([prot, PG[F(prot).cat] || 120]); const c = F(prot).cat;
    steps.push(c === 'MEAT' ? `Cuoci ${shortFood(prot)} sulla piastra 5–6 minuti per lato, fino a cottura completa.` : c === 'FISH' ? `Cuoci ${shortFood(prot)} in forno a 180 °C per 15–20 minuti.` : c === 'EGG' ? 'Cuoci le uova in padella antiaderente, a occhio di bue o strapazzate.' : c === 'LEGUME' ? `Scalda ${shortFood(prot)} in padella insieme alle verdure.` : `Aggiungi ${shortFood(prot)} a crudo a fine cottura.`); }
  if (fruit) { ing.push([fruit, 150]); steps.push(`Taglia ${shortFood(fruit)} e aggiungila al piatto.`); }
  if (nut) ing.push([nut, nut === 'avocado' ? 60 : 20]);
  if (savory) ing.push(['oil', 8]);
  steps.push('Componi il piatto, aggiusta di sale e completa con un filo d\'olio a crudo.');
  const nm = [prot, carb, veg[0] || fruit].filter(Boolean).map(shortFood);
  const name = nm.length > 2 ? `${cap(nm[0])} con ${nm[1]} e ${nm[2]}` : nm.length === 2 ? `${cap(nm[0])} con ${nm[1]}` : cap(nm[0] || 'Piatto');
  return { key: 'new', id: null, name, slot, prep: '25', ing: ing.map(([foodId, g]) => ({ foodId, g: String(g) })), steps: steps.join('\n') };
}

// ============================================================ render
export function render() {
  const s = getState(), view = $('#view'), tabs = $('#tabs');
  const [, route = 'home', a, b] = location.hash.split('/');
  if (!s.profile) { view.innerHTML = profileForm(false); tabs.hidden = true; updateProfilePreview(); return; }
  if (route === 'edit') { view.innerHTML = profileForm(true); tabs.hidden = true; updateProfilePreview(); return; }
  setBuild(L.bmi(s.profile)); setSex(s.profile.sex); L.setUserRecipes(s.userRecipes);
  let html, top = true;
  switch (route) {
    case 'today': html = viewToday(); break;
    case 'diet': html = viewDiet(); break;
    case 'gym': html = viewGym(); break;
    case 'progress': html = viewProgress(); break;
    case 'profile': html = viewProfile(); break;
    case 'calendar': html = viewCalendar(); break;
    case 'plan': html = viewPlan(); break;
    case 'photos': html = viewPhotos(); break;
    case 'recipe': html = viewRecipe(a, parseFloat(b) || 1); top = false; break;
    case 'exercise': html = viewExercise(a); top = false; break;
    case 'workout': html = viewWorkout(); top = false; break;
    case 'myrecipe': html = viewMyRecipe(a); top = false; break;
    case 'fridge': html = viewFridge(); top = false; break;
    case 'run': html = viewRun(); top = false; break;
    case 'tpl': html = viewTpl(a); top = false; break;
    default: html = viewHome();
  }
  view.innerHTML = html;
  const cur = top ? (TAB_OF[route] ?? 'home') : '';
  const tabIcon = { home: ICON.home, today: ICON.diary, diet: ICON.diet, gym: ICON.gym, progress: ICON.chart };
  tabs.hidden = !top;
  tabs.innerHTML = TABS.map(([r, lb]) => `<a href="#/${r}" class="${r === cur ? 'on' : ''}">${tabIcon[r]}${lb}</a>`).join('');
  renderModal(); loadPhotos(); syncChrono();
}
function renderModal() {
  const box = $('#modal'), m = ui.modal;
  document.body.classList.toggle('noscroll', !!m);
  if (!m) { box.innerHTML = ''; return; }
  box.innerHTML = m.type === 'add' ? addModal() : m.type === 'photo' ? photoModal() : m.type === 'start' ? startModal() : pickerModal();
  updateModalPreview(); loadPhotos();
}

// ============================================================ azioni (click)
const toDraftSets = () => getDraft();
function saveWorkout() {
  const d = getDraft(), kg = getState().profile.weightKg;
  const exercises = d.items.map(it => ({
    exerciseId: it.exerciseId,
    sets: it.sets.map(s => ({ reps: parseInt(s.reps, 10), kg: L.num(s.kg) || 0 })).filter(s => s.reps > 0),
  })).filter(e => e.sets.length);
  if (!exercises.length) { $('#werr').hidden = false; return; }
  let min = d.startedAt ? Math.round((Date.now() - d.startedAt) / 60000) : 0;
  if (min < 5 || min > 240) { const t = d.templateId && tplsOf(getState()).find(x => x.id === d.templateId); min = t ? P.templateStats(t, kg).minutes : P.templateStats({ exercises: exercises.map(e => ({ sets: e.sets.length, rest: 90 })) }, kg).minutes; }
  update(s => { s.workouts.push({ id: newId(), date: L.todayISO(), title: d.title.trim() || 'Allenamento', kind: 'gym', templateId: d.templateId || null, min, kcal: Math.round(5 * kg * min / 60), exercises }); });
  resetDraft(); stopRest(); toast('Allenamento salvato ✓'); location.hash = '#/gym';
}
function addEntry(e) { update(s => { s.food.push({ id: newId(), ...e }); }); }
function eatRecipe(r, scale, slot, date) {
  const m = L.recipeMacros(r, scale);
  addEntry({ date, meal: slot, name: r.name, grams: L.recipeGrams(r, scale), kcal: m.kcal, p: m.p, c: m.c, f: m.f });
}

const actions = {
  'save-profile'() { const p = readProfileForm(); if (!p) return; const editing = !!getState().profile; saveProfile(p); location.hash = editing ? '#/profile' : '#/home'; render(); },
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
  'open-picker'() { ui.modal = { type: 'picker', query: '', muscle: '', for: 'draft' }; renderModal(); },
  'tpl-add'(d) { ui.modal = { type: 'picker', query: '', muscle: '', for: 'tpl', tpl: d.tpl }; renderModal(); },
  'picker-muscle'(d) { ui.modal.muscle = d.v; $('#pchips').innerHTML = pickerChips(d.v); $('#plist').innerHTML = pickerListHTML(ui.modal); },
  'pick-ex'(d) {
    const info = infoFor(d.id);
    if (ui.modal.for === 'tpl') {
      mutTpl(ui.modal.tpl, t => t.exercises.push({ exerciseId: d.id, sets: 3, reps: parseInt(info.reps, 10) || 10, rest: info.rest }));
      ui.modal = null; render(); return;
    }
    const last = lastLog(d.id), first = last && last.log.sets[0];
    updateDraft(x => {
      if (!x.startedAt) x.startedAt = Date.now();
      x.items.push({ uid: newId(), exerciseId: d.id, rest: info.rest, sets: [{ id: newId(), reps: first ? String(first.reps) : '', kg: first ? L.clean(first.kg).replace(',', '.') : '', done: false }] });
    });
    ui.modal = null; render();
  },
  'draft-rm-ex'(d) { updateDraft(x => { x.items = x.items.filter(i => String(i.uid) !== d.uid); }); render(); },
  'draft-add-set'(d) {
    updateDraft(x => { const it = x.items.find(i => String(i.uid) === d.uid), p = it.sets.at(-1); it.sets.push({ id: newId(), reps: p ? p.reps : '', kg: p ? p.kg : '' }); });
    render();
  },
  'draft-rm-set'(d) { updateDraft(x => { const it = x.items.find(i => String(i.uid) === d.uid); it.sets = it.sets.filter(s => String(s.id) !== d.sid); }); render(); },
  'save-workout'() { saveWorkout(); },
  'fridge-toggle'(d) { const a = ui.fridge || (ui.fridge = []), i = a.indexOf(d.id); if (i >= 0) a.splice(i, 1); else a.push(d.id); const y = scrollY; render(); scrollTo(0, y); },
  'fridge-compose'() { ui.rec = composeRecipe(ui.fridge || []); location.hash = '#/myrecipe/new'; },
  'rec-add-ing'() { ui.rec.ing.push({ foodId: 'chicken', g: '100' }); const y = scrollY; render(); scrollTo(0, y); },
  'rec-rm-ing'(d) { ui.rec.ing.splice(parseInt(d.i, 10), 1); if (!ui.rec.ing.length) ui.rec.ing.push({ foodId: 'chicken', g: '100' }); render(); },
  'rec-save'() { saveRec(); },
  'rec-del'() { if (!confirm('Eliminare questa ricetta?')) return; update(st => { st.userRecipes = (st.userRecipes || []).filter(x => x.id !== ui.rec.id); }); L.setUserRecipes(getState().userRecipes); ui.rec = null; location.hash = '#/diet'; },
  'open-start'() { ui.modal = { type: 'start' }; renderModal(); },
  'start-free'() {
    const d = getDraft();
    if (d.items.length && !confirm('Hai un allenamento in corso. Vuoi sostituirlo?')) return;
    resetDraft(); updateDraft(x => { x.startedAt = Date.now(); }); ui.modal = null; renderModal(); location.hash = '#/workout';
  },
  'set-done'(d) {
    let nowDone = false, restS = 0;
    updateDraft(x => { const it = x.items.find(i => String(i.uid) === d.uid), st = it.sets.find(q => String(q.id) === d.sid); st.done = !st.done; nowDone = st.done; restS = it.rest || settings().restSec; });
    render(); if (nowDone) startRest(restS); else stopRest();
  },
  'rest-add'(d) { rest.end = Math.max(Date.now() + 1000, rest.end + parseInt(d.s, 10) * 1000); rest.total = Math.max(rest.total, (rest.end - Date.now()) / 1000); tickRest(); },
  'rest-stop'() { stopRest(); },
  'open-day'(d) { const dt = L.parseISO(d.date); ui.cal = { y: dt.getFullYear(), m: dt.getMonth(), sel: d.date }; if (location.hash === '#/calendar') render(); else location.hash = '#/calendar'; },
  'month'(d) { const c = ui.cal, dt = new Date(c.y, c.m + parseInt(d.d, 10), 1, 12); ui.cal = { y: dt.getFullYear(), m: dt.getMonth(), sel: c.sel }; render(); },
  'goto-diary'(d) { ui.date = d.date; location.hash = '#/today'; },
  'start-template'(d) { startTemplate(d.id); },
  'set-day'(d) { update(s => { s.schedule = s.schedule || P.defaultSchedule(); const i = parseInt(d.day, 10); s.schedule[i] = s.schedule[i] === d.tpl ? null : d.tpl; }); render(); },
  'new-tpl'() { const id = 't' + newId(); update(s => { s.templates = s.templates || P.defaultTemplates(); s.templates.push({ id, name: 'NUOVA', kind: 'gym', exercises: [] }); }); location.hash = '#/tpl/' + id; },
  'tpl-up'(d) { mutTpl(d.tpl, t => { const i = parseInt(d.i, 10); if (i > 0) [t.exercises[i - 1], t.exercises[i]] = [t.exercises[i], t.exercises[i - 1]]; }); render(); },
  'tpl-rm'(d) { mutTpl(d.tpl, t => { t.exercises.splice(parseInt(d.i, 10), 1); }); render(); },
  'tpl-del'(d) {
    if (!confirm('Eliminare questa scheda?')) return;
    update(s => { s.templates = (s.templates || P.defaultTemplates()).filter(t => t.id !== d.tpl); s.schedule = (s.schedule || P.defaultSchedule()).map(x => x === d.tpl ? null : x); });
    location.hash = '#/plan';
  },
  'save-run'() {
    const r = ui.run, min = L.num(r.min), km = L.num(r.km) || 0, kg = getState().profile.weightKg; if (!(min > 0)) return;
    update(s => { s.workouts.push({ id: newId(), date: L.todayISO(), title: 'Corsa', kind: 'run', min, km, kcal: runKcal(min, km, kg), exercises: [] }); });
    ui.run = null; toast('Corsa salvata ✓'); location.hash = '#/gym';
  },
  'snooze'(d) { setSetting(d.k, L.todayISO()); render(); },
  'view-photo'(d) { ui.modal = { type: 'photo', id: d.id }; renderModal(); },
  'del-photo'(d) { if (!confirm('Eliminare questa foto?')) return; delPhoto(d.id).catch(() => {}); update(s => { s.photos = s.photos.filter(p => String(p.id) !== d.id); }); ui.modal = null; render(); },
  'theme'(d) { setSetting('theme', d.v); applyTheme(); render(); },
  'reset-tiles'() { setSetting('tiles', ['train', 'food', 'calendar', 'health']); toast('Ordine ripristinato ✓'); },
  'save-weight'() {
    const w = L.num($('#w-input').value); if (!(w >= 30 && w <= 250)) return;
    update(s => { const t = L.todayISO(); s.weights = s.weights.filter(x => x.date !== t); s.weights.push({ date: t, kg: w }); s.profile.weightKg = w; });
    render(); toast('Peso salvato ✓');
  },
  'del-weight'(d) { update(s => { s.weights = s.weights.filter(w => w.date !== d.date); }); render(); },
  async 'export'() {
    const text = await exportJSON(), name = `fitlife-backup-${L.todayISO()}.json`;
    const file = new File([text], name, { type: 'application/json' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Backup FitLife' }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  },
  'reset'() {
    if (confirm('Cancellare tutti i dati (profilo, diario, allenamenti)? Non si può annullare.')) {
      localStorage.removeItem('fitlife.v1'); localStorage.removeItem('fitlife.draft.v1'); try { indexedDB.deleteDatabase('fitlife-photos'); } catch (e) { /* ok */ } location.hash = ''; location.reload();
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
  'rec-name'(el) { ui.rec.name = el.value; },
  'rec-slot'(el) { ui.rec.slot = el.value; },
  'rec-prep'(el) { ui.rec.prep = el.value; },
  'rec-steps'(el) { ui.rec.steps = el.value; },
  'rec-food'(el) { ui.rec.ing[parseInt(el.dataset.i, 10)].foodId = el.value; const e = $('#rec-macros'); if (e) e.textContent = recMacroText(); },
  'rec-g'(el) { ui.rec.ing[parseInt(el.dataset.i, 10)].g = el.value; const e = $('#rec-macros'); if (e) e.textContent = recMacroText(); },
  'rest'(el) { updateDraft(x => { const it = x.items.find(i => String(i.uid) === el.dataset.uid); it.rest = Math.max(10, Math.min(900, parseDur(el.value) || 90)); }); },
  'tpl-field'(el) { mutTpl(el.dataset.tpl, t => { t.exercises[parseInt(el.dataset.i, 10)][el.dataset.field] = Math.max(1, parseInt(el.value, 10) || 1); }); },
  'tpl-name'(el) { mutTpl(el.dataset.tpl, t => { t.name = el.value.toUpperCase().slice(0, 14) || 'SCHEDA'; }); },
  'tpl-minutes'(el) { mutTpl(el.dataset.tpl, t => { t.minutes = Math.max(5, parseInt(el.value, 10) || 30); }); },
  'def-rest'(el) { setSetting('restSec', Math.max(10, Math.min(600, parseInt(el.value, 10) || 90))); },
  'run-min'(el) { ui.run.min = el.value; const e = $('#run-est'); if (e) e.textContent = runEstimate(L.num(el.value) || 0, L.num(ui.run.km) || 0, getState().profile.weightKg); },
  'run-km'(el) { ui.run.km = el.value; const e = $('#run-est'); if (e) e.textContent = runEstimate(L.num(ui.run.min) || 0, L.num(el.value) || 0, getState().profile.weightKg); },
  'notes'(el) { update(s => { s.notes = el.value; }); },
  'weight-every'(el) { setSetting('weightEvery', parseInt(el.value, 10)); },
  'photo-every'(el) { setSetting('photoEvery', parseInt(el.value, 10)); },
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
      el.files[0].text().then(t => importJSON(t))
        .then(() => { toast('Backup importato ✓'); applyTheme(); location.hash = '#/home'; render(); })
        .catch(() => alert('File di backup non valido.'));
    }
    if (el.classList && el.classList.contains('photo-input') && el.files[0]) addPhoto(el.files[0]);
  });
  document.addEventListener('input', e => {
    const el = e.target;
    if (el.closest && el.closest('#pform')) { updateProfilePreview(); return; }
    const fn = el.dataset && inputs[el.dataset.input]; if (fn) fn(el);
  });
  document.addEventListener('submit', e => e.preventDefault());
  document.addEventListener('pointerdown', e => { const h = e.target.closest && e.target.closest('[data-handle]'); if (h) startDrag(h, e); });
}
