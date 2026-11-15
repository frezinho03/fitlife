// Illustrazioni semirealistiche in SVG: cibi, pasti, piatti e figure animate degli esercizi.
import { POSES } from './data.js';

const SH = '<ellipse cx="50" cy="90" rx="30" ry="5" fill="#000" opacity=".2"/>';
const rg = (id, c1, c2, cx = '35%', cy = '30%', r = '75%') =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient>`;
const lg = (id, c1, c2, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`;
const gloss = (d, o = 0.55) => `<path d="${d}" fill="#fff" opacity="${o}"/>`;

const ICONS = {
  // pane
  GRAIN: `<defs>${rg('fGr', '#F3C57A', '#B8742A')}${lg('fGr2', '#F7D9A0', '#D9A55B')}</defs>${SH}
    <path d="M12 62 C10 40 28 28 50 28 C72 28 90 40 88 62 C88 76 80 84 70 84 L30 84 C20 84 12 76 12 62 Z" fill="url(#fGr)"/>
    <path d="M30 84 L70 84 C80 84 88 76 88 66 L12 66 C12 76 20 84 30 84 Z" fill="#8E5A1F" opacity=".25"/>
    <path d="M30 44 L40 58 M46 40 L56 56 M62 42 L70 56" stroke="#FBE6B8" stroke-width="4.5" stroke-linecap="round" fill="none" opacity=".85"/>
    <path d="M30 44 L40 58 M46 40 L56 56 M62 42 L70 56" stroke="#8E5A1F" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".5" transform="translate(1.5 2)"/>
    ${gloss('M20 52 C22 40 34 33 46 32 C34 36 26 44 24 54 Z', 0.45)}`,
  // mela
  FRUIT: `<defs>${rg('fFr', '#FF7A66', '#B3121B', '35%', '30%', '80%')}${lg('fFr2', '#7BC74D', '#3C8A2A', 1, 1)}</defs>${SH}
    <path d="M50 34 C38 24 14 32 16 58 C18 78 34 90 46 86 C48 85 52 85 54 86 C66 90 82 78 84 58 C86 32 62 24 50 34 Z" fill="url(#fFr)"/>
    <path d="M50 34 C52 26 52 20 56 14" stroke="#5B3A21" stroke-width="3.4" stroke-linecap="round" fill="none"/>
    <path d="M54 24 C60 12 74 12 78 16 C74 26 62 28 54 24 Z" fill="url(#fFr2)"/>
    ${gloss('M24 50 C24 42 30 36 38 34 C30 40 28 48 30 56 Z', 0.55)}
    <path d="M62 80 C74 74 80 62 80 52" stroke="#6E0A12" stroke-width="3" stroke-linecap="round" fill="none" opacity=".25"/>`,
  // broccolo
  VEGETABLE: `<defs>${rg('fVg', '#7FD36B', '#237A30')}${lg('fVg2', '#BEE49B', '#6FB04A')}</defs>${SH}
    <path d="M44 56 L56 56 L58 86 L42 86 Z" fill="url(#fVg2)"/>
    <path d="M42 86 L58 86 L58 84 L42 84 Z" fill="#000" opacity=".12"/>
    <circle cx="28" cy="48" r="16" fill="url(#fVg)"/><circle cx="72" cy="48" r="16" fill="url(#fVg)"/>
    <circle cx="40" cy="34" r="19" fill="url(#fVg)"/><circle cx="62" cy="34" r="18" fill="url(#fVg)"/><circle cx="50" cy="48" r="18" fill="url(#fVg)"/>
    <circle cx="34" cy="28" r="3" fill="#CFF2B6" opacity=".6"/><circle cx="60" cy="26" r="3" fill="#CFF2B6" opacity=".6"/><circle cx="24" cy="44" r="2.6" fill="#CFF2B6" opacity=".55"/>
    <circle cx="72" cy="44" r="2.6" fill="#CFF2B6" opacity=".55"/><circle cx="48" cy="44" r="2.8" fill="#CFF2B6" opacity=".55"/>`,
  // coscia di pollo
  MEAT: `<defs>${rg('fMt', '#E49A57', '#8F3F17', '35%', '30%', '85%')}${lg('fMt2', '#FFF4DE', '#D9C9A8', 1, 1)}</defs>${SH}
    <path d="M44 56 L22 80" stroke="url(#fMt2)" stroke-width="9" stroke-linecap="round"/>
    <circle cx="17" cy="77" r="8" fill="url(#fMt2)"/><circle cx="25" cy="85" r="8" fill="url(#fMt2)"/>
    <path d="M30 40 C28 18 60 8 76 24 C92 40 78 66 56 64 C44 63 34 54 30 40 Z" fill="url(#fMt)"/>
    ${gloss('M38 30 C42 22 54 17 64 18 C54 22 46 28 42 38 Z', 0.5)}
    <path d="M60 60 C74 56 82 44 80 34" stroke="#5E270B" stroke-width="3.5" stroke-linecap="round" fill="none" opacity=".28"/>`,
  // pesce
  FISH: `<defs>${lg('fFi', '#9CCBEF', '#2F6FA8', 0, 1)}${lg('fFi2', '#7BB1DE', '#2A5F95', 1, 0)}</defs>${SH}
    <path d="M72 52 L94 32 C92 44 92 60 94 72 Z" fill="url(#fFi2)"/>
    <path d="M10 52 C22 28 56 26 74 52 C56 76 22 76 10 52 Z" fill="url(#fFi)"/>
    <path d="M10 52 C22 52 56 52 74 52 C56 76 22 76 10 52 Z" fill="#E8F4FB" opacity=".55"/>
    <path d="M30 34 C36 22 46 22 52 32" fill="url(#fFi2)"/>
    <path d="M44 42 C50 46 50 58 44 62 M54 42 C60 46 60 58 54 62 M34 44 C38 48 38 56 34 60" stroke="#fff" stroke-opacity=".35" stroke-width="2" fill="none"/>
    <path d="M26 40 C30 34 40 32 50 34 C40 36 32 40 28 46 Z" fill="#fff" opacity=".35"/>
    <circle cx="24" cy="48" r="4.2" fill="#fff"/><circle cx="24.6" cy="48" r="2.4" fill="#10222F"/><circle cx="25.4" cy="47" r=".9" fill="#fff"/>`,
  // uovo all'occhio di bue
  EGG: `<defs>${rg('fEg', '#FFE680', '#F59E0B', '38%', '32%', '70%')}</defs>
    <ellipse cx="50" cy="88" rx="34" ry="5" fill="#000" opacity=".16"/>
    <path d="M18 54 C14 34 32 20 52 22 C76 20 92 36 84 56 C80 72 62 82 44 80 C28 80 20 70 18 54 Z" fill="#FFFFFF"/>
    <path d="M18 54 C20 70 28 80 44 80 C62 82 80 72 84 56 C76 70 58 74 42 72 C30 70 22 64 18 54 Z" fill="#D8DEE3" opacity=".7"/>
    <circle cx="50" cy="50" r="15" fill="url(#fEg)"/>${gloss('M42 42 C44 38 50 36 54 37 C48 39 45 42 44 46 Z', 0.85)}`,
  // bicchiere di latte
  DAIRY: `<defs>${lg('fDa', '#FFFFFF', '#E6EEF6', 1, 0)}</defs>${SH}
    <path d="M26 18 L74 18 L68 86 C68 88 66 90 64 90 L36 90 C34 90 32 88 32 86 Z" fill="#DDE9F3" opacity=".55"/>
    <path d="M28.6 38 L71.4 38 L68 86 C68 88 66 90 64 90 L36 90 C34 90 32 88 32 86 Z" fill="url(#fDa)"/>
    <path d="M28.6 38 C40 34 56 42 71.4 36 L71.4 38 L28.6 38 Z" fill="#fff"/>
    <path d="M26 18 L74 18 L68 86 C68 88 66 90 64 90 L36 90 C34 90 32 88 32 86 Z" fill="none" stroke="#9FB7CA" stroke-width="1.6"/>
    ${gloss('M31 22 L36 22 L40 84 L36 84 Z', 0.5)}`,
  // fagioli
  LEGUME: `<defs>${rg('fLe', '#C2764B', '#6E2F16')}${rg('fLe2', '#F0B27A', '#B7733A')}${rg('fLe3', '#9BE08A', '#3C9A3A')}</defs>${SH}
    <ellipse cx="34" cy="56" rx="22" ry="13" transform="rotate(-28 34 56)" fill="url(#fLe)"/>
    <ellipse cx="66" cy="52" rx="22" ry="13" transform="rotate(24 66 52)" fill="url(#fLe2)"/>
    <ellipse cx="50" cy="76" rx="11" ry="9" fill="url(#fLe3)"/>
    ${gloss('M20 52 C22 46 30 42 36 42 C30 46 26 50 26 54 Z', 0.4)}${gloss('M54 44 C58 40 66 38 72 40 C66 42 62 44 60 48 Z', 0.5)}`,
  // noce
  NUTS: `<defs>${rg('fNu', '#D9B07C', '#8A5A2B')}</defs>${SH}
    <path d="M50 18 C80 16 90 44 82 66 C76 82 62 90 50 90 C38 90 24 82 18 66 C10 44 20 16 50 18 Z" fill="url(#fNu)"/>
    <path d="M50 20 C46 40 54 62 50 88" stroke="#5E3A17" stroke-width="2.6" fill="none" opacity=".7"/>
    <path d="M32 34 C28 44 30 54 34 60 M68 34 C72 44 70 54 66 60 M40 30 C38 40 40 48 42 54 M60 30 C62 40 60 48 58 54" stroke="#6B4520" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".55"/>
    ${gloss('M26 40 C28 30 36 24 44 22 C36 28 32 36 32 46 Z', 0.4)}`,
  // goccia d'olio
  FAT: `<defs>${rg('fFa', '#FFF08A', '#D99A06', '35%', '35%', '80%')}</defs>
    <ellipse cx="50" cy="90" rx="26" ry="4.5" fill="#000" opacity=".18"/>
    <path d="M50 10 C68 38 80 52 80 64 C80 79 66 90 50 90 C34 90 20 79 20 64 C20 52 32 38 50 10 Z" fill="url(#fFa)"/>
    ${gloss('M32 64 C32 56 36 50 40 46 C38 54 40 62 44 70 C38 70 34 68 32 64 Z', 0.7)}`,
  // biscotto
  SWEET: `<defs>${rg('fSw', '#E7B170', '#AC6C2B', '35%', '30%', '85%')}</defs>${SH}
    <circle cx="50" cy="52" r="34" fill="url(#fSw)"/>
    <path d="M50 86 C74 86 88 66 84 48 C84 70 70 80 50 80 C34 80 20 72 16 56 C16 72 28 86 50 86 Z" fill="#6B3B10" opacity=".25"/>
    <ellipse cx="38" cy="40" rx="5.5" ry="4.2" fill="#4A2A15"/><ellipse cx="62" cy="38" rx="5" ry="4" fill="#4A2A15"/><ellipse cx="52" cy="58" rx="5.5" ry="4.2" fill="#4A2A15"/>
    <ellipse cx="34" cy="62" rx="5" ry="4" fill="#4A2A15"/><ellipse cx="68" cy="62" rx="5.5" ry="4.2" fill="#4A2A15"/>
    ${gloss('M24 44 C26 34 34 26 44 22 C34 28 30 36 30 46 Z', 0.4)}`,
};

const MEAL_ICONS = {
  BREAKFAST: `<defs>${lg('mB1', '#FFFFFF', '#D5DEE6', 1, 1)}${lg('mB2', '#7A4A2B', '#3C2314')}</defs>
    <ellipse cx="46" cy="84" rx="38" ry="7" fill="#000" opacity=".2"/><ellipse cx="46" cy="80" rx="36" ry="7" fill="url(#mB1)"/>
    <path d="M18 40 L74 40 C74 66 66 78 46 78 C26 78 18 66 18 40 Z" fill="url(#mB1)"/>
    <path d="M74 46 C90 46 90 66 72 66" stroke="#D5DEE6" stroke-width="6" fill="none" stroke-linecap="round"/>
    <ellipse cx="46" cy="40" rx="28" ry="6" fill="url(#mB2)"/>${gloss('M24 46 C24 56 28 66 34 72 C28 66 26 56 26 46 Z', 0.6)}
    <path d="M34 30 C28 22 40 18 34 8 M46 30 C40 22 52 18 46 8 M58 30 C52 22 64 18 58 8" stroke="#9AA7B0" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/>`,
  LUNCH: `<defs>${rg('mL1', '#FFFFFF', '#CBD5DD', '40%', '35%', '80%')}${lg('mL2', '#E4E9EE', '#8D99A3', 1, 0)}</defs>
    <ellipse cx="50" cy="84" rx="40" ry="6" fill="#000" opacity=".18"/>
    <circle cx="52" cy="52" r="32" fill="url(#mL1)"/><circle cx="52" cy="52" r="22" fill="#fff" stroke="#D3DBE2" stroke-width="1.5"/>
    <path d="M10 22 V50 C10 56 18 56 18 50 V22 M14 22 V80" stroke="url(#mL2)" stroke-width="3.2" fill="none" stroke-linecap="round"/>
    <path d="M94 22 C84 30 84 50 90 56 L90 80" stroke="url(#mL2)" stroke-width="3.6" fill="none" stroke-linecap="round"/>`,
  SNACK: null,
  DINNER: `<defs>${lg('mD1', '#F4845F', '#B23A1A', 0, 1)}${rg('mD2', '#F8B26A', '#E26A2C')}</defs>
    <ellipse cx="50" cy="88" rx="38" ry="5" fill="#000" opacity=".2"/>
    <path d="M12 52 C14 76 30 86 50 86 C70 86 86 76 88 52 Z" fill="url(#mD1)"/><ellipse cx="50" cy="52" rx="38" ry="9" fill="#FFFFFF"/>
    <ellipse cx="50" cy="52" rx="33" ry="6.5" fill="url(#mD2)"/>${gloss('M20 58 C22 68 28 76 36 80 C28 74 24 66 22 58 Z', 0.35)}
    <path d="M34 40 C28 32 40 28 34 18 M50 40 C44 32 56 28 50 18 M66 40 C60 32 72 28 66 18" stroke="#9AA7B0" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/>`,
};
MEAL_ICONS.SNACK = ICONS.FRUIT;

const svg = (inner, size, cls = 'ico') =>
  `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">${inner}</svg>`;

export const foodIcon = (cat, size = 40) => svg(ICONS[cat] || '', size);
export const mealIcon = (slot, size = 40) => svg(MEAL_ICONS[slot] || '', size);

export function plateArt(cats, size = 56) {
  const c = cats.slice(0, 3);
  const spots = c.length === 1 ? [[50, 50, 56]] : c.length === 2 ? [[36, 52, 44], [66, 50, 44]] : [[50, 34, 38], [34, 64, 40], [68, 64, 40]];
  const inner = `<defs>${rg('pl1', '#FFFFFF', '#C9D2DA', '35%', '30%', '90%')}${lg('pl2', '#E9EEF2', '#B9C3CB', 1, 1)}</defs>
    <ellipse cx="50" cy="90" rx="42" ry="6" fill="#000" opacity=".2"/>
    <circle cx="50" cy="50" r="47" fill="url(#pl2)"/><circle cx="50" cy="50" r="40" fill="url(#pl1)"/>
    <circle cx="50" cy="50" r="40" fill="none" stroke="#9FACB6" stroke-opacity=".55" stroke-width="1.2"/>` +
    c.map((cat, i) => {
      const [x, y, s] = spots[i];
      return `<svg x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" viewBox="0 0 100 100">${ICONS[cat]}</svg>`;
    }).join('');
  return svg(inner, size, 'ico plate');
}

// ---------------------------------------------------------------- figura animata degli esercizi
const HOT = '#E5383B', SKIN = '#F6C7A0', SKINF = '#D9A67E', TOP = '#5EDDD7', TOPF = '#2FA7A1', SHORTS = '#2B3A67', SHORTSF = '#1F2A4B', HAIR = '#1B1F3B', BAND = '#FF6B6B', METAL = '#D7DCE0';
const WORK = { CHEST: ['torso'], BACK: ['torso'], LEGS: ['thigh', 'shin'], GLUTES: ['thigh'], SHOULDERS: ['uarm'], ARMS: ['uarm', 'farm'], CORE: ['torso'] };
const r1 = v => Math.round(v * 10) / 10;
const ANIM = 'dur="2.4s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines=".4 0 .6 1;.4 0 .6 1"';
const anim = (attr, a, b) => `<animate attributeName="${attr}" values="${r1(a)};${r1(b)};${r1(a)}" ${ANIM}/>`;

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

/** Personaggio anime originale su pannello scuro: il muscolo allenato è in rosso. */
export function exerciseFigure(ex, size = 64, animate = false) {
  const [A, B] = POSES[ex.motion];
  const [nA, hA, kA, fA, eA, haA] = A, [nB, hB, kB, fB, eB, haB] = B;
  const two = A.length >= 8, motion = ex.motion, hot = WORK[ex.muscle] || [];
  const c = (part, base) => (hot.includes(part) ? HOT : base);
  let o = `<defs>${lg('fgBg', '#1D262B', '#0B1013')}<filter id="fgGl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>
    <rect width="100" height="100" rx="10" fill="url(#fgBg)"/><line x1="4" y1="93" x2="96" y2="93" stroke="#33414a" stroke-width="2" stroke-linecap="round"/>`;
  if (motion === 'BENCH') {
    o += `<rect x="12" y="68" width="64" height="7" rx="3" fill="#3A464E"/><line x1="20" y1="75" x2="20" y2="92" stroke="#2A343A" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="68" y1="75" x2="68" y2="92" stroke="#2A343A" stroke-width="3.5" stroke-linecap="round"/>`;
  }
  if (motion === 'PULLUP') o += `<line x1="24" y1="6" x2="76" y2="6" stroke="${METAL}" stroke-width="3.6" stroke-linecap="round"/>`;
  const gl = (p0a, p0b, p1a, p1b, w) => (hot.length ? seg(p0a, p0b, p1a, p1b, HOT, w + 4, animate).replace('<line', '<line filter="url(#fgGl)" opacity=".55"') : '');
  if (two) o += seg(hA, A[6], hB, B[6], SHORTSF, 7.5, animate) + seg(A[6], A[7], B[6], B[7], SKINF, 5.5, animate);
  if (hot.includes('thigh')) o += gl(hA, kA, hB, kB, 8);
  if (hot.includes('torso')) o += gl(hA, nA, hB, nB, 11);
  if (hot.includes('uarm')) o += gl(nA, eA, nB, eB, 6);
  o += seg(hA, kA, hB, kB, c('thigh', SHORTS), 8, animate) + seg(kA, fA, kB, fB, c('shin', SKIN), 5.5, animate);
  o += seg(fA, [fA[0] + 6, fA[1]], fB, [fB[0] + 6, fB[1]], '#FFFFFF', 4.2, animate);
  o += seg(hA, nA, hB, nB, c('torso', TOP), 10.5, animate);
  o += seg(hA, [hA[0] * .6 + nA[0] * .4, hA[1] * .6 + nA[1] * .4], hB, [hB[0] * .6 + nB[0] * .4, hB[1] * .6 + nB[1] * .4], SHORTS, 10.8, animate);
  // testa anime: capelli a ciuffi (originali), fascia e viso
  const hdA = headOf(nA, hA), hdB = headOf(nB, hB);
  const off = (nk, hp, hd, f, sd) => { const dx = hd[0] - nk[0], dy = hd[1] - nk[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l; return [hd[0] + ux * f - uy * sd, hd[1] + uy * f + ux * sd]; };
  [[-5.5, 6.5, 3.2], [0, 10.5, 3.6], [5.5, 6.5, 3.2], [-2.8, 8.2, 3.4], [2.8, 8.2, 3.4]].forEach(([sd, f, r]) => {
    o += dot(off(nA, hA, hdA, f * .55, sd), off(nB, hB, hdB, f * .55, sd), r, HAIR, animate);
  });
  o += dot(hdA, hdB, 6.4, SKIN, animate);
  o += dot(off(nA, hA, hdA, 2.6, 0), off(nB, hB, hdB, 2.6, 0), 4.2, HAIR, animate);
  o += dot(off(nA, hA, hdA, .2, 2.6), off(nB, hB, hdB, .2, 2.6), 1.7, '#FFFFFF', animate) + dot(off(nA, hA, hdA, .2, 3.0), off(nB, hB, hdB, .2, 3.0), 0.9, '#10142B', animate);
  o += seg(nA, eA, nB, eB, c('uarm', SKIN), 5.8, animate) + seg(eA, haA, eB, haB, c('farm', SKIN), 4.8, animate);
  const anchorA = motion === 'BRIDGE' ? hA : haA, anchorB = motion === 'BRIDGE' ? hB : haB;
  if (ex.equip === 'BARBELL') o += dot(anchorA, anchorB, 7, METAL, animate) + dot(anchorA, anchorB, 3, '#7C8790', animate);
  else if (ex.equip === 'DUMBBELL') o += dot(anchorA, anchorB, 4.4, METAL, animate);
  return `<svg class="ico fig" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="${ex.name}">${o}</svg>`;
}
