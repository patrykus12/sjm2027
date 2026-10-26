// ===== Kalendarz sezonu =====
SJM.CAL = (function () {
  const U = SJM.U;

  function firstSaturday(year, month, day) {
    const d = new Date(year, month, day);
    while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
    return d;
  }

  // Szablon tygodni zimy: indeks tygodnia od pierwszego weekendu PŚ.
  // wc/coc/fis: [domyślny gospodarz weekendu, formaty] – gospodarzy weekendów ustala co roku FIS (s.circuit),
  // stałe są tylko TCS i finał PŚ w Planicy. bigIf: tydzień przejmuje impreza mistrzowska w swoim roku.
  // Raw Air / Turniej Nordycki powstaje sam, gdy 3 kolejne weekendy PŚ wypadną w krajach nordyckich.
  const NORDIC = ['NOR', 'FIN', 'SWE'];
  const WINTER = [
    { wc: ['lillehammer', ['ind', 'ind']], coc: ['lahti', ['ind', 'ind']], fis: ['otepaa', ['ind', 'ind']] },
    { wc: ['ruka', ['ind', 'ind']], coc: ['falun', ['ind', 'ind']], fis: ['kandersteg', ['ind', 'ind']] },
    { wc: ['wisla', ['ind', 'ind']], coc: ['ruka', ['ind', 'ind']], fis: ['vorokhta', ['ind', 'ind']] },
    { wc: ['klingenthal', ['ind', 'ind']], coc: ['oberstdorf', ['ind', 'ind']], fis: ['villach', ['ind', 'ind']] },
    { wc: ['engelberg', ['ind', 'ind']], coc: ['predazzo', ['ind', 'ind']], fis: ['planica_nh', ['ind', 'ind']] },
    { tour: 'TCS', label: 'Turniej Czterech Skoczni', tcs: ['oberstdorf', 'garmisch', 'innsbruck', 'bischofshofen'], coc: ['engelberg', ['ind', 'ind']], fis: ['szczyrk', ['ind', 'ind']] },
    { wc: ['zakopane', ['team', 'ind']], coc: ['garmisch', ['ind', 'ind']], fis: ['borovets', ['ind', 'ind']] },
    { wc: ['oberstdorf_f', ['ind', 'ind']], coc: ['zakopane', ['ind', 'ind']], fis: ['zakopane_nh', ['ind', 'ind']] },
    { wc: ['sapporo', ['ind', 'ind']], bigIf: 'SFWC', coc: ['sapporo', ['ind', 'ind']], fis: ['falun_nh', ['ind', 'ind']] },
    { wc: ['willingen', ['ind', 'ind']], coc: ['brotterode', ['ind', 'ind']], fis: ['rasnov', ['ind', 'ind']] },
    { wc: ['lake_placid', ['ind', 'ind']], bigIf: 'WCH_OWG', coc: ['iron_mountain', ['ind', 'ind']], fis: ['liberec_nh', ['ind', 'ind']] },
    { wc: ['lahti', ['team', 'ind']], wjc: true, coc: ['falun', ['ind', 'ind']], fis: ['erzurum_nh', ['ind', 'ind']] },
    { wc: ['oslo', ['ind', 'ind']], coc: ['liberec', ['ind', 'ind']], fis: ['ljubno', ['ind', 'ind']] },
    { wc: ['trondheim', ['ind', 'ind']], coc: ['erzurum', ['ind', 'ind']], fis: ['lahti_nh', ['ind', 'ind']] },
    { wc: ['vikersund', ['ind', 'ind']], coc: ['chaux_neuve', ['ind', 'ind']], fis: ['otepaa', ['ind', 'ind']] },
    { wc: ['planica_f', ['ind', 'team', 'ind']], fixedWC: true, coc: ['almaty', ['ind', 'ind']], fis: ['hinzenbach', ['ind', 'ind']] },
    { nat: true },
  ];
  // impreza mistrzowska w tygodniu bigIf (rok zakończenia sezonu E)
  function bigOf(t, E) {
    if (t.bigIf === 'SFWC') return E % 4 === 0 ? 'SFWC' : null;
    if (t.bigIf === 'WCH_OWG') return E % 4 === 2 ? 'OWG' : E % 2 === 1 ? 'WCH' : null;
    return null;
  }

  // Lato: 10 weekendów (lipiec – połowa września), w każdy LGP, Letni PK i FIS Cup; potem przerwa jesienna
  // (FIS Cup ma jedną klasyfikację łączną: lato + zima)
  const SUMMER = [
    { sgp: ['hinterzarten', ['team', 'ind']], scoc: ['kranj', ['ind', 'ind']], fis: ['villach', ['ind', 'ind']] },
    { sgp: ['wisla', ['ind', 'ind']], scoc: ['kandersteg', ['ind', 'ind']], fis: ['szczyrk', ['ind', 'ind']] },
    { sgp: ['courchevel', ['ind', 'ind']], scoc: ['stams', ['ind', 'ind']], fis: ['otepaa', ['ind', 'ind']] },
    { sgp: ['frenstat', ['ind', 'ind']], scoc: ['einsiedeln', ['ind', 'ind']], fis: ['ljubno', ['ind', 'ind']] },
    { sgp: ['hakuba', ['ind', 'ind']], scoc: ['oberstdorf', ['ind', 'ind']], fis: ['predazzo_nh', ['ind', 'ind']] },
    { sgp: ['almaty', ['ind', 'ind']], scoc: ['wisla', ['ind', 'ind']], fis: ['zakopane_nh', ['ind', 'ind']], slotHostSCOC: true },
    { sgp: ['predazzo', ['ind', 'ind']], scoc: ['rasnov', ['ind', 'ind']], fis: ['szczyrk', ['ind', 'ind']], slotHostSGP: true },
    { sgp: ['hinzenbach', ['ind', 'ind']], scoc: ['frenstat', ['ind', 'ind']], fis: ['kandersteg', ['ind', 'ind']] },
    { sgp: ['zakopane', ['ind', 'ind']], scoc: ['klingenthal', ['ind', 'ind']], fis: ['rasnov', ['ind', 'ind']] },
    { sgp: ['klingenthal', ['ind', 'ind']], scoc: ['hinterzarten', ['ind', 'ind']], fis: ['einsiedeln', ['ind', 'ind']] },
  ];
  const PREP_WEEKS = 2;
  // przerwa jesienna między latem a przygotowaniami: trening, jedna tura obejmuje wszystkie jej tygodnie
  const AUTUMN_WEEKS = 7;
  function weekCount(withSummer) { return (withSummer ? SUMMER.length + AUTUMN_WEEKS : 0) + PREP_WEEKS + WINTER.length; }

  // ---------- Gospodarze weekendów cykli (PŚ, LGP, PK, LPK, FIS Cup) ----------
  // s.circuit[cykl][slot] = id skoczni ('W3' – 4. tydzień zimy, 'S5' – 6. tydzień lata). Skocznia, która utrzyma się
  // w kalendarzu, zostaje na swoim weekendzie. Po sezonie FIS: utrzymanie gospodarzy, potem wolne weekendy
  // rozdzielane między kandydatury – gracz i kraje AI mają te same zasady i ten sam wzór szans.
  const CYCLES = { WC: 'Puchar Świata', SGP: 'Letnie Grand Prix', COC: 'Puchar Kontynentalny', SCOC: 'Letni PK', FIS: 'FIS Cup' };
  const RETAIN = { WC: 0.85, SGP: 0.8, COC: 0.75, SCOC: 0.75, FIS: 0.75 };
  const NATION_CAP = { WC: 4, SGP: 2, COC: 4, SCOC: 3, FIS: 5 };
  const MIN_K = { WC: 110, SGP: 85, COC: 85, SCOC: 85, FIS: 75 };
  const MAX_BIDS = 3;
  const BID_STEP = [1, 0.7, 0.5]; // 2. i 3. kandydatura kraju w tym samym cyklu ma mniejszą wagę
  const FLY_MIN = 2, FLY_MAX = 4; // weekendy lotów w PŚ, razem z finałem w Planicy
  const SLOT_KEY = { wc: 'WC', coc: 'COC', fis: 'FIS', sgp: 'SGP', scoc: 'SCOC' };
  // skocznie AI z igelitem (obiekty letnich zawodów)
  const SUMMER_VENUES = new Set(SUMMER.flatMap((t) => ['sgp', 'scoc', 'fis'].filter((k) => t[k]).map((k) => t[k][0])));
  // obiekty stałe w kalendarzu PŚ (TCS, finał w Planicy) – nie dostają dodatkowych weekendów
  const FIXED_WC = new Set(WINTER.flatMap((t) => (t.tcs || []).concat(t.fixedWC ? [t.wc[0]] : [])));
  // strefa turnieju nordyckiego: 3 ostatnie weekendy PŚ przed finałem w Planicy
  const NORDIC_ZONE = (() => {
    const fin = WINTER.findIndex((t) => t.fixedWC);
    return WINTER.map((t, i) => [t, i]).filter(([t, i]) => i < fin && t.wc && !t.fixedWC).slice(-3).map(([, i]) => 'W' + i);
  })();

  function slotDefs() {
    const out = { WC: [], SGP: [], COC: [], SCOC: [], FIS: [] };
    const add = (t, key, slot, summer) => {
      if (!t[key] || (key === 'wc' && t.fixedWC)) return;
      out[SLOT_KEY[key]].push({ slot, def: t[key][0], fmts: t[key][1], summer });
    };
    SUMMER.forEach((t, i) => ['sgp', 'scoc', 'fis'].forEach((k) => add(t, k, 'S' + i, true)));
    WINTER.forEach((t, i) => ['wc', 'coc', 'fis'].forEach((k) => add(t, k, 'W' + i, false)));
    return out;
  }
  const SLOTS = slotDefs();

  function circuit() {
    const s = S();
    if (!s.circuit) {
      s.circuit = {};
      s.summer10 = true;
      for (const [c, list] of Object.entries(SLOTS)) s.circuit[c] = Object.fromEntries(list.map((d) => [d.slot, d.def]));
    }
    // zapisy sprzed 10 letnich weekendów: letnie weekendy od nowa według nowego kalendarza,
    // nasze skocznie zachowują miejsce w cyklu (na jednym z nowych weekendów)
    if (!s.summer10) {
      s.summer10 = true;
      for (const [c, list] of Object.entries(SLOTS)) {
        const cur = s.circuit[c], sum = list.filter((d) => d.summer);
        if (!sum.length) continue;
        const mine = [...new Set(Object.entries(cur).filter(([k, v]) => k[0] === 'S' && v && isMine(v)).map(([, v]) => v))];
        for (const k of Object.keys(cur)) if (k[0] === 'S') delete cur[k];
        sum.forEach((d) => (cur[d.slot] = d.def));
        mine.filter((v) => !Object.values(cur).includes(v)).forEach((v, i) => { const d = sum[(2 + i * 3) % sum.length]; if (!isMine(cur[d.slot])) cur[d.slot] = v; });
      }
    }
    // weekendy cykli dodane w nowszej wersji – domyślni gospodarze
    for (const [c, list] of Object.entries(SLOTS)) for (const d of list) if (!(d.slot in s.circuit[c])) s.circuit[c][d.slot] = d.def;
    // zapisy z wersji z Raw Air jako pakietem
    for (const [k, v] of Object.entries(s.circuit.WC)) if (v === 'RAW') s.circuit.WC[k] = Object.values(s.circuit.WC).includes('vikersund') ? 'oslo' : 'vikersund';
    return s.circuit;
  }
  const isMine = (id) => S().player.hills.some((h) => h.id === id);
  const venueNat = (id) => (isMine(id) ? S().nation : (SJM.W.getHill(id) || {}).nation);
  const venueCity = (id) => (SJM.W.getHill(id) || {}).city;
  const isFly = (id) => { const h = SJM.W.getHill(id); return !!h && h.K >= 170; };
  // popularność skoków w kraju – ta sama miara dla gracza i AI
  const natPop = (nat) => (nat === S().nation ? S().player.popularity : SJM.W.nationData(nat).pop);
  function hillsOfVenue(id) { return [id]; }

  // miasta, w których w sezonie E odbywa się impreza mistrzowska (bez zwykłych zawodów zimą; TCS i Planica wyjątkami)
  function bigCities(E) {
    const cities = new Set();
    const add = (id) => { const h = id && SJM.W.getHill(id); if (h) cities.add(h.city); };
    if (E % 4 === 2) { const v = hostOf('OWG', E); add(v.nh); add(v.lh); }
    if (E % 2 === 1) { const v = hostOf('WCH', E); add(v.nh); add(v.lh); }
    if (E % 4 === 0) add(hostOf('SFWC', E).hill);
    return cities;
  }

  // czy skocznia może przejąć weekend: rozmiar wg cyklu, mamuty tylko w PŚ (zimą), latem tylko obiekty z igelitem
  function fits(cycle, def, id) {
    const h = SJM.W.getHill(id);
    if (!h || h.K < MIN_K[cycle]) return false;
    if (h.K >= 170 && (cycle !== 'WC' || def.summer)) return false;
    if (cycle === 'WC' && FIXED_WC.has(id)) return false;
    if (def.summer) return isMine(id) ? !!h.igelit : SUMMER_VENUES.has(id) || /^oly/.test(id);
    return true;
  }
  // waga kandydatury – jeden wzór dla gracza i AI: popularność skoków w kraju, tradycja obiektu, duża skocznia, kolejność
  function bidWeight(cycle, id, order) {
    const h = SJM.W.getHill(id), nat = venueNat(id);
    const tradition = SLOTS[cycle].some((d) => d.def === id) ? 1 : 0;
    return (0.5 + natPop(nat) / 100 + tradition + (h.K >= 120 ? 0.2 : 0)) * BID_STEP[order];
  }
  function natCounts(cycle) {
    const out = {};
    Object.values(circuit()[cycle]).forEach((v) => { if (v) { const n = venueNat(v); out[n] = (out[n] || 0) + 1; } });
    return out;
  }
  // zastępstwo / awaryjne obsadzenie: dowolny obiekt AI spełniający wymogi
  function aiCandidates(cycle, def, taken, exclCities) {
    const s = S(), c = circuit()[cycle], perNat = natCounts(cycle);
    const inCycle = new Set(Object.values(c).concat([...taken]));
    return SJM.HILLS.concat(s.extraHills || []).filter((h) => h.nation !== s.nation && !inCycle.has(h.id) && (perNat[h.nation] || 0) < NATION_CAP[cycle]
      && !(exclCities && exclCities.has(h.city)) && fits(cycle, def, h.id))
      .map((h) => [h.id, bidWeight(cycle, h.id, 0)]);
  }
  // kandydatury krajów AI: nie każdy kraj kandyduje co roku; do 3 obiektów, najpierw najbardziej „naturalne”
  function aiBids(cycle, dropped) {
    const s = S(), c = circuit()[cycle];
    const inCycle = new Set(Object.values(c).concat([...(dropped || [])]));
    const out = [];
    for (const n of SJM.NATIONS) {
      if (n.code === s.nation || Math.random() > 0.3 + n.pop / 200) continue;
      const hills = SJM.HILLS.concat(s.extraHills || []).filter((h) => h.nation === n.code && !inCycle.has(h.id)
        && (fits(cycle, { summer: false }, h.id) || fits(cycle, { summer: true }, h.id)));
      hills.map((h) => [h.id, bidWeight(cycle, h.id, 0) * (0.6 + Math.random() * 0.8)]).sort((a, b) => b[1] - a[1])
        .slice(0, U.randInt(1, MAX_BIDS)).forEach(([id], i) => out.push({ id, nat: n.code, order: i }));
    }
    return out;
  }

  // gospodarz weekendu w sezonie E (zimą bez obiektów imprezy mistrzowskiej – wtedy jednorazowe zastępstwo)
  function slotVenue(cycle, def, E, used) {
    const v = circuit()[cycle][def.slot];
    const excl = def.summer ? null : bigCities(E);
    const ok = v && SJM.W.getHill(v) && !(excl && excl.has(venueCity(v)));
    if (ok && !(isMine(v) && SJM.W.getHill(v).building)) return { hill: v, standIn: false };
    const cand = aiCandidates(cycle, def, used, excl);
    // brak zastępcy – weekend w tym sezonie wypada
    return { hill: cand.length ? weighted(cand) : null, standIn: true };
  }

  // decyzje FIS po sezonie E: kalendarz cykli na sezon E+1. Te same zasady dla gracza i krajów AI.
  function decideCircuit(E, lines) {
    const s = S(), p = s.player, M = SJM.M;
    const c = circuit();
    const changes = [];
    for (const cycle of Object.keys(CYCLES)) {
      const defs = SLOTS[cycle], cur = c[cycle];
      // 1. utrzymanie gospodarzy (nasze skocznie dodatkowo muszą spełniać wymogi – stan obiektów AI nie jest śledzony)
      const freed = [];
      for (const d of defs) {
        const v = cur[d.slot];
        const h = v && SJM.W.getHill(v);
        let why = !h ? 'brak obiektu' : null;
        if (h && isMine(v)) why = M.canHost(cycle, p.hills.find((x) => x.id === v));
        const keep = !why && Math.random() < RETAIN[cycle] + (natPop(venueNat(v)) - 50) / 500;
        if (isMine(v)) {
          if (why) lines.push(`⚠ ${CYCLES[cycle]}: ${h ? h.city : '?'} traci weekend (${why}).`);
          else if (!keep) lines.push(`❌ ${CYCLES[cycle]}: FIS nie przedłużyła nam weekendu w ${h.city}.`);
        }
        if (!keep) freed.push(d);
      }
      // co roku przynajmniej jeden weekend zmienia gospodarza
      if (!freed.length) freed.push(U.pick(defs));
      const old = Object.fromEntries(freed.map((d) => [d.slot, cur[d.slot]]));
      freed.forEach((d) => (cur[d.slot] = null));
      // gospodarze, którzy wypadli, nie mogą od razu odzyskać weekendu (inaczej „zmiana” kończyła się powrotem tej samej skoczni)
      const dropped = new Set(Object.values(old).filter(Boolean));
      U.shuffle(freed);
      // 2. wspólna pula kandydatur: gracz + kraje AI
      const mine = ((p.cycleBids || {})[cycle] || []).slice(0, MAX_BIDS);
      const pool = [];
      mine.forEach((id, i) => {
        const h = p.hills.find((x) => x.id === id);
        const why = !h ? 'skocznia nie istnieje' : M.canHost(cycle, h);
        if (why) lines.push(`❌ ${CYCLES[cycle]}: kandydatura ${h ? h.city : ''} nieważna (${why}).`);
        else if (!inCircuit(cycle, id) && !dropped.has(id)) pool.push({ id, nat: s.nation, order: i, mine: true });
      });
      pool.push(...aiBids(cycle, dropped));
      const perNat = natCounts(cycle);
      let fly = cycle === 'WC' ? Object.values(cur).filter((v) => v && isFly(v)).length + 1 : 0; // +1: finał w Planicy
      freed.forEach((d, k) => {
        const left = freed.length - k; // wolne weekendy do obsadzenia (z tym)
        let ok = pool.filter((b) => !b.used && (perNat[b.nat] || 0) < NATION_CAP[cycle] && fits(cycle, d, b.id));
        if (cycle === 'WC') {
          if (fly >= FLY_MAX) ok = ok.filter((b) => !isFly(b.id));
          else if (fly + left <= FLY_MIN) ok = ok.filter((b) => isFly(b.id)); // trzeba dobić do minimum lotów
        }
        let pick = ok.length ? weighted(ok.map((b) => [b, bidWeight(cycle, b.id, b.order)])) : null;
        if (pick) { pick.used = true; cur[d.slot] = pick.id; }
        else {
          // brak kandydatów spełniających warunki – FIS obsadza weekend sama (albo zostaje dotychczasowy gospodarz)
          let cand = aiCandidates(cycle, d, dropped);
          if (cycle === 'WC' && fly + left <= FLY_MIN) cand = cand.filter(([id]) => isFly(id));
          if (cycle === 'WC' && fly >= FLY_MAX) cand = cand.filter(([id]) => !isFly(id));
          cur[d.slot] = cand.length ? weighted(cand) : old[d.slot];
        }
        const n = venueNat(cur[d.slot]); perNat[n] = (perNat[n] || 0) + 1;
        if (cycle === 'WC' && isFly(cur[d.slot])) fly++;
      });
      // PŚ: wolne weekendy w strefie przed Planicą najpierw dla nowych skoczni nordyckich (Norwegia, potem FIN/SWE),
      // pozostali zwycięzcy – w dowolne wolne terminy
      if (cycle === 'WC') {
        const prio = (id) => { const n = venueNat(id); return n === 'NOR' ? 0 : NORDIC.includes(n) ? 1 : 2; };
        const winners = U.shuffle(freed.map((d) => cur[d.slot])).sort((a, b) => prio(a) - prio(b));
        const zone = freed.filter((d) => NORDIC_ZONE.includes(d.slot)), rest = U.shuffle(freed.filter((d) => !NORDIC_ZONE.includes(d.slot)));
        const nordic = winners.filter((id) => prio(id) < 2), others = winners.filter((id) => prio(id) === 2);
        zone.forEach((d) => (cur[d.slot] = nordic.length ? nordic.shift() : others.shift()));
        rest.forEach((d) => (cur[d.slot] = others.length ? others.shift() : nordic.shift()));
      }
      pool.filter((b) => b.mine).forEach((b) => {
        const city = SJM.W.getHill(b.id).city;
        lines.push(b.used ? `✅ ${CYCLES[cycle]}: FIS przyznała nam weekend w ${city}.` : `❌ ${CYCLES[cycle]}: kandydatura ${city} przegrała z innymi kandydatami.`);
      });
      const added = freed.filter((d) => cur[d.slot] !== old[d.slot]).map((d) => venueCity(cur[d.slot]));
      const removed = freed.filter((d) => cur[d.slot] !== old[d.slot] && old[d.slot]).map((d) => venueCity(old[d.slot]));
      if (added.length) changes.push(`<b>${CYCLES[cycle]}</b>: nowi gospodarze – ${added.join(', ')}; wypadli – ${removed.join(', ') || '–'}`);
    }
    p.cycleBids = {};
    if (changes.length) M.news('FIS: kalendarz na nowy sezon', changes.join('<br>') + '<br><br>Gospodarze, którzy utrzymali się w kalendarzu, zachowują swoje terminy.', 'info');
  }
  // Raw Air / Turniej Nordycki: 3 kolejne weekendy PŚ w krajach nordyckich (najbliższe finałowi).
  // Same skocznie norweskie – Raw Air, mieszane (NOR/FIN/SWE) – Turniej Nordycki. Etapy: konkursy indywidualne.
  const TOUR_NAMES = { RAW: 'Raw Air', NORD: 'Turniej Nordycki' };
  function nordicTour(wcWeeks) {
    let run = [], best = null;
    for (let i = 0; i < wcWeeks.length + 1; i++) {
      const x = wcWeeks[i];
      if (x && NORDIC.includes(venueNat(x.hill))) run.push(x);
      else { if (run.length >= 3) best = run.slice(-3); run = []; }
    }
    if (!best) return;
    const tour = best.every((x) => venueNat(x.hill) === 'NOR') ? 'RAW' : 'NORD';
    const evs = best.flatMap((x) => x.w.events.filter((e) => e.level === 'WC' && e.format === 'ind'));
    evs.forEach((e, k) => Object.assign(e, { tour, tourStage: k + 1, tourN: evs.length }));
    best.forEach((x, k) => (x.w.label = x.w.label.replace('PŚ ' + venueCity(x.hill), `${TOUR_NAMES[tour]} ${k + 1}/3 – ${venueCity(x.hill)}`)));
  }
  // nazwa turnieju nordyckiego w bieżącym kalendarzu (klasyfikacje, historia)
  function nordicName(cal) {
    const e = ((cal || S().calendar) || { weeks: [] }).weeks.flatMap((w) => w.events).find((x) => x.tour === 'RAW' || x.tour === 'NORD');
    return e ? TOUR_NAMES[e.tour] : null;
  }
  // liczba weekendów lotów w kalendarzu PŚ (z finałem w Planicy)
  function flyingWeekends() { return Object.values(circuit().WC).filter((v) => v && isFly(v)).length + 1; }
  // nasze weekendy w kalendarzu cyklu
  function myVenues(cycle) { const c = circuit()[cycle]; return Object.values(c).filter(isMine); }
  function inCircuit(cycle, id) { return Object.values(circuit()[cycle]).includes(id); }

  // ---------- Gospodarze wielkich imprez ----------
  // s.hosts = { OWG: { rok: { nat, nh, lh } }, WCH: { rok: { nat, nh, lh } }, SFWC: { rok: { nat, hill } } }
  // IO: gospodarz kolejnych igrzysk ogłaszany po poprzednich; MŚ i MŚ w lotach: decyzja FIS 4 lata przed imprezą
  const BIG_NAMES = { OWG: 'Igrzyska Olimpijskie', WCH: 'Mistrzostwa Świata', SFWC: 'MŚ w lotach' };
  const FIS_AHEAD = 4;
  const isEdition = (kind, y) => (kind === 'WCH' ? y % 2 === 1 : kind === 'OWG' ? y % 4 === 2 : y % 4 === 0);
  const S = () => SJM.state;
  const curE = () => S().season + 1;
  function nextEdition(kind, from) { let y = from; while (!isEdition(kind, y)) y++; return y; }

  function hosts() {
    const s = S();
    if (s.hosts) return s.hosts;
    const B = SJM.BIG_EVENT_HOSTS, E = curE();
    s.hosts = { OWG: {}, WCH: {}, SFWC: {} };
    s.extraHills = s.extraHills || [];
    // na starcie znane są tylko najbliższe igrzyska
    const o = nextEdition('OWG', E);
    if (B.OWG[o]) s.hosts.OWG[o] = { nat: B.OWG[o].nat, nh: B.OWG[o].hills[0], lh: B.OWG[o].hills[1] };
    for (const [y, [nh, lh]] of Object.entries(B.WCH)) if (+y >= E) s.hosts.WCH[y] = { nat: SJM.W.getHill(lh).nation, nh, lh };
    for (const [y, hill] of Object.entries(B.SFWC)) if (+y >= E) s.hosts.SFWC[y] = { nat: SJM.W.getHill(hill).nation, hill };
    // imprezy, o których FIS już zdecydowała (do E+3), a nie ma ich w danych – wybór FIS bez ogłoszeń
    for (const kind of ['WCH', 'SFWC']) for (let y = E; y <= E + FIS_AHEAD - 1; y++) if (isEdition(kind, y) && !s.hosts[kind][y]) s.hosts[kind][y] = aiPick(kind, y);
    return s.hosts;
  }

  function hostOf(kind, y) {
    const h = hosts();
    if (!h[kind][y]) h[kind][y] = kind === 'OWG' ? olympicPick(y) : aiPick(kind, y);
    return h[kind][y];
  }

  // ostatni gospodarze (do unikania powtórek)
  function recent(kind, y, n) {
    return Object.entries(hosts()[kind]).filter(([yy]) => +yy < y).sort((a, b) => b[0] - a[0]).slice(0, n).map(([, v]) => v.nat);
  }
  function weighted(pairs) {
    const tot = pairs.reduce((s, [, w]) => s + w, 0);
    let r = Math.random() * tot;
    for (const [v, w] of pairs) { r -= w; if (r <= 0) return v; }
    return pairs[pairs.length - 1][0];
  }

  // FIS bez kandydatury gracza: kraje z kompletem skoczni, bez powtórek z ostatnich edycji (kraj gracza musi kandydować sam)
  function aiPick(kind, y) {
    const s = S(), avoid = recent(kind, y, kind === 'WCH' ? 3 : 2);
    if (kind === 'SFWC') {
      const opts = SJM.HILLS.filter((h) => h.K >= 170 && h.nation !== s.nation && !avoid.includes(h.nation));
      const hill = U.pick(opts.length ? opts : SJM.HILLS.filter((h) => h.K >= 170));
      return { nat: hill.nation, hill: hill.id };
    }
    const pairs = [];
    for (const n of SJM.NATIONS) {
      if (n.code === s.nation || avoid.includes(n.code)) continue;
      const hs = SJM.HILLS.filter((h) => h.nation === n.code);
      const lh = hs.filter((h) => h.K >= 110 && h.K < 170).sort((a, b) => b.K - a.K)[0];
      const nh = hs.filter((h) => h.K >= 85 && h.K < 110).sort((a, b) => b.K - a.K)[0];
      if (lh && nh) pairs.push([{ nat: n.code, nh: nh.id, lh: lh.id }, 0.5 + n.pop / 100]);
    }
    return weighted(pairs);
  }

  // obiekty olimpijskie: najlepsze istniejące skocznie gospodarza albo nowy kompleks
  function olympicVenue(nat, y) {
    const s = S();
    const mine = nat === s.nation;
    const pool = mine ? s.player.hills.map((h) => ({ ...h, nation: nat })) : SJM.HILLS.concat(s.extraHills || []).filter((h) => h.nation === nat);
    const pick = (lo, hi) => pool.filter((h) => h.K >= lo && h.K < hi).sort((a, b) => b.K - a.K)[0];
    const city = (pool.find((h) => h.K >= 85) || {}).city || SJM.OLYMPIC_CITIES[nat] || (pool[0] || {}).city || SJM.W.nationData(nat).name;
    const make = (type, suffix) => {
      const t = SJM.HILL_TYPES[type];
      const id = `oly${y}_${type}`;
      const hill = { id, name: `Skocznia olimpijska${suffix}`, city, nation: nat, K: t.K, HS: t.HS };
      if (mine) {
        // kraj gracza: kompleks buduje państwo (bez kosztów federacji), gotowy przed igrzyskami
        const weeks = Math.round(t.weeks * 1.5);
        s.player.hills.push({ id, name: `${city} – skocznia olimpijska${suffix}`, city, K: t.K, HS: t.HS, type, condition: 0, igelit: true, lights: true, builtin: false, building: true });
        s.player.projects.push({ id: U.uid('p'), kind: 'build', target: id, weeksLeft: weeks, total: weeks, label: `${city} – skocznia olimpijska${suffix} (finansuje państwo)`, cost: 0 });
      } else (s.extraHills = s.extraHills || []).push(hill);
      return id;
    };
    const nh = pick(85, 110), lh = pick(110, 170);
    return { nh: nh ? nh.id : make('normal', ' (normalna)'), lh: lh ? lh.id : make('large', ''), built: (!nh ? 1 : 0) + (!lh ? 1 : 0) };
  }

  // MKOl: znani gospodarze z danych (2034, 2038), dalej losowanie z puli kandydatów
  function olympicPick(y) {
    const s = S();
    const seed = SJM.BIG_EVENT_HOSTS.OWG[y];
    let nat = seed && seed.nat;
    if (!nat) {
      const avoid = recent('OWG', y, 2);
      const cand = Object.entries(SJM.OWG_CANDIDATES).filter(([c]) => !avoid.includes(c) && SJM.W.nationData(c));
      if (!SJM.OWG_CANDIDATES[s.nation] && !avoid.includes(s.nation)) cand.push([s.nation, 0.6]);
      // kraje bez kadry skoczków (uśpione nacje) – rzadko; wybór oznacza start programu olimpijskiego
      for (const d of SJM.DORMANT_NATIONS || []) if (d.owg && !SJM.W.nationData(d.code) && !avoid.includes(d.code)) cand.push([d.code, d.owg]);
      nat = weighted(cand);
      if (!SJM.W.nationData(nat)) SJM.M.joinNation(nat, 'owg', y);
    }
    // obiekty z danych tylko, jeśli gospodarz nie jest krajem gracza (wtedy liczą się jego skocznie)
    if (seed && nat !== s.nation) return { nat, nh: seed.hills[0], lh: seed.hills[1], built: 0 };
    return { nat, ...olympicVenue(nat, y) };
  }

  // gracz gospodarzem igrzysk: dotacja państwowa, kompleks skoczni, popularność
  function olympicBenefits(y, h) {
    const p = S().player, M = SJM.M;
    const boost = Math.round(p.grant * 0.2 / 1000) * 1000;
    p.grant += boost;
    p.olympic = { year: y, boost };
    p.popularity = Math.min(100, p.popularity + 6);
    p.board = Math.min(100, p.board + 5);
    const hl = (id) => { const x = SJM.W.getHill(id); return `${x.name} (K-${x.K})`; };
    M.news(`🏅 Igrzyska ${y} w naszym kraju!`, `MKOl powierzył nam organizację Zimowych Igrzysk Olimpijskich ${y}.<br>
      • Rząd zwiększa dotację na skoki o <b>${U.money(boost)}</b> rocznie do igrzysk (połowa zostanie na stałe).<br>
      • Skocznie olimpijskie: ${hl(h.nh)} i ${hl(h.lh)}${h.built ? `. Brakujące obiekty (${h.built}) buduje państwo – zobacz Infrastrukturę` : ''}.<br>
      • Rośnie zainteresowanie dzieci skokami – większy nabór do szkółek przez lata przed igrzyskami.<br>
      • Zarząd liczy na medal przed własną publicznością.`, 'board');
  }

  // decyzje po sezonie (E = rok zakończenia sezonu); bids: kandydatury gracza { WCH: {year, hill}, SFWC: {...} }
  function decideHosts(E, lines) {
    const s = S(), p = s.player, M = SJM.M;
    const h = hosts();
    const R = M.HOST_REQ;
    for (const kind of ['WCH', 'SFWC']) {
      for (let y = E + 1; y <= E + FIS_AHEAD; y++) {
        if (!isEdition(kind, y) || h[kind][y]) continue;
        const bid = p.bigBids && p.bigBids[kind];
        let res = null;
        if (bid && bid.year === y) {
          const hill = p.hills.find((x) => x.id === bid.hill);
          const ok = hill && Math.random() < R[kind].chance + (p.popularity - 50) / 200;
          if (ok) {
            if (kind === 'SFWC') res = { nat: s.nation, hill: hill.id };
            else res = { nat: s.nation, nh: p.hills.filter((x) => x.K >= 85 && x.K < 110 && !x.building).sort((a, b) => b.K - a.K)[0].id, lh: hill.id };
            lines.push(`✅ FIS przyznała nam ${BIG_NAMES[kind]} ${y} (${hill.city})!`);
            p.popularity = Math.min(100, p.popularity + 2);
          } else lines.push(`❌ Kandydatura na ${BIG_NAMES[kind]} ${y} odrzucona.`);
          delete p.bigBids[kind];
        }
        h[kind][y] = res || aiPick(kind, y);
        const v = h[kind][y], hill = SJM.W.getHill(v.lh || v.hill);
        M.news(`FIS: ${BIG_NAMES[kind]} ${y}`, `Gospodarzem ${kind === 'WCH' ? 'Mistrzostw Świata' : 'MŚ w lotach'} ${y} będzie ${hill.city} (${SJM.W.flag(v.nat)} ${SJM.W.nationData(v.nat).name}).`, 'info');
      }
    }
    // MKOl: po igrzyskach ogłasza gospodarza kolejnych
    if (isEdition('OWG', E) && !h.OWG[E + 4]) {
      const v = h.OWG[E + 4] = olympicPick(E + 4);
      const lh = SJM.W.getHill(v.lh), nm = SJM.W.nationData(v.nat).name;
      lines.push(`🏅 MKOl: Igrzyska ${E + 4} odbędą się w kraju: ${SJM.W.flag(v.nat)} ${nm} (skoki: ${lh.city}).`);
      if (v.nat === s.nation) olympicBenefits(E + 4, v);
      else M.news(`MKOl: Igrzyska ${E + 4} – ${nm}`, `Gospodarzem Zimowych Igrzysk Olimpijskich ${E + 4} będzie ${SJM.W.flag(v.nat)} ${nm}. Konkursy skoków: ${lh.city}${v.built ? ' – na nowych skoczniach olimpijskich, które dopiero powstaną' : ''}.${(SJM.OWG_CANDIDATES[v.nat] || 0) < 1 ? ' To kraj bez wielkich tradycji skoków – gospodarz zapowiada inwestycje w dyscyplinę.' : ''}`, 'info');
    }
    // po własnych igrzyskach: połowa dodatkowej dotacji zostaje na stałe
    if (p.olympic && p.olympic.year === E) {
      p.grant -= Math.round(p.olympic.boost / 2);
      lines.push(`🏅 Dziedzictwo igrzysk: połowa olimpijskiej dotacji (${U.money(Math.round(p.olympic.boost / 2))} rocznie) zostaje na stałe.`);
      p.olympic = null;
    }
  }

  // gospodarz IO w ciągu najbliższych `years` lat (rozwój dyscypliny w kraju gospodarza)
  function olympicHostSoon(nat, E, years) {
    return Object.entries(hosts().OWG).some(([y, v]) => v.nat === nat && +y >= E && +y <= E + years);
  }
  // pierwsza nierozstrzygnięta edycja – na nią można kandydować; decyzja po sezonie kończącym się w roku (edycja − 4)
  function openEdition(kind) {
    const h = hosts(), E = curE();
    let y = nextEdition(kind, E);
    while (h[kind][y]) y = nextEdition(kind, y + 1);
    return { year: y, decidedAfter: Math.max(E, y - FIS_AHEAD) };
  }
  // lista najbliższych imprez do zakładki „Gospodarze imprez”
  function upcoming() {
    const h = hosts(), E = curE(), out = [];
    for (const kind of ['OWG', 'WCH', 'SFWC']) {
      let y = nextEdition(kind, E);
      for (let i = 0; i < (kind === 'OWG' ? 2 : 3); i++, y = nextEdition(kind, y + 1)) out.push({ kind, year: y, host: h[kind][y] || null });
    }
    return out;
  }
  // MŚ Juniorów: rotacja (kandydatura gracza na kolejny sezon zastępuje gospodarza z rotacji)
  function wjcHost(E) {
    const rot = SJM.BIG_EVENT_HOSTS.WJC;
    return rot[(E - 2027 + rot.length * 10) % rot.length];
  }
  function bigHosts(kind, E) {
    const v = hostOf(kind, E);
    return kind === 'SFWC' ? v.hill : [v.nh, v.lh];
  }

  // opts.summer: sezon zaczyna się w lipcu częścią letnią (od drugiego sezonu gry)
  function build(seasonYear, opts = {}) {
    const st = SJM.state;
    const E = seasonYear + 1;
    const p = st.player;
    const bids = p.hosted || {};
    const first = firstSaturday(seasonYear, 10, 20); // listopad
    const weeks = [];
    let eid = 0;
    const ev = (o) => Object.assign({ id: 'e' + seasonYear + '_' + (eid++) }, o);
    // gospodarz weekendu cyklu wg przydziału FIS (s.circuit); zastępstwo, gdy obiekt gości imprezę mistrzowską
    const used = new Set();
    const slotHost = (cycle, slot) => {
      const def = SLOTS[cycle].find((d) => d.slot === slot);
      const r = slotVenue(cycle, def, E, used);
      if (r.hill) hillsOfVenue(r.hill).forEach((id) => used.add(id));
      return { ...r, fmts: def.fmts };
    };
    const addSlot = (w, labels, cycle, slot, prefix, level = cycle) => {
      const r = slotHost(cycle, slot);
      if (!r.hill) return;
      if (labels && prefix) labels.push(prefix + ' ' + venueCity(r.hill));
      r.fmts.forEach((f) => w.events.push(ev({ level, format: f, hill: r.hill, standIn: r.standIn || undefined })));
    };

    // lato: okres 0 (kwoty z poprzedniego sezonu, bez przeliczeń)
    if (opts.summer) SUMMER.forEach((t, i) => {
      const d = new Date(first); d.setDate(d.getDate() - (PREP_WEEKS + AUTUMN_WEEKS + SUMMER.length - i) * 7);
      const w = { date: d.toISOString(), label: t.label || '', events: [], period: 0, summer: true };
      const labels = [];
      if (t.sgp) addSlot(w, labels, 'SGP', 'S' + i, 'LGP');
      if (t.scoc) addSlot(w, labels, 'SCOC', 'S' + i, 'LPK');
      if (t.fis) addSlot(w, labels, 'FIS', 'S' + i, 'FIS Cup');
      w.label = w.label || labels.join(' · ');
      weeks.push(w);
    });
    // przerwa jesienna: jedna tura na wszystkie tygodnie (trening letni, bez zawodów)
    if (opts.summer) {
      const d = new Date(first); d.setDate(d.getDate() - (PREP_WEEKS + AUTUMN_WEEKS) * 7);
      weeks.push({ date: d.toISOString(), label: `Przerwa jesienna – trening (${AUTUMN_WEEKS} tygodni)`, events: [], period: 0, summer: true, span: AUTUMN_WEEKS });
    }

    // 2 tygodnie przygotowań
    for (let i = -PREP_WEEKS; i < 0; i++) {
      const d = new Date(first); d.setDate(d.getDate() + i * 7);
      weeks.push({ date: d.toISOString(), label: 'Przygotowania do sezonu', events: [], period: 1 });
    }

    const wcWeeks = []; // zwykłe weekendy PŚ wg tygodnia zimy (do wykrycia turnieju nordyckiego)
    WINTER.forEach((t, i) => {
      const d = new Date(first); d.setDate(d.getDate() + i * 7);
      // okresy kwotowe: 1 = start → przed TCS, 2 = TCS → styczeń, 3 = luty (impreza mistrzowska) → koniec
      const w = { date: d.toISOString(), label: '', events: [], period: i < 5 ? 1 : i < 10 ? 2 : 3 };
      const labels = [];
      const big = bigOf(t, E);
      if (t.tour === 'TCS') {
        labels.push(t.label);
        t.tcs.forEach((h, k) => w.events.push(ev({ level: 'WC', format: 'ind', hill: h, tour: 'TCS', tourStage: k + 1 })));
      } else if (t.fixedWC) {
        // finał PŚ w Planicy – zawsze (także gdy Planica gości MŚ lub IO)
        labels.push('PŚ ' + SJM.W.getHill(t.wc[0]).city);
        t.wc[1].forEach((f) => w.events.push(ev({ level: 'WC', format: f, hill: t.wc[0] })));
      } else if (t.wc && !big) {
        const r = slotHost('WC', 'W' + i);
        if (r.hill) {
          labels.push('PŚ ' + venueCity(r.hill));
          r.fmts.forEach((f) => w.events.push(ev({ level: 'WC', format: f, hill: r.hill, standIn: r.standIn || undefined })));
          wcWeeks[i] = { w, hill: r.hill };
        }
      }
      if (big) t = { ...t, big };
      if (t.big) {
        if (t.big === 'SFWC') {
          const h = bigHosts('SFWC', E);
          labels.push('MŚ w lotach ' + SJM.W.getHill(h).city);
          w.events.push(ev({ level: 'SFWC', format: 'ind', hill: h, title: 'MŚ w lotach – konkurs indywidualny' }));
          w.events.push(ev({ level: 'SFWC', format: 'team', hill: h, title: 'MŚ w lotach – drużyny' }));
        } else {
          const [nh, lh] = bigHosts(t.big, E);
          const nm = t.big === 'OWG' ? 'Igrzyska Olimpijskie' : 'Mistrzostwa Świata';
          labels.push(nm + ' ' + SJM.W.getHill(lh).city);
          w.events.push(ev({ level: t.big, format: 'ind', hill: nh, title: nm + ' – skocznia normalna' }));
          w.events.push(ev({ level: t.big, format: 'ind', hill: lh, title: nm + ' – skocznia duża' }));
          // IO: superteam (duety) jak od Mediolanu-Cortiny 2026; MŚ: drużyny 4-osobowe
          w.events.push(t.big === 'OWG' ? ev({ level: 'OWG', format: 'super', hill: lh, title: nm + ' – superteam (duety)' }) : ev({ level: t.big, format: 'team', hill: lh, title: nm + ' – konkurs drużynowy' }));
        }
      }
      if (t.wjc) {
        const h = bids.WJC || wjcHost(E);
        labels.push('MŚJ ' + SJM.W.getHill(h).city);
        w.events.push(ev({ level: 'WJC', format: 'ind', hill: h, title: 'MŚ Juniorów – konkurs indywidualny' }));
        w.events.push(ev({ level: 'WJC', format: 'team', hill: h, title: 'MŚ Juniorów – drużyny' }));
      }
      if (t.coc) addSlot(w, null, 'COC', 'W' + i);
      if (t.fis) addSlot(w, null, 'FIS', 'W' + i);
      if (t.nat) {
        const homeHills = p.hills.filter((h) => h.K >= 85 && h.condition >= 30 && (!SJM.M || SJM.M.homolClass(h))).sort((a, b) => b.K - a.K);
        const hill = homeHills.length ? homeHills[0].id : null;
        if (hill) {
          labels.push('Mistrzostwa kraju');
          w.events.push(ev({ level: 'NAT', format: 'ind', hill, title: 'Mistrzostwa ' + SJM.W.nationData(st.nation).name.replace('Polska', 'Polski') }));
        }
        w.label = labels.join(' · ') || 'Koniec sezonu';
      }
      w.label = w.label || labels.join(' · ') || 'Tydzień treningowy';
      weeks.push(w);
    });
    nordicTour(wcWeeks);

    return { season: seasonYear, weeks };
  }

  // zapisy z kalendarzem bieżącego sezonu w starym układzie lata (więcej weekendów, bez przerwy jesiennej):
  // rozegrane tygodnie i bieżący zostają, reszta lata według nowego kalendarza (te same daty startu lata)
  function fixSummer() {
    const s = S(), cal = s.calendar;
    if (!cal || !cal.weeks.length || !cal.weeks[0].summer || cal.weeks.some((w) => w.span)) return 0;
    const old = cal.weeks.filter((w) => w.summer).length;
    const kept = s.week + 1;
    if (kept >= old) return 0; // lato już się skończyło
    const fresh = build(cal.season, { summer: true }).weeks;
    fresh.forEach((w) => w.events.forEach((e) => (e.id = e.id.replace(/^e/, 'em'))));
    const add = fresh.slice(kept, SUMMER.length).map((w, j) => ({ ...w, date: cal.weeks[kept + j].date }));
    const rest = old - kept - add.length;
    if (rest > 0) {
      const brk = fresh[SUMMER.length];
      add.push({ ...brk, date: cal.weeks[kept + add.length].date, label: `Przerwa jesienna – trening (${rest} tygodni)`, span: rest });
    }
    cal.weeks.splice(kept, old - kept, ...add);
    return add.length;
  }

  function eventTitle(e) {
    if (e.title) return e.title;
    const h = SJM.W.getHill(e.hill);
    const lv = SJM.LEVELS[e.level].short;
    const kind = e.format === 'team' ? 'drużynowy' : e.format === 'super' ? 'superteam' : 'indywidualny';
    let t = `${lv} ${h.city} – ${kind}`;
    if (e.tour === 'TCS') t = `TCS ${e.tourStage}/4 ${h.city}`;
    if (e.tour === 'RAW' || e.tour === 'NORD') t = `${TOUR_NAMES[e.tour]} ${e.tourStage}/${e.tourN} ${h.city}`;
    return t;
  }

  return { build, fixSummer, olympicPick, eventTitle, weekCount, SUMMER_WEEKS: SUMMER.length + AUTUMN_WEEKS, circuit, decideCircuit, myVenues, inCircuit, CYCLES, venueCity, nordicName, flyingWeekends, FLY_MIN, FLY_MAX, MAX_BIDS, hosts, hostOf, decideHosts, olympicHostSoon, olympicBenefits, openEdition, upcoming, wjcHost, BIG_NAMES };
})();
