// Illustrazioni cartoon in SVG: cibi, momenti del pasto, piatti, e omini animati per gli esercizi.
import { POSES } from './data.js';

const OUT = '#4A3B32';
const st = (w = 3) => `stroke="${OUT}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const steam = (x, y) => `<path d="M${x} ${y} C ${x - 5} ${y - 8} ${x + 5} ${y - 16} ${x} ${y - 26}" fill="none" stroke="${OUT}" stroke-opacity=".6" stroke-width="2.5" stroke-linecap="round"/>`;

const ICONS = {
  GRAIN: `<rect x="14" y="36" width="72" height="46" rx="22" fill="#E9B872" ${st()}/>
    <path d="M30 46 L38 62 M45 46 L53 62 M60 46 L68 62" stroke="#C98B3E" stroke-width="3.5" stroke-linecap="round" fill="none"/>`,
  FRUIT: `<circle cx="50" cy="58" r="30" fill="#E4572E" ${st()}/>
    <path d="M50 30 L52 18" ${st(3.5)} fill="none"/>
    <ellipse cx="63" cy="21" rx="11" ry="6" transform="rotate(-30 63 21)" fill="#5BBF4A" ${st(2.5)}/>
    <path d="M33 54 A 24 24 0 0 1 44 41" stroke="#fff" stroke-opacity=".6" stroke-width="4" stroke-linecap="round" fill="none"/>`,
  VEGETABLE: `<rect x="42" y="52" width="16" height="34" rx="6" fill="#9BD17B" ${st()}/>
    <circle cx="33" cy="46" r="17" fill="#3FA34D" ${st()}/><circle cx="67" cy="46" r="17" fill="#3FA34D" ${st()}/>
    <circle cx="50" cy="34" r="20" fill="#3FA34D" ${st()}/><circle cx="50" cy="44" r="16" fill="#3FA34D"/>`,
  MEAT: `<line x1="46" y1="58" x2="24" y2="80" stroke="#F5E9D0" stroke-width="9" stroke-linecap="round"/>
    <circle cx="18" cy="76" r="8" fill="#F5E9D0"/><circle cx="26" cy="84" r="8" fill="#F5E9D0"/>
    <circle cx="62" cy="38" r="26" fill="#C8683A" ${st()}/>
    <path d="M46 28 A 18 18 0 0 1 60 18" stroke="#fff" stroke-opacity=".45" stroke-width="4" stroke-linecap="round" fill="none"/>`,
  FISH: `<path d="M70 50 L92 32 L92 68 Z" fill="#3D8FD6" ${st()}/>
    <ellipse cx="44" cy="50" rx="32" ry="20" fill="#5DA9E9" ${st()}/>
    <circle cx="28" cy="46" r="3.5" fill="${OUT}"/>
    <path d="M36 40 Q 48 34 60 40" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round" fill="none"/>`,
  EGG: `<circle cx="50" cy="52" r="34" fill="#FBF7EC" ${st()}/>
    <circle cx="50" cy="52" r="14" fill="#FFB703" ${st(2.5)}/><circle cx="45" cy="47" r="3.5" fill="#fff" fill-opacity=".7"/>`,
  DAIRY: `<path d="M28 20 L72 20 L65 84 L35 84 Z" fill="#DDEBF7"/>
    <path d="M30.5 38 L69.5 38 L65 84 L35 84 Z" fill="#fff"/>
    <path d="M28 20 L72 20 L65 84 L35 84 Z" fill="none" ${st()}/>
    <line x1="30.5" y1="38" x2="69.5" y2="38" stroke="${OUT}" stroke-width="2.5"/>`,
  LEGUME: `<ellipse cx="36" cy="55" rx="22" ry="13" transform="rotate(-30 36 55)" fill="#A0522D" ${st()}/>
    <ellipse cx="64" cy="51" rx="22" ry="13" transform="rotate(25 64 51)" fill="#D08C4C" ${st()}/>
    <circle cx="52" cy="78" r="9" fill="#7BC96F" ${st(2.5)}/>`,
  NUTS: `<circle cx="50" cy="52" r="30" fill="#C49A6C" ${st()}/>
    <path d="M50 24 C 42 40 58 56 50 80" fill="none" ${st(2.5)}/>
    <path d="M30 44 A 10 10 0 0 1 40 36 M60 62 A 10 10 0 0 0 70 70" stroke="${OUT}" stroke-opacity=".6" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  FAT: `<path d="M50 14 C 70 40 78 52 78 62 C 78 77 65 88 50 88 C 35 88 22 77 22 62 C 22 52 30 40 50 14 Z" fill="#F2C94C" ${st()}/>
    <path d="M32 66 A 18 18 0 0 0 44 80" stroke="#fff" stroke-opacity=".7" stroke-width="4" stroke-linecap="round" fill="none"/>`,
  SWEET: `<circle cx="50" cy="52" r="32" fill="#D9A066" ${st()}/>
    <circle cx="38" cy="42" r="4.5" fill="#5A3A28"/><circle cx="60" cy="40" r="4.5" fill="#5A3A28"/><circle cx="52" cy="58" r="4.5" fill="#5A3A28"/>
    <circle cx="36" cy="62" r="4.5" fill="#5A3A28"/><circle cx="66" cy="62" r="4.5" fill="#5A3A28"/>`,
};

const MEAL_ICONS = {
  BREAKFAST: `<rect x="22" y="40" width="44" height="38" rx="8" fill="#fff" ${st()}/>
    <path d="M66 46 a12 12 0 0 1 0 24" fill="none" ${st()}/><rect x="25" y="43" width="38" height="8" fill="#8B5E3C"/>
    ${steam(34, 32)}${steam(44, 32)}${steam(54, 32)}<line x1="16" y1="80" x2="72" y2="80" ${st()}/>`,
  LUNCH: `<circle cx="50" cy="52" r="28" fill="#E9EDF2" ${st()}/><circle cx="50" cy="52" r="18" fill="#fff"/>
    <path d="M14 28 V76 M10 28 V42 M18 28 V42" ${st(3)} fill="none"/><path d="M88 28 V76" ${st(3.5)} fill="none"/>
    <ellipse cx="88" cy="37" rx="4" ry="11" fill="${OUT}"/>`,
  SNACK: ICONS.FRUIT,
  DINNER: `<path d="M16 62 A34 28 0 0 0 84 62 Z" fill="#E76F51" ${st()}/><line x1="12" y1="62" x2="88" y2="62" ${st()}/>
    ${steam(36, 52)}${steam(50, 52)}${steam(64, 52)}`,
};

const svg = (inner, size, cls = 'ico') =>
  `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">${inner}</svg>`;

export const foodIcon = (cat, size = 40) => svg(ICONS[cat] || '', size);
export const mealIcon = (slot, size = 40) => svg(MEAL_ICONS[slot] || '', size);

export function plateArt(cats, size = 56) {
  const c = cats.slice(0, 3);
  const spots = c.length === 1 ? [[50, 50, 52]]
    : c.length === 2 ? [[35, 50, 38], [65, 50, 38]]
      : [[50, 33, 36], [33, 64, 36], [67, 64, 36]];
  const inner = `<circle cx="50" cy="50" r="48" fill="#E9EDF2"/><circle cx="50" cy="50" r="40" fill="#fff"/>
    <circle cx="50" cy="50" r="40" fill="none" stroke="${OUT}" stroke-opacity=".3" stroke-width="1.5"/>` +
    c.map((cat, i) => {
      const [x, y, s] = spots[i];
      return `<svg x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" viewBox="0 0 100 100">${ICONS[cat]}</svg>`;
    }).join('');
  return svg(inner, size, 'ico plate');
}

// ---------------------------------------------------------------- omino degli esercizi
const SHIRT = '#3A86FF', SHORTS = '#2B2D42', SKIN = '#F4B183', SHOE = '#EF476F', GEAR = '#4A5568';
const r1 = v => Math.round(v * 10) / 10;
const ANIM = 'dur="2.2s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines=".4 0 .6 1;.4 0 .6 1"';
const anim = (attr, a, b) => `<animate attributeName="${attr}" values="${r1(a)};${r1(b)};${r1(a)}" ${ANIM}/>`;

/** Disegna un segmento tra due punti che si muovono tra la posa A e la posa B. */
function seg(p0a, p0b, p1a, p1b, color, w, animate) {
  const base = `<line x1="${r1(p0a[0])}" y1="${r1(p0a[1])}" x2="${r1(p0b[0])}" y2="${r1(p0b[1])}" stroke="${color}" stroke-width="${w}" stroke-linecap="round">`;
  if (!animate) return base + '</line>';
  return base + anim('x1', p0a[0], p1a[0]) + anim('y1', p0a[1], p1a[1]) + anim('x2', p0b[0], p1b[0]) + anim('y2', p0b[1], p1b[1]) + '</line>';
}
function dot(p0, p1, r, fill, animate, extra = '') {
  const base = `<circle cx="${r1(p0[0])}" cy="${r1(p0[1])}" r="${r}" fill="${fill}" ${extra}>`;
  if (!animate) return base + '</circle>';
  return base + anim('cx', p0[0], p1[0]) + anim('cy', p0[1], p1[1]) + '</circle>';
}
const headOf = (neck, hip) => {
  const dx = neck[0] - hip[0], dy = neck[1] - hip[1], l = Math.hypot(dx, dy) || 1;
  return [neck[0] + dx / l * 9, neck[1] + dy / l * 9];
};

export function exerciseFigure(ex, size = 64, animate = false) {
  const [A, B] = POSES[ex.motion];
  const [nA, hA, kA, fA, eA, haA] = A, [nB, hB, kB, fB, eB, haB] = B;
  const two = A.length >= 8;
  const motion = ex.motion;
  let o = `<rect width="100" height="100" rx="10" fill="#E8F5EE"/><line x1="4" y1="93" x2="96" y2="93" stroke="#B7D9C5" stroke-width="2" stroke-linecap="round"/>`;
  if (motion === 'BENCH') {
    o += `<rect x="12" y="68" width="64" height="6" rx="3" fill="#8D6E63"/>
      <line x1="20" y1="74" x2="20" y2="92" stroke="#6D4C41" stroke-width="3" stroke-linecap="round"/>
      <line x1="68" y1="74" x2="68" y2="92" stroke="#6D4C41" stroke-width="3" stroke-linecap="round"/>`;
  }
  if (motion === 'PULLUP') o += `<line x1="24" y1="6" x2="76" y2="6" stroke="${GEAR}" stroke-width="3.5" stroke-linecap="round"/>`;
  if (two) {
    o += seg(hA, A[6], hB, B[6], '#1E2030', 7, animate) + seg(A[6], A[7], B[6], B[7], '#D99A6C', 7, animate);
  }
  o += seg(hA, kA, hB, kB, SHORTS, 7, animate) + seg(kA, fA, kB, fB, SKIN, 7, animate);
  o += seg(fA, [fA[0] + 6, fA[1]], fB, [fB[0] + 6, fB[1]], SHOE, 5, animate);
  o += seg(hA, nA, hB, nB, SHIRT, 10, animate);
  o += dot(headOf(nA, hA), headOf(nB, hB), 6.5, SKIN, animate, `stroke="#3B2F2F" stroke-width="1.5"`);
  o += seg(nA, eA, nB, eB, SHIRT, 6, animate) + seg(eA, haA, eB, haB, SKIN, 5, animate);
  const anchorA = motion === 'BRIDGE' ? hA : haA, anchorB = motion === 'BRIDGE' ? hB : haB;
  if (ex.equip === 'BARBELL') {
    o += dot(anchorA, anchorB, 6.5, GEAR, animate) + dot(anchorA, anchorB, 2.5, '#9A8C98', animate);
  } else if (ex.equip === 'DUMBBELL') {
    o += dot(anchorA, anchorB, 4, GEAR, animate);
  }
  return `<svg class="ico fig" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="${ex.name}">${o}</svg>`;
}
