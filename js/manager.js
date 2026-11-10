// ===== Logika menedżerska: sezon, składy, trening, finanse =====
SJM.M = (function () {
  const U = SJM.U, W = SJM.W;
  const st = () => SJM.state;
  const JUNIOR_MAX_AGE = 19; // rocznikowo U-20
  const GROUP_LIMITS = { A: 8, B: 8, J: 10 };
  const BIG = ['WCH', 'OWG', 'SFWC'];
  const LEVEL_ORDER = ['WJC', 'OWG', 'WCH', 'SFWC', 'WC', 'SGP', 'COC', 'SCOC', 'FIS', 'NAT'];
  const OFFSEASON_WEEKS = 32; // łączna liczba tygodni treningu letniego (przerwa + tygodnie lata w kalendarzu)
  const TURNS_PER_SEASON = 60; // licznik tur: sezon * 60 + tydzień (sezon z latem ma ~36 tygodni)
  // klasyfikacje generalne cykli (klucz w s.standings)
  const CUP_KEY = { WC: 'wc', SGP: 'sgp', COC: 'coc', SCOC: 'scoc', FIS: 'fis' };

  function turn() { const s = st(); return s.season * TURNS_PER_SEASON + s.week; }
  // zapisy ze starszych wersji: licznik tur sezon * 20, brak klasyfikacji letnich
  function migrate() {
    const s = st();
    if (!s) return;
    W.syncNations(s);
    if (s.standings) { s.standings.sgp = s.standings.sgp || {}; s.standings.scoc = s.standings.scoc || {}; }
    // Puchar Narodów LGP (starsze zapisy): odtworzony z rozegranych konkursów LGP
    if (s.standings && !s.standings.snc) {
      const snc = (s.standings.snc = {});
      for (const ev of ((s.calendar && s.calendar.weeks) || []).flatMap((w) => w.events)) {
        const r = s.results && s.results[ev.id];
        if (ev.level !== 'SGP' || !r || !r.ranking) continue;
        if (r.type === 'team') r.ranking.forEach((x) => { if (x.rank && x.rank <= 8) snc[x.nat] = (snc[x.nat] || 0) + SJM.TEAM_POINTS[x.rank - 1]; });
        else r.ranking.forEach((x) => { const n = (s.jumpers[x.id] || {}).nation; if (n && x.rank && x.rank <= 30) snc[n] = (snc[n] || 0) + SJM.WC_POINTS[x.rank - 1]; });
      }
    }
    // kwota PK: premia za okres FIS Cup liczona ponad minimum (starsze zapisy mogły ją stracić w minimum)
    for (const n of Object.values(s.nations || {})) {
      const q = n.quota;
      if (q) q.FIS = QUOTA_RULES.fisQuota; // FIS Cup: stała kwota 10 (starsze zapisy miały 6–10)
      if (q && q.crl !== undefined && q.fisB) q.COC = Math.max(q.COC, Math.min(QUOTA_RULES.maxCOC, Math.max(q.crl, QUOTA_RULES.minCOC) + q.fisB));
    }
    // rankingi kroczące (kwoty wg FIS): punkty rozłożone na okresy odtworzone z sum sezonowych
    if (s.standings && Object.values(s.jumpers).some((j) => !j.ppPrev)) {
      const per = Math.max(1, currentPeriod()), sd = s.standings;
      for (const j of Object.values(s.jumpers)) {
        if (j.ppPrev) continue;
        const p = j.prevPts || {};
        j.ppPrev = { WC: [p.SGP || 0, ...[1, 2, 3].map(() => (p.WC || 0) / 3)], COC: [p.SCOC || 0, ...[1, 2, 3].map(() => (p.COC || 0) / 3)], FIS: [0, 1, 2, 3].map(() => (p.FIS || 0) / 4) };
        j.pp = blankPP();
        j.pp.WC[0] = sd.sgp[j.id] || 0; j.pp.COC[0] = sd.scoc[j.id] || 0;
        // zimowe punkty bieżącego sezonu – po równo w okresach już rozegranych (lub trwającym)
        for (let i = 1; i <= per; i++) { j.pp.WC[i] = (sd.wc[j.id] || 0) / per; j.pp.COC[i] = (sd.coc[j.id] || 0) / per; j.pp.FIS[i] = (sd.fis[j.id] || 0) / per; }
      }
      computePeriodQuotas(currentPeriod());
    }
    // miejsce za medal MŚJ (starsze zapisy): medaliści odtworzeni z medali bieżącego sezonu
    if (s.wjcQuota && !s.wjcQuota.ids) {
      s.wjcQuota.ids = {};
      if (s.wjcQuota.season === s.season) for (const m of s.seasonMedals || []) if (m.level === 'WJC' && m.ids && m.ids.length === 1) (s.wjcQuota.ids[m.nat] = s.wjcQuota.ids[m.nat] || []).push(m.ids[0]);
    }
    // dożywotnie uprawnienia (starsze zapisy): odtworzone z punktów poprzedniego sezonu
    for (const j of Object.values(s.jumpers || {})) if (!j.life) updateLife(j);
    // podia w PŚ sprzed gry (zapisy sprzed js/realpodium.js): prawdziwe liczby dochodzą do wyników z gry
    if (s.realDB) {
      for (const j of Object.values(s.jumpers)) {
        if (!j.real || j.career.realPodiums) continue;
        const pod = W.realPodiums(j.first, j.last);
        if (!pod) continue;
        j.career.wins += pod[2]; j.career.podiums += pod[2] + pod[3] + pod[4];
        j.career.realPodiums = { g: pod[2], s: pod[3], b: pod[4] };
        const best = pod[2] ? 1 : pod[3] ? 2 : 3;
        if (!j.career.best || best < j.career.best) j.career.best = best;
      }
      // emeryci z gry: wpis bez prawdziwych podiów ma mniej wygranych lub podiów niż prawdziwa kariera
      for (const r of s.retired || []) {
        if (r.rp) continue;
        r.rp = true;
        const [first, ...rest] = r.name.split(' '), pod = W.realPodiums(first, rest.join(' '));
        if (pod && (r.wins < pod[2] || r.podiums < pod[2] + pod[3] + pod[4])) { r.wins += pod[2]; r.podiums += pod[2] + pod[3] + pod[4]; }
      }
    }
    // tytuły w starym formacie ({ season, ids } w kolejności konkursów) → osobno dla każdego konkursu
    for (const [lv, t] of Object.entries(s.titles || {})) {
      if (!t || !t.ids) continue;
      const keys = lv === 'SFWC' ? ['fh'] : ['nh', 'lh'];
      s.titles[lv] = {};
      t.ids.forEach((id, i) => { if (keys[i]) s.titles[lv][keys[i]] = { id, season: t.season }; });
    }
    // 1. sezon z prawdziwą bazą: obrońcy tytułów sprzed gry (dopóki w grze nie rozegrano MŚ)
    if (s.realDB && s.season === 2026 && !(s.titles && s.titles.WCH)) seedRealTitles();
    // zapis z 1. sezonu sprzed premii MŚJ 2026 (dopóki w grze nie rozdano medali MŚJ 2027)
    if (s.season === 2026 && !s.wjcQuota && s.nations.AUT && s.nations.AUT.quota) {
      seedWjcQuota();
      for (const c of s.wjcQuota.nats) { const q = s.nations[c].quota; if (q && !q.wjcB) { q.wjcB = 1; q.WC = Math.min(QUOTA_RULES.maxWC, q.WC + 1); } }
    }
    // limit kadr zmniejszony (B: 10 → 8) – najsłabsi nadmiarowi wracają do klubów
    for (const [g, max] of Object.entries(GROUP_LIMITS)) {
      const extra = myJumpers().filter((j) => j.group === g).sort((a, b) => W.overall(b) - W.overall(a)).slice(max);
      if (!extra.length) continue;
      extra.forEach((j) => (j.group = 'R'));
      news(`Kadra ${g}: nowy limit ${max} zawodników`, `Do klubów wracają: ${extra.map((j) => W.fullName(j)).join(', ')}.`, 'info');
    }
    // kraje dodane w nowszej wersji (Rosja, Łotwa): kadry, sztab, limit liczebności
    for (const n of SJM.NATIONS) {
      if (s.nations[n.code]) continue;
      W.initNation(s, n, !!s.realDB && !!SJM.REAL_JUMPERS);
      s.nations[n.code].cap = Math.max(n.depth, jumpersOf(n.code).length);
      news(`Nowa reprezentacja: ${n.name}`, `Do rywalizacji dołącza ${n.name} (${jumpersOf(n.code).length} zawodników).`, 'world');
    }
    // skocznie dodane w nowszej wersji (prawdziwe mniejsze obiekty zastępują ogólne „Skocznia K-…”)
    {
      const p = s.player, real = SJM.HILLS.filter((h) => h.nation === s.nation);
      const added = [];
      for (const h of real) {
        const mine = p.hills.find((x) => x.id === h.id);
        if (mine) { if (mine.builtin && (mine.K !== h.K || mine.HS !== h.HS)) { mine.K = h.K; mine.HS = h.HS; mine.type = W.hillType(h.K); } if (mine.builtin) mine.club = !!h.club; continue; }
        p.hills.push({ id: h.id, name: h.name, city: h.city, K: h.K, HS: h.HS, type: W.hillType(h.K), condition: U.randInt(65, 90),
          igelit: h.K < 170 && Math.random() < 0.75, lights: h.K >= 100 || Math.random() < 0.6, builtin: true, club: !!h.club });
        added.push(/HS\d+/.test(h.name) ? h.name : h.name + ' HS' + h.HS);
      }
      if (added.length) {
        const busy = new Set((p.projects || []).map((pr) => pr.target));
        if (real.some((h) => h.K < 85)) p.hills = p.hills.filter((x) => x.builtin || busy.has(x.id) || !/^Skocznia K-\d+$/.test(x.name));
        news('Nowe skocznie w kraju', 'Do bazy obiektów dołączają: ' + added.slice(0, 10).join(', ') + (added.length > 10 ? ` i ${added.length - 10} innych` : '') + '. Obiekty klubowe utrzymują kluby i gminy.', 'info');
      }
    }
    // homologacja (zapisy sprzed jej wprowadzenia): klasy startowe jak w nowej grze
    if (!s.player.homolInit) {
      s.player.homolInit = true;
      for (const h of s.player.hills) if (!h.homol && !h.building) { const hm = W.startHomol(h, s.season); if (hm) h.homol = hm; }
    }
    // sztaby krajów AI (zapisy sprzed tej wersji)
    for (const n of SJM.NATIONS) if (n.code !== s.nation && !s.nations[n.code].staff) { s.nations[n.code].staff = W.genAiStaff(n.code); W.syncAi(n.code); }
    // kontrakty sztabowców (zapisy sprzed okna kontraktowego)
    for (const n of SJM.NATIONS) for (const x of Object.values(staffOf(n.code) || {})) if (x && x.until === undefined) x.until = s.season + U.randInt(0, 1);
    // bieżące lato w starym układzie (więcej weekendów) → reszta lata według nowego kalendarza
    if (SJM.CAL.fixSummer()) news('Kalendarz letni', `FIS skróciła letni kalendarz: Letnie Grand Prix, Letni PK i FIS Cup mają po 10 weekendów (lipiec – połowa września), potem przerwa jesienna na trening. Pozostałe weekendy tego lata zostały przestawione na nowy kalendarz.`, 'info');
    // okno kontraktowe w trakcie (zapisy sprzed naboru funkcja po funkcji): nabór od nowa od trenera kadry A
    if (s.staffWindow && s.staffWindow.phase === 'draft' && s.staffWindow.roleIdx === undefined) startDraft();
    if (s.turnScale === TURNS_PER_SEASON) return;
    const conv = (x) => (typeof x === 'number' ? Math.floor(x / 20) * TURNS_PER_SEASON + (x % 20) : x);
    for (const j of Object.values(s.jumpers)) if (j.lastStart !== undefined) j.lastStart = conv(j.lastStart);
    if (s.ev) {
      for (const k of Object.keys(s.ev.last || {})) s.ev.last[k] = conv(s.ev.last[k]);
      (s.ev.queue || []).forEach((q) => (q.at = conv(q.at)));
    }
    s.turnScale = TURNS_PER_SEASON;
  }

  // ---------- Pomocnicze ----------
  function news(title, body, type = 'info', date = null) {
    const s = st();
    const wk = s.calendar && s.calendar.weeks[Math.min(s.week, s.calendar.weeks.length - 1)];
    s.inbox.unshift({ id: U.uid('m'), title, body, type, date: date || (wk ? wk.date : new Date().toISOString()), read: false });
    if (s.inbox.length > 150) s.inbox.length = 150;
  }

  function jumpersOf(nat) { return Object.values(st().jumpers).filter((j) => j.nation === nat); }
  function myJumpers() { return jumpersOf(st().nation); }
  function isJunior(j) { return W.age(j) <= JUNIOR_MAX_AGE; }
  function available(j) { return j.injury <= 0 && !(j.suspended > 0); }

  // ---------- Modyfikatory czasowe (z wydarzeń) ----------
  function mods() { const p = st().player; if (!p.mods) p.mods = []; return p.mods; }
  function modVal(key) { return U.sum(mods().filter((m) => m.key === key), (m) => m.value); }
  function addMod(key, value, weeks, label) { mods().push({ key, value, weeks, label }); }
  function tickMods(weeks) { const p = st().player; p.mods = mods().map((m) => ({ ...m, weeks: m.weeks - weeks })).filter((m) => m.weeks > 0); }
  function currentWeek() { const s = st(); return s.calendar.weeks[s.week]; }

  function ledger(cat, amount, label) {
    const p = st().player;
    p.budget += amount;
    const book = amount >= 0 ? p.seasonFinance.income : p.seasonFinance.expense;
    book[cat] = (book[cat] || 0) + Math.abs(amount);
    if (label) {
      st().ledger.unshift({ date: currentWeek() ? currentWeek().date : null, label, amount });
      if (st().ledger.length > 120) st().ledger.length = 120;
    }
  }

  function hostNationOf(hillId) {
    const s = st();
    if (s.player.hills.find((h) => h.id === hillId)) return s.nation;
    const h = W.getHill(hillId);
    return h ? h.nation : null;
  }

  // ---------- Kwoty startowe w okresach (wg regulaminów FIS PŚ i PK) ----------
  // Rankingi kroczące: sezon ma 4 okresy punktowe (0 = lato, 1–3 = zima). Na początku okresu k wyniki okresów 0..k-1
  // bieżącego sezonu zastępują te same okresy poprzedniego sezonu (jak World Ranking List i Continental Ranking List FIS),
  // więc ranking obejmuje zawsze ostatni rok, a kwoty zmieniają się stopniowo.
  // PŚ (ranking światowy: PŚ + LGP): top 45 z limitem 5 na kraj; kraj z 1–2 zawodnikami w top 45 dostaje +2, z 3 – +1;
  //     kwota podstawowa 2 dla kraju z punktami PŚ (poprzedni lub bieżący sezon); +1 za top 3 klasyfikacji ostatniego
  //     okresu PK (maks. 1 na kraj, miejsce przechodzi dalej) i +1 za medal indywidualny MŚJ; maks. 7. Gospodarz +4 (grupa krajowa).
  // PK (ranking kontynentalny: PK + LPK): top 50 z limitem 6 na kraj, +1 za każdego zawodnika w top 3 klasyfikacji ostatniego
  //     okresu FIS Cup (kraj z kwotą 7 – miejsce przechodzi dalej); maks. 7; każdy kraj może wystawić co najmniej 4. Gospodarz +6.
  // FIS Cup: każdy kraj ma stałą kwotę 10 (bez premii za ranking i bez dodatku dla gospodarza).
  // Lato: LGP – kwota jak w PŚ, LPK – jak w PK.
  const HOST_BONUS = { WC: 4, COC: 6, FIS: 0, SGP: 4, SCOC: 6 };
  const QUOTA_RULES = { wrlTop: 45, wrlPerNation: 5, crlTop: 50, crlPerNation: 6, fisTop: 40, fisPerNation: 4, maxWC: 7, maxCOC: 7, minCOC: 4, basicWC: 2, baseFIS: 6, fisQuota: 10, periodTop: 3 };
  const TEAM_MIN = 4; // minimalna kwota w weekend z konkursem drużynowym
  const PCUP = { WC: 'WC', SGP: 'WC', COC: 'COC', SCOC: 'COC', FIS: 'FIS' }; // cykl → ranking kroczący
  const blankPP = () => ({ WC: [0, 0, 0, 0], COC: [0, 0, 0, 0], FIS: [0, 0, 0, 0] });
  function addPeriodPts(j, level, period, pts) {
    const cup = PCUP[level];
    if (!cup) return;
    if (!j.pp) j.pp = blankPP();
    j.pp[cup][U.clamp(period || 0, 0, 3)] += pts;
  }
  const hasSummer = () => !!(st().calendar && st().calendar.weeks.some((w) => w.summer));
  // ranking kroczący przed okresem k (sezon bez lata – np. pierwszy w grze – zachowuje lato poprzedniego roku)
  function rollingPts(j, cup, k, summer) {
    const cur = (j.pp && j.pp[cup]) || [0, 0, 0, 0], prev = (j.ppPrev && j.ppPrev[cup]) || [0, 0, 0, 0];
    let t = 0;
    for (let i = 0; i < 4; i++) t += i < k && (i > 0 || summer) ? cur[i] : prev[i];
    return t;
  }
  // punkty z ostatniego zakończonego okresu (premia za top 3 okresu PK / FIS Cup)
  function lastPeriodPts(j, cup, k, summer) {
    if (k === 0 || (k === 1 && !summer)) return ((j.ppPrev && j.ppPrev[cup]) || [0, 0, 0, 0])[3];
    return ((j.pp && j.pp[cup]) || [0, 0, 0, 0])[k - 1];
  }
  // przydział z rankingu: po 1 miejscu na zawodnika od góry listy, z limitem na kraj; remis na ostatnim miejscu – wszyscy
  function allocate(ranked, top, perNation) {
    const cnt = {};
    let n = 0, last = null;
    for (const [j, p] of ranked) {
      if (n >= top && p !== last) break;
      if ((cnt[j.nation] || 0) >= perNation) continue;
      cnt[j.nation] = (cnt[j.nation] || 0) + 1;
      n++; last = p;
    }
    return cnt;
  }

  // źródło: 'prev' (wyniki poprzedniego sezonu – 1. okres) albo 'cur' (bieżące klasyfikacje sezonu)
  function pointsOf(j, cup, source) {
    const s = st();
    if (source === 'prev') return (j.prevPts && j.prevPts[cup]) || 0;
    const key = { WC: 'wc', COC: 'coc', FIS: 'fis', SGP: 'sgp', SCOC: 'scoc' }[cup];
    return (s.standings && s.standings[key] && s.standings[key][j.id]) || 0;
  }
  // k – okres, który się zaczyna (0 = lato / koniec sezonu, 1–3 = zima); 'prev' i 'cur' ze starszych wywołań
  function computePeriodQuotas(k) {
    const s = st();
    const R = QUOTA_RULES;
    if (k === 'prev') k = 0;
    else if (k === 'cur') k = currentPeriod();
    const summer = hasSummer();
    const all = Object.values(s.jumpers);
    const ranked = (f) => all.map((j) => [j, f(j)]).filter(([, p]) => p > 0).sort((a, b) => b[1] - a[1]);
    const wrl = allocate(ranked((j) => rollingPts(j, 'WC', k, summer)), R.wrlTop, R.wrlPerNation);
    const crl = allocate(ranked((j) => rollingPts(j, 'COC', k, summer)), R.crlTop, R.crlPerNation);
    const fis = allocate(ranked((j) => rollingPts(j, 'FIS', k, summer)), R.fisTop, R.fisPerNation);
    const wcPts = new Set(all.filter((j) => (j.prevPts && j.prevPts.WC > 0) || (s.standings && s.standings.wc && s.standings.wc[j.id] > 0)).map((j) => j.nation));
    const wjc = (s.wjcQuota && s.wjcQuota.nats) || [];
    // kwoty przed premiami za klasyfikację okresu
    const baseWC = {}, baseCOC = {};
    for (const n of SJM.NATIONS) {
      const c = n.code, a = wrl[c] || 0;
      const add = a === 0 ? 0 : a <= 2 ? 2 : a === 3 ? 1 : 0;
      baseWC[c] = Math.max(a + add, R.basicWC) + (wjc.includes(c) ? 1 : 0);
      baseCOC[c] = Math.max(crl[c] || 0, R.minCOC); // premia za okres FIS Cup dochodzi ponad minimum, nie przepada w nim
    }
    // premie za top 3 klasyfikacji ostatniego okresu (osobnej – tylko punkty z tego okresu): miejsce zawodnika z kraju,
    // który nie może go przyjąć (limit na kraj albo kwota już maksymalna), przechodzi na kolejnego w klasyfikacji okresu
    const periodBonus = (cup, base, perNation, max) => {
      const got = {}, list = [];
      for (const [j, p] of ranked((x) => lastPeriodPts(x, cup, k, summer))) {
        if (list.length >= R.periodTop) break;
        const g = got[j.nation] || 0;
        if (g >= perNation || base[j.nation] + g >= max) continue;
        got[j.nation] = g + 1;
        list.push({ id: j.id, nat: j.nation, pts: Math.round(p) });
      }
      return { got, list };
    };
    const cocBon = periodBonus('COC', baseWC, 1, R.maxWC), fisBon = periodBonus('FIS', baseCOC, Infinity, R.maxCOC);
    s.periodBonus = { period: k, COC: cocBon.list, FIS: fisBon.list };
    // premie przyznane w tym sezonie wg okresu, z którego pochodzą (podzakładki okresów w klasyfikacjach)
    if (k > 0) { if (!s.periodBonusLog || s.periodBonusLog.season !== s.season) s.periodBonusLog = { season: s.season }; s.periodBonusLog[k - 1] = { COC: cocBon.list, FIS: fisBon.list }; }
    for (const n of SJM.NATIONS) {
      const c = n.code;
      const a = wrl[c] || 0;
      const add = a === 0 ? 0 : a <= 2 ? 2 : a === 3 ? 1 : 0;
      // kwota podstawowa 2: za punkty PŚ, a kraj bez kwoty i tak może zgłosić 2 zawodników z prawem startu (art. 4.2.4)
      const basic = R.basicWC, hadPts = wcPts.has(c);
      const cocB = cocBon.got[c] || 0, wjcB = wjc.includes(c) ? 1 : 0;
      const wc = Math.min(R.maxWC, baseWC[c] + cocB);
      const fisB = fisBon.got[c] || 0;
      const coc = Math.min(R.maxCOC, baseCOC[c] + fisB);
      const fc = R.fisQuota;
      const prev = s.nations[c].quota || {};
      s.nations[c].quota = { WC: wc, COC: coc, FIS: fc, wrl: a, add, basic, hadPts, cocB, wjcB, crl: crl[c] || 0, fisB, fisTop: fis[c] || 0, period: k, prevWC: prev.WC, prevCOC: prev.COC, prevFIS: prev.FIS };
    }
  }
  // prognoza premii za trwający okres p (top 3 okresu PK → +1 PŚ, FIS Cup → +1 PK) przy obecnych kwotach jako bazie
  function periodBonusPreview(cup, p) {
    const s = st(), R = QUOTA_RULES, got = {}, list = [];
    const base = (c) => { const q = s.nations[c].quota || {}; return cup === 'COC' ? (q.WC || 0) - (q.cocB || 0) : Math.max(q.crl || 0, R.minCOC); };
    const perNation = cup === 'COC' ? 1 : Infinity, max = cup === 'COC' ? R.maxWC : R.maxCOC;
    const rows = Object.values(s.jumpers).map((j) => [j, ((j.pp && j.pp[cup]) || [0, 0, 0, 0])[p]]).filter(([, x]) => x > 0).sort((a, b) => b[1] - a[1]);
    for (const [j, x] of rows) {
      if (list.length >= R.periodTop) break;
      const g = got[j.nation] || 0;
      if (g >= perNation || base(j.nation) + g >= max) continue;
      got[j.nation] = g + 1;
      list.push({ id: j.id, nat: j.nation, pts: Math.round(x) });
    }
    return list;
  }
  // MŚJ: medal indywidualny = +1 miejsce w PŚ dla kraju (do kolejnych MŚJ)
  function wjcQuotaBonus(nat, id) {
    const s = st();
    if (!s.wjcQuota || s.wjcQuota.season !== s.season) s.wjcQuota = { season: s.season, nats: [], ids: {} };
    // medalista (także po ukończeniu 20 lat) może zająć miejsce premiowe – obok innych juniorów
    if (id) { s.wjcQuota.ids = s.wjcQuota.ids || {}; const l = (s.wjcQuota.ids[nat] = s.wjcQuota.ids[nat] || []); if (!l.includes(id)) l.push(id); }
    if (s.wjcQuota.nats.includes(nat)) return;
    s.wjcQuota.nats.push(nat);
    const q = s.nations[nat].quota;
    if (q && !q.wjcB) { q.wjcB = 1; q.WC = Math.min(QUOTA_RULES.maxWC, q.WC + 1); }
  }
  // ---------- Kwalifikacja olimpijska (system MKOl/FIS z Mediolanu-Cortiny 2026, mężczyźni) ----------
  // Okres: od 1 lipca dwa lata przed igrzyskami do ok. 3 tygodni przed nimi (2026: 1.07.2024 – 18.01.2026).
  // Olimpijska lista kwotowa (OQAL): punkty PŚ + LGP zdobyte w okresie; lista PK (punkty PK + LPK) tylko gdy OQAL się wyczerpie.
  // 46 miejsc (z gospodarzem – 1 miejsce, jeśli się nie zakwalifikował) po 1 na zawodnika od góry listy; maks. 3 na kraj,
  // 4. tylko gdy 4. zawodnik kraju jest w top 25 OQAL. Potem 4 miejsca dodatkowe (razem 50): najpierw kraje bez zawodnika,
  // potem kraje z jednym (do konkursu drużynowego). Prawo startu: min. 1 punkt PŚ/LGP albo PK/LPK w okresie.
  const OLY = { quota: 46, extra: 4, perNoc: 3, fourthTop: 25, max: 4, cutoffDays: 19 };
  const olyStart = (Y) => `${Y - 2}-07-01`;
  // igrzyska, do których liczy się data (null – poza okresem kwalifikacyjnym albo kwoty już przyznane)
  function olyYearOf(iso) {
    const yr = +iso.slice(0, 4);
    let Y = yr + ((2 - (yr % 4)) + 4) % 4;
    const q = st().olyQuota;
    if (q && q.year === Y) Y += 4;
    return iso.slice(0, 10) >= olyStart(Y) ? Y : null;
  }
  // termin zamknięcia listy: 19 dni przed tygodniem igrzysk (znany, gdy w kalendarzu jest sezon olimpijski)
  function olyCutoff(Y) {
    const c = st().calendar;
    if (!c || c.season + 1 !== Y) return null;
    const w = c.weeks.find((x) => x.events.some((e) => e.level === 'OWG'));
    if (!w) return null;
    const d = new Date(w.date); d.setDate(d.getDate() - OLY.cutoffDays);
    return d.toISOString().slice(0, 10);
  }
  function addOlyPts(j, level, pts) {
    const cup = { WC: 'wc', SGP: 'wc', COC: 'coc', SCOC: 'coc' }[level];
    const w = currentWeek();
    if (!cup || !w) return;
    const Y = olyYearOf(w.date), cut = Y && olyCutoff(Y);
    if (!Y || (cut && w.date.slice(0, 10) >= cut)) return;
    if (!j.oly || j.oly.y !== Y) j.oly = { y: Y, wc: 0, coc: 0 };
    j.oly[cup] += pts;
  }
  // przydział kwot olimpijskich z bieżących punktów okresu (także prognoza w trakcie okresu)
  function olympicAllocation(Y) {
    const s = st();
    const pts = (j, c) => (j.oly && j.oly.y === Y ? j.oly[c] : 0);
    const all = Object.values(s.jumpers);
    const oqal = all.filter((j) => pts(j, 'wc') > 0).sort((a, b) => pts(b, 'wc') - pts(a, 'wc'));
    const cocList = all.filter((j) => !(pts(j, 'wc') > 0) && pts(j, 'coc') > 0).sort((a, b) => pts(b, 'coc') - pts(a, 'coc'));
    const rank = new Map(oqal.map((j, i) => [j.id, i + 1]));
    const list = oqal.concat(cocList);
    const h = SJM.CAL.hosts().OWG[Y], host = h && s.nations[h.nat] ? h.nat : null;
    const got = {};
    let n = 0;
    for (const j of list) {
      if (n >= OLY.quota - (host && !got[host] ? 1 : 0)) break;
      const c = got[j.nation] || 0;
      if (c >= OLY.max || (c >= OLY.perNoc && !(rank.get(j.id) <= OLY.fourthTop))) continue;
      got[j.nation] = c + 1; n++;
    }
    const hostSpot = !!host && !got[host];
    if (hostSpot) { got[host] = 1; n++; }
    // miejsca dodatkowe: następny zawodnik z listy kraju bez kwoty, potem kraju z jednym miejscem
    const extra = [];
    for (const need of [0, 1]) {
      for (const j of list) {
        if (extra.length >= OLY.extra) break;
        if ((got[j.nation] || 0) !== need || extra.includes(j.nation)) continue;
        got[j.nation] = need + 1; extra.push(j.nation);
      }
    }
    return { year: Y, nats: got, extra, host: hostSpot ? host : null, oqal: oqal.length, coc: cocList.length };
  }
  // zamknięcie listy: kwoty olimpijskie na igrzyska Y
  function checkOlympicQuota() {
    const s = st(), w = currentWeek();
    if (!w) return;
    const Y = olyYearOf(w.date), cut = Y && olyCutoff(Y);
    if (!cut || w.date.slice(0, 10) < cut) return;
    s.olyQuota = olympicAllocation(Y);
    const q = s.olyQuota, mine = q.nats[s.nation] || 0;
    const why = q.host === s.nation ? ' (miejsce gospodarza)' : q.extra.includes(s.nation) ? ' (w tym miejsce dodatkowe)' : '';
    news(`Kwoty olimpijskie ${Y}`, `FIS zamknęła olimpijską listę kwotową (punkty PŚ i LGP od ${fmtIso(olyStart(Y))}).<br>
      ${mine ? `Mamy <b>${mine}</b> ${mine === 1 ? 'miejsce' : 'miejsca'} na igrzyskach${why}.` : '<span class="neg">Nie zdobyliśmy miejsca na igrzyskach.</span>'}
      ${mine === 1 ? '<br><span class="muted">Z jednym zawodnikiem nie wystartujemy w superteamie (duety).</span>' : ''}`, 'info');
  }
  const fmtIso = (iso) => iso.slice(8, 10) + '.' + iso.slice(5, 7) + '.' + iso.slice(0, 4);
  function olyEligible(j, Y) { return !!(j.oly && j.oly.y === Y && (j.oly.wc > 0 || j.oly.coc > 0)); }
  // igrzyska w bieżącym sezonie (rok zakończenia sezonu) – do kwoty i prawa startu
  const owgYear = () => st().calendar.season + 1;

  // 1. sezon gry: premia z prawdziwych MŚJ 2026 (Lillehammer) – kraje medalistów konkursu indywidualnego
  const WJC_2026_NATS = ['AUT', 'POL', 'USA'];
  function seedWjcQuota() {
    const s = st();
    s.wjcQuota = { season: s.season - 1, nats: WJC_2026_NATS.filter((c) => s.nations[c]) };
  }
  // świat fikcyjny: wirtualny poprzedni sezon (punkty wg ocen z losowością), żeby rankingi kroczące miały historię
  function seedVirtualSeason() {
    const s = st();
    const order = Object.values(s.jumpers).sort((a, b) => W.overall(b) - W.overall(a));
    // [ranking, okres, liczba konkursów, zakres pozycji w stawce wg oceny]
    const plan = [['WC', 0, 8, 0, 60], ['COC', 0, 6, 40, 140], ['FIS', 0, 8, 90, 260]];
    for (let p = 1; p <= 3; p++) plan.push(['WC', p, 9, 0, 65], ['COC', p, 6, 40, 140], ['FIS', p, 4, 90, 260]);
    for (const j of order) j.ppPrev = blankPP();
    for (const [cup, p, n, from, to] of plan) {
      const field = order.slice(from, to);
      for (let e = 0; e < n; e++) {
        field.map((j) => [j, W.overall(j) + U.gauss(0, 2.5)]).sort((a, b) => b[1] - a[1]).slice(0, 30)
          .forEach(([j], i) => (j.ppPrev[cup][p] += SJM.WC_POINTS[i]));
      }
    }
    for (const j of order) {
      const q = j.ppPrev;
      j.prevPts = { WC: q.WC[1] + q.WC[2] + q.WC[3], SGP: q.WC[0], COC: q.COC[1] + q.COC[2] + q.COC[3], SCOC: q.COC[0], FIS: U.sum(q.FIS, (x) => x) };
    }
  }
  // okres punktowy prawdziwego konkursu wg daty (lato: maj–październik; 1: do świąt; 2: TCS – styczeń; 3: luty – koniec)
  function periodOfDate(iso) {
    const m = +iso.slice(5, 7), d = +iso.slice(8, 10);
    if (m >= 5 && m <= 10) return 0;
    if (m === 11 || (m === 12 && d < 27)) return 1;
    if (m === 12 || m === 1) return 2;
    return 3;
  }
  // start gry: punkty z sezonu 2025/26 (prawdziwa baza) albo uprawnienia według poziomu (świat fikcyjny)
  function initStartingPoints(useReal) {
    const s = st();
    const CUP = { WC: 'WC', COC: 'COC', FC: 'FIS', GP: 'SGP' };
    // letni PK: konkursy PK rozgrywane od czerwca do października
    const cupOf = (race) => (race[1] === 'COC' && +race[0].slice(5, 7) >= 6 && +race[0].slice(5, 7) <= 10 ? 'SCOC' : CUP[race[1]]);
    for (const j of Object.values(s.jumpers)) {
      j.prevPts = { WC: 0, COC: 0, FIS: 0, SGP: 0, SCOC: 0 };
      j.ppPrev = blankPP(); j.pp = blankPP();
      if (useReal && j.fis && SJM.REAL_JUMPERS) {
        const rec = SJM.REAL_JUMPERS.find((r) => r.fis === j.fis && r.n === j.nation);
        if (rec) for (const [ri, rank] of rec.res) {
          const race = SJM.REAL_RACES[ri], cup = cupOf(race);
          if (cup && rank >= 1 && rank <= 30) {
            j.prevPts[cup] += SJM.WC_POINTS[rank - 1];
            j.ppPrev[PCUP[cup]][cup === 'SGP' || cup === 'SCOC' ? 0 : periodOfDate(race[0])] += SJM.WC_POINTS[rank - 1];
          }
        }
      } else if (!useReal) {
        const ov = W.overall(j);
        j.lic = { WC: ov >= 80, COC: ov >= 62, FIS: true };
      }
    }
    // w grze Rosja nie jest zawieszona: jej zawodnicy dostają punkty 2025/26 „statystycznego bliźniaka”
    // (zawodnika z bazy FIS o najbliższej ocenie), jakby normalnie startowali w zawodach FIS
    if (useReal && SJM.REAL_JUMPERS) {
      const withRes = Object.values(s.jumpers).filter((j) => j.nation !== 'RUS' && Object.values(j.prevPts).some((v) => v > 0));
      for (const j of Object.values(s.jumpers)) {
        if (j.nation !== 'RUS' || !j.real) continue;
        let twin = null, bd = 1e9;
        for (const t of withRes) { const d = Math.abs(W.overall(t) - W.overall(j)); if (d < bd) { bd = d; twin = t; } }
        if (twin) { j.prevPts = { ...twin.prevPts }; j.ppPrev = JSON.parse(JSON.stringify(twin.ppPrev)); }
      }
    }
    if (!useReal) seedVirtualSeason();
    else seedRealTitles();
    seedWjcQuota();
    computePeriodQuotas(0);
  }

  // okres 0 = lato (kwoty z poprzedniego sezonu)
  function currentPeriod() { const w = currentWeek(); return w && w.period !== undefined ? w.period : 1; }
  // zmiana okresu: przeliczenie kwot na podstawie bieżących klasyfikacji
  function checkPeriodChange() {
    const s = st();
    const w = currentWeek(), prev = s.calendar.weeks[s.week - 1];
    if (!w || !prev || w.period === prev.period) return;
    if (prev.summer) summerEnd(); // koniec lata: wyniki LGP, LPK i letniego FIS Cup zastępują lato poprzedniego roku
    computePeriodQuotas(w.period);
    const q = s.nations[s.nation].quota;
    const chg = (v, p) => { const d = p !== undefined ? v - p : 0; return d ? `(<span class="${d > 0 ? 'pos' : 'neg'}">${d > 0 ? '+' : ''}${d}</span>)` : '(bez zmian)'; };
    news(`Okres ${w.period}: nowe kwoty startowe`, `FIS przeliczyła kwoty na podstawie rankingów z ostatnich 12 miesięcy (wyniki tego sezonu zastępują te same okresy poprzedniego).<br>
      Puchar Świata: <b>${q.WC}</b> ${chg(q.WC, q.prevWC)} – ${quotaWhy(q)}.<br>
      Puchar Kontynentalny: <b>${q.COC}</b> ${chg(q.COC, q.prevCOC)}${q.fisB ? ` – w tym +${q.fisB} za top 3 okresu FIS Cup` : ''} · FIS Cup: <b>${q.FIS}</b> ${chg(q.FIS, q.prevFIS)}.`, 'info');
  }
  // skąd wzięła się kwota PŚ (tekst do wiadomości i zgłoszeń)
  function quotaWhy(q) {
    const parts = [`w top ${QUOTA_RULES.wrlTop} rankingu światowego: ${q.wrl || 0}`];
    if (q.add) parts.push(`dodatkowe: +${q.add}`);
    if (q.basic && q.basic > (q.wrl || 0) + (q.add || 0)) parts.push(q.hadPts ? `kwota podstawowa ${q.basic} (punkty PŚ)` : `minimum ${q.basic} (każdy kraj może zgłosić zawodników z prawem startu)`);
    if (q.cocB) parts.push('+1 za top 3 okresu PK');
    if (q.wjcB) parts.push('+1 za medal MŚJ');
    return parts.join(', ');
  }

  // podsumowanie letnich cykli (FIS Cup trwa dalej – klasyfikacja łączna)
  function summerEnd() {
    const s = st();
    const lines = [];
    const winner = (key, name) => {
      const top = topList(s.standings[key] || {}, 3);
      if (!top.length) return;
      lines.push(`<b>${name}</b>: ${top.map(([id, pts], i) => { const j = s.jumpers[id]; return `${i + 1}. ${j ? W.flag(j.nation) + ' ' + W.fullName(j) : '?'} (${pts})`; }).join(', ')}`);
      const mine = Object.entries(s.standings[key]).filter(([id]) => s.jumpers[id] && s.jumpers[id].nation === s.nation).sort((a, b) => b[1] - a[1])[0];
      if (mine) lines.push(`<span class="muted">nasz najlepszy: ${W.fullName(s.jumpers[mine[0]])} – ${rankOf(s.standings[key], mine[0])}. miejsce</span>`);
    };
    winner('sgp', 'Letnie Grand Prix');
    winner('scoc', 'Letni Puchar Kontynentalny');
    const fis = topList(s.standings.fis, 1)[0];
    if (fis && s.jumpers[fis[0]]) lines.push(`FIS Cup (klasyfikacja łączna, trwa dalej): prowadzi ${W.flag(s.jumpers[fis[0]].nation)} ${W.fullName(s.jumpers[fis[0]])} (${fis[1]})`);
    if (lines.length) news('Koniec lata', lines.join('<br>') + '<br><br>Wyniki lata zastępują w rankingach FIS lato poprzedniego roku – kwoty na 1. okres zimy zostały przeliczone.', 'results');
  }

  // tytuły: s.titles[impreza][konkurs] = { id, season }; konkurs: nh/lh (skocznia normalna/duża), fh (MŚ w lotach)
  function titleKey(ev) { return ev.level === 'SFWC' ? 'fh' : W.getHill(ev.hill).K < 110 ? 'nh' : 'lh'; }
  const heldTitles = (level) => { const s = st(), t = (s.titles || {})[level] || {}; return Object.values(t).filter((x) => x && x.season < s.season && s.jumpers[x.id]); };
  // obrońcy tytułów z kraju (osobiste miejsce ponad kwotę 4 – tylko w konkursie, w którym bronią tytułu)
  function titleHolders(level, nat) {
    return [...new Set(heldTitles(level).map((x) => x.id))].filter((id) => st().jumpers[id].nation === nat);
  }
  // obrońca tytułu w danym konkursie (mistrz poprzedniej edycji)
  function defenderOf(ev) {
    const s = st(), t = ((s.titles || {})[ev.level] || {})[titleKey(ev)];
    return t && t.season < s.season && s.jumpers[t.id] ? t.id : null;
  }
  // grupa krajowa (PŚ, LGP): w sezonie tylko w 2 konkursach indywidualnych na skoczniach gospodarza.
  // Albo cały weekend (2 konkursy), albo pierwszy konkurs jednego weekendu i pierwszy konkurs innego weekendu u siebie
  // (np. weekend z drużynówką i jednym konkursem indywidualnym zużywa 1). Gracz wybiera w Zgłoszeniach, w których weekendach
  // ją wykorzystać (s.ngPick: { season, WC: { indeks tygodnia: 0–2 }, SGP: {...} }); bez wyboru i u AI – w kolejności kalendarza.
  const NG_LIMIT = 2;
  const homeInd = (w, level, nat) => w.events.filter((e) => e.level === level && e.format === 'ind' && hostNationOf(e.hill) === nat);
  function ngPicks(level, nat) {
    const s = st();
    return nat === s.nation && s.ngPick && s.ngPick.season === s.season ? s.ngPick[level] || {} : {};
  }
  // przydział w kolejnych tygodniach: { wi: liczba konkursów z grupą krajową }
  function ngAlloc(level, nat) {
    const pick = ngPicks(level, nat), out = {};
    let left = NG_LIMIT;
    ((st().calendar && st().calendar.weeks) || []).forEach((w, wi) => {
      const n = homeInd(w, level, nat).length;
      if (!n || left <= 0) return;
      // w innym weekendzie niż pierwszy wykorzystany – tylko pierwszy konkurs (pozostała 1)
      const k = Math.min(left, n, wi in pick ? pick[wi] : Infinity);
      if (k > 0) { out[wi] = k; left -= k; }
    });
    return out;
  }
  function nationalGroupEvents(level, nat) {
    const out = new Set(), weeks = (st().calendar && st().calendar.weeks) || [];
    for (const [wi, k] of Object.entries(ngAlloc(level, nat))) homeInd(weeks[wi], level, nat).slice(0, k).forEach((e) => out.add(e.id));
    return out;
  }
  // wybór gracza dla bieżącego tygodnia: ile konkursów można objąć grupą krajową (max) i ile jest teraz (cur)
  function nationalGroupChoice(level) {
    const s = st(), w = currentWeek(), n = w ? homeInd(w, level, s.nation).length : 0;
    if (!n || (level !== 'WC' && level !== 'SGP')) return null;
    const pick = ngPicks(level, s.nation), alloc = ngAlloc(level, s.nation);
    let used = 0;
    for (const [wi, k] of Object.entries(alloc)) if (+wi < s.week) used += k;
    const max = Math.min(n, NG_LIMIT - used);
    return { n, max, cur: alloc[s.week] || 0, chosen: s.week in pick, used };
  }
  function setNationalGroup(level, k) {
    const s = st(), c = nationalGroupChoice(level);
    if (!c || ensureNominations().confirmed) return false;
    if (!s.ngPick || s.ngPick.season !== s.season) s.ngPick = { season: s.season };
    (s.ngPick[level] = s.ngPick[level] || {})[s.week] = U.clamp(Math.round(k), 0, c.max);
    return true;
  }
  function hasNationalGroup(ev, nat) {
    return (ev.level === 'WC' || ev.level === 'SGP') && ev.format === 'ind' && nationalGroupEvents(ev.level, nat).has(ev.id);
  }
  // dodatek gospodarza w weekendzie (PŚ/LGP: tylko gdy w którymś konkursie weekendu przysługuje grupa krajowa)
  function hostBonusIn(level, nat, week) {
    if (level === 'WC' || level === 'SGP') { const ng = nationalGroupEvents(level, nat); return week.events.some((e) => ng.has(e.id)); }
    return week.events.some((e) => e.level === level && hostNationOf(e.hill) === nat);
  }
  // skład kraju w konkursie indywidualnym MŚ / MŚ w lotach: 4 + obrońca tytułu tego konkursu
  // (PŚ/LGP u siebie: w konkursie bez grupy krajowej – tylko zwykła kwota, najlepsi ze zgłoszonych)
  function startersFor(ev, ids, nat, week) {
    if (nat && week && ev.format === 'ind' && (ev.level === 'WC' || ev.level === 'SGP') && hostBonusIn(ev.level, nat, week) && !hasNationalGroup(ev, nat)) {
      const base = st().nations[nat].quota.WC;
      if (ids.length > base) {
        const cup = CUP_KEY[ev.level];
        const sc = (id) => { const j = st().jumpers[id]; return (st().standings[cup][id] || 0) * 10 + (j ? W.overall(j) + j.form * 0.5 : 0); };
        const keep = new Set(ids.slice().sort((a, b) => sc(b) - sc(a)).slice(0, base));
        ids = ids.filter((id) => keep.has(id));
      }
    }
    if (ev.format !== 'ind' || !['WCH', 'SFWC'].includes(ev.level)) return ids;
    const d = defenderOf(ev), others = ids.filter((id) => id !== d).slice(0, 4);
    return d && ids.includes(d) ? [d, ...others] : others;
  }
  // Raw Air / Turniej Nordycki: do klasyfikacji liczą się też kwalifikacje i skoki w konkursach drużynowych w weekendach
  // turnieju (bez licznika etapów – w końcowej klasyfikacji nadal tylko ci, którzy skoczyli we wszystkich konkursach indywidualnych)
  const NORDIC_TOURS = ['RAW', 'NORD'];
  function addTourJumps(jumps) {
    const raw = st().standings.raw;
    for (const r of jumps) if (r && r.id && !r.x) raw[r.id] = Math.round(((raw[r.id] || 0) + r.p) * 10) / 10;
  }
  // ostatni konkurs finału PŚ w Planicy: startuje TOP30 klasyfikacji generalnej spośród zgłoszonych na weekend
  // (bez kwalifikacji; remis na 30. miejscu – startują wszyscy ex aequo)
  const FINALE_TOP = 30;
  function isWcFinale(ev, week) {
    if (ev.level !== 'WC' || ev.format !== 'ind' || ev.hill !== 'planica_f') return false;
    const last = week.events.filter((e) => e.level === 'WC' && e.format === 'ind' && e.hill === 'planica_f').pop();
    return last === ev;
  }
  function finaleField(entrants) {
    const pts = (j) => st().standings.wc[j.id] || 0;
    const sorted = entrants.slice().sort((a, b) => pts(b) - pts(a));
    const cutPts = sorted.length > FINALE_TOP ? pts(sorted[FINALE_TOP - 1]) : -1;
    const field = sorted.filter((j, i) => i < FINALE_TOP || (cutPts > 0 && pts(j) === cutPts));
    return { field, cut: sorted.filter((j) => !field.includes(j)).map((j) => j.id) };
  }
  // start gry z prawdziwą bazą: mistrzowie MŚ 2025 (Trondheim) i MŚ w lotach 2026 (Oberstdorf)
  const REAL_TITLES = { WCH: { nh: ['6734', 2024], lh: ['7091', 2024] }, SFWC: { fh: ['7091', 2025] } };
  function seedRealTitles() {
    const s = st();
    s.titles = s.titles || {};
    for (const [lv, evs] of Object.entries(REAL_TITLES)) {
      for (const [key, [fis, season]] of Object.entries(evs)) {
        const j = Object.values(s.jumpers).find((x) => x.fis === fis);
        if (j) (s.titles[lv] = s.titles[lv] || {})[key] = { id: j.id, season };
      }
    }
  }

  function quotaFor(level, nat, week) {
    const s = st();
    const q = s.nations[nat].quota;
    const hostBonus = hostBonusIn(level, nat, week);
    // konkurs drużynowy w programie weekendu: kraj z kwotą poniżej 4 może zgłosić 4 zawodników (art. 4.2.4)
    const teamMin = week.events.some((e) => e.level === level && e.format === 'team') ? TEAM_MIN : 0;
    switch (level) {
      case 'WC': return Math.max(teamMin, q.WC + (hostBonus ? HOST_BONUS.WC : 0));
      case 'SGP': return Math.max(teamMin, q.WC + (hostBonus ? HOST_BONUS.SGP : 0));
      case 'COC': return q.COC + (hostBonus ? HOST_BONUS.COC : 0);
      case 'SCOC': return q.COC + (hostBonus ? HOST_BONUS.SCOC : 0);
      case 'FIS': return QUOTA_RULES.fisQuota;
      case 'OWG': { const o = s.olyQuota; return o && o.year === owgYear() ? o.nats[nat] || 0 : 0; }
      case 'WCH': case 'SFWC': return 4 + titleHolders(level, nat).length;
      case 'WJC': return 4;
      case 'NAT': return nat === s.nation ? 99 : 0;
    }
    return 0;
  }

  // miejsce za medal MŚJ: tylko dla medalisty albo innego juniora (U-20). Zwraca limit „zwykłych” zawodników
  // i test, kto może zająć miejsce MŚJ; null – brak ograniczenia (brak premii, inny cykl, albo i tak wolno zgłosić 4 do drużynówki)
  function wjcReserve(level, nat, week) {
    if (level !== 'WC' && level !== 'SGP') return null;
    const s = st(), q = s.nations[nat].quota;
    if (!q || !q.wjcB) return null;
    const total = quotaFor(level, nat, week);
    const host = hostBonusIn(level, nat, week) ? HOST_BONUS[level] : 0;
    const teamMin = week.events.some((e) => e.level === level && e.format === 'team') ? TEAM_MIN : 0;
    const others = Math.max(teamMin, q.WC - q.wjcB + host);
    if (others >= total) return null;
    const medal = (s.wjcQuota && s.wjcQuota.ids && s.wjcQuota.ids[nat]) || [];
    return { others, total, ok: (j) => isJunior(j) || medal.includes(j.id), medal };
  }
  // wybór z uporządkowanej listy z poszanowaniem miejsca MŚJ
  function fitWjc(level, nat, week, ids, q) {
    const r = wjcReserve(level, nat, week), s = st();
    if (!r) return ids.slice(0, q);
    const out = []; let others = 0;
    for (const id of ids) {
      if (out.length >= q) break;
      const j = s.jumpers[id];
      if (j && r.ok(j)) out.push(id);
      else if (others < r.others) { out.push(id); others++; }
    }
    return out;
  }

  // ---------- Uprawnienia do startu (punkty z bieżącego lub poprzedniego sezonu) ----------
  function hasPoints(j, cup) { return pointsOf(j, cup, 'prev') > 0 || pointsOf(j, cup, 'cur') > 0 || !!(j.lic && j.lic[cup]); }
  // punkty letnie liczą się jak zimowe: LGP jak PŚ, LPK jak PK
  // dożywotnie uprawnienia: punkty PŚ/LGP kiedykolwiek → PŚ/LGP, punkty PK/LPK kiedykolwiek → PK/LPK
  function lifeLic(j, cup) {
    if (j.life && j.life[cup]) return true;
    return cup === 'WC' ? pointsOf(j, 'WC', 'cur') > 0 || pointsOf(j, 'SGP', 'cur') > 0 : pointsOf(j, 'COC', 'cur') > 0 || pointsOf(j, 'SCOC', 'cur') > 0;
  }
  function updateLife(j) {
    const p = j.prevPts || {}, l = j.lic || {};
    j.life = { WC: !!((j.life && j.life.WC) || p.WC > 0 || p.SGP > 0 || l.WC), COC: !!((j.life && j.life.COC) || p.COC > 0 || p.SCOC > 0 || l.COC) };
  }
  function licenseFor(j, level) {
    const top = hasPoints(j, 'WC') || hasPoints(j, 'SGP') || hasPoints(j, 'COC') || hasPoints(j, 'SCOC') || lifeLic(j, 'WC');
    switch (level) {
      case 'WC': case 'SGP': case 'WCH': case 'OWG': case 'SFWC': return top;
      case 'COC': case 'SCOC': return top || hasPoints(j, 'FIS') || lifeLic(j, 'COC');
      default: return true;
    }
  }
  function ineligibleReason(j, level) {
    if (j.injury > 0) return 'kontuzja';
    if (j.suspended > 0) return 'zawieszenie';
    if (level === 'WJC' && !isJunior(j)) return 'tylko U-20';
    if (level === 'OWG' && !olyEligible(j, owgYear())) return 'brak punktów PŚ/LGP/PK w okresie kwalifikacji olimpijskiej';
    if (!licenseFor(j, level)) return ['WC', 'SGP', 'WCH', 'OWG', 'SFWC'].includes(level) ? 'brak punktów PŚ/PK' : 'brak punktów FIS';
    return null;
  }

  function weekLevels(week) {
    const set = new Set(week.events.map((e) => e.level));
    return LEVEL_ORDER.filter((l) => set.has(l));
  }

  function eligible(j, level) {
    if (!available(j)) return false;
    if (level === 'WJC') return isJunior(j);
    if (level === 'OWG') return olyEligible(j, owgYear());
    return licenseFor(j, level);
  }

  function sortKey(j) { return W.overall(j) + j.form * 0.5 - Math.max(0, j.fatigue - 50) * 0.1; }

  // ---------- Grupy kadrowe ----------
  function autoGroups() {
    const list = myJumpers().sort((a, b) => W.overall(b) - W.overall(a));
    const counts = { A: 0, B: 0, J: 0 };
    for (const j of list) {
      if (counts.A < GROUP_LIMITS.A && W.overall(j) > 0) { j.group = 'A'; counts.A++; continue; }
      if (isJunior(j) && counts.J < GROUP_LIMITS.J) { j.group = 'J'; counts.J++; continue; }
      if (counts.B < GROUP_LIMITS.B) { j.group = 'B'; counts.B++; continue; }
      j.group = 'R';
    }
  }

  function aiGroups() {
    const s = st();
    for (const n of SJM.NATIONS) {
      if (n.code === s.nation) continue;
      const list = jumpersOf(n.code).sort((a, b) => W.overall(b) - W.overall(a));
      let a = 0, b = 0, jj = 0;
      for (const j of list) {
        if (a < 7) { j.group = 'A'; a++; }
        else if (isJunior(j) && jj < 8) { j.group = 'J'; jj++; }
        else if (b < 8) { j.group = 'B'; b++; }
        else j.group = 'R';
      }
    }
  }

  function groupCount(g) { return myJumpers().filter((j) => j.group === g).length; }
  // ---------- Szkic zmian w kadrach: można chwilowo przekroczyć limity, zatwierdza się wszystko naraz ----------
  function groupDraft() {
    const p = st().player;
    p.groupDraft = p.groupDraft || {};
    for (const id of Object.keys(p.groupDraft)) { const j = st().jumpers[id]; if (!j || j.nation !== st().nation || (j.group || 'R') === p.groupDraft[id]) delete p.groupDraft[id]; }
    return p.groupDraft;
  }
  function draftGroupOf(j) { const d = st().player.groupDraft; return (d && d[j.id]) || j.group || 'R'; }
  function draftCount(g) { return myJumpers().filter((j) => draftGroupOf(j) === g).length; }
  function draftGroup(id, g) {
    const j = st().jumpers[id];
    if (!j) return 'Brak zawodnika';
    if (g === 'J' && !isJunior(j)) return 'Do kadry juniorów mogą należeć tylko zawodnicy U-20.';
    const d = groupDraft();
    if ((j.group || 'R') === g) delete d[id]; else d[id] = g;
    return null;
  }
  // kadry przekraczające limit po zmianach ze szkicu
  function draftOverLimit() {
    return Object.entries(GROUP_LIMITS).map(([g, max]) => ({ g, n: draftCount(g), max })).filter((x) => x.n > x.max);
  }
  function confirmGroups() {
    const d = groupDraft();
    if (!Object.keys(d).length) return 'Brak zmian do zatwierdzenia.';
    const over = draftOverLimit();
    if (over.length) return `Federacja odrzuciła zgłoszenie kadr: ${over.map((x) => `kadra ${x.g} ma ${x.n} zawodników (limit ${x.max})`).join(', ')}. Przesuń nadmiarowych zawodników i spróbuj ponownie.`;
    for (const [id, g] of Object.entries(d)) st().jumpers[id].group = g;
    st().player.groupDraft = {};
    ensureNominations();
    return null;
  }
  function discardGroups() { st().player.groupDraft = {}; }
  function setGroup(id, g) {
    const j = st().jumpers[id];
    if (!j) return 'Brak zawodnika';
    if (g !== 'R' && GROUP_LIMITS[g] && groupCount(g) >= GROUP_LIMITS[g] && j.group !== g) return `Kadra ${g} jest pełna (limit ${GROUP_LIMITS[g]}).`;
    if (g === 'J' && !isJunior(j)) return 'Do kadry juniorów mogą należeć tylko zawodnicy U-20.';
    j.group = g;
    return null;
  }

  // ---------- Nominacje ----------
  // kalibracja na sezonie 2025/26 (baza FIS): śr. liczba zawodników kraju w konkursie FIS Cup
  const AI_FIS_SQUAD = { POL: 8, SLO: 8, GER: 8, AUT: 7, KAZ: 6, CZE: 4, FRA: 4, SUI: 3, NOR: 2, FIN: 2, USA: 2, UKR: 2, JPN: 1, CAN: 1, ITA: 1, ROU: 1, KOR: 1, EST: 1, SVK: 1, SWE: 1, CHN: 1, TUR: 1, BUL: 1, GEO: 1, THA: 1, AZE: 1, RUS: 4, LAT: 1 };
  const AI_WC_MIN = 84; // minimalna ocena zawodnika AI wystawianego w PŚ/LGP
  const AI_WC_RANK = 90; // … albo ocena 75. zawodnika świata, jeśli niższa (poziom świata dryfuje – stawka PŚ nie może się kurczyć)
  let aiWcCache = null;
  function aiWcMin() {
    const s = st(), c = aiWcCache;
    if (c && c.s === s && c.turn === turn()) return c.v;
    const ov = Object.values(s.jumpers).filter((j) => !j.injury).map(W.overall).sort((a, b) => b - a);
    const v = Math.min(AI_WC_MIN, ov[AI_WC_RANK - 1] || AI_WC_MIN);
    aiWcCache = { s, turn: turn(), v };
    return v;
  }
  function pickForNation(nat, week, isPlayer) {
    const levels = weekLevels(week);
    const used = new Set();
    const out = {};
    let pool = jumpersOf(nat).filter(available);
    if (!isPlayer) {
      const cq = W.profile(nat).coachB || 50;
      pool = pool.filter((j) => { if ((j.form < -3.5 || j.fatigue > 72) && Math.random() < 0.1 + cq / 250) { j.homeTurn = turn(); return false; } return true; });
    }
    pool.sort((a, b) => sortKey(b) - sortKey(a));
    for (const lv of levels) {
      const q = quotaFor(lv, nat, week);
      if (!q) continue;
      let cand = pool.filter((j) => !used.has(j.id) && eligible(j, lv));
      if (isPlayer) {
        // gracz: preferencje wg kadr
        const pref = { WC: ['A', 'B'], SGP: ['A', 'B'], COC: ['B', 'A', 'J', 'R'], SCOC: ['B', 'A', 'J', 'R'], FIS: ['J', 'B', 'R'], WJC: ['J', 'B', 'R'], WCH: ['A', 'B'], OWG: ['A', 'B'], SFWC: ['A', 'B'], NAT: ['A', 'B', 'J', 'R'] }[lv];
        cand = cand.filter((j) => pref.includes(j.group || 'R'));
        if (lv === 'WJC') cand = cand.filter((j) => j.group !== 'A' || cand.length < 4);
        cand.sort((a, b) => pref.indexOf(a.group || 'R') - pref.indexOf(b.group || 'R') || sortKey(b) - sortKey(a));
      } else {
        // kraj AI wystawia w PŚ/LGP tylko zawodników z poziomem PŚ – słabsze federacje nie wypełniają kwoty na siłę
        if (lv === 'WC' || lv === 'SGP') cand = cand.filter((j) => W.overall(j) >= aiWcMin());
        // FIS Cup: najlepsi dostępni spoza kadry A; liczebność ekipy wg realnej frekwencji kraju
        if (lv === 'FIS') {
          // kadra A jedzie na FIS Cup tylko po punkty dające uprawnienia do PK (inaczej zawodnik bez punktów nie startowałby nigdzie)
          cand = cand.filter((j) => j.group !== 'A' || !licenseFor(j, 'COC'));
          const host = week.events.some((e) => e.level === 'FIS' && hostNationOf(e.hill) === nat);
          cand = cand.slice(0, (AI_FIS_SQUAD[nat] || (st().dormant && st().dormant[nat] ? 3 : 1)) + (host ? 4 : 0)); // u siebie gospodarz wystawia więcej (w ramach kwoty 10)
        }
        // Letni PK i letni FIS Cup jak zimą: kto nie jedzie na LGP w tym tygodniu, może skakać w LPK
        if (lv === 'WJC') cand = cand.filter((j) => j.group !== 'A' || W.overall(j) < 85);
      }
      const chosen = fitWjc(lv, nat, week, cand.map((j) => j.id), q).map((id) => st().jumpers[id]);
      chosen.forEach((j) => used.add(j.id));
      out[lv] = chosen.map((j) => j.id);
    }
    return out;
  }

  // ---------- Zgłoszenia składów ----------
  // Cykle, które można oddać trenerom kadr (PŚ i wielkie imprezy zawsze ustala gracz)
  const DELEGABLE = { SGP: 'coachA', COC: 'coachB', SCOC: 'coachB', FIS: 'coachJ', WJC: 'coachJ', NAT: 'coachA' };
  const DELEGATE_DEFAULT = { SGP: false, COC: true, SCOC: true, FIS: true, WJC: false, NAT: true };
  function delegation() {
    const p = st().player;
    if (!p.delegate) p.delegate = {};
    for (const [lv, on] of Object.entries(DELEGATE_DEFAULT)) if (p.delegate[lv] === undefined) p.delegate[lv] = on;
    return p.delegate;
  }
  function isDelegated(lv) { return !!DELEGABLE[lv] && !!delegation()[lv]; }
  function setDelegated(lv, on) { if (!DELEGABLE[lv]) return; delegation()[lv] = !!on; const n = ensureNominations(); if (on) n.byLevel[lv] = []; }
  // wynik z poprzedniego tygodnia z zawodami, np. „PŚ 3 · 12”, „PK kw.”, „trening w domu”, „brak startu”
  function lastWeekendNote(j) {
    const s = st();
    let w = s.week - 1;
    while (w >= 0 && !(s.calendar.weeks[w].events || []).some((e) => s.results[e.id])) w--;
    if (w < 0) return null;
    const parts = {};
    for (const ev of s.calendar.weeks[w].events) {
      const r = s.results[ev.id];
      if (!r || r.type !== 'ind') continue;
      const row = r.ranking.find((x) => x.id === j.id);
      let txt = null;
      if (row) txt = row.dsq || !row.rank ? 'DSQ' : String(row.rank);
      else if (r.qual && r.qual.jumps.some((q) => q.id === j.id)) txt = 'kw.';
      if (txt) (parts[ev.level] = parts[ev.level] || []).push(txt);
    }
    const lv = Object.keys(parts);
    if (lv.length) return { started: true, text: lv.map((l) => `${SJM.LEVELS[l].short} ${parts[l].join(' · ')}`).join(', ') };
    const t = s.season * TURNS_PER_SEASON + w;
    if (j.homeTrainTurn === t) return { started: false, text: j.homeByCoach ? 'trening w domu (decyzja trenera)' : 'trening w domu' };
    if (j.injury > 0) return { started: false, text: 'kontuzja' };
    return { started: false, text: 'brak startu' };
  }
  function jumperStatus(j) { return j.status === 'train' ? 'train' : 'avail'; }
  function setStatus(id, status) { const j = st().jumpers[id]; if (j) j.status = status === 'train' ? 'train' : 'avail'; }
  function deadline(week) { const d = new Date(week.date); d.setDate(d.getDate() - 4); return d; }

  // reset = nowy tydzień (puste zgłoszenia); bez resetu – tylko walidacja istniejących
  function ensureNominations(reset) {
    const s = st();
    const week = currentWeek();
    const levels = week ? weekLevels(week) : [];
    const cur = s.nominations;
    if (!reset && cur && cur.week === s.week && cur.season === s.season && cur.byLevel) {
      for (const lv of Object.keys(cur.byLevel)) if (!levels.includes(lv)) delete cur.byLevel[lv];
      for (const lv of levels) cur.byLevel[lv] = (cur.byLevel[lv] || []).filter((id) => { const j = s.jumpers[id]; return j && j.nation === s.nation && eligible(j, lv); });
      cur.teams = cur.teams || {};
      cur.coachLv = cur.coachLv || [];
      return cur;
    }
    const byLevel = {};
    levels.forEach((lv) => (byLevel[lv] = []));
    s.nominations = { week: s.week, season: s.season, byLevel, teams: {}, coachLv: [], confirmed: false };
    return s.nominations;
  }

  // trener kadry wybiera skład spośród dostępnych zawodników (im lepszy trener, tym trafniej)
  // w deficycie trenerzy delegowanych cykli wysyłają mniejsze ekipy (koszty wyjazdów)
  const COACH_SAVING = { COC: 5, SCOC: 4, FIS: 4 };
  function coachLimit(lv, q) { return st().player.budget < 0 && COACH_SAVING[lv] ? Math.min(q, COACH_SAVING[lv]) : q; }
  function coachPick(lv, week, used) {
    const s = st();
    const q = coachLimit(lv, quotaFor(lv, s.nation, week));
    const staff = s.player.staff[DELEGABLE[lv]];
    const cq = staff ? staff.quality : 25;
    const pref = { SGP: ['A', 'B', 'R', 'J'], COC: ['B', 'A', 'R', 'J'], SCOC: ['B', 'A', 'R', 'J'], FIS: ['J', 'R', 'B', 'A'], WJC: ['J', 'R', 'B', 'A'], NAT: ['A', 'B', 'J', 'R'] }[lv];
    // trener juniorów nie sięga po kadrę A do FIS Cup (latem i zimą tak samo)
    const allowed = { FIS: ["J", "R", "B"] }[lv];
    const cands = myJumpers().filter((j) => !used.has(j.id) && eligible(j, lv) && jumperStatus(j) !== "train" && (!allowed || allowed.includes(j.group || "R")));
    const score = (j) => {
      const g = pref.indexOf(j.group || 'R');
      return W.overall(j) + j.form * 0.5 - Math.max(0, j.fatigue - 60) * 0.1 + (g === 0 ? 3 : g === 1 ? 1 : 0)
        + (lv === 'FIS' ? (21 - W.age(j)) * 0.4 : 0) + U.gauss(0, (100 - cq) / 14);
    };
    return fitWjc(lv, s.nation, week, cands.map((j) => [j, score(j)]).sort((a, b) => b[1] - a[1]).map(([j]) => j.id), q);
  }

  function confirmNominations() {
    const s = st();
    const week = currentWeek();
    const n = ensureNominations();
    if (!week) return n;
    const used = new Set();
    for (const lv of weekLevels(week)) if (!isDelegated(lv)) (n.byLevel[lv] || []).forEach((id) => used.add(id));
    // trenerzy kadry B i juniorów odsyłają na trening w domu zawodników w dołku formy albo mocno zmęczonych
    // (kadra A to decyzja gracza; lepszy trener częściej trafnie to rozpoznaje)
    n.coachHome = [];
    for (const j of myJumpers()) {
      if (used.has(j.id) || !available(j) || jumperStatus(j) === 'train' || j.group === 'A') continue;
      const role = j.group === 'B' ? 'coachB' : 'coachJ';
      const coach = s.player.staff[role];
      if (!coach || !(j.form < -2.5 || j.fatigue > 65)) continue;
      if (Math.random() < coach.quality / 110) { j.homeTurn = turn(); n.coachHome.push(j.id); used.add(j.id); }
    }
    n.coachLv = [];
    for (const lv of weekLevels(week)) {
      if (!isDelegated(lv)) continue;
      n.byLevel[lv] = coachPick(lv, week, used);
      n.byLevel[lv].forEach((id) => used.add(id));
      n.coachLv.push(lv);
    }
    n.confirmed = true;
    return n;
  }
  function unconfirmNominations() {
    const n = ensureNominations();
    for (const lv of n.coachLv || []) n.byLevel[lv] = [];
    for (const id of n.coachHome || []) { const j = st().jumpers[id]; if (j && j.homeTurn === turn()) delete j.homeTurn; }
    n.coachHome = [];
    n.coachLv = [];
    n.confirmed = false;
  }
  // podpowiedź asystenta – wypełnia tylko cykle prowadzone przez gracza (na wyraźną prośbę)
  function assistantFill() {
    const s = st();
    const week = currentWeek();
    const n = ensureNominations();
    if (!week) return;
    const prop = pickForNation(s.nation, week, true);
    const taken = new Set(Object.values(n.byLevel).flat());
    for (const lv of weekLevels(week)) {
      if (isDelegated(lv)) continue;
      const q = quotaFor(lv, s.nation, week);
      const add = (prop[lv] || []).filter((id) => !taken.has(id) && jumperStatus(s.jumpers[id]) !== 'train');
      n.byLevel[lv] = fitWjc(lv, s.nation, week, (n.byLevel[lv] || []).concat(add), q);
      n.byLevel[lv].forEach((id) => taken.add(id));
    }
  }
  function needsNominations() {
    const s = st();
    const w = currentWeek();
    return !!(w && w.events.length && !(s.nominations && s.nominations.confirmed && s.nominations.week === s.week && s.nominations.season === s.season));
  }

  function nominationLevelOf(id) {
    const n = ensureNominations();
    for (const [lv, ids] of Object.entries(n.byLevel)) if (ids.includes(id)) return lv;
    return null;
  }

  function setNomination(id, level) {
    const s = st();
    const n = ensureNominations();
    const week = currentWeek();
    const j = s.jumpers[id];
    if (n.confirmed) return 'Składy są już zatwierdzone – kliknij „Zmień składy", aby je edytować.';
    if (level && isDelegated(level)) return 'Ten cykl prowadzi trener kadry – przełącz na „Wybieram sam", aby wybrać zawodników.';
    for (const lv of Object.keys(n.byLevel)) if (!isDelegated(lv)) n.byLevel[lv] = n.byLevel[lv].filter((x) => x !== id);
    if (!level) return null;
    if (!eligible(j, level)) return level === 'WJC' ? 'Zawodnik nie spełnia kryterium wieku (U-20) lub jest kontuzjowany.' : 'Zawodnik jest kontuzjowany.';
    n.byLevel[level] = n.byLevel[level] || [];
    const q = quotaFor(level, s.nation, week);
    if (n.byLevel[level].length >= q) return `Limit startowy (${q}) dla ${SJM.LEVELS[level].name} jest wyczerpany.`;
    const wr = wjcReserve(level, s.nation, week);
    if (wr && !wr.ok(j) && n.byLevel[level].filter((x) => s.jumpers[x] && !wr.ok(s.jumpers[x])).length >= wr.others)
      return `Ostatnie wolne miejsce to premia za medal MŚJ – może je zająć tylko medalista albo inny junior (U-20).`;
    n.byLevel[level].push(id);
    return null;
  }

  function teamFor(nat, level, nominated, event) {
    const s = st();
    const js = nominated.map((id) => s.jumpers[id]).filter(Boolean);
    const size = SJM.SIM.teamSize(event.format);
    if (js.length < size) return null;
    const hill = W.getHill(event.hill);
    if (nat === s.nation && s.nominations.teams && s.nominations.teams[event.id]) {
      const custom = s.nominations.teams[event.id].slice(0, size).map((id) => s.jumpers[id]).filter((j) => j && nominated.includes(j.id));
      if (custom.length === size && new Set(custom).size === size) return custom;
    }
    const best = js.sort((a, b) => (W.skill(b, hill.K) + b.form * 0.6) - (W.skill(a, hill.K) + a.form * 0.6)).slice(0, size);
    return teamOrder(best, nat + event.id);
  }
  // kolejność grup jak w prawdziwych drużynówkach: konkurs kończy lider kadry, przed nim drugi najlepszy,
  // a najsłabszy skacze zwykle w 2. grupie (część trenerów wystawia go w 1.); superteam: lider skacze drugi.
  // Wybór zależy od kraju i konkursu (stały hash), żeby podpowiedź w Zgłoszeniach nie zmieniała się przy odświeżaniu.
  function teamOrder(best, key) {
    if (best.length < 4) return best.slice().reverse();
    let h = 0;
    for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const [b1, b2, b3, b4] = best;
    return h % 10 < 7 ? [b3, b4, b2, b1] : [b4, b3, b2, b1];
  }

  // ---------- Rozegranie tygodnia ----------
  function playWeek() {
    const s = st();
    const week = currentWeek();
    if (!week || s.staffWindow) return;
    // wznowienie weekendu przerwanego decyzją o składzie drużyny (kontuzja w poprzednim konkursie)
    const run = s.weekRun && s.weekRun.week === s.week && s.weekRun.season === s.season ? s.weekRun : null;
    if (run && run.ask && !SJM.AUTOPILOT) return 'teamChange'; // decyzja o składzie wciąż czeka
    s.weekRun = null;
    const report = run ? run.report : [];
    if (week.events.length) {
      let noms, equip, start = 0;
      const decided = run ? run.decided : {};
      if (run) ({ noms, equip, next: start } = run);
      else {
      // niezatwierdzone składy: trenerzy uzupełniają swoje cykle (w trybie testowym asystent wypełnia też cykle gracza)
      if (needsNominations()) { if (SJM.AUTOPILOT) assistantFill(); confirmNominations(); }
      noms = {};
      for (const n of SJM.NATIONS) {
        noms[n.code] = n.code === s.nation ? sanitizePlayerNoms(week) : pickForNation(n.code, week, false);
      }
      equip = {};
      for (const n of SJM.NATIONS) equip[n.code] = W.equipBonus(n.code);

      // koszty wyjazdów gracza
      let travel = 0;
      for (const [lv, ids] of Object.entries(noms[s.nation])) travel += ids.length * SJM.LEVELS[lv].travel * costScale();
      if (travel) ledger('travel', -travel, 'Wyjazdy na zawody (' + week.label + ')');

      // silny wiatr w dniu zawodów: PK / FIS Cup odwołany (wiadomo dopiero na miejscu – ekipy już dojechały)
      const off = week.events.filter((e) => (e.level === 'COC' || e.level === 'FIS') && Math.random() < 0.02);
      if (off.length) {
        week.events = week.events.filter((e) => !off.includes(e));
        for (const e of off) {
          const t = SJM.CAL.eventTitle(e);
          report.push(`<b>${t}</b>: <span class="warn">konkurs odwołany z powodu silnego wiatru</span>`);
          if ((noms[s.nation][e.level] || []).length) news('Konkurs odwołany', `Ze względu na silny wiatr organizatorzy odwołali konkurs: ${t}. Zawodnicy wykorzystają czas na trening.`, 'results');
        }
      }
      }

      for (let k = start; k < week.events.length; k++) {
        const ev = week.events[k];
        const entrantsIds = [];
        // kontuzjowani we wcześniejszym konkursie tego weekendu już nie startują
        const fit = (id) => s.jumpers[id] && available(s.jumpers[id]);
        for (const n of SJM.NATIONS) startersFor(ev, (noms[n.code][ev.level] || []).filter(fit), n.code, week).forEach((id) => entrantsIds.push(id));
        let res;
        if (ev.format === 'ind') {
          let entrants = entrantsIds.map((id) => s.jumpers[id]).filter(Boolean), cut = null;
          if (isWcFinale(ev, week)) ({ field: entrants, cut } = finaleField(entrants));
          // kolejność startu jak w FIS: najpierw grupa krajowa (zawodnicy gospodarza bez punktów cyklu),
          // potem pozostali bez punktów w losowej kolejności, dalej odwrotnie do klasyfikacji generalnej
          const cup = CUP_KEY[ev.level];
          const host = hostNationOf(ev.hill);
          // loty w PŚ: odwrotnie do klasyfikacji PŚ w lotach (pierwszy konkurs lotów w sezonie – wg klasyfikacji PŚ)
          const fly = ev.level === 'WC' && W.getHill(ev.hill).K >= 170 && Object.keys(s.standings.flying).length ? s.standings.flying : null;
          const order = cup ? (j) => { const p = s.standings[cup][j.id] || 0; return (!p && j.nation === host ? -1000 : fly ? fly[j.id] || 0 : p) + Math.random() * 0.5; } : null;
          // TCS: system KO; remis w kwalifikacjach rozstrzyga klasyfikacja generalna PŚ
          // Puchar Kontynentalny (zima i lato – PK i LPK): bez kwalifikacji – w 1. serii startują wszyscy zgłoszeni
          res = SJM.SIM.individual(ev, entrants, { equip, qual: ['WC', 'SGP', 'WCH', 'OWG', 'SFWC'].includes(ev.level), order,
            ko: ev.tour === 'TCS', seed: (j) => s.standings.wc[j.id] || 0,
            // upadek → możliwa kontuzja od razu: kontuzjowany nie skacze w kolejnych seriach ani konkursach weekendu
            fallInjury: (j, r) => {
              if (Math.random() >= 0.3 * injMult(j)) return false;
              const overHS = r.d > W.getHill(ev.hill).HS;
              injure(j, (overHS ? 'upadek po skoku za HS w konkursie ' : 'upadek w konkursie ') + SJM.CAL.eventTitle(ev), overHS ? 'fallHS' : 'fall');
              return true;
            } });
          if (cut) res.cut = cut;
        } else {
          const teams = [];
          for (const n of SJM.NATIONS) {
            const members = teamFor(n.code, ev.level, (noms[n.code][ev.level] || []).filter((id) => s.jumpers[id] && available(s.jumpers[id])), ev);
            if (members) teams.push({ nation: n.code, members });
          }
          // kolejność startu drużyn: w LGP wg Pucharu Narodów LGP (przed pierwszymi punktami – wg PN zimowego)
          res = ev.level === 'SGP' ? SJM.SIM.team(ev, teams, { equip, nc: s.standings.snc, ncPrev: s.standings.nc })
            : SJM.SIM.team(ev, teams, { equip, nc: s.standings.nc, ncPrev: s.ncPrev });
        }
        s.results[ev.id] = res;
        applyResult(ev, res, report);
        // nasz zawodnik kontuzjowany, a był w składzie późniejszej drużynówki tego weekendu → pauza na zmianę składu
        if (!SJM.AUTOPILOT) {
          const ask = teamChangeNeeded(week, k, noms[s.nation], decided);
          if (ask) { s.weekRun = { week: s.week, season: s.season, next: k + 1, report, noms, equip, decided, ask }; return 'teamChange'; }
        }
      }
      // zmęczenie podróżą
      for (const ids of Object.values(noms).flatMap((o) => Object.values(o))) ids.forEach((id) => { const j = s.jumpers[id]; if (j) j.fatigue = U.clamp(j.fatigue + 3, 0, 100); });
    }

    // tydzień lata: rozwój jak w treningu letnim, ale forma i zmęczenie zmieniają się co tydzień
    // tura wielotygodniowa (przerwa jesienna): trening jak w przerwie po sezonie
    const span = week.span || 1;
    if (span > 1) weeklyUpdate(span, false); else weeklyUpdate(1, !week.summer, true);
    weeklyFinance(week, span);
    progressProjects(span);
    tickMods(span);
    if (report.length) news('Podsumowanie: ' + week.label, report.join('<br>'), 'results');
    s.week++;
    s.nominations = null;
    if (s.week >= s.calendar.weeks.length) {
      endSeason();
      return 'seasonEnd';
    }
    checkPeriodChange();
    checkOlympicQuota();
    ensureNominations(true);
    if (SJM.EV) SJM.EV.roll(currentWeek().summer ? "summer" : "season");
    return "ok";
  }

  // ---------- Zmiana składu drużyny po kontuzji (w trakcie weekendu) ----------
  function teamChangeNeeded(week, k, myNoms, decided) {
    const s = st();
    for (let m = k + 1; m < week.events.length; m++) {
      const ev = week.events[m];
      if (ev.format === 'ind') continue;
      const ids = myNoms[ev.level] || [];
      const team = teamFor(s.nation, ev.level, ids.slice(), ev) || [];
      // pytamy tylko o nowe kontuzje (o już rozpatrzone – nie)
      const hurt = team.filter((j) => !available(j) && !(decided[ev.id] || []).includes(j.id));
      if (hurt.length) return { eventId: ev.id, level: ev.level, injured: hurt.map((j) => j.id) };
    }
    return null;
  }
  function teamChangeInfo() {
    const s = st(), r = s.weekRun;
    if (!r || !r.ask) return null;
    const ev = currentWeek().events.find((e) => e.id === r.ask.eventId);
    if (!ev) return null;
    const ids = r.noms[s.nation][ev.level] || [];
    const fitIds = ids.filter((id) => s.jumpers[id] && available(s.jumpers[id]));
    const size = SJM.SIM.teamSize(ev.format);
    // podpowiedź: dotychczasowy skład z kontuzjowanymi zastąpionymi najlepszymi zdrowymi
    const before = (teamFor(s.nation, ev.level, ids.slice(), ev) || []).map((j) => j.id);
    const auto = (teamFor(s.nation, ev.level, fitIds.slice(), ev) || []).map((j) => j.id);
    const spare = auto.filter((id) => !before.includes(id));
    const suggested = fitIds.length >= size ? before.map((id) => (fitIds.includes(id) ? id : spare.shift())) : [];
    return { ev, title: SJM.CAL.eventTitle(ev), size, injured: r.ask.injured, cands: fitIds, suggested };
  }
  // ids = nowy skład (kolejność grup) albo null – trener wybiera sam
  function setTeamChange(ids) {
    const s = st(), r = s.weekRun;
    if (!r || !r.ask) return 'Brak decyzji do podjęcia.';
    const info = teamChangeInfo();
    if (ids) {
      if (ids.length !== info.size || new Set(ids).size !== ids.length || ids.some((id) => !info.cands.includes(id))) return `Wybierz ${info.size} różnych, zdrowych zawodników.`;
      s.nominations.teams = s.nominations.teams || {};
      s.nominations.teams[info.ev.id] = ids.slice();
    } else if (s.nominations.teams) delete s.nominations.teams[info.ev.id];
    r.decided[info.ev.id] = (r.decided[info.ev.id] || []).concat(info.injured);
    r.ask = null;
    return null;
  }

  function sanitizePlayerNoms(week) {
    const s = st();
    const n = ensureNominations();
    const out = {};
    const used = new Set();
    for (const lv of weekLevels(week)) {
      const q = quotaFor(lv, s.nation, week);
      out[lv] = fitWjc(lv, s.nation, week, (n.byLevel[lv] || []).filter((id) => s.jumpers[id] && eligible(s.jumpers[id], lv) && !used.has(id)), q);
      out[lv].forEach((id) => used.add(id));
    }
    return out;
  }

  // ---------- Wyniki ----------
  function tcsFinal(report) {
    const s = st();
    if (s.tcsAwarded === s.season) return;
    const full = Object.entries(s.standings.tcs).filter(([id]) => s.standings.tcsN[id] === 4).sort((a, b) => b[1] - a[1]);
    const w = full[0] && s.jumpers[full[0][0]];
    if (!w) return;
    s.tcsAwarded = s.season;
    w.career.tcs = (w.career.tcs || 0) + 1;
    const podium = full.slice(0, 3).map(([id, pts], i) => { const j = s.jumpers[id]; return `${i + 1}. ${j ? W.flag(j.nation) + ' ' + W.fullName(j) : '?'} (${U.fmt1(pts)})`; }).join('<br>');
    report.push(`🦅 <b>Złoty Orzeł</b>: ${W.flag(w.nation)} ${W.fullName(w)} wygrywa Turniej Czterech Skoczni!`);
    const mine = w.nation === s.nation;
    news(`🦅 ${W.fullName(w)} wygrywa Turniej Czterech Skoczni`, `Klasyfikacja końcowa ${s.season}/${String(s.season + 1).slice(2)}:<br>${podium}${mine ? '<br><br>Złoty Orzeł dla naszego kraju!' : ''}`, mine ? 'medal' : 'results');
    if (mine) { s.player.popularity += 3; s.player.board += 4; }
  }

  function applyResult(ev, res, report) {
    const s = st();
    const lv = SJM.LEVELS[ev.level];
    const title = SJM.CAL.eventTitle(ev);
    const my = s.nation;
    if (res.type === 'ind') {
      if (!res.ranking.length) return;
      const field = res.ranking.length;
      // oczekiwania wg siły
      const expRank = {};
      res.ranking.slice().sort((a, b) => W.skill(s.jumpers[b.id], 125) - W.skill(s.jumpers[a.id], 125)).forEach((r, i) => (expRank[r.id] = i + 1));
      for (const r of res.ranking) {
        const j = s.jumpers[r.id];
        if (!j) continue;
        j.season.starts++; j.career.starts++; j.lastStart = turn();
        if (ev.level !== 'NAT') j.season.cupStarts = (j.season.cupStarts || 0) + 1; // starty poza mistrzostwami kraju
        if (ev.level === 'WC') { j.season.wcStarts++; j.career.wcStarts++; }
        if (ev.level === 'SGP') j.season.sgpStarts = (j.season.sgpStarts || 0) + 1;
        j.fatigue = U.clamp(j.fatigue + 5, 0, 100);
        const hill = W.getHill(ev.hill);
        if (hill.K >= 135) j.attrs.flying = Math.min(99, j.attrs.flying + (hill.K >= 170 ? 0.35 : 0.12) * Math.max(0.2, (j.pot + 6 - j.attrs.flying) / 15));
        j.attrs.consist = Math.min(99, j.attrs.consist + 0.02);
        if (r.rank) {
          const prev = j.season.best[ev.level];
          if (!prev || r.rank < prev) j.season.best[ev.level] = r.rank;
          j.morale = U.clamp(j.morale + (expRank[r.id] - r.rank) / field * 15, 10, 90);
          if (['WC', 'WCH', 'OWG', 'SFWC'].includes(ev.level)) {
            if (r.rank === 1) { j.season.wins++; j.career.wins++; }
            if (r.rank <= 3) { j.season.podiums++; j.career.podiums++; }
            if (r.rank <= 10) j.season.top10++;
            if (!j.career.best || r.rank < j.career.best) j.career.best = r.rank;
          }
        }
        // punkty
        if (r.rank && r.rank <= 30) {
          const pts = SJM.WC_POINTS[r.rank - 1];
          if (ev.level === 'WC') {
            s.standings.wc[r.id] = (s.standings.wc[r.id] || 0) + pts;
            s.standings.nc[j.nation] = (s.standings.nc[j.nation] || 0) + pts;
            if (W.getHill(ev.hill).K >= 170) s.standings.flying[r.id] = (s.standings.flying[r.id] || 0) + pts;
          }
          if (ev.level === 'SGP') s.standings.snc[j.nation] = (s.standings.snc[j.nation] || 0) + pts;
          const key = { COC: 'coc', FIS: 'fis', SGP: 'sgp', SCOC: 'scoc' }[ev.level];
          if (key) s.standings[key][r.id] = (s.standings[key][r.id] || 0) + pts;
          addPeriodPts(j, ev.level, currentWeek().period, pts);
          addOlyPts(j, ev.level, pts);
        }
        if (ev.tour && r.rank) {
          const key = ev.tour === 'TCS' ? 'tcs' : 'raw';
          s.standings[key][r.id] = Math.round(((s.standings[key][r.id] || 0) + r.total) * 10) / 10;
          s.standings[key + 'N'][r.id] = (s.standings[key + 'N'][r.id] || 0) + 1;
        }
        // nagrody / medale
        if (j.nation === my && r.rank) {
          const prize = (lv.prize[r.rank - 1] || 0) * 0.3;
          if (prize) ledger('prizes', prize, null);
          if (ev.level === 'SGP' && r.rank <= 3) { s.player.popularity += r.rank === 1 ? 0.25 : 0.1; s.player.board += r.rank === 1 ? 0.2 : 0.05; }
          if (ev.level === 'WC') {
            if (r.rank <= 3 && modVal("podiumBonus")) ledger("events", modVal("podiumBonus"), "Premia sponsora za podium: " + W.fullName(j));
            if (r.rank === 1) { s.player.popularity += 0.6; s.player.board += 0.8; }
            else if (r.rank <= 3) { s.player.popularity += 0.25; s.player.board += 0.3; }
          }
        }
        if (lv.champs && r.rank && r.rank <= 3 && ev.level !== 'NAT') medal(ev, j.nation, r.rank, [j.id]);
      }
      const win = res.ranking[0];
      const wj = s.jumpers[win.id];
      const mine = res.ranking.filter((r) => r.nat === my);
      let line = `<b>${title}</b>: wygrał ${W.flag(wj.nation)} ${W.fullName(wj)} (${U.fmt1(win.total)} pkt)`;
      if (ev.level === 'NAT') {
        line = `<b>${title}</b>: mistrzem kraju został ${W.fullName(wj)}!`;
      } else if (mine.length) {
        const best = mine.filter((r) => r.rank).sort((a, b) => a.rank - b.rank)[0];
        if (best) line += ` · nasi: ${mine.filter((r) => r.rank).slice(0, 4).map((r) => `${W.fullName(s.jumpers[r.id])} ${r.rank}.`).join(', ')}`;
        const dsq = mine.filter((r) => r.dsq);
        if (dsq.length) line += ` · <span class="neg">dyskwalifikacja: ${dsq.map((r) => W.fullName(s.jumpers[r.id])).join(', ')}</span>`;
      }
      if (res.qual) {
        const failed = res.qual.jumps.filter((q) => !q.q && s.jumpers[q.id] && s.jumpers[q.id].nation === my);
        if (failed.length) line += ` · <span class="muted">odpadli w kwalifikacjach: ${failed.map((q) => W.fullName(s.jumpers[q.id])).join(', ')}</span>`;
      }
      if (res.cut) {
        const out = res.cut.filter((id) => s.jumpers[id] && s.jumpers[id].nation === my);
        if (out.length) line += ` · <span class="muted">poza TOP${FINALE_TOP} PŚ (nie startowali): ${out.map((id) => W.fullName(s.jumpers[id])).join(', ')}</span>`;
      }
      if (mine.length || ev.level === 'WC' || ev.level === 'SGP' || lv.champs) report.push(line);
      if (NORDIC_TOURS.includes(ev.tour) && res.qual) addTourJumps(res.qual.jumps);
      // finał TCS: Złoty Orzeł od razu po Bischofshofen (klasyfikowani tylko ci, którzy skoczyli we wszystkich 4 konkursach)
      if (ev.tour === 'TCS' && ev.tourStage === 4) tcsFinal(report);
    } else {
      if (!res.ranking.length) return;
      for (const row of res.ranking) {
        row.members.forEach((id) => { const j = s.jumpers[id]; if (j) { j.fatigue = U.clamp(j.fatigue + 4, 0, 100); j.lastStart = turn(); } });
        if (ev.level === 'WC' && row.rank <= 8) s.standings.nc[row.nat] = (s.standings.nc[row.nat] || 0) + SJM.TEAM_POINTS[row.rank - 1];
        if (ev.level === 'SGP' && row.rank <= 8) s.standings.snc[row.nat] = (s.standings.snc[row.nat] || 0) + SJM.TEAM_POINTS[row.rank - 1];
        if (lv.champs && row.rank <= 3) medal(ev, row.nat, row.rank, row.members);
        if (row.nat === my && ev.level === "WC" && row.rank <= 3) { s.player.popularity += 0.3; s.player.board += 0.4; }
      }
      if (ev.level === 'WC' && currentWeek().events.some((e) => NORDIC_TOURS.includes(e.tour))) addTourJumps(res.ranking.flatMap((row) => row.j || []));
      const mine = res.ranking.find((r) => r.nat === my);
      const w = res.ranking[0];
      let line = `<b>${title}</b>: wygrała ${W.flag(w.nat)} ${W.nationData(w.nat).name} (${U.fmt1(w.total)} pkt)`;
      if (mine) line += ` · nasza drużyna: ${mine.rank}. miejsce`;
      report.push(line);
    }
    s.player.board = U.clamp(s.player.board, 0, 100);
    s.player.popularity = U.clamp(s.player.popularity, 0, 100);
  }

  function medal(ev, nat, place, ids) {
    const s = st();
    // mistrzowie indywidualni bronią tytułu na kolejnej edycji (dodatkowe miejsce w kwocie)
    if (place === 1 && ids.length === 1 && ["WCH", "OWG", "SFWC"].includes(ev.level)) {
      s.titles = s.titles || {};
      s.titles[ev.level] = s.titles[ev.level] || {};
      s.titles[ev.level][titleKey(ev)] = { id: ids[0], season: s.season };
    }
    const key = ['g', 's', 'b'][place - 1];
    if (ev.level !== 'WJC') {
      s.medalTable[nat] = s.medalTable[nat] || { g: 0, s: 0, b: 0 };
      s.medalTable[nat][key]++;
    }
    s.seasonMedals.push({ event: SJM.CAL.eventTitle(ev), level: ev.level, place, nat, names: ids.map((id) => W.fullName(s.jumpers[id])), ids: ids.slice() });
    for (const id of ids) {
      const j = s.jumpers[id];
      if (!j) continue;
      if (ev.level === 'WJC') { j.career.jrMedals = (j.career.jrMedals || 0) + 1; if (ev.format === 'ind') wjcQuotaBonus(nat, j.id); }
      else {
        j.career.medals[key]++;
        // medale indywidualne z podziałem na imprezy (IO, MŚ, MŚ w lotach)
        if (ev.format === 'ind' && ['OWG', 'WCH', 'SFWC'].includes(ev.level)) {
          const by = j.career.medalsBy || (j.career.medalsBy = { OWG: { g: 0, s: 0, b: 0 }, WCH: { g: 0, s: 0, b: 0 }, SFWC: { g: 0, s: 0, b: 0 } });
          by[ev.level][key]++;
        }
      }
    }
    if (nat === s.nation) {
      const bonus = { WJC: [1, 0.6, 0.4], WCH: [4, 2.5, 1.5], OWG: [6, 4, 2.5], SFWC: [3, 2, 1.2] }[ev.level] || [0, 0, 0];
      s.player.popularity += bonus[place - 1];
      s.player.board += bonus[place - 1];
      const nm = ['złoty', 'srebrny', 'brązowy'][place - 1];
      news(`🏅 ${nm.toUpperCase()} MEDAL!`, `${SJM.CAL.eventTitle(ev)}: ${ids.map((id) => W.fullName(s.jumpers[id])).join(', ')} – ${nm} medal dla naszego kraju!`, 'medal');
    }
  }

  function injMult(j) { return SJM.T.has(j, "fragile") ? 1.8 : SJM.T.has(j, "iron") ? 0.45 : 1; }
  // stopnie urazów: [nazwy, przerwa min–max (tyg.)]; ciężkie (np. ACL) wyłączają na pół sezonu i dłużej
  const INJURY_TYPES = {
    light: { names: ['stłuczenie', 'naciągnięcie mięśnia', 'skręcenie stawu skokowego', 'uraz nadgarstka'], weeks: [1, 4] },
    medium: { names: ['złamanie obojczyka', 'wstrząśnienie mózgu', 'uraz więzadła pobocznego kolana', 'złamanie ręki'], weeks: [5, 12] },
    severe: { names: ['zerwanie więzadła krzyżowego (ACL)', 'złamanie podudzia', 'uraz kręgosłupa', 'złożony uraz kolana'], weeks: [20, 40] },
  };
  // src: 'train' (trening), 'fall' (upadek w konkursie), 'fallHS' (upadek po skoku za HS)
  function injure(j, reason, src = 'train') {
    j.injCount = (j.injCount || 0) + 1;
    const prof = W.profile(j.nation);
    const SEV = { train: [0.80, 0.18, 0.02], fall: [0.55, 0.33, 0.12], fallHS: [0.35, 0.40, 0.25] }[src] || [0.8, 0.18, 0.02];
    // podatność na kontuzje = cięższe urazy, żelazne zdrowie = lżejsze
    const shift = SJM.T.has(j, 'fragile') ? 1.5 : SJM.T.has(j, 'iron') ? 0.5 : 1;
    const pSevere = SEV[2] * shift, pMedium = SEV[1] * shift, roll = Math.random();
    const sev = roll < pSevere ? 'severe' : roll < pSevere + pMedium ? 'medium' : 'light';
    const t = INJURY_TYPES[sev];
    // sztab medyczny skraca przerwę (przy ciężkich urazach o połowę słabiej)
    const med = (prof.medical * 0.08 + prof.physio / 400) * (sev === 'severe' ? 0.5 : 1);
    const weeks = Math.max(1, Math.round(U.randInt(t.weeks[0], t.weeks[1]) * (1 - med)));
    if (weeks < j.injury) return; // trwający poważniejszy uraz
    j.injury = weeks;
    j.injType = U.pick(t.names);
    j.injSev = sev;
    if (sev === 'severe') j.severeSeason = st().season;
    let lasting = '';
    if (sev === 'severe') {
      j.morale = U.clamp(j.morale - 15, 10, 90);
      // trwały ślad: połowa ciężkich urazów obniża motorykę/wybicie, część także psychikę (strach) i sufit rozwoju
      if (Math.random() < 0.5) {
        const lost = [];
        const drop = (k, v) => { j.attrs[k] = U.clamp(j.attrs[k] - v, 5, 99.5); lost.push(`${SJM.ATTRS.find((a) => a.key === k).name.toLowerCase()} −${Math.round(v)}`); };
        drop(U.pick(['power', 'takeoff']), U.randInt(1, 4));
        if (Math.random() < 0.35) drop('mental', U.randInt(1, 3));
        j.pot = Math.max(W.overall(j), j.pot - U.randInt(0, 3));
        lasting = `<br>Lekarze ostrzegają przed trwałymi skutkami: ${lost.join(', ')}.`;
      }
    }
    if (j.nation === st().nation) {
      const head = { light: 'Kontuzja', medium: 'Poważna kontuzja', severe: '🚑 Ciężka kontuzja' }[sev];
      news(`${head}: ${W.fullName(j)}`, `${W.fullName(j)}: ${j.injType} (${reason}). Przewidywana przerwa: ${weeks} tyg.${sev === 'severe' ? ' To praktycznie koniec sezonu.' : ''}${lasting}`, 'injury');
    }
  }

  // ---------- Trening i rozwój ----------
  const AGE_F = (a) => a <= 16 ? 1.7 : a <= 18 ? 1.5 : a <= 20 ? 1.3 : a <= 22 ? 1.1 : a <= 24 ? 0.8 : a <= 26 ? 0.45 : a <= 28 ? 0.25 : 0.12;
  const INTENSITY = { low: { grow: 0.7, load: 4, form: 0.6, inj: 0.7 }, normal: { grow: 1.0, load: 8, form: 0, inj: 1.0 }, high: { grow: 1.35, load: 14, form: -0.7, inj: 1.5 } };
  SJM.FOCUS = {
    balanced: { name: 'Zrównoważony', attrs: null },
    takeoff:  { name: 'Wybicie i najazd', attrs: ['takeoff', 'inrun'] },
    flight:   { name: 'Faza lotu', attrs: ['flight', 'flying'] },
    landing:  { name: 'Lądowanie (telemark)', attrs: ['landing'] },
    power:    { name: 'Motoryka i siła', attrs: ['power', 'takeoff'] },
    mental:   { name: 'Psychika i stabilność', attrs: ['mental', 'consist'] },
    rest:     { name: 'Regeneracja', attrs: [] },
  };
  SJM.INTENSITY_NAMES = { low: 'Lekki', normal: 'Normalny', high: 'Intensywny' };

  // premia do naboru z małych skoczni: malejące korzyści (1. skocznia +1,3, 6 skoczni +2,4, 20 → +3,2, 60 → +3,9)
  function smallHillBonus(n) { return n > 0 ? 0.65 * Math.log(1 + n / 0.15) : 0; }
  const SMALL_HILL_REF = 1.7; // premia „przeciętnego” kraju (2 małe skocznie) – punkt odniesienia dla naboru

  function hillAccess(nat) {
    const s = st();
    if (nat !== s.nation) return { big: 1, small: 1, summer: 1 };
    const hills = s.player.hills.filter((h) => h.condition >= 35 && !h.building && homolClass(h));
    const large = hills.some((h) => h.K >= 100);
    const normal = hills.some((h) => h.K >= 85);
    const smallN = hills.filter((h) => h.K < 85).length;
    const igelitBig = hills.some((h) => h.K >= 85 && h.igelit);
    const igelitAny = hills.some((h) => h.igelit);
    return {
      big: large ? 1 : normal ? 0.88 : 0.75,
      small: normal || smallN >= 2 ? 1 : smallN ? 0.92 : 0.8,
      summer: igelitBig ? 1 : igelitAny ? 0.88 : 0.72,
      smallN, youth: smallHillBonus(smallN), youthRel: (smallHillBonus(smallN) - SMALL_HILL_REF) * 0.5,
    };
  }

  // regres z wiekiem na tydzień (da – „wiek biologiczny” po cechach długowieczność / wczesne starzenie)
  function ageDecline(k, da, prof) {
    if (da < 28) return 0;
    if (k === 'power') return 0.013 * (da - 27) * (1 - prof.center * 0.05);
    if (da >= 29 && (k === 'takeoff' || k === 'inrun')) return 0.0075 * (da - 28);
    if (da >= 30 && k === 'flight') return 0.005 * (da - 29);
    if (da >= 34) return 0.004 * (da - 33);
    return 0;
  }

  function coachFor(j, prof) {
    const g = j.group || 'R';
    if (g === 'A') return { q: prof.coachA, key: 'coachA' };
    if (g === 'B') return { q: prof.coachB, key: 'coachB' };
    if (g === 'J') return { q: prof.coachJ, key: 'coachJ' };
    return { q: 32, key: null }; // kluby
  }

  // ---------- Plan treningowy kadr B i juniorów: ustala trener kadry ----------
  const COACHED_GROUPS = { B: 'coachB', J: 'coachJ' };
  const ATTR_FOCUS = { takeoff: 'takeoff', inrun: 'takeoff', flight: 'flight', flying: 'flight', landing: 'landing', power: 'power', mental: 'mental', consist: 'mental' };
  function coachPlan(g, inSeason) {
    const p = st().player;
    const coach = p.staff[COACHED_GROUPS[g]];
    const members = myJumpers().filter((j) => j.group === g && j.injury <= 0);
    if (!coach || !members.length) return { intensity: 'normal', focus: 'balanced', why: coach ? 'brak zdrowych zawodników' : 'brak trenera – plan standardowy' };
    const fat = U.sum(members, (j) => j.fatigue) / members.length;
    if (fat > 70) return { intensity: 'low', focus: 'rest', why: `zmęczenie grupy ${Math.round(fat)}% – regeneracja` };
    let intensity = 'normal', why = 'sezon startowy';
    if (fat > 55) { intensity = 'low'; why = `zmęczenie grupy ${Math.round(fat)}%`; }
    else if (!inSeason) { intensity = coach.quality >= 45 ? 'high' : 'normal'; why = 'okres przygotowań letnich'; }
    // lepszy trener pracuje nad najsłabszym elementem grupy, słabszy – nad swoją specjalnością
    let focus = 'balanced';
    if (coach.quality >= 60) {
      const weakest = SJM.ATTRS.filter((a) => a.key !== 'flying').map((a) => [a.key, U.sum(members, (j) => j.attrs[a.key]) / members.length]).sort((x, y) => x[1] - y[1])[0][0];
      focus = ATTR_FOCUS[weakest];
      why += `; akcent na najsłabszy element (${SJM.ATTRS.find((a) => a.key === weakest).name.toLowerCase()})`;
    } else if (coach.spec) {
      focus = ATTR_FOCUS[coach.spec];
      why += '; akcent zgodny ze specjalnością trenera';
    }
    return { intensity, focus, why };
  }
  function updateCoachPlans(inSeason) {
    const p = st().player;
    for (const g of Object.keys(COACHED_GROUPS)) p.training[g] = coachPlan(g, inSeason);
  }

  // inSeason: zimowe tempo rozwoju; live: tydzień rozgrywany w kalendarzu (zmiany formy, zmęczenia, urazy)
  function trainJumper(j, prof, access, inSeason, weeks, live) {
    const s = st();
    const isPlayer = j.nation === s.nation;
    const g = j.group || 'R';
    const set = isPlayer && s.player.training[g] ? s.player.training[g] : { intensity: 'normal', focus: 'balanced' };
    const it = INTENSITY[set.intensity];
    const focus = SJM.FOCUS[set.focus];
    const coach = coachFor(j, prof);
    const spec = isPlayer && coach.key && s.player.staff[coach.key] ? s.player.staff[coach.key].spec : null;
    const a = W.age(j);
    const coachF = 0.55 + coach.q / 100 * 0.85;
    const hillF = (g === 'A' || g === 'B') ? access.big : access.small;
    const seasonF = inSeason ? 0.85 : access.summer;

    if (j.suspended > 0) j.suspended = Math.max(0, j.suspended - weeks);

    const T = SJM.T;
    // cechy: późny rozwój, pracuś, długowieczność / wczesne starzenie
    const late = T.has(j, 'latebloom'), worker = T.has(j, 'workhorse');
    const declineShift = T.has(j, 'longevity') ? 3 : T.has(j, 'earlyage') ? -2 : 0;
    const declineMult = T.has(j, 'longevity') ? 0.6 : T.has(j, 'earlyage') ? 1.4 : 1;
    const da = a - declineShift; // „wiek biologiczny" dla regresu

    // kontuzja: bez treningu, ale wiek działa dalej; przy cięższym urazie spada motoryka i wybicie,
    // zmęczenie schodzi (odpoczynek), morale powoli spada (frustracja), forma leci w dół
    if (j.injury > 0) {
      const sevLoss = { light: 0, medium: 0.02, severe: 0.045 }[j.injSev] || 0;
      for (const at of SJM.ATTRS) {
        const k = at.key;
        let loss = ageDecline(k, da, prof) * declineMult;
        if (k === 'power') loss += sevLoss * (1 - prof.physio / 200);
        else if (k === 'takeoff') loss += sevLoss * 0.6 * (1 - prof.physio / 200);
        j.attrs[k] = U.clamp(j.attrs[k] - loss * weeks, 5, 99);
      }
      j.fatigue = U.clamp(j.fatigue * Math.pow(0.6, weeks), 0, 100);
      j.morale = U.clamp(j.morale + (40 - j.morale) * Math.min(1, 0.06 * weeks), 10, 90);
      j.injury -= weeks * (1 + prof.medical * 0.1 + prof.physio / 300);
      if (j.injury <= 0) {
        j.injury = 0; j.injType = null; j.injSev = null;
        if (isPlayer && live) news('Powrót po kontuzji', `${W.fullName(j)} jest już zdrowy i gotowy do startów.`, 'injury');
      }
      j.form = Math.max(-10, j.form - 0.5 * weeks);
      return;
    }
    // losowość rozwoju: przełomowe lato albo stagnacja (j.devMult ustawiane po sezonie)
    // zawodnik zostawiony na treningu w tygodniu zawodów (status „trening”, bez startu): spokojna praca w domu
    const wk = live && inSeason && ((isPlayer && j.status === 'train') || j.homeTurn === turn()) && j.lastStart !== turn() ? st().calendar.weeks[st().week] : null;
    const homeTrain = !!(wk && wk.events && wk.events.length);
    if (homeTrain) { j.homeTrainTurn = turn(); j.homeByCoach = j.homeTurn === turn() && !(isPlayer && j.status === 'train'); }
    const devMult = (inSeason ? 1 : (j.devMult || 1)) * (homeTrain ? 1.2 : 1);
    for (const at of SJM.ATTRS) {
      const k = at.key;
      let ageF = AGE_F(a);
      if (late) ageF = a <= 22 ? ageF * 0.75 : a <= 28 ? Math.max(ageF, a <= 26 ? 0.8 : 0.5) : ageF;
      if (k === 'mental' || k === 'consist') ageF = Math.max(ageF, 0.35);
      if (k === 'flying') ageF = Math.max(ageF, 0.2);
      if (worker) ageF *= 1.25;
      let focusF = 1;
      if (set.focus === 'rest') focusF = 0.25;
      else if (focus.attrs) focusF = focus.attrs.includes(k) ? 1.9 : 0.65;
      let facF = 1;
      if (k === 'power' || k === 'takeoff') facF += prof.center * 0.06;
      if (k === 'flight' || k === 'flying') facF += prof.tunnel * 0.09;
      if (k === 'mental') facF += prof.psych / 160;
      if (spec === k) facF += 0.25;
      if (k === 'flying' && !inSeason) facF *= 0.3; // loty głównie zimą
      // sufit cech tuż nad potencjałem (wcześniej pot+5 powodowało „inflację" ocen i betonowanie czołówki)
      const cap = j.pot + 1.5;
      const gapF = U.clamp((cap - j.attrs[k]) / 12, 0, 1.4);
      const rate = 0.055 * ageF * coachF * it.grow * focusF * facF * hillF * seasonF * gapF * devMult * (isPlayer ? 1 + modVal("train") : 1);
      j.attrs[k] += rate * weeks * (0.6 + Math.random() * 0.8);

      j.attrs[k] -= ageDecline(k, da, prof) * declineMult * weeks;
      j.attrs[k] = U.clamp(j.attrs[k], 5, 99);
    }

    // forma, zmęczenie, morale
    if (live) {
      const fatPen = Math.max(0, j.fatigue - 50) / 12;
      const target = (coach.q - 50) / 40 + (j.morale - 50) / 50 + it.form + (set.focus === "rest" ? 1 : 0) - fatPen + (isPlayer ? modVal("form") : 0)
        + (homeTrain ? (j.form < 0 ? 1.5 : 0.6) : 0); // trening w domu: odbudowa formy, najmocniej po dołku
      j.form = U.clamp(j.form + (target - j.form) * (homeTrain ? 0.45 : 0.3) + U.gauss(0, 1.7), -10, 10);
      // szansa na „zaskoczenie” na treningu
      if (homeTrain && Math.random() < 0.12) {
        j.form = U.clamp(j.form + 1.5, -10, 10);
        if (isPlayer && (j.group === 'A' || j.group === 'B')) news('Przełom na treningu', `${W.fullName(j)} ${j.homeByCoach ? 'z decyzji trenera ' : ''}zamiast startu został na treningu i coś „zaskoczyło” – forma wyraźnie w górę.`, 'training');
      }
      j.fatigue = U.clamp(j.fatigue * 0.6 - prof.physio / 20 - prof.medical * 1.5 + it.load * (set.focus === 'rest' ? 0.3 : 1) - (homeTrain ? 6 : 0), 0, 100);
      j.morale += (55 - j.morale) * 0.1;
      const risk = (0.0018 + Math.max(0, j.fatigue - 55) * 0.0012) * it.inj * injMult(j) * (isPlayer ? Math.max(0.2, 1 + modVal("injury")) : 1);
      if (Math.random() < risk) injure(j, 'uraz na treningu');
    }
  }

  function weeklyUpdate(weeks, inSeason, live = inSeason) {
    const s = st();
    updateCoachPlans(inSeason);
    const profs = {}, acc = {};
    for (const n of SJM.NATIONS) { profs[n.code] = W.profile(n.code); acc[n.code] = hillAccess(n.code); }
    for (const j of Object.values(s.jumpers)) {
      trainJumper(j, profs[j.nation], acc[j.nation], inSeason, weeks, live);
      // dyspozycja sezonowa powoli „dryfuje" w trakcie sezonu
      if (inSeason) j.shape = U.clamp((j.shape || 0) * 0.97 + U.gauss(0, 0.2), -6, 6);
      // kadrowicz, który długo nie startuje, traci motywację
      if (inSeason && (j.group === "A" || j.group === "B") && j.injury <= 0) {
        const since = turn() - (j.lastStart !== undefined ? j.lastStart : turn() - s.week);
        if (since > 4) j.morale = U.clamp(j.morale - 1.2 * weeks, 5, 100);
      }
    }
  }

  // ---------- Rotacja w czołówce: dyspozycja sezonowa, przełomy i kryzysy ----------
  // czołówka (ocena 88+) ma większe wahania dyspozycji – rotacja na szczycie bez wzmacniania przypadku w niższych cyklach
  function newSeasonShape(j) {
    const elite = U.clamp((W.overall(j) - 88) / 5, 0, 1);
    const sd = (SJM.T.has(j, "streaky") ? 2.8 : 1.8) + elite * 1.4;
    j.shape = U.clamp(U.gauss(0, sd), -6, 6);
  }
  // przed letnim treningiem: każdy zawodnik ma inne „lato" (przełom, stagnacja, kryzys techniczny)
  function summerRandomness(lines) {
    const s = st();
    for (const j of Object.values(s.jumpers)) {
      const a = W.age(j), ov = W.overall(j);
      j.devMult = U.clamp(U.gauss(1, 0.55), 0.1, 2.5);
      const mine = j.nation === s.nation;
      if (a <= 27 && ov < j.pot - 3 && Math.random() < 0.08) {
        for (const k of ["takeoff", "flight", "inrun"]) j.attrs[k] = Math.min(j.pot + 1.5, j.attrs[k] + 1.5 + Math.random() * 2);
        if (mine && lines) lines.push(`🚀 Przełom techniczny: ${W.fullName(j)} zrobił latem ogromny postęp.`);
      } else if (a >= 21 && ov > 70 && Math.random() < 0.08) {
        for (const k of ['takeoff', 'flight']) j.attrs[k] = Math.max(5, j.attrs[k] - (1 + Math.random() * 1.5));
        if (mine && lines) lines.push(`⚠ Problemy techniczne: ${W.fullName(j)} nie odnalazł się po zmianach w technice.`);
      }
    }
  }
  function revealTraits() {
    const s = st();
    const prof = W.profile(s.nation);
    const found = [];
    for (const j of myJumpers()) {
      if (!j.traits) continue;
      const f = SJM.T.revealCheck(j, prof, W.age(j));
      f.forEach((k) => found.push(`${SJM.TRAITS[k].icon} <b>${W.fullName(j)}</b>: ${SJM.TRAITS[k].name} – ${SJM.TRAITS[k].desc}`));
    }
    if (found.length) news('Sztab odkrył ukryte cechy zawodników', found.join('<br>'), 'info');
  }

  // ---------- Finanse ----------
  function annualCosts() {
    const p = st().player;
    const salaries = U.sum(Object.values(p.staff).filter(Boolean), (x) => x.salary);
    let facilities = 0;
    const cs = costScale(); // koszty lokalne tańsze w biedniejszych federacjach
    for (const [k, lvl] of Object.entries(p.facilities)) facilities += Math.round(lvl * SJM.FACILITIES[k].upkeep * cs);
    const hills = Math.round(U.sum(p.hills, (h) => h.club ? 0 : SJM.HILL_TYPES[h.type].upkeep * (h.lights ? 1.1 : 1)) * cs);
    const per = { A: 140000, B: 70000, J: 45000 };
    const squad = Math.round(U.sum(myJumpers(), (j) => per[j.group] || 0) * cs);
    return { salaries, facilities, hills, squad, total: salaries + facilities + hills + squad };
  }
  function costScale() { return U.clamp(W.nationData(st().nation).budget / 4, 0.08, 1.3); }
  function annualIncome() {
    const p = st().player;
    const sponsors = Math.round(p.grant * 0.35 * Math.pow(p.popularity / 70, 1.2) * Math.max(0, 1 + modVal("sponsor")));
    return { grant: p.grant, sponsors, total: p.grant + sponsors };
  }

  function weeklyFinance(week, weeks = 1) {
    const s = st();
    const p = s.player;
    const inc = annualIncome(), cost = annualCosts();
    ledger('grant', inc.grant / 52 * weeks, null);
    ledger('sponsors', inc.sponsors / 52 * weeks, null);
    ledger('salaries', -cost.salaries / 52 * weeks, null);
    ledger('facilities', -cost.facilities / 52 * weeks, null);
    ledger('hills', -cost.hills / 52 * weeks, null);
    ledger('squad', -cost.squad / 52 * weeks, null);
    if (week) {
      // organizacja zawodów
      const hostedLevels = new Set(week.events.filter((e) => hostNationOf(e.hill) === s.nation).map((e) => e.level));
      const gain = { WC: 320000, SGP: 140000, COC: 45000, SCOC: 25000, FIS: 12000, WJC: 70000, NAT: -25000, WCH: 900000, OWG: 0, SFWC: 600000 };
      for (const lv of hostedLevels) {
        ledger('hosting', gain[lv], `Organizacja zawodów: ${SJM.LEVELS[lv].name}`);
        if (lv === 'WC') p.popularity = Math.min(100, p.popularity + 0.8);
      }
    }
    p.popularity += (W.nationData(s.nation).pop - p.popularity) * Math.min(1, 0.02 * weeks);
    // poważny deficyt (ponad 15% rocznych przychodów): ostrzeżenie zarządu co ok. 8 tygodni; ocena deficytu – raz, po sezonie
    if (p.budget < -0.15 * annualIncome().total && weeks === 1 && Math.random() < 0.125) {
      news('Alarm finansowy', 'Federacja ma poważny deficyt. Zarząd oczekuje cięć kosztów (mniejsze kadry, mniej osób w sztabie, zamknięcie obiektów, mniejsze ekipy na zawody) – po sezonie oceni stan finansów.', 'board');
    }
  }

  // ---------- Infrastruktura ----------
  function progressProjects(weeks) {
    const p = st().player;
    for (const pr of p.projects) pr.weeksLeft -= weeks;
    const done = p.projects.filter((pr) => pr.weeksLeft <= 0);
    p.projects = p.projects.filter((pr) => pr.weeksLeft > 0);
    for (const pr of done) {
      if (pr.kind === 'build') {
        const h = p.hills.find((x) => x.id === pr.target);
        if (h) { h.building = false; h.condition = 100; }
        news('Nowa skocznia otwarta!', `Zakończono budowę skoczni ${pr.label}. Żeby trenować na niej kadry i juniorów albo organizować zawody, potrzebna jest homologacja FIS (Infrastruktura).`, 'infra');
      } else if (pr.kind === 'modern') {
        const h = p.hills.find((x) => x.id === pr.target);
        if (h) { h.condition = 100; h.modernizing = false; }
        news('Modernizacja zakończona', `Skocznia ${pr.label} przeszła modernizację.`, 'infra');
      } else if (pr.kind === 'igelit') {
        const h = p.hills.find((x) => x.id === pr.target);
        if (h) h.igelit = true;
        news('Igelit gotowy', `Na skoczni ${pr.label} położono igelit – można na niej trenować latem.`, 'infra');
      } else if (pr.kind === 'lights') {
        const h = p.hills.find((x) => x.id === pr.target);
        if (h) h.lights = true;
        news('Oświetlenie gotowe', `Skocznia ${pr.label} ma nowe oświetlenie.`, 'infra');
      } else if (pr.kind === 'homol') {
        const h = p.hills.find((x) => x.id === pr.target);
        if (h) {
          const why = homolMeets(h, pr.cls);
          if (why) news('Homologacja odrzucona', `Inspekcja FIS na skoczni ${h.name}: ${why}. Opłata przepadła.`, 'infra');
          else { h.homol = { cls: pr.cls, until: st().season + HOMOL_YEARS - 1 }; news('Homologacja przyznana', `Skocznia ${h.name} otrzymała homologację klasy ${pr.cls} (${HOMOL[pr.cls].use}) ważną do sezonu ${h.homol.until}/${String(h.homol.until + 1).slice(2)}.`, 'infra'); }
        }
      } else if (pr.kind === 'facility') {
        p.facilities[pr.target] = (p.facilities[pr.target] || 0) + 1;
        news('Inwestycja zakończona', `${SJM.FACILITIES[pr.target].name} – osiągnięto poziom ${p.facilities[pr.target]}.`, 'infra');
      }
    }
  }

  function spend(cost, label) {
    const p = st().player;
    if (p.budget < cost) return `Brak środków (potrzeba ${U.money(cost)}).`;
    ledger('investments', -cost, label);
    return null;
  }

  // wolne lokalizacje nowych skoczni: najpierw miejsca z historycznymi skoczniami, potem większe miasta
  function hillSites(nat) {
    nat = nat || st().nation;
    const sites = SJM.HILL_SITES[nat] || { hist: [], cities: [] };
    const used = new Set(st().player.hills.map((h) => h.city).concat(SJM.HILLS.filter((h) => h.nation === nat).map((h) => h.city)));
    return { hist: sites.hist.filter((c) => !used.has(c)), cities: sites.cities.filter((c) => !used.has(c)) };
  }
  function nextHillCity(nat) {
    const s = hillSites(nat);
    if (s.hist.length) return s.hist[0];
    if (s.cities.length) return s.cities[0];
    const n = st().player.hills.filter((h) => !h.builtin).length + 1;
    return 'Ośrodek regionalny ' + n;
  }
  function randomHillCity(nat) {
    const s = hillSites(nat);
    return s.hist.length ? U.pick(s.hist) : s.cities.length ? U.pick(s.cities) : nextHillCity(nat);
  }

  function buildHill(type, city) {
    const p = st().player;
    city = city || nextHillCity();
    const t = SJM.HILL_TYPES[type];
    const err = spend(t.cost, 'Budowa skoczni ' + t.name);
    if (err) return err;
    const id = U.uid('h');
    const K = t.K, HS = t.HS;
    const name = city + ' HS' + HS;
    p.hills.push({ id, name, city, K, HS, type, condition: 0, igelit: false, lights: false, builtin: false, building: true });
    p.projects.push({ id: U.uid('p'), kind: 'build', target: id, weeksLeft: t.weeks, total: t.weeks, label: name, cost: t.cost });
    return null;
  }
  function hillProjectBusy(id) { return st().player.projects.some((pr) => pr.target === id); }
  function modernize(id) {
    const p = st().player;
    const h = p.hills.find((x) => x.id === id);
    if (!h || hillProjectBusy(id)) return 'Na tej skoczni trwają już prace.';
    const t = SJM.HILL_TYPES[h.type];
    const cost = Math.round(t.cost * 0.22 * (1 - h.condition / 200));
    const err = spend(cost, 'Modernizacja ' + h.name); if (err) return err;
    h.modernizing = true;
    p.projects.push({ id: U.uid('p'), kind: 'modern', target: id, weeksLeft: Math.ceil(t.weeks / 3), total: Math.ceil(t.weeks / 3), label: h.name, cost });
    return null;
  }
  function addIgelit(id) {
    const p = st().player;
    const h = p.hills.find((x) => x.id === id);
    if (!h || h.igelit || hillProjectBusy(id)) return 'Nie można.';
    if (h.type === 'flying') return 'Na mamutach nie kładzie się igelitu.';
    const cost = Math.round(SJM.HILL_TYPES[h.type].cost * 0.18);
    const err = spend(cost, 'Igelit ' + h.name); if (err) return err;
    p.projects.push({ id: U.uid('p'), kind: 'igelit', target: id, weeksLeft: 8, total: 8, label: h.name, cost });
    return null;
  }
  function addLights(id) {
    const p = st().player;
    const h = p.hills.find((x) => x.id === id);
    if (!h || h.lights || hillProjectBusy(id)) return 'Nie można.';
    const cost = Math.round(SJM.HILL_TYPES[h.type].cost * 0.05);
    const err = spend(cost, 'Oświetlenie ' + h.name); if (err) return err;
    p.projects.push({ id: U.uid('p'), kind: 'lights', target: id, weeksLeft: 3, total: 3, label: h.name, cost });
    return null;
  }
  function demolish(id) {
    const p = st().player;
    const h = p.hills.find((x) => x.id === id);
    if (!h || hillProjectBusy(id)) return 'Nie można teraz zamknąć tej skoczni.';
    if (h.club) return 'To obiekt klubowy – o jego zamknięciu decydują klub i gmina, nie związek.';
    if (st().calendar.weeks.some((w, i) => i >= st().week && w.events.some((e) => e.hill === id))) return 'Na tej skoczni zaplanowano jeszcze zawody w tym sezonie.';
    p.hills = p.hills.filter((x) => x.id !== id);
    news('Skocznia zamknięta', `Obiekt ${h.name} (${h.city}) został wyłączony z użytku.`, 'infra');
    return null;
  }
  function upgradeFacility(key) {
    const p = st().player;
    const f = SJM.FACILITIES[key];
    const lvl = p.facilities[key] || 0;
    if (lvl >= f.cost.length) return 'Maksymalny poziom.';
    if (p.projects.some((pr) => pr.kind === 'facility' && pr.target === key)) return 'Rozbudowa już trwa.';
    const cost = f.cost[lvl];
    const err = spend(cost, f.name + ' – poziom ' + (lvl + 1)); if (err) return err;
    const weeks = 10 + lvl * 6;
    p.projects.push({ id: U.uid('p'), kind: 'facility', target: key, weeksLeft: weeks, total: weeks, label: f.name, cost });
    return null;
  }

  const HOST_REQ = {
    WC:  { minK: 100, cond: 75, lights: true, fee: 60000, chance: 0.45, label: 'Weekend Pucharu Świata' },
    SGP: { minK: 100, cond: 70, lights: false, igelit: true, fee: 35000, chance: 0.5, label: 'Letnie Grand Prix' },
    COC: { minK: 85, cond: 60, lights: false, fee: 15000, chance: 0.8, label: 'Puchar Kontynentalny' },
    SCOC: { minK: 85, cond: 55, lights: false, igelit: true, fee: 10000, chance: 0.8, label: 'Letni Puchar Kontynentalny' },
    FIS: { minK: 85, cond: 50, lights: false, fee: 5000, chance: 0.9, label: 'FIS Cup' },
    WJC: { minK: 85, maxK: 109, cond: 70, lights: false, fee: 25000, chance: 0.4, label: 'Mistrzostwa Świata Juniorów' },
    // wielkie imprezy: decyzja FIS 4 lata przed imprezą (kandydatura dotyczy najbliższej nierozstrzygniętej edycji)
    WCH: { minK: 110, cond: 75, lights: true, fee: 150000, chance: 0.4, label: 'Mistrzostwa Świata', big: true, needNH: true },
    SFWC: { minK: 170, cond: 75, lights: false, fee: 100000, chance: 0.45, label: 'MŚ w lotach', big: true },
  };
  const MAX_CYCLE_BIDS = 3;
  // wycofanie kandydatury na weekend cyklu (opłata nie wraca)
  function unbid(level, hillId) {
    const p = st().player;
    const list = (p.cycleBids || {})[level];
    if (!list || !list.includes(hillId)) return 'Brak takiej kandydatury.';
    p.cycleBids[level] = list.filter((x) => x !== hillId);
    return null;
  }
  // ---------- Homologacja FIS ----------
  // klasa obiektu decyduje, jakie zawody może gościć; certyfikat ważny 5 sezonów, a po każdym sezonie inspekcja
  // sprawdza stan techniczny (za słaby stan = obniżenie klasy). Bez homologacji skocznia nie liczy się do treningu kadr i naboru.
  const HOMOL = {
    A: { name: 'Klasa A', use: 'PŚ, LGP, MŚ, IO, MŚ w lotach', minK: 100, cond: 70, lights: true, cost: 120000, weeks: 3 },
    B: { name: 'Klasa B', use: 'PK, LPK, MŚ Juniorów', minK: 85, cond: 55, cost: 45000, weeks: 2 },
    C: { name: 'Klasa C', use: 'FIS Cup', minK: 65, cond: 40, cost: 15000, weeks: 1 },
    D: { name: 'Klasa D', use: 'mistrzostwa kraju, trening kadr i młodzieży', minK: 0, cond: 25, cost: 3000, weeks: 1 },
  };
  const HOMOL_ORDER = ['A', 'B', 'C', 'D'];
  const HOMOL_YEARS = 5;
  const LEVEL_CLASS = { WC: 'A', SGP: 'A', WCH: 'A', OWG: 'A', SFWC: 'A', COC: 'B', SCOC: 'B', WJC: 'B', FIS: 'C', NAT: 'D' };
  const homolRank = (c) => (c ? HOMOL_ORDER.indexOf(c) : 99);
  // aktualna klasa (null = brak); obiekty klubowe mają zawsze co najmniej klasę D utrzymywaną przez klub
  function homolClass(h) {
    if (!h || h.building) return null;
    if (h.homol && h.homol.until >= st().season) return h.homol.cls;
    return h.club ? 'D' : null;
  }
  function homolMeets(h, cls) {
    const r = HOMOL[cls];
    if (h.building) return 'w budowie';
    if (h.K < r.minK) return `za mała skocznia (min. K-${r.minK})`;
    if (h.condition < r.cond) return `stan techniczny poniżej ${r.cond}%`;
    if (r.lights && !h.lights) return 'brak oświetlenia';
    return null;
  }
  function homolBest(h) { return HOMOL_ORDER.find((c) => !homolMeets(h, c)) || null; }
  function homolCost(cls) { return Math.round(HOMOL[cls].cost * costScale() / 1000) * 1000; }
  function homologate(id, cls) {
    const p = st().player;
    const h = p.hills.find((x) => x.id === id);
    if (!h || hillProjectBusy(id)) return 'Na tej skoczni trwają już prace.';
    const why = homolMeets(h, cls); if (why) return `Skocznia nie spełnia wymogów klasy ${cls}: ${why}.`;
    const cost = homolCost(cls);
    const err = spend(cost, `Homologacja klasy ${cls} – ${h.name}`); if (err) return err;
    p.projects.push({ id: U.uid('p'), kind: 'homol', target: id, cls, weeksLeft: HOMOL[cls].weeks, total: HOMOL[cls].weeks, label: `${h.name} – inspekcja FIS (klasa ${cls})`, cost });
    return null;
  }
  // po sezonie: wygasanie certyfikatów i inspekcja stanu technicznego
  function homolReview(lines) {
    const s = st();
    for (const h of s.player.hills) {
      if (!h.homol || h.building) continue;
      const cur = h.homol.cls;
      // kluby same odnawiają swoje certyfikaty
      if (h.club && h.homol.until <= s.season && !homolMeets(h, cur)) { h.homol.until = s.season + HOMOL_YEARS; continue; }
      if (h.homol.until <= s.season) {
        delete h.homol;
        if (!h.club || cur !== 'D') lines.push(`📋 Wygasła homologacja klasy ${cur}: ${h.name}${h.club ? ' (klub utrzymuje klasę D)' : ' – odnów ją w Infrastrukturze'}.`);
        continue;
      }
      if (!homolMeets(h, cur)) continue;
      const lower = HOMOL_ORDER.slice(homolRank(cur) + 1).find((c) => !homolMeets(h, c));
      if (lower) h.homol.cls = lower; else delete h.homol;
      lines.push(`⚠️ Inspekcja FIS: ${h.name} (stan ${Math.round(h.condition)}%) – ${lower ? `obniżono do klasy ${lower}` : 'odebrano homologację'}.`);
    }
  }

  function canHost(level, h) {
    const r = HOST_REQ[level];
    if (h.building) return 'w budowie';
    const need = LEVEL_CLASS[level];
    if (need && homolRank(homolClass(h)) > homolRank(need)) {
      const dims = h.K >= r.minK && !(r.maxK && h.K > r.maxK) && !(h.K >= 170 && level !== 'WC' && level !== 'SFWC');
      if (dims) return `brak homologacji klasy ${need}${homolClass(h) ? ` (obecnie klasa ${homolClass(h)})` : ''}`;
    }
    if (h.K < r.minK) return level === 'SFWC' ? 'potrzebny mamut (K-170+)' : `za mała skocznia (min. K-${r.minK})`;
    if (r.maxK && h.K > r.maxK) return `tylko skocznia normalna (K-${r.minK}–${r.maxK})`;
    if (h.K >= 170 && level !== 'WC' && level !== 'SFWC') return 'mamut nie nadaje się do tych zawodów';
    if (r.needNH && !st().player.hills.some((x) => x.K >= 85 && x.K < 110 && !x.building && x.condition >= 60)) return 'potrzebna też skocznia normalna (K-85–109) w dobrym stanie';
    if (h.condition < r.cond) return `stan techniczny poniżej ${r.cond}%`;
    if (r.lights && !h.lights) return 'brak oświetlenia';
    if (r.igelit && !h.igelit) return 'brak igelitu';
    return null;
  }
  function bid(level, hillId) {
    const p = st().player;
    const h = p.hills.find((x) => x.id === hillId);
    if (!h) return 'Brak skoczni.';
    const why = canHost(level, h); if (why) return 'Skocznia nie spełnia wymogów: ' + why + '.';
    if (HOST_REQ[level].big) {
      p.bigBids = p.bigBids || {};
      if (p.bigBids[level]) return `Kandydatura na ${HOST_REQ[level].label} ${p.bigBids[level].year} już złożona.`;
      const ed = SJM.CAL.openEdition(level);
      const err = spend(HOST_REQ[level].fee, `Opłata kandydacka: ${HOST_REQ[level].label} ${ed.year}`); if (err) return err;
      p.bigBids[level] = { year: ed.year, hill: hillId };
      return null;
    }
    // weekendy cykli: do 3 kandydatur na cykl, decyzję podejmuje FIS po sezonie
    if (SJM.CAL.CYCLES[level]) {
      p.cycleBids = p.cycleBids || {};
      const list = (p.cycleBids[level] = p.cycleBids[level] || []);
      if (list.length >= MAX_CYCLE_BIDS) return `Możesz złożyć najwyżej ${MAX_CYCLE_BIDS} kandydatury na cykl.`;
      if (list.includes(hillId)) return 'Ta skocznia już kandyduje.';
      if (SJM.CAL.inCircuit(level, hillId)) return 'Ta skocznia jest już w kalendarzu – utrzymuje swój weekend bez kandydatury.';
      const err = spend(HOST_REQ[level].fee, `Opłata kandydacka: ${HOST_REQ[level].label} (${h.city})`); if (err) return err;
      list.push(hillId);
      return null;
    }
    if (p.hostBids[level]) return 'Kandydatura już złożona.';
    const err = spend(HOST_REQ[level].fee, 'Opłata kandydacka: ' + HOST_REQ[level].label); if (err) return err;
    p.hostBids[level] = hillId;
    return null;
  }

  // ---------- Sztab ----------
  // sztabowców pozyskuje się wyłącznie ofertami w oknie kontraktowym po sezonie
  function hire() {
    return st().staffWindow ? 'Trwa okno kontraktowe – złóż ofertę w zakładce „Okno kontraktowe”.' : 'Sztabowców zatrudnia się tylko ofertami w oknie kontraktowym po sezonie.';
  }
  // zwolnienie tylko w oknie kontraktowym (zwalnia miejsce pod ofertę dla kogoś lepszego)
  function fire(role) {
    const s = st(), p = s.player;
    if (!s.staffWindow) return 'Zwalniać można tylko w oknie kontraktowym po sezonie.';
    const cur = p.staff[role];
    if (!cur) return 'Stanowisko nieobsadzone.';
    const w = s.staffWindow;
    if (w.phase === 'draft' && ROLE_ORDER.indexOf(role) < w.roleIdx) return `Nabór na funkcję „${SJM.STAFF_ROLES[role].name}” już się zakończył – zwolnić można tylko na funkcjach, których nabór trwa albo jeszcze się nie zaczął.`;
    if (cur.interim) { p.staff[role] = null; return null; }
    const severance = Math.round(cur.salary * 0.3);
    const err = spend(severance, `Odprawa: ${cur.first} ${cur.last}`); if (err) return err;
    cur.blocked = (cur.blocked || []).concat(s.nation);
    s.staffMarket.push(cur);
    p.staff[role] = null;
    staffLog(s.nation, `${staffName(cur)} zwolniony z funkcji: ${SJM.STAFF_ROLES[role].name}.`);
    return null;
  }
  // p.o. (pełniący obowiązki): słabszy zastępca do końca sezonu, gdy stanowisko zwolni się poza oknem
  function interimStaff(role) {
    const s = st(), p = s.player;
    if (p.staff[role]) return p.staff[role];
    const x = W.genStaff(role, 30 + W.nationData(s.nation).strength * 0.2, s.nation, 6);
    x.interim = true; x.since = s.season; x.until = s.season;
    x.salary = Math.round(x.salary * 0.6 * localPay(s.nation) / 1000) * 1000;
    p.staff[role] = x;
    staffLog(s.nation, `${staffName(x)} p.o. ${SJM.STAFF_ROLES[role].name.toLowerCase()} do końca sezonu.`);
    return x;
  }

  // ---------- Sztaby: kronika zmian, emerytury, kontrakty ----------
  const ROLE_ORDER = ['coachA', 'coachB', 'coachJ', 'tech', 'physio', 'psych', 'scout'];
  const RN = (r) => SJM.STAFF_ROLES[r].name;
  const staffName = (x) => x.first + ' ' + x.last;
  const r1000 = (v) => Math.round(v / 1000) * 1000;
  const randIn = (a, b) => a + Math.random() * (b - a);
  // season = rok startu sezonu, którego dotyczy zmiana (po sezonie: sezon właśnie zakończony)
  function staffLog(code, text, season = st().season) {
    const n = st().nations[code];
    n.staffLog = n.staffLog || [];
    n.staffLog.unshift({ season, text });
    if (n.staffLog.length > 30) n.staffLog.length = 30;
  }
  // emerytura sztabowca: niewielka szansa w każdym wieku, od 60 lat szybko rośnie
  function staffRetireChance(a) {
    if (a < 45) return 0.005;
    if (a < 55) return 0.015;
    if (a < 60) return 0.04;
    return Math.min(0.9, 0.1 * Math.pow(1.32, a - 60));
  }
  function staffOf(code) { const s = st(); return code === s.nation ? s.player.staff : s.nations[code].staff; }
  function vacancies(code) { const staff = staffOf(code) || {}; return ROLE_ORDER.filter((r) => !staff[r]); }

  // ----- wartość rynkowa i atrakcyjność ofert -----
  function salaryFor(role, q) { return SJM.STAFF_ROLES[role].base * (0.35 + Math.pow(q / 70, 2.2)); }
  // krajowcy pracują za lokalne stawki, obcokrajowcy chcą stawki rynkowej
  function localPay(code) { return Math.sqrt(U.clamp(W.nationData(code).budget / 4, 0.08, 1.3)); }
  // minimalna pensja, jakiej sztabowiec chce od danego kraju
  function staffAsk(x, code) {
    if (!x.greed) x.greed = randIn(0.92, 1.12);
    return r1000(salaryFor(x.role, x.quality) * (x.nation === code ? localPay(code) : 1) * x.greed);
  }
  // prestiż kraju: tradycja (siła federacji), popularność skoków i miejsce w Pucharze Narodów
  function prestige(code) {
    const s = st(), nd = W.nationData(code);
    const order = (s.staffWindow && s.staffWindow.rank) || ncOrder();
    const rankScore = 100 * (1 - order.indexOf(code) / Math.max(1, order.length - 1));
    const pop = code === s.nation ? s.player.popularity : nd.pop;
    return 0.45 * nd.strength + 0.25 * pop + 0.3 * rankScore;
  }
  // ambicja: dobry sztabowiec w słabej kadrze chce spróbować sił w mocniejszej
  function ambition(x, code) { return Math.max(0, x.quality - (prestige(code) + 5)) / 12; }
  // jak bardzo sztabowcowi podoba się oferta (pensja, prestiż, ambicja, kraj pochodzenia, długość kontraktu)
  function offerUtility(x, code, salary, years) {
    const pr = prestige(code);
    return 4 * (salary / staffAsk(x, code) - 1) + 0.02 * (pr - 50) + (x.quality - 55) / 40 * (pr - 50) / 50 * 1.2
      + (x.nation === code ? 0.5 : 0) + (years - 1) * (x.age >= 55 ? 0.15 : 0.08);
  }
  function renewAsk(x, code) { return r1000(Math.max(x.salary, staffAsk(x, code)) * (ambition(x, code) > 0 ? 1.1 : 1)); }
  function renewChance(x, code, salary) {
    const s = st();
    // restless: osobisty „niepokój” sztabowca, losowany co sezon (chęć zmiany otoczenia)
    const u = 4 * (salary / renewAsk(x, code) - 1) + 0.3 + 0.1 * Math.min(5, s.season - (x.since || s.season))
      + 0.01 * (prestige(code) - 50) - ambition(x, code) + (x.nation === code ? 0.2 : 0) - (x.restless || 0);
    return U.clamp(1 / (1 + Math.exp(-1.6 * u)), 0.05, 0.95);
  }
  function renewMood(x, code) {
    const p = renewChance(x, code, renewAsk(x, code));
    const mood = p > 0.75 ? 'Chętnie zostanie' : p > 0.45 ? 'Waha się' : 'Myśli o odejściu';
    return mood + (ambition(x, code) > 0 ? ' – chce spróbować sił w mocniejszej kadrze' : '');
  }
  function toPool(x, code) { x.blocked = (x.blocked || []).concat(code); st().staffMarket.push(x); }

  // ----- rozwój sztabowców -----
  // ukryty potencjał (sufit): młodzi mają duży zapas, z wiekiem maleje; nadawany przy pierwszej potrzebie
  function staffPot(x) {
    if (x.pot === undefined) x.pot = U.clamp(Math.round(x.quality + Math.max(0, U.gauss((45 - x.age) * 0.6, 5))), x.quality, 95);
    return x.pot;
  }
  // perspektywiczny: młody z dużym zapasem do sufitu (podpowiedź dla gracza)
  function staffProspect(x) { return x.age < 38 && staffPot(x) - x.quality >= 6; }
  // co sezon: młodzi rosną (do sufitu), w średnim wieku stabilnie, starsi słabną;
  // w mocnej federacji (prestiż) uczą się szybciej
  function developStaff(x, code) {
    const pot = staffPot(x), a = x.age;
    let d = a < 35 ? U.gauss(2.2, 1.5) : a < 45 ? U.gauss(1, 1.3) : a < 55 ? U.gauss(0, 1.2) : a < 63 ? U.gauss(-0.8, 1.2) : U.gauss(-1.8, 1.5);
    // bez posady (code = null) rozwijają się w przeciętnym tempie
    if (d > 0) d = Math.min(d * (code ? 1 + (prestige(code) - 50) / 100 : 1), Math.max(0, pot - x.quality));
    const q = U.clamp(Math.floor(x.quality + d + Math.random()), 15, 98);
    x.lastDelta = q - x.quality;
    x.quality = q;
  }

  // ----- po sezonie: starzenie, emerytury, zwolnienia, końce kontraktów → okno kontraktowe -----
  function staffSeason(summary, order) {
    const s = st(), p = s.player;
    s.staffGone = s.staffGone || [];
    const retires = (x) => Math.random() < staffRetireChance(x.age);
    const w = s.staffWindow = { phase: 'renew', rank: order.slice(), renew: [], round: 0, intents: {}, last: null, heads: [] };
    for (const n of SJM.NATIONS) for (const x of Object.values(staffOf(n.code) || {})) if (x) x.restless = randIn(0, 1.2);
    const devLines = [];
    // nasz sztab: rozwój, emerytury i kontrakty do przedłużenia
    for (const r of ROLE_ORDER) {
      const x = p.staff[r];
      if (!x) continue;
      x.age++;
      if (retires(x)) {
        p.staff[r] = null;
        s.staffGone.push(staffName(x));
        staffLog(s.nation, `${staffName(x)} (${RN(r)}) przechodzi na emeryturę w wieku ${x.age} lat.`, s.season - 1);
        summary.lines.push(`👴 ${staffName(x)} (${RN(r)}) przechodzi na emeryturę w wieku ${x.age} lat – obsadź wakat w oknie kontraktowym.`);
        continue;
      }
      if (x.interim) { p.staff[r] = null; continue; } // p.o. kończy pracę z sezonem
      developStaff(x, s.nation);
      if (x.lastDelta) devLines.push(`${staffName(x)} ${x.lastDelta > 0 ? '▲ +' : '▼ '}${x.lastDelta} (${x.quality})`);
      if ((x.until !== undefined ? x.until : s.season - 1) < s.season) w.renew.push({ role: r, id: x.id, ask: renewAsk(x, s.nation), mood: renewMood(x, s.nation), result: null });
    }
    if (devLines.length) summary.lines.push('📈 Rozwój sztabu: ' + devLines.join(', '));
    if (w.renew.length) summary.lines.push(`📝 Kończą się kontrakty: ${w.renew.map((e) => staffName(p.staff[e.role])).join(', ')} – negocjacje w oknie kontraktowym.`);
    // kraje AI
    const expected = SJM.NATIONS.slice().sort((a, b) => b.strength - a.strength).map((n) => n.code);
    for (const n of SJM.NATIONS) {
      if (n.code === s.nation) continue;
      const ns = s.nations[n.code];
      if (!ns.staff) ns.staff = W.genAiStaff(n.code);
      const diff = order.indexOf(n.code) - expected.indexOf(n.code); // > 0: gorzej niż oczekiwano
      for (const r of ROLE_ORDER) {
        const x = ns.staff[r];
        if (!x) continue;
        x.age++;
        developStaff(x, n.code);
        let out = null;
        if (retires(x)) out = 'retire';
        else if (r === 'coachA' && diff >= 3 && s.season - (x.since || 0) >= 2 && Math.random() < Math.min(0.55, 0.12 + (diff - 3) * 0.06)) out = 'fired';
        else if ((x.until !== undefined ? x.until : s.season - 1) < s.season) {
          // koniec kontraktu: federacja zwykle chce przedłużyć, sztabowiec nie zawsze
          if (Math.random() < (x.quality >= W.aiBase(n.code)[r] - 6 ? 0.8 : 0.65)) {
            const sal = r1000(renewAsk(x, n.code) * randIn(1, 1.15));
            if (Math.random() < renewChance(x, n.code, sal)) { x.salary = sal; x.until = s.season + U.randInt(0, 2); continue; }
            out = x.age >= 58 && Math.random() < 0.5 ? 'retire' : 'refused';
          } else out = 'released';
        }
        if (!out) continue;
        ns.staff[r] = null;
        if (out === 'retire') s.staffGone.push(staffName(x)); else toPool(x, n.code);
        const why = { retire: `przechodzi na emeryturę (${x.age} l.)`, fired: 'zwolniony po słabym sezonie', refused: 'nie przedłużył kontraktu', released: 'federacja nie przedłużyła kontraktu' }[out];
        staffLog(n.code, `${RN(r)}: ${staffName(x)} ${why}.`, s.season - 1);
        if (r === 'coachA') w.heads.push({ code: n.code, old: staffName(x), why });
      }
      // wspólna baza trenerów: po odejściu trenera kadry A federacja często awansuje dobrego trenera kadry B
      const b = ns.staff.coachB;
      if (!ns.staff.coachA && b && b.quality >= W.aiBase(n.code).coachA - 5 && Math.random() < 0.6) {
        ns.staff.coachB = null; b.role = 'coachA'; b.salary = Math.max(b.salary, r1000(salaryFor('coachA', b.quality) * (b.nation === n.code ? localPay(n.code) : 1)));
        ns.staff.coachA = b;
        staffLog(n.code, `${staffName(b)}: awans z trenera kadry B na trenera kadry A.`, s.season - 1);
        const h = w.heads.find((e) => e.code === n.code && !e.now); if (h) h.now = staffName(b) + ' (awans z kadry B)';
      }
      W.syncAi(n.code);
    }
    // okno zaczyna się od przedłużeń (także gdy nie ma czego przedłużać – można jeszcze kogoś zwolnić przed naborem)
    if (SJM.AUTOPILOT) autoWindow();
  }

  // ----- marzec: przedłużenia kontraktów naszego sztabu -----
  // salary === null → nie przedłużamy
  function renewOffer(id, salary, years = 1) {
    const s = st(), p = s.player, w = s.staffWindow;
    const it = w && w.phase === 'renew' && w.renew.find((e) => e.id === id && !e.result);
    if (!it) return 'Brak takiej negocjacji.';
    const x = p.staff[it.role];
    if (salary === null) {
      it.result = 'released';
      p.staff[it.role] = null; toPool(x, s.nation);
      staffLog(s.nation, `${staffName(x)} (${RN(it.role)}): nie przedłużyliśmy kontraktu.`, s.season - 1);
      return null;
    }
    salary = r1000(salary);
    if (!(salary >= it.ask)) return `Minimalne żądanie: ${U.money(it.ask)}.`;
    if (salary - x.salary > payrollRoom()) return `Zarząd nie zatwierdzi podwyżki: pensje sztabu przekroczyłyby ${payrollFrozen() ? `limit (${U.money(payrollCap())} rocznie) – tyle zostaje z przychodów po kosztach kadr, obiektów, skoczni i wyjazdów; zawsze 30–55% przychodów` : `${Math.round(PAYROLL_CAP * 100)}% rocznych przychodów`}.`;
    years = U.clamp(Math.round(years) || 1, 1, 3);
    it.chance = renewChance(x, s.nation, salary);
    it.offer = salary;
    if (Math.random() < it.chance) {
      it.result = 'accepted';
      x.salary = salary; x.until = s.season + years - 1;
      staffLog(s.nation, `${staffName(x)} (${RN(it.role)}) przedłużył kontrakt do sezonu ${x.until}/${String(x.until + 1).slice(2)}.`, s.season - 1);
    } else {
      p.staff[it.role] = null;
      if (x.age >= 58 && Math.random() < 0.5) { it.result = 'retired'; s.staffGone.push(staffName(x)); }
      else { it.result = 'refused'; toPool(x, s.nation); }
      staffLog(s.nation, `${staffName(x)} (${RN(it.role)}) ${it.result === 'retired' ? 'odrzucił ofertę i przechodzi na emeryturę' : 'odrzucił ofertę przedłużenia kontraktu'}.`, s.season - 1);
    }
    return null;
  }
  // koniec negocjacji: nierozstrzygnięte kontrakty wygasają
  function finishRenewals() {
    const w = st().staffWindow;
    if (!w || w.phase !== 'renew') return;
    for (const it of w.renew) if (!it.result) renewOffer(it.id, null);
    startDraft();
  }

  // ----- kwiecień: okno kontraktowe (rundy ofert o wolnych sztabowców) -----
  // trenerzy kadr (A, B, juniorzy) to wspólna baza: każdy wolny trener może objąć dowolną kadrę
  const COACH_ROLES = ['coachA', 'coachB', 'coachJ'];
  const isCoach = (r) => COACH_ROLES.includes(r);
  const sameKind = (a, b) => a === b || (isCoach(a) && isCoach(b));
  // podczas naboru na funkcję trenerską cała baza wolnych trenerów jest wystawiona na tę funkcję (żądania wg stanowiska)
  function relabelCoaches(r) { if (isCoach(r)) for (const x of st().staffMarket) if (isCoach(x.role)) x.role = r; }
  function freeFor(role, code) { return st().staffMarket.filter((x) => sameKind(x.role, role) && !(x.blocked || []).includes(code)); }
  // awans / przesunięcie naszego trenera na wolne stanowisko trenerskie (np. trener kadry B → kadra A) – tylko w oknie;
  // w marcu można tak zastąpić trenera, z którym nie chcemy przedłużać (jego kontrakt wygasa)
  function coachMoves() {
    const s = st(), p = s.player, w = s.staffWindow, out = [];
    if (!w) return out;
    for (const to of COACH_ROLES) {
      const cur = p.staff[to];
      const pending = cur && w.phase === 'renew' && w.renew.find((e) => e.role === to && e.id === cur.id && !e.result);
      if (cur && !pending && !cur.interim) continue;
      if (w.phase === 'draft' && ROLE_ORDER.indexOf(to) < w.roleIdx) continue;
      for (const from of COACH_ROLES) {
        const x = p.staff[from];
        if (from === to || !x || x.interim) continue;
        if (w.phase === 'draft' && ROLE_ORDER.indexOf(from) < w.roleIdx) continue;
        out.push({ from, to, id: x.id, name: staffName(x), q: x.quality, replaces: cur && !cur.interim ? staffName(cur) : null });
      }
    }
    return out;
  }
  function promoteCoach(from, to) {
    const s = st(), p = s.player, w = s.staffWindow;
    if (!coachMoves().some((m) => m.from === from && m.to === to)) return 'Takie przesunięcie nie jest teraz możliwe.';
    const x = p.staff[from], cur = p.staff[to];
    const newAsk = r1000(salaryFor(to, x.quality) * (x.nation === s.nation ? localPay(s.nation) : 1) * (x.greed || 1));
    const raise = Math.max(0, newAsk - x.salary);
    // pensja zastępowanego (wygasający kontrakt) przestaje się liczyć do budżetu płacowego
    const freed = cur ? cur.salary : 0;
    if (raise > payrollRoom() + freed) return `Zarząd nie zatwierdzi podwyżki przy awansie (+${U.money(raise)}): zabrakłoby miejsca w budżecie płacowym sztabu.`;
    if (cur) {
      if (cur.interim) p.staff[to] = null;
      else { const it = w.renew.find((e) => e.role === to && e.id === cur.id && !e.result); if (it) renewOffer(it.id, null); }
    }
    p.staff[from] = null;
    x.role = to; x.salary += raise;
    p.staff[to] = x;
    // jego własne negocjacje (wygasający kontrakt) idą razem z nim na nowe stanowisko
    const own = w.phase === 'renew' && w.renew.find((e) => e.id === x.id && !e.result);
    if (own) { own.role = to; own.ask = renewAsk(x, s.nation); own.mood = renewMood(x, s.nation); }
    staffLog(s.nation, `${staffName(x)}: awans z funkcji „${RN(from)}” na „${RN(to)}”${raise ? ` (pensja ${U.money(x.salary)})` : ''}.`, s.season - 1);
    // trwał nabór właśnie na tę funkcję – kończymy w nim udział
    if (w.phase === 'draft' && curRole() === to) { delete w.intents[s.nation]; resolveRound(null); advance(); }
    return null;
  }
  // awaryjny „newgen”, gdy wolnych sztabowców brakuje
  function emergencyStaff(role, qMean, nat) {
    const x = W.genStaff(role, qMean, nat, 8);
    x.age = U.randInt(27, 40); x.newgen = true;
    return x;
  }
  // draft: funkcje po kolei (ROLE_ORDER); w każdej rundzie każdy kraj z wakatem na tej funkcji
  // wybiera jednego kandydata (najpierw SI, potem my), a potem rozstrzygani są kolejni kandydaci od najlepszego
  const curRole = () => ROLE_ORDER[st().staffWindow.roleIdx];
  // czy bierzemy udział w naborze na funkcję (wakat i brak pasa)
  function meInRole(r) { const s = st(); return !s.player.staff[r] && !s.staffWindow.passed[r]; }
  function aiInRole(r) { return SJM.NATIONS.some((n) => n.code !== st().nation && !staffOf(n.code)[r]); }
  function startDraft() {
    const w = st().staffWindow;
    w.phase = 'draft';
    w.roleIdx = 0; w.roleRound = 0; w.passed = {}; w.feed = []; w.intents = {};
    w.round = 0;
    advance();
  }
  // przejście do następnej rundy; rundy bez naszego udziału (nie mamy wakatu na tej funkcji albo spasowaliśmy)
  // rozgrywają się same, aż dojdziemy do funkcji, o którą walczymy, albo do końca okna
  function advance() {
    const w = st().staffWindow;
    let guard = 0;
    while (w.roleIdx < ROLE_ORDER.length && guard++ < 400) {
      const r = curRole(), me = meInRole(r);
      if (!me && !aiInRole(r)) { w.roleIdx++; w.roleRound = 0; continue; }
      nextRound();
      if (me) return;
      resolveRound(null);
    }
    closeWindow();
  }
  function nextRound() {
    const s = st(), w = s.staffWindow, r = curRole();
    w.round++;
    w.roleRound++;
    // oferty jeszcze nierozstrzygnięte (runda przerwana po naszym przegranym pojedynku) zostają w grze
    w.intents = w.intents || {};
    delete w.intents[s.nation];
    relabelCoaches(r);
    supplyMarket(r);
    // kraje AI bez oferty: każdy z wakatem wybiera jednego kandydata
    for (const n of SJM.NATIONS) if (n.code !== s.nation && !staffOf(n.code)[r] && !w.intents[n.code]) aiPick(n, r);
  }
  // zapotrzebowanie przewyższa podaż → na rynek trafiają nowi, młodzi sztabowcy
  function supplyMarket(r) {
    const s = st();
    const demand = SJM.NATIONS.filter((n) => !staffOf(n.code)[r]).length;
    for (let i = s.staffMarket.filter((x) => x.role === r).length; i < demand + 1; i++) s.staffMarket.push(emergencyStaff(r, U.randInt(38, 55)));
  }
  // kraj AI wybiera kandydata – najlepszego, po którego realnie może sięgnąć (także takiego, o którego już ktoś walczy)
  function aiPick(n, r) {
    const w = st().staffWindow;
    const base = W.aiBase(n.code)[r];
    // zasięg: bogatsze federacje celują wyżej; po kilku przegranych rundach SI obniża oczekiwania
    const reach = base + 8 + 6 * U.clamp(n.budget / 4 - 0.5, -0.5, 1) - 2 * Math.max(0, w.roleRound - 2);
    const desire = (x) => Math.min(x.quality, reach) - 1.5 * Math.max(0, x.quality - reach) + (x.nation === n.code ? 2 : 0)
      + 2 * U.clamp(offerUtility(x, n.code, staffAsk(x, n.code), 2), -2, 1) + U.gauss(0, 3);
    let best = null, bd = -1e9;
    for (const x of freeFor(r, n.code)) { const d = desire(x); if (d > bd) { bd = d; best = x; } }
    // pas: na rynku nie ma nikogo na miarę federacji → bierze słabszego, lokalnego sztabowca
    if (!best || best.quality < base - 12 || w.roleRound > 12) {
      const x = emergencyStaff(r, base - 8, n.code);
      signStaff(x, n.code, r1000(staffAsk(x, n.code)), U.randInt(1, 2));
      w.feed.push({ role: r, round: w.round, name: staffName(x), q: x.quality, code: n.code, offers: [], local: true });
      return;
    }
    const generosity = 0.25 * U.clamp(n.budget / 4, 0.3, 1.3);
    w.intents[n.code] = { role: r, id: best.id, salary: r1000(staffAsk(best, n.code) * randIn(1, 1 + generosity)), years: U.randInt(1, 3) };
  }
  function rivalsFor(id) { const w = st().staffWindow; return w ? Object.values(w.intents).filter((i) => i.id === id).length : 0; }
  function signStaff(x, code, salary, years) {
    const s = st(), w = s.staffWindow;
    s.staffMarket = s.staffMarket.filter((y) => y !== x);
    x.salary = salary; x.until = s.season + years - 1; x.since = s.season; x.blocked = [];
    staffOf(code)[x.role] = x;
    staffLog(code, `${RN(x.role)}: ${staffName(x)} podpisał kontrakt do sezonu ${x.until}/${String(x.until + 1).slice(2)}.`, s.season - 1);
    if (code === s.nation) news('Nowy członek sztabu', `${staffName(x)} przyjął naszą ofertę i obejmuje funkcję: ${RN(x.role)} (${U.money(salary)} rocznie, kontrakt do ${x.until}/${String(x.until + 1).slice(2)}).`, 'staff');
    else {
      W.syncAi(code);
      if (x.role === 'coachA') { const h = w.heads.find((e) => e.code === code && !e.now); if (h) h.now = staffName(x); else w.heads.push({ code, now: staffName(x) }); }
    }
  }
  // runda: kandydaci rozstrzygani po jednym, od najlepszego do najgorszego. Jedna oferta → podpisuje; kilka → losowanie
  // z szansami według atrakcyjności ofert (pensja, prestiż, ambicja, kraj pochodzenia, długość kontraktu).
  // Przegrani od razu wybierają nowy cel spośród nierozstrzygniętych – także takiego, o którego już ktoś walczy –
  // zanim rozstrzygnie się kolejny kandydat. Gdy przegramy my, runda staje i wybieramy następny cel.
  function resolveRound(myBid) {
    const s = st(), w = s.staffWindow, r = curRole();
    w.intents = w.intents || {};
    if (myBid) w.intents[s.nation] = myBid;
    const res = { round: w.round, role: r, mine: null, signed: [] };
    let guard = 0;
    while (guard++ < 500) {
      const bids = Object.entries(w.intents).map(([code, b]) => ({ code, ...b }));
      const cands = [...new Set(bids.map((b) => b.id))].map((id) => s.staffMarket.find((y) => y.id === id)).filter(Boolean);
      if (!cands.length) { w.intents = {}; break; }
      const x = cands.sort((a, b) => b.quality - a.quality)[0];
      const offers = bids.filter((b) => b.id === x.id);
      const ws = offers.map((o) => Math.exp(U.clamp(offerUtility(x, o.code, o.salary, o.years), -10, 10) / 0.4));
      const tot = ws.reduce((a, v) => a + v, 0);
      let roll = Math.random() * tot, k = 0;
      while (k < ws.length - 1 && roll > ws[k]) { roll -= ws[k]; k++; }
      const win = offers[k];
      offers.forEach((o) => delete w.intents[o.code]);
      signStaff(x, win.code, win.salary, win.years);
      const e = { role: x.role, round: w.round, name: staffName(x), q: x.quality, code: win.code, offers: offers.map((o, i) => ({ code: o.code, chance: ws[i] / tot })).sort((a, b) => b.chance - a.chance) };
      res.signed.push(e); w.feed.push(e);
      const mi = offers.findIndex((o) => o.code === s.nation);
      if (mi >= 0) res.mine = { name: staffName(x), role: x.role, won: win.code === s.nation, to: win.code, rivals: offers.length - 1, chance: ws[mi] / tot };
      // przegrani SI wybierają nowy cel od razu
      supplyMarket(r);
      offers.filter((o) => o.code !== win.code && o.code !== s.nation).forEach((o) => aiPick(SJM.NATIONS.find((n) => n.code === o.code), r));
      // przegraliśmy: przerwa – wybieramy kolejny cel, zanim rozstrzygną się następni kandydaci
      if (mi >= 0 && win.code !== s.nation && meInRole(r)) break;
    }
    if (w.feed.length > 300) w.feed.splice(0, w.feed.length - 300);
    w.last = res;
  }
  // nasza oferta dla kandydata w bieżącej rundzie
  // zarząd nie zatwierdzi kontraktu, po którym pensje sztabu przekroczyłyby limit (+15% oszczędności); przy tym odkłada
  // rezerwę na pozostałe wakaty (najtańszy dostępny kandydat na każde), a gdy wszystkich nie da się obsadzić – tylko na ważniejsze
  const PAYROLL_CAP = 0.55;
  const GRANT_FLOOR = 0.7; // dolna granica dotacji względem bazowej dotacji kraju
  // limit pensji: to, co zostaje z przychodów po pozostałych kosztach (kadry, obiekty, skocznie, wyjazdy z poprzedniego
  // sezonu – min. 15% przychodów), ale zawsze 30–55% przychodów (sztab musi istnieć, a płace nie mogą rosnąć ponad stan)
  const PAYROLL_MIN = 0.30;
  function payrollCap() {
    const p = st().player, inc = annualIncome().total, c = annualCosts();
    const travel = Math.max(p.lastTravel || 0, inc * 0.15);
    const left = inc - c.squad - c.facilities - c.hills - travel;
    return U.clamp(left, inc * PAYROLL_MIN, inc * PAYROLL_CAP);
  }
  const payrollFrozen = () => payrollCap() < annualIncome().total * PAYROLL_CAP - 1;
  function payrollRoom(forRole) {
    const p = st().player;
    const s = st();
    const free = payrollCap() + Math.max(0, p.budget) * 0.15 - U.sum(Object.values(p.staff).filter(Boolean), (x) => x.salary);
    if (!forRole) return Math.round(free);
    const others = vacancies(s.nation).filter((r) => r !== forRole);
    const all = others.reduce((a, r) => a + cheapestAsk(r), 0);
    const important = others.filter((r) => ROLE_ORDER.indexOf(r) < ROLE_ORDER.indexOf(forRole)).reduce((a, r) => a + cheapestAsk(r), 0);
    return Math.round(free - (free - all >= cheapestAsk(forRole) ? all : important));
  }
  function cheapestAsk(role) {
    const s = st();
    const asks = freeFor(role, s.nation).map((x) => staffAsk(x, s.nation));
    return asks.length ? Math.min(...asks) : r1000(salaryFor(role, 30) * localPay(s.nation));
  }
  function staffBid(id, salary, years = 1) {
    const s = st(), w = s.staffWindow;
    if (!w || w.phase !== 'draft') return 'Okno kontraktowe jest zamknięte.';
    const x = s.staffMarket.find((y) => y.id === id);
    if (!x) return 'Kandydat niedostępny.';
    if (x.role !== curRole()) return `Teraz trwa nabór na funkcję: ${RN(curRole())}.`;
    if ((x.blocked || []).includes(s.nation)) return `${staffName(x)} nie chce z nami rozmawiać.`;
    if (s.player.staff[x.role]) return `Stanowisko „${RN(x.role)}” jest obsadzone.`;
    const ask = staffAsk(x, s.nation);
    salary = r1000(salary);
    if (!(salary >= ask)) return `Minimalne żądanie: ${U.money(ask)}.`;
    if (salary > payrollRoom(x.role)) return `Zarząd nie zatwierdzi kontraktu: pensje sztabu przekroczyłyby ${payrollFrozen() ? `limit (${U.money(payrollCap())} rocznie) – tyle zostaje z przychodów po kosztach kadr, obiektów, skoczni i wyjazdów; zawsze 30–55% przychodów` : `${Math.round(PAYROLL_CAP * 100)}% rocznych przychodów`} (wolne na to stanowisko, z rezerwą na pozostałe wakaty: ${U.money(Math.max(0, payrollRoom(x.role)))}).`;
    resolveRound({ role: x.role, id, salary, years: U.clamp(Math.round(years) || 1, 1, 3) });
    advance();
    return null;
  }
  // przeczekanie rundy: kraje AI wybierają bez nas, a my zostajemy w naborze na tę funkcję
  function skipRound() {
    const w = st().staffWindow;
    if (!w || w.phase !== 'draft') return 'Okno kontraktowe jest zamknięte.';
    resolveRound(null);
    advance();
    return null;
  }
  // pas: rezygnujemy z naboru na bieżącą funkcję (po oknie obowiązki przejmie słabszy p.o.)
  function passRole() {
    const w = st().staffWindow;
    if (!w || w.phase !== 'draft') return 'Okno kontraktowe jest zamknięte.';
    w.passed[curRole()] = true;
    resolveRound(null);
    advance();
    return null;
  }
  // zamknięcie okna: pasujemy na pozostałych funkcjach, kraje AI dokańczają nabór
  function finishWindow() {
    const s = st(), w = s.staffWindow;
    if (!w) return null;
    if (w.phase === 'renew') finishRenewals();
    if (!s.staffWindow) return null;
    for (const r of ROLE_ORDER) w.passed[r] = true;
    resolveRound(null);
    advance();
    return null;
  }
  function closeWindow() {
    const s = st(), w = s.staffWindow;
    if (!w) return;
    // awaryjnie: kraj AI bez kompletu (nie powinno się zdarzyć) dostaje nowych ludzi
    for (const n of SJM.NATIONS) if (n.code !== s.nation) for (const r of vacancies(n.code)) { signStaff(emergencyStaff(r, W.aiBase(n.code)[r] - 6, W.staffNat(n.code)), n.code, r1000(salaryFor(r, 45)), 1); }
    const heads = w.heads.filter((h) => h.now).map((h) => `${W.flag(h.code)} ${W.nationData(h.code).name}: ${U.esc(h.now)}${h.old ? ` za ${U.esc(h.old)} (${h.why})` : ''}`);
    if (heads.length) news('Karuzela trenerska', 'Nowi trenerzy kadr A po oknie kontraktowym:<br>' + heads.join('<br>'), 'world');
    const mine = vacancies(s.nation);
    s.staffWindow = null;
    // blokady z tego okna wygasają; kto odejdzie od nas w trakcie sezonu, będzie zablokowany w następnym oknie
    for (const x of s.staffMarket) x.blocked = [];
    if (mine.length) {
      // p.o. tylko na tyle stanowisk, na ile pozwala budżet płacowy (najważniejsze najpierw)
      const po = [];
      for (const r of mine) { if (payrollRoom(r) > r1000(salaryFor(r, 30) * 0.6 * localPay(s.nation))) po.push(interimStaff(r)); }
      const empty = mine.filter((r) => !s.player.staff[r]);
      news('Wakaty w sztabie', `Po oknie kontraktowym nieobsadzone pozostały: ${mine.map(RN).join(', ')}. ${po.length ? `Do końca sezonu obowiązki pełnią: ${po.map((x) => `${staffName(x)} (p.o., jakość ${x.quality})`).join(', ')}. ` : ''}${empty.length ? `Bez obsady (brak pieniędzy w budżecie płacowym): ${empty.map(RN).join(', ')}. ` : ''}Następców wybierzesz w kolejnym oknie kontraktowym.`, 'staff');
    }
  }
  // tryb testowy: przedłużamy po żądaniu, wakaty obsadzamy najlepszym dostępnym
  function autoWindow() {
    const s = st(), w = s.staffWindow;
    for (const it of w.renew.slice()) if (renewOffer(it.id, it.ask * 1.05, 2)) renewOffer(it.id, null);
    startDraft();
    let guard = 0;
    // na bieżącej funkcji: najlepszy, na kogo nas stać; nikogo → pas
    while (s.staffWindow && guard++ < 200) {
      const r = curRole();
      const c = freeFor(r, s.nation).filter((x) => r1000(staffAsk(x, s.nation) * 1.1) <= payrollRoom(r)).sort((a, b) => b.quality - a.quality)[0];
      if (c) staffBid(c.id, staffAsk(c, s.nation) * 1.1, 2); else passRole();
    }
    finishWindow();
  }

  // ---------- Oczekiwania i zarząd ----------
  function ncOrder() {
    const s = st();
    return SJM.NATIONS.map((n) => n.code).sort((a, b) => (s.standings.nc[b] || 0) - (s.standings.nc[a] || 0));
  }
  function setExpectation(prevRank) {
    const s = st();
    let rank = prevRank;
    // cel wg średniego miejsca z ostatnich 3 sezonów – jeden lepszy lub gorszy sezon nie windował/obniżał go skokowo
    const last = (s.history || []).slice(-3).map((h) => h.player && h.player.ncRank).filter(Boolean);
    if (rank && last.length) rank = Math.round(U.sum(last) / last.length);
    if (!rank) {
      const byStrength = SJM.NATIONS.slice().sort((a, b) => b.strength - a.strength).map((n) => n.code);
      const order = s.realDB ? SJM.REAL_NC_ORDER.concat(byStrength.filter((c) => !SJM.REAL_NC_ORDER.includes(c))) : byStrength;
      rank = order.indexOf(s.nation) + 1;
    }
    const target = Math.max(1, rank + (rank > 6 ? 1 : 0));
    const E = s.season + 1;
    const big = E % 2 === 1 ? 'WCH' : E % 4 === 2 ? 'OWG' : 'SFWC';
    s.player.expectation = { nc: target, medal: target <= 4, big };
  }
  function expectationText() {
    const e = st().player.expectation;
    let t = `zajęcie co najmniej <b>${e.nc}. miejsca</b> w Pucharze Narodów`;
    if (e.medal) t += ` oraz zdobycie <b>medalu</b> na imprezie mistrzowskiej (${SJM.LEVELS[e.big].name})`;
    return t + '.';
  }

  // ---------- Sezon ----------
  function startSeason(first) {
    const s = st();
    // pierwszy sezon gry startuje w listopadzie; kolejne zaczynają się latem (LGP, LPK, FIS Cup)
    s.calendar = SJM.CAL.build(s.season, { summer: !first });
    s.week = 0;
    if (first) {
      s.turnScale = TURNS_PER_SEASON;
      // gracz prowadzi kraj, który już ma przyznane najbliższe igrzyska (np. Francja 2030)
      const owg = Object.entries(SJM.CAL.hosts().OWG).find(([, v]) => v.nat === s.nation);
      if (owg) SJM.CAL.olympicBenefits(+owg[0], owg[1]);
    }
    // przypomnienie: certyfikaty wygasające po tym sezonie i obiekty zagrożone inspekcją
    {
      const exp = s.player.hills.filter((h) => h.homol && h.homol.until === s.season && !h.building && !h.club);
      const risk = s.player.hills.filter((h) => h.homol && h.homol.until > s.season && !h.building && !h.club && h.condition - 5 < HOMOL[h.homol.cls].cond);
      if (exp.length || risk.length) news('Homologacje skoczni', (exp.length ? `Po tym sezonie wygasa homologacja: ${exp.map((h) => `${h.name} (klasa ${h.homol.cls})`).join(', ')}. ` : '')
        + (risk.length ? `Po sezonie inspekcja może obniżyć klasę (słaby stan techniczny): ${risk.map((h) => `${h.name} – ${Math.round(h.condition)}%, min. ${HOMOL[h.homol.cls].cond}%`).join(', ')}. ` : '') + 'Szczegóły w Infrastrukturze.', 'infra');
    }
    s.ncPrev = { ...((s.standings && s.standings.nc) || {}) }; // kolejność startu drużyn przed pierwszymi punktami PN
    s.standings ={ wc: {}, nc: {}, tcs: {}, tcsN: {}, raw: {}, rawN: {}, coc: {}, fis: {}, flying: {}, sgp: {}, scoc: {}, snc: {} };
    s.results = {};
    s.seasonMedals = [];
    for (const j of Object.values(s.jumpers)) { j.season = W.blankSeasonStats(); j.ovrStart = W.overall(j); j.quitRisk = false; newSeasonShape(j); if (!j.traits) SJM.T.assign(j); }
    revealTraits();
    s.player.seasonFinance = { income: {}, expense: {} };
    s.player.budgetStart = s.player.budget; // do oceny zarządu: czy dług w sezonie maleje
    s.player.hostBids = {};
    aiGroups();
    if (first) setExpectation(null);
    ensureNominations(true);
  }

  function rankOf(obj, key) {
    const arr = Object.entries(obj).sort((a, b) => b[1] - a[1]);
    const i = arr.findIndex(([k]) => k === key);
    return i < 0 ? null : i + 1;
  }
  function topList(obj, n, filter) {
    let arr = Object.entries(obj).sort((a, b) => b[1] - a[1]);
    if (filter) arr = arr.filter(filter);
    return arr.slice(0, n);
  }
  function snapshotJumper(id, pts) {
    const j = st().jumpers[id];
    return j ? { id, name: W.fullName(j), nat: j.nation, pts } : { id, name: '?', nat: '?', pts };
  }

  function endSeason() {
    const s = st();
    const p = s.player;
    const E = s.season + 1;
    const summary = { season: s.season, label: `${s.season}/${String(E).slice(2)}`, lines: [] };
    p.lastTravel = (p.seasonFinance.expense || {}).travel || 0; // koszty wyjazdów – do zamrożenia płac w deficycie

    // klasyfikacje końcowe
    // punkty sezonu zapamiętane do uprawnień i kwot (1. okres następnego sezonu)
    for (const j of Object.values(s.jumpers)) { updateLife(j); j.prevPts = { WC: s.standings.wc[j.id] || 0, COC: s.standings.coc[j.id] || 0, FIS: s.standings.fis[j.id] || 0, SGP: s.standings.sgp[j.id] || 0, SCOC: s.standings.scoc[j.id] || 0 }; updateLife(j); j.lic = null;
      j.ppPrev = j.pp || blankPP(); j.pp = blankPP(); // punkty okresów do rankingów kroczących
      j.endMorale = j.morale; j.endStarts = j.season.starts; j.endCupStarts = j.season.cupStarts || 0;
      // kolejne sezony seniora bez regularnych startów w PŚ/LGP (głównie PK, FIS Cup albo nic)
      // licznik zeruje dopiero regularna obecność w elicie: co najmniej 1/3 startów w sezonie to PŚ lub LGP
      const topN = j.season.wcStarts + (j.season.sgpStarts || 0);
      const top = topN > 0 && topN >= j.season.starts / 3;
      j.lowYears = top || W.age(j) < 22 ? 0 : (j.lowYears || 0) + 1; }
    const tcsFull = Object.fromEntries(Object.entries(s.standings.tcs).filter(([id]) => s.standings.tcsN[id] === 4));
    const rawStages = Math.max(0, ...Object.values(s.standings.rawN)); // Raw Air może mieć 2 etapy (bez obiektu imprezy mistrzowskiej)
    const rawFull = Object.fromEntries(Object.entries(s.standings.raw).filter(([id]) => s.standings.rawN[id] === rawStages));
    const hist = {
      season: s.season, label: summary.label,
      wc: topList(s.standings.wc, 10).map(([id, pts]) => snapshotJumper(id, pts)),
      nc: topList(s.standings.nc, 8).map(([nat, pts]) => ({ nat, pts })),
      snc: topList(s.standings.snc || {}, 8).map(([nat, pts]) => ({ nat, pts })),
      tcs: topList(tcsFull, 3).map(([id, pts]) => snapshotJumper(id, pts)),
      raw: topList(rawFull, 3).map(([id, pts]) => snapshotJumper(id, pts)),
      rawName: SJM.CAL.nordicName(),
      coc: topList(s.standings.coc, 3).map(([id, pts]) => snapshotJumper(id, pts)),
      fis: topList(s.standings.fis, 3).map(([id, pts]) => snapshotJumper(id, pts)),
      sgp: topList(s.standings.sgp, 3).map(([id, pts]) => snapshotJumper(id, pts)),
      scoc: topList(s.standings.scoc, 3).map(([id, pts]) => snapshotJumper(id, pts)),
      flying: topList(s.standings.flying, 3).map(([id, pts]) => snapshotJumper(id, pts)),
      medals: s.seasonMedals.slice(),
    };
    if (hist.wc[0]) { const j = s.jumpers[hist.wc[0].id]; if (j) j.career.globes++; }
    // Złoty Orzeł przyznawany po finale TCS (tcsFinal); tu tylko awaryjnie, gdyby finału nie rozegrano zwykłą drogą
    if (hist.tcs[0] && s.tcsAwarded !== s.season) { const j = s.jumpers[hist.tcs[0].id]; if (j) j.career.tcs = (j.career.tcs || 0) + 1; }

    // dziennik zawodnika
    for (const j of Object.values(s.jumpers)) {
      if (j.season.starts) {
        j.log.push({ season: summary.label, starts: j.season.starts, wc: s.standings.wc[j.id] || 0, wcRank: s.standings.wc[j.id] ? rankOf(s.standings.wc, j.id) : null, wins: j.season.wins, podiums: j.season.podiums, coc: s.standings.coc[j.id] || 0, ovr: Math.round(W.overall(j)) });
        if (j.log.length > 25) j.log.shift();
      }
    }

    // ocena zarządu
    const order = ncOrder();
    const myRank = order.indexOf(s.nation) + 1;
    const exp = p.expectation;
    const myMedals = s.seasonMedals.filter((m) => m.nat === s.nation && m.level !== 'WJC');
    // składniki oceny zarządu (widoczne w podsumowaniu sezonu)
    const parts = { nc: U.clamp((exp.nc - myRank) * 5, -25, 15) };
    if (exp.medal) parts.medal = myMedals.length ? 6 : -10;
    if (myMedals.some((m) => m.place === 1)) parts.gold = 6;
    if (hist.wc[0] && hist.wc[0].nat === s.nation) parts.globe = 10;
    // deficyt: kara zależna od jego skali względem rocznych przychodów
    if (p.budget < 0) {
      const r = -p.budget / Math.max(1, annualIncome().total);
      parts.budget = r < 0.1 ? -4 : r < 0.3 ? -8 : -12;
      // dług maleje (sezon na plusie): zarząd docenia spłatę – kara symboliczna
      if (p.budgetStart !== undefined && p.budget > p.budgetStart) parts.budget = Math.max(parts.budget, -2);
    }
    if (SJM.EV) parts.events = SJM.EV.seasonEnd(myRank, exp, summary);
    let delta = Math.round(U.sum(Object.values(parts)));
    summary.deltaParts = parts;
    p.board = U.clamp(p.board + delta, 0, 100);
    hist.player = { ncRank: myRank, target: exp.nc, board: Math.round(p.board), medals: myMedals.length };
    s.history.push(hist);
    summary.hist = hist;
    summary.myRank = myRank;
    summary.delta = delta;

    if (p.board < 15 && !SJM.NOFIRE) { // SJM.NOFIRE – tryb testowy (liczenie zwolnień bez kończenia gry)
      s.gameOver = true;
      summary.fired = true;
      news('Zwolnienie', `Zarząd federacji stracił do Ciebie zaufanie. Zajęliśmy ${myRank}. miejsce w Pucharze Narodów (cel: ${exp.nc}.). Twoja kadencja dobiegła końca.`, 'board');
      s.lastSummary = summary;
      return;
    }

    // budżet federacji na kolejny rok
    let grantChange = U.clamp((p.board - 50) / 500 + (exp.nc - myRank) * 0.02, -0.12, 0.15);
    // sufit: wzrost słabnie powyżej bazowej dotacji kraju i zatrzymuje się przy jej podwojeniu (+ ew. dotacja olimpijska)
    if (grantChange > 0) { const base = W.nationData(s.nation).budget * 1e6 + (p.olympic ? p.olympic.boost : 0); grantChange *= U.clamp(2 - p.grant / base, 0, 1); }
    p.grant = Math.round(p.grant * (1 + grantChange) / 1000) * 1000;
    // podłoga: finansowanie państwowe nie spada poniżej 70% bazowej dotacji kraju (słaby okres nie staje się spiralą bez wyjścia)
    p.grant = Math.max(p.grant, Math.round(W.nationData(s.nation).budget * 1e6 * GRANT_FLOOR / 1000) * 1000);
    summary.grantChange = grantChange;

    // kwoty startowe
    computePeriodQuotas(0);
    summary.quota = { ...s.nations[s.nation].quota };

    // starzenie się skoczni i inspekcja FIS (przed decyzjami o gospodarzach)
    for (const h of p.hills) if (!h.building) h.condition = h.club ? U.clamp(h.condition + U.randInt(-4, 4), 45, 92) : Math.max(0, h.condition - U.randInt(3, 7) - (h.igelit ? 1 : 0));
    homolReview(summary.lines);

    // kandydatury na organizację zawodów
    p.hosted = {};
    for (const [lv, hillId] of Object.entries(p.hostBids)) {
      const r = HOST_REQ[lv];
      const h = p.hills.find((x) => x.id === hillId);
      const why = h ? canHost(lv, h) : 'brak skoczni';
      const ok = !why && Math.random() < r.chance + (p.popularity - 50) / 200;
      if (ok) { p.hosted[lv] = hillId; summary.lines.push(`✅ FIS przyznała nam organizację: ${r.label} (${h.city}).`); }
      else summary.lines.push(`❌ Kandydatura odrzucona: ${r.label}${why ? ' – ' + why : ''}.`);
    }
    // wielkie imprezy: decyzje FIS (MŚ, MŚ w lotach – 4 lata przed) i MKOl (IO – po poprzednich igrzyskach)
    SJM.CAL.decideHosts(E, summary.lines);
    // weekendy cykli na nowy sezon: utrzymanie gospodarzy, nasze kandydatury, nowi gospodarze AI
    SJM.CAL.decideCircuit(E, summary.lines);
    // uśpione nacje: rozwój nowych reprezentacji i (rzadko) przebudzenie kolejnej
    programCycles(summary.lines, hist);
    dormantSeason(summary.lines);

    // przerwa po sezonie (kwiecień – czerwiec): trening + finanse + projekty w jednym bloku;
    // lato (lipiec – połowa września) rozgrywa się tydzień po tygodniu w kalendarzu nowego sezonu, potem jedna tura przerwy jesiennej
    s.season++;
    const breakWeeks = 52 - SJM.CAL.weekCount(true);
    const breakTraining = OFFSEASON_WEEKS - SJM.CAL.SUMMER_WEEKS;
    weeklyFinance(null, breakWeeks);
    progressProjects(breakWeeks);
    for (const j of Object.values(s.jumpers)) { j.form = U.gauss(0, 2.5); j.fatigue = U.randInt(0, 15); j.morale = 55; }
    // trening w przerwie w kilku porcjach
    summerRandomness(summary.lines);
    for (let i = 0; i < 3; i++) weeklyUpdate(breakTraining / 3, false);

    // emerytury
    const retiredMine = [];
    const natLevel = {};
    for (const n of SJM.NATIONS) {
      const top = jumpersOf(n.code).map(W.overall).sort((a, b) => b - a).slice(0, 6);
      natLevel[n.code] = top.length ? U.sum(top) / top.length : 60;
    }
    const retire = (j) => Math.random() < retireChance(j, natLevel[j.nation]);
    const toRetire = new Set(Object.values(s.jumpers).filter(retire).map((j) => j.id));
    // „manewr Rosberga”: młody zdobywca Kryształowej Kuli kończy karierę na szczycie
    const champ = hist.wc[0] && s.jumpers[hist.wc[0].id];
    if (champ && !toRetire.has(champ.id) && W.age(champ) <= 29 && Math.random() < SJM.ROSBERG_CHANCE) {
      toRetire.add(champ.id);
      const mineC = champ.nation === s.nation;
      summary.lines.push(`🏆 ${W.fullName(champ)} ${W.flag(champ.nation)} kończy karierę w wieku ${W.age(champ)} lat jako zdobywca Kryształowej Kuli!`);
      news('Odchodzi jako mistrz!', `${W.fullName(champ)} (${W.nationData(champ.nation).name}) niespodziewanie ogłosił koniec kariery, zaledwie kilka tygodni po zdobyciu Kryształowej Kuli. „Osiągnąłem wszystko, o czym marzyłem. Chcę odejść na szczycie.”${mineC ? '<br><br>To ogromna strata dla naszej kadry.' : ''}`, mineC ? 'jumper' : 'world');
    }
    // nowi z majowego naboru, którzy przez cały pierwszy sezon nie wystąpili w żadnych zawodach poza mistrzostwami kraju, rezygnują
    // (poza kontuzjowanymi) – kluby nie zapełniają się zawodnikami bez szans na starty
    const quitNew = new Set(), cutMine = new Set();
    for (const j of myJumpers()) {
      if (j.newcomer === s.season - 1 && !(j.endCupStarts > 0) && j.injury <= 4 && !toRetire.has(j.id)) { toRetire.add(j.id); quitNew.add(j.id); }
    }
    // kraje AI: limit liczebności kadr
    for (const n of SJM.NATIONS) {
      const mine = n.code === s.nation;
      // gracz: odchodzą tylko najsłabsi zawodnicy klubowi (20+) przy przepełnieniu
      let left = jumpersOf(n.code).filter((j) => !toRetire.has(j.id));
      const cap = (s.nations[n.code] && s.nations[n.code].cap) || n.depth;
      const max = mine ? Math.round(cap * 1.25) : cap;
      if (left.length <= max) continue;
      const over = left.length - max;
      if (mine) left = left.filter((j) => (j.group || 'R') === 'R' && W.age(j) >= 20);
      left.sort((a, b) => (W.overall(a) - W.age(a) * 0.5) - (W.overall(b) - W.age(b) * 0.5)).slice(0, over).forEach((j) => { toRetire.add(j.id); if (mine) cutMine.add(j.id); });
    }
    // wiadomość o wszystkich naszych zawodnikach kończących karierę (także słabych i z klubów)
    const leaving = myJumpers().filter((j) => toRetire.has(j.id));
    if (leaving.length) {
      const GROUP = { A: 'kadra A', B: 'kadra B', J: 'juniorzy', R: 'klub' };
      const careerOf = (c) => {
        const m = c.medals || { g: 0, s: 0, b: 0 }, nm = m.g + m.s + m.b;
        const parts = [c.wins && `${c.wins} zw. w PŚ`, c.podiums && `${c.podiums} pod.`, nm && `medale ${m.g}/${m.s}/${m.b}`,
          c.globes && `Kryształowe Kule: ${c.globes}`, c.tcs && `TCS: ${c.tcs}`].filter(Boolean);
        return parts.length ? parts.join(', ') : c.wcStarts ? 'starty w PŚ, bez podium' : 'bez startów w PŚ';
      };
      const why = (j) => (quitNew.has(j.id) ? 'rezygnacja – brak startów w pierwszym sezonie' : cutMine.has(j.id) ? 'brak miejsca w klubie' : j.id === (champ && champ.id) ? 'odchodzi jako zdobywca Kryształowej Kuli' : 'koniec kariery');
      const rows = leaving.sort((a, b) => W.overall(b) - W.overall(a)).map((j) =>
        `<tr><td>${U.esc(W.fullName(j))}</td><td class="num">${W.age(j)} l.</td><td>${GROUP[j.group || 'R']}</td><td class="num">${Math.round(W.overall(j))}</td><td class="small">${careerOf(j.career)}</td><td class="small muted">${why(j)}</td></tr>`).join('');
      news(`Koniec kariery: ${leaving.length} ${leaving.length === 1 ? 'zawodnik' : 'zawodników'} z naszej kadry`,
        `Po sezonie ${summary.label} z naszej kadry odchodzą:<br><table class="small"><tr><th>Zawodnik</th><th class="num">Wiek</th><th>Grupa</th><th class="num">Ocena</th><th>Kariera</th><th>Powód</th></tr>${rows}</table>`, 'jumper');
    }
    const retiredAll = [];
    for (const j of Object.values(s.jumpers)) {
      const a = W.age(j);
      if (toRetire.has(j.id)) {
        retiredAll.push(j);
        delete s.jumpers[j.id];
        if (j.career.podiums || j.career.medals.g + j.career.medals.s + j.career.medals.b || j.nation === s.nation && j.career.wcStarts) {
          s.retired.push({ name: W.fullName(j), nat: j.nation, born: j.born, wins: j.career.wins, podiums: j.career.podiums, real: !!j.real, medals: j.career.medals, globes: j.career.globes, tcs: j.career.tcs, retired: s.season, rp: true });
        }
        if (j.nation === s.nation && !quitNew.has(j.id)) retiredMine.push(`${W.fullName(j)} (${a} l.)`);
      }
    }
    if (retiredMine.length) summary.lines.push('👋 Karierę zakończyli: ' + retiredMine.join(', '));
    if (quitNew.size) summary.lines.push(`🚪 Bez startu w pierwszym sezonie (nie licząc mistrzostw kraju) zrezygnowali nowi z naboru (${quitNew.size}): ` + retiredAll.filter((j) => quitNew.has(j.id)).map((j) => W.fullName(j)).join(', '));

    // nabór młodzieży: talenty zgłaszają się do klubów w maju (przerwa liczona jest jednym blokiem,
    // więc wiadomość dostaje datę 15 maja); w zakładce Kluby są oznaczeni jako nowi do końca sezonu
    const newMine = youthIntake();
    p.youthBonus = 0;
    tickMods(8);
    summary.youth = newMine;
    for (const id of newMine) s.jumpers[id].newcomer = s.season;
    if (newMine.length) {
      const list = newMine.map((id) => s.jumpers[id]).sort((a, b) => potEstimate(b) - potEstimate(a));
      const starsTxt = (v) => { const n = U.clamp(Math.round((v - 45) / 10 * 2) / 2, 0.5, 5); return '★'.repeat(Math.floor(n)) + (n % 1 ? '½' : ''); };
      news(`Nabór do klubów: ${list.length} ${list.length === 1 ? 'nowy talent' : list.length < 5 ? 'nowe talenty' : 'nowych talentów'}`,
        `Do naszych klubów zgłosili się nowi zawodnicy. Znajdziesz ich w zakładce Kadra → Kluby (oznaczeni 🆕). Najzdolniejszych warto przenieść do kadry juniorów.<br><br>` +
        list.map((j) => `<a data-act="jumper" data-id="${j.id}">${U.esc(W.fullName(j))}</a> (${W.age(j)} l.) – ocena ${Math.round(W.overall(j))}, potencjał ${starsTxt(potEstimate(j))}`).join('<br>'),
        'youth', `${s.season}-05-15T12:00:00.000Z`);
    }

    // rynek sztabu
    // rynek sztabu: wolni agenci przechodzą na kolejny rok (można ich planować w sezonie);
    // starzeją się, rozwijają, część kończy kariery albo znajduje pracę poza skokami; dochodzą nowi
    s.staffGone = s.staffGone || [];
    const stay = s.staffMarket.filter((x) => {
      x.age++;
      if (Math.random() < staffRetireChance(x.age)) { s.staffGone.push(staffName(x)); return false; }
      return Math.random() < 0.75;
    });
    stay.forEach((x) => developStaff(x, null));
    s.staffMarket = stay.slice(0, 40);
    s.staffMarket.push(...W.genStaffMarket());
    // część byłych skoczków zaczyna pracę w sztabach
    const exStaff = W.exJumperStaff(retiredAll);
    s.staffMarket.push(...exStaff);
    const exMine = exStaff.filter((x) => x.nation === s.nation);
    if (exMine.length) summary.lines.push('🎓 Na rynek sztabu trafili nasi byli skoczkowie: ' + exMine.map((x) => `${x.first} ${x.last} (${SJM.STAFF_ROLES[x.role].name})`).join(', '));
    // sztaby: starzenie, emerytury i karuzela trenerska w krajach AI
    staffSeason(summary, order);

    setExpectation(myRank);
    startSeason(false);
    // niepełnoletni z kadry juniorów, którzy przekroczyli wiek
    for (const j of myJumpers()) if (j.group === 'J' && !isJunior(j)) j.group = 'B';
    for (const j of myJumpers()) if (!j.group) j.group = 'R';
    summary.expectation = expectationText();
    if (SJM.EV) SJM.EV.roll("summer", true);
    s.lastSummary = summary;
    news(`Sezon ${summary.label} zakończony`, `Puchar Narodów: <b>${myRank}. miejsce</b> (cel: ${exp.nc}.).<br>Ocena zarządu: ${Math.round(p.board)}/100.<br><br>Nowy sezon – oczekiwania: ${expectationText()}`, 'board');
  }

  function retireChance(j, level) {
    const a = W.age(j), rel = W.overall(j) - level;
    // ryzyko rośnie z każdym rokiem (średnio jak dawne progi: 31–33 ≈ 10%, 34–36 ≈ 35%)
    const AGE_RETIRE = { 29: 0.02, 30: 0.04, 31: 0.07, 32: 0.10, 33: 0.14, 34: 0.24, 35: 0.34, 36: 0.46, 37: 0.65, 38: 0.8 };
    let pr = a >= 39 ? 0.9 : (AGE_RETIRE[a] || 0);
    if (rel < -18 && a >= 23) pr += 0.3;
    if (rel < -26 && a >= 20) pr += 0.3;
    if (W.overall(j) < 38 && a >= 17) pr += 0.3;
    // ciężki uraz w minionym sezonie: starsi częściej kończą kariery
    if (j.severeSeason === st().season - 1 || j.injury > 20) pr += a >= 30 ? 0.25 : a >= 26 ? 0.08 : 0.02;
    // weterani wciąż skaczący w czołówce kraju i długowieczni rzadziej kończą kariery
    if (a >= 31 && rel > -4) pr *= 0.75;
    if (SJM.T.has(j, 'longevity')) pr *= 0.55;
    if (SJM.T.has(j, 'earlyage') && a >= 29) pr += 0.08;
    // brak perspektyw: młody zawodnik, który prawie nie startował i stracił motywację
    if (a >= 19 && a <= 26 && (j.endStarts || 0) <= 2 && j.injury <= 4 && (j.endMorale !== undefined ? j.endMorale : 55) < 50) {
      let add = 0.22;
      if (SJM.T.has(j, "workhorse")) add *= 0.5;
      if (j.nation === st().nation) { const ps = st().player.staff.psych; add *= 1 - (ps ? ps.quality : 20) / 200; }
      pr += add;
    }
    // „kiszenie się” w niższych seriach: senior latami bez PŚ/LGP traci motywację i sponsorów, idzie do pracy/na studia
    const low = j.lowYears || 0;
    if (a >= 23 && low >= 2 && j.injury <= 4) {
      let add = 0.12 + 0.09 * (low - 2) + (a >= 27 ? 0.08 : 0) + (a >= 30 ? 0.08 : 0);
      if (W.overall(j) - (j.ovrStart || W.overall(j)) >= 2) add *= 0.5; // wyraźny postęp daje nadzieję
      if (SJM.T.has(j, 'workhorse')) add *= 0.6;
      if (j.nation === st().nation) { const ps = st().player.staff.psych; add *= 1 - (ps ? ps.quality : 20) / 250; }
      pr += Math.min(0.55, add);
    }
    if (j.quitRisk) pr += 0.35;
    return pr;
  }

  // ---------- „Uśpione nacje”: kraje bez kadry, które dołączają w trakcie gry ----------
  // reason: 'owg' (gospodarz IO – szybki, państwowy program) albo tekst wydarzenia; zwraca linię do podsumowania
  function joinNation(code, reason, owgYear) {
    const s = st();
    s.dormant = s.dormant || {};
    if (s.dormant[code] || s.nations[code]) return null;
    const def = SJM.DORMANT_NATIONS.find((d) => d.code === code);
    if (!def) return null;
    const owg = reason === 'owg';
    s.dormant[code] = { joined: s.season + 1, reason: owg ? `gospodarz IO ${owgYear}` : reason, strength: def.strength + (owg ? 6 : 0),
      pop: def.pop + (owg ? 10 : 0), budget: Math.round(def.budget * (owg ? 2.5 : 1) * 10) / 10, cap: owg ? 34 : U.randInt(18, 26), depth: def.depth + (owg ? 3 : 0), owgYear: owgYear || null };
    W.syncNations(s);
    const n = W.nationData(code);
    s.nations[code] = { code, ai: W.aiProfile(n), quota: { WC: 1, COC: 2, FIS: QUOTA_RULES.fisQuota }, budget: n.budget, cap: n.depth + (owg ? 4 : 2) };
    // pierwsza kadra: głównie nastolatki, czasem przekwalifikowani biegacze/kombinatorzy/alpejczycy
    const potMean = 50 + n.strength * 0.32 + (owg ? 3 : 0);
    const size = n.depth;
    for (let i = 0; i < size; i++) {
      const convert = i === 0 || Math.random() < 0.2;
      const j = W.genJumper(code, convert ? U.randInt(19, 25) : U.randInt(15, 18), potMean, 8);
      s.jumpers[j.id] = j;
    }
    s.nations[code].staff = W.genAiStaff(code);
    W.syncAi(code);
    // ośrodek startowy: mała skocznia (i średnia przy programie olimpijskim)
    s.extraHills = s.extraHills || [];
    const mk = (K) => s.extraHills.push({ id: `dorm_${code.toLowerCase()}_${K}`, name: `${def.city} HS${Math.round(K * 1.1)}`, city: def.city, nation: code, K, HS: Math.round(K * 1.1), club: true });
    mk(40); if (owg) mk(70);
    const flagName = `${W.flag(code)} ${n.name}`;
    const body = owg
      ? `${flagName} jako gospodarz Zimowych Igrzysk ${owgYear} musi wystawić skoczków i zbudować skocznie. Państwo finansuje program olimpijski: ${size} zawodników, sztab i ośrodek w ${def.city}. Kraj ${def.story}. Nowa kadra będzie szybko rosła w siłę do igrzysk.`
      : `${reason}. ${flagName} – kraj ${def.story}. Do rywalizacji dołącza ${size} zawodników – na razie to początkujący, ale program ma się rozwijać przez kolejne sezony.`;
    news(`🌱 Nowa reprezentacja: ${n.name}`, body, 'world');
    return `🌱 Do rywalizacji dołącza nowa reprezentacja: ${flagName} (${owg ? 'program olimpijski' : 'nowy program skoków'}).`;
  }
  // cykle programów krajów AI: siła błądzi losowo i wraca do średniej (pokolenia, finansowanie, trenerzy),
  // a dominator traci trochę przewagi (rywale kopiują rozwiązania, podkupują sztab) – bez wiecznych hegemonii
  function programCycles(lines, hist) {
    const s = st();
    const rank = {}; (hist.nc || []).forEach((x, i) => (rank[x.nat] = i + 1));
    for (const n of SJM.NATIONS) {
      if (n.code === s.nation || !s.nations[n.code] || (s.dormant && s.dormant[n.code])) continue;
      const x = s.nations[n.code];
      const prev = x.drift || 0;
      const success = rank[n.code] === 1 ? 1.2 : rank[n.code] === 2 ? 0.6 : 0;
      x.drift = U.clamp(prev * 0.85 + U.gauss(0, 2.2) - success, -12, 12);
      const name = `${W.flag(n.code)} ${n.name}`;
      if (x.drift >= 6 && prev < 6) lines.push(`📈 ${name}: boom w szkoleniu – mocne roczniki i inwestycje w dyscyplinę.`);
      if (x.drift <= -6 && prev > -6) lines.push(`📉 ${name}: kryzys szkolenia – słabsze roczniki i cięcia w związku.`);
    }
    W.syncNations(s);
  }
  // po sezonie: rozwój młodych reprezentacji i (rzadko) przebudzenie kolejnej
  function dormantSeason(lines) {
    const s = st();
    s.dormant = s.dormant || {};
    for (const [code, d] of Object.entries(s.dormant)) {
      const owgSoon = d.owgYear && d.owgYear >= s.season + 1;
      const step = owgSoon ? 3 : d.strength < d.cap ? 1.2 : 0;
      d.strength = Math.min(owgSoon ? 40 : d.cap, d.strength + step * (0.6 + Math.random() * 0.8));
      d.pop = Math.min(40, (d.pop || 5) + (owgSoon ? 2 : 0.5));
      d.depth = Math.min(owgSoon ? 16 : 12, (d.depth || W.nationData(code).depth) + (owgSoon ? 1.5 : 0.6));
      const n = W.nationData(code);
      if (n) { n.strength = Math.round(d.strength); n.pop = Math.round(d.pop); n.depth = Math.round(d.depth); if (s.nations[code]) { Object.assign(s.nations[code].ai, W.aiProfile(n)); W.syncAi(code); } }
      // kadra rośnie wraz z programem
      if (s.nations[code] && s.nations[code].cap < 14) s.nations[code].cap += 1;
    }
    for (const def of SJM.DORMANT_NATIONS) {
      if (s.dormant[def.code] || s.nations[def.code]) continue;
      if (Math.random() < def.join) { const l = joinNation(def.code, U.pick(SJM.DORMANT_REASONS)); if (l) lines.push(l); break; }
    }
  }

  function youthIntake() {
    const s = st();
    const mine = [];
    for (const n of SJM.NATIONS) {
      const isP = n.code === s.nation;
      let count, potMean;
      if (isP) {
        const p = s.player;
        const acc = hillAccess(n.code);
        const sc = p.staff.scout ? p.staff.scout.quality : 20;
        // ten sam wzór co u AI (liczebność i siła kraju); akademia, skaut, popularność i małe skocznie
        // działają jako odchylenie od poziomu, który kraj AI ma domyślnie
        const def = W.aiProfile(n), have = jumpersOf(n.code).length;
        const c = Math.max(1, Math.round(n.depth / 7)) + (have < n.depth * 0.85 ? 2 : 0) + (p.youthBonus || 0)
          + (p.facilities.academy - def.academy) * 0.8 + ((acc.youth || 0) - SMALL_HILL_REF) * 0.5 + (p.popularity - n.pop) / 30;
        count = Math.max(1, Math.floor(c) + (Math.random() < c - Math.floor(c) ? 1 : 0));
        potMean = YOUTH_POT(n.strength) + (p.youthBonus || 0) * 1.5 + (p.facilities.academy - def.academy) * 2.2 + (sc - def.scout) * 0.05 + (p.popularity - n.pop) * 0.04;
      } else {
        const have = jumpersOf(n.code).length;
        // małe skocznie działają tak samo jak u gracza (odchylenie od przeciętnego kraju)
        const smallN = SJM.HILLS.concat(s.extraHills || []).filter((h) => h.nation === n.code && h.K < 85).length;
        const c = Math.max(1, Math.round(n.depth / 7)) + (have < n.depth * 0.85 ? 2 : 0) - (have > n.depth * 1.2 ? 2 : 0) + (smallHillBonus(smallN) - SMALL_HILL_REF) * 0.5;
        count = Math.max(1, Math.floor(c) + (Math.random() < c - Math.floor(c) ? 1 : 0));
        potMean = YOUTH_POT(n.strength);
      }
      // gospodarz IO w ciągu 6 lat: boom na skoki – więcej i zdolniejsza młodzież (słabszym krajom pomaga to bardziej)
      if (SJM.CAL.olympicHostSoon(n.code, s.season + 1, 6)) {
        count += 2;
        potMean += n.strength < 60 ? 5 : 2;
      }
      // loteria talentów: poza ścisłą czołówką co jakiś czas trafia się junior na miarę PŚ (jak Mizernykh czy Kapustík)
      const gifted = n.strength < GIFTED.maxStrength && Math.random() < GIFTED.chance;
      for (let i = 0; i < count + (gifted ? 1 : 0); i++) {
        const j = gifted && i === count ? W.genJumper(n.code, U.randInt(15, 16), GIFTED.pot, GIFTED.sd) : W.genJumper(n.code, U.randInt(15, 16), potMean, 9);
        j.group = isP ? 'R' : null;
        s.jumpers[j.id] = j;
        if (isP) mine.push(j.id);
      }
    }
    return mine;
  }
  // średni potencjał naboru wg siły kraju (słabszy wpływ siły niż dawniej – talenty nie skupiają się w kilku krajach)
  const YOUTH_POT = (strength) => 53 + strength * 0.28;
  const GIFTED = { maxStrength: 80, chance: 0.08, pot: 88, sd: 4 };

  // szacowanie potencjału (zależne od koordynatora szkolenia)
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }
  function potEstimate(j) {
    const s = st();
    const sc = j.nation === s.nation ? (s.player.staff.scout ? s.player.staff.scout.quality : 20) : 25;
    const err = (100 - sc) / 6;
    const noise = (hash(j.id + s.season) - 0.5) * 2 * err;
    return U.clamp(Math.max(W.overall(j), j.pot + noise), 1, 99);
  }

  return {
    turn, migrate, news, myJumpers, jumpersOf, costScale, initStartingPoints, computePeriodQuotas, periodBonusPreview, quotaWhy, hasNationalGroup, hostBonusIn, nationalGroupChoice, setNationalGroup, OLY, olyStart, olyYearOf, olyCutoff, olympicAllocation, rollingPts, hasSummer, currentPeriod, licenseFor, ineligibleReason, pointsOf, HOST_BONUS, QUOTA_RULES, titleHolders, DELEGABLE, isDelegated, setDelegated, jumperStatus, setStatus, deadline, confirmNominations, unconfirmNominations, assistantFill, needsNominations, ledger, modVal, addMod, tickMods, mods, isJunior, available, currentWeek, quotaFor, weekLevels, eligible,
    lastWeekendNote, autoGroups, setGroup, groupCount, GROUP_LIMITS, groupDraft, draftGroupOf, draftCount, draftGroup, draftOverLimit, confirmGroups, discardGroups, ensureNominations, nominationLevelOf, setNomination,
    playWeek, annualCosts, annualIncome, buildHill, hillSites, nextHillCity, randomHillCity, modernize, addIgelit, addLights, demolish, upgradeFacility,
    payrollRoom, payrollCap, payrollFrozen, coachLimit, coachMoves, promoteCoach, isCoach, teamChangeInfo, setTeamChange, wjcReserve, joinNation, HOST_REQ, HOMOL, HOMOL_ORDER, LEVEL_CLASS, homolClass, homolMeets, homolBest, homolCost, homologate, canHost, bid, unbid, MAX_CYCLE_BIDS, hire, fire, renewOffer, finishRenewals, staffBid, skipRound, passRole, finishWindow, ROLE_ORDER, staffAsk, staffProspect, interimStaff, rivalsFor, freeFor, vacancies, prestige, expectationText, startSeason, endSeason, ncOrder, rankOf, potEstimate,
    hillAccess, JUNIOR_MAX_AGE, hillProjectBusy, hostNationOf, teamFor, CUP_KEY,
  };
})();
