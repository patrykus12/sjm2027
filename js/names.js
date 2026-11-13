// ===== Edytor nazwisk =====
// Gracz może zmienić imię i nazwisko każdej osoby z bazy: zawodników (js/realdb.js, realextra.js), trenerów (realstaff.js)
// i legend z historii (realpodium.js, realglobes.js, realtitles.js, realmedals.js). Zmiany trzymamy w localStorage
// ({ klucz: { f, l } }, klucz = imię i nazwisko z bazy po normalizacji jak w SJM.W.normName) i nakładamy:
//  - na tabele z bazy zaraz po ich wczytaniu (nowa gra, statystyki wszech czasów, prawdziwe podia i medale),
//  - na wczytaną karierę (syncState): zawodnicy, sztab, historia sezonów, wiadomości – stan.nameMap pamięta,
//    jakie nazwiska są w tym zapisie, więc kolejne zmiany w edytorze przechodzą także na starsze zapisy.
// Ta sama osoba zapisana w różnych tabelach różną pisownią (np. Ryoyu / Ryōyū) ma jeden klucz.
SJM.NAMES = (function () {
  const KEY = 'sjm2027:names';
  const norm = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L').replace(/ø/g, 'o').toLowerCase().replace(/[^a-z]/g, '');
  const KINDS = { jumper: 'Zawodnik', staff: 'Trener', legend: 'Legenda' };

  const slots = [];        // miejsca w tabelach: { key, set(f, l) }
  const people = new Map(); // klucz -> { key, f, l (z bazy), nat, kind, r }
  let over = read();

  function read() {
    try { const o = JSON.parse(localStorage.getItem(KEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; }
  }
  function write() {
    try { localStorage.setItem(KEY, JSON.stringify(over)); return true; } catch (e) { return false; }
  }

  function person(f, l, nat, kind, r) {
    const key = norm(f + l);
    if (!people.has(key)) people.set(key, { key, f, l, nat, kind, r: r || 0 });
    return key;
  }
  function split(full) { const i = full.indexOf(' '); return i < 0 ? ['', full] : [full.slice(0, i), full.slice(i + 1)]; }

  // zapamiętanie miejsc z nazwiskami w tabelach (przed pierwszą zmianą, więc z nazwiskami z bazy)
  function snapshot() {
    for (const rec of SJM.REAL_JUMPERS || []) {
      const key = person(rec.f, rec.l, rec.n, 'jumper', rec.r);
      rec.nk = key; // klucz z bazy – world.js szuka po nim cech zawodnika (js/traits.js)
      slots.push({ key, orig: [rec.f, rec.l], set: (f, l) => { rec.f = f; rec.l = l; } });
    }
    const staff = (x, nat) => {
      const key = person(x.first, x.last, x.nat || nat, 'staff');
      slots.push({ key, orig: [x.first, x.last], set: (f, l) => { x.first = f; x.last = l; } });
    };
    for (const [code, roles] of Object.entries(SJM.REAL_STAFF || {})) for (const x of Object.values(roles)) if (x) staff(x, code);
    for (const x of SJM.REAL_STAFF_FREE || []) staff(x, x.nat);
    const legend = (row, nat) => {
      const [f, l] = split(row[0]);
      const key = person(f, l, typeof nat === 'string' ? nat : '', 'legend');
      slots.push({ key, orig: [f, l], set: (nf, nl) => { row[0] = (nf ? nf + ' ' : '') + nl; } });
    };
    for (const row of SJM.REAL_PODIUMS || []) legend(row, row[1]);
    for (const row of SJM.REAL_OVERALL || []) legend(row, row[1]);
    for (const comp of Object.values(SJM.REAL_TITLES || {})) for (const row of comp.ind || []) legend(row, row[1]);
    for (const row of SJM.REAL_MEDALS || []) legend(row, '');
  }

  function nameOf(key) { const o = over[key], p = people.get(key); return o ? [o.f, o.l] : [p.f, p.l]; }

  // nałożenie zmian na tabele z bazy; miejsca bez zmiany wracają do pisowni z bazy
  function applyTables() {
    for (const s of slots) {
      const o = over[s.key];
      if (o) s.set(o.f, o.l); else s.set(s.orig[0], s.orig[1]);
    }
    if (SJM.W && SJM.W.resetNameIdx) SJM.W.resetNameIdx();
  }
  // ---------- kariera (zapis) ----------
  // zamiana nazwisk w całym stanie gry: obiekty { first, last } i teksty (nazwiska w historii, wiadomościach)
  function syncState(st) {
    if (!st || !st.jumpers) return 0;
    const had = st.nameMap || {};
    const pairs = [];
    for (const key of new Set(Object.keys(had).concat(Object.keys(over)))) {
      const p = people.get(key);
      if (!p) continue;
      const cur = had[key] || [p.f, p.l], want = nameOf(key);
      if (cur[0] !== want[0] || cur[1] !== want[1]) pairs.push({ from: cur[0] + ' ' + cur[1], f: want[0], l: want[1], to: want[0] + ' ' + want[1] });
    }
    st.nameMap = {};
    for (const key of Object.keys(over)) if (people.has(key)) st.nameMap[key] = nameOf(key);
    if (!pairs.length) return 0;
    const byNorm = new Map(pairs.map((p) => [norm(p.from), p]));
    const exact = new Map(pairs.map((p) => [p.from, p.to]));
    const rx = new RegExp('(?<!\\p{L})(?:' + pairs.map((p) => p.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length).join('|') + ')(?!\\p{L})', 'gu');
    let n = 0;
    const ren = (v) => {
      if (v.length <= 60) { const p = byNorm.get(norm(v)); if (p && norm(v).length > 3) { n++; return p.to; } }
      if (v.length > 8) { const r = v.replace(rx, (m) => exact.get(m)); if (r !== v) n++; return r; }
      return v;
    };
    const seen = new Set();
    const walk = (o) => {
      if (seen.has(o)) return; seen.add(o);
      if (Array.isArray(o)) {
        for (let i = 0; i < o.length; i++) { const v = o[i]; if (typeof v === 'string') o[i] = ren(v); else if (v && typeof v === 'object') walk(v); }
        return;
      }
      const named = typeof o.first === 'string' && typeof o.last === 'string';
      if (named) { const p = byNorm.get(norm(o.first + o.last)); if (p) { o.first = p.f; o.last = p.l; n++; } }
      for (const k of Object.keys(o)) {
        const v = o[k];
        if (typeof v === 'string') { if (!(named && (k === 'first' || k === 'last')) && k !== 'id') o[k] = ren(v); }
        else if (v && typeof v === 'object' && k !== 'nameMap') walk(v);
      }
    };
    walk(st);
    return n;
  }

  // ---------- pliki z listą nazwisk ----------
  function exportNames(map = over) {
    const names = Object.keys(map).filter((k) => people.has(k)).map((k) => { const p = people.get(k); return { from: p.f + ' ' + p.l, f: map[k].f, l: map[k].l }; });
    const data = JSON.stringify({ format: 'sjm2027-names', version: 1, names }, null, 1);
    const name = 'nazwiska-SJM2027.json';
    if (window.SJMAndroid) return window.SJMAndroid.saveFile(name, data);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // JSON z eksportu albo tekst: „Stare Nazwisko = Nowe” (wszystkie osoby o tym nazwisku)
  // lub „Imię Nazwisko = Imię Nazwisko” (jedna osoba). Zwraca liczbę zmienionych osób.
  function parseInto(text, draft) {
    let n = 0;
    const setP = (key, f, l) => { const p = people.get(key); if (!p || !l) return; if (f === p.f && l === p.l) delete draft[key]; else draft[key] = { f, l }; n++; };
    const cur = (key) => draft[key] ? [draft[key].f, draft[key].l] : [people.get(key).f, people.get(key).l];
    let j = null;
    try { j = JSON.parse(text); } catch (e) { /* tekst */ }
    if (j && Array.isArray(j.names)) {
      for (const x of j.names) if (x && x.from && typeof x.l === 'string') setP(norm(x.from), String(x.f || '').trim(), x.l.trim());
      return n;
    }
    for (const line of String(text).split(/\r?\n/)) {
      if (/^\s*(#|$)/.test(line) || line.indexOf('=') < 0) continue;
      const [a, b] = line.split('=').map((t) => t.trim());
      if (!a || !b) continue;
      const key = norm(a);
      if (people.has(key) && a.indexOf(' ') > 0) {
        const p = people.get(key), first = cur(key)[0];
        if (b.startsWith(first + ' ')) setP(key, first, b.slice(first.length + 1)); else { const [f, l] = split(b); setP(key, f, l); }
      } else {
        for (const p of people.values()) { const c = cur(p.key); if (norm(c[1]) === key) setP(p.key, c[0], b); }
      }
    }
    return n;
  }

  // ---------- okno edytora ----------
  let draft = null, filt = { q: '', kind: '', nat: '', changed: false }, limit = 120;
  const U = () => SJM.U;

  function list() {
    const q = norm(filt.q);
    const out = [];
    for (const p of people.values()) {
      if (filt.kind && p.kind !== filt.kind) continue;
      if (filt.nat && p.nat !== filt.nat) continue;
      if (filt.changed && !draft[p.key]) continue;
      if (q) { const d = draft[p.key]; if (!(p.key.includes(q) || (d && norm(d.f + d.l).includes(q)))) continue; }
      out.push(p);
    }
    const ord = { jumper: 0, staff: 1, legend: 2 };
    return out.sort((a, b) => ord[a.kind] - ord[b.kind] || b.r - a.r || a.l.localeCompare(b.l));
  }

  function rowsHtml() {
    const esc = U().esc, all = list();
    const rows = all.slice(0, limit).map((p) => {
      const d = draft[p.key], f = d ? d.f : p.f, l = d ? d.l : p.l;
      return `<tr data-key="${p.key}" class="${d ? 'nm-changed' : ''}">
        <td>${SJM.W.flag(p.nat) || `<span class="small muted">${esc(p.nat)}</span>`}</td>
        <td><input type="text" data-nm-f value="${esc(f)}" maxlength="40"></td>
        <td><input type="text" data-nm-l value="${esc(l)}" maxlength="40">${d ? `<div class="small muted" title="Nazwisko z bazy">z bazy: ${esc(p.f + ' ' + p.l)}</div>` : ''}</td>
        <td class="small muted nm-kind">${KINDS[p.kind]}</td>
        <td>${d ? `<button class="btn small" data-nm="reset1" title="Przywróć nazwisko z bazy">↺</button>` : ''}</td></tr>`;
    }).join('');
    return `<table class="nm-table" style="width:100%"><colgroup><col class="nm-c-fl"><col><col><col class="nm-c-kind"><col class="nm-c-x"></colgroup>
      <thead><tr><th></th><th>Imię</th><th>Nazwisko</th><th class="nm-kind"></th><th></th></tr></thead><tbody>${rows}</tbody></table>
      ${all.length > limit ? `<div class="row mt"><button class="btn small" data-nm="more">Pokaż więcej (${all.length - limit})</button></div>` : ''}
      ${all.length ? '' : '<p class="muted">Brak osób spełniających warunki.</p>'}`;
  }

  function counter() { const n = Object.keys(draft).length; return n ? `Zmienione: ${n}` : 'Bez zmian – nazwiska z bazy'; }

  function open() {
    draft = JSON.parse(JSON.stringify(over));
    for (const k of Object.keys(draft)) if (!people.has(k)) delete draft[k];
    limit = 120;
    const esc = U().esc;
    const nats = [...new Set([...people.values()].map((p) => p.nat).filter((c) => c && SJM.W.nationData(c)))]
      .sort((a, b) => SJM.W.nationData(a).name.localeCompare(SJM.W.nationData(b).name));
    SJM.UI.openModal(`<button class="close" data-act="close">×</button><h2>✏️ Edytor nazwisk</h2>
      <p class="small muted">Zmień imię lub nazwisko dowolnego zawodnika, trenera albo legendy z historii. Zmiany obowiązują w nowych grach i we wczytanych karierach (także w statystykach i historii). Listę możesz zapisać do pliku i wczytać na innym urządzeniu. Plik tekstowy może mieć linie <code>Stare nazwisko = Nowe</code> (wszystkie osoby o tym nazwisku) albo <code>Imię Nazwisko = Imię Nazwisko</code>.</p>
      <div class="row mb" style="flex-wrap:wrap;gap:6px">
        <input type="text" data-nm-q placeholder="Szukaj…" value="${esc(filt.q)}" style="flex:1;min-width:140px">
        <select data-nm-kind><option value="">Wszyscy</option>${Object.entries(KINDS).map(([k, v]) => `<option value="${k}" ${filt.kind === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
        <select data-nm-nat><option value="">Wszystkie kraje</option>${nats.map((c) => `<option value="${c}" ${filt.nat === c ? 'selected' : ''}>${esc(SJM.W.nationData(c).name)}</option>`).join('')}</select>
        <label class="small"><input type="checkbox" data-nm-changed ${filt.changed ? 'checked' : ''}> tylko zmienione</label>
      </div>
      <div id="nm-list" style="max-height:52vh;overflow:auto">${rowsHtml()}</div>
      <div class="row mt" style="flex-wrap:wrap;gap:6px">
        <button class="btn go" data-nm="save">💾 Zapisz zmiany</button>
        <button class="btn" data-nm="export">📤 Zapisz listę do pliku</button>
        <button class="btn" data-nm="import">📥 Wczytaj listę z pliku</button>
        <button class="btn" data-nm="resetall">↺ Wszystkie z bazy</button>
        <span class="small muted" id="nm-count">${counter()}</span>
      </div>`);
  }

  function refresh() {
    const el = document.getElementById('nm-list');
    if (el) el.innerHTML = rowsHtml();
    const c = document.getElementById('nm-count');
    if (c) c.textContent = counter();
  }

  function setOverrides(o) { over = o; const ok = write(); applyTables(); return ok; }
  function save() {
    if (!setOverrides(draft)) { SJM.UI.toast('Nie udało się zapisać nazwisk (brak miejsca?)', true); return; }
    const st = SJM.state, inGame = st && !document.getElementById('app').classList.contains('hidden');
    if (inGame) { syncState(st); SJM.SAVE.save('auto'); }
    SJM.UI.closeModal();
    if (inGame) SJM.UI.render();
    SJM.UI.toast('Zapisano nazwiska');
  }

  function importFile() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,.txt,application/json,text/plain';
    inp.onchange = () => {
      const file = inp.files[0]; if (!file) return;
      const r = new FileReader();
      r.onload = () => {
        const n = parseInto(String(r.result), draft);
        refresh();
        SJM.UI.toast(n ? `Wczytano zmiany: ${n}. Kliknij „Zapisz zmiany”.` : 'W pliku nie znaleziono pasujących nazwisk', !n);
      };
      r.readAsText(file);
    };
    inp.click();
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-nm]');
    if (!b || !draft) return;
    const a = b.dataset.nm;
    if (a === 'save') save();
    else if (a === 'export') exportNames(draft);
    else if (a === 'import') importFile();
    else if (a === 'more') { limit += 200; refresh(); }
    else if (a === 'resetall') { if (confirm('Przywrócić wszystkie nazwiska z bazy?')) { draft = {}; refresh(); } }
    else if (a === 'reset1') { delete draft[b.closest('tr').dataset.key]; refresh(); }
  });
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (!draft || !t.closest || !t.closest('#modal')) return;
    if (t.matches('[data-nm-q]')) { filt.q = t.value; limit = 120; refresh(); return; }
    if (t.matches('[data-nm-f], [data-nm-l]')) {
      const tr = t.closest('tr'), key = tr.dataset.key, p = people.get(key);
      const f = tr.querySelector('[data-nm-f]').value.trim(), l = tr.querySelector('[data-nm-l]').value.trim();
      if (!l || (f === p.f && l === p.l)) delete draft[key]; else draft[key] = { f, l };
      tr.classList.toggle('nm-changed', !!draft[key]);
      const c = document.getElementById('nm-count'); if (c) c.textContent = counter();
    }
  });
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (!draft || !t.closest || !t.closest('#modal')) return;
    if (t.matches('[data-nm-kind]')) filt.kind = t.value;
    else if (t.matches('[data-nm-nat]')) filt.nat = t.value;
    else if (t.matches('[data-nm-changed]')) filt.changed = t.checked;
    else return;
    limit = 120; refresh();
  });

  return { open, setOverrides, syncState, parseInto, exportNames, people: () => people, overrides: () => over, norm, init };

  // wywoływane od razu po wczytaniu tabel z bazy (koniec tego pliku)
  function init() { snapshot(); applyTables(); }
})();
SJM.NAMES.init();
