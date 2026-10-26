// ===== Generowanie świata i modele =====
SJM.W = (function () {
  const U = SJM.U;

  const nationData = (code) => SJM.NATIONS.find((n) => n.code === code);
  // lista krajów = podstawowe + „uśpione nacje”, które dołączyły w tej grze (st.dormant); modyfikowana w miejscu,
  // bo inne moduły odwołują się do SJM.NATIONS bezpośrednio
  const BASE_NATIONS = SJM.NATIONS.slice();
  function syncNations(st) {
    SJM.NATIONS.length = 0;
    // cykle programów krajów AI: odchylenie siły (nations[c].drift), gracz bez zmian
    BASE_NATIONS.forEach((n) => { const d = st && st.nations && st.nations[n.code] && n.code !== st.nation ? st.nations[n.code].drift || 0 : 0; SJM.NATIONS.push(d ? { ...n, strength: U.clamp(Math.round(n.strength + d), 5, 99) } : n); });
    for (const [code, d] of Object.entries((st && st.dormant) || {})) {
      const def = (SJM.DORMANT_NATIONS || []).find((x) => x.code === code);
      if (def) SJM.NATIONS.push({ ...def, strength: Math.round(d.strength), pop: Math.round(d.pop || def.pop), budget: d.budget || def.budget, depth: Math.round(d.depth || def.depth) });
    }
  }

  function getHill(id) {
    const st = SJM.state;
    if (st && st.player) {
      const h = st.player.hills.find((x) => x.id === id);
      if (h) return h;
    }
    // skocznie zbudowane w trakcie gry (np. olimpijskie kompleksy gospodarzy AI)
    const extra = st && st.extraHills && st.extraHills.find((x) => x.id === id);
    return extra || SJM.HILLS.find((h) => h.id === id);
  }

  function hillType(K) {
    if (K >= 170) return "flying";
    if (K >= 135) return "giant";
    if (K >= 100) return "large";
    if (K >= 85) return 'normal';
    if (K >= 65) return 'medium';
    return 'small';
  }

  const MATURITY = { 14: 0.52, 15: 0.58, 16: 0.64, 17: 0.70, 18: 0.76, 19: 0.81, 20: 0.86, 21: 0.90, 22: 0.93, 23: 0.96, 24: 0.98 };
  function maturity(age) {
    if (age <= 14) return 0.52;
    if (MATURITY[age]) return MATURITY[age];
    if (age <= 29) return 1.0;
    return Math.max(0.7, 1.0 - (age - 29) * 0.022);
  }

  function age(j) { return SJM.state.season - j.born; }

  // ---- Umiejętność skoczka na danej skoczni ----
  function skill(j, K) {
    const a = j.attrs;
    let s = a.takeoff * 0.29 + a.flight * 0.26 + a.inrun * 0.15 + a.power * 0.13 + a.landing * 0.05 + a.consist * 0.06 + a.mental * 0.06;
    if (K >= 170) s = s * 0.78 + a.flying * 0.22;
    else if (K >= 135) s = s * 0.9 + a.flying * 0.1; // gigantyczne: częściowo jak loty
    else if (K < 100) s = s * 0.9 + (a.takeoff * 0.5 + a.inrun * 0.5) * 0.1;
    // cechy specjalne zależne od rodzaju skoczni
    if (j.traits) {
      if (K >= 170 && j.traits.includes("flyer")) s += 1.6;
      else if (K >= 135 && j.traits.includes("flyer")) s += 0.6;
      if (K < 100 && j.traits.includes("technician")) s += 1.2;
    }
    return s;
  }
  function overall(j) { return skill(j, 125); }

  function genName(nat) {
    const pool = nationData(nat).names;
    return { first: U.pick(SJM.FIRST[pool]), last: U.pick(SJM.LAST[pool]) };
  }

  function genJumper(nat, ageY, potMean, potSd = 8) {
    const st = SJM.state;
    const pot = U.clamp(U.gauss(potMean, potSd), 30, 97);
    const cur = pot * maturity(ageY);
    const attrs = {};
    // każdy skoczek ma swój "profil" - mocne i słabe strony
    for (const at of SJM.ATTRS) {
      let v = cur + U.gauss(0, 6);
      if (at.key === 'flying') v = cur * (0.75 + Math.min(0.25, Math.max(0, ageY - 17) * 0.025)) + U.gauss(0, 7);
      if (at.key === 'mental' || at.key === 'consist') v = cur * (0.88 + Math.min(0.12, Math.max(0, ageY - 18) * 0.015)) + U.gauss(0, 8);
      attrs[at.key] = U.clamp(v, 8, 99);
    }
    const nm = genName(nat);
    return SJM.T.assign({
      id: U.uid("j"), first: nm.first, last: nm.last, nation: nat,
      born: st.season - ageY,
      attrs, pot,
      form: U.gauss(0, 3), fatigue: U.randInt(0, 20), morale: 55, injury: 0,
      group: null,
      height: Math.round(U.gauss(176, 5)),
      season: blankSeasonStats(),
      career: { starts: 0, wins: 0, podiums: 0, wcStarts: 0, medals: { g: 0, s: 0, b: 0 }, globes: 0, tcs: 0, best: null },
      log: [],
    });
  }

  // przesuwa cechy (poza lotami) tak, by ocena ogólna wynosiła dokładnie target
  function setOverall(j, target) {
    for (let k = 0; k < 3; k++) {
      const diff = target - overall(j);
      for (const at of SJM.ATTRS) if (at.key !== 'flying') j.attrs[at.key] = U.clamp(j.attrs[at.key] + diff, 5, 99.5);
    }
  }
  function capOverall(j, max) {
    if (overall(j) > max) setOverall(j, max);
  }

  // Ocena z wyników: ta sama metoda co tools/build_db.pl (średnia z ~30% najlepszych startów).
  // Skala [ocena za 1. miejsce, za 30.] jak w build_db.pl z dwiema poprawkami po porównaniu zawodników
  // startujących w dwóch cyklach w 2025/26: odpadanie w kwalifikacjach PŚ było przeszacowane względem PK
  // (zawyżało zaplecze krajów z kwotą w PŚ), a PK lekko niedoszacowany względem PŚ.
  const RATING_SCALE = {
    WC: [97, 86.5], OWG: [97, 86.5], SFWC: [97, 86.5], GP: [93, 83], WJC: [86, 75], COC: [90, 79.5], FIS: [78, 69], FC: [78, 69], FESA: [70, 60],
  };
  const QUAL_SCALE = { WC: [90.5, 81], OWG: [90.5, 81], SFWC: [90.5, 81], GP: [87, 80.5], COC: [83, 77], WJC: [83, 74], FC: [76, 68], FIS: [76, 68], FESA: [68, 59] };
  // Korekta rankingiem eloski.eu (js/realelo.js): ocena z jednego sezonu FIS przesuwa się w stronę oceny z Elo
  // (cała kariera, siła rywali). Porównanie 341 zawodników: FIS zawyża zawodników słabszych krajów
  // zbierających wyniki w słabo obsadzonych zawodach i zaniża młodzież mocnych krajów z małą liczbą startów.
  // Waga Elo: 60% przy pojedynczych startach, malejąco do 35% przy 20+ startach.
  function eloRating(e) {
    const m = SJM.ELO_MAP;
    if (e <= m[0][0]) return m[0][1];
    for (let i = 1; i < m.length; i++) if (e <= m[i][0]) return m[i - 1][1] + (m[i][1] - m[i - 1][1]) * (e - m[i - 1][0]) / (m[i][0] - m[i - 1][0]);
    return m[m.length - 1][1];
  }
  function realRating(rec) {
    const rt = fisRating(rec);
    const e = SJM.REAL_ELO && rec.res.length ? SJM.REAL_ELO[rec.fis] : 0;
    if (e) {
      const n = rec.res.filter(([, k]) => k > 0).length;
      const w = U.clamp(0.6 - 0.25 * Math.min(n, 20) / 20, 0.35, 0.6);
      rt.fisR = rt.r;
      rt.r += w * (eloRating(e) - rt.r);
      rt.elo = e;
    }
    return rt;
  }
  function fisRating(rec) {
    const score = (race, rank) => {
      const lv = (race[1] === 'QUA' ? QUAL_SCALE[race[5]] : RATING_SCALE[race[1]]) || [84, 80];
      return lv[0] - (lv[0] - lv[1]) * Math.log(rank) / Math.log(30);
    };
    const ranked = rec.res.filter(([, k]) => k > 0).map(([ri, k]) => [SJM.REAL_RACES[ri], k]);
    if (!ranked.length) return { r: rec.r, fl: rec.fl };
    const sc = ranked.map(([race, k]) => score(race, k)).sort((a, b) => b - a);
    const k = Math.min(sc.length, U.clamp(Math.ceil(sc.length * 0.3), 3, 10));
    let r = U.sum(sc.slice(0, k)) / k;
    if (k < 3) r -= (3 - k) * 0.6;
    // premia za loty: najlepszy wynik na mamucie względem oceny (jak w build_db.pl)
    const fly = ranked.filter(([race]) => race[4] === 'F').map(([race, kk]) => score(race, kk));
    return { r, fl: fly.length ? Math.max(...fly) - r + 4 : 0 };
  }

  // zawodnik z prawdziwej bazy FIS: { n, f, l, b (data ur.), r (ocena z wyników), fl (premia za loty), fis, club, skis, res }
  // podia w PŚ (prawdziwa historia do marca 2026) – dopasowanie po imieniu i nazwisku bez znaków diakrytycznych
  const normName = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L').replace(/ø/g, 'o').toLowerCase().replace(/[^a-z]/g, '');
  let PODIUM_IDX = null;
  function realPodiums(first, last) {
    if (!SJM.REAL_PODIUMS) return null;
    if (!PODIUM_IDX) { PODIUM_IDX = {}; for (const r of SJM.REAL_PODIUMS) PODIUM_IDX[normName(r[0])] = r; }
    return PODIUM_IDX[normName(first + last)] || PODIUM_IDX[normName(last + first)] || null;
  }

  // indywidualne medale IO / MŚ / MŚ w lotach (prawdziwa historia) – wpisy o tej samej osobie (różna pisownia) są sumowane
  let MEDAL_IDX = null;
  function realMedals(first, last) {
    if (!SJM.REAL_MEDALS) return null;
    if (!MEDAL_IDX) {
      MEDAL_IDX = {};
      for (const r of SJM.REAL_MEDALS) { const k = normName(r[0]); const m = MEDAL_IDX[k] || (MEDAL_IDX[k] = new Array(9).fill(0)); for (let i = 0; i < 9; i++) m[i] += r[i + 1]; }
    }
    return MEDAL_IDX[normName(first + last)] || MEDAL_IDX[normName(last + first)] || null;
  }

  function realJumper(rec) {
    const rt = realRating(rec);
    const nat = rec.n, first = rec.f, last = rec.l, fly = U.clamp(rt.fl, -2, 8);
    const born = +rec.b.slice(0, 4);
    const st = SJM.state;
    const ageY = st.season - born;
    const target = U.clamp(rt.r + U.gauss(0, 0.3), 35, 98);
    const grow = ageY <= 16 ? 14 : ageY <= 17 ? 12 : ageY <= 18 ? 10 : ageY <= 19 ? 8 : ageY <= 21 ? 5.5 : ageY <= 23 ? 3.5 : ageY <= 25 ? 1.8 : ageY <= 28 ? 0.6 : 0;
    // niepewność rozwoju: nie każdy obiecujący zawodnik wykorzysta pełny przyrost wiekowy (45–120%)
    const pot = U.clamp(target + grow * (0.45 + Math.random() * 0.75) + U.gauss(0, grow > 4 ? 3 : grow > 0 ? 1.5 : 0.3), target, Math.max(target, 97.5));
    const attrs = {};
    for (const at of SJM.ATTRS) attrs[at.key] = target + U.gauss(0, 3.5);
    // doświadczenie vs młodość
    if (ageY >= 30) { attrs.mental += 3; attrs.consist += 3; attrs.power -= Math.min(8, (ageY - 29) * 1.2); }
    if (ageY <= 21) { attrs.mental -= 3; attrs.consist -= 3; attrs.power += 1; }
    attrs.flying = target - 7 + Math.max(0, fly) * 1.3 + Math.min(4, Math.max(0, ageY - 20) * 0.5) + U.gauss(0, 2);
    for (const k of Object.keys(attrs)) attrs[k] = U.clamp(attrs[k], 5, 99.5);
    const j = {
      id: U.uid('j'), first, last, nation: nat, born, attrs, pot,
      form: U.gauss(0, 2.5), fatigue: U.randInt(0, 15), morale: 55, injury: 0, group: null,
      height: Math.round(U.gauss(176, 5)), real: true,
      season: blankSeasonStats(),
      career: { starts: 0, wins: 0, podiums: 0, wcStarts: 0, medals: { g: 0, s: 0, b: 0 }, globes: 0, tcs: 0, best: null },
      log: [],
      fis: rec.fis, birth: rec.b, club: rec.club, skis: rec.skis,
    };
    const med = realMedals(first, last);
    if (med) {
      j.career.medalsBy = { OWG: { g: med[0], s: med[1], b: med[2] }, WCH: { g: med[3], s: med[4], b: med[5] }, SFWC: { g: med[6], s: med[7], b: med[8] } };
      j.career.medals = { g: med[0] + med[3] + med[6], s: med[1] + med[4] + med[7], b: med[2] + med[5] + med[8] };
      j.career.realMedals = true;
    }
    const pod = realPodiums(first, last);
    if (pod) { j.career.wins = pod[2]; j.career.podiums = pod[2] + pod[3] + pod[4]; j.career.realPodiums = { g: pod[2], s: pod[3], b: pod[4] }; j.career.best = pod[2] ? 1 : pod[3] ? 2 : 3; }
    setOverall(j, target);
    const fixed = (SJM.REAL_TRAITS[first + " " + last] || []).slice();
    if (rt.fl >= 3.5 && !fixed.includes("flyer")) fixed.push("flyer");
    SJM.T.assign(j, { fixed, flyingBias: 0.02, randomScale: 0.5 });
    j.pot = Math.max(j.pot, overall(j));
    return j;
  }

  function blankSeasonStats() {
    return { starts: 0, wcStarts: 0, wins: 0, podiums: 0, top10: 0, best: {} };
  }

  function genStaff(role, qMean, nat, sd = 12) {
    const q = U.clamp(Math.round(U.gauss(qMean, sd)), 15, 98);
    const base = SJM.STAFF_ROLES[role].base;
    const salary = Math.round(base * (0.35 + Math.pow(q / 70, 2.2)) / 1000) * 1000;
    return {
      id: U.uid('s'), role, quality: q, salary,
      first: U.pick(SJM.STAFF_FIRST), last: U.pick(SJM.STAFF_LAST),
      nation: nat || U.pick(SJM.NATIONS.slice(0, 14)).code,
      age: U.randInt(32, 64),
      // specjalność trenera
      spec: role.startsWith('coach') ? U.pick(['takeoff', 'flight', 'inrun', 'landing', 'power', 'mental']) : null,
    };
  }

  // prawdziwy trener z SJM.REAL_STAFF / REAL_STAFF_FREE (stała jakość, prawdziwe dane)
  function realStaff(role, r, nat) {
    const x = genStaff(role, r.q, r.nat || nat);
    x.quality = r.q;
    x.salary = Math.round(SJM.STAFF_ROLES[role].base * (0.35 + Math.pow(r.q / 70, 2.2)) / 1000) * 1000;
    x.first = r.first; x.last = r.last;
    x.age = r.b ? 2026 - r.b : U.randInt(34, 50);
    x.real = true;
    return x;
  }

  // byli skoczkowie jako kandydaci do sztabu: część emerytów (26+ lat) trafia na rynek.
  // Talent trenerski nie zależy od osiągnięć – średni skoczek może zostać świetnym trenerem i odwrotnie.
  const ATTR_SPEC = { inrun: 'inrun', takeoff: 'takeoff', flight: 'flight', flying: 'flight', landing: 'landing', power: 'power', mental: 'mental', consist: 'mental' };
  function exJumperStaff(retired, max = 6) {
    const pool = U.shuffle(retired.filter((j) => age(j) >= 26 && Math.random() < 0.3)).slice(0, max);
    return pool.map((j) => {
      const a = age(j);
      // młodzi emeryci zaczynają od juniorów i kadry B, starsi mogą od razu prowadzić kadrę A
      const role = a < 30 ? U.pick(['coachJ', 'coachJ', 'coachB', 'scout']) : U.pick(['coachA', 'coachB', 'coachB', 'coachJ', 'tech', 'scout']);
      const q = U.clamp(Math.round(U.gauss(44 + Math.min(6, (a - 26) * 0.5), 13)), 25, 85);
      const x = genStaff(role, q, j.nation);
      x.quality = q;
      x.salary = Math.round(SJM.STAFF_ROLES[role].base * (0.35 + Math.pow(q / 70, 2.2)) / 1000) * 1000;
      x.first = j.first; x.last = j.last; x.age = a; x.exJumper = true;
      if (x.spec) x.spec = ATTR_SPEC[Object.keys(j.attrs).sort((p, r) => j.attrs[r] - j.attrs[p])[0]] || x.spec;
      return x;
    });
  }

  function genStaffMarket(count = 18) {
    const roles = Object.keys(SJM.STAFF_ROLES);
    const market = [];
    for (let i = 0; i < count; i++) market.push(genStaff(roles[i % roles.length], U.randInt(35, 80)));
    // kilka gwiazd na rynku
    for (let i = 0; i < 3; i++) market.push(genStaff(U.pick(['coachA', 'coachB', 'tech', 'physio']), 85));
    // prawdziwi trenerzy bez posady (gra z bazą prawdziwych zawodników)
    const st = SJM.state;
    if (st && st.realStaff && SJM.REAL_STAFF_FREE) {
      const taken = new Set(employedNames().concat(st.staffGone || [], (st.staffMarket || []).map((x) => x.first + ' ' + x.last)));
      for (const r of SJM.REAL_STAFF_FREE) if (!taken.has(r.first + ' ' + r.last) && Math.random() < 0.75) market.push(realStaff(r.role, r));
    }
    return market;
  }

  // wszyscy zatrudnieni sztabowcy (gracz + kraje AI)
  function employedNames() {
    const st = SJM.state, out = [];
    const add = (staff) => { for (const x of Object.values(staff || {})) if (x) out.push(x.first + ' ' + x.last); };
    if (st.player) add(st.player.staff);
    for (const n of Object.values(st.nations || {})) add(n.staff);
    return out;
  }

  // sztab kraju AI: prawdziwi trenerzy (jeśli są) + osoby wokół poziomu federacji
  function staffNat(code) { return Math.random() < 0.75 ? code : U.pick(SJM.NATIONS.slice(0, 14)).code; }
  function aiBase(code) { return aiProfile(nationData(code)); }
  function genAiStaff(code) {
    const st = SJM.state, base = aiBase(code);
    const real = st.realStaff && SJM.REAL_STAFF && SJM.REAL_STAFF[code];
    const staff = {};
    for (const r of Object.keys(SJM.STAFF_ROLES)) {
      staff[r] = real && real[r] ? realStaff(r, real[r], code) : genStaff(r, base[r], staffNat(code), 7);
      staff[r].since = st.season - U.randInt(0, 4);
      staff[r].until = st.season + U.randInt(0, 2);
    }
    return staff;
  }
  // profil obliczeniowy kraju AI odzwierciedla jakość jego sztabu
  function syncAi(code) {
    const n = SJM.state.nations[code];
    if (!n || !n.staff) return;
    const base = aiBase(code);
    for (const r of Object.keys(SJM.STAFF_ROLES)) n.ai[r] = n.staff[r] ? n.staff[r].quality : base[r] - 15;
  }

  function defaultFacilities(s) {
    return {
      center: U.clamp(1 + Math.floor(s / 30), 1, 5),
      tunnel: s >= 85 ? 1 : 0,
      medical: U.clamp(1 + Math.floor(s / 35), 1, 4),
      academy: U.clamp(1 + Math.floor(s / 25), 1, 5),
      lab: s >= 80 ? 1 : 0,
    };
  }

  // Profil "sztabu" krajów AI
  function aiProfile(n) {
    const s = n.strength;
    const f = defaultFacilities(s);
    const q = 30 + s * 0.6;
    return { coachA: q, coachB: q - 8, coachJ: q - 12, physio: q - 5, tech: q, psych: q - 15, scout: q - 10, ...f };
  }

  // Profil do obliczeń: dla gracza z rzeczywistego sztabu / obiektów
  function profile(code) {
    const st = SJM.state;
    if (code === st.nation) {
      const p = st.player;
      const sq = (r) => (p.staff[r] ? p.staff[r].quality : 20);
      return { coachA: sq('coachA'), coachB: sq('coachB'), coachJ: sq('coachJ'), physio: sq('physio'), tech: sq('tech'), psych: sq('psych'), scout: sq('scout'), ...p.facilities };
    }
    return st.nations[code].ai;
  }

  function equipBonus(code) {
    const p = profile(code);
    return (p.tech - 50) / 50 * 0.9 + p.lab * 0.35 + (code === SJM.state.nation && SJM.M.modVal ? SJM.M.modVal("equip") : 0);
  }

  // homologacja startowa obiektów (klasy: A – PŚ i wielkie imprezy, B – PK/MŚJ, C – FIS Cup, D – zawody krajowe i trening)
  function startHomol(h, season) {
    const cls = h.club ? (h.K >= 85 ? "C" : null) : h.K >= 100 && h.lights ? "A" : h.K >= 85 ? "B" : h.K >= 65 ? "C" : "D";
    return cls ? { cls, until: season + U.randInt(1, 4) } : null;
  }

  function initialPlayerHills(nat, season) {
    const hills = SJM.HILLS.filter((h) => h.nation === nat).map((h) => ({
      id: h.id, name: h.name, city: h.city, K: h.K, HS: h.HS, type: hillType(h.K),
      condition: h.K >= 85 && !h.club ? U.randInt(80, 96) : U.randInt(72, 96), igelit: hillType(h.K) !== "flying" && Math.random() < 0.75, lights: h.K >= 100 || Math.random() < 0.6, builtin: true, club: !!h.club,
    }));
    const n = nationData(nat);
    const site = SJM.HILL_SITES[nat] || { hist: [], cities: [] };
    const local = site.hist.concat(site.cities).slice(0, 2);
    const cities = hills.length ? hills.map((h) => h.city) : local.length ? local : ['Ośrodek regionalny'];
    // ogólne małe obiekty tylko tam, gdzie kraj nie ma prawdziwych skoczni K<85
    const extra = hills.some((h) => h.K < 85) ? 0 : Math.max(2, Math.round(n.depth / 9));
    for (let i = 0; i < extra; i++) {
      const t = i % 3 === 2 ? 'medium' : 'small';
      const ht = SJM.HILL_TYPES[t];
      hills.push({
        id: U.uid('h'), name: 'Skocznia ' + (t === 'small' ? 'K-' + (ht.K - 10 + i * 5) : 'K-' + ht.K), city: U.pick(cities),
        K: t === 'small' ? ht.K - 10 + i * 5 : ht.K, HS: t === 'small' ? ht.HS - 10 + i * 5 : ht.HS,
        type: t, condition: U.randInt(45, 85), igelit: Math.random() < 0.6, lights: Math.random() < 0.4, builtin: false,
      });
    }
    return hills;
  }

  // kraj i jego zawodnicy (nowa gra albo kraj dodany w nowszej wersji – migracja zapisu)
  function initNation(st, n, useReal) {
    st.nations[n.code] = { code: n.code, ai: aiProfile(n), quota: { WC: 2, COC: 4, FIS: 6 }, budget: n.budget };
    const potMean = 52 + n.strength * 0.32;
    const reals = useReal ? SJM.REAL_JUMPERS.filter((r) => r.n === n.code) : [];
    for (const rec of reals) { const j = realJumper(rec); st.jumpers[j.id] = j; }
    const fill = useReal ? Math.max(0, n.depth - reals.length) : n.depth;
    for (let i = 0; i < fill; i++) {
      // rozkład wieku: dużo młodzieży, mniej weteranów (przy prawdziwej bazie: głównie juniorzy)
      const a = useReal && reals.length >= 6 ? U.randInt(15, 21) : U.clamp(Math.round(15 + Math.pow(Math.random(), 1.25) * 19), 15, 35);
      const j = genJumper(n.code, a, potMean);
      if (useReal) capOverall(j, 74 - Math.random() * 4);
      st.jumpers[j.id] = j;
    }
    // gwarantowany lider kadry dla mocnych krajów
    if (!useReal && n.strength >= 60) {
      const star = genJumper(n.code, U.randInt(23, 29), 60 + n.strength * 0.36, 3);
      st.jumpers[star.id] = star;
    }
  }

  function newGame(nationCode, managerName, opts = {}) {
    syncNations(null);
    const useReal = !!opts.real && !!SJM.REAL_JUMPERS;
    const st = {
      version: 1,
      manager: { name: managerName || 'Menedżer' },
      nation: nationCode,
      season: 2026,
      week: 0,
      jumpers: {},
      nations: {},
      results: {},
      standings: null,
      history: [],
      medalTable: {},
      inbox: [],
      retired: [],
      nominations: {},
      ledger: [],
      gameOver: false,
      created: Date.now(),
      realDB: useReal ? SJM.REAL_SEASON : null,
      realStaff: useReal && !!SJM.REAL_STAFF,
    };
    SJM.state = st;

    // kraje + zawodnicy
    for (const n of SJM.NATIONS) initNation(st, n, useReal);

    const nd = nationData(nationCode);
    const qMean = 35 + nd.strength * 0.45;
    st.player = {
      budget: Math.round(nd.budget * 1e6 * 0.3),
      grant: Math.round(nd.budget * 1e6),
      popularity: nd.pop,
      board: 60,
      staff: {},
      training: {
        A: { intensity: 'normal', focus: 'balanced' },
        B: { intensity: 'normal', focus: 'balanced' },
        J: { intensity: 'normal', focus: 'balanced' },
      },
      facilities: defaultFacilities(nd.strength),
      hills: [],
      projects: [],
      hostBids: {},
      hosted: {},
      seasonFinance: { income: {}, expense: {} },
      expectation: null,
    };
    st.player.hills = initialPlayerHills(nationCode, st.season);
    for (const h of st.player.hills) { const hm = startHomol(h, st.season); if (hm) h.homol = hm; }
    st.player.homolInit = true;
    const localPay = Math.sqrt(U.clamp(nd.budget / 4, 0.08, 1.3));
    for (const r of Object.keys(SJM.STAFF_ROLES)) {
      const real = st.realStaff && SJM.REAL_STAFF[nationCode] && SJM.REAL_STAFF[nationCode][r];
      const x = real ? realStaff(r, real, nationCode) : genStaff(r, qMean, nationCode);
      x.salary = Math.round(x.salary * localPay / 1000) * 1000; // krajowy sztab - lokalne stawki
      x.since = st.season;
      x.until = st.season + U.randInt(0, 2);
      st.player.staff[r] = x;
    }
    for (const n of SJM.NATIONS) if (n.code !== nationCode) { st.nations[n.code].staff = genAiStaff(n.code); syncAi(n.code); }
    st.staffMarket = genStaffMarket();

    // limit liczebności kadr (prawdziwa baza może przekraczać typową liczebność)
    for (const n of SJM.NATIONS) st.nations[n.code].cap = Math.max(n.depth, Object.values(st.jumpers).filter((j) => j.nation === n.code).length);

    // przydział do grup gracza
    SJM.M.autoGroups();
    // małe federacje nie utrzymają pełnego sztabu: najmniej ważne stanowiska startują nieobsadzone (pensje ≤ limit płac zarządu)
    {
      const p = st.player;
      const pay = () => Object.values(p.staff).filter(Boolean).reduce((a, x) => a + x.salary, 0);
      for (const r of ['psych', 'scout', 'tech', 'physio', 'coachB', 'coachJ']) if (pay() > SJM.M.payrollCap() && !(st.realStaff && SJM.REAL_STAFF[nationCode] && SJM.REAL_STAFF[nationCode][r])) p.staff[r] = null;
    }
    SJM.M.initStartingPoints(useReal);
    SJM.M.startSeason(true);

    SJM.M.news('Witaj w federacji!', `Zarząd ${nd.name === 'Polska' ? 'Polskiego Związku Narciarskiego' : 'federacji narciarskiej (' + nd.name + ')'} powierzył Ci stanowisko dyrektora sportowego ds. skoków narciarskich.<br><br>
      Twoje zadania: ustalanie składów na zawody, trening kadr A (Puchar Świata), B (Puchar Kontynentalny) i juniorów, zatrudnianie sztabu, rozwój infrastruktury i szkolenia młodzieży.<br><br>
      <b>Oczekiwania zarządu:</b> ${SJM.M.expectationText()}`, 'board');
    return st;
  }

  function fullName(j) { return j.first + ' ' + j.last; }
  function flag(code) { const n = nationData(code); return n ? '<span class="fl fl-' + code + '" title="' + n.name + '"></span>' : ''; }

  return { nationData, syncNations, aiProfile, getHill, hillType, startHomol, maturity, age, skill, overall, genJumper, genStaff, genStaffMarket, exJumperStaff, genAiStaff, syncAi, aiBase, staffNat, initNation, realRating, profile, equipBonus, newGame, fullName, flag, blankSeasonStats, normName, realPodiums };
})();
