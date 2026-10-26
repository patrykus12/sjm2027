// ===== Cechy zawodników (jawne i ukryte) =====
// Jawne – widoczne od razu w profilu. Ukryte – działają od początku, ale gracz poznaje je dopiero
// po obserwacji (wiek, kontuzje, przebieg kariery) albo dzięki dobremu sztabowi.
SJM.TRAITS = {
  // --- jawne ---
  flyer:    { name: 'Lotnik',               icon: '🦅', hidden: false, p: 0.09, desc: 'Świetnie czuje się na mamutach i skoczniach gigantycznych.' },
  technician: { name: 'Technik',            icon: '🎯', hidden: false, p: 0.08, desc: 'Wyjątkowo dobry na skoczniach normalnych – precyzyjne wybicie.' },
  bigstage: { name: 'Nerwy ze stali',       icon: '🧊', hidden: false, p: 0.07, desc: 'Najlepiej skacze na igrzyskach, mistrzostwach i w finałach turniejów.' },
  telemark: { name: 'Mistrz telemarku',     icon: '🎿', hidden: false, p: 0.08, desc: 'Wysokie noty sędziowskie – piękne lądowania.' },
  windmaster: { name: 'Specjalista od wiatru', icon: '🌬️', hidden: false, p: 0.06, desc: 'Lepiej radzi sobie przy wietrze w plecy i zmiennych warunkach.' },
  workhorse: { name: 'Pracuś',              icon: '💪', hidden: false, p: 0.08, desc: 'Szybciej się rozwija dzięki tytanicznej pracy na treningach.' },
  // --- ukryte ---
  longevity: { name: 'Długowieczność',      icon: '🕰️', hidden: true, p: 0.12, desc: 'Długo utrzymuje wysoki poziom – po trzydziestce słabnie wolniej i później.', excl: ['earlyage'] },
  earlyage:  { name: 'Wczesne starzenie',   icon: '📉', hidden: true, p: 0.10, desc: 'Forma fizyczna zaczyna spadać wcześniej niż u rówieśników.', excl: ['longevity'] },
  latebloom: { name: 'Późny rozwój',        icon: '🌱', hidden: true, p: 0.10, desc: 'Rozwija się dłużej niż inni – najlepsze lata mogą przyjść po 26. roku życia.' },
  fragile:   { name: 'Podatność na kontuzje', icon: '🩹', hidden: true, p: 0.10, desc: 'Częściej łapie urazy.', excl: ['iron'] },
  iron:      { name: 'Żelazne zdrowie',     icon: '🛡️', hidden: true, p: 0.08, desc: 'Rzadko odnosi kontuzje.', excl: ['fragile'] },
  streaky:   { name: 'Chimeryczny',         icon: '🎢', hidden: true, p: 0.12, desc: 'Sezony wybitne przeplatają się ze słabymi.' },
  choker:    { name: 'Pęka pod presją',     icon: '😰', hidden: true, p: 0.07, desc: 'W najważniejszych konkursach skacze poniżej możliwości.', excl: ['bigstage'] },
};

// Znane cechy prawdziwych zawodników (imię i nazwisko -> cechy). Lotnicy wyznaczani są też z wyników na mamutach.
SJM.REAL_TRAITS = {
  'Pius Paschke': ['longevity', 'latebloom'], 'Gregor Deschwanden': ['longevity', 'latebloom'], 'Stefan Kraft': ['longevity', 'bigstage'],
  'Piotr Żyła': ['longevity', 'bigstage'], 'Kamil Stoch': ['longevity', 'bigstage'], 'Manuel Fettner': ['longevity'], 'Simon Ammann': ['longevity'],
  'Noriaki Kasai': ['longevity', 'iron'], 'Vladimir Zografski': ['latebloom'], 'Ryoyu Kobayashi': ['bigstage', 'streaky'],
  'Domen Prevc': ['flyer', 'streaky'], 'Marius Lindvik': ['flyer', 'bigstage'], 'Johann André Forfang': ['flyer'],
  'Taku Takeuchi': ['longevity'], 'Roman Koudelka': ['longevity'], 'Dawid Kubacki': ['longevity'], 'Clemens Aigner': ['latebloom'],
  'Halvor Egner Granerud': ['streaky'], 'Andreas Wellinger': ['bigstage'], 'Karl Geiger': ['longevity'],
};

SJM.T = (function () {
  const U = SJM.U;
  const has = (j, k) => !!(j && j.traits && j.traits.includes(k));

  function assign(j, opts = {}) {
    const out = new Set(opts.fixed || []);
    for (const [k, t] of Object.entries(SJM.TRAITS)) {
      if (out.has(k)) continue;
      let p = t.p * (opts.randomScale || 1);
      if (k === 'flyer' && opts.flyingBias != null) p = opts.flyingBias;
      if (k === 'telemark' && j.attrs && j.attrs.landing > 85) p *= 2;
      if (Math.random() < p) out.add(k);
    }
    // wykluczenia
    for (const k of [...out]) for (const x of SJM.TRAITS[k].excl || []) if (out.has(x) && !(opts.fixed || []).includes(x)) out.delete(x);
    // maks. 3 cechy, żeby nie przesadzić
    j.traits = [...out].slice(0, 3);
    j.known = j.traits.filter((k) => !SJM.TRAITS[k].hidden);
    return j;
  }

  // ujawnianie ukrytych cech zawodników gracza (wywoływane na starcie sezonu)
  function revealCheck(j, staff, age) {
    const found = [];
    for (const k of j.traits || []) {
      if (j.known.includes(k)) continue;
      let p = (staff.physio + staff.scout) / 900; // dobry sztab wcześniej coś zauważy
      if (k === 'longevity' && age >= 31) p += 0.5;
      if (k === 'earlyage' && age >= 27) p += 0.4;
      if (k === 'latebloom' && age >= 24) p += 0.3;
      if ((k === 'fragile' || k === 'iron') && (j.injCount || 0) >= 2) p += 0.5;
      if (k === 'iron' && age >= 26) p += 0.15;
      if ((k === 'streaky' || k === 'choker') && (j.log || []).length >= 2) p += 0.35;
      if (Math.random() < p) { j.known.push(k); found.push(k); }
    }
    return found;
  }

  function badges(j, mine) {
    const list = (j.traits || []).filter((k) => mine ? j.known.includes(k) : !SJM.TRAITS[k].hidden || j.known.includes(k));
    return list.map((k) => `<span class="trait ${SJM.TRAITS[k].hidden ? 'hid' : ''}" title="${SJM.TRAITS[k].name}: ${SJM.TRAITS[k].desc}">${SJM.TRAITS[k].icon}</span>`).join('');
  }

  return { has, assign, revealCheck, badges };
})();
