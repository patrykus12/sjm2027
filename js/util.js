// ===== Narzędzia =====
SJM.U = (function () {
  const rand = () => Math.random();
  const randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const gauss = (mean = 0, sd = 1) => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const chance = (p) => Math.random() < p;
  let idCounter = 1;
  const uid = (prefix = 'id') => prefix + (Date.now().toString(36)) + (idCounter++).toString(36) + Math.floor(Math.random() * 1e4).toString(36);

  const money = (v) => {
    const sign = v < 0 ? '-' : '';
    v = Math.abs(v);
    if (v >= 1e6) return sign + (v / 1e6).toFixed(2).replace('.', ',') + ' mln €';
    if (v >= 1e3) return sign + Math.round(v / 1e3) + ' tys. €';
    return sign + Math.round(v) + ' €';
  };
  const fmt1 = (v) => (Math.round(v * 10) / 10).toFixed(1);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MONTHS = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
  const dateStr = (d) => { d = new Date(d); return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); };
  const shortDate = (d) => { d = new Date(d); return d.getDate() + ' ' + MONTHS[d.getMonth()]; };
  const sum = (arr, f = (x) => x) => arr.reduce((a, b) => a + f(b), 0);
  const ordinal = (n) => n + '.';
  const attr20 = (v) => clamp(Math.round(v / 5), 1, 20);
  const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };

  return { rand, randInt, pick, clamp, gauss, chance, uid, money, fmt1, esc, dateStr, shortDate, sum, ordinal, attr20, shuffle };
})();
