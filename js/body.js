// Mappa anatomica (fronte e retro) con i muscoli evidenziabili in rosso.
// Ogni muscolo è un path disegnato per il lato destro e specchiato per il sinistro.

export const MUSCLE_NAMES = {
  trap: 'Trapezio', chest: 'Pettorali', deltF: 'Deltoidi anteriori', deltS: 'Deltoidi laterali', deltR: 'Deltoidi posteriori',
  biceps: 'Bicipiti', triceps: 'Tricipiti', forearm: 'Avambracci', abs: 'Addominali', obliques: 'Obliqui',
  lats: 'Dorsali', lowback: 'Lombari', glutes: 'Glutei', quads: 'Quadricipiti', hams: 'Femorali', calves: 'Polpacci',
};
export const ALL_MUSCLES = Object.keys(MUSCLE_NAMES);

const BODY = [
  'M100 52 L128 58 C148 62 158 70 160 86 L156 130 C154 150 150 160 146 168 L100 170 Z', // busto
  'M158 72 C172 70 180 84 179 104 L181 136 L184 176 C184 186 172 188 170 178 L164 140 L156 108 C154 92 154 80 158 72 Z', // braccio
  'M101 166 L146 166 C150 200 146 232 140 256 C140 290 136 322 134 344 L138 356 L106 356 L108 300 C104 270 100 230 101 166 Z', // gamba
];
const ARM_UP = 'M156 100 C166 100 172 110 172 126 C170 136 162 136 158 128 C154 118 154 108 156 100 Z';
const FOREARM = 'M162 140 C170 140 178 150 180 170 C178 180 170 180 168 172 C164 160 160 150 162 140 Z';
const DELT_S = 'M160 74 C170 76 174 88 172 100 C168 100 162 96 162 88 Z';

const FRONT = [
  ['trap', 'M102 50 L122 56 L140 64 L124 70 L106 62 Z'],
  ['chest', 'M102 68 C114 66 130 68 142 76 C144 90 132 104 102 104 Z'],
  ['deltF', 'M142 70 C152 66 162 72 164 86 C164 96 156 100 148 94 C142 88 140 78 142 70 Z'],
  ['deltS', DELT_S],
  ['biceps', ARM_UP],
  ['forearm', FOREARM],
  ['abs', 'M102 108 L118 108 L118 124 L102 124 Z M102 128 L118 128 L118 144 L102 144 Z M102 148 L116 148 L114 164 L102 166 Z'],
  ['obliques', 'M122 110 L138 112 L142 140 C142 150 138 158 132 164 L122 160 Z'],
  ['quads', 'M103 172 C120 168 140 170 146 176 C148 210 142 240 136 258 C124 262 112 258 108 250 C104 222 102 196 103 172 Z'],
  ['calves', 'M110 270 C122 268 132 272 134 284 C134 304 132 322 130 338 L114 338 C110 316 108 290 110 270 Z'],
];
const BACK = [
  ['trap', 'M102 50 L126 56 L142 66 L124 96 L102 112 Z'],
  ['deltR', 'M142 68 C152 64 162 70 164 84 C164 96 156 100 148 94 C142 88 140 78 142 68 Z'],
  ['deltS', DELT_S],
  ['lats', 'M104 114 L124 100 L146 100 C146 122 140 142 132 152 L104 152 Z'],
  ['triceps', ARM_UP],
  ['forearm', FOREARM],
  ['lowback', 'M102 154 L124 154 L122 172 L102 174 Z'],
  ['glutes', 'M102 176 C122 172 142 178 146 192 C146 210 130 218 102 214 Z'],
  ['hams', 'M103 220 C122 222 142 216 144 226 C146 244 140 256 136 262 C124 266 110 262 108 252 C104 240 102 230 103 220 Z'],
  ['calves', 'M108 274 C122 270 134 274 136 288 C136 308 132 324 130 340 L112 340 C108 320 106 296 108 274 Z'],
];

const HOT = '#E5383B';

/** Intensità (0-1) per muscolo -> opacità del rosso. */
function half(list, hl) {
  return list.map(([id, d]) => {
    const i = hl[id] || 0;
    const style = i > 0 ? `fill:${HOT};fill-opacity:${(0.28 + 0.72 * Math.min(1, i)).toFixed(2)}` : '';
    return `<path d="${d}" class="${i > 0 ? 'mh' : 'm'}" ${style ? `style="${style}"` : ''}/>`;
  }).join('');
}
function figure(list, hl, label, dx) {
  const body = BODY.map(d => `<path d="${d}" class="bb"/>`).join('');
  const side = `${body}${half(list, hl)}`;
  return `<g transform="translate(${dx},0)">
    <circle cx="100" cy="27" r="17" class="bb"/><rect x="92" y="40" width="16" height="16" rx="5" class="bb"/>
    <g>${side}</g><g transform="translate(200,0) scale(-1,1)">${side}</g>
    <text x="100" y="368" text-anchor="middle" class="bl">${label}</text></g>`;
}

/** Mappa muscolare. hl = { muscleId: intensità 0..1 }. */
export function bodyMap(hl = {}, label = true) {
  return `<svg class="bodymap" viewBox="0 0 420 376" role="img" aria-label="Mappa dei muscoli">
    ${figure(FRONT, hl, label ? 'FRONTE' : '', 0)}${figure(BACK, hl, label ? 'RETRO' : '', 220)}</svg>`;
}

/** Intensità da elenco di muscoli primari (1) e secondari (0.45). */
export function highlightFor(info) {
  const hl = {};
  (info.s || []).forEach(m => { hl[m] = 0.45; });
  (info.p || []).forEach(m => { hl[m] = 1; });
  return hl;
}
