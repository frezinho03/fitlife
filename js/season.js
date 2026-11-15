// Stagionalità (Italia) di frutta e verdura e piatti "di stagione".
const M = (...m) => m;
export const FOOD_MONTHS = {
  zucchini: M(5, 6, 7, 8, 9, 10), tomato: M(6, 7, 8, 9, 10), pepper: M(6, 7, 8, 9, 10), greenbeans: M(6, 7, 8, 9), spinach: M(10, 11, 12, 1, 2, 3, 4),
  broccoli: M(10, 11, 12, 1, 2, 3), carrot: M(9, 10, 11, 12, 1, 2, 3, 4, 5), apple: M(9, 10, 11, 12, 1, 2, 3), berries: M(5, 6, 7, 8),
  orange: M(11, 12, 1, 2, 3, 4), kiwi: M(11, 12, 1, 2, 3, 4), zucca: M(9, 10, 11, 12, 1, 2), funghi: M(9, 10, 11, 12), cavolfiore: M(10, 11, 12, 1, 2, 3),
  finocchi: M(10, 11, 12, 1, 2, 3), melanzane: M(6, 7, 8, 9), cetrioli: M(5, 6, 7, 8, 9), radicchio: M(10, 11, 12, 1, 2, 3, 4), pesca: M(6, 7, 8, 9),
  fragole: M(4, 5, 6), anguria: M(6, 7, 8), pera: M(8, 9, 10, 11, 12, 1),
};
const COLD = M(10, 11, 12, 1, 2, 3), HOT = M(5, 6, 7, 8, 9);
const WARM_DISH = ['beansoup', 'pastalentils', 'minestrone', 'pastaceci', 'risottozucca', 'vellutatazucca', 'farrozucca', 'porridge', 'pescaporridge', 'turkeypotato', 'codpotato'];
const FRESH_DISH = ['quinoabowl', 'caprese', 'chickensalad', 'beefsalad', 'yogurtbowl', 'farroestate', 'angurialmonds', 'fragolericotta', 'shake', 'cottageorange', 'gamberizucchine'];
const NAMES = { zucca: 'zucca', funghi: 'funghi', cavolfiore: 'cavolfiore', finocchi: 'finocchi', melanzane: 'melanzane', cetrioli: 'cetrioli', radicchio: 'radicchio', pesca: 'pesche', fragole: 'fragole', anguria: 'anguria', pera: 'pere',
  zucchini: 'zucchine', tomato: 'pomodori', pepper: 'peperoni', greenbeans: 'fagiolini', spinach: 'spinaci', broccoli: 'broccoli', carrot: 'carote', apple: 'mele', berries: 'frutti di bosco', orange: 'arance', kiwi: 'kiwi' };
export const inSeason = (id, month) => !FOOD_MONTHS[id] || FOOD_MONTHS[id].includes(month);
export const seasonProduce = month => Object.keys(FOOD_MONTHS).filter(id => FOOD_MONTHS[id].includes(month)).map(id => NAMES[id]);
export const seasonName = month => (month >= 3 && month <= 5 ? 'primavera' : month >= 6 && month <= 8 ? 'estate' : month >= 9 && month <= 11 ? 'autunno' : 'inverno');

/** Punteggio 0..1: prodotti di stagione + piatto adatto al clima. */
export function seasonScore(r, month) {
  const produce = r.ing.map(([id]) => id).filter(id => FOOD_MONTHS[id]);
  let s = produce.length ? produce.filter(id => FOOD_MONTHS[id].includes(month)).length / produce.length : 0.6;
  if (WARM_DISH.includes(r.id)) s += COLD.includes(month) ? 0.35 : -0.3;
  if (FRESH_DISH.includes(r.id)) s += HOT.includes(month) ? 0.35 : -0.3;
  return Math.max(0, Math.min(1, s));
}
