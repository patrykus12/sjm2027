// ===== Symulacja skoków i konkursów =====
SJM.SIM = (function () {
  const U = SJM.U, W = SJM.W;

  function meterValue(K) {
    if (K >= 170) return 1.2;
    if (K >= 135) return 1.6; // skocznie gigantyczne
    if (K >= 100) return 1.8;
    if (K >= 80) return 2.0;
    if (K >= 70) return 2.2;
    return 2.4;
  }

  function pressureOf(level, round) {
    const base = { WC: 0.35, SGP: 0.2, COC: 0.15, SCOC: 0.1, FIS: 0.05, WCH: 1.0, OWG: 1.2, SFWC: 0.8, WJC: 0.6, NAT: 0.2 }[level] || 0.3;
    return base + (round === 2 ? 0.35 : 0);
  }

  // spłaszczenie na samej górze: powyżej 90 każdy punkt umiejętności daje mniejszą przewagę (mniej dominacji, więcej rotacji)
  function eff(s) { return s > 90 ? 90 + (s - 90) * 0.8 : s; }

  function expected(j, hill, equip) {
    return eff(W.skill(j, hill.K)) + (equip[j.nation] || 0) + j.form * 0.75 + (j.shape || 0);
  }

  // ---------- Wiatr (zasady FIS) ----------
  // wpływ na odległość: (HS − 36) / 20 metrów na 1 m/s; wiatr w plecy szkodzi o 21% bardziej i o tyle wyższa jest rekompensata
  function windFactor(hill) { return Math.max(1.5, (hill.HS - 36) / 20); }
  function windDist(w, hill, tailMul = 1) { return w >= 0 ? w * windFactor(hill) : w * windFactor(hill) * 1.21 * tailMul; }
  // skocznie znane z kapryśnego (>1) albo spokojnego (<1) wiatru
  const WINDY = { ruka: 1.4, zakopane: 1.3, lahti: 1.3, lahti_nh: 1.3, willingen: 1.3, klingenthal: 1.2, lillehammer: 1.2, oslo: 1.15, trondheim: 1.15, trondheim_nh: 1.15, vikersund: 1.15, sapporo: 1.15, titisee: 1.1, engelberg: 1.1,
    bischofshofen: 0.8, garmisch: 0.85, innsbruck: 0.85, oberstdorf: 0.9, planica: 0.9, planica_f: 0.9 };
  // warunki dnia: średni wiatr i porywistość (spokojny albo wietrzny dzień)
  function windOf(hill) {
    const g = WINDY[hill.id] || 1;
    return { bias: U.gauss(0.25, 0.35 * g), gust: g * (0.7 + Math.random() * 0.6) };
  }

  // kontekst rundy: belka (pRef) i wiatr
  function roundCtx(field, hill, equip, wind) {
    const mpp = hill.K / 85;
    const exp = field.map((j) => expected(j, hill, equip)).sort((a, b) => b - a);
    const e3 = exp[Math.min(2, exp.length - 1)] || 70;
    const windMean = wind.bias + U.gauss(0, 0.45 * wind.gust), windVar = (0.2 + Math.random() * 0.3) * wind.gust;
    // jury ustawia belkę tak, by najlepsi lądowali ok. 95% HS, z poprawką na prognozowany wiatr
    const target = hill.HS * 0.952 - hill.K - windDist(windMean, hill) * 0.8;
    const pRef = e3 - target / mpp + U.gauss(0, 0.6);
    const gate = U.clamp(Math.round(14 + (pRef - 80) * -0.45 + U.gauss(0, 1)), 4, 30);
    // gateM: metry na jedną belkę; drop: o ile belek jury obniżyło rozbieg w trakcie serii
    return { mpp, pRef, gate, gateM: hill.HS * 0.028, drop: 0, windMean, windVar };
  }

  // jury obniża belkę po zbyt dalekim skoku (bezpieczeństwo); skoczkowie z niższej belki dostają punkty za rozbieg
  function jury(ctx, r, hill) {
    if (r.f || r.d <= hill.HS * 0.99 || ctx.drop >= 4 || ctx.gate - ctx.drop <= 2) return;
    if (Math.random() < 0.55) ctx.drop += r.d > hill.HS * 1.03 ? 2 : 1;
  }
  // silne, zmienne podmuchy: jury odwołuje serię (zostają wyniki poprzednich)
  function stormy(ctx) { return Math.random() < U.clamp((ctx.windVar - 0.38) * 0.4 + Math.max(0, Math.abs(ctx.windMean) - 1.3) * 0.12, 0, 0.4); }

  // noty za styl: telemark raz wychodzi, raz nie (trudniej przy skokach pod i za HS), styl w locie,
  // krótkie skoki niżej; wspólna ocena skoku + rozrzut między sędziami (czołówka ok. 18,5, średnio ok. 17,5–18)
  function judges(landing, flight, d, hill, fall) {
    const notes = [];
    const half = (x) => Math.round(x * 2) / 2;
    if (fall) {
      for (let i = 0; i < 5; i++) notes.push(U.clamp(half(8.5 + U.gauss(0, 1)), 6, 12));
    } else {
      const zone = hill.K * 0.04; // ostatnie metry przed HS
      const nearHS = U.clamp((d - (hill.HS - zone)) / zone, 0, 1);
      const pTele = U.clamp(0.25 + (landing - 55) / 45 * 0.7 - Math.max(0, d - hill.HS) / hill.HS * 4 - nearHS * 0.1, 0.03, 0.97);
      const tele = Math.random() < pTele;
      let base = (tele ? 17.35 : 16.25) + (landing - 85) * 0.035 + (flight - 85) * 0.015 + U.clamp((d - hill.K) / (hill.HS - hill.K), -1.5, 1) * 1.0;
      if (d > hill.HS) base -= (d - hill.HS) / hill.HS * 18;
      if (d < hill.K * 0.9) base -= (hill.K * 0.9 - d) / hill.K * 6;
      base += U.gauss(0, 0.3);
      for (let i = 0; i < 5; i++) notes.push(U.clamp(half(base + U.gauss(0, 0.28)), 14, 20));
    }
    const sorted = [...notes].sort((a, b) => a - b);
    return { notes, total: sorted[1] + sorted[2] + sorted[3] };
  }

  function jump(j, hill, ctx, level, round, equip, opts = {}) {
    const a = j.attrs;
    const base = eff(W.skill(j, hill.K)) + (equip[j.nation] || 0);
    const pressure = pressureOf(level, round) + (opts.leader ? 0.3 : 0);
    const mentalEff = (a.mental - 62) / 38 * pressure * 1.6;
    const fatiguePen = Math.max(0, j.fatigue - 45) / 18;
    const sd = 2.9 + (100 - a.consist) / 100 * 3.4;
    const T = SJM.T;
    const champs = level === "WCH" || level === "OWG" || level === "SFWC";
    let traitEff = 0;
    if (T.has(j, "bigstage")) traitEff += champs ? 1.2 : round === 2 ? 0.3 : 0;
    if (T.has(j, "choker")) traitEff -= champs ? 1.6 : round === 2 ? 0.4 : 0;
    // dyspozycja sezonowa (j.shape) – ukryte przesunięcie formy na cały sezon
    const p = base + j.form * 0.75 + (j.shape || 0) + mentalEff + traitEff - fatiguePen + U.gauss(0, sd);
    const wm = T.has(j, "windmaster");
    // jury czeka na warunki w korytarzu wiatrowym (ok. −2 … +3 m/s), więc skrajne podmuchy losujemy ponownie
    let wTrue = ctx.windMean + U.gauss(0, ctx.windVar);
    for (let t = 0; t < 3 && (wTrue > 3 || wTrue < -2); t++) wTrue = ctx.windMean * 0.6 + U.gauss(0, ctx.windVar);
    // wiatr zmierzony (średnia z czujników) różni się od tego w locie – tym bardziej, im bardziej zmienne warunki
    const w = Math.round((wTrue + U.gauss(0, 0.05 + 0.35 * ctx.windVar) * (wm ? 0.6 : 1)) * 100) / 100;
    // trener daje sygnał do startu: z dobrym rozpoznaniem warunków nasz zawodnik częściej trafia na korzystny podmuch (efekt z wydarzeń)
    const edge = j.nation === SJM.state.nation && SJM.M.modVal ? SJM.M.modVal('wind') : 0;
    // ten sam wiatr, różne wykorzystanie: każdy skok inaczej „łapie” podmuch (rozrzut mniejszy u stabilnych zawodników),
    // a dobra technika lotu daje więcej z wiatru pod narty i mniej traci przy wietrze w plecy
    const tech = (a.flight - 75) / 100 * 0.3;
    const handle = Math.max(0.3, 1 + U.gauss(0, 0.08 + (100 - a.consist) / 100 * 0.15) + (wTrue + edge >= 0 ? tech : -tech));
    const windM = windDist(wTrue + edge, hill, wm ? 0.8 : 1) * handle;
    let d = hill.K + (p - ctx.pRef) * ctx.mpp + windM - ctx.drop * ctx.gateM;
    d = Math.max(hill.K * 0.5, d);
    d = Math.round(d * 2) / 2;

    // upadek
    let pFall = 0.0025 + (1 - a.landing / 100) * 0.004;
    if (d > hill.HS) pFall += (d - hill.HS) / hill.HS * 3.2 * (1.3 - a.landing / 100);
    const fall = Math.random() < pFall;

    const mv = meterValue(hill.K);
    const basePts = hill.K >= 170 ? 120 : 60;
    const distPts = basePts + (d - hill.K) * mv;
    const jd = judges(T.has(j, "telemark") ? Math.min(100, a.landing + 12) : a.landing, a.flight, d, hill, fall);
    // rekompensata FIS liczona z wiatru zmierzonego; za obniżoną belkę punkty dodatnie
    const wp = Math.round(-windDist(w, hill) * mv * 10) / 10;
    const gp = Math.round(ctx.drop * ctx.gateM * mv * 10) / 10;
    const pts = Math.max(0, Math.round((distPts + jd.total + wp + gp) * 10) / 10);
    const r = { id: j.id, d, p: pts, s: jd.total, n: jd.notes, w, wp, f: fall ? 1 : 0, g: ctx.gate - ctx.drop };
    if (gp) r.gp = gp;
    if (SJM.SIM && SJM.SIM.DEBUG) r.wm = windM;
    jury(ctx, r, hill);
    return r;
  }

  function dsqChance(j) {
    const p = W.profile(j.nation);
    const m = j.nation === SJM.state.nation && SJM.M.modVal ? Math.max(0.1, 1 + SJM.M.modVal("dsq")) : 1;
    return 0.0035 * (1.6 - p.tech / 100 - p.lab * 0.15) * m;
  }

  // ---------- Konkurs indywidualny ----------
  function individual(event, jumpers, opts = {}) {
    const hill = W.getHill(event.hill);
    const equip = opts.equip;
    const wind = windOf(hill);
    const res = { type: 'ind', eventId: event.id, level: event.level, hill: event.hill, qual: null, rounds: [], ranking: [] };
    let field = jumpers.slice();
    if (!field.length) return res;
    const startOrder = (list) => list.slice().sort((a, b) => (opts.order ? opts.order(a) - opts.order(b) : expected(a, hill, equip) - expected(b, hill, equip)));

    // kwalifikacje
    // loty (K-170+): z kwalifikacji awansuje 40 zawodników
    const qualLimit = opts.qualLimit || (hill.K >= 170 ? 40 : 50);
    // MŚ w lotach: 4 serie (40 w 1. serii, 30 w 2., ta sama trzydziestka w 3. i 4.)
    const nRounds = opts.rounds || (event.level === 'SFWC' ? 4 : 2);
    // system KO (TCS): kwalifikacje zawsze – ich kolejność wyznacza pary 1. serii
    const ko = !!opts.ko;
    const seedOf = (id) => (opts.seed && byIdAll[id] ? opts.seed(byIdAll[id]) : 0);
    const byIdAll = Object.fromEntries(field.map((j) => [j.id, j]));
    let qualOrder = null;
    // upadek może skończyć się kontuzją (opts.fallInjury) – kontuzjowany nie skacze już w kolejnych seriach
    const hurt = new Set();
    const checkFalls = (jumps) => { if (opts.fallInjury) for (const r of jumps) if (r.f && !hurt.has(r.id) && byIdAll[r.id] && opts.fallInjury(byIdAll[r.id], r)) hurt.add(r.id); };
    if ((opts.qual && field.length > qualLimit) || ko) {
      const ctx = roundCtx(field, hill, equip, wind);
      const order = startOrder(field);
      const jumps = order.map((j) => {
        const r = jump(j, hill, ctx, event.level, 0, equip);
        if (Math.random() < dsqChance(j) * 0.5) r.x = 1;
        return r;
      });
      checkFalls(jumps);
      jumps.forEach((r) => { if (hurt.has(r.id)) r.inj = 1; });
      // remis w kwalifikacjach: wyżej zawodnik z lepszym miejscem w klasyfikacji generalnej (opts.seed)
      const sorted = jumps.slice().sort((a, b) => (a.x ? 1 : 0) - (b.x ? 1 : 0) || b.p - a.p || seedOf(b.id) - seedOf(a.id));
      // ex aequo na ostatnim miejscu premiowanym awansem – awansują wszyscy (oprócz TCS, gdzie liczba par jest stała)
      let nPass = qualLimit;
      if (!ko && sorted[nPass - 1] && !sorted[nPass - 1].x) {
        const lastP = Math.round(sorted[nPass - 1].p * 10);
        while (sorted[nPass] && !sorted[nPass].x && Math.round(sorted[nPass].p * 10) === lastP) nPass++;
      }
      const passedList = sorted.slice(0, nPass).filter((r) => !r.x && !r.inj).map((r) => r.id);
      const passed = new Set(passedList);
      res.qual = { gate: ctx.gate, order: order.map((j) => j.id), jumps: sorted.map((r, i) => ({ ...r, rank: i + 1, q: passed.has(r.id) ? 1 : 0 })) };
      field = field.filter((j) => passed.has(j.id));
      qualOrder = passedList;
    }

    // 1. seria (KO: pary 1–50, 2–49, …; zaczyna para ze środka, w parze najpierw słabszy z kwalifikacji)
    const ctx1 = roundCtx(field, hill, equip, wind);
    let order1 = startOrder(field);
    let pairs = null;
    if (ko && qualOrder && qualOrder.length >= 2) {
      const n = qualOrder.length, half = Math.floor(n / 2);
      pairs = [];
      for (let i = 0; i < half; i++) pairs.push([qualOrder[i], qualOrder[n - 1 - i]]);
      if (n % 2) pairs.push([qualOrder[half], null]); // nieparzysta liczba – środkowy bez rywala
      const seq = [];
      if (n % 2) seq.push(qualOrder[half]);
      for (let i = half - 1; i >= 0; i--) seq.push(qualOrder[n - 1 - i], qualOrder[i]);
      order1 = seq.map((id) => byIdAll[id]);
    }
    const r1 = order1.map((j) => {
      const r = jump(j, hill, ctx1, event.level, 1, equip);
      if (Math.random() < dsqChance(j)) r.x = 1;
      return r;
    });
    res.rounds.push({ gate: ctx1.gate, order: order1.map((j) => j.id), jumps: r1 });
    checkFalls(r1);
    // kontuzjowany w 1. serii zachowuje miejsce w tabeli, ale nie startuje w 2. (zajmuje miejsce po finalistach)
    const r1ok = r1.filter((r) => !r.x).sort((a, b) => b.p - a.p);
    let advancing;
    if (pairs) {
      // KO: zwycięzcy par (remis – obaj) + najlepsi przegrani („lucky losers”) do 30
      const pts = Object.fromEntries(r1.map((r) => [r.id, r.x ? -1 : r.p]));
      const winners = [], losers = [];
      for (const [a, b] of pairs) {
        if (!b) { if (pts[a] >= 0) winners.push(a); continue; }
        if (pts[a] < 0 && pts[b] < 0) continue;
        if (pts[a] === pts[b]) winners.push(a, b);
        else if (pts[a] > pts[b]) { winners.push(a); if (pts[b] >= 0) losers.push(b); }
        else { winners.push(b); if (pts[a] >= 0) losers.push(a); }
      }
      losers.sort((x, y) => pts[y] - pts[x]);
      let nl = Math.max(0, 30 - winners.length);
      if (nl && nl < losers.length) { const last = pts[losers[nl - 1]]; while (nl < losers.length && pts[losers[nl]] === last) nl++; }
      const lucky = losers.slice(0, nl);
      const adv = new Set(winners.concat(lucky));
      advancing = r1ok.filter((r) => adv.has(r.id));
      res.ko = { pairs, winners, lucky };
    } else {
      let cut = Math.min(30, r1ok.length);
      if (cut < r1ok.length) {
        const last = r1ok[cut - 1].p;
        while (cut < r1ok.length && r1ok[cut].p === last) cut++;
      }
      advancing = r1ok.slice(0, cut);
    }
    const byId = Object.fromEntries(field.map((j) => [j.id, j]));

    // 2. seria: kolejność odwrotna do wyników
    r1.forEach((r) => { if (hurt.has(r.id)) r.inj = 1; });
    const order2 = advancing.filter((r) => !hurt.has(r.id)).reverse().map((r) => byId[r.id]);
    const ctx2 = roundCtx(order2, hill, equip, wind);
    // silny, zmienny wiatr: seria odwołana, liczą się wyniki po 1. serii
    const off2 = order2.length > 0 && stormy(ctx2);
    if (off2) res.note = 'Druga seria odwołana z powodu wiatru – wyniki po 1. serii.';
    const r2map = {};
    const leaderId = order2.length ? order2[order2.length - 1].id : null;
    const r2 = (off2 ? [] : order2).map((j) => {
      const r = jump(j, hill, ctx2, event.level, 2, equip, { leader: j.id === leaderId });
      if (Math.random() < dsqChance(j) * 0.4) r.x = 1;
      r2map[j.id] = r;
      return r;
    });
    if (r2.length) res.rounds.push({ gate: ctx2.gate, order: order2.map((j) => j.id), jumps: r2 });
    checkFalls(r2);
    r2.forEach((r) => { if (hurt.has(r.id)) r.inj = 1; });

    // kolejne serie (MŚ w lotach: 3. i 4.) – ta sama stawka, kolejność odwrotna do aktualnej klasyfikacji
    const later = {};
    const sumOf = (id) => [r1.find((x) => x.id === id), r2map[id], ...(later[id] || [])].reduce((a, x) => a + (x && !x.x ? x.p : 0), 0);
    for (let k = 3; k <= nRounds && r2.length; k++) {
      const alive = order2.filter((j) => !hurt.has(j.id) && !(r2map[j.id] && r2map[j.id].x) && !(later[j.id] || []).some((x) => x.x));
      const ord = alive.slice().sort((a, b) => sumOf(a.id) - sumOf(b.id));
      const ctxK = roundCtx(ord, hill, equip, wind);
      if (stormy(ctxK)) { res.note = `${k}. seria odwołana z powodu wiatru – wyniki po ${k - 1} seriach.`; break; }
      const lead = ord.length ? ord[ord.length - 1].id : null;
      const rk = ord.map((j) => {
        const r = jump(j, hill, ctxK, event.level, 2, equip, { leader: k === nRounds && j.id === lead });
        if (Math.random() < dsqChance(j) * 0.4) r.x = 1;
        (later[j.id] = later[j.id] || []).push(r);
        return r;
      });
      res.rounds.push({ gate: ctxK.gate, order: ord.map((j) => j.id), jumps: rk });
      checkFalls(rk);
    }
    res.injured = [...hurt];

    const rows = r1.map((a) => {
      const b = r2map[a.id];
      const all = [a].concat(b ? [b] : [], later[a.id] || []);
      const dsq = all.some((x) => x.x);
      const total = dsq ? 0 : Math.round(all.reduce((s, x) => s + x.p, 0) * 10) / 10;
      return { id: a.id, nat: byId[a.id].nation, total, j: all, dsq: dsq ? 1 : 0, r2: b ? 1 : 0 };
    });
    rows.sort((x, y) => (x.dsq - y.dsq) || (y.r2 - x.r2) || (y.total - x.total));
    let rank = 0, prev = null;
    rows.forEach((r, i) => {
      if (r.dsq) { r.rank = null; return; }
      if (prev === null || r.total !== prev.total || r.r2 !== prev.r2) rank = i + 1;
      r.rank = rank; prev = r;
    });
    res.ranking = rows;
    return res;
  }

  // ---------- Konkurs drużynowy ----------
  // drużynówka: 4 grupy, 2 serie (do 2. serii top 8); superteam (duety): 2 grupy, 3 serie (top 12, potem top 8)
  const TEAM_FMT = { team: { size: 4, cuts: [8] }, super: { size: 2, cuts: [12, 8] } };
  const same = (a, b) => Math.round(a * 10) === Math.round(b * 10); // noty z dokładnością do 0,1 pkt
  function team(event, teams, opts = {}) {
    // teams: [{nation, members:[j,...]}]
    const hill = W.getHill(event.hill);
    const equip = opts.equip;
    const F = TEAM_FMT[event.format] || TEAM_FMT.team;
    const wind = windOf(hill);
    const res = { type: 'team', format: event.format, eventId: event.id, level: event.level, hill: event.hill, rounds: [], ranking: [] };
    if (teams.length < 2) return res;
    const scores = {};
    const jumpsBy = {};
    const stage = {};
    teams.forEach((t) => { scores[t.nation] = 0; jumpsBy[t.nation] = []; stage[t.nation] = 1; });
    // 1. seria: odwrotna kolejność Pucharu Narodów (kraje bez punktów pierwsze; remis – PN poprzedniego sezonu)
    const nc = opts.nc || {}, ncPrev = opts.ncPrev || {};
    const teamExp = (t) => U.sum(t.members, (j) => expected(j, hill, equip));
    let order = teams.slice().sort((a, b) => (nc[a.nation] || 0) - (nc[b.nation] || 0) || (ncPrev[a.nation] || 0) - (ncPrev[b.nation] || 0) || teamExp(a) - teamExp(b));
    // kolejne serie: odwrotna kolejność klasyfikacji konkursu (najsłabszy pierwszy)
    const reverseStanding = (list) => list.slice().sort((a, b) => scores[a.nation] - scores[b.nation]);

    for (let round = 1; round <= F.cuts.length + 1; round++) {
      const all = order.flatMap((t) => t.members);
      const ctx = roundCtx(all, hill, equip, wind);
      if (round > 1 && stormy(ctx)) { res.note = `${round}. seria odwołana z powodu wiatru – wyniki po ${round - 1}. serii.`; break; }
      const rj = [];
      for (let g = 0; g < F.size; g++) {
        // od 2. serii ostatnia grupa skacze w odwrotnej kolejności bieżącej klasyfikacji konkursu
        const grpOrder = round > 1 && g === F.size - 1 ? reverseStanding(order) : order;
        for (const t of grpOrder) {
          const j = t.members[g];
          const r = jump(j, hill, ctx, event.level, round, equip);
          r.nat = t.nation; r.grp = g + 1;
          if (Math.random() < dsqChance(j) * 0.5) { r.x = 1; r.p = 0; }
          scores[t.nation] = Math.round((scores[t.nation] + r.p) * 10) / 10;
          jumpsBy[t.nation].push(r);
          rj.push(r);
        }
      }
      res.rounds.push({ gate: ctx.gate, order: order.map((t) => t.nation), jumps: rj });
      const cut = F.cuts[round - 1];
      if (cut) {
        const sorted = order.slice().sort((a, b) => scores[b.nation] - scores[a.nation]);
        // remis na miejscu odcięcia: awansują wszystkie drużyny ex aequo
        const edge = sorted[Math.min(cut, sorted.length) - 1];
        const adv = sorted.filter((t, i) => i < cut || same(scores[t.nation], scores[edge.nation]));
        res.out = (res.out || []).concat(sorted.slice(adv.length).map((t) => t.nation));
        adv.forEach((t) => (stage[t.nation] = round + 1));
        order = reverseStanding(adv);
      }
    }
    const last = F.cuts.length + 1;
    const rows = teams.map((t) => ({ nat: t.nation, total: scores[t.nation], members: t.members.map((j) => j.id), j: jumpsBy[t.nation], stage: stage[t.nation], r2: stage[t.nation] === last ? 1 : 0 }));
    rows.sort((a, b) => (b.stage - a.stage) || (b.total - a.total));
    // równa nota (i ten sam etap konkursu) → miejsce ex aequo, następne miejsce pominięte (1, 2, 2, 4)
    rows.forEach((r, i) => { const p = rows[i - 1]; r.rank = p && p.stage === r.stage && same(p.total, r.total) ? p.rank : i + 1; });
    res.ranking = rows;
    return res;
  }

  const teamSize = (format) => (TEAM_FMT[format] || TEAM_FMT.team).size;
  return { individual, team, teamSize, TEAM_FMT, meterValue, expected, windFactor, _jump: (j, hill, ctx) => jump(j, hill, ctx, "WC", 1, {}) };
})();
