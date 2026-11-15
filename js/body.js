// Mappa anatomica (fronte e retro) in versione maschile e femminile, con i muscoli evidenziabili in rosso.
// Le forme sono generate da profili di larghezza (uno per sesso) e specchiate per il lato sinistro.

export const MUSCLE_NAMES = {
  trap: 'Trapezio', chest: 'Pettorali', deltF: 'Deltoidi anteriori', deltS: 'Deltoidi laterali', deltR: 'Deltoidi posteriori',
  biceps: 'Bicipiti', triceps: 'Tricipiti', forearm: 'Avambracci', abs: 'Addominali', obliques: 'Obliqui',
  lats: 'Dorsali', lowback: 'Lombari', glutes: 'Glutei', quads: 'Quadricipiti', hams: 'Femorali', calves: 'Polpacci',
};
export const ALL_MUSCLES = Object.keys(MUSCLE_NAMES);
const HOT = '#E5383B';

// Profili (y, semilarghezza) del busto e della gamba esterna, braccia e testa per ciascun sesso.
const SHAPES = {
  M: {
    torso: [[56, 12], [62, 34], [70, 54], [86, 52], [104, 46], [124, 38], [146, 33], [164, 35], [182, 41]],
    legOut: [[182, 46], [204, 48], [236, 42], [264, 31], [290, 30], [310, 33], [336, 20], [358, 14]],
    legIn: 3, armW: [14, 11, 6.5], head: 15, shoulderY: 74,
  },
  F: {
    torso: [[56, 11], [62, 28], [70, 42], [86, 39], [104, 34], [124, 26], [146, 25], [164, 36], [182, 46]],
    legOut: [[182, 47], [204, 47], [236, 38], [264, 27], [290, 25], [310, 26], [336, 16], [358, 12]],
    legIn: 3, armW: [9, 7, 4.5], head: 14, shoulderY: 74,
  },
};
let SEX = 'M', F = 1;
export function setSex(sex) { SEX = sex === 'F' ? 'F' : 'M'; }
/** Compatibilità: la corporatura (BMI) allarga o stringe leggermente la figura. */
export function setBuild(bmi) { F = Math.max(0.9, Math.min(1.1, 0.92 + (bmi - 20) * 0.02)); }

const interp = (prof, y) => {
  if (y <= prof[0][0]) return prof[0][1];
  for (let i = 1; i < prof.length; i++) if (y <= prof[i][0]) { const [y0, v0] = prof[i - 1], [y1, v1] = prof[i], t = (y - y0) / (y1 - y0), s = (1 - Math.cos(t * Math.PI)) / 2; return v0 + (v1 - v0) * s; }
  return prof[prof.length - 1][1];
};
const R = v => Math.round(v * 10) / 10;
function smooth(pts) {                         // curva chiusa passante per i punti medi
  const n = pts.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = 'M' + mid(pts[n - 1], pts[0]).map(R).join(',');
  for (let i = 0; i < n; i++) { const m = mid(pts[i], pts[(i + 1) % n]); d += `Q${R(pts[i][0])},${R(pts[i][1])} ${R(m[0])},${R(m[1])}`; }
  return d + 'Z';
}
function ellipse(cx, cy, rx, ry, rot = 0) {
  const pts = [], c = Math.cos(rot), s = Math.sin(rot);
  for (let k = 0; k < 10; k++) { const t = k / 10 * 2 * Math.PI, x = Math.cos(t) * rx, y = Math.sin(t) * ry; pts.push([cx + x * c - y * s, cy + x * s + y * c]); }
  return smooth(pts);
}

function build() {
  const S = SHAPES[SEX], W = y => interp(S.torso, y) * F, X = (fx, y) => 100 + fx * W(y);
  const LO = y => 100 + interp(S.legOut, y) * F, LI = () => 100 + S.legIn;
  const sh = W(S.shoulderY), aw = S.armW.map(v => v * F);
  const sx = 100 + sh - aw[0] * 0.35;                       // attaccatura del braccio
  const arm = { s: [sx, 78], e: [sx + 6, 140], w: [sx + 10, 194] };
  const along = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const body = [];
  // Silhouette
  const torso = []; for (let y = 56; y <= 182; y += 6) torso.push([100 + W(y), y]);
  body.push(smooth([[100, 56], ...torso.slice(1), [100, 182]]));
  const leg = []; for (let y = 182; y <= 358; y += 8) leg.push([LO(y), y]);
  const legIn = []; for (let y = 358; y >= 182; y -= 8) legIn.push([LI() + (y > 330 ? (y - 330) * 0.12 : 0), y]);
  body.push(smooth([...leg, ...legIn]));
  const armPoly = [[sx + aw[0], 74], [arm.e[0] + aw[1], 140], [arm.w[0] + aw[2], 194], [arm.w[0] + 1, 212], [arm.w[0] - aw[2], 194], [arm.e[0] - aw[1], 140], [sx - aw[0] * 0.7, 80]];
  body.push(smooth(armPoly));
  const lp = (a, t, w) => { const p = along(a[0], a[1], t); return [p, w]; };
  const upper = t => along(arm.s, arm.e, t), fore = t => along(arm.e, arm.w, t);
  const legPoly = (y0, y1, ins) => { const o = [], i = []; for (let y = y0; y <= y1; y += 7) { o.push([LO(y) - ins, y]); i.push([LI() + ins * 0.8 + 1, y]); } return smooth([...o, ...i.reverse()]); };
  const abs = []; [[112, 125], [128, 141], [144, 157], [160, 172]].forEach(([a, b], i) => { const w = (i === 3 ? 0.26 : 0.3) * W(a); abs.push(smooth([[102, a], [100 + w, a], [100 + w, b], [102, b]])); });
  const FRONT = [
    ['trap', smooth([[X(.05, 57), 57], [X(.4, 62), 62], [X(.78, 69), 69], [X(.4, 76), 76], [X(.05, 70), 70]])],
    ['chest', smooth([[X(.04, 78), 76], [X(.5, 76), 75], [X(.92, 80), 81], [X(.95, 92), 92], [X(.6, 104), 105], [X(.04, 104), 105]])],
    ['deltF', ellipse(sx - 1, 84, aw[0] * 0.8, 15 * F, 0.1)],
    ['deltS', ellipse(sx + aw[0] * 0.55, 88, aw[0] * 0.5, 12 * F, 0.1)],
    ['biceps', ellipse(...upper(0.45), aw[1] * 0.7, 19 * F, -0.09)],
    ['forearm', ellipse(...fore(0.38), aw[2] * 0.95 + 1.5, 19 * F, -0.07)],
    ['abs', abs.join('')],
    ['obliques', smooth([[X(.42, 114), 114], [X(.95, 112), 112], [X(.97, 142), 142], [X(.6, 166), 166], [X(.4, 146), 146]])],
    ['quads', legPoly(190, 262, 3)],
    ['calves', legPoly(274, 336, 2.5)],
  ];
  const BACK = [
    ['trap', smooth([[X(.04, 57), 57], [X(.5, 62), 62], [X(.9, 74), 74], [X(.55, 100), 100], [X(.04, 124), 124]])],
    ['deltR', ellipse(sx - 1, 84, aw[0] * 0.8, 15 * F, 0.1)],
    ['deltS', ellipse(sx + aw[0] * 0.55, 88, aw[0] * 0.5, 12 * F, 0.1)],
    ['lats', smooth([[X(.4, 100), 100], [X(.96, 98), 98], [X(.86, 130), 130], [X(.5, 156), 156], [X(.05, 152), 152], [X(.05, 118), 118]])],
    ['triceps', ellipse(...upper(0.42), aw[1] * 0.72, 20 * F, -0.09)],
    ['forearm', ellipse(...fore(0.38), aw[2] * 0.95 + 1.5, 19 * F, -0.07)],
    ['lowback', smooth([[X(.05, 154), 154], [X(.45, 154), 154], [X(.42, 178), 178], [X(.05, 178), 178]])],
    ['glutes', smooth([[X(.03, 180), 180], [X(.96, 184), 184], [X(.98, 204), 204], [X(.5, 222), 222], [X(.03, 216), 216]])],
    ['hams', legPoly(226, 268, 3)],
    ['calves', legPoly(274, 338, 1.5)],
  ];
  return { body, FRONT, BACK, S };
}

function part(d, hl, id, mirror) {
  const i = hl[id] || 0;
  const style = i > 0 ? `style="fill:${HOT};fill-opacity:${(0.35 + 0.65 * Math.min(1, i)).toFixed(2)}"` : '';
  return `<path d="${d}" class="${i > 0 ? 'mh' : 'm'}" ${style}/>`;
}
function figure(set, B, hl, label, dx) {
  const side = B.body.map(d => `<path d="${d}" class="bb"/>`).join('') + set.map(([id, d]) => part(d, hl, id)).join('');
  const hr = B.S.head, hair = SEX === 'F' ? `<path d="M${100 - hr - 1} 30 C${100 - hr - 6} 8 ${100 + hr + 6} 8 ${100 + hr + 1} 30 C${100 + hr + 4} 50 ${100 + hr - 4} 58 ${100 + hr - 5} 50 L${100 - hr + 5} 50 C${100 - hr + 4} 58 ${100 - hr - 4} 50 ${100 - hr - 1} 30Z" class="hr"/>` : '';
  return `<g transform="translate(${dx},0)">${hair}
    <circle cx="100" cy="30" r="${hr}" class="bb"/><rect x="92" y="40" width="16" height="20" rx="5" class="bb"/>
    <g>${side}</g><g transform="translate(200,0) scale(-1,1)">${side}</g>
    <text x="100" y="376" text-anchor="middle" class="bl">${label}</text></g>`;
}

/** Mappa muscolare. hl = { muscleId: intensità 0..1 }. */
export function bodyMap(hl = {}, label = true) {
  const B = build();
  return `<svg class="bodymap" viewBox="16 0 358 384" role="img" aria-label="Mappa dei muscoli">
    ${figure(B.FRONT, B, hl, label ? 'FRONTE' : '', 0)}${figure(B.BACK, B, hl, label ? 'RETRO' : '', 192)}</svg>`;
}

/** Icona compatta (pannello scuro) per le liste di esercizi. */
export function muscleIcon(hl, size = 56) {
  return `<span class="micon" style="width:${size}px;height:${size}px">${bodyMap(hl, false)}</span>`;
}

/** Intensità da elenco di muscoli primari (1) e secondari (0.45). */
export function highlightFor(info) {
  const hl = {};
  (info.s || []).forEach(m => { hl[m] = 0.45; });
  (info.p || []).forEach(m => { hl[m] = 1; });
  return hl;
}
