// ===== Aktualizacje gry z poziomu klienta =====
// Nowe wersje plików gry (index.html, css, js) są publikowane na GitHub Pages (launcher\release.ps1):
//   update/version.json – { version, label, bundle, sha256, size, minShell }
//   update/game-<wersja>.json – { version, files: { "js/sim.js": "...", ... } }
// PC: pobiera i podmienia pliki launcher (exe działa w tle, port i token w launcher.js).
// Android: pobiera i podmienia pliki aplikacja (SJMAndroid.update), gra wczytuje się z pobranej wersji.
// iOS / przeglądarka: wystarczy odświeżyć stronę (service worker najpierw pyta sieć).
// Zapisy gry (IndexedDB w profilu przeglądarki / WebView) aktualizacja zostawia bez zmian.
SJM.UPD = (function () {
  const BASE = 'https://patrykus12.github.io/sjm2027/update/';
  const cur = () => String(window.SJM_VERSION || '0');
  const label = (v) => { const m = /^(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)$/.exec(v); return m ? `${m[3]}.${m[2]}.20${m[1]} ${m[4]}:${m[5]}` : v; };
  function platform() {
    if (window.SJMAndroid && typeof SJMAndroid.update === 'function') return 'android';
    if (window.SJM_LAUNCHER && SJM_LAUNCHER.port) return 'pc';
    return 'web';
  }
  // wersja „opakowania” (exe / apk) – aktualizacja może wymagać nowszego
  function shell() {
    const p = platform();
    if (p === 'android') { try { return +SJMAndroid.shellVersion() || 1; } catch (e) { return 1; } }
    if (p === 'pc') return +SJM_LAUNCHER.shell || 1;
    return Infinity;
  }
  function fetchInfo() {
    return fetch(BASE + 'version.json?t=' + Date.now(), { cache: 'no-store' }).then((r) => {
      if (!r.ok) throw new Error('serwer aktualizacji: HTTP ' + r.status);
      return r.json();
    });
  }
  const newer = (info) => info && String(info.version) > cur();

  // pobranie i podmiana plików; po sukcesie – autozapis i przeładowanie gry
  let androidCb = null;
  function apply(info) {
    const p = platform(), url = BASE + info.bundle;
    let job;
    if (p === 'android') {
      job = new Promise((res, rej) => { androidCb = (ok, msg) => (ok ? res() : rej(new Error(msg || 'błąd'))); });
      SJMAndroid.update(url, String(info.sha256), String(info.version));
    } else if (p === 'pc') {
      const L = SJM_LAUNCHER;
      job = fetch(`http://127.0.0.1:${L.port}/update`, { method: 'POST', headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ token: L.token, url, sha256: info.sha256, version: String(info.version) }) })
        .catch(() => { throw new Error('brak połączenia z launcherem – zamknij grę i uruchom ją ponownie'); })
        .then((r) => r.text()).then((t) => { if (t !== 'ok') throw new Error(t.replace(/^error:\s*/, '')); });
    } else {
      job = (navigator.serviceWorker ? navigator.serviceWorker.getRegistration().then((r) => r && r.update()).catch(() => null) : Promise.resolve());
    }
    const inGame = SJM.state && !document.getElementById('app').classList.contains('hidden');
    return job.then(() => (inGame && SJM.SAVE ? SJM.SAVE.save('auto') : true)).then(() => { location.reload(); });
  }
  // odpowiedź aplikacji na Androida (MainActivity.Bridge.update)
  function done(ok, msg) { const cb = androidCb; androidCb = null; if (cb) cb(ok, msg); }

  function dialog(info) {
    const tooOld = (+info.minShell || 1) > shell();
    const what = platform() === 'android' ? 'aplikację (plik .apk)' : 'grę (plik SkiJumpingManager2027.exe)';
    SJM.UI.openModal(`<button class="close" data-act="close">×</button><h2>⬇ Dostępna aktualizacja</h2>
      <p>Nowa wersja gry: <b>${label(String(info.version))}</b><br><span class="muted small">Twoja wersja: ${label(cur())}</span></p>
      ${info.notes ? `<p class="small">${SJM.U.esc(info.notes)}</p>` : ''}
      ${tooOld ? `<p class="warn">Ta aktualizacja wymaga nowszej wersji aplikacji – pobierz i zainstaluj ${what} jeszcze raz.</p>`
        : `<p class="small muted">Pobierane są tylko pliki gry (ok. ${Math.max(1, Math.round((info.size || 0) / 1024))} kB). Zapisy kariery zostają – przed aktualizacją gra zapisze się automatycznie.</p>
      <div class="row mt"><button class="btn go" id="upd-go">Aktualizuj teraz</button><button class="btn" data-act="close">Później</button></div>
      <div id="upd-st" class="small mt"></div>`}`);
    const go = document.getElementById('upd-go');
    if (go) go.onclick = () => {
      go.disabled = true;
      const st = document.getElementById('upd-st');
      st.textContent = 'Pobieranie aktualizacji…';
      apply(info).catch((e) => { st.innerHTML = `<span class="neg">Nie udało się zaktualizować: ${SJM.U.esc(e.message)}</span>`; go.disabled = false; });
    };
  }

  // przycisk „Sprawdź aktualizacje”
  function checkNow() {
    SJM.UI.toast('Sprawdzanie aktualizacji…');
    return fetchInfo().then((info) => {
      if (newer(info)) dialog(info);
      else SJM.UI.toast(`Masz najnowszą wersję gry (${label(cur())})`);
    }).catch((e) => SJM.UI.toast('Nie udało się sprawdzić aktualizacji (brak internetu?)', true));
  }
  // przy starcie: po cichu; okno tylko na ekranie startowym, w grze – komunikat
  function autoCheck() {
    setTimeout(() => fetchInfo().then((info) => {
      if (!newer(info)) return;
      const modalOpen = !document.getElementById('modal').classList.contains('hidden');
      const inGame = !document.getElementById('app').classList.contains('hidden');
      if (!modalOpen && !inGame) dialog(info);
      else SJM.UI.toast(`Dostępna aktualizacja gry (${label(String(info.version))}) – Menu → Sprawdź aktualizacje`);
    }).catch(() => { /* brak internetu – bez komunikatu */ }), 2500);
  }
  // test launchera (--headless): aktualizacja bez pytania, wynik w tytule strony
  function selfTest() {
    document.title = 'UPD:' + cur();
    fetchInfo().then((info) => (newer(info) ? apply(info) : null)).catch((e) => { document.title = 'UPD-ERR:' + e.message; });
  }
  return { cur, label, platform, checkNow, autoCheck, done, selfTest, fetchInfo };
})();
