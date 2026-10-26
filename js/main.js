// ===== Zapis gry, menu, start =====
SJM.SAVE = (function () {
  const KEY = 'sjm2027:';
  function serialize() {
    return JSON.stringify(SJM.state, (k, v) => (typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 100) / 100 : v));
  }
  function meta(st) {
    const n = SJM.W.nationData(st.nation);
    return { nation: n.name, flag: st.nation, manager: st.manager.name, season: st.season, week: st.week + 1, at: Date.now() };
  }
  // Stan gry trzymamy w IndexedDB (localStorage ma limit ~5 mln znaków i nie mieścił autozapisu
  // razem z ręcznym zapisem). W localStorage zostają tylko małe metadane slotów.
  let dbp = null;
  function db() {
    if (!dbp) dbp = new Promise((res, rej) => {
      if (!window.indexedDB) return rej(new Error('brak IndexedDB'));
      const rq = indexedDB.open('sjm2027', 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore('saves');
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => rej(rq.error);
    });
    return dbp;
  }
  function idb(mode, fn) {
    return db().then((d) => new Promise((res, rej) => {
      const tx = d.transaction('saves', mode), rq = fn(tx.objectStore('saves'));
      tx.oncomplete = () => res(rq.result);
      tx.onerror = tx.onabort = () => rej(tx.error);
    }));
  }
  function save(slot) {
    const data = serialize(), m = JSON.stringify(meta(SJM.state));
    return idb('readwrite', (s) => s.put(data, slot))
      .then(() => { localStorage.setItem(KEY + slot + ':meta', m); return true; })
      .catch((e) => {
        console.error(e);
        SJM.UI.toast('Nie udało się zapisać gry (brak miejsca na dysku?). Użyj eksportu do pliku.', true);
        return false;
      });
  }
  function info(slot) {
    try { const m = localStorage.getItem(KEY + slot + ':meta'); return m ? JSON.parse(m) : null; } catch (e) { return null; }
  }
  function load(slot) {
    return idb('readonly', (s) => s.get(slot))
      .then((raw) => { if (!raw) return false; SJM.state = JSON.parse(raw); return true; })
      .catch((e) => { console.error(e); return false; });
  }
  // przeniesienie starych zapisów z localStorage do IndexedDB (zwalnia miejsce)
  function migrate() {
    return Promise.all(['auto', 'manual'].map((slot) => {
      let raw = null;
      try { raw = localStorage.getItem(KEY + slot); } catch (e) { /* brak dostępu */ }
      if (!raw) return null;
      return idb('readwrite', (s) => s.put(raw, slot))
        .then(() => localStorage.removeItem(KEY + slot))
        .catch((e) => console.error(e));
    }));
  }
  // Przenosiny profilu na inny dysk (ESET nie pozwala launcherowi czytać plików profilu przeglądarki):
  // launcher otwiera stary profil w niewidocznym oknie z ?przenies=PORT, gra wysyła mu zapisy,
  // a w nowym profilu dostaje je z powrotem jako window.SJM_IMPORT (plik import.js).
  function handoff(port) {
    const slots = {};
    return Promise.all(['auto', 'manual'].map((slot) => {
      let raw = null;
      try { raw = localStorage.getItem(KEY + slot); } catch (e) { /* brak dostępu */ }
      return idb('readonly', (s) => s.get(slot)).catch(() => null).then((d) => {
        const data = d || raw, m = info(slot);
        if (data && m) slots[slot] = { data, meta: m };
      });
    })).then(() => {
      let lastname = null;
      try { lastname = localStorage.getItem(KEY + 'lastname'); } catch (e) { /* brak dostępu */ }
      return fetch('http://127.0.0.1:' + port + '/', { method: 'POST', body: JSON.stringify({ slots, lastname }) });
    });
  }
  function importData(imp) {
    try { if (imp.lastname) localStorage.setItem(KEY + 'lastname', imp.lastname); } catch (e) { /* brak miejsca */ }
    return Promise.all(Object.keys(imp.slots || {}).map((slot) => {
      const s = imp.slots[slot];
      return idb('readwrite', (st) => st.put(s.data, slot))
        .then(() => localStorage.setItem(KEY + slot + ':meta', JSON.stringify(s.meta)))
        .catch((e) => console.error(e));
    }));
  }
  function exportFile() {
    const s = SJM.state;
    const name = `SJM2027_${s.nation}_${s.season}_t${s.week + 1}.json`;
    // aplikacja na Androida: WebView nie pobiera plików, zapis przez systemowe okno „Zapisz jako”
    if (window.SJMAndroid) return window.SJMAndroid.saveFile(name, serialize());
    const blob = new Blob([serialize()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function importFile(cb) {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = () => {
      const f = inp.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const st = JSON.parse(r.result);
          if (!st.jumpers || !st.nation) throw new Error('zły format');
          SJM.state = st; cb(true);
        } catch (e) { alert('Nieprawidłowy plik zapisu.'); cb(false); }
      };
      r.readAsText(f);
    };
    inp.click();
  }
  return { save, load, info, migrate, handoff, importData, exportFile, importFile };
})();

SJM.MAIN = (function () {
  const U = SJM.U;
  let selNation = 'POL';

  function showGame() {
    document.getElementById('start').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    SJM.M.migrate();
    SJM.UI.closeModal();
    SJM.UI.go(SJM.state.gameOver ? 'summary' : 'dashboard');
  }

  function slotBtn(slot, label) {
    const m = SJM.SAVE.info(slot);
    if (!m) return '';
    return `<button class="btn primary" data-start="load" data-slot="${slot}">${label}: ${SJM.W.flag(m.flag)} ${U.esc(m.nation)} · ${U.esc(m.manager)} · sezon ${m.season}/${String(m.season + 1).slice(2)}, tydz. ${m.week}</button>`;
  }

  function showStart() {
    SJM.UI.closeModal();
    document.getElementById('app').classList.add('hidden');
    const el = document.getElementById('start');
    el.classList.remove('hidden');
    SJM.W.syncNations(null); // ekran startowy: tylko podstawowe kraje
    const nations = SJM.NATIONS.slice().sort((a, b) => b.strength - a.strength);
    const diff = (s) => s >= 85 ? ['Potęga', 'pos'] : s >= 70 ? ['Mocna kadra', 'pos'] : s >= 55 ? ['Średniak', 'warn'] : s >= 42 ? ['Trudne wyzwanie', 'warn'] : ['Od zera', 'neg'];
    el.innerHTML = `
      <div class="title">SKI JUMPING <span>MANAGER</span> 2027</div>
      <div class="sub">Poprowadź kadrę narodową skoczków od Pucharu FIS po złoto olimpijskie</div>
      <div class="start-panel">
        <div class="row mb">${slotBtn('auto', '▶ Kontynuuj (autozapis)')}${slotBtn('manual', '📂 Wczytaj zapis')}<button class="btn" data-start="import">📥 Importuj z pliku</button></div>
        <div class="card mb"><h2>Nowa gra</h2>
          <div class="row mb"><label>Imię i nazwisko menedżera:</label><input type="text" id="mgr-name" value="${U.esc(localStorage.getItem('sjm2027:lastname') || '')}" placeholder="np. Jan Kowalski" maxlength="40" style="width:260px"></div>
          <h3>Wybierz kraj</h3>
          <div class="nations">${nations.map((n) => { const [d, c] = diff(n.strength); const all = SJM.HILLS.filter((h) => h.nation === n.code), hills = all.filter((h) => !h.club), clubN = all.length - hills.length; return `<div class="nation-card ${n.code === selNation ? 'sel' : ''}" data-start="nation" data-code="${n.code}">
            <div class="f">${SJM.W.flag(n.code)}</div><div class="n">${n.name}</div><div class="small ${c}">${d}</div>
            <div class="small muted">Budżet: ${n.budget} mln € · Popularność: ${n.pop}</div><div class="small muted">Skocznie: ${hills.length ? hills.map((h) => "HS" + h.HS).join(", ") : "tylko małe"}${clubN ? ` + ${clubN} klubowych` : ""}</div></div>`; }).join('')}</div>
          <div class="row mt"><label><input type="checkbox" id="real-db" checked> <b>Prawdziwi zawodnicy</b> – baza FIS: ${SJM.REAL_JUMPERS.length} aktywnych skoczków, którzy startowali w okresie ${SJM.REAL_PERIOD} (ocena z ich wyników)</label></div>
          <div class="row mt"><button class="btn go" data-start="new">Rozpocznij karierę ▶</button></div>
        </div>
        <div class="card small muted" style="line-height:1.6"><b>Jak grać:</b> Każda tura to tydzień sezonu. Przed weekendem startowym ustal składy na Puchar Świata, Puchar Kontynentalny, FIS Cup i imprezy mistrzowskie (zakładka <i>Nominacje</i>). Zarządzaj treningiem kadr, zatrudniaj sztab, inwestuj w skocznie, ośrodki i szkolenie młodzieży. Spełniaj oczekiwania zarządu – inaczej stracisz posadę. Klawisz <b>Spacja</b> przechodzi do następnego tygodnia. Gra zapisuje się automatycznie co tydzień.</div>
      </div>`;
  }

  function showMenu() {
    SJM.UI.openModal(`<button class="close" data-act="close">×</button><h2>Menu</h2>
      <div class="grid g2">
        <button class="btn" data-start="savem">💾 Zapisz grę</button>
        <button class="btn" data-start="export">📤 Eksportuj zapis do pliku</button>
        <button class="btn" data-start="import">📥 Importuj zapis z pliku</button>
        <button class="btn" data-start="quit">🏠 Menu główne</button>
      </div>
      <div class="row mt"><label>Rozgrywanie zawodów:</label>
        <select onchange="SJM.state.settings = SJM.state.settings || {}; SJM.state.settings.playMode = this.value; SJM.UI.toast('Zapisano ustawienie');">
          ${[['ask', 'Pytaj przed każdym weekendem'], ['live', 'Zawsze na żywo (PŚ i imprezy z naszymi)'], ['fast', 'Zawsze szybka symulacja']].map(([v, l]) => `<option value="${v}" ${((SJM.state.settings || {}).playMode || 'ask') === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select></div>
      <div class="row mt"><label>Wydarzenia losowe i decyzje:</label>
        <select id="ev-freq" onchange="SJM.state.settings = SJM.state.settings || {}; SJM.state.settings.eventFreq = this.value; SJM.UI.toast('Zapisano ustawienie');">
          ${[['low', 'Rzadko'], ['normal', 'Normalnie (co 2–3 tygodnie)'], ['high', 'Często'], ['off', 'Wyłączone']].map(([v, l]) => `<option value="${v}" ${((SJM.state.settings || {}).eventFreq || 'normal') === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select></div>
      <p class="small muted mt">Autozapis wykonywany jest po każdym tygodniu. Zapis w przeglądarce jest przypisany do tego komputera – eksport do pliku pozwala przenieść karierę.</p>`);
  }

  function onClick(e) {
    const el = e.target.closest('[data-start]');
    if (!el) return;
    const a = el.dataset.start;
    if (a === 'nation') {
      selNation = el.dataset.code;
      document.querySelectorAll('.nation-card').forEach((c) => c.classList.toggle('sel', c.dataset.code === selNation));
    } else if (a === 'new') {
      const name = document.getElementById('mgr-name').value.trim() || 'Menedżer';
      try { localStorage.setItem('sjm2027:lastname', name); } catch (err) { /* brak miejsca */ }
      SJM.W.newGame(selNation, name, { real: document.getElementById("real-db").checked });
      SJM.SAVE.save('auto');
      showGame();
    } else if (a === 'load') {
      SJM.SAVE.load(el.dataset.slot).then((ok) => { if (ok) showGame(); else alert('Nie udało się wczytać zapisu.'); });
    } else if (a === 'import') {
      SJM.SAVE.importFile((ok) => { if (ok) { SJM.SAVE.save('auto'); showGame(); } });
    } else if (a === 'export') {
      SJM.SAVE.exportFile();
    } else if (a === 'savem') {
      SJM.SAVE.save('manual').then((ok) => { if (ok) SJM.UI.toast('Gra zapisana'); });
    } else if (a === 'quit') {
      SJM.SAVE.save('auto').then(showStart);
    }
  }

  function boot() {
    const mp = /[?&]przenies=(\d+)/.exec(location.search);
    if (mp) { SJM.SAVE.handoff(mp[1]); return; } // niewidoczne okno launchera: tylko wysyłka zapisów
    document.addEventListener('click', onClick);
    SJM.UI.init();
    const imp = window.SJM_IMPORT;
    (imp ? SJM.SAVE.importData(imp) : Promise.resolve()).then(SJM.SAVE.migrate).then(showStart, showStart);
  }

  return { boot, showStart, showMenu, showGame };
})();

window.addEventListener('DOMContentLoaded', () => SJM.MAIN.boot());
