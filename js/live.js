// ===== Relacja na żywo (powtórka konkursu) =====
SJM.LIVE = (function () {
  const U = SJM.U, W = SJM.W;
  let L = null; // stan relacji

  function geom(hill) {
    const T = { x: 120, y: 112 };
    const maxM = hill.HS * 1.32;
    const scale = 600 / maxM;
    const pts = [];
    let x = T.x, y = T.y + 10;
    const dm = maxM / 120;
    for (let m = 0; m <= maxM; m += dm) {
      const t = m / hill.HS;
      let a;
      if (t < 0.08) a = 0.22;
      else if (t < 0.6) a = 0.22 + (t - 0.08) / 0.52 * 0.42;
      else if (t < 1.0) a = 0.64 - (t - 0.6) / 0.4 * 0.36;
      else if (t < 1.2) a = 0.28 - (t - 1.0) / 0.2 * 0.28;
      else a = 0;
      pts.push({ m, x, y });
      x += Math.cos(a) * dm * scale;
      y += Math.sin(a) * dm * scale * 1.15;
    }
    const at = (m) => {
      const i = Math.min(pts.length - 2, Math.max(0, Math.floor(m / dm)));
      const f = U.clamp((m - pts[i].m) / dm, 0, 1);
      return { x: pts[i].x + (pts[i + 1].x - pts[i].x) * f, y: pts[i].y + (pts[i + 1].y - pts[i].y) * f };
    };
    return { T, pts, at, scale };
  }

  function svg(hill, g) {
    const path = g.pts.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ');
    const last = g.pts[g.pts.length - 1];
    const fill = path + ` L ${last.x} 400 L ${g.pts[0].x} 400 Z`;
    const ticks = [];
    for (let m = 20; m < hill.HS * 1.25; m += 10) {
      const p = g.at(m);
      ticks.push(`<line x1="${p.x}" y1="${p.y}" x2="${p.x}" y2="${p.y + 6}" stroke="#7d93ab" stroke-width="1"/>`);
      if (m % 20 === 0 && m > hill.K * 0.5) ticks.push(`<text x="${p.x}" y="${p.y + 18}" fill="#7d93ab" font-size="9" text-anchor="middle">${m}</text>`);
    }
    const k = g.at(hill.K), hs = g.at(hill.HS);
    return `<svg viewBox="0 0 760 400" id="live-svg">
      <defs><linearGradient id="snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9f2fb"/><stop offset="1" stop-color="#b7c9dc"/></linearGradient></defs>
      <path d="M 10 10 Q 70 40 ${g.T.x} ${g.T.y}" stroke="#c9d6e3" stroke-width="5" fill="none"/>
      <rect x="${g.T.x - 6}" y="${g.T.y - 2}" width="10" height="160" fill="#2a3d52"/>
      <path d="${fill}" fill="url(#snow)" opacity=".95"/>
      <path d="${path}" stroke="#ffffff" stroke-width="2" fill="none"/>
      ${ticks.join('')}
      <line x1="${k.x}" y1="${k.y - 14}" x2="${k.x}" y2="${k.y + 8}" stroke="#ff4d4d" stroke-width="3"/><text x="${k.x}" y="${k.y - 18}" fill="#ff7a7a" font-size="12" font-weight="700" text-anchor="middle">K${hill.K}</text>
      <line x1="${hs.x}" y1="${hs.y - 14}" x2="${hs.x}" y2="${hs.y + 8}" stroke="#2bd4a4" stroke-width="3"/><text x="${hs.x}" y="${hs.y - 18}" fill="#2bd4a4" font-size="12" font-weight="700" text-anchor="middle">HS${hill.HS}</text>
      <g id="live-lead"></g>
      <g id="live-marks"></g>
      <path id="live-trail" d="" stroke="#ffd36b" stroke-width="1.5" stroke-dasharray="3 3" fill="none"/>
      <g id="live-jumper" transform="translate(${g.T.x},${g.T.y})"><line x1="-10" y1="3" x2="10" y2="-3" stroke="#ffd36b" stroke-width="3"/><circle r="4.5" fill="#ff4d4d"/></g>
      <g id="live-wind" transform="translate(690,40)"></g>
      <text id="live-gate" x="20" y="390" fill="#8a9bb0" font-size="12"></text>
    </svg>`;
  }

  function buildFrames(res) {
    const frames = [];
    if (res.type === 'ind') {
      // kwalifikacje (runda 0) – w kolejności startowej, jeśli jest zapisana
      if (res.qual && res.qual.jumps.length) {
        const byId = Object.fromEntries(res.qual.jumps.map((q) => [q.id, q]));
        const order = res.qual.order || U.shuffle(res.qual.jumps.map((q) => q.id));
        order.forEach((id) => byId[id] && frames.push({ round: 0, gate: byId[id].g || res.qual.gate, jump: byId[id] }));
      }
      res.rounds.forEach((r, ri) => r.jumps.forEach((j) => frames.push({ round: ri + 1, gate: j.g || r.gate, jump: j })));
    } else {
      res.rounds.forEach((r, ri) => r.jumps.forEach((j) => frames.push({ round: ri + 1, gate: j.g || r.gate, jump: j, team: j.nat, grp: j.grp })));
    }
    return frames;
  }

  // opts: { live: true (transmisja na żywo, wynik nieznany), queue: [kolejne konkursy], onExit: fn (po zakończeniu/zamknięciu) }
  let prefs = { speed: 1, onlyMine: false };
  function open(eventId, opts = {}) {
    const s = SJM.state;
    const res = s.results[eventId];
    const ev = s.calendar.weeks.flatMap((w) => w.events).find((e) => e.id === eventId);
    if (!res || !ev) { if (opts.queue && opts.queue.length) return open(opts.queue[0], { ...opts, queue: opts.queue.slice(1) }); if (opts.onExit) opts.onExit(); return; }
    stop(true);
    const hill = W.getHill(ev.hill);
    const g = geom(hill);
    L = { res, ev, hill, g, frames: buildFrames(res), i: 0, speed: prefs.speed, playing: true, onlyMine: prefs.onlyMine, scores: {}, r1: {}, timer: null, raf: null, lastId: null, prevRound: null,
      live: !!opts.live, queue: opts.queue || [], onExit: opts.onExit || null };
    L.tab = 'main';
    L.tour = tourBase(ev);
    L.nc = ncBase(ev);
    const tabs = [['main', 'Konkurs']].concat(L.tour ? [['tour', 'Klasyfikacja ' + L.tour.name]] : [], L.nc ? [['nc', L.nc.name]] : []);
    const left = L.queue.length;
    SJM.UI.openModal(`<button class="close" data-act="close">×</button>
      <div class="row between mb"><div><h2 style="margin:0">${L.live ? '<span class="pill onair">● NA ŻYWO</span> ' : ''}${U.esc(SJM.CAL.eventTitle(ev))}</h2><div class="muted small">${U.esc(hill.name)}, ${U.esc(hill.city)} · K-${hill.K} · HS${hill.HS}${left ? ` · jeszcze ${left} ${left === 1 ? 'konkurs' : 'konkursy'} w kolejce` : ''}</div></div>
      <div class="row" style="margin-right:28px"><button class="btn small" id="lv-play">⏸ Pauza</button>
        <select id="lv-speed">${[0.5, 1, 2, 5, 15].map((v) => `<option value="${v}" ${v === L.speed ? 'selected' : ''}>${String(v).replace('.', ',')}×</option>`).join('')}</select>
        <label class="small"><input type="checkbox" id="lv-mine" ${L.onlyMine ? 'checked' : ''}> tylko nasi + czołówka</label>
        <button class="btn small" id="lv-end">⏭ Do końca</button></div></div>
      <div class="live"><div>${svg(hill, g)}<div class="jumpcard" id="lv-card"><div class="muted">${L.frames.length && L.frames[0].round === 0 ? 'Za chwilę kwalifikacje…' : 'Za chwilę pierwszy skok…'}</div></div></div>
      <div class="card tight board">${tabs.length > 1 ? `<div class="tabs" id="lv-tabs" style="margin:0 0 6px">${tabs.map(([t, label], i) => `<button ${i ? '' : 'class="active"'} data-t="${t}">${U.esc(label)}</button>`).join('')}</div>` : ''}<h3 id="lv-board-title">Tablica wyników</h3><table id="lv-board"></table></div></div>`);
    if (tabs.length > 1) document.querySelectorAll('#lv-tabs button').forEach((b) => (b.onclick = () => {
      L.tab = b.dataset.t;
      document.querySelectorAll('#lv-tabs button').forEach((x) => x.classList.toggle('active', x === b));
      renderMain();
    }));
    document.getElementById('lv-play').onclick = () => { if (L.playing) { L.playing = false; clearTimeout(L.timer); document.getElementById('lv-play').textContent = '▶ Wznów'; } else resume(); };
    document.getElementById('lv-speed').onchange = (e) => { L.speed = +e.target.value; prefs.speed = L.speed; };
    document.getElementById('lv-mine').onchange = (e) => { L.onlyMine = e.target.checked; prefs.onlyMine = L.onlyMine; };
    document.getElementById('lv-end').onclick = () => finish();
    renderBoard();
    startList();
  }

  // lista startowa przed konkursem (kolejność 1. rundy: kwalifikacji albo 1. serii)
  function startList() {
    const s = SJM.state;
    L.playing = false;
    const first = L.frames.length ? L.frames[0].round : 1;
    const fr = L.frames.filter((f) => f.round === first);
    renderMain();
    const play = document.getElementById('lv-play');
    if (play) play.textContent = '▶ Rozpocznij';
    const card = document.getElementById('lv-card');
    if (card) {
      card.innerHTML = `<div class="muted small">LISTA STARTOWA</div><div class="nm">${fr.length} ${L.res.type === 'team' ? 'skoczków w drużynach' : 'zawodników'} · belka ${fr[0] ? fr[0].gate : '–'}</div>
        <div class="small muted mt">Obok nazwisk: ocena zawodnika. Nasi są wyróżnieni.</div><div class="row mt"><button class="btn primary" id="lv-cont">▶ Rozpocznij ${first === 0 ? 'kwalifikacje' : 'konkurs'}</button></div>`;
      document.getElementById('lv-cont').onclick = () => resume();
    }
  }

  // klasyfikacja generalna cyklu (PŚ, LGP, PK, LPK, FIS Cup) przed tym konkursem – z wyników wcześniejszych konkursów cyklu w sezonie
  function cycleBase() {
    const ev = L.ev;
    if (!ev || L.res.type !== 'ind' || !SJM.M.CUP_KEY[ev.level]) return null;
    const s = SJM.state, evs = s.calendar.weeks.flatMap((w) => w.events), idx = evs.findIndex((e) => e.id === ev.id);
    if (idx < 0) return null;
    const pts = {}, fly = {};
    const isFly = (e) => W.getHill(e.hill).K >= 170;
    evs.slice(0, idx).filter((e) => e.level === ev.level && e.format === 'ind').forEach((e) => {
      const r = s.results[e.id];
      if (r && r.ranking) r.ranking.forEach((x) => { if (x.rank && x.rank <= 30) {
        pts[x.id] = (pts[x.id] || 0) + SJM.WC_POINTS[x.rank - 1];
        if (ev.level === 'WC' && isFly(e)) fly[x.id] = (fly[x.id] || 0) + SJM.WC_POINTS[x.rank - 1];
      } });
    });
    // loty w PŚ: lista startowa wg klasyfikacji PŚ w lotach (o ile był już konkurs lotów)
    const byFly = ev.level === 'WC' && isFly(ev) && Object.keys(fly).length > 0;
    const shown = byFly ? fly : pts;
    const sorted = Object.entries(shown).sort((a, b) => b[1] - a[1]), rank = {};
    sorted.forEach(([id, p], i) => (rank[id] = i && p === sorted[i - 1][1] ? rank[sorted[i - 1][0]] : i + 1));
    return { short: byFly ? 'PŚwL' : SJM.LEVELS[ev.level].short, pts: shown, gk: pts, rank, host: SJM.M.hostNationOf(ev.hill) };
  }

  // tabela listy startowej: punkty i miejsce w klasyfikacji cyklu, grupa krajowa, w turnieju miejsce w klasyfikacji turnieju
  function startTable() {
    const s = SJM.state;
    const first = L.frames.length ? L.frames[0].round : 1;
    const fr = L.frames.filter((f) => f.round === first);
    const t = document.getElementById('lv-board-title');
    if (t) t.textContent = `Lista startowa · ${first === 0 ? 'kwalifikacje' : '1. seria'} (${fr.length})`;
    const tbl = document.getElementById('lv-board');
    const tr = L.tour && L.tour.stage > 1 ? tourRanks(false) : null;
    const cy = cycleBase();
    const ng = (jp) => cy && jp && jp.nation === cy.host && !cy.gk[jp.id];
    const head = tr || cy ? `<tr><th></th><th></th><th class="num small muted" title="Ocena zawodnika">ocena</th>${cy ? `<th class="num small muted" title="Punkty w klasyfikacji generalnej ${cy.short} przed konkursem">pkt ${cy.short}</th><th class="num small muted" title="Miejsce w klasyfikacji generalnej ${cy.short} przed konkursem">msc</th>` : ''}${tr ? `<th class="num small muted">${U.esc(L.tour.name)}</th>` : ''}</tr>` : '';
    // grupa krajowa skacze na początku (ciągły blok; powtórki sprzed tej zasady mogą go nie mieć)
    let nNg = 0;
    while (nNg < fr.length && ng(s.jumpers[fr[nNg].jump.id])) nNg++;
    if (tbl) tbl.innerHTML = head + fr.map((f, i) => {
      const jp = s.jumpers[f.jump.id];
      const mine = jp && jp.nation === s.nation;
      const tp = tr && tr.rank[f.jump.id];
      const sep = nNg && (i === 0 || i === nNg) ? `<tr><td colspan="6" class="small muted">${i === 0 ? `Grupa krajowa (${W.nationData(cy.host).name}) – zawodnicy gospodarza bez punktów ${SJM.LEVELS[L.ev.level].short}` : 'Pozostali – bez punktów w losowej kolejności, potem odwrotnie do klasyfikacji'}</td></tr>` : '';
      return `${sep}<tr class="${mine ? 'mine' : ''}"><td class="num">${i + 1}.</td><td>${jp ? W.flag(jp.nation) + ' ' + U.esc(W.fullName(jp)) : '?'}${f.team ? ` <span class="small muted">(${U.esc(W.nationData(f.team).name)}, gr. ${f.grp})</span>` : ''}${ng(jp) ? ' <span class="small muted" title="Grupa krajowa">GK</span>' : ''}</td><td class="num small muted">${jp ? Math.round(W.overall(jp)) : ''}</td>${cy ? `<td class="num small">${cy.pts[f.jump.id] || '<span class="muted">–</span>'}</td><td class="num small">${cy.rank[f.jump.id] ? `<b>${cy.rank[f.jump.id]}.</b>` : '<span class="muted">–</span>'}</td>` : ''}${tr ? `<td class="num small">${tp ? `<b>${tp}.</b>` : '<span class="muted">–</span>'}</td>` : ''}</tr>`;
    }).join('');
  }

  // ---------- Klasyfikacja turnieju (TCS / Raw Air) na żywo ----------
  // baza: punkty z wcześniejszych konkursów turnieju w tym sezonie (liczone z wyników, więc działa też przy powtórkach)
  function tourBase(ev) {
    if (!ev.tour || L.res.type !== 'ind') return null;
    const s = SJM.state;
    const name = ev.tour === 'TCS' ? 'TCS' : (SJM.CAL.nordicName() || 'Raw Air');
    const pts = {}, n = {};
    const add = (id, p) => (pts[id] = Math.round(((pts[id] || 0) + p) * 10) / 10);
    // Raw Air / Turniej Nordycki: liczą się też kwalifikacje i skoki w drużynówkach w weekendach turnieju
    const nordic = ev.tour !== 'TCS';
    const evs = s.calendar.weeks.flatMap((w) => w.events.map((e) => ({ e, tourWeek: w.events.some((x) => x.tour === ev.tour) })));
    const idx = evs.findIndex((x) => x.e.id === ev.id);
    evs.slice(0, Math.max(0, idx)).forEach(({ e, tourWeek }) => {
      const r = s.results[e.id];
      if (!r || !r.ranking) return;
      if (e.tour === ev.tour) {
        r.ranking.forEach((x) => { if (x.rank) { add(x.id, x.total); n[x.id] = (n[x.id] || 0) + 1; } });
        if (nordic && r.qual) r.qual.jumps.forEach((q) => { if (!q.x) add(q.id, q.p); });
      } else if (nordic && tourWeek && e.level === 'WC' && r.type === 'team') r.ranking.forEach((row) => (row.j || []).forEach((q) => { if (!q.x) add(q.id, q.p); }));
    });
    return { name, nordic, stage: ev.tourStage, stages: ev.tour === 'TCS' ? 4 : (ev.tourN || 3), pts, n };
  }
  // live = z punktami bieżącego konkursu (od 1. serii; w Raw Air / TN także kwalifikacje)
  function tourRanks(live) {
    const T = L.tour, tot = { ...T.pts };
    const nDone = L.n || 0;
    const cur = nDone > 0 ? L.frames[nDone - 1].round : null;
    const inComp = live && cur !== null && (cur >= 1 || T.nordic);
    const addTo = (id, p) => (tot[id] = Math.round(((tot[id] || 0) + p) * 10) / 10);
    if (inComp && T.nordic && cur >= 1 && L.res.qual) L.res.qual.jumps.forEach((q) => { if (!q.x) addTo(q.id, q.p); });
    if (inComp) for (const [id, p] of Object.entries(L.scores)) addTo(id, p);
    // jak w TCS: wszyscy z punktami (kto opuścił konkurs, ma po prostu mniej punktów)
    const rows = Object.keys(tot).length ? Object.entries(tot).sort((a, b) => b[1] - a[1]) : [];
    const rank = {}; rows.forEach(([id], i) => (rank[id] = i + 1));
    return { rows, rank, inComp };
  }
  function renderTour() {
    const s = SJM.state, T = L.tour;
    const tbl = document.getElementById('lv-board'), t = document.getElementById('lv-board-title');
    if (!tbl) return;
    const { rows, inComp } = tourRanks(true);
    if (t) t.textContent = `Klasyfikacja ${T.name} ${inComp ? `na żywo (po ${T.stage - 1 ? T.stage - 1 + ' konk. + ' : ''}bieżącym)` : T.stage > 1 ? `po ${T.stage - 1} z ${T.stages} konkursów` : '– pierwszy konkurs turnieju'}`;
    if (!rows.length) { tbl.innerHTML = `<tr><td class="muted small">Klasyfikacja ruszy po pierwszej serii.</td></tr>`; return; }
    const lead = rows[0][1];
    tbl.innerHTML = rows.slice(0, 40).map(([id, p], i) => {
      const jp = s.jumpers[id];
      const today = inComp && L.scores[id] ? `<span class="small muted"> +${U.fmt1(L.scores[id])}</span>` : '';
      return `<tr class="${jp && jp.nation === s.nation ? 'mine' : ''} ${id === L.lastId && L.playing ? 'flash' : ''}"><td class="num">${i + 1}.</td><td>${jp ? W.flag(jp.nation) + ' ' + U.esc(W.fullName(jp)) : '?'}${today}</td><td class="num"><b>${U.fmt1(p)}</b></td><td class="num small muted">${i ? '−' + U.fmt1(lead - p) : ''}</td></tr>`;
    }).join('');
  }
  // Puchar Narodów (PŚ albo LGP) przed tym konkursem – z wcześniejszych konkursów cyklu w sezonie (indywidualne: pkt zawodników, drużyny: top 8)
  function ncBase(ev) {
    if (!ev || (ev.level !== 'WC' && ev.level !== 'SGP')) return null;
    const s = SJM.state, evs = s.calendar.weeks.flatMap((w) => w.events), idx = evs.findIndex((e) => e.id === ev.id);
    if (idx < 0) return null;
    const pts = {};
    evs.slice(0, idx).filter((e) => e.level === ev.level).forEach((e) => addNcPoints(pts, s.results[e.id]));
    return { pts, name: ev.level === 'SGP' ? 'Puchar Narodów LGP' : 'Puchar Narodów' };
  }
  function addNcPoints(pts, r) {
    if (!r || !r.ranking) return;
    if (r.type === 'team') r.ranking.forEach((x) => { if (x.rank && x.rank <= 8) pts[x.nat] = (pts[x.nat] || 0) + SJM.TEAM_POINTS[x.rank - 1]; });
    else r.ranking.forEach((x) => { const n = x.nat || (SJM.state.jumpers[x.id] || {}).nation; if (n && x.rank && x.rank <= 30) pts[n] = (pts[n] || 0) + SJM.WC_POINTS[x.rank - 1]; });
  }
  // na żywo: punkty bieżącego konkursu wg aktualnej tablicy (od 1. serii), po konkursie – wg wyników końcowych
  function ncRanks() {
    const s = SJM.state, nDone = L.n || 0;
    const inComp = nDone > 0 && L.frames[nDone - 1].round >= 1;
    const today = {};
    if (L.finished) addNcPoints(today, L.res);
    else if (inComp) {
      const rows = Object.entries(L.scores).sort((a, b) => b[1] - a[1]);
      if (L.res.type === 'team') rows.slice(0, 8).forEach(([nat], i) => (today[nat] = (today[nat] || 0) + SJM.TEAM_POINTS[i]));
      else rows.slice(0, 30).forEach(([id], i) => { const j = s.jumpers[id]; if (j) today[j.nation] = (today[j.nation] || 0) + SJM.WC_POINTS[i]; });
    }
    const tot = { ...L.nc.pts };
    for (const [n, p] of Object.entries(today)) tot[n] = (tot[n] || 0) + p;
    return { rows: Object.entries(tot).sort((a, b) => b[1] - a[1]), today, live: L.finished || inComp };
  }
  function renderNC() {
    const s = SJM.state;
    const tbl = document.getElementById('lv-board'), t = document.getElementById('lv-board-title');
    if (!tbl) return;
    const { rows, today, live } = ncRanks();
    if (t) t.textContent = `${L.nc.name} ${L.finished ? 'po konkursie' : live ? 'na żywo' : 'przed konkursem'}`;
    if (!rows.length) { tbl.innerHTML = `<tr><td class="muted small">Brak punktów – klasyfikacja ruszy po pierwszej serii.</td></tr>`; return; }
    const lead = rows[0][1];
    tbl.innerHTML = rows.map(([n, p], i) => {
      const add = live && today[n] ? `<span class="small muted"> +${today[n]}</span>` : '';
      return `<tr class="${n === s.nation ? 'mine' : ''}"><td class="num">${i + 1}.</td><td>${W.flag(n)} ${U.esc(W.nationData(n).name)}${add}</td><td class="num"><b>${p}</b></td><td class="num small muted">${i ? '−' + (lead - p) : ''}</td></tr>`;
    }).join('');
  }
  // tablica wg zakładki: klasyfikacja turnieju, Puchar Narodów albo konkurs (lista startowa / wyniki / wyniki końcowe)
  function renderMain() {
    if (!L) return;
    if (L.tab === 'tour' && L.tour) return renderTour();
    if (L.tab === 'nc' && L.nc) return renderNC();
    if (L.finished) return finalTable();
    if (!(L.n > 0) && !L.playing) return startTable();
    renderBoard();
  }

  // silent = przejście do kolejnego konkursu (bez wywołania onExit)
  function stop(silent) {
    if (!L) return;
    clearTimeout(L.timer);
    cancelAnimationFrame(L.raf);
    const cb = !silent && L.onExit;
    L = null;
    if (cb) setTimeout(cb, 0);
  }
  function next() {
    if (!L) return;
    const q = L.queue, cb = L.onExit;
    if (q.length) open(q[0], { live: L.live, queue: q.slice(1), onExit: cb });
    else { L.onExit = null; SJM.UI.closeModal(); if (cb) cb(); }
  }
  const roundLabel = (fr) => (fr.round === 0 ? 'kwalifikacje' : fr.team ? `seria ${fr.round}, grupa ${fr.grp}` : `seria ${fr.round}`);

  function account(fr) {
    // po kwalifikacjach tablica startuje od zera
    if (L.prevRound === 0 && fr.round === 1) { L.scores = {}; }
    L.prevRound = fr.round;
    const j = fr.jump;
    const key = fr.team || j.id;
    const pts = j.x ? 0 : j.p;
    L.scores[key] = Math.round(((L.scores[key] || 0) + pts) * 10) / 10;
    if (!fr.team && fr.round === 1) L.r1[j.id] = j;
    L.lastId = key;
    L.n = (L.n || 0) + 1; // liczba skoków już doliczonych do tablicy
  }

  function isMine(fr) {
    const s = SJM.state;
    if (fr.team) return fr.team === s.nation;
    const jp = s.jumpers[fr.jump.id];
    return jp && jp.nation === s.nation;
  }

  function step() {
    if (!L || !L.playing) return;
    if (L.i >= L.frames.length) return done();
    const fr0 = L.frames[L.i], prev = L.i > 0 ? L.frames[L.i - 1] : null;
    if (prev && fr0.round !== prev.round && fr0.round >= 2 && L.standRound !== fr0.round) { L.stand = {}; boardRows().forEach(([k], i) => (L.stand[k] = i + 1)); L.standRound = fr0.round; }
    // przerwa po zakończonej serii (kwalifikacje, 1. seria): spokojny podgląd wyników
    if (prev && fr0.round !== prev.round && L.pausedFor !== L.i) { L.pausedFor = L.i; return roundBreak(prev, fr0); }
    const fr = L.frames[L.i];
    const remaining = L.frames.length - L.i;
    // czołówka (10 ostatnich skoków konkursu) tylko w planowo ostatniej serii – przy serii odwołanej przez wiatr
    // ostatnia rozegrana seria wygląda jak każda wcześniejsza, żeby nie zdradzić odwołania przed jej końcem
    if (L.onlyMine && !isMine(fr) && (remaining > 10 || L.res.note)) {
      account(fr); L.i++;
      if (L.i % 10 === 0) renderBoard();
      L.timer = setTimeout(step, 0);
      return;
    }
    animate(fr, () => {
      account(fr);
      showResult(fr);
      renderBoard();
      L.i++;
      L.timer = setTimeout(step, 1300 / L.speed);
    });
  }

  function roundBreak(prev, nextFr) {
    L.playing = false;
    drawLead(null);
    renderBoard();
    const doneLbl = prev.round === 0 ? 'Koniec kwalifikacji' : `Koniec ${prev.round}. serii`;
    const nextLbl = nextFr.round === 1 ? 'Rozpocznij 1. serię' : `Rozpocznij ${nextFr.round}. serię`;
    const t = document.getElementById('lv-board-title');
    if (t && L.tab === 'main') t.textContent = prev.round === 0 ? 'Wyniki kwalifikacji' : `Wyniki po ${prev.round}. serii`;
    const play = document.getElementById('lv-play');
    if (play) play.textContent = '▶ ' + nextLbl;
    const card = document.getElementById('lv-card');
    if (card) {
      const s = SJM.state, rows = boardRows();
      const mine = rows.map(([k], i) => [k, i + 1]).filter(([k]) => (L.res.type === 'team' ? k === s.nation : s.jumpers[k] && s.jumpers[k].nation === s.nation));
      const lead = rows[0] ? (L.res.type === 'team' ? `${W.flag(rows[0][0])} ${W.nationData(rows[0][0]).name}` : s.jumpers[rows[0][0]] ? `${W.flag(s.jumpers[rows[0][0]].nation)} ${U.esc(W.fullName(s.jumpers[rows[0][0]]))}` : '?') : '–';
      card.innerHTML = `<div class="muted small">${doneLbl.toUpperCase()}</div><div class="nm">Prowadzi: ${lead}</div>
        <div class="small mt">${mine.length ? 'Nasi: ' + mine.map(([k, r]) => `<b>${r}.</b> ${L.res.type === 'team' ? '' : U.esc(W.fullName(s.jumpers[k]))}`).join(' · ') : '<span class="muted">Brak naszych w stawce.</span>'}</div>
        <div class="row mt"><button class="btn primary" id="lv-cont">▶ ${nextLbl}</button></div>`;
      document.getElementById('lv-cont').onclick = () => resume();
    }
  }
  function resume() {
    if (!L) return;
    L.playing = true;
    const play = document.getElementById('lv-play');
    if (play) play.textContent = '⏸ Pauza';
    step();
  }

  // zielona linia „do prowadzenia”: odległość, z jaką skoczek (drużyna) objąłby prowadzenie przy wietrze i belce tego skoku
  // i notach po 18 pkt; tylko w rozsądnym zasięgu (do HS +10 m na normalnej, +15 na dużej, +20 na gigantycznej, +25 na mamucie)
  const LEAD_OVER_HS = { flying: 25, giant: 20, large: 15 };
  function leadDist(fr) {
    const hill = L.hill, key = fr.team || fr.jump.id;
    // pierwszy skok 1. serii po kwalifikacjach: tablica zostanie wyzerowana, nie ma kogo wyprzedzać
    if (L.prevRound === 0 && fr.round === 1) return null;
    let rivals = Object.entries(L.scores).filter(([k]) => k !== key);
    if (!fr.team && fr.round >= 2) {
      // od 2. serii prowadzenie wśród tych, którzy już skoczyli w bieżącej serii
      const done = new Set(L.frames.slice(0, L.i).filter((f) => f.round === fr.round).map((f) => f.jump.id));
      rivals = rivals.filter(([k]) => done.has(k));
    }
    if (!rivals.length) return null;
    const gap = Math.max(...rivals.map(([, p]) => p)) - (L.scores[key] || 0);
    const mv = SJM.SIM.meterValue(hill.K), base = hill.K >= 170 ? 120 : 60;
    const extra = 54 + (fr.jump.wp || 0) + (fr.jump.gp || 0);
    const pts = (d) => Math.round((base + (d - hill.K) * mv + extra) * 10) / 10;
    let d = Math.ceil((hill.K + (gap - base - extra) / mv) * 2) / 2;
    while (pts(d) <= gap) d += 0.5;
    if (d < hill.K * 0.5 || d > hill.HS + (LEAD_OVER_HS[W.hillType(hill.K)] || 10)) return null;
    return d;
  }
  function drawLead(d) {
    const el = document.getElementById('live-lead');
    if (!el) return;
    if (d === null) { el.innerHTML = ''; return; }
    const p = L.g.at(d);
    // etykieta nad napisami K/HS, żeby się nie nakładały
    el.innerHTML = `<line x1="${p.x}" y1="${p.y - 34}" x2="${p.x}" y2="${p.y + 10}" stroke="#39ff6a" stroke-width="7" opacity=".25"/>
      <line x1="${p.x}" y1="${p.y - 34}" x2="${p.x}" y2="${p.y + 10}" stroke="#39ff6a" stroke-width="2.5"/>
      <text x="${p.x}" y="${p.y - 38}" fill="#39ff6a" font-size="11" font-weight="700" text-anchor="middle">${U.fmt1(d).replace('.0', '')} m</text>`;
  }

  function animate(fr, cb) {
    const s = SJM.state;
    const j = fr.jump, g = L.g;
    const jp = s.jumpers[j.id];
    const card = document.getElementById('lv-card');
    if (!card) return;
    const rnd = roundLabel(fr);
    const nxt = nextLine();
    const before = fr.round >= 2 && L.stand && L.standRound === fr.round && L.stand[fr.team || j.id] ? `<div class="small mt">Przed skokiem: <b>${L.stand[fr.team || j.id]}.</b> miejsce po ${fr.round - 1}. serii</div>` : '';
    const lead = j.x ? null : leadDist(fr);
    const leadTxt = lead !== null ? `<div class="small mt" style="color:#39ff6a">Do prowadzenia: <b>${U.fmt1(lead).replace('.0', '')} m</b> <span class="muted">(przy obecnym wietrze i notach po 18)</span></div>` : '';
    card.innerHTML = `<div class="row between"><div class="nm">${jp ? W.flag(jp.nation) + ' ' + U.esc(W.fullName(jp)) : '?'}</div><div class="muted small">${rnd} · belka ${fr.gate}</div></div><div class="muted">${jp ? W.nationData(jp.nation).name : ''}${jp ? ' · ocena ' + Math.round(W.overall(jp)) : ''}</div>${before}${leadTxt}${koLine(fr, false)}${nxt}`;
    drawLead(lead);
    document.getElementById('live-gate').textContent = `Belka ${fr.gate}`;
    const wind = document.getElementById('live-wind');
    const col = j.w >= 0 ? '#3fd17a' : '#ff5d5d';
    wind.innerHTML = `<text x="0" y="0" fill="${col}" font-size="13" font-weight="700" text-anchor="middle">${j.w >= 0 ? '↙ pod narty' : '↘ w plecy'}</text><text x="0" y="17" fill="${col}" font-size="13" text-anchor="middle">${j.w >= 0 ? '+' : ''}${j.w.toFixed(2)} m/s</text>`;
    const Lp = g.at(j.d);
    const T = g.T;
    const C = { x: T.x + (Lp.x - T.x) * 0.42, y: T.y + (Lp.y - T.y) * 0.12 - 14 };
    document.getElementById('live-trail').setAttribute('d', '');
    const dur = 1100 / Math.min(L.speed, 5);
    const t0 = performance.now();
    const el = document.getElementById('live-jumper');
    const tick = (now) => {
      if (!L) return;
      const t = Math.min(1, (now - t0) / dur);
      const e = t; // ruch jednostajny wzdłuż krzywej
      const x = (1 - e) * (1 - e) * T.x + 2 * (1 - e) * e * C.x + e * e * Lp.x;
      const y = (1 - e) * (1 - e) * T.y + 2 * (1 - e) * e * C.y + e * e * Lp.y;
      const ang = Math.atan2(2 * (1 - e) * (C.y - T.y) + 2 * e * (Lp.y - C.y), 2 * (1 - e) * (C.x - T.x) + 2 * e * (Lp.x - C.x)) * 180 / Math.PI;
      el.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${ang.toFixed(0)})`);
      const steps = 16, d = [];
      for (let k = 0; k <= steps; k++) { const u = (k / steps) * e; d.push(`${k ? 'L' : 'M'}${((1 - u) * (1 - u) * T.x + 2 * (1 - u) * u * C.x + u * u * Lp.x).toFixed(1)} ${((1 - u) * (1 - u) * T.y + 2 * (1 - u) * u * C.y + u * u * Lp.y).toFixed(1)}`); }
      document.getElementById('live-trail').setAttribute('d', d.join(' '));
      if (t < 1) L.raf = requestAnimationFrame(tick);
      else {
        const marks = document.getElementById('live-marks');
        marks.innerHTML = `<circle cx="${Lp.x}" cy="${Lp.y}" r="4" fill="${j.f ? '#ff4d4d' : '#ffd36b'}"/><text x="${Lp.x}" y="${Lp.y + 30}" fill="#ffd36b" font-size="14" font-weight="800" text-anchor="middle">${U.fmt1(j.d).replace('.0', '')} m</text>`;
        cb();
      }
    };
    L.raf = requestAnimationFrame(tick);
  }

  function showResult(fr) {
    const s = SJM.state;
    const j = fr.jump;
    const jp = s.jumpers[j.id];
    const card = document.getElementById('lv-card');
    if (!card) return;
    const sorted = [...j.n].sort((a, b) => a - b);
    let minUsed = false, maxUsed = false;
    const notes = j.n.map((n) => {
      let x = false;
      if (!minUsed && n === sorted[0]) { minUsed = true; x = true; }
      else if (!maxUsed && n === sorted[4]) { maxUsed = true; x = true; }
      return `<span class="${x ? 'x' : ''}">${n.toFixed(1)}</span>`;
    }).join('');
    const rank = currentRank(fr);
    const q = secured(fr);
    const nxt = nextLine();
    card.innerHTML = `<div class="row between"><div class="nm">${rank ? `<span class="rankbig" title="Aktualne miejsce">${rank}.</span>` : ''}${jp ? W.flag(jp.nation) + ' ' + U.esc(W.fullName(jp)) : '?'}${q ? ' <span class="qmark" title="Pewny awans">Q</span>' : ''}</div><div class="muted small">${roundLabel(fr)} · belka ${fr.gate}</div></div>
      <div class="row between"><div class="dist">${j.x ? '<span class="neg">DSQ</span>' : U.fmt1(j.d).replace('.0', '') + ' m'}${j.f ? ' <span class="neg" style="font-size:16px">UPADEK</span>' : ''}</div>
      <div style="text-align:right"><div class="small muted">punkty</div><div style="font-size:22px;font-weight:800">${j.x ? '0' : U.fmt1(j.p)}</div></div></div>
      <div class="row between small"><div class="notes">${notes}</div><div class="muted">wiatr ${j.wp >= 0 ? '+' : ''}${U.fmt1(j.wp)} pkt${j.gp ? ` · belka +${U.fmt1(j.gp)} pkt` : ''}</div></div>${koLine(fr, true)}${nxt}`;
  }

  // ---------- System KO (TCS): pary 1. serii ----------
  function koPair(id) {
    const ko = L.res.ko;
    if (!ko) return null;
    const i = ko.pairs.findIndex(([a, b]) => a === id || b === id);
    if (i < 0) return null;
    const [a, b] = ko.pairs[i];
    return { no: i + 1, opp: a === id ? b : a };
  }
  const qualRank = (id) => { const q = L.res.qual && L.res.qual.jumps.find((x) => x.id === id); return q ? q.rank : null; };
  // czy skok rywala w 1. serii jest już oddany (do skoku o indeksie upto włącznie)
  function koDone(id, upto) { return L.frames.slice(0, upto).some((f) => f.round === 1 && f.jump.id === id); }
  function koPts(id) { const f = L.frames.find((x) => x.round === 1 && x.jump.id === id); return f ? (f.jump.x ? -1 : f.jump.p) : -1; }
  function koLine(fr, after) {
    if (fr.round !== 1) return '';
    const kp = koPair(fr.jump.id);
    if (!kp) return '';
    const s = SJM.state;
    if (!kp.opp) return `<div class="small mt">Para KO ${kp.no}: bez rywala – pewny awans</div>`;
    const oj = s.jumpers[kp.opp];
    const on = oj ? `${W.flag(oj.nation)} ${U.esc(W.fullName(oj))} (Q${qualRank(kp.opp) || '?'})` : '?';
    if (!after || !koDone(kp.opp, L.i)) return `<div class="small mt">Para KO ${kp.no}: rywal ${on}${after ? ' – skacze za chwilę' : ''}</div>`;
    const a = koPts(fr.jump.id), b = koPts(kp.opp);
    const res = a === b ? '<span class="pos">remis – awansują obaj</span>' : a > b ? '<span class="pos">wygrywa pojedynek – awans</span>' : '<span class="warn">przegrywa pojedynek – szansa jako lucky loser</span>';
    return `<div class="small mt">Para KO ${kp.no} z ${on}: ${res}</div>`;
  }
  // znacznik w tablicy 1. serii KO: ✔ zwycięzca rozstrzygniętej pary, LL – lucky loser (po serii)
  function koTag(id, nDone, brk) {
    if (!L.res.ko) return '';
    if (brk && L.res.ko.lucky.includes(id)) return ' <span class="small warn" title="Lucky loser – jeden z najlepszych przegranych par">LL</span>';
    const kp = koPair(id);
    if (!kp || !koDone(id, nDone) || (kp.opp && !koDone(kp.opp, nDone))) return '';
    return !kp.opp || koPts(id) >= koPts(kp.opp) ? ' <span class="small pos" title="Wygrał pojedynek KO">✔</span>' : '';
  }

  // przerwa po 1. serii KO: przygaszeni ci, którzy nie awansowali (ani zwycięzcy pary, ani lucky loser)
  function koOut(id, brk, prevR) {
    const ko = L.res.ko;
    return !!(ko && brk && prevR === 1 && !ko.winners.includes(id) && !ko.lucky.includes(id));
  }

  // kto skacze następny (pod nazwiskiem bieżącego skoczka)
  function nextLine() {
    const s = SJM.state, cur = L.frames[L.i], nx = L.frames[L.i + 1];
    if (!nx) return '<div class="small muted mt">Następny: — (ostatni skok)</div>';
    if (cur && nx.round !== cur.round) return `<div class="small muted mt">Następny: — koniec ${cur.round === 0 ? 'kwalifikacji' : cur.round + '. serii'}</div>`;
    const jp = s.jumpers[nx.jump.id];
    return `<div class="small mt">Następny: ${jp ? W.flag(jp.nation) + ' ' + U.esc(W.fullName(jp)) : '?'}${nx.team ? ` <span class="muted">(${U.esc(W.nationData(nx.team).name)})</span>` : ''}</div>`;
  }
  // limit awansu w bieżącej rundzie (konkurs indywidualny): kwalifikacje → 1. seria, 1. seria → 2. seria
  function cutOf(round) {
    if (L.res.type !== 'ind') return 0;
    if (round === 0) return L.res.qual ? L.res.qual.jumps.filter((q) => q.q).length : 0;
    if (round === 1) return L.res.ko ? 0 : L.res.rounds[1] ? L.res.rounds[1].jumps.length : 0; // KO: awans z par, nie z top 30
    return 0;
  }
  // pewny awans: nawet gdy wszyscy pozostali w tej rundzie go wyprzedzą, mieści się w limicie
  function securedSet(upto = L.i) {
    const out = new Set();
    const cur = L.frames[Math.min(L.i, L.frames.length - 1)];
    const lastDone = upto > 0 ? L.frames[upto - 1] : null;
    const round = lastDone ? lastDone.round : cur ? cur.round : null;
    const cut = cutOf(round);
    if (!cut) return out;
    const done = L.frames.slice(0, upto).filter((f) => f.round === round);
    const remaining = L.frames.filter((f, k) => k >= upto && f.round === round).length;
    const sc = done.filter((f) => !f.jump.x).map((f) => [f.jump.id, L.scores[f.jump.id] || 0]).sort((a, b) => b[1] - a[1]);
    sc.forEach(([id, p], k) => { if (k + 1 + remaining <= cut) out.add(id); });
    return out;
  }
  function secured(fr) { return securedSet(L.i + 1).has(fr.jump.id); }

  function boardRows() {
    const s = SJM.state;
    return Object.entries(L.scores).sort((a, b) => b[1] - a[1]);
  }
  function currentRank(fr) {
    const key = fr.team || fr.jump.id;
    const rows = boardRows();
    if (!fr.team && fr.round >= 2) {
      // od 2. serii ranking wśród tych, którzy już skoczyli w bieżącej serii
      const done = new Set(L.frames.slice(0, L.i + 1).filter((f) => f.round === fr.round).map((f) => f.jump.id));
      const r2rows = rows.filter(([id]) => done.has(id));
      return r2rows.findIndex(([id]) => id === key) + 1;
    }
    return rows.findIndex(([id]) => id === key) + 1;
  }

  function renderBoard() {
    if (!L) return;
    if (L.tab === 'tour' && L.tour) return renderTour();
    if (L.tab === 'nc' && L.nc) return renderNC();
    const s = SJM.state;
    const tbl = document.getElementById('lv-board');
    if (!tbl) return;
    const isTeam = L.res.type === 'team';
    const fr = L.frames[Math.min(L.i, L.frames.length - 1)];
    // bieżąca runda = runda ostatniego oddanego skoku
    const nDone = L.n || 0;
    const curR = nDone > 0 ? L.frames[nDone - 1].round : fr ? fr.round : null;
    let rows = boardRows();
    // 2. seria (konkurs indywidualny): tylko ci, którzy oddali już oba skoki – z sumą punktów
    let done2 = 0;
    if (!isTeam && curR >= 2) {
      const d = new Set(L.frames.slice(0, nDone).filter((f) => f.round === curR).map((f) => f.jump.id));
      rows = rows.filter(([id]) => d.has(id));
      done2 = d.size;
    }
    const n2 = L.frames.filter((f) => f.round === curR).length;
    document.getElementById('lv-board-title').textContent = curR === null ? 'Tablica wyników'
      : curR === 0 ? `Kwalifikacje (awans: ${cutOf(0) || 50})` : !isTeam && curR >= 2 ? `Wyniki po ${curR} seriach (${done2}/${n2})` : `Tablica wyników · seria ${curR}`;
    // w przerwie między seriami: cała tablica, bez awansu przygaszeni
    const brk = !L.playing && L.pausedFor === L.i, prevR = brk && L.i > 0 ? L.frames[L.i - 1].round : null;
    const cut = brk && !isTeam ? cutOf(prevR) : 0;
    const qs = securedSet(nDone);
    tbl.innerHTML = rows.map(([key, pts], i) => {
      const mine = isTeam ? key === s.nation : (s.jumpers[key] && s.jumpers[key].nation === s.nation);
      const name = isTeam ? `${W.flag(key)} ${W.nationData(key).name}` : (s.jumpers[key] ? `${W.flag(s.jumpers[key].nation)} ${U.esc(W.fullName(s.jumpers[key]))}` : '?');
      return `<tr class="${mine ? "mine" : ""} ${key === L.lastId && !brk ? "flash" : ""}" ${(cut && i >= cut) || koOut(key, brk, prevR) ? `style="opacity:.45" title="Bez awansu"` : ""}><td class="num">${i + 1}.</td><td>${name}${qs.has(key) ? ' <span class="qmark" title="Pewny awans">Q</span>' : ''}${curR === 1 ? koTag(key, nDone, brk) : ''}</td><td class="num"><b>${U.fmt1(pts)}</b></td></tr>`;
    }).join('');
  }

  function finish() {
    if (!L) return;
    clearTimeout(L.timer);
    cancelAnimationFrame(L.raf);
    while (L.i < L.frames.length) { account(L.frames[L.i]); L.i++; }
    done();
  }

  // wyniki końcowe konkursu (zakładka „Konkurs” po zakończeniu)
  function finalTable() {
    const s = SJM.state, res = L.res;
    const tbl = document.getElementById('lv-board'), t = document.getElementById('lv-board-title');
    if (t) t.textContent = 'Wyniki końcowe';
    if (!tbl) return;
    if (res.type === 'ind') {
      tbl.innerHTML = res.ranking.slice(0, 50).map((r) => { const j = s.jumpers[r.id]; return `<tr class="${r.nat === s.nation ? 'mine' : ''}"><td class="num">${r.rank ? (r.rank <= 3 ? SJM.UI.medalIcon(r.rank) : r.rank + '.') : 'DSQ'}</td><td>${j ? W.flag(j.nation) + ' ' + U.esc(W.fullName(j)) : '?'}${res.ko && res.ko.lucky.includes(r.id) ? ' <span class="small muted" title="Lucky loser – awans z 1. serii jako jeden z najlepszych przegranych par KO">LL</span>' : ''}</td><td class="num small muted">${r.j.map((x) => x.x ? 'DSQ' : U.fmt1(x.d).replace('.0', '')).join(' / ')}</td><td class="num"><b>${U.fmt1(r.total)}</b></td></tr>`; }).join('');
    } else {
      tbl.innerHTML = res.ranking.map((r) => `<tr class="${r.nat === s.nation ? 'mine' : ''}"><td class="num">${r.rank <= 3 ? SJM.UI.medalIcon(r.rank) : r.rank + '.'}</td><td>${W.flag(r.nat)} ${W.nationData(r.nat).name}</td><td class="num"><b>${U.fmt1(r.total)}</b></td></tr>`).join('');
    }
  }

  function done() {
    if (!L) return;
    const s = SJM.state;
    const res = L.res;
    const card = document.getElementById('lv-card');
    const tbl = document.getElementById('lv-board');
    const play = document.getElementById('lv-play');
    if (play) play.disabled = true;
    L.finished = true;
    L.playing = false;
    drawLead(null);
    renderMain();
    const note = res.note ? `<div class="small warn mt">🌬️ ${U.esc(res.note)}</div>` : '';
    if (res.type === 'ind') {
      const w = s.jumpers[res.ranking[0].id];
      const tr = L.tour ? tourRanks(true) : null;
      const tourLine = tr && tr.rows.length ? `<div class="small mt">${U.esc(L.tour.name)} ${L.tour.stage === L.tour.stages ? '– klasyfikacja końcowa' : `po ${L.tour.stage} z ${L.tour.stages}`}: prowadzi <b>${s.jumpers[tr.rows[0][0]] ? W.flag(s.jumpers[tr.rows[0][0]].nation) + ' ' + U.esc(W.fullName(s.jumpers[tr.rows[0][0]])) : '?'}</b> (${U.fmt1(tr.rows[0][1])})</div>` : '';
      if (card) card.innerHTML = `<div class="muted small">KONIEC KONKURSU</div><div class="nm">🏆 Zwycięzca: ${w ? W.flag(w.nation) + ' ' + U.esc(W.fullName(w)) : '?'}</div><div class="dist">${U.fmt1(res.ranking[0].total)} pkt</div>${note}${tourLine}`;
    } else {
      if (card) card.innerHTML = `<div class="muted small">KONIEC KONKURSU</div><div class="nm">🏆 Zwycięża ${W.flag(res.ranking[0].nat)} ${W.nationData(res.ranking[0].nat).name}</div><div class="dist">${U.fmt1(res.ranking[0].total)} pkt</div>${note}`;
    }
    // kolejka transmisji: przejście do następnego konkursu lub podsumowania
    if (card && (L.queue.length || L.onExit)) {
      const nx = L.queue.length ? SJM.state.calendar.weeks.flatMap((w) => w.events).find((e) => e.id === L.queue[0]) : null;
      card.insertAdjacentHTML("beforeend", `<div class="row mt"><button class="btn primary" id="lv-next">${nx ? "Następny konkurs: " + U.esc(SJM.CAL.eventTitle(nx)) + " ▶" : "Podsumowanie weekendu ▶"}</button></div>`);
      document.getElementById("lv-next").onclick = () => next();
    }
  }

  // testy: przewinięcie transmisji do n-tego skoku (bez animacji) i pokazanie jego wyniku
  function seek(n) {
    if (!L) return;
    clearTimeout(L.timer); cancelAnimationFrame(L.raf);
    L.playing = false;
    while (L.i < Math.min(n, L.frames.length)) { account(L.frames[L.i]); L.i++; }
    L.i--; showResult(L.frames[L.i]); L.i++;
    renderMain();
  }

  return { open, stop, seek };
})();
