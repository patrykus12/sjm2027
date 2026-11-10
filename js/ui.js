// ===== Interfejs użytkownika =====
SJM.UI = (function () {
  const U = SJM.U, W = SJM.W, M = SJM.M;
  const esc = U.esc;
  let screen = 'dashboard';
  let params = {};
  const sortState = {};
  const $ = (s) => document.querySelector(s);
  const st = () => SJM.state;

  const NAV = [
    ['dashboard', '🏠', 'Pulpit'],
    ['inbox', '✉️', 'Wiadomości'],
    ['squad', '👥', 'Kadra'],
    ['nominations', '📋', 'Nominacje'],
    ['training', '🏋️', 'Trening'],
    ['staff', '🧑‍💼', 'Sztab'],
    ['infra', '🏗️', 'Infrastruktura'],
    ['finance', '💰', 'Finanse'],
    ['calendar', '📅', 'Kalendarz'],
    ['standings', '🏆', 'Klasyfikacje'],
    ['world', '🌍', 'Świat'],
    ['history', '📜', 'Historia'],
    ['stats', '📊', 'Statystyki'],
  ];
  const GROUP_NAMES = { A: 'Kadra A', B: 'Kadra B', J: 'Juniorzy', R: 'Kluby' };

  // ---------- Pomoc dla nowych graczy („?” przy nagłówku sekcji) ----------
  const HELP = {
    dashboard: ['Pulpit', [
      'Podsumowanie bieżącego tygodnia: najbliższe zawody, klasyfikacje, finanse, zarząd i najnowsze wiadomości.',
      'Grę posuwasz przyciskiem w prawym górnym rogu: <b>Dalej ▶</b> albo <b>Rozegraj tydzień ▶</b> (skrót: spacja).',
      'Przed każdym weekendem z zawodami gra czeka, aż zatwierdzisz składy w zakładce <b>Nominacje</b>.',
      '<b>⚠ Decyzje</b> to wydarzenia losowe. Wybór działa od razu albo przez kilka tygodni (widać to w „Aktywnych efektach”).',
      'Na górnym pasku: budżet, popularność (sponsorzy i nabór dzieci) i zaufanie zarządu. Gdy zaufanie spadnie poniżej 15, tracisz posadę.',
    ]],
    inbox: ['Wiadomości', [
      'Raporty z zawodów, kontuzje, nabór do klubów, przypomnienia o homologacji, alarmy finansowe i podsumowania sezonu.',
      'Kliknij wiadomość, żeby ją rozwinąć. Nieprzeczytane liczy plakietka w menu.',
    ]],
    squad: ['Kadra narodowa', [
      'Wszyscy Twoi zawodnicy podzieleni na <b>kadrę A</b> (8), <b>kadrę B</b> (8), <b>juniorów</b> (10) i <b>kluby</b>.',
      'Przydział zmieniasz w kolumnie kadry. Zmiany trafiają do szkicu, a obowiązują dopiero po kliknięciu <b>✔ Potwierdź kadry</b>.',
      '<b>Ocena</b> to obecna siła, <b>gwiazdki</b> to szacowany potencjał (sztab może się mylić). Kliknij nazwisko, żeby otworzyć profil.',
      '<b>Forma</b> zmienia się z tygodnia na tydzień, <b>zmęczenie</b> rośnie od treningu i wyjazdów, a powyżej ok. 55% rośnie ryzyko kontuzji.',
      '⏳ oznacza seniora, który od sezonów nie skacze regularnie w PŚ/LGP i myśli o końcu kariery. 🆕 to nowy narybek: zgłoś go do jakichś zawodów, bo inaczej zrezygnuje.',
    ]],
    nominations: ['Nominacje (zgłoszenia)', [
      'Co tydzień z zawodami wybierasz, kto startuje w każdym cyklu: PŚ, PK, FIS Cup, a latem LGP i LPK.',
      'Liczba miejsc to <b>kwota startowa</b> kraju, zależna od wyników z ostatnich 12 miesięcy. Gospodarz dostaje dodatkowe miejsca.',
      'Do PŚ i LGP potrzebne są punkty PŚ/LGP/PK/LPK, do PK jakiekolwiek punkty FIS. Zawodnicy bez punktów zaczynają od FIS Cup.',
      'Niższe cykle możesz <b>oddać trenerowi</b> kadry. PŚ i imprezy mistrzowskie wybierasz zawsze sam.',
      '<b>Podpowiedź asystenta</b> wypełnia Twoje cykle propozycją. Na końcu kliknij <b>Zatwierdź składy</b>.',
      '<b>Trening w domu</b> pomaga zawodnikowi w dołku formy albo zmęczonemu, ale nie zdobywa on wtedy punktów.',
    ]],
    training: ['Trening', [
      'Dla <b>kadry A</b> ustalasz intensywność i akcent treningu. Kadrę B i juniorów prowadzą ich trenerzy.',
      'Intensywny trening daje szybszy rozwój, ale też zmęczenie i ryzyko kontuzji. Lekki trening daje świeżość na zawodach.',
      'Najszybciej rozwijają się zawodnicy w wieku 15–21 lat. Rozwój przyspieszają dobrzy trenerzy, obiekty (Infrastruktura) i skocznie z igelitem latem.',
      'Kolumna z „+” pokazuje zmianę oceny zawodnika od początku sezonu.',
    ]],
    staff: ['Sztab szkoleniowy', [
      'Trenerzy kadr A, B i juniorów, technik, fizjoterapeuta, psycholog i koordynator. Ich <b>jakość</b> wpływa na rozwój, formę i zdrowie zawodników.',
      'W trakcie sezonu nie da się zatrudniać ani zwalniać. Sztab zmienia się tylko w <b>oknie kontraktowym</b> po sezonie.',
      'Tu planujesz: lista wolnych agentów pokazuje, ile by od nas chcieli. Pogrubione kontrakty kończą się po tym sezonie.',
      'Młodzi sztabowcy z 📈 jeszcze się rozwijają. To tani sposób na świetnego trenera w przyszłości.',
    ]],
    contracts: ['Okno kontraktowe', [
      'Po sezonie gra stoi, dopóki nie zamkniesz okna.',
      '<b>Marzec, przedłużenia:</b> składasz oferty (pensja i długość) tym, którym kończą się kontrakty. Kto odmówi, odchodzi na rynek.',
      '<b>Kwiecień, nabór:</b> funkcja po funkcji wybierasz kandydata na wakat i składasz ofertę w ciemno. Przy kilku ofertach decyduje los ważony atrakcyjnością oferty.',
      'Gdy spasujesz, stanowisko obejmie słabszy p.o. Limit płac ustala zarząd na podstawie przychodów.',
    ]],
    infra: ['Infrastruktura', [
      'Twoje skocznie i obiekty treningowe. Skocznie klubowe 🏠 utrzymują kluby, więc nic nie kosztują.',
      '<b>Homologacja FIS</b> (klasy A–D) decyduje, jakie zawody i treningi mogą się odbyć na skoczni. Bez niej skocznia nie liczy się do treningu.',
      'Budowa i modernizacja skoczni, igelit (trening latem), oświetlenie oraz obiekty: centrum przygotowania, tunel, centrum medyczne, szkolenie młodzieży, laboratorium sprzętu.',
      'Możesz składać <b>kandydatury</b> na organizację zawodów (do 3 na cykl). Gospodarz ma więcej miejsc startowych i przychody.',
      'Małe skocznie zwiększają nabór dzieci do klubów.',
    ]],
    finance: ['Finanse', [
      'Przychody: dotacja państwa (zależy od oceny zarządu), sponsorzy (zależą od popularności) i premie za wyniki.',
      'Koszty: pensje sztabu, stypendia kadr, utrzymanie obiektów i wyjazdy na zawody. Im więcej zawodników wysyłasz, tym drożej.',
      'Deficyt obniża ocenę zarządu po sezonie, a przy dużym deficycie zarząd ostrzega w trakcie sezonu.',
    ]],
    calendar: ['Kalendarz sezonu', [
      'Wszystkie zawody sezonu tydzień po tygodniu. Kliknij rozegrany konkurs, żeby zobaczyć wyniki albo powtórkę ▶.',
      'Zimą: Puchar Świata (z TCS i finałem w Planicy), Puchar Kontynentalny i FIS Cup. Latem: LGP, LPK i FIS Cup.',
      'Imprezy mistrzowskie: MŚ (lata nieparzyste), IO i MŚ w lotach (co 4 lata), MŚ juniorów co roku.',
      'Gospodarze weekendów zmieniają się co roku. W zakładce „Gospodarze imprez” widać, kto organizuje wielkie imprezy.',
    ]],
    standings: ['Klasyfikacje', [
      'Klasyfikacje generalne cykli: PŚ, LGP, PK, LPK, FIS Cup, a także TCS i loty.',
      '<b>Puchar Narodów</b> sumuje punkty zawodników kraju. Od niego zależy cel stawiany przez zarząd.',
      '<b>Kwoty startowe</b> pokazują, ile miejsc ma każdy kraj w kolejnych zawodach.',
      'W <b>PK</b> i <b>FIS Cup</b> podzakładki okresów pokazują klasyfikacje poszczególnych okresów kwotowych: top 3 okresu PK daje krajowi +1 miejsce w PŚ, a top 3 okresu FIS Cup – +1 w PK (w trwającym okresie: prognoza).',
    ]],
    event: ['Wyniki konkursu', [
      'Pełne wyniki: odległości i punkty w każdej serii oraz nota łączna. Nasi zawodnicy są wyróżnieni.',
      'Belka zapisana jako „12→10” oznacza, że jury obniżyło ją w trakcie serii.',
      '<b>▶ Relacja na żywo</b> odtwarza konkurs skok po skoku.',
    ]],
    week: ['Wyniki tygodnia', [
      'Wszystkie konkursy rozegrane w tym tygodniu, z czołówką i naszymi zawodnikami.',
      '<b>Pełne wyniki</b> otwiera tabelę konkursu, <b>▶ Relacja</b> odtwarza go na żywo.',
    ]],
    world: ['Świat skoków', [
      'Wszystkie reprezentacje: liczba zawodników, najlepsi skoczkowie, średnia siła szóstki, kwota PŚ i trener kadry A.',
      'Kliknij kraj, żeby zobaczyć jego zawodników, skocznie i sztab.',
      '🌱 oznacza nową reprezentację („uśpioną nację”), która dołączyła w trakcie gry.',
    ]],
    nation: ['Reprezentacja kraju', [
      'Podgląd innego kraju: zawodnicy, skocznie z zaplanowanymi zawodami i sztab razem z kroniką zmian.',
      'Przydaje się do oceny rywali i szukania trenerów, których można by podkupić w oknie kontraktowym.',
    ]],
    history: ['Historia', [
      'Archiwum poprzednich sezonów: zdobywcy Kryształowych Kul, Pucharu Narodów, TCS i medaliści imprez.',
      'Widać tu też wyniki Twojej kadry i ocenę zarządu w kolejnych latach.',
    ]],
    stats: ['Statystyki', [
      'Statystyki wszech czasów: zwycięstwa i podia w PŚ, klasyfikacje medalowe IO, MŚ, MŚ w lotach i turniejów.',
      'Łączą prawdziwą historię od 1979/80 z wynikami z gry, więc widać, kiedy zawodnik z gry wyprzedza legendę.',
    ]],
    summary: ['Podsumowanie sezonu', [
      'Wyniki sezonu, ocena zarządu (miejsce w Pucharze Narodów względem celu, medale, finanse) i zmiany w świecie skoków.',
      'Po sezonie część zawodników kończy kariery, do klubów przychodzi narybek, a potem otwiera się okno kontraktowe.',
    ]],
    jumper: ['Profil zawodnika', [
      '<b>Umiejętności</b> to 8 cech w skali 1–20. Ocena na mamutach i na normalnej skoczni pokazuje, gdzie zawodnik jest mocniejszy.',
      '<b>Cechy</b> (np. Lotnik, Nerwy ze stali) wpływają na skoki. Część jest ukryta i sztab odkrywa je z czasem.',
      '<b>Uprawnienia</b> mówią, w jakich cyklach zawodnik może startować. Zdobywa się je punktami. Punkty PŚ lub LGP dają dożywotnie prawo startu w PŚ i LGP, a punkty PK lub LPK dożywotnie prawo startu w PK i LPK.',
      '<b>Konkursy w sezonie</b> to wszystkie starty w bieżącym sezonie. Kliknij zawody, żeby zobaczyć pełne wyniki.',
    ]],
  };
  const helpBtn = (key) => `<button class="help-q" data-act="help" data-key="${key}" title="Pomoc: o co tu chodzi?">?</button>`;
  function addHelp(root, key) {
    const h = root && root.querySelector('h1');
    if (h && HELP[key] && !h.querySelector('.help-q')) h.insertAdjacentHTML('beforeend', helpBtn(key));
  }
  function helpModal(key) {
    const [title, items] = HELP[key];
    openModal(`<button class="close" data-act="close">×</button><h2 style="margin-top:0">❓ ${title}</h2><ul class="help-list">${items.map((t) => `<li>${t}</li>`).join('')}</ul>`);
  }

  // ---------- Elementy ----------
  function attr(v) {
    const a = U.attr20(v);
    const c = a >= 17 ? 'a5' : a >= 14 ? 'a4' : a >= 11 ? 'a3' : a >= 7 ? 'a2' : 'a1';
    return `<span class="at ${c}" title="${U.fmt1(v)}">${a}</span>`;
  }
  function ovrColor(v) { return v >= 88 ? '#2bd4a4' : v >= 80 ? '#7fdc6a' : v >= 70 ? '#e6dd5c' : v >= 58 ? '#f2a33c' : '#ff6b6b'; }
  function ovr(v) { return `<span class="ovr" style="color:${ovrColor(v)}">${Math.round(v)}</span>`; }
  // jakość sztabowca: zmiana po ostatnim sezonie i oznaczenie perspektywicznego (młody z dużym zapasem rozwoju)
  function staffQ(x) {
    return ovr(x.quality)
      + (x.lastDelta ? ` <span class="small ${x.lastDelta > 0 ? 'pos' : 'neg'}" title="Zmiana po ostatnim sezonie">${x.lastDelta > 0 ? '▲' : '▼'}${Math.abs(x.lastDelta)}</span>` : '')
      + (M.staffProspect(x) ? ' <span class="small" title="Rozwojowy: młody sztabowiec z dużym zapasem rozwoju">📈</span>' : '');
  }
  function stars(v) {
    const s = U.clamp(Math.round(((v - 45) / 10) * 2) / 2, 0.5, 5);
    return `<span class="stars2" title="${s}/5"><span class="bg">★★★★★</span><span class="fg" style="width:${s / 5 * 100}%">★★★★★</span></span>`;
  }
  function formStr(f) {
    const t = `Forma: ${U.fmt1(f)}`;
    if (f > 4) return `<span class="form-up" title="${t}">▲▲</span>`;
    if (f > 1.5) return `<span class="form-up" title="${t}">▲</span>`;
    if (f < -4) return `<span class="form-down" title="${t}">▼▼</span>`;
    if (f < -1.5) return `<span class="form-down" title="${t}">▼</span>`;
    return `<span class="form-mid" title="${t}">●</span>`;
  }
  function bar(v, max = 100, invert = false) {
    const pct = U.clamp(v / max * 100, 0, 100);
    const good = invert ? pct < 35 : pct > 65, bad = invert ? pct > 65 : pct < 35;
    return `<div class="bar ${good ? 'good' : bad ? 'bad' : 'mid'}"><i style="width:${pct}%"></i></div>`;
  }
  function jl(j) { return j ? `<a data-act="jumper" data-id="${j.id}">${esc(W.fullName(j))}</a>` : '?'; }
  function jlf(j) { return j ? `${W.flag(j.nation)} ${jl(j)}` : '?'; }
  function natl(code) { const n = W.nationData(code); return n ? `<a data-act="nation" data-code="${code}">${W.flag(code)} ${esc(n.name)}</a>` : code; }
  function status(j) {
    if (j.injury > 0) return `<span class="inj" title="${esc(j.injType || 'Kontuzja')}">${j.injSev === 'severe' ? '🚑' : '✚'} ${Math.ceil(j.injury)} tyg.</span>`;
    if (j.fatigue > 65) return `<span class="warn">zmęczony</span>`;
    return '<span class="muted">OK</span>';
  }
  function lvPill(lv) { return `<span class="pill lv-${lv}">${SJM.LEVELS[lv].short}</span>`; }
  function gPill(g) { return `<span class="pill ${g || 'R'}">${GROUP_NAMES[g || 'R']}</span>`; }
  function medalIcon(p) { return `<span class="medal ${['g', 's', 'b'][p - 1]}"></span>`; }
  function toast(msg, err) {
    const t = $('#toast');
    t.textContent = msg; t.className = 'show' + (err ? ' err' : '');
    clearTimeout(toast._t); toast._t = setTimeout(() => (t.className = ''), 2600);
  }
  function result(err, ok) { if (err) toast(err, true); else { if (ok) toast(ok); render(); } }
  function sortTh(table, key, label, cls = '') { return `<th class="sort ${cls}" data-act="sort" data-table="${table}" data-key="${key}">${label}${sortState[table] && sortState[table].key === key ? (sortState[table].dir > 0 ? ' ▲' : ' ▼') : ''}</th>`; }
  function applySort(table, rows, getters, def) {
    const s = sortState[table] || def;
    if (!s || !getters[s.key]) return rows;
    const g = getters[s.key];
    return rows.sort((a, b) => { const x = g(a), y = g(b); return (x > y ? 1 : x < y ? -1 : 0) * s.dir; });
  }

  // ---------- Szkielet ----------
  function renderShell() {
    const s = st();
    const nd = W.nationData(s.nation);
    const unread = s.inbox.filter((m) => !m.read).length;
    $('#sidebar').innerHTML = `
      <div class="logo">SKI JUMPING<br>MANAGER 2027<small>Zarządzanie kadrą narodową</small><div class="nat">${W.flag(s.nation)} ${esc(nd.name)} · ${esc(s.manager.name)}</div></div>
      <nav>${NAV.map(([k, i, l]) => `<button class="${screen === k ? 'active' : ''}" data-act="nav" data-screen="${k}"><span class="ico">${i}</span><span class="lbl">${l}</span>${k === 'inbox' && unread ? `<span class="badge">${unread}</span>` : ''}</button>`).join('')}</nav>
      <div class="foot"><button class="btn small" data-act="save">💾 Zapisz</button><button class="btn small" data-act="menu">☰ Menu</button></div>`;
    const wk = M.currentWeek();
    const p = s.player;
    $('#topbar').innerHTML = `
      <button class="btn drawer-btn" data-act="drawer" title="Menu">☰${unread ? `<span class="badge">${unread}</span>` : ''}</button>
      <div><div class="date">${wk ? U.dateStr(wk.date) : ''}</div><div class="wk small">Sezon ${s.season}/${String(s.season + 1).slice(2)} · tydz. ${s.week + 1}/${s.calendar.weeks.length}</div></div>
      <div class="wk label">${wk ? esc(wk.label) : ''}</div>
      <div class="spacer"></div>
      <div class="stat">Budżet<b class="${p.budget < 0 ? 'neg' : ''}">${U.money(p.budget)}</b></div>
      <div class="stat">Popularność<b>${Math.round(p.popularity)}</b></div>
      <div class="stat">Zarząd<b class="${p.board < 30 ? 'neg' : p.board > 65 ? 'pos' : ''}">${Math.round(p.board)}/100</b></div>
      ${s.gameOver ? "" : s.staffWindow ? `<button class="btn go warnbtn" data-act="nav" data-screen="contracts">🤝 Okno kontraktowe</button>` : SJM.EV && SJM.EV.pending().length ? `<button class="btn go warnbtn" data-act="decisions">⚠ Decyzje (${SJM.EV.pending().length})</button>` : M.needsNominations() ? `<button class="btn go warnbtn" data-act="nav" data-screen="nominations" title="Termin zgłoszeń: ${fmtDay(M.deadline(wk))}">📋 Ustal składy</button>`
        : `<button class="btn go" data-act="next" title="Spacja">${wk && wk.events.length ? 'Rozegraj tydzień ▶' : 'Dalej ▶'}</button>`}`;
  }

  function go(scr, prm = {}) { screen = scr; params = prm; render(); $('#main').scrollTop = 0; }

  function render() {
    if (!st()) return;
    renderShell();
    const fn = SCREENS[screen] || SCREENS.dashboard;
    $('#main').innerHTML = fn(params);
    addHelp($('#main'), SCREENS[screen] ? screen : 'dashboard');
  }

  // ---------- Ekrany ----------
  const SCREENS = {};

  function dashEvents() {
    const pend = SJM.EV ? SJM.EV.pending() : [];
    const mods = (st().player.mods || []);
    if (!pend.length && !mods.length) return '';
    const fmtMod = (m) => {
      const names = { train: 'trening', form: 'forma', injury: 'ryzyko kontuzji', sponsor: 'sponsorzy', equip: 'sprzęt', dsq: 'ryzyko dyskwalifikacji', podiumBonus: 'premia za podium', wind: 'start przy wietrze' };
      const good = m.key === 'injury' || m.key === 'dsq' ? m.value < 0 : m.value > 0;
      const val = m.key === 'podiumBonus' ? U.money(m.value) : m.key === 'wind' ? (m.value > 0 ? '+' : '') + m.value.toFixed(2).replace('.', ',') + ' m/s' : m.key === 'equip' || m.key === 'form' ? (m.value > 0 ? '+' : '') + U.fmt1(m.value) : (m.value > 0 ? '+' : '') + Math.round(m.value * 100) + '%';
      return `<span class="chip"><span class="${good ? 'pos' : 'neg'}">${names[m.key] || m.key} ${val}</span> ${esc(m.label)} <span class="muted">· ${Math.ceil(m.weeks)} tyg.</span></span>`;
    };
    return `<div class="card mb ${pend.length ? 'attention' : ''}">
      ${pend.length ? `<div class="row between"><div><h3>⚠ Decyzje do podjęcia</h3>${pend.map((p) => `<div><b>${esc(p.title)}</b></div>`).join('')}</div><button class="btn primary" data-act="decisions">Podejmij decyzję</button></div>` : ''}
      ${mods.length ? `<h3 class="${pend.length ? 'mt' : ''}">Aktywne efekty</h3><div>${mods.map(fmtMod).join('')}</div>` : ''}
    </div>`;
  }

  SCREENS.dashboard = () => {
    const s = st(), p = s.player;
    const wk = M.currentWeek();
    const noms = M.ensureNominations();
    const myRank = M.ncOrder().indexOf(s.nation) + 1;
    const hasPts = Object.keys(s.standings.nc).length > 0;
    // latem pulpit pokazuje klasyfikację Letniego Grand Prix zamiast (pustej) klasyfikacji PŚ
    const cupKey = wk.summer ? 'sgp' : 'wc';
    const wcTop = Object.entries(s.standings[cupKey] || {}).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const nc = M.ncOrder().slice(0, 8);
    const A = M.myJumpers().filter((j) => j.group === 'A').sort((a, b) => W.overall(b) - W.overall(a));
    const inc = M.annualIncome(), cost = M.annualCosts();
    const evHtml = wk.events.length ? wk.events.map((e) => `<div class="chip">${lvPill(e.level)} ${esc(SJM.CAL.eventTitle(e))}</div>`).join('') : '<div class="muted">Brak zawodów – tydzień treningowy.</div>';
    const nomHtml = Object.entries(noms.byLevel).map(([lv, ids]) => `<div class="small">${lvPill(lv)} ${ids.length}/${M.quotaFor(lv, s.nation, wk)} – ${M.isDelegated(lv) && !noms.confirmed ? `<span class="muted">wybierze trener</span>` : ids.filter((id) => s.jumpers[id]).map((id) => esc(s.jumpers[id].last)).join(", ") || `<span class="neg">brak</span>`}</div>`).join("");
    return `
      <h1>Pulpit</h1>
      ${dashEvents()}
      <div class="grid g3">
        <div class="card span2">
          <h3>Ten tydzień · ${U.dateStr(wk.date)}</h3>
          <h2>${esc(wk.label)}</h2>
          <div>${evHtml}</div>
          ${wk.events.length ? `<div class="mt">${nomHtml}</div><div class="mt row"><button class="btn primary" data-act="nav" data-screen="nominations">📋 Ustal składy</button>${noms.confirmed ? `<span class="pos small">✔ Składy zatwierdzone</span>` : `<span class="warn small">⚠ Termin zgłoszeń: ${fmtDay(M.deadline(wk))} – składy czekają na Twoją decyzję</span>`}</div>` : ''}
        </div>
        <div class="card">
          <h3>Zarząd federacji</h3>
          <div class="row between"><span>Zaufanie</span><b>${Math.round(p.board)}/100</b></div>${bar(p.board)}
          <p class="small">${M.expectationText()}</p>
          <div class="kv small"><span class="k">Puchar Narodów</span><span>${hasPts ? myRank + '. miejsce' : '–'}</span>
          <span class="k">Kwota startowa ${wk.summer ? 'LGP' : 'PŚ'}</span><span>${s.nations[s.nation].quota.WC} zawodników (${periodName(M.currentPeriod())})</span></div>
        </div>
        <div class="card tight">
          <h3>Wiadomości</h3>
          ${s.inbox.slice(0, 6).map((m) => `<div class="msg ${m.read ? '' : 'unread'} ${m.type}" data-act="openmsg" data-id="${m.id}"><div class="t">${esc(m.title)}</div><div class="d">${U.shortDate(m.date)}</div></div>`).join('') || '<div class="empty">Brak wiadomości</div>'}
        </div>
        <div class="card tight">
          <h3>${wk.summer ? 'Letnie Grand Prix' : 'Puchar Świata'}</h3>
          ${wcTop.length ? `<table>${wcTop.map(([id, pts], i) => { const j = s.jumpers[id]; return `<tr class="${j && j.nation === s.nation ? 'mine' : ''}"><td class="num">${i + 1}.</td><td>${jlf(j)}</td><td class="num"><b>${pts}</b></td></tr>`; }).join('')}</table>` : `<div class="empty">${wk.summer ? 'Letnie Grand Prix jeszcze się nie rozpoczęło' : 'Sezon jeszcze się nie rozpoczął'}</div>`}
        </div>
        <div class="card tight">
          <h3>Puchar Narodów</h3>
          ${hasPts ? `<table>${nc.map((c, i) => `<tr class="${c === s.nation ? 'mine' : ''}"><td class="num">${i + 1}.</td><td>${natl(c)}${s.dormant && s.dormant[c] ? ` <span class="small muted" title="Nowa reprezentacja: ${esc(s.dormant[c].reason)}">🌱 od ${s.dormant[c].joined}/${String(s.dormant[c].joined + 1).slice(2)}</span>` : ""}</td><td class="num"><b>${s.standings.nc[c] || 0}</b></td></tr>`).join('')}</table>` : '<div class="empty">Brak punktów</div>'}
        </div>
        <div class="card tight span2">
          <h3>Kadra A</h3>
          <table><tr><th>Zawodnik</th><th class="c">Wiek</th><th class="c">Ocena</th><th class="c">Forma</th><th>Zmęczenie</th><th>Status</th><th class="num">PŚ</th></tr>
          ${A.map((j) => `<tr><td>${jl(j)}</td><td class="c">${W.age(j)}</td><td class="c">${ovr(W.overall(j))}</td><td class="c">${formStr(j.form)}</td><td>${bar(j.fatigue, 100, true)}</td><td>${status(j)}</td><td class="num">${s.standings.wc[j.id] || 0}</td></tr>`).join('')}</table>
        </div>
        <div class="card">
          <h3>Finanse</h3>
          <div class="big ${p.budget < 0 ? 'neg' : ''}">${U.money(p.budget)}</div>
          <div class="kv small mt"><span class="k">Przychody / rok</span><span class="pos">${U.money(inc.total)}</span><span class="k">Koszty stałe / rok</span><span class="neg">${U.money(cost.total)}</span><span class="k">Bilans tygodniowy</span><span>${U.money((inc.total - cost.total) / 52)}</span></div>
          ${p.projects.length ? `<h3 class="mt">Inwestycje w toku</h3>${p.projects.map((pr) => `<div class="small">${esc(pr.label)} – ${Math.max(0, Math.ceil(pr.weeksLeft))} tyg.</div><div class="progress"><i style="width:${(1 - pr.weeksLeft / pr.total) * 100}%"></i></div>`).join('')}` : ''}
        </div>
      </div>`;
  };

  SCREENS.inbox = () => {
    const s = st();
    return `<h1>Wiadomości</h1><div class="row mb"><button class="btn small" data-act="readall">Oznacz wszystkie jako przeczytane</button></div>
      <div class="card tight">${s.inbox.map((m) => `<div class="msg ${m.read ? '' : 'unread'} ${m.type} ${params.open === m.id ? 'open' : ''}" data-act="togglemsg" data-id="${m.id}"><div class="row between"><span class="t">${esc(m.title)}</span><span class="d">${U.dateStr(m.date)}</span></div><div class="b">${m.body}</div></div>`).join('') || '<div class="empty">Brak wiadomości</div>'}</div>`;
  };

  SCREENS.squad = () => {
    const s = st();
    const tab = params.tab || 'all';
    let list = M.myJumpers();
    if (tab !== 'all') list = list.filter((j) => M.draftGroupOf(j) === tab);
    const getters = {
      name: (j) => j.last, age: (j) => W.age(j), ovr: (j) => W.overall(j), pot: (j) => M.potEstimate(j), form: (j) => j.form, fat: (j) => j.fatigue, wc: (j) => s.standings.wc[j.id] || 0, group: (j) => 'ABJR'.indexOf(j.group || 'R'),
    };
    SJM.ATTRS.forEach((a) => (getters[a.key] = (j) => j.attrs[a.key]));
    list = applySort('squad', list, getters, { key: 'ovr', dir: -1 });
    const draft = M.groupDraft(), nDraft = Object.keys(draft).length, over = M.draftOverLimit();
    const counts = { A: M.draftCount('A'), B: M.draftCount('B'), J: M.draftCount('J'), R: M.draftCount('R') };
    const lim = (g) => counts[g] > M.GROUP_LIMITS[g] ? `<span class="neg">${counts[g]}/${M.GROUP_LIMITS[g]}</span>` : `${counts[g]}/${M.GROUP_LIMITS[g]}`;
    const tabs = [['all', `Wszyscy (${M.myJumpers().length})`], ['A', `Kadra A (${lim('A')})`], ['B', `Kadra B (${lim('B')})`], ['J', `Juniorzy (${lim('J')})`], ['R', `Kluby (${counts.R})`]];
    return `<h1>Kadra narodowa</h1>
      <p class="muted small">Kadra A trenuje z trenerem głównym i startuje w Pucharze Świata, kadra B – w Pucharze Kontynentalnym, juniorzy (U-20) – w FIS Cup i MŚJ. Zawodnicy klubowi rozwijają się wolniej.</p>
      ${nDraft ? `<div class="card mb row between"><div><b>Zmiany w kadrach czekają na zatwierdzenie (${nDraft})</b><div class="small ${over.length ? 'neg' : 'muted'}">${over.length ? 'Za duże kadry: ' + over.map((x) => `${x.g} ${x.n}/${x.max}`).join(', ') + ' – federacja odrzuci zgłoszenie, dopóki ich nie zmniejszysz.' : 'Wszystkie kadry mieszczą się w limitach.'} Do czasu zatwierdzenia obowiązuje dotychczasowy skład.</div></div><div class="row"><button class="btn primary" data-act="confirmgroups">✔ Potwierdź kadry</button><button class="btn" data-act="discardgroups">✖ Odrzuć zmiany</button></div></div>` : ''}
      <div class="tabs">${tabs.map(([k, l]) => `<button class="${tab === k ? 'active' : ''}" data-act="tab" data-tab="${k}">${l}</button>`).join('')}<span style="flex:1"></span><button class="btn small" data-act="autogroups">Automatyczny podział</button></div>
      <div class="card tight scroll"><table>
        <tr>${sortTh('squad', 'name', 'Zawodnik')}${sortTh('squad', 'age', 'Wiek', 'c')}${sortTh('squad', 'group', 'Kadra')}${sortTh('squad', 'ovr', 'Ocena', 'c')}${sortTh('squad', 'pot', 'Potencjał')}
        ${SJM.ATTRS.map((a) => sortTh('squad', a.key, `<span title="${a.name}">${a.short}</span>`, 'c')).join('')}
        ${sortTh('squad', 'form', 'Forma', 'c')}${sortTh('squad', 'fat', 'Zmęcz.')}<th>Status</th>${sortTh('squad', 'wc', 'PŚ', 'num')}</tr>
        ${list.map((j) => `<tr>
          <td>${jl(j)} ${j.lowYears >= 1 && W.age(j) >= 22 ? `<span class="small warn" title="${j.lowYears} ${j.lowYears === 1 ? "sezon" : "sezony"} z rzędu bez regularnych startów w PŚ i LGP (mniej niż 1/3 startów). Senior, który skacze głównie w PK/FIS Cup, coraz częściej kończy karierę – licznik zeruje dopiero sezon, w którym co najmniej 1/3 jego startów to PŚ lub LGP.">⏳${j.lowYears}</span> ` : ""}${j.newcomer === s.season ? '<span class="small" title="Nowy w klubie (nabór w maju). Jeśli do końca sezonu nie wystąpi w żadnych zawodach poza mistrzostwami kraju, zrezygnuje.">🆕</span> ' : ''}${SJM.T.badges(j, true)}</td><td class="c">${W.age(j)}</td>
          <td><select data-change="group" data-id="${j.id}" ${draft[j.id] ? `class="changed" title="Zmiana czeka na zatwierdzenie (obecnie: ${GROUP_NAMES[j.group || 'R']})"` : ''}>${['A', 'B', 'J', 'R'].map((g) => `<option value="${g}" ${M.draftGroupOf(j) === g ? 'selected' : ''}>${GROUP_NAMES[g]}</option>`).join('')}</select>${draft[j.id] ? ' <span class="small warn">✎</span>' : ''}</td>
          <td class="c">${ovr(W.overall(j))}</td><td>${stars(M.potEstimate(j))}</td>
          ${SJM.ATTRS.map((a) => `<td class="c">${attr(j.attrs[a.key])}</td>`).join('')}
          <td class="c">${formStr(j.form)}</td><td>${bar(j.fatigue, 100, true)}</td><td>${status(j)}</td><td class="num">${s.standings.wc[j.id] || ''}</td></tr>`).join('')}
      </table></div>`;
  };

  SCREENS.nominations = () => nominationsScreen();

  // ---------- Zgłoszenia składów ----------
  const COACH_ROLE_NAMES = { coachA: 'trener główny', coachB: 'trener kadry B', coachJ: 'trener juniorów' };
  // z kogo korzysta trener przy danym cyklu (zawodnicy zgłoszeni przez nas gdzie indziej, np. na PŚ, są pominięci)
  const COACH_POOL = {
    COC: 'głównie kadra B, ale także zawodnicy kadry A, których nie zgłosiłeś na PŚ (wyraźnie lepszy zawodnik z A wygrywa z zawodnikiem z B), oraz klubowi i juniorzy',
    SCOC: 'głównie kadra B, ale także zawodnicy kadry A, których nie zgłosiłeś na LGP (wyraźnie lepszy zawodnik z A wygrywa z zawodnikiem z B), oraz klubowi i juniorzy',
    SGP: 'głównie kadra A, w razie potrzeby kadra B i pozostali',
    FIS: 'juniorzy, klubowi i kadra B (bez kadry A)',
    WJC: 'juniorzy U-20 (kadra A tylko w razie braku zawodników)',
    NAT: 'wszyscy zawodnicy',
  };
  function nominationsScreen() {
    const s = st();
    const wk = M.currentWeek();
    if (!wk.events.length) return `<h1>Zgłoszenia</h1><div class="card empty">W tym tygodniu nie ma zawodów. Zawodnicy trenują zgodnie z planem.</div>`;
    const noms = M.ensureNominations();
    const conf = !!noms.confirmed;
    const levels = M.weekLevels(wk);
    const manualLv = levels.filter((lv) => !M.isDelegated(lv));
    const dl = M.deadline(wk);
    const order = { A: 0, B: 1, J: 2, R: 3 };
    const list = M.myJumpers().sort((a, b) => order[a.group || 'R'] - order[b.group || 'R'] || W.overall(b) - W.overall(a));
    const levelCards = levels.map((lv) => {
      const evs = wk.events.filter((e) => e.level === lv);
      const n = (noms.byLevel[lv] || []).length, q = M.quotaFor(lv, s.nation, wk);
      const role = M.DELEGABLE[lv];
      const coach = role ? s.player.staff[role] : null;
      const del = M.isDelegated(lv);
      let mode = '<div class="small muted mt">Skład ustalasz sam</div>';
      if (role) {
        mode = `<div class="seg mt">
          <button class="${!del ? 'on' : ''}" data-act="deleg" data-lv="${lv}" data-on="0" ${conf ? 'disabled' : ''}>Wybieram sam</button>
          <button class="${del ? 'on' : ''}" data-act="deleg" data-lv="${lv}" data-on="1" ${conf ? 'disabled' : ''} title="${COACH_ROLE_NAMES[role]}">Trener${coach ? ': ' + esc(coach.last) + ' (' + coach.quality + ')' : ' (wakat!)'}</button></div>`;
        if (del) mode += conf ? `<div class="small mt">${(noms.byLevel[lv] || []).map((id) => esc(s.jumpers[id] ? s.jumpers[id].last : '?')).join(', ') || '<span class="muted">trener nikogo nie wybrał</span>'}</div>`
          : `<div class="small muted mt">${COACH_ROLE_NAMES[role][0].toUpperCase() + COACH_ROLE_NAMES[role].slice(1)} wybierze skład spośród zawodników „dostępnych dla trenerów”${COACH_POOL[lv] ? " – " + COACH_POOL[lv] : ""}.</div>`;
      }
      return `<div class="card"><div class="row between">${lvPill(lv)}<b class="${n > q ? 'neg' : ''}">${del && !conf ? '–' : n} / ${q}</b></div>
        <div class="mt small">${evs.map((e) => `${W.flag(W.getHill(e.hill).nation || s.nation)} ${esc(SJM.CAL.eventTitle(e))} · HS${W.getHill(e.hill).HS}`).join('<br>')}</div>
        ${quotaNote(lv, wk)}
        ${lv === 'WJC' ? '<div class="small muted">Tylko zawodnicy U-20</div>' : ''}${mode}</div>`;
    }).join('');
    const teamHtml = wk.events.filter((e) => e.format !== 'ind').map((e) => {
      const nominated = noms.byLevel[e.level] || [];
      if (M.isDelegated(e.level)) return `<div class="card"><h3>${esc(SJM.CAL.eventTitle(e))}</h3><div class="small muted">Skład drużyny ustali trener.</div></div>`;
      const size = SJM.SIM.teamSize(e.format);
      if (nominated.length < size) return `<div class="card"><h3>${esc(SJM.CAL.eventTitle(e))}</h3><div class="neg small">Za mało zawodników (${nominated.length}/${size}) – nie wystartujemy.</div></div>`;
      const team = M.teamFor(s.nation, e.level, nominated, e).map((j) => j.id);
      return `<div class="card"><h3>${esc(SJM.CAL.eventTitle(e))}</h3>${[...Array(size).keys()].map((k) => `<div class="row small mb">Grupa ${k + 1}: <select data-change="teampick" data-ev="${e.id}" data-slot="${k}" ${conf ? 'disabled' : ''}>${nominated.map((id) => `<option value="${id}" ${team[k] === id ? 'selected' : ''}>${esc(W.fullName(s.jumpers[id]))}</option>`).join('')}</select></div>`).join('')}</div>`;
    }).join('');
    // miejsce w klasyfikacji: zimą PŚ → PK → FIS Cup, latem LGP → LPK → FIS Cup (pierwsza, w której zawodnik ma punkty)
    const cups = wk.summer ? [['sgp', 'LGP'], ['scoc', 'LPK'], ['fis', 'FC']] : [['wc', 'PŚ'], ['coc', 'PK'], ['fis', 'FC']];
    const ranks = cups.map(([k, l]) => { const m = {}; Object.entries(s.standings[k] || {}).sort((a, b) => b[1] - a[1]).forEach(([id], i) => (m[id] = i + 1)); return [m, l]; });
    const rankCell = (j) => { const r = ranks.find(([m]) => m[j.id]); return r ? `<span class="pill lv-${cups[ranks.indexOf(r)][0].toUpperCase()}">${r[1]}</span> <b>${r[0][j.id]}.</b>` : '<span class="muted">—</span>'; };
    const rows = list.map((j) => {
      const cur = M.nominationLevelOf(j.id);
      const byCoach = cur && M.isDelegated(cur);
      const unavailable = j.injury > 0 || j.suspended > 0;
      let startCell;
      if (byCoach) startCell = `<span class="pill lv-${cur}">${SJM.LEVELS[cur].short}</span> <span class="small muted">wybór trenera</span>`;
      else if (conf) startCell = cur ? `<span class="pill lv-${cur}">${SJM.LEVELS[cur].name}</span>` : '<span class="muted small">—</span>';
      else startCell = `<select data-change="nominate" data-id="${j.id}" ${unavailable ? 'disabled' : ''}><option value="">—</option>${manualLv.map((lv) => { const why = M.ineligibleReason(j, lv); return `<option value="${lv}" ${cur === lv ? "selected" : ""} ${why ? "disabled" : ""}>${SJM.LEVELS[lv].name}${why ? " (" + why + ")" : ""}</option>`; }).join("")}</select>`;
      const stv = M.jumperStatus(j);
      const statusCell = cur && !byCoach ? '<span class="small muted">startuje</span>'
        : conf ? (byCoach ? "<span class=\"small muted\">startuje</span>" : (noms.coachHome || []).includes(j.id) ? "<span class=\"small warn\" title=\"Trener uznał, że w dołku formy lub przy dużym zmęczeniu lepiej zostać w domu: szybsza odbudowa formy i regeneracja\">trening w domu (decyzja trenera)</span>" : `<span class="small ${stv === "train" ? "muted" : ""}">${stv === "train" ? "trening w domu" : "trening (nie wybrany)"}</span>`)
        : `<select data-change="jstatus" data-id="${j.id}" ${unavailable ? "disabled" : ""} title="Trening w domu zamiast startu: szybsza odbudowa formy (najmocniej po dołku), ok. 12% szans na przełom (+1,5 formy), szybsza regeneracja i +20% rozwoju cech w tym tygodniu. Koszt: brak punktów, a kadrowicz bez startów dłużej niż 4 tygodnie traci morale."><option value="avail" ${stv === 'avail' ? 'selected' : ''}>Dostępny dla trenerów</option><option value="train" ${stv === 'train' ? 'selected' : ''}>Trening w domu (odbudowa formy)</option></select>`;
      return `<tr class="${cur ? 'mine' : ''}"><td>${jl(j)} ${SJM.T.badges(j, true)}</td><td class="c">${W.age(j)}</td><td>${gPill(j.group)}</td><td class="c">${ovr(W.overall(j))}</td><td class="c">${formStr(j.form)}</td><td>${bar(j.fatigue, 100, true)}</td><td>${status(j)}</td><td>${licBadges(j)}</td><td>${startCell}</td><td class="small nowrap">${rankCell(j)}</td><td class="small lastwk">${(() => { const n = M.lastWeekendNote(j); return n ? `<span class="${n.started ? "" : "muted"}">${esc(n.text)}</span>` : `<span class="muted">—</span>`; })()}</td><td>${statusCell}</td></tr>`;
    }).join('');
    return `<div class="row between mb"><div><h1 style="margin:0">Zgłoszenia · ${esc(wk.label)}</h1>
        <div class="muted">Termin zgłoszeń: <b>${fmtDay(dl)}</b> (4 dni przed zawodami) · ${conf ? '<span class="pos">✔ składy zatwierdzone</span>' : '<span class="warn">⚠ czeka na Twoją decyzję</span>'}</div></div>
        <div class="row">${conf ? `<button class="btn" data-act="unconfirmnom">✏ Zmień składy</button><button class="btn go" data-act="next">Rozegraj tydzień ▶</button>`
          : `<button class="btn" data-act="assist" title="Asystent zaproponuje zawodników tylko w cyklach, które prowadzisz sam">💡 Podpowiedź asystenta</button><button class="btn" data-act="clearnom">Wyczyść</button><button class="btn go" data-act="confirmnom">✅ Zatwierdź składy</button>`}</div></div>
      <div class="grid g4 mb">${levelCards}</div>
      ${teamHtml ? `<h2>Składy drużynowe</h2><div class="grid g4 mb">${teamHtml}</div>` : ''}
      <p class="small muted">Każdy zawodnik startuje najwyżej w jednym cyklu w tygodniu. Zawodnicy „dostępni dla trenerów” mogą zostać wybrani przez trenerów kadr do cykli, które im oddałeś – jeśli nie zostaną wybrani, trenują. Zawodnicy na „treningu” nie startują nigdzie.</p>
      <div class="card tight scroll"><table>
        <tr><th>Zawodnik</th><th class="c">Wiek</th><th>Kadra</th><th class="c">Ocena</th><th class="c">Forma</th><th>Zmęczenie</th><th>Zdrowie</th><th title="Uprawnienia do startu: punkty PŚ/PK z tego lub poprzedniego sezonu">Uprawn.</th><th>Start (Twój wybór)</th><th title="Miejsce w klasyfikacji generalnej sezonu: ${wk.summer ? 'LGP, a bez punktów LGP – LPK, potem FIS Cup' : 'PŚ, a bez punktów PŚ – PK, potem FIS Cup'}">Klasyfikacja</th><th title="Wyniki z ostatniego tygodnia z zawodami: miejsca w kolejnych konkursach (kw. – odpadł w kwalifikacjach)">Poprzedni weekend</th><th>Jeśli nie startuje</th></tr>
        ${rows}</table></div>`;
  }

  function periodName(p) { return p === 0 ? 'lato' : 'okres ' + p; }
  function periodHeader(p) { return p === 0 ? 'Lato – kwoty z poprzedniego sezonu' : 'Okres kwotowy ' + p; }

  // zakładka „Kwoty startowe" – okresy i przeliczenia
  function quotaTable() {
    const s = st();
    const per = M.currentPeriod();
    // przeliczenie na początku każdego okresu (także po lecie)
    const nextIdx = s.calendar.weeks.findIndex((w, i) => i > s.week && w.period > per);
    const next = nextIdx >= 0 ? s.calendar.weeks[nextIdx] : null;
    const R = M.QUOTA_RULES, H = M.HOST_BONUS;
    const rows = SJM.NATIONS.map((n) => n.code).sort((a, b) => s.nations[b].quota.WC - s.nations[a].quota.WC || s.nations[b].quota.COC - s.nations[a].quota.COC);
    const chg = (v, p) => { const d = p !== undefined ? v - p : 0; return d ? `<span class="${d > 0 ? 'pos' : 'neg'}"> ${d > 0 ? '+' : ''}${d}</span>` : ''; };
    const bonus = (q) => [q.add ? `+${q.add}` : '', q.cocB ? '+1 PK' : '', q.wjcB ? '+1 MŚJ' : ''].filter(Boolean).join(' ') || '–';
    return `<div style="padding:12px 14px">
      <div class="row between"><div><b>${per === 0 ? 'Lato' : `Okres ${per} z 3`}</b> · ${next ? `kolejne przeliczenie: <b>${fmtDay(new Date(next.date))}</b> (${esc(next.label)})` : 'ostatni okres sezonu – kolejne przeliczenie po sezonie'}</div>
      <div class="small muted">Okresy: lato · 1) start → TCS · 2) TCS → styczeń · 3) luty → koniec sezonu</div></div>
      <p class="small muted" style="line-height:1.6">Kwoty liczy się z rankingów kroczących FIS z ostatnich 12 miesięcy: na początku każdego okresu wyniki tego sezonu zastępują ten sam okres poprzedniego, więc jeden słabszy okres nie przekreśla kwoty.<br>
      <b>PŚ</b> (ranking światowy: PŚ + LGP): po 1 miejscu za zawodnika w top ${R.wrlTop} (maks. ${R.wrlPerNation} na kraj); kraj z 1–2 zawodnikami dostaje +2, z 3 – +1; +1 za zawodnika w top 3 ostatniego okresu PK, +1 za medal indywidualny MŚJ (to miejsce może zająć tylko medalista albo inny junior U-20); maks. ${R.maxWC}. Każdy kraj może zgłosić co najmniej ${R.basicWC} zawodników. Gospodarz: +${H.WC} (grupa krajowa) – tylko w 2 konkursach indywidualnych w sezonie: cały weekend albo pierwszy konkurs dwóch weekendów u siebie (np. weekend z drużynówką zużywa 1). Weekendy wybierasz w Zgłoszeniach, bez wyboru – kolejność kalendarza. Tak samo w LGP.<br>
      <b>PK</b> (ranking kontynentalny: PK + LPK): po 1 miejscu za zawodnika w top ${R.crlTop} (maks. ${R.crlPerNation} na kraj), co najmniej ${R.minCOC}, a do tego +1 za każdego zawodnika w top 3 ostatniego okresu FIS Cup (ponad minimum); maks. ${R.maxCOC}. Gospodarz +${H.COC}.<br>
      <b>FIS Cup</b>: każdy kraj ma kwotę ${R.fisQuota} (także gospodarz). MŚ/IO/MŚ w lotach: 4 + obrońcy tytułu.<br>
      Lato: Letnie Grand Prix – kwota jak w PŚ (gospodarz +${H.SGP}), Letni PK – jak w PK (gospodarz +${H.SCOC}). Do startu w PŚ i LGP zawodnik potrzebuje punktów PŚ, LGP, PK lub LPK, w PK i LPK – dowolnych punktów FIS (z tego lub poprzedniego sezonu).</p>${periodBonusHtml()}${olympicHtml()}</div>
      <table><tr><th>Kraj</th><th class="num">PŚ</th><th class="num" title="Zawodnicy w top ${R.wrlTop} rankingu światowego (maks. ${R.wrlPerNation} na kraj)">top ${R.wrlTop} świat</th><th class="num">dodatkowe</th><th class="num">PK</th><th class="num" title="Zawodnicy w top ${R.crlTop} rankingu kontynentalnego">top ${R.crlTop} PK</th><th class="num">FIS Cup</th></tr>
      ${rows.map((c) => { const q = s.nations[c].quota; return `<tr class="${c === s.nation ? 'mine' : ''}"><td>${natl(c)}</td><td class="num"><b>${q.WC}</b>${chg(q.WC, q.prevWC)}</td><td class="num">${q.wrl !== undefined ? q.wrl : '–'}</td><td class="num small">${bonus(q)}</td><td class="num"><b>${q.COC}</b>${chg(q.COC, q.prevCOC)}</td><td class="num">${q.crl !== undefined ? q.crl : '–'}</td><td class="num">${q.FIS}${chg(q.FIS, q.prevFIS)}</td></tr>`; }).join('')}</table>`;
  }

  // uprawnienia zawodnika do startu (PŚ / PK)
  function licBadges(j) {
    const b = (ok, lbl, tip) => `<span class="lic ${ok ? 'ok' : 'no'}" title="${tip}">${lbl}</span>`;
    return b(M.licenseFor(j, 'WC'), 'PŚ', 'Puchar Świata, Letnie Grand Prix i imprezy: wymagane punkty PŚ, LGP, PK lub LPK') + b(M.licenseFor(j, 'COC'), 'PK', 'Puchar Kontynentalny (zima i lato): wymagane punkty PŚ, LGP, PK, LPK lub FIS Cup');
  }
  // premie za top 3 klasyfikacji ostatniego okresu PK (→ PŚ) i FIS Cup (→ PK)
  function periodBonusHtml() {
    const b = st().periodBonus;
    if (!b) return '';
    const k = b.period, summer = M.hasSummer();
    const src = k === 0 || (k === 1 && !summer) ? 'okres 3 poprzedniego sezonu' : k === 1 ? 'lato' : `okres ${k - 1}`;
    const line = (name, to, list) => `<div class="small"><b>${name}</b> (${src}) → ${to}: ${list.length ? list.map((x, i) => { const j = st().jumpers[x.id]; return `${i + 1}. ${W.flag(x.nat)} ${j ? esc(W.fullName(j)) : '?'} (${x.pts})`; }).join(' · ') : '<span class="muted">brak</span>'}</div>`;
    return `<div class="mb">${line('Klasyfikacja okresu PK', '+1 do kwoty PŚ (maks. 1 na kraj)', b.COC)}${line('Klasyfikacja okresu FIS Cup', '+1 do kwoty PK', b.FIS)}
      <div class="small muted">Liczą się tylko punkty z danego okresu. Gdy kraj ma już premię (PŚ) albo kwotę ${M.QUOTA_RULES.maxWC}, miejsce przechodzi na kolejnego zawodnika w klasyfikacji okresu.</div></div>`;
  }
  // kwalifikacja olimpijska: prognoza w trakcie okresu albo przyznane kwoty
  function olympicHtml() {
    const s = st(), wk = M.currentWeek();
    const done = s.olyQuota && s.olyQuota.year === s.calendar.season + 1 ? s.olyQuota : null;
    const Y = done ? done.year : wk ? M.olyYearOf(wk.date) : null;
    if (!Y) return '';
    const a = done || M.olympicAllocation(Y), O = M.OLY, cut = M.olyCutoff(Y);
    const d = (iso) => iso.slice(8, 10) + '.' + iso.slice(5, 7) + '.' + iso.slice(0, 4);
    const rows = Object.entries(a.nats).filter(([, n]) => n > 0).sort((x, y) => y[1] - x[1]);
    return `<div class="mb"><b>Igrzyska Olimpijskie ${Y}</b> – ${done ? 'kwoty przyznane' : `prognoza (okres kwalifikacyjny od ${d(M.olyStart(Y))}${cut ? ` do ${d(cut)}` : ''})`}
      <div class="small muted" style="line-height:1.6">Olimpijska lista kwotowa: punkty PŚ i LGP z okresu (lista PK tylko, gdy się wyczerpie). ${O.quota} miejsc po 1 na zawodnika, maks. ${O.perNoc} na kraj – 4. tylko gdy 4. zawodnik kraju jest w top ${O.fourthTop}; gospodarz ma zagwarantowane 1 miejsce. Potem ${O.extra} miejsca dodatkowe: kraje bez zawodnika, następnie z jednym. Start: min. 1 punkt PŚ/LGP/PK w okresie.</div>
      <div class="small">${rows.length ? rows.map(([c, n]) => `<span style="white-space:nowrap${c === s.nation ? ';font-weight:700' : ''}">${W.flag(c)} ${c} ${n}${a.host === c ? ' (gosp.)' : a.extra.includes(c) ? ' (+dod.)' : ''}</span>`).join(' · ') : '<span class="muted">brak punktów w okresie</span>'}</div>
      <div class="small">Nasza kwota: <b>${a.nats[s.nation] || 0}</b></div></div>`;
  }
  function quotaNote(lv, wk) {
    const s = st();
    const q = s.nations[s.nation].quota;
    const host = M.hostBonusIn(lv, s.nation, wk);
    // grupa krajowa (PŚ/LGP): 2 konkursy indywidualne w sezonie – gracz wybiera, w których weekendach u siebie ją wykorzystać
    const ng = wk === M.currentWeek() ? M.nationalGroupChoice(lv) : null;
    let ngNote = '';
    if (ng) {
      const conf = !!M.ensureNominations().confirmed;
      const opts = [[0, 'Nie wykorzystuj']].concat(ng.n >= 2 ? [[1, 'Tylko 1. konkurs'], [2, 'Oba konkursy']] : [[1, 'Wykorzystaj']]);
      ngNote = `<div class="mt small"><b>Grupa krajowa</b> (+${M.HOST_BONUS[lv]}, w sezonie 2 konkursy indywidualne u siebie; wykorzystane dotąd: ${ng.used}, zostało: ${2 - ng.used})${ng.chosen ? '' : ' · <span class="muted">domyślnie: kolejność kalendarza</span>'}
        <div class="seg mt">${opts.map(([k, l]) => `<button class="${ng.cur === k ? 'on' : ''}" data-act="ngpick" data-lv="${lv}" data-n="${k}" ${conf || k > ng.max ? 'disabled' : ''}>${l}</button>`).join('')}</div>
        ${ng.cur && ng.cur < ng.n ? `<div class="warn">Grupa krajowa tylko w 1. konkursie indywidualnym – w kolejnym startuje ${q.WC} najlepszych ze zgłoszonych.</div>` : ''}
        ${2 - ng.used - ng.cur > 0 ? `<div class="muted">Pozostałe ${2 - ng.used - ng.cur} – na pierwszy konkurs kolejnego weekendu u siebie.</div>` : ''}</div>`;
    }
    // deficyt: trener delegowanego cyklu wysyła mniejszą ekipę
    const ql = M.quotaFor(lv, s.nation, wk), cl = M.coachLimit(lv, ql);
    const save = M.isDelegated(lv) && cl < ql ? ` · <span class="warn">deficyt – trener wyśle maks. ${cl}</span>` : '';
    // weekend z konkursem drużynowym podnosi kwotę do 4
    const team = (lv === 'WC' || lv === 'SGP') && M.quotaFor(lv, s.nation, wk) > q.WC + (host ? M.HOST_BONUS[lv] : 0) ? ` · <span class="pos">konkurs drużynowy – można zgłosić 4</span>` : '';
    // miejsce za medal MŚJ: tylko medalista albo inny junior
    const wr = M.wjcReserve(lv, s.nation, wk);
    const wjc = wr ? ` · <span class="warn">1 miejsce za medal MŚJ – tylko dla ${wr.medal.length ? `medalisty (${wr.medal.map((id) => s.jumpers[id] ? esc(s.jumpers[id].last) : '?').join(', ')}) albo ` : ''}juniora U-20</span>` : '';
    if (lv === 'WC') return `<div class="small muted">Kwota (okres ${M.currentPeriod()}): ${q.WC}${q.wrl !== undefined ? ` · ${M.quotaWhy(q)}` : ''}${host ? ` · <span class="pos">+${M.HOST_BONUS.WC} grupa krajowa</span>` : ''}${team}${wjc}</div>${ngNote}`;
    if (lv === 'SGP') return `<div class="small muted">Kwota jak w PŚ: ${q.WC}${host ? ` · <span class="pos">+${M.HOST_BONUS.SGP} grupa krajowa</span>` : ''}${team}${wjc}</div>${ngNote}`;
    if (lv === 'COC') return `<div class="small muted">Kwota: ${q.COC}${q.crl !== undefined ? ` · w top ${M.QUOTA_RULES.crlTop} rankingu PK: ${q.crl}${q.crl < M.QUOTA_RULES.minCOC ? ` (min. ${M.QUOTA_RULES.minCOC})` : ''}${q.fisB ? `, +${q.fisB} za top 3 FIS Cup` : ''}` : ''}${host ? ` · <span class="pos">+${M.HOST_BONUS.COC} gospodarz</span>` : ''}${save}</div>`;
    if (lv === 'SCOC') return `<div class="small muted">Kwota jak w PK: ${q.COC}${host ? ` · <span class="pos">+${M.HOST_BONUS.SCOC} gospodarz</span>` : ''}${save}</div>`;
    if (lv === 'FIS') return `<div class="small muted">Kwota: ${ql} (stała dla każdego kraju)${save}</div>`;
    if (lv === 'OWG') {
      const o = s.olyQuota, n = M.quotaFor('OWG', s.nation, wk);
      if (!o || o.year !== s.calendar.season + 1) return `<div class="small muted">Kwoty olimpijskie nie zostały jeszcze przyznane.</div>`;
      return `<div class="small muted">Kwota olimpijska: <b>${n}</b>${o.host === s.nation ? ' (miejsce gospodarza)' : o.extra.includes(s.nation) ? ' (w tym miejsce dodatkowe)' : ''} · start tylko z punktami PŚ/LGP/PK z okresu kwalifikacyjnego${n < 2 ? ' · <span class="neg">za mało na superteam (duety)</span>' : ''}</div>`;
    }
    if (['WCH', 'SFWC'].includes(lv)) { const th = M.titleHolders(lv, s.nation); return `<div class="small muted">4 miejsca${th.length ? ` · <span class="pos">+ obrońca tytułu: ${th.map((id) => esc(s.jumpers[id].last)).join(', ')}</span> – miejsce osobiste, tylko w konkursie, w którym broni tytułu (w pozostałych startuje 4 pierwszych ze zgłoszenia)` : ''}</div>`; }
    return '';
  }

  // ---------- Rozegranie tygodnia: na żywo albo szybko ----------
  function liveDefaults(wk) {
    const s = st();
    const n = M.ensureNominations();
    return wk.events.filter((e) => ['WC', 'WCH', 'OWG', 'SFWC', 'WJC'].includes(e.level) && (n.byLevel[e.level] || []).length).map((e) => e.id);
  }
  function playModal() {
    const s = st();
    const wk = M.currentWeek();
    const n = M.ensureNominations();
    const def = new Set(liveDefaults(wk));
    openModal(`<button class="close" data-act="close">×</button><h2>${esc(wk.label)} – jak rozegrać zawody?</h2>
      <p class="muted small">Konkursy zaznaczone poniżej obejrzysz na żywo – wynik poznasz dopiero w trakcie transmisji (z kwalifikacjami). Pozostałe zostaną zasymulowane od razu.</p>
      <div class="card tight mb"><table>${wk.events.map((e) => { const mine = (n.byLevel[e.level] || []).length; return `<tr><td><label><input type="checkbox" class="liveev" value="${e.id}" ${def.has(e.id) ? 'checked' : ''}> ${lvPill(e.level)} ${W.flag(W.getHill(e.hill).nation || s.nation)} ${esc(SJM.CAL.eventTitle(e))}</label></td><td class="small muted">${mine ? `naszych: ${mine}` : 'bez naszych'}</td></tr>`; }).join('')}</table></div>
      <div class="row"><button class="btn go" data-act="playgo">▶ Rozegraj (zaznaczone na żywo)</button><button class="btn" data-act="playfast">⏩ Wszystko szybko</button>
      <span class="small muted">Domyślny tryb zmienisz w Menu.</span></div>`);
  }
  // kontuzja w trakcie weekendu: zmiana składu drużyny przed kolejnym konkursem drużynowym
  let teamChangeCont = null;
  function teamChangeModal(cont) {
    const s = st(), t = M.teamChangeInfo();
    if (!t) return cont();
    teamChangeCont = cont;
    const nm = (id) => { const j = s.jumpers[id]; return j ? `${esc(W.fullName(j))} (${Math.round(W.overall(j))}, forma ${U.fmt1(j.form)})` : '?'; };
    const hurt = t.injured.map((id) => `<b>${esc(W.fullName(s.jumpers[id]))}</b>${s.jumpers[id].injType ? ` (${esc(s.jumpers[id].injType)}, ${s.jumpers[id].injury} tyg.)` : ''}`).join(', ');
    const enough = t.cands.length >= t.size;
    openModal(`<h2>🚑 Kontuzja – zmiana składu</h2>
      <p>${hurt} ${t.injured.length > 1 ? 'nie mogą' : 'nie może'} wystąpić w konkursie: <b>${esc(t.title)}</b>.</p>
      ${enough ? `<p class="small muted">Ustal skład i kolejność grup (ostatni skacze lider). Do wyboru są zdrowi zawodnicy zgłoszeni na ten weekend.</p>
      <div class="card tight mb"><table>${t.suggested.map((sel, i) => `<tr><td>Grupa ${i + 1}</td><td><select class="tcpick">${t.cands.map((id) => `<option value="${id}" ${id === sel ? 'selected' : ''}>${nm(id)}</option>`).join('')}</select></td></tr>`).join('')}</table></div>
      <div class="row"><button class="btn go" data-act="tcok">Zatwierdź skład</button><button class="btn" data-act="tcauto">Niech wybierze trener</button></div>`
      : `<p class="neg">Zostało za mało zdrowych zgłoszonych zawodników (${t.cands.length}/${t.size}) – drużyna nie wystartuje.</p><button class="btn go" data-act="tcauto">Dalej</button>`}`);
  }
  function teamChangeDone(ids) {
    const err = M.setTeamChange(ids);
    if (err) return toast(err, true);
    closeModal();
    const c = teamChangeCont; teamChangeCont = null;
    if (c) c();
  }
  function doPlay(liveIds) {
    const s = st();
    const idx = s.week;
    closeModal();
    const wk = M.currentWeek();
    const r = M.playWeek();
    // weekend wstrzymany: decyzja o składzie drużyny, potem dokończenie (te same konkursy na żywo)
    // najpierw transmisje konkursów rozegranych do tej chwili, a okienko dopiero po nich – o kontuzji dowiadujemy się po konkursie
    if (r === 'teamChange') {
      SJM.SAVE.save('auto');
      const played = new Set(wk.events.slice(0, s.weekRun.next).map((e) => e.id));
      const now = (liveIds || []).filter((id) => played.has(id)), rest = (liveIds || []).filter((id) => !played.has(id));
      const ask = () => teamChangeModal(() => doPlay(rest));
      if (now.length) SJM.LIVE.open(now[0], { live: true, queue: now.slice(1), onExit: ask });
      else ask();
      return;
    }
    SJM.SAVE.save('auto');
    const after = () => { if (r === 'seasonEnd') go('summary'); else go('week', { i: idx }); };
    // konkursy odwołane w dniu zawodów znikają z tygodnia – nie ma czego oglądać na żywo
    const held = new Set(((wk && wk.events) || []).map((e) => e.id));
    if ((liveIds || []).some((id) => !held.has(id))) toast('Konkurs odwołany z powodu silnego wiatru.');
    liveIds = (liveIds || []).filter((id) => held.has(id));
    if (liveIds && liveIds.length) SJM.LIVE.open(liveIds[0], { live: true, queue: liveIds.slice(1), onExit: after });
    else after();
  }

  SCREENS.training = () => {
    const s = st(), p = s.player;
    const roles = { A: 'coachA', B: 'coachB', J: 'coachJ' };
    const acc = M.hillAccess(s.nation);
    const cards = ['A', 'B', 'J'].map((g) => {
      const t = p.training[g];
      const coach = p.staff[roles[g]];
      const members = M.myJumpers().filter((j) => j.group === g).sort((a, b) => W.overall(b) - W.overall(a));
      return `<div class="card">
        <div class="row between"><h2>${GROUP_NAMES[g]}</h2><span class="muted small">${members.length} zaw.</span></div>
        <div class="small muted mb">Trener: ${coach ? `${esc(coach.first + ' ' + coach.last)} · jakość ${coach.quality} · specjalność: ${coach.spec ? SJM.ATTRS.find((a) => a.key === coach.spec).name : '–'}` : '<span class="neg">brak trenera!</span>'}</div>
        ${g === 'A' ? `<div class="row mb"><label class="small">Intensywność</label><select data-change="train" data-g="${g}" data-k="intensity">${Object.entries(SJM.INTENSITY_NAMES).map(([k, n]) => `<option value="${k}" ${t.intensity === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
        <div class="row mb"><label class="small">Akcent</label><select data-change="train" data-g="${g}" data-k="focus">${Object.entries(SJM.FOCUS).map(([k, f]) => `<option value="${k}" ${t.focus === k ? 'selected' : ''}>${f.name}</option>`).join('')}</select></div>`
          : `<div class="kv small mb"><span class="k">Intensywność</span><span>${SJM.INTENSITY_NAMES[t.intensity]}</span><span class="k">Akcent</span><span>${SJM.FOCUS[t.focus].name}</span></div><div class="small muted mb">Plan ustala trener kadry co tydzień${t.why ? ': ' + esc(t.why) : ''}.</div>`}
        <table class="small">${members.map((j) => { const d = W.overall(j) - (j.ovrStart || W.overall(j)); return `<tr><td>${jl(j)}</td><td class="c">${ovr(W.overall(j))}</td><td class="num ${d > 0.05 ? 'pos' : d < -0.05 ? 'neg' : 'muted'}">${d >= 0 ? '+' : ''}${U.fmt1(d)}</td><td class="c">${formStr(j.form)}</td><td>${bar(j.fatigue, 100, true)}</td></tr>`; }).join('')}</table>
      </div>`;
    }).join('');
    return `<h1>Trening</h1>
      <div class="grid g3">${cards}</div>
      <div class="grid g2 mt">
        <div class="card"><h3>Jak działa trening</h3><div class="small" style="line-height:1.6">
          <b>Intensywny</b> – szybszy rozwój, ale większe zmęczenie, gorsza bieżąca forma i ryzyko kontuzji.<br>
          <b>Lekki</b> – wolniejszy rozwój, świeżość i lepsza forma na zawodach.<br>
          <b>Akcent</b> – przyspiesza rozwój wybranych cech kosztem pozostałych. <b>Regeneracja</b> obniża zmęczenie.<br>
          Najszybciej rozwijają się zawodnicy w wieku 15–21 lat. Po 28. roku życia spada motoryka, a po 30. – technika.<br>
          Zwiększ ten sezon rozwój dzięki: lepszym trenerom, Centrum przygotowania, Tunelowi aerodynamicznemu, skoczniom z igelitem (trening letni).</div></div>
        <div class="card"><h3>Baza treningowa</h3><div class="kv small">
          <span class="k">Skocznie duże/normalne dla kadr</span><span>${acc.big >= 1 ? '<span class="pos">dostępne</span>' : '<span class="warn">ograniczone (-' + Math.round((1 - acc.big) * 100) + '% rozwoju)</span>'}</span>
          <span class="k">Małe skocznie dla młodzieży</span><span>${acc.smallN} <span class="muted" title="Wpływ małych skoczni na nabór względem przeciętnego kraju (2 małe skocznie)">(nabór ${acc.youthRel >= 0 ? "+" : "−"}${U.fmt1(Math.abs(acc.youthRel))}/rok)</span> ${acc.small >= 1 ? '' : '<span class="warn">(za mało)</span>'}</span>
          <span class="k">Trening letni (igelit)</span><span>${acc.summer >= 1 ? '<span class="pos">pełny</span>' : '<span class="warn">ograniczony (-' + Math.round((1 - acc.summer) * 100) + '%)</span>'}</span>
          ${Object.entries(p.facilities).map(([k, v]) => `<span class="k">${SJM.FACILITIES[k].name}</span><span>poziom ${v}</span>`).join('')}
        </div></div>
      </div>`;
  };

  SCREENS.staff = () => {
    const s = st(), p = s.player;
    const role = params.role || 'all';
    let market = s.staffMarket.slice();
    if (role !== 'all') market = market.filter((x) => x.role === role || (M.isCoach(role) && M.isCoach(x.role)));
    market.sort((a, b) => b.quality - a.quality);
    const spec = (x) => x.spec ? SJM.ATTRS.find((a) => a.key === x.spec).name : '–';
    const tags = (x) => `${x.exJumper ? ' <span class="small muted" title="Były skoczek">🎿 były skoczek</span>' : ''}${x.newgen ? ' <span class="small muted">🌱 debiutant</span>' : ''}${x.interim ? ' <span class="small warn" title="Pełniący obowiązki do końca sezonu">p.o.</span>' : ''}`;
    return `<h1>Sztab szkoleniowy</h1>${s.staffWindow ? `<div class="card mb warn">🤝 Trwa okno kontraktowe – nowych ludzi pozyskasz tylko ofertami. <button class="btn small primary" data-act="nav" data-screen="contracts">Przejdź do okna</button></div>`
      : `<p class="muted small">Sztab zmienia się tylko w oknie kontraktowym po sezonie (przedłużenia, zwolnienia, oferty dla wolnych agentów). W trakcie sezonu możesz planować: obserwuj wolnych agentów i kończące się kontrakty.</p>`}
      <div class="card tight mb"><h3>Obecny sztab</h3><table>
        <tr><th>Funkcja</th><th>Osoba</th><th class="c">Jakość</th><th>Specjalność</th><th class="num">Pensja / rok</th><th class="c">Kontrakt do</th><th></th></tr>
        ${Object.entries(SJM.STAFF_ROLES).map(([r, info]) => { const x = p.staff[r]; return `<tr><td><b>${info.name}</b><div class="small muted">${info.desc}</div></td>
          <td>${x ? `${W.flag(x.nation)} ${esc(x.first + ' ' + x.last)} <span class="muted small">(${x.age} l.)</span>${tags(x)}` : '<span class="neg">wakat</span>'}</td>
          <td class="c">${x ? staffQ(x) : ''}</td><td>${x ? spec(x) : ''}</td><td class="num">${x ? U.money(x.salary) : ''}</td>
          <td class="c">${x && x.until !== undefined ? (x.until < s.season + 1 ? '<b class="warn">' : '') + x.until + '/' + String(x.until + 1).slice(2) + (x.until < s.season + 1 ? '</b>' : '') : ''}</td>
          <td>${x && s.staffWindow ? `<button class="btn small danger" data-act="fire" data-role="${r}">Zwolnij</button>` : ''}</td></tr>`; }).join('')}
      </table></div>
      <div class="tabs"><button class="${role === 'all' ? 'active' : ''}" data-act="staffrole" data-role="all">Wszyscy</button>${Object.entries(SJM.STAFF_ROLES).map(([r, i]) => `<button class="${role === r ? 'active' : ''}" data-act="staffrole" data-role="${r}">${i.name}</button>`).join('')}</div>
      <div class="card tight"><h3>Wolni agenci</h3><table>
        <tr><th>Osoba</th><th>Funkcja</th><th class="c">Jakość</th><th>Specjalność</th><th class="num">Min. żądanie od nas</th><th></th></tr>
        ${market.map((x) => { const cur = p.staff[x.role]; return `<tr><td>${W.flag(x.nation)} ${esc(x.first + ' ' + x.last)} <span class="muted small">(${x.age} l.)</span>${tags(x)}</td><td>${M.isCoach(x.role) ? 'Trener (kadra A, B lub juniorzy)' : SJM.STAFF_ROLES[x.role].name}</td>
          <td class="c">${staffQ(x)} ${cur ? `<span class="small ${x.quality > cur.quality ? 'pos' : 'neg'}" title="Różnica względem naszego sztabowca">${x.quality > cur.quality ? '+' : ''}${x.quality - cur.quality}</span>` : ''}</td>
          <td>${spec(x)}</td><td class="num">${U.money(M.staffAsk(x, s.nation))}</td>
          <td>${(x.blocked || []).includes(s.nation) ? '<span class="small neg">nie chce z nami pracować</span>' : ''}</td></tr>`; }).join('') || '<tr><td colspan="6" class="empty">Brak wolnych agentów</td></tr>'}
      </table></div>
      <p class="small muted">Wolni agenci przechodzą na kolejny rok: starzeją się i rozwijają, część znajduje inną pracę, dochodzą nowi (także byli skoczkowie). Kontrakty kończące się po tym sezonie są pogrubione, a ich przedłużenia negocjujesz w marcu.</p>`;
  };

  // okno kontraktowe sztabu: marzec – przedłużenia, kwiecień – rundy ofert o wolnych sztabowców
  SCREENS.contracts = () => {
    const s = st(), p = s.player, w = s.staffWindow;
    if (!w) return `<h1>Okno kontraktowe</h1><div class="card"><div class="empty">Okno kontraktowe jest zamknięte. Otwiera się po zakończeniu sezonu.</div></div>`;
    const room = M.payrollRoom();
    const payNote = `<p class="small ${room < 0 ? 'neg' : 'muted'}">Budżet płacowy sztabu (limit zarządu: ${U.money(M.payrollCap())} rocznie${M.payrollFrozen() ? ' – tyle zostaje z przychodów po kosztach kadr, obiektów, skoczni i wyjazdów (zawsze 30–55% przychodów)' : ' (55% rocznych przychodów)'} + 15% oszczędności; przy każdej umowie odkładana jest rezerwa na pozostałe nieobsadzone stanowiska): wolne ${U.money(Math.max(0, room))}${room < 0 ? ' – limit przekroczony' : ''}.</p>`;
    const spec = (x) => x.spec ? SJM.ATTRS.find((a) => a.key === x.spec).name : '–';
    const who = (x) => `${W.flag(x.nation)} ${esc(x.first + ' ' + x.last)}${x.real ? '' : ''}${x.exJumper ? ' <span class="small muted">🎿 były skoczek</span>' : ''}${x.newgen ? ' <span class="small muted">🌱 debiutant</span>' : ''}`;
    const yearsSel = (id, def) => `<select id="${id}">${[1, 2, 3].map((y) => `<option value="${y}" ${y === def ? 'selected' : ''}>${y} ${y === 1 ? 'sezon' : 'sezony'}</option>`).join('')}</select>`;
    // awanse trenerów: wspólna baza – trener kadry B może objąć kadrę A itd.
    const moves = M.coachMoves();
    const promoCard = moves.length ? `<div class="card mb"><h3>Awanse trenerów</h3>
      <p class="small muted">Trenerzy kadr to jedna baza – możesz przesunąć swojego trenera na wolne stanowisko (np. trenera kadry B na kadrę A) zamiast szukać nowego. Zachowuje kontrakt; jeśli na nowym stanowisku należy mu się więcej, dostaje podwyżkę. Zwolnione przez niego miejsce obsadzisz w naborze.</p>
      <table>${moves.map((m) => `<tr><td>${esc(m.name)} <span class="small muted">(jakość ${m.q})</span></td><td>${SJM.STAFF_ROLES[m.from].name} → <b>${SJM.STAFF_ROLES[m.to].name}</b>${m.replaces ? ` <span class="small muted">(zamiast przedłużenia: ${esc(m.replaces)})</span>` : ''}</td>
        <td><button class="btn small primary" data-act="promote" data-from="${m.from}" data-to="${m.to}">Awansuj</button></td></tr>`).join('')}</table></div>` : '';
    if (w.phase === 'renew') {
      const RES = { accepted: '<span class="pos">✔ Przedłużył kontrakt</span>', refused: '<span class="neg">✖ Odrzucił ofertę – odchodzi na rynek</span>', retired: '<span class="neg">👴 Odrzucił ofertę i przechodzi na emeryturę</span>', released: '<span class="muted">Kontrakt wygasł</span>' };
      return `<h1>Okno kontraktowe · marzec: przedłużenia</h1>${payNote}
        <p class="muted">Kontrakty tych osób kończą się z sezonem. Złóż ofertę (co najmniej minimalne żądanie). O decyzji decydują: wysokość oferty, prestiż kadry (tradycja, popularność, wyniki), staż u nas i ambicje sztabowca. Kto odrzuci ofertę, trafi na rynek, ale nie będzie chciał z nami rozmawiać.</p>
        ${w.renew.length ? '' : '<div class="card mb"><div class="empty">W tym roku nikomu z naszego sztabu nie kończy się kontrakt.</div></div>'}
        <p class="small muted">Przed naborem możesz jeszcze zwolnić kogoś w zakładce Sztab, żeby zawalczyć o lepszego.</p>
        <div class="card tight mb ${w.renew.length ? '' : 'hidden'}"><table>
          <tr><th>Funkcja</th><th>Osoba</th><th class="c">Wiek</th><th class="c">Jakość</th><th class="num">Obecna pensja</th><th class="num">Min. żądanie</th><th>Nastawienie</th><th>Oferta</th></tr>
          ${w.renew.map((it) => { const x = p.staff[it.role] || s.staffMarket.find((y) => y.id === it.id); return `<tr><td><b>${SJM.STAFF_ROLES[it.role].name}</b></td><td>${x ? who(x) : '–'}</td><td class="c">${x ? x.age : ''}</td><td class="c">${x ? staffQ(x) : ''}</td>
            <td class="num">${x && !it.result ? U.money(x.salary) : ''}</td><td class="num">${U.money(it.ask)}</td><td class="small">${esc(it.mood)}</td>
            <td>${it.result ? RES[it.result] + (it.chance !== undefined ? ` <span class="small muted">(szansa ${Math.round(it.chance * 100)}%)</span>` : '') : `<div class="row"><input id="rs-${it.id}" type="number" step="1000" min="${it.ask}" value="${it.ask}" style="width:110px"> ${yearsSel('ry-' + it.id, 2)}
              <button class="btn small primary" data-act="renew" data-id="${it.id}">Złóż ofertę</button><button class="btn small danger" data-act="norenew" data-id="${it.id}">Nie przedłużaj</button></div>`}</td></tr>`; }).join('')}
        </table></div>${promoCard}
        <button class="btn primary" data-act="renewdone">Rozpocznij nabór ▶</button> <span class="small muted">${w.renew.length ? 'Nierozstrzygnięte kontrakty wygasną.' : ''}</span>`;
    }
    // faza naboru: funkcje po kolei, od trenera kadry A
    const role = M.ROLE_ORDER[w.roleIdx];
    const RNm = (r) => SJM.STAFF_ROLES[r].name;
    const fl = (c) => `${W.flag(c)} ${esc(W.nationData(c).name)}`;
    const steps = M.ROLE_ORDER.map((r, i) => {
      const mine = p.staff[r] ? '✔' : w.passed[r] ? 'pas' : 'wakat';
      return `<span class="${i === w.roleIdx ? '' : 'muted'}">${i === w.roleIdx ? '<b>▶ ' + RNm(r) + '</b>' : RNm(r)} <span class="small">(${mine})</span></span>`;
    }).join(' · ');
    const last = w.last && w.last.mine;
    const lastBox = last ? `<div class="card mb ${last.won ? 'pos' : ''}"><b>Runda ${w.last.round}:</b> ${last.won
      ? `✔ ${esc(last.name)} przyjął naszą ofertę (${RNm(last.role)}).`
      : `✖ ${esc(last.name)} wybrał ofertę: ${fl(last.to)}. Pozostali kandydaci nie są jeszcze rozstrzygnięci – wybierz kolejny cel (możesz dołączyć do walki o kandydata, którego wybrali już inni).`} <span class="small muted">Rywali: ${last.rivals}, szansa naszej oferty: ${Math.round(last.chance * 100)}%.</span></div>` : '';
    // przebieg naboru: każdy kandydat osobno (od najlepszego), z szansami wszystkich ofert
    const feedRow = (e) => e.local
      ? `<tr><td class="c">${e.round}</td><td>${fl(e.code)}</td><td colspan="2" class="small muted">spasował – bierze lokalnego sztabowca: ${esc(e.name)} (${e.q})</td></tr>`
      : `<tr class="${e.offers.some((o) => o.code === s.nation) ? 'mine' : ''}"><td class="c">${e.round}</td><td>${esc(e.name)} <span class="small muted">(${e.q})</span></td><td>${fl(e.code)}</td>
        <td class="small">${e.offers.length > 1 ? e.offers.map((o) => `${W.flag(o.code)} ${o.code === e.code ? '<b>' : ''}${Math.round(o.chance * 100)}%${o.code === e.code ? '</b>' : ''}`).join(' · ') : '<span class="muted">jedyna oferta</span>'}</td></tr>`;
    const feedFor = (r) => (w.feed || []).filter((e) => e.role === r).slice().reverse();
    const feedTable = (rows) => `<table><tr><th class="c">Runda</th><th>Kandydat</th><th>Podpisał z</th><th>Oferty (szanse)</th></tr>${rows.map(feedRow).join('')}</table>`;
    const curFeed = feedFor(role);
    const pastFeed = M.ROLE_ORDER.slice(0, w.roleIdx).filter((r) => feedFor(r).length).map((r) => `<details class="mb"><summary>${RNm(r)} – ${feedFor(r).length} podpisanych</summary><div class="card tight">${feedTable(feedFor(r))}</div></details>`).join('');
    const aiLeft = SJM.NATIONS.filter((n) => n.code !== s.nation && M.vacancies(n.code).includes(role)).length;
    let body;
    {
      const cands = s.staffMarket.filter((x) => x.role === role).sort((a, b) => b.quality - a.quality);
      const sel = cands.find((x) => x.id === params.cand);
      body = `${sel ? (() => { const ask = M.staffAsk(sel, s.nation), riv = M.rivalsFor(sel.id); return `<div class="card mb"><h3>Oferta: ${who(sel)} · ${SJM.STAFF_ROLES[sel.role].name}</h3>
          <p>Jakość ${staffQ(sel)}, ${sel.age} l., specjalność: ${spec(sel)}. Minimalne żądanie: <b>${U.money(ask)}</b> rocznie.<br>
          ${riv ? `<b class="neg">O tego kandydata walczy z nami ${riv} ${riv === 1 ? 'reprezentacja' : riv < 5 ? 'reprezentacje' : 'reprezentacji'}.</b> Nie znasz ich ofert.` : '<span class="pos">W tej rundzie nikt inny nie składa mu oferty.</span>'}</p>
          <div class="row">Pensja: <input id="bs" type="number" step="1000" min="${ask}" value="${ask}" style="width:120px"> Kontrakt: ${yearsSel('by', 2)}
          <button class="btn primary" data-act="staffbid" data-id="${sel.id}">Złóż ofertę (runda ${w.round})</button></div>
          <p class="small muted">Sztabowiec wybiera spośród ofert losowo, ale im lepsza oferta, tym większa szansa. Liczą się: pensja ponad żądanie, prestiż kadry, jego ambicje (dobrzy chcą do mocnych), praca we własnym kraju i długość kontraktu (starsi wolą dłuższe).</p></div>`; })() : ''}
        <div class="card tight"><table>
          <tr><th>Kandydat</th><th class="c">Wiek</th><th class="c">Jakość</th><th>Specjalność</th><th class="num">Min. żądanie</th><th class="c">Rywale</th><th></th></tr>
          ${cands.map((x) => { const blocked = (x.blocked || []).includes(s.nation); const riv = M.rivalsFor(x.id); return `<tr class="${x.id === params.cand ? 'mine' : ''}"><td>${who(x)}</td><td class="c">${x.age}</td><td class="c">${staffQ(x)}</td><td>${spec(x)}</td>
            <td class="num">${U.money(M.staffAsk(x, s.nation))}</td><td class="c">${riv || '–'}</td>
            <td>${blocked ? '<span class="small neg">nie chce z nami rozmawiać</span>' : `<button class="btn small" data-act="pickcand" data-id="${x.id}">Wybierz</button>`}</td></tr>`; }).join('') || '<tr><td colspan="7" class="empty">Brak kandydatów – w następnej rundzie pojawią się nowi.</td></tr>'}
        </table></div>`;
    }
    return `<h1>Okno kontraktowe · nabór: ${RNm(role)} (runda ${w.roleRound})</h1>${payNote}
      <div class="card mb small">${steps}</div>
      <p class="muted">Nabór idzie funkcja po funkcji. W każdej rundzie każda reprezentacja z wakatem wybiera jednego kandydata – kraje SI już wybrały (kolumna „Rywale”), teraz Ty. Potem kandydaci rozstrzygani są po kolei od najlepszego: jedna oferta – podpisuje, kilka – losowanie według atrakcyjności ofert. Przegrani od razu, przed rozstrzygnięciem kolejnego kandydata, wybierają nowy cel – także takiego, o którego walczą już inni (gdy przegramy, nabór czeka na nasz wybór). Kto spasuje, bierze słabszego lokalnego sztabowca (u nas: p.o. po oknie). Kraje SI z wakatem na tej funkcji: ${aiLeft}.</p>
      ${lastBox}${promoCard}${body}
      <div class="row mt"><button class="btn" data-act="skipround">Przeczekaj rundę</button><button class="btn" data-act="passrole">Pasuj: ${RNm(role)}</button><button class="btn danger" data-act="finishwin">Zakończ okno</button></div>
      ${curFeed.length ? `<h3 class="mt">Przebieg naboru: ${RNm(role)}</h3><div class="card tight mb">${feedTable(curFeed)}</div>` : ''}
      ${pastFeed ? `<h3 class="mt">Zakończone nabory</h3>${pastFeed}` : ''}`;
  };

  SCREENS.infra = () => {
    const s = st(), p = s.player;
    const typeName = { small: 'mała', medium: 'średnia', normal: 'normalna', large: 'duża', giant: 'gigantyczna', flying: 'mamut' };
    const hills = p.hills.slice().sort((a, b) => (!!a.club - !!b.club) || b.K - a.K);
    const sites = M.hillSites();
    const hillRows = hills.map((h) => {
      const busy = M.hillProjectBusy(h.id);
      const t = SJM.HILL_TYPES[h.type];
      const modCost = Math.round(t.cost * 0.22 * (1 - h.condition / 200));
      const hc = M.homolClass(h), best = h.building ? null : M.homolBest(h);
      const own = h.homol && h.homol.until >= s.season ? h.homol : null;
      const expiring = own && own.until === s.season;
      const homolCell = h.building ? '<span class="muted">–</span>' : hc ? `<b title="${esc(M.HOMOL[hc].use)}">${hc}</b> <span class="small ${expiring ? 'warn' : 'muted'}">${own ? (expiring ? 'wygasa po sezonie' : 'do ' + own.until + '/' + String(own.until + 1).slice(2)) : 'klub'}</span>${own && h.condition - 5 < M.HOMOL[hc].cond ? ` <span class="warn" title="Stan bliski minimum klasy ${hc} (${M.HOMOL[hc].cond}%) – po sezonie inspekcja może obniżyć klasę">⚠</span>` : ""}` : '<span class="warn small">brak</span>';
      const homolCls = best && (M.HOMOL_ORDER.indexOf(best) < (hc ? M.HOMOL_ORDER.indexOf(hc) : 99) || expiring) ? best : null;
      return `<tr><td><b>${esc(h.name)}</b><div class="small muted">${esc(h.city)}${h.club ? ' · 🏠 klubowa' : ''}</div></td><td>${typeName[h.type]}</td><td class="num">K-${h.K} / HS${h.HS}</td><td>${homolCell}</td>
        <td>${h.building ? '<span class="warn">w budowie</span>' : `${bar(h.condition)}<span class="small muted">${Math.round(h.condition)}%</span>`}</td>
        <td class="c">${h.igelit ? '✔' : '–'}</td><td class="c">${h.lights ? '✔' : '–'}</td><td class="num small">${h.club ? '<span class="muted" title="Utrzymują klub i gmina">klub</span>' : U.money(t.upkeep * M.costScale())}</td>
        <td>${h.building || busy ? '<span class="small muted">prace w toku</span>' : `
          ${homolCls ? `<button class="btn small ${hc ? '' : 'primary'}" data-act="homol" data-id="${h.id}" data-cls="${homolCls}" title="${esc(M.HOMOL[homolCls].use)} · ważna 5 sezonów">Homologacja ${homolCls} (${U.money(M.homolCost(homolCls))})</button>` : ''}
          <button class="btn small" data-act="modern" data-id="${h.id}" title="Przywraca stan 100%">Modernizuj (${U.money(modCost)})</button>
          ${!h.igelit && h.type !== 'flying' ? `<button class="btn small" data-act="igelit" data-id="${h.id}">Igelit (${U.money(Math.round(t.cost * 0.18))})</button>` : ''}
          ${!h.lights ? `<button class="btn small" data-act="lights" data-id="${h.id}">Oświetlenie (${U.money(Math.round(t.cost * 0.05))})</button>` : ''}
          ${h.club ? "" : `<button class="btn small danger" data-act="demolish" data-id="${h.id}">Zamknij</button>`}`}</td></tr>`;
    }).join('');
    const facs = Object.entries(SJM.FACILITIES).map(([k, f]) => {
      const lvl = p.facilities[k] || 0;
      const busy = p.projects.some((pr) => pr.kind === 'facility' && pr.target === k);
      const max = f.cost.length;
      return `<div class="card"><h2>${f.name}</h2><div class="small muted mb">${f.desc}</div>
        <div class="dots mb">${Array.from({ length: max }, (_, i) => `<i class="${i < lvl ? 'on' : busy && i === lvl ? 'pending' : ''}"></i>`).join('')} <span class="small">poziom ${lvl}/${max}</span></div>
        <div class="small muted">Utrzymanie: ${U.money(lvl * f.upkeep * M.costScale())} / rok</div>
        ${lvl >= max ? '<div class="pos small mt">Maksymalny poziom</div>' : busy ? '<div class="warn small mt">Rozbudowa w toku</div>' : `<button class="btn small primary mt" data-act="facility" data-key="${k}">Rozbuduj (${U.money(f.cost[lvl])})</button>`}</div>`;
    }).join('');
    // miasto z punktem K skoczni (w mieście może być kilka skoczni – widać, która gości zawody)
    const hillTag = (id) => { const h = W.getHill(id); return h ? `${h.city} (K-${h.K})` : '?'; };
    const bids = Object.entries(M.HOST_REQ).map(([lv, r]) => {
      // weekendy cykli: nasze obiekty w kalendarzu + do 3 kandydatur
      if (SJM.CAL.CYCLES[lv]) {
        const mineIn = SJM.CAL.myVenues(lv).map(hillTag);
        const list = (p.cycleBids || {})[lv] || [];
        const eligibleC = p.hills.filter((h) => !M.canHost(lv, h) && !list.includes(h.id) && !SJM.CAL.inCircuit(lv, h.id));
        const bidsHtml = list.map((id) => `<span class="chip">${esc(hillTag(id))} <a data-act="unbid" data-level="${lv}" data-hill="${id}" title="Wycofaj (opłata nie wraca)">✕</a></span>`).join('');
        const add = list.length >= M.MAX_CYCLE_BIDS ? '' : eligibleC.length ? `<select id="bid-${lv}">${eligibleC.map((h) => `<option value="${h.id}">${esc(h.name)} (${esc(h.city)})</option>`).join('')}</select> <button class="btn small" data-act="bid" data-level="${lv}">Zgłoś (${U.money(r.fee)})</button>` : '<span class="muted small">brak kolejnej skoczni spełniającej wymogi</span>';
        return `<tr><td><b>${r.label}</b><div class="small muted">min. K-${r.minK}, stan ≥ ${r.cond}%${r.lights ? ', oświetlenie' : ''}${r.igelit ? ', igelit' : ''} · 2. i 3. kandydatura ma mniejszą wagę (×0,7 / ×0,5)${lv === 'WC' ? ` · weekendy lotów w kalendarzu: ${SJM.CAL.flyingWeekends()} (min. ${SJM.CAL.FLY_MIN}, maks. ${SJM.CAL.FLY_MAX})` : ''}</div></td>
          <td>${mineIn.length ? `<span class="pos">W kalendarzu: ${esc(mineIn.join(', '))}</span>` : '<span class="muted">brak naszych weekendów</span>'}</td>
          <td>${bidsHtml}${bidsHtml && add ? '<br>' : ''}${add}<div class="small muted">${list.length}/${M.MAX_CYCLE_BIDS} kandydatur</div></td></tr>`;
      }
      const eligible = p.hills.filter((h) => !M.canHost(lv, h));
      const big = r.big ? (p.bigBids || {})[lv] : null;
      const cur = r.big ? big && big.hill : p.hostBids[lv];
      const ed = r.big ? SJM.CAL.openEdition(lv) : null;
      // wielkie imprezy: nasze przyznane edycje
      const ours = r.big ? Object.entries(SJM.CAL.hosts()[lv]).filter(([y, v]) => v.nat === s.nation && +y >= s.season + 1).map(([y, v]) => `${y}: ${[v.nh, v.lh, v.hill].filter(Boolean).map(hillTag).join(' + ')}`) : [];
      const hosted = r.big ? (ours.length ? ours.join(', ') : null) : p.hosted && p.hosted[lv] && `W tym sezonie: ${hillTag(p.hosted[lv])}`;
      const label = r.big ? `${r.label} ${big ? big.year : ed.year}` : r.label;
      return `<tr><td><b>${label}</b><div class="small muted">${r.maxK ? `K-${r.minK}–${r.maxK} (tylko normalna)` : `min. K-${r.minK}`}${r.needNH ? ' + skocznia normalna' : ''}, stan ≥ ${r.cond}%${r.lights ? ', oświetlenie' : ''}${r.igelit ? ', igelit' : ''} · szansa bazowa ${Math.round(r.chance * 100)}%${r.big ? ` · decyzja FIS po sezonie ${(big ? big.year : ed.year) - 5}/${String((big ? big.year : ed.year) - 4).slice(2)}` : ''}</div></td>
        <td>${hosted ? `<span class="pos">${r.big ? 'Przyznane: ' : ''}${esc(hosted)}</span>` : '<span class="muted">–</span>'}</td>
        <td>${cur ? `<span class="pos">Złożona: ${esc(W.getHill(cur).name)} (K-${W.getHill(cur).K})</span>` : eligible.length ? `<select id="bid-${lv}">${eligible.map((h) => `<option value="${h.id}">${esc(h.name)} (${esc(h.city)})</option>`).join('')}</select> <button class="btn small" data-act="bid" data-level="${lv}">Złóż (${U.money(r.fee)})</button>` : '<span class="muted small">brak skoczni spełniającej wymogi</span>'}</td></tr>`;
    }).join('');
    return `<h1>Infrastruktura</h1>
      <div class="card tight scroll mb"><h3>Skocznie w kraju</h3><table>
        <tr><th>Obiekt</th><th>Typ</th><th class="num">Rozmiar</th><th>Homologacja</th><th>Stan</th><th class="c">Igelit</th><th class="c">Światło</th><th class="num">Utrzymanie</th><th>Działania</th></tr>${hillRows}</table></div>
      <div class="card tight mb"><h3>Homologacja FIS</h3><table>
        <tr><th>Klasa</th><th>Pozwala na</th><th>Wymogi</th><th class="num">Koszt inspekcji</th></tr>
        ${M.HOMOL_ORDER.map((c) => { const r = M.HOMOL[c]; return `<tr><td><b>${c}</b></td><td class="small">${r.use}</td><td class="small">${r.minK ? 'K-' + r.minK + '+, ' : ''}stan ≥ ${r.cond}%${r.lights ? ', oświetlenie' : ''}</td><td class="num small">${U.money(M.homolCost(c))} · ${r.weeks} tyg.</td></tr>`; }).join('')}</table>
        <p class="small muted">Wyższa klasa obejmuje niższe. Certyfikat jest ważny 5 sezonów; po każdym sezonie inspekcja sprawdza stan techniczny – za słaby stan obniża klasę (modernizacja przed końcem sezonu temu zapobiega). Skocznia bez homologacji nie liczy się do treningu kadr i naboru dzieci. Obiekty klubowe mają zawsze co najmniej klasę D utrzymywaną przez klub. Wymogi konkretnych zawodów (np. igelit latem, oświetlenie w PŚ) obowiązują dodatkowo.</p></div>
      <div class="card mb"><h3>Budowa nowej skoczni</h3><div class="row">
        <select id="build-type">${Object.entries(SJM.HILL_TYPES).map(([k, t]) => `<option value="${k}">${t.name} – ${U.money(t.cost)} · ${t.weeks} tyg.</option>`).join('')}</select>
        <input type="text" id="build-city" list="build-sites" value="${esc(M.nextHillCity())}" placeholder="Miejscowość" maxlength="30">
        <datalist id="build-sites">${sites.hist.map((c) => `<option value="${esc(c)}">dawna skocznia</option>`).join('')}${sites.cities.map((c) => `<option value="${esc(c)}">miasto</option>`).join('')}</datalist>
        <button class="btn primary" data-act="build">Rozpocznij budowę</button></div>
        <p class="small muted">${sites.hist.length ? `Miejsca, gdzie kiedyś były skocznie: ${sites.hist.map(esc).join(', ')}.` : sites.cities.length ? 'Wykorzystano już wszystkie miejsca z historycznymi skoczniami – pozostają większe miasta.' : 'Wykorzystano już wszystkie miejsca z historycznymi skoczniami i większe miasta.'} Możesz też wpisać własną miejscowość.</p>
        <p class="small muted">Małe i średnie skocznie zwiększają nabór dzieci. Skocznie normalne i duże są potrzebne do treningu kadr i organizacji zawodów. Skocznia gigantyczna (K-135–169, 1,6 pkt/m) i mamut pozwalają organizować wielkie konkursy PŚ.</p></div>
      <h2>Ośrodki i zaplecze</h2><div class="grid g3 mb">${facs}</div>
      <div class="card tight mb"><h3>Kandydatury na organizację zawodów (decyzja FIS po sezonie)</h3><table><tr><th>Zawody</th><th>Status</th><th>Kandydatura</th></tr>${bids}</table><p class="small muted" style="padding:0 12px">Puchary (PŚ, LGP, PK, LPK, FIS Cup): do 3 kandydatur na cykl. Po sezonie FIS decyduje, którzy gospodarze utrzymują weekendy, a wolne terminy losuje spośród wszystkich kandydatur – naszych i innych krajów – według tych samych zasad (popularność skoków w kraju, tradycja obiektu, duża skocznia, kolejność kandydatury). Kandydatura nie gwarantuje terminu. Nasza skocznia traci weekend, jeśli przestanie spełniać wymogi. MŚJ: kandydatura na kolejny sezon. MŚ i MŚ w lotach: FIS wybiera gospodarza 4 lata przed imprezą. Gospodarza igrzysk wybiera MKOl – federacja nie ma na to wpływu (zakładka Kalendarz → Gospodarze imprez).</p></div>
      ${p.projects.length ? `<div class="card"><h3>Projekty w toku</h3>${p.projects.map((pr) => `<div class="row between small"><span>${esc(pr.label)}</span><span>${Math.max(0, Math.ceil(pr.weeksLeft))} tyg.</span></div><div class="progress mb"><i style="width:${(1 - pr.weeksLeft / pr.total) * 100}%"></i></div>`).join('')}</div>` : ''}`;
  };

  SCREENS.finance = () => {
    const s = st(), p = s.player;
    const inc = M.annualIncome(), cost = M.annualCosts();
    const names = { grant: 'Dotacja federacji/ministerstwa', sponsors: 'Sponsorzy', prizes: 'Premie od sponsorów za wyniki', hosting: 'Organizacja zawodów', salaries: 'Pensje sztabu', facilities: 'Utrzymanie ośrodków', hills: 'Utrzymanie skoczni', squad: 'Stypendia kadrowiczów', travel: 'Wyjazdy na zawody', investments: "Inwestycje i transfery", events: "Wydarzenia i decyzje" };
    const tbl = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<tr><td>${names[k] || k}</td><td class="num">${U.money(v)}</td></tr>`).join('') || '<tr><td class="muted">–</td></tr>';
    return `<h1>Finanse</h1>
      <div class="grid g3 mb">
        <div class="card"><h3>Stan konta</h3><div class="big ${p.budget < 0 ? 'neg' : ''}">${U.money(p.budget)}</div></div>
        <div class="card"><h3>Przychody roczne (prognoza)</h3><div class="kv small"><span class="k">Dotacja</span><span>${U.money(inc.grant)}</span><span class="k">Sponsorzy (popularność ${Math.round(p.popularity)})</span><span>${U.money(inc.sponsors)}</span><span class="k"><b>Razem</b></span><b class="pos">${U.money(inc.total)}</b></div></div>
        <div class="card"><h3>Koszty stałe roczne</h3><div class="kv small"><span class="k">Sztab</span><span>${U.money(cost.salaries)}</span><span class="k">Ośrodki</span><span>${U.money(cost.facilities)}</span><span class="k">Skocznie</span><span>${U.money(cost.hills)}</span><span class="k">Stypendia</span><span>${U.money(cost.squad)}</span><span class="k"><b>Razem</b></span><b class="neg">${U.money(cost.total)}</b></div></div>
      </div>
      <div class="grid g3">
        <div class="card tight"><h3>Wpływy w sezonie</h3><table>${tbl(p.seasonFinance.income)}</table></div>
        <div class="card tight"><h3>Wydatki w sezonie</h3><table>${tbl(p.seasonFinance.expense)}</table></div>
        <div class="card tight"><h3>Ostatnie operacje</h3><div class="tbl-wrap" style="max-height:420px"><table>${s.ledger.slice(0, 50).map((l) => `<tr><td class="small">${l.date ? U.shortDate(l.date) : ''}</td><td class="small">${esc(l.label)}</td><td class="num ${l.amount < 0 ? 'neg' : 'pos'}">${U.money(l.amount)}</td></tr>`).join('') || '<tr><td class="muted">–</td></tr>'}</table></div></div>
      </div>
      <p class="small muted">Popularność rośnie dzięki zwycięstwom, medalom i organizacji zawodów – a wraz z nią wpływy od sponsorów. Dotacja na kolejny rok zależy od oceny zarządu.</p>`;
  };

  // ---------- Kalendarz ----------
  const CAL_TABS = [
    ['all', 'Cały sezon', null],
    ['WC', 'Puchar Świata', ['WC']],
    ['SGP', 'Letnie Grand Prix', ['SGP']],
    ['COC', 'Puchar Kontynentalny', ['COC']],
    ['SCOC', 'Letni PK', ['SCOC']],
    ['FIS', 'FIS Cup (lato + zima)', ['FIS']],
    ['champs', 'Imprezy mistrzowskie', ['WCH', 'OWG', 'SFWC', 'WJC', 'NAT']],
    ['hosts', 'Gospodarze imprez', null],
  ];
  const HILL_TYPE_NAMES = { small: 'mała', medium: 'średnia', normal: 'normalna', large: 'duża', giant: 'gigantyczna', flying: 'mamut' };
  const WEEKDAYS = ['nd', 'pn', 'wt', 'śr', 'cz', 'pt', 'sb'];
  const TOUR_OFFSETS = { TCS: [0, 3, 5, 7] };

  // wszystkie konkursy sezonu z datą (kolejne konkursy w weekendzie w kolejnych dniach)
  function calendarEvents() {
    const s = st();
    const out = [];
    s.calendar.weeks.forEach((w, wi) => {
      const perLevel = {};
      w.events.forEach((e) => {
        const n = perLevel[e.level] = (perLevel[e.level] || 0) + 1;
        const off = e.tour === 'TCS' ? TOUR_OFFSETS.TCS[e.tourStage - 1] || 0 : Math.min(n - 1, 2);
        const d = new Date(w.date); d.setDate(d.getDate() + off);
        out.push({ e, wi, date: d, res: s.results[e.id] });
      });
    });
    return out;
  }
  function hillNation(hillId) { const h = W.getHill(hillId); return (h && h.nation) || M.hostNationOf(hillId) || st().nation; }
  function fmtDay(d) { return `${WEEKDAYS[d.getDay()]} ${U.shortDate(d)}`; }
  function winnerCell(r) {
    const s = st();
    if (!r || !r.ranking || !r.ranking[0]) return '<span class="muted">–</span>';
    if (r.type === 'ind') { const j = s.jumpers[r.ranking[0].id]; return j ? `${W.flag(j.nation)} ${jl(j)}` : '?'; }
    return `${W.flag(r.ranking[0].nat)} ${esc(W.nationData(r.ranking[0].nat).name)}`;
  }
  function ourBestCell(r) {
    const s = st();
    if (!r || !r.ranking) return '';
    if (r.type === 'ind') {
      const mine = r.ranking.filter((x) => x.nat === s.nation && x.rank).sort((a, b) => a.rank - b.rank);
      if (!mine.length) return r.ranking.some((x) => x.nat === s.nation) || (r.qual && r.qual.jumps.some((q) => s.jumpers[q.id] && s.jumpers[q.id].nation === s.nation)) ? '<span class="muted">poza klasyfikacją</span>' : '<span class="muted">bez startu</span>';
      const b = mine[0];
      return `${b.rank <= 3 ? medalIcon(b.rank) + ' ' : ''}<b>${b.rank}.</b> ${jl(s.jumpers[b.id])}${mine.length > 1 ? ` <span class="muted small">(+${mine.length - 1})</span>` : ''}`;
    }
    const my = r.ranking.find((x) => x.nat === s.nation);
    return my ? `${my.rank <= 3 ? medalIcon(my.rank) + ' ' : ''}<b>${my.rank}.</b> drużyna` : '<span class="muted">bez startu</span>';
  }

  function calendarTable(levels) {
    const s = st();
    const list = calendarEvents().filter((x) => levels.includes(x.e.level));
    if (!list.length) return '<div class="card empty">Brak zawodów w tym cyklu w bieżącym sezonie.</div>';
    const done = list.filter((x) => x.res);
    const myWins = done.filter((x) => x.res.ranking[0] && (x.res.type === 'ind' ? x.res.ranking[0].nat : x.res.ranking[0].nat) === s.nation).length;
    const myPod = done.filter((x) => x.res.ranking.some((r) => r.nat === s.nation && r.rank && r.rank <= 3)).length;
    const countries = new Set(list.map((x) => hillNation(x.e.hill)));
    let nr = 0;
    let lastPer = null;
    const rows = list.map((x) => {
      const { e, wi, date, res } = x;
      const per = s.calendar.weeks[wi].period ?? 1;
      const perRow = per !== lastPer ? `<tr class="perrow"><td colspan="9">${periodHeader(per)}</td></tr>` : "";
      lastPer = per;
      const h = W.getHill(e.hill);
      const nat = hillNation(e.hill);
      if (e.format === 'ind') nr++;
      const cur = wi === s.week, past = wi < s.week;
      const kind = e.format === 'team' ? 'drużynowy' : e.format === 'super' ? 'superteam' : 'indywidualny';
      const tour = e.tour ? `<span class="pill tour">${e.tour === 'TCS' ? 'TCS' : e.tour === 'RAW' ? 'Raw Air' : 'TN'} ${e.tourStage}</span> ` : '';
      const lvl = levels.length > 1 ? lvPill(e.level) + ' ' : '';
      const home = (nat === s.nation ? ' <span class="pill home" title="Zawody w naszym kraju">u nas</span>' : '') + (e.standIn ? ' <span class="pill" title="Stały gospodarz weekendu organizuje w tym sezonie imprezę mistrzowską">zastępstwo</span>' : '');
      return `${perRow}<tr class="${cur ? 'calcur' : past ? 'calpast' : ''}">
        <td class="num muted">${e.format === 'ind' ? nr : '–'}</td>
        <td>${fmtDay(date)}</td>
        <td>${W.flag(nat)} <span class="small muted">${nat}</span></td>
        <td><b>${esc(h.city)}</b>${home}</td>
        <td>${esc(h.name)}<div class="small muted">K-${h.K} · HS${h.HS} · ${HILL_TYPE_NAMES[W.hillType(h.K)]}</div></td>
        <td>${lvl}${tour}${e.title ? esc(e.title.replace(/^.*– /, '')) : kind}</td>
        <td>${res ? winnerCell(res) : cur ? '<span class="warn">w tym tygodniu</span>' : '<span class="muted">–</span>'}</td>
        <td>${res ? ourBestCell(res) : ''}</td>
        <td class="nowrap">${res ? `<button class="btn small" data-act="event" data-id="${e.id}">Wyniki</button> <button class="btn small" data-act="replay" data-id="${e.id}" title="Relacja">▶</button>` : ''}</td></tr>`;
    }).join('');
    return `<div class="grid g4 mb">
        <div class="card"><h3>Konkursy</h3><div class="big">${done.length}<span class="muted" style="font-size:16px"> / ${list.length}</span></div><div class="small muted">rozegrane</div></div>
        <div class="card"><h3>Kraje</h3><div class="row" style="gap:4px">${[...countries].map((c) => W.flag(c)).join('')}</div><div class="small muted mt">${countries.size} gospodarzy</div></div>
        <div class="card"><h3>Nasze zwycięstwa</h3><div class="big">${myWins}</div></div>
        <div class="card"><h3>Konkursy z naszym podium</h3><div class="big">${myPod}</div></div>
      </div>
      <div class="card tight scroll"><table class="caltable">
        <tr><th class="num">#</th><th>Data</th><th>Kraj</th><th>Miejscowość</th><th>Skocznia</th><th>Konkurs</th><th>Zwycięzca</th><th>Nasz najlepszy</th><th></th></tr>
        ${rows}</table></div>`;
  }

  function calendarAll() {
    const s = st();
    const perDiv = (w, i) => {
      const per = w.period ?? 1, prev = i ? s.calendar.weeks[i - 1].period ?? 1 : null;
      if (per === prev) return '';
      return `<div class="perioddiv">${prev === 0 ? 'Zima · okres kwotowy 1 (kwoty bez zmian)' : periodHeader(per) + (prev ? ' – przeliczenie kwot startowych' : '')}</div>`;
    };
    return `<div class="card tight">
      ${s.calendar.weeks.map((w, i) => `${perDiv(w, i)}<div class="weekrow ${i === s.week ? 'cur' : i < s.week ? 'past' : ''}"><div><b>${U.shortDate(w.date)}</b><div class="small muted">tydz. ${i + 1}</div></div>
        <div><div>${esc(w.label)}</div><div>${w.events.map((e) => { const r = s.results[e.id]; return `<span class="chip">${lvPill(e.level)} ${W.flag(hillNation(e.hill))} ${r ? `<a data-act="event" data-id="${e.id}">${esc(SJM.CAL.eventTitle(e))}</a>` : esc(SJM.CAL.eventTitle(e))}${r && r.ranking[0] ? ` <span class="muted">– ${r.type === 'ind' ? esc(W.fullName(s.jumpers[r.ranking[0].id] || { first: '?', last: '' })) : W.flag(r.ranking[0].nat)}</span>` : ''}</span>`; }).join('')}</div></div>
        <div>${i < s.week && w.events.length ? `<button class="btn small" data-act="week" data-i="${i}">Wyniki</button>` : ''}</div></div>`).join('')}</div>`;
  }

  // gospodarze najbliższych wielkich imprez: IO jako kraj, imprezy FIS jako miasto ze skoczniami
  function hostsTable() {
    const s = st(), p = s.player, E = s.season + 1, C = SJM.CAL;
    const seasonLbl = (y) => `${y - 1}/${String(y).slice(2)}`;
    const hillTxt = (id) => { const h = W.getHill(id); return h ? `${esc(h.name)} <span class="muted">K-${h.K} · HS${h.HS}</span>` : '?'; };
    const home = (nat) => (nat === s.nation ? ' <span class="pill home">u nas</span>' : '');
    const rows = C.upcoming().map(({ kind, year, host }) => {
      const name = C.BIG_NAMES[kind];
      let where, hills, status;
      if (host) {
        const lh = W.getHill(host.lh || host.hill);
        where = kind === 'OWG' ? `${W.flag(host.nat)} <b>${esc(W.nationData(host.nat).name)}</b>${home(host.nat)}<div class="small muted">skoki: ${esc(lh.city)}</div>`
          : `${W.flag(host.nat)} <b>${esc(lh.city)}</b>${home(host.nat)}`;
        hills = kind === 'SFWC' ? hillTxt(host.hill) : `${hillTxt(host.nh)}<br>${hillTxt(host.lh)}`;
        const fresh = [host.nh, host.lh].filter((id) => id && /^oly/.test(id)).length;
        status = year === E ? '<span class="warn">w tym sezonie</span>' : `<span class="pos">ogłoszony</span>${fresh ? `<div class="small muted">${fresh === 2 ? 'nowy kompleks skoczni w budowie' : 'nowa skocznia w budowie'}</div>` : ''}`;
      } else {
        where = '<span class="muted">nieznany</span>'; hills = '';
        if (kind === 'OWG') status = `MKOl ogłosi gospodarza po IO ${year - 4}`;
        else {
          const ed = C.openEdition(kind), bid = (p.bigBids || {})[kind];
          status = `decyzja FIS po sezonie ${seasonLbl(Math.max(E, year - 4))}`;
          if (bid && bid.year === year) status += `<div class="small pos">nasza kandydatura: ${esc(W.getHill(bid.hill).city)}</div>`;
          else if (ed.year === year) status += `<div class="small muted">można kandydować (Infrastruktura)</div>`;
        }
      }
      return `<tr class="${host && host.nat === s.nation ? 'mine' : ''}"><td>${lvPill(kind)} ${name}</td><td><b>${year}</b><div class="small muted">sezon ${seasonLbl(year)}</div></td><td>${where}</td><td class="small">${hills}</td><td class="small">${status}</td></tr>`;
    });
    // MŚ Juniorów: bieżący sezon z kalendarza, kolejny z rotacji (lub nasza kandydatura)
    const cur = s.calendar.weeks.flatMap((w) => w.events).find((e) => e.level === 'WJC');
    const wjc = [[E, cur ? cur.hill : C.wjcHost(E), 'w tym sezonie'], [E + 1, C.wjcHost(E + 1), p.hostBids.WJC ? `rotacja FIS; nasza kandydatura: ${esc(W.getHill(p.hostBids.WJC).city)}` : 'rotacja FIS (można kandydować)']];
    wjc.forEach(([y, hill, st2]) => { const h = W.getHill(hill), nat = M.hostNationOf(hill); rows.push(`<tr class="${nat === s.nation ? 'mine' : ''}"><td>${lvPill('WJC')} MŚ Juniorów</td><td><b>${y}</b><div class="small muted">sezon ${seasonLbl(y)}</div></td><td>${W.flag(nat)} <b>${esc(h.city)}</b>${home(nat)}</td><td class="small">${hillTxt(hill)}</td><td class="small">${st2}</td></tr>`); });
    return `<div class="card tight scroll"><table><tr><th>Impreza</th><th>Rok</th><th>Gospodarz</th><th>Skocznie</th><th>Status</th></tr>${rows.join('')}</table>
      <p class="small muted" style="padding:0 12px">Gospodarza igrzysk wybiera MKOl i ogłasza go po poprzednich igrzyskach – federacja nie ma na to wpływu. Jeśli igrzyska trafią do naszego kraju, państwo zwiększa dotację i w razie potrzeby buduje skocznie olimpijskie. Na Mistrzostwa Świata i MŚ w lotach można kandydować w zakładce Infrastruktura – FIS wybiera gospodarza 4 lata przed imprezą.</p></div>`;
  }

  SCREENS.calendar = () => {
    const s = st();
    const tab = params.tab || 'all';
    const evs = calendarEvents();
    const tabs = CAL_TABS.map(([k, l, lv]) => {
      const n = k === 'hosts' ? '' : lv ? evs.filter((x) => lv.includes(x.e.level)).length : evs.length;
      return `<button class="${tab === k ? 'active' : ''}" data-act="tab" data-tab="${k}">${l} <span class="muted small">${n}</span></button>`;
    }).join('');
    const def = CAL_TABS.find((t) => t[0] === tab) || CAL_TABS[0];
    return `<h1>Kalendarz sezonu ${s.season}/${String(s.season + 1).slice(2)}</h1>
      <div class="tabs">${tabs}</div>
      ${tab === 'hosts' ? hostsTable() : def[2] ? calendarTable(def[2]) : calendarAll()}`;
  };

  function standingTable(obj, extra, mark) {
    const s = st();
    const rows = Object.entries(obj).sort((a, b) => b[1] - a[1]);
    if (!rows.length) return '<div class="empty">Brak danych</div>';
    const lead = rows[0][1];
    return `<div class="tbl-wrap"><table><tr><th class="num">#</th><th>Zawodnik</th><th>Kraj</th><th class="num">Punkty</th><th class="num">Strata</th>${extra ? '<th class="num">Konkursy</th>' : ''}</tr>
      ${rows.slice(0, 100).map(([id, pts], i) => { const j = s.jumpers[id]; return `<tr class="${j && j.nation === s.nation ? 'mine' : ''}"><td class="num">${i + 1}.</td><td>${j ? jl(j) : 'emeryt'}${mark ? mark(id) : ''}</td><td>${j ? natl(j.nation) : ''}</td><td class="num"><b>${U.fmt1(pts).replace('.0', '')}</b></td><td class="num muted">${i ? '-' + U.fmt1(lead - pts).replace('.0', '') : ''}</td>${extra ? `<td class="num">${extra[id] || 0}</td>` : ''}</tr>`; }).join('')}</table></div>`;
  }

  // podzakładki PK / FIS Cup: klasyfikacja generalna i klasyfikacje okresów kwotowych (premie za top 3 okresu)
  function periodStandings(tab, general) {
    const s = st(), cup = tab === 'coc' ? 'COC' : 'FIS';
    const per = M.currentPeriod(), summer = M.hasSummer();
    const periods = (summer ? [0, 1, 2, 3] : [1, 2, 3]);
    const sub = params.sub !== undefined && periods.includes(+params.sub) ? +params.sub : 'all';
    const pName = (p) => p === 0 ? (cup === 'COC' ? 'Lato (LPK)' : 'Lato') : 'Okres ' + p;
    const subs = `<div class="tabs" style="padding:8px 12px 0"><button class="${sub === 'all' ? 'active' : ''}" data-act="sub" data-sub="all">${general}</button>${periods.map((p) => `<button class="${sub === p ? 'active' : ''}" data-act="sub" data-sub="${p}">${pName(p)}${p === per ? ' •' : ''}</button>`).join('')}</div>`;
    if (sub === 'all') return subs + standingTable(s.standings[tab] || {}) + (tab === 'fis' ? `<p class="small muted" style="padding:0 12px">Klasyfikacja łączna: punkty z letnich i zimowych konkursów FIS Cup.</p>` : '');
    const pts = {};
    for (const j of Object.values(s.jumpers)) { const x = ((j.pp && j.pp[cup]) || [])[sub]; if (x > 0) pts[j.id] = x; }
    // okres zakończony – przyznane premie, trwający – prognoza
    const log = s.periodBonusLog && s.periodBonusLog.season === s.season ? s.periodBonusLog[sub] : null;
    const done = sub < per;
    const bon = done ? (log ? log[cup] : null) : sub === per ? M.periodBonusPreview(cup, sub) : null;
    const prize = cup === 'COC' ? '+1 do kwoty PŚ' : '+1 do kwoty PK';
    const next = sub === 3 ? 'lato następnego sezonu' : sub === 0 ? 'okres 1' : 'okres ' + (sub + 1);
    const state = done ? (bon ? 'Premie przyznane' : 'Okres zakończony') : sub === per ? 'Trwa – prognoza premii przy obecnych kwotach' : 'Okres jeszcze się nie rozpoczął';
    const ids = new Set((bon || []).map((b) => b.id));
    const body = standingTable(pts, null, (id) => ids.has(id) ? ` <span class="pill home" title="${done ? 'Premia' : 'Prognoza premii'} za klasyfikację okresu">${done ? '' : '≈ '}${prize}</span>` : '');
    const why = cup === 'COC' ? `Top ${M.QUOTA_RULES.periodTop} klasyfikacji okresu PK daje krajowi ${prize} (maks. 1 na kraj); gdy kraj ma już premię albo kwotę ${M.QUOTA_RULES.maxWC}, miejsce przechodzi na kolejnego zawodnika.` : `Top ${M.QUOTA_RULES.periodTop} klasyfikacji okresu FIS Cup daje krajowi ${prize} (do maks. ${M.QUOTA_RULES.maxCOC}); gdy kraj ma już maksymalną kwotę, miejsce przechodzi na kolejnego zawodnika.`;
    return subs + `<div class="small" style="padding:8px 12px"><b>${pName(sub)}</b> · ${state}. Premia obowiązuje tylko w: ${next}.<div class="muted">${why} Liczą się tylko punkty z tego okresu.</div></div>` + body;
  }

  SCREENS.standings = () => {
    const s = st();
    const tab = params.tab || 'wc';
    const tabs = [['wc', 'Puchar Świata'], ['nc', 'Puchar Narodów'], ['tcs', 'Turniej Czterech Skoczni'], ['raw', SJM.CAL.nordicName() || 'Raw Air / TN'], ['flying', 'Loty'], ['sgp', 'Letnie Grand Prix'], ['snc', 'Puchar Narodów LGP'], ['coc', 'Puchar Kontynentalny'], ['scoc', 'Letni PK'], ['fis', 'FIS Cup (lato + zima)'], ['medals', 'Medale'], ['quota', 'Kwoty startowe']];
    let body = '';
    if (tab === 'nc') {
      const order = M.ncOrder();
      body = `<table><tr><th class="num">#</th><th>Kraj</th><th class="num">Punkty</th><th class="num">Kwota PŚ</th></tr>${order.map((c, i) => `<tr class="${c === s.nation ? 'mine' : ''}"><td class="num">${i + 1}.</td><td>${natl(c)}${s.dormant && s.dormant[c] ? ` <span class="small muted" title="Nowa reprezentacja: ${esc(s.dormant[c].reason)}">🌱 od ${s.dormant[c].joined}/${String(s.dormant[c].joined + 1).slice(2)}</span>` : ""}</td><td class="num"><b>${s.standings.nc[c] || 0}</b></td><td class="num">${s.nations[c].quota.WC}</td></tr>`).join('')}</table>`;
    } else if (tab === 'snc') {
      const snc = s.standings.snc || {};
      const order = Object.keys(snc).sort((a, b) => snc[b] - snc[a]);
      body = order.length ? `<table><tr><th class="num">#</th><th>Kraj</th><th class="num">Punkty</th></tr>${order.map((c, i) => `<tr class="${c === s.nation ? 'mine' : ''}"><td class="num">${i + 1}.</td><td>${natl(c)}</td><td class="num"><b>${snc[c]}</b></td></tr>`).join('')}</table>
        <p class="small muted" style="padding:0 12px">Punkty LGP wszystkich zawodników kraju oraz punkty za konkursy drużynowe LGP (top 8).</p>` : '<div class="empty">Brak punktów</div>';
    } else if (tab === 'tcs' || tab === 'raw') {
      body = standingTable(s.standings[tab], s.standings[tab + 'N']) + `<p class="small muted" style="padding:0 12px">Suma punktów (nie punktów PŚ) ze wszystkich konkursów cyklu. Klasyfikowani są tylko zawodnicy, którzy wystąpili we wszystkich.</p>`;
      if (tab === 'raw' && !SJM.CAL.nordicName()) body = '<div class="empty">W tym sezonie nie ma turnieju nordyckiego – Raw Air (3 kolejne weekendy PŚ w Norwegii) albo Turniej Nordycki (3 kolejne weekendy w Norwegii, Finlandii lub Szwecji) powstaje tylko, gdy tak ułoży się kalendarz.</div>';
    } else if (tab === 'medals') {
      const all = Object.entries(s.medalTable).sort((a, b) => b[1].g - a[1].g || b[1].s - a[1].s || b[1].b - a[1].b);
      body = `<div class="grid g2" style="padding:12px"><div><h3>Medale w tym sezonie</h3>${s.seasonMedals.length ? `<table>${s.seasonMedals.map((m) => `<tr class="${m.nat === s.nation ? 'mine' : ''}"><td>${medalIcon(m.place)}</td><td class="small">${esc(m.event)}</td><td>${W.flag(m.nat)} ${esc(m.names.join(', '))}</td></tr>`).join('')}</table>` : '<div class="empty">Brak</div>'}</div>
        <div><h3>Klasyfikacja medalowa (od startu gry)</h3>${all.length ? `<table><tr><th>Kraj</th><th class="c">${medalIcon(1)}</th><th class="c">${medalIcon(2)}</th><th class="c">${medalIcon(3)}</th></tr>${all.map(([c, m]) => `<tr class="${c === s.nation ? 'mine' : ''}"><td>${natl(c)}</td><td class="c">${m.g}</td><td class="c">${m.s}</td><td class="c">${m.b}</td></tr>`).join('')}</table>` : '<div class="empty">Brak</div>'}</div></div>`;
    } else if (tab === 'quota') {
      body = quotaTable();
    } else if (tab === 'coc' || tab === 'fis') {
      body = periodStandings(tab, tab === 'coc' ? 'Generalna' : 'Łączna');
    } else {
      body = standingTable(s.standings[tab] || {});
      if (tab === 'fis') body += `<p class="small muted" style="padding:0 12px">Klasyfikacja łączna: punkty z letnich i zimowych konkursów FIS Cup.</p>`;
    }
    return `<h1>Klasyfikacje</h1><div class="tabs">${tabs.map(([k, l]) => `<button class="${tab === k ? 'active' : ''}" data-act="tab" data-tab="${k}">${l}</button>`).join('')}</div><div class="card tight">${body}</div>`;
  };

  function jumpCell(x) {
    if (!x) return '<td></td><td></td>';
    if (x.x) return `<td class="num neg">DSQ</td><td></td>`;
    return `<td class="num">${U.fmt1(x.d).replace('.0', '')} m${x.f ? ' <span class="neg" title="upadek">⚠</span>' : ''}</td><td class="num muted">${U.fmt1(x.p)}</td>`;
  }

  SCREENS.event = ({ id }) => {
    const s = st();
    const ev = s.calendar.weeks.flatMap((w) => w.events).find((e) => e.id === id);
    const r = s.results[id];
    if (!ev || !r) return '<div class="empty">Brak wyników</div>';
    const hill = W.getHill(ev.hill);
    let body = '';
    if (r.type === 'ind') {
      const nR = Math.max(2, r.rounds.length), RN = ["I", "II", "III", "IV", "V"];
      body = `<table><tr><th class="num">Msc</th><th>Zawodnik</th><th>Kraj</th>${RN.slice(0, nR).map((x) => `<th class="num">${x} seria</th><th class="num">pkt</th>`).join("")}<th class="num">Nota</th></tr>
        ${r.ranking.map((row) => { const j = s.jumpers[row.id]; return `<tr class="${row.nat === s.nation ? 'mine' : ''}"><td class="num">${row.rank ? row.rank <= 3 ? medalIcon(row.rank) : row.rank + '.' : 'DSQ'}</td><td>${jl(j)}</td><td>${W.flag(row.nat)} ${row.nat}</td>${Array.from({ length: nR }, (_, k) => jumpCell(row.j[k])).join("")}<td class="num"><b>${row.dsq ? '–' : U.fmt1(row.total)}</b></td></tr>`; }).join('')}</table>`;
      if (r.qual) {
        const failed = r.qual.jumps.filter((q) => !q.q);
        body += `<h3 style="padding:12px 12px 0">Odpadli w kwalifikacjach</h3><table>${failed.map((q) => { const j = s.jumpers[q.id]; return `<tr class="${j && j.nation === s.nation ? 'mine' : ''}"><td class="num">${q.rank}.</td><td>${j ? jlf(j) : ''}</td>${jumpCell(q)}</tr>`; }).join('')}</table>`;
      }
    } else {
      body = `<table><tr><th class="num">Msc</th><th>Drużyna</th><th>Skład (${['I', 'II', 'III'].slice(0, r.rounds.length).join(' / ')} seria)</th><th class="num">Nota</th></tr>
        ${r.ranking.map((row) => `<tr class="${row.nat === s.nation ? 'mine' : ''}"><td class="num">${row.rank <= 3 ? medalIcon(row.rank) : row.rank + '.'}</td><td>${natl(row.nat)}</td>
          <td class="small">${row.members.map((mid, k) => { const js = row.j.filter((x) => x.id === mid); return `${jl(s.jumpers[mid])} <span class="muted">${js.map((x) => x.x ? 'DSQ' : U.fmt1(x.d).replace('.0', '') + 'm').join(' / ')}</span>`; }).join('<br>')}</td>
          <td class="num"><b>${U.fmt1(row.total)}</b></td></tr>`).join('')}</table>`;
    }
    return `<div class="row between mb"><div><h1 style="margin:0">${esc(SJM.CAL.eventTitle(ev))}</h1><div class="muted">${esc(hill.name)}, ${esc(hill.city)} · K-${hill.K} / HS${hill.HS} · belka: ${r.rounds.map((x) => { const low = Math.min(x.gate, ...x.jumps.map((jj) => jj.g || x.gate)); return low < x.gate ? `${x.gate}→${low}` : x.gate; }).join(' / ')}</div>${r.note ? `<div class="small warn">🌬️ ${esc(r.note)}</div>` : ''}</div>
      <div class="row"><button class="btn primary" data-act="replay" data-id="${id}">▶ Relacja na żywo</button><button class="btn" data-act="nav" data-screen="calendar">Kalendarz</button></div></div>
      <div class="card tight scroll">${body}</div>`;
  };

  SCREENS.week = ({ i }) => {
    const s = st();
    const w = s.calendar.weeks[i];
    if (!w) return '';
    const cards = w.events.map((e) => {
      const r = s.results[e.id];
      if (!r || !r.ranking.length) return `<div class="card"><h2>${esc(SJM.CAL.eventTitle(e))}</h2><div class="muted">Konkurs nie odbył się.</div></div>`;
      let pod = '', mine = '';
      if (r.type === 'ind') {
        pod = r.ranking.filter((x) => x.rank && x.rank <= 3).map((x) => `<div>${medalIcon(x.rank)} ${jlf(s.jumpers[x.id])} <span class="muted small">${U.fmt1(x.total)}</span></div>`).join('');
        const my = r.ranking.filter((x) => x.nat === s.nation);
        mine = my.map((x) => `<span class="chip">${x.rank ? x.rank + '.' : 'DSQ'} ${jl(s.jumpers[x.id])}</span>`).join('');
        if (r.qual) mine += r.qual.jumps.filter((q) => !q.q && s.jumpers[q.id] && s.jumpers[q.id].nation === s.nation).map((q) => `<span class="chip muted">kw. ${jl(s.jumpers[q.id])}</span>`).join('');
      } else {
        pod = r.ranking.slice(0, 3).map((x) => `<div>${medalIcon(x.rank)} ${natl(x.nat)} <span class="muted small">${U.fmt1(x.total)}</span></div>`).join('');
        const my = r.ranking.find((x) => x.nat === s.nation);
        if (my) mine = `<span class="chip">${my.rank}. miejsce</span>`;
      }
      return `<div class="card"><div class="row between">${lvPill(e.level)}<span class="small muted">HS${W.getHill(e.hill).HS}</span></div><h2 class="mt">${esc(SJM.CAL.eventTitle(e))}</h2>${pod}
        ${mine ? `<div class="mt small muted">Nasi:</div><div>${mine}</div>` : ''}
        <div class="row mt"><button class="btn small primary" data-act="replay" data-id="${e.id}">▶ Relacja</button><button class="btn small" data-act="event" data-id="${e.id}">Pełne wyniki</button></div></div>`;
    }).join('');
    return `<h1>Wyniki: ${esc(w.label)}</h1><div class="grid g3">${cards}</div>`;
  };

  SCREENS.world = () => {
    const s = st();
    const order = M.ncOrder();
    return `<h1>Świat skoków</h1><div class="card tight scroll"><table>
      <tr><th class="num">PN</th><th>Kraj</th><th class="num">Zawodników</th><th>Najlepsi</th><th class="num">Śr. ocena top 6</th><th class="num">Kwota PŚ</th><th>Trener kadry A</th></tr>
      ${order.map((c, i) => { const js = M.jumpersOf(c).sort((a, b) => W.overall(b) - W.overall(a)); const top6 = js.slice(0, 6); const hc = nationStaff(c).coachA; return `<tr class="${c === s.nation ? 'mine' : ''}"><td class="num">${i + 1}.</td><td>${natl(c)}${s.dormant && s.dormant[c] ? ` <span class="small muted" title="Nowa reprezentacja: ${esc(s.dormant[c].reason)}">🌱 od ${s.dormant[c].joined}/${String(s.dormant[c].joined + 1).slice(2)}</span>` : ""}</td><td class="num">${js.length}</td><td class="small">${js.slice(0, 3).map((j) => `${jl(j)} ${ovr(W.overall(j))}`).join(' · ')}</td><td class="num">${U.fmt1(U.sum(top6, W.overall) / Math.max(1, top6.length))}</td><td class="num">${s.nations[c].quota.WC}</td><td class="small">${hc ? `${W.flag(hc.nation)} ${esc(hc.first + ' ' + hc.last)} ${ovr(hc.quality)}` : '<span class="neg">wakat</span>'}</td></tr>`; }).join('')}
    </table></div>`;
  };

  SCREENS.nation = ({ code }) => {
    const s = st();
    const n = W.nationData(code);
    let list = M.jumpersOf(code);
    list = applySort('nation', list, { name: (j) => j.last, age: (j) => W.age(j), ovr: (j) => W.overall(j), wc: (j) => s.standings.wc[j.id] || 0, form: (j) => j.form }, { key: 'ovr', dir: -1 });
    const prof = W.profile(code);
    const hc = nationStaff(code).coachA;
    const headCoach = hc ? hc.first + ' ' + hc.last : '';
    return `<div class="row between mb"><h1 style="margin:0">${W.flag(code)} ${esc(n.name)}</h1><button class="btn" data-act="nav" data-screen="world">← Świat</button></div>
      <div class="grid g4 mb"><div class="card"><h3>Puchar Narodów</h3><div class="big">${M.ncOrder().indexOf(code) + 1}.</div></div><div class="card"><h3>Kwota PŚ</h3><div class="big">${s.nations[code].quota.WC}</div></div>
      <div class="card"><h3>Trener główny</h3><div class="big">${Math.round(prof.coachA)}</div>${headCoach ? `<div class="small muted">${esc(headCoach)}</div>` : ''}</div><div class="card"><h3>Medale (gra)</h3><div class="big">${s.medalTable[code] ? `${s.medalTable[code].g}/${s.medalTable[code].s}/${s.medalTable[code].b}` : '0'}</div></div></div>
      <div class="tabs"><button class="${params.tab !== 'hills' && params.tab !== 'staff' ? 'active' : ''}" data-act="tab" data-tab="jumpers">Zawodnicy</button><button class="${params.tab === 'staff' ? 'active' : ''}" data-act="tab" data-tab="staff">Sztab</button><button class="${params.tab === 'hills' ? 'active' : ''}" data-act="tab" data-tab="hills">Skocznie</button></div>
      ${params.tab === 'hills' ? nationHills(code) : params.tab === 'staff' ? nationStaffView(code) : `<div class="card tight scroll"><table><tr>${sortTh('nation', 'name', 'Zawodnik')}${sortTh('nation', 'age', 'Wiek', 'c')}${sortTh('nation', 'ovr', 'Ocena', 'c')}${SJM.ATTRS.map((a) => `<th class="c">${a.short}</th>`).join('')}${sortTh('nation', 'form', 'Forma', 'c')}<th>Status</th>${sortTh('nation', 'wc', 'PŚ', 'num')}</tr>
      ${list.map((j) => `<tr><td>${jl(j)} ${SJM.T.badges(j, false)}</td><td class="c">${W.age(j)}</td><td class="c">${ovr(W.overall(j))}</td>${SJM.ATTRS.map((a) => `<td class="c">${attr(j.attrs[a.key])}</td>`).join('')}<td class="c">${formStr(j.form)}</td><td>${status(j)}</td><td class="num">${s.standings.wc[j.id] || ''}</td></tr>`).join('')}</table></div>`}`;
  };

  function nationStaff(code) {
    const s = st();
    return (code === s.nation ? s.player.staff : s.nations[code].staff) || {};
  }

  // sztab kraju i kronika zmian
  function nationStaffView(code) {
    const s = st(), staff = nationStaff(code), log = s.nations[code].staffLog || [];
    const spec = (x) => x.spec ? SJM.ATTRS.find((a) => a.key === x.spec).name : '–';
    return `<div class="card tight mb"><table>
        <tr><th>Funkcja</th><th>Osoba</th><th class="c">Wiek</th><th class="c">Jakość</th><th>Specjalność</th><th class="c">W kadrze od</th></tr>
        ${Object.entries(SJM.STAFF_ROLES).map(([r, info]) => { const x = staff[r]; return `<tr><td><b>${info.name}</b></td>
          <td>${x ? `${W.flag(x.nation)} ${esc(x.first + ' ' + x.last)}${x.exJumper ? ' <span class="small muted">🎿 były skoczek</span>' : ''}` : '<span class="neg">wakat</span>'}</td>
          <td class="c">${x ? x.age : ''}</td><td class="c">${x ? staffQ(x) : ''}</td><td>${x ? spec(x) : ''}</td><td class="c">${x && x.since ? x.since + '/' + String(x.since + 1).slice(2) : ''}</td></tr>`; }).join('')}
      </table></div>
      <div class="card tight"><h3>Zmiany w sztabie</h3>${log.length ? log.map((e) => `<div class="small mb"><span class="muted">${e.season}/${String(e.season + 1).slice(2)}:</span> ${esc(e.text)}</div>`).join('') : '<div class="empty">Brak zmian od początku gry.</div>'}</div>`;
  }

  // skocznie kraju i zawody na nich w bieżącym sezonie
  function nationHills(code) {
    const s = st();
    const hills = code === s.nation ? s.player.hills : SJM.HILLS.concat(s.extraHills || []).filter((h) => h.nation === code);
    if (!hills.length) return '<div class="card empty">Brak skoczni o randze FIS – kraj trenuje na małych obiektach.</div>';
    const evs = calendarEvents();
    return `<div class="card tight scroll"><table><tr><th>Obiekt</th><th>Miejscowość</th><th class="num">K</th><th class="num">HS</th><th>Typ</th><th>Zawody w tym sezonie</th></tr>
      ${hills.slice().sort((a, b) => b.K - a.K).map((h) => { const here = evs.filter((x) => x.e.hill === h.id); return `<tr><td>${esc(h.name)}</td><td>${esc(h.city)}</td><td class="num">${h.K}</td><td class="num">${h.HS}</td><td>${HILL_TYPE_NAMES[W.hillType(h.K)]}</td><td class="small">${here.length ? [...new Set(here.map((x) => x.e.level))].map((lv) => `${lvPill(lv)} ${here.filter((x) => x.e.level === lv).length}×`).join(' ') : '<span class="muted">–</span>'}</td></tr>`; }).join('')}</table></div>`;
  }

  SCREENS.history = () => {
    const s = st();
    const seasons = s.history.slice().reverse();
    const legends = s.retired.filter((r) => r.wins || r.medals.g + r.medals.s + r.medals.b).sort((a, b) => b.wins - a.wins).slice(0, 30);
    const champ = (list) => list && list[0] ? `${W.flag(list[0].nat)} ${esc(list[0].name)}` : '–';
    return `<h1>Historia</h1>
      <div class="card tight scroll mb"><h3>Sezony</h3>${seasons.length ? `<table><tr><th>Sezon</th><th>Kryształowa Kula</th><th>Puchar Narodów</th><th>TCS</th><th>Raw Air / TN</th><th>PK</th><th>FIS Cup</th><th>LGP</th><th>PN LGP</th><th>LPK</th><th>Nasz kraj (PN / cel)</th><th class="c">Nasze medale</th><th class="c">Zarząd</th></tr>
        ${seasons.map((h) => `<tr><td><b>${h.label}</b></td><td>${champ(h.wc)}</td><td>${h.nc[0] ? natl(h.nc[0].nat) : '–'}</td><td>${champ(h.tcs)}</td><td>${champ(h.raw)}${h.raw[0] && h.rawName === 'Turniej Nordycki' ? ' <span class="muted small">(TN)</span>' : ''}</td><td>${champ(h.coc)}</td><td>${champ(h.fis)}</td><td>${champ(h.sgp)}</td><td>${h.snc && h.snc[0] ? natl(h.snc[0].nat) : '–'}</td><td>${champ(h.scoc)}</td>
        <td class="${h.player.ncRank <= h.player.target ? 'pos' : 'neg'}">${h.player.ncRank}. / ${h.player.target}.</td><td class="c">${h.player.medals}</td><td class="c">${h.player.board}</td></tr>`).join('')}</table>` : '<div class="empty">Historia pojawi się po zakończeniu pierwszego sezonu.</div>'}</div>
      ${seasons.map((h) => h.medals.length ? `<div class="card tight mb"><h3>Imprezy mistrzowskie ${h.label}</h3><table>${h.medals.map((m) => `<tr class="${m.nat === s.nation ? 'mine' : ''}"><td>${medalIcon(m.place)}</td><td class="small">${esc(m.event)}</td><td>${W.flag(m.nat)} ${esc(m.names.join(', '))}</td></tr>`).join('')}</table></div>` : '').join('')}
      ${legends.length ? `<div class="card tight"><h3>Legendy na emeryturze</h3><table><tr><th>Zawodnik</th><th class="num">Wygrane PŚ</th><th class="num">Podia</th><th class="c">Medale</th><th class="num">Kule</th><th class="num">Koniec kariery</th></tr>${legends.map((r) => `<tr class="${r.nat === s.nation ? 'mine' : ''}"><td>${W.flag(r.nat)} ${esc(r.name)}</td><td class="num">${r.wins}</td><td class="num">${r.podiums}</td><td class="c">${r.medals.g}/${r.medals.s}/${r.medals.b}</td><td class="num">${r.globes}</td><td class="num">${r.retired}</td></tr>`).join('')}</table></div>` : ''}`;
  };

  // klucz zawodnika w statystykach: prawdziwi łączeni z historią po imieniu i nazwisku, fikcyjni po id (zbieżność nazwisk z legendą)
  function statKey(name, id) { const j = id && st().jumpers[id]; return j && !j.real ? 'id:' + id : W.normName(name); }

  // wszech czasów: prawdziwa historia PŚ (do sezonu 2025/26) + wyniki z gry; zawodnicy łączeni po imieniu i nazwisku
  function allTimeStats() {
    const s = st(), rows = new Map();
    const SUCC = SJM.REAL_PODIUM_SUCC || {}, HIST = SJM.REAL_PODIUM_HIST || {};
    const row = (name, nat, k = W.normName(name)) => {
      let r = rows.get(k);
      if (!r) rows.set(k, (r = { name, nat, wins: 0, podiums: 0, ov: [0, 0, 0], status: 'retired' }));
      return r;
    };
    for (const p of SJM.REAL_PODIUMS || []) { const r = row(p[0], p[5] || SUCC[p[1]] || p[1]); r.hist = HIST[p[1]]; r.wins = p[2]; r.podiums = p[2] + p[3] + p[4]; }
    for (const o of SJM.REAL_OVERALL || []) { const r = row(o[0], SUCC[o[1]] || o[1]); if (!r.hist) r.hist = HIST[o[1]]; r.ov = [o[2], o[3], o[4]]; }
    // kariery z gry zawierają już prawdziwe podia (prawdziwa baza), więc zastępują liczby z historii
    for (const x of s.retired) if (x.podiums) { const r = row(x.name, x.nat, x.real === false ? 'ret:' + x.name + x.born : undefined); r.nat = x.nat; r.hist = null; r.wins = x.wins; r.podiums = x.podiums; }
    for (const j of Object.values(s.jumpers)) {
      const r = row(W.fullName(j), j.nation, statKey(W.fullName(j), j.id));
      r.nat = j.nation; r.hist = null; r.j = j; r.status = 'active'; r.wins = j.career.wins; r.podiums = j.career.podiums;
    }
    // podia klasyfikacji generalnej w sezonach rozegranych w grze
    for (const h of s.history) h.wc.slice(0, 3).forEach((x, i) => { if (x && x.name !== '?') row(x.name, x.nat, statKey(x.name, x.id)).ov[i]++; });
    return [...rows.values()];
  }

  // imprezy i turnieje poza PŚ: [klucz, nazwa zakładki, opis źródła]
  const STAT_COMPS = [
    ['WC', 'Puchar Świata'],
    ['OWG', 'Igrzyska olimpijskie', 'Medale konkursów indywidualnych IO od 1924 roku (pl.wikipedia.org, „Medaliści igrzysk olimpijskich w skokach narciarskich”)'],
    ['WCH', 'Mistrzostwa świata', 'Medale konkursów indywidualnych MŚ w narciarstwie klasycznym od 1925 roku (pl.wikipedia.org, „Medaliści mistrzostw świata w narciarstwie klasycznym w skokach narciarskich”)'],
    ['SFWC', 'MŚ w lotach', 'Medale konkursów indywidualnych MŚ w lotach od 1972 roku (pl.wikipedia.org, „Medaliści mistrzostw świata w lotach narciarskich”)'],
    ['TCS', 'Turniej Czterech Skoczni', 'Miejsca 1–3 w klasyfikacji generalnej TCS od edycji 1952/53 (pl.wikipedia.org, „Turniej Czterech Skoczni”)'],
    ['RAW', 'Raw Air', 'Miejsca 1–3 w klasyfikacji generalnej Raw Air od 2017 roku (pl.wikipedia.org, „Raw Air”)'],
    ['TN', 'Turniej Nordycki', 'Miejsca 1–3 w klasyfikacji generalnej Turnieju Nordyckiego 1997–2010 (pl.wikipedia.org, „Turniej Nordycki”)'],
    ['SGP', 'Letnie Grand Prix', 'Miejsca 1–3 w klasyfikacji generalnej LGP od 1994 roku (pl.wikipedia.org, „Letnie Grand Prix w skokach narciarskich”)'],
  ];
  const CHAMPS = ['OWG', 'WCH', 'SFWC'];

  // klasyfikacja medalowa imprezy lub turnieju: prawdziwa historia + gra; team: medale drużynowe krajów (IO, MŚ, MŚ w lotach)
  function titleStats(comp) {
    const s = st(), rows = new Map(), team = {};
    const SUCC = SJM.REAL_PODIUM_SUCC || {}, HIST = SJM.REAL_PODIUM_HIST || {};
    const row = (name, nat, k = W.normName(name)) => {
      let r = rows.get(k);
      if (!r) rows.set(k, (r = { name, nat, ov: [0, 0, 0], status: 'retired' }));
      return r;
    };
    const addTeam = (nat, place, v = 1) => { (team[nat] || (team[nat] = [0, 0, 0]))[place - 1] += v; };
    const src = (SJM.REAL_TITLES || {})[comp] || {};
    for (const [name, code, g, sv, b] of src.ind || []) { const r = row(name, SUCC[code] || code); r.hist = HIST[code]; r.ov = [g, sv, b]; }
    for (const [code, m] of Object.entries(src.team || {})) m.forEach((v, i) => addTeam(SUCC[code] || code, i + 1, v));
    const inHistory = s.history.some((h) => h.season === s.season);
    const podium = (list) => (list || []).slice(0, 3).forEach((x, i) => { if (x && x.name !== '?') row(x.name, x.nat, statKey(x.name, x.id)).ov[i]++; });
    if (CHAMPS.includes(comp)) {
      // medale z gry: indywidualne (jeden zawodnik) i drużynowe (drużyny, duety)
      const medals = s.history.flatMap((h) => h.medals || []).concat(inHistory ? [] : s.seasonMedals || []);
      for (const m of medals) if (m.level === comp) { if (m.names.length === 1) row(m.names[0], m.nat, statKey(m.names[0], m.ids && m.ids[0])).ov[m.place - 1]++; else addTeam(m.nat, m.place); }
    } else {
      for (const h of s.history) {
        if (comp === 'TCS') podium(h.tcs);
        else if (comp === 'SGP') podium(h.sgp);
        else if ((h.rawName === 'Turniej Nordycki' ? 'TN' : 'RAW') === comp) podium(h.raw);
      }
      // TCS kończy się w styczniu: bieżąca edycja liczy się od razu po finale
      if (comp === 'TCS' && !inHistory && s.tcsAwarded === s.season) {
        podium(Object.entries(s.standings.tcs).filter(([id]) => s.standings.tcsN[id] === 4 && s.jumpers[id]).sort((a, b) => b[1] - a[1])
          .map(([id]) => ({ name: W.fullName(s.jumpers[id]), nat: s.jumpers[id].nation })));
      }
    }
    for (const j of Object.values(s.jumpers)) {
      const r = rows.get(statKey(W.fullName(j), j.id));
      if (r) { r.nat = j.nation; r.hist = null; r.j = j; r.status = 'active'; }
    }
    return { all: [...rows.values()], team };
  }

  SCREENS.stats = (prm) => {
    const s = st();
    const comp = STAT_COMPS.some(([k]) => k === prm.comp) ? prm.comp : 'WC';
    const tab = comp !== 'WC' ? 'overall' : ['podiums', 'overall'].includes(prm.tab) ? prm.tab : 'wins', sub = prm.sub === 'nations' ? 'nations' : 'jumpers';
    const ovSum = (r) => r.ov[0] + r.ov[1] + r.ov[2];
    const has = { wins: (r) => r.wins > 0, podiums: (r) => r.podiums > 0, overall: (r) => ovSum(r) > 0 }[tab];
    const cmp = {
      wins: (a, b) => b.wins - a.wins || b.podiums - a.podiums,
      podiums: (a, b) => b.podiums - a.podiums || b.wins - a.wins,
      overall: (a, b) => b.ov[0] - a.ov[0] || b.ov[1] - a.ov[1] || b.ov[2] - a.ov[2],
    }[tab];
    const head = tab === 'wins' ? '<th class="num">Zwycięstwa</th><th class="num">Podia</th>' : tab === 'podiums' ? '<th class="num">Podia</th><th class="num">Zwycięstwa</th>'
      : `<th class="c">${medalIcon(1)}</th><th class="c">${medalIcon(2)}</th><th class="c">${medalIcon(3)}</th><th class="num">Razem</th>`;
    const vals = (r) => tab === 'wins' ? `<td class="num"><b>${r.wins}</b></td><td class="num">${r.podiums}</td>` : tab === 'podiums' ? `<td class="num"><b>${r.podiums}</b></td><td class="num">${r.wins}</td>`
      : `<td class="c"><b>${r.ov[0]}</b></td><td class="c">${r.ov[1]}</td><td class="c">${r.ov[2]}</td><td class="num">${ovSum(r)}</td>`;
    // miejsca ex aequo przy równych wynikach
    const places = (list) => { let p = 0; return list.map((r, i) => (!i || cmp(list[i - 1], r) ? (p = i + 1) : p)); };
    const ts = comp === 'WC' ? { all: allTimeStats(), team: {} } : titleStats(comp);
    const all = ts.all, rows = all.filter(has).sort((a, b) => cmp(a, b) || a.name.localeCompare(b.name));
    let body;
    if (sub === 'jumpers') {
      const pl = places(rows);
      body = `<table><tr><th class="num">#</th><th>Zawodnik</th><th>Kraj</th>${head}<th>Status</th></tr>
        ${rows.map((r, i) => { const nd = W.nationData(r.nat);
          return `<tr class="${r.nat === s.nation ? 'mine' : ''}"><td class="num">${pl[i]}.</td><td>${r.j ? jl(r.j) : esc(r.name)}</td><td>${W.flag(r.nat)} ${nd ? esc(nd.name) : r.nat}${r.hist ? ` <span class="muted small">(${r.hist})</span>` : ''}</td>${vals(r)}
          <td class="small">${r.status === 'active' ? '<span class="pos">aktywny</span>' : '<span class="muted">zakończył karierę</span>'}</td></tr>`; }).join('')}</table>`;
    } else {
      const byNat = {};
      const nat = (c) => byNat[c] || (byNat[c] = { nat: c, name: c, wins: 0, podiums: 0, ov: [0, 0, 0], n: 0, act: 0 });
      for (const r of all) {
        const n = nat(r.nat);
        n.wins += r.wins || 0; n.podiums += r.podiums || 0; r.ov.forEach((v, i) => (n.ov[i] += v));
        if (has(r)) { n.n++; if (r.status === 'active') n.act++; }
      }
      for (const [c, m] of Object.entries(ts.team)) m.forEach((v, i) => (nat(c).ov[i] += v));
      const list = Object.values(byNat).filter(has).sort(cmp), pl = places(list);
      body = `<table><tr><th class="num">#</th><th>Kraj</th>${head}<th class="num">Zawodnicy</th><th class="num">w tym aktywni</th></tr>
        ${list.map((n, i) => `<tr class="${n.nat === s.nation ? 'mine' : ''}"><td class="num">${pl[i]}.</td><td>${natl(n.nat)}</td>${vals(n)}<td class="num">${n.n}</td><td class="num">${n.act}</td></tr>`).join('')}</table>`;
    }
    const btn = (act, cur, k, l) => `<button class="${cur === k ? 'active' : ''}" data-act="${act}" data-${act}="${k}">${l}</button>`;
    const info = STAT_COMPS.find(([k]) => k === comp)[2];
    const note = comp !== 'WC'
      ? `${info} oraz wyniki z gry.${CHAMPS.includes(comp) ? ' W klasyfikacji państw doliczone są medale konkursów drużynowych mężczyzn (na IO 2026 i w grze także duetów).' : ''}`
      : tab === 'overall'
      ? 'Miejsca 1–3 w klasyfikacji generalnej Pucharu Świata od sezonu 1979/80 do 2025/26 (pl.wikipedia.org, „Puchar Świata w skokach narciarskich”) oraz w sezonach rozegranych w grze.'
      : 'Indywidualne konkursy Pucharu Świata od sezonu 1979/80 do 29 marca 2026 (pl.wikipedia.org, „Lista skoczków narciarskich z podium w Pucharze Świata”) oraz wyniki z gry, w której liczą się też konkursy indywidualne MŚ, MŚ w lotach i IO.';
    return `<h1>Statystyki</h1>
      <div class="tabs">${STAT_COMPS.map(([k, l]) => btn('comp', comp, k, l)).join('')}</div>
      ${comp === 'WC' ? `<div class="tabs">${btn('tab', tab, 'wins', '🥇 Zwycięstwa')}${btn('tab', tab, 'podiums', '🏆 Podia')}${btn('tab', tab, 'overall', '🏅 Klasyfikacja medalowa')}</div>` : ''}
      <div class="tabs">${btn('sub', sub, 'jumpers', 'Zawodnicy')}${btn('sub', sub, 'nations', 'Państwa')}</div>
      <div class="card tight scroll">${rows.length ? body : '<div class="empty">Brak danych.</div>'}</div>
      <p class="small muted">${note} Państwa historyczne jak na Wikipedii: NRD w Niemczech, Czechosłowacja w Czechach (Słowacy w Słowacji), Jugosławia w Słowenii, ZSRR w Rosji.</p>`;
  };

  SCREENS.summary = () => {
    const s = st();
    const sm = s.lastSummary;
    if (!sm) return SCREENS.dashboard();
    const h = sm.hist;
    const youth = (sm.youth || []).map((id) => s.jumpers[id]).filter(Boolean).sort((a, b) => M.potEstimate(b) - M.potEstimate(a));
    return `<h1>Podsumowanie sezonu ${sm.label}</h1>
      ${sm.fired ? `<div class="card mb" style="border-color:var(--neg)"><h2 class="neg">Zostałeś zwolniony</h2><p>Zarząd federacji zdecydował o rozwiązaniu umowy. Zajęliśmy ${sm.myRank}. miejsce w Pucharze Narodów przy celu ${h.player.target}.</p><button class="btn primary" data-act="menu">Menu główne</button></div>` : ''}
      <div class="grid g3 mb">
        <div class="card"><h3>Kryształowa Kula</h3>${h.wc.slice(0, 3).map((x, i) => `<div>${medalIcon(i + 1)} ${W.flag(x.nat)} ${esc(x.name)} <span class="muted">${x.pts} pkt</span></div>`).join('')}</div>
        <div class="card"><h3>Puchar Narodów</h3>${h.nc.slice(0, 3).map((x, i) => `<div>${medalIcon(i + 1)} ${natl(x.nat)} <span class="muted">${x.pts}</span></div>`).join('')}<div class="mt">Nasze miejsce: <b class="${sm.myRank <= h.player.target ? 'pos' : 'neg'}">${sm.myRank}.</b> (cel: ${h.player.target}.)</div></div>
        <div class="card"><h3>Ocena zarządu</h3><div class="big">${h.player.board}/100</div><div class="${sm.delta >= 0 ? 'pos' : 'neg'}">${sm.delta >= 0 ? '+' : ''}${sm.delta} po sezonie</div>
          ${sm.grantChange !== undefined ? `<div class="small mt">Dotacja na nowy rok: <b class="${sm.grantChange >= 0 ? 'pos' : 'neg'}">${sm.grantChange >= 0 ? '+' : ''}${Math.round(sm.grantChange * 100)}%</b></div>` : ''}</div>
      </div>
      ${!sm.fired ? `<div class="grid g2 mb">
        <div class="card"><h3>Najważniejsze wydarzenia po sezonie</h3>${sm.lines.map((l) => `<div class="mb">${l}</div>`).join('') || '<div class="muted">Spokojna przerwa.</div>'}
          <div class="mt small muted">Nowy sezon zaczyna się w lipcu: Letnie Grand Prix, Letni Puchar Kontynentalny i letnia część FIS Cup.</div>
          <div class="mt">Kwota startowa w PŚ na nowy sezon: <b>${sm.quota.WC}</b> (PK: ${sm.quota.COC})</div>
          <div class="mt small">Oczekiwania na nowy sezon: ${sm.expectation}</div></div>
        <div class="card"><h3>Nabór do klubów (maj)</h3><p>${youth.length ? `W przerwie do naszych klubów zgłosiło się <b>${youth.length}</b> ${youth.length === 1 ? 'nowy zawodnik' : youth.length < 5 ? 'nowych zawodników' : 'nowych zawodników'}. Najwyżej oceniany potencjał: ${jl(youth[0])} ${stars(M.potEstimate(youth[0]))}` : 'W tym roku nikt nowy nie zgłosił się do klubów.'}</p>
          <p class="small muted">Szczegóły są w wiadomości z 15 maja. Nowi są oznaczeni 🆕 w zakładce Kadra → Kluby. Najzdolniejszych przenieś do kadry juniorów.</p>
          ${youth.length ? `<button class="btn small" data-act="nav" data-screen="squad" data-tab="R">Kadra → Kluby</button>` : ''}</div>
      </div>
      <button class="btn go" data-act="nav" data-screen="dashboard">Rozpocznij sezon ${s.season}/${String(s.season + 1).slice(2)} ▶</button>` : ''}`;
  };

  // ---------- Cechy zawodnika ----------
  function traitsHtml(j, mine) {
    const tr = j.traits || [];
    const shown = tr.filter((k) => !SJM.TRAITS[k].hidden || (j.known || []).includes(k));
    const unknown = tr.length - shown.length;
    const items = shown.map((k) => { const t = SJM.TRAITS[k]; return `<div class="traitrow"><span class="trait ${t.hidden ? 'hid' : ''}">${t.icon}</span><div><b>${t.name}</b>${t.hidden ? ' <span class="pill">odkryta</span>' : ''}<div class="small muted">${t.desc}</div></div></div>`; }).join('');
    const hint = mine && unknown > 0 ? '<div class="small muted mt">🔍 Sztab może jeszcze odkryć ukryte cechy tego zawodnika (lepszy fizjoterapeuta i koordynator szkolenia = szybciej).</div>' : '';
    return `<h3 class="mt">Cechy</h3>${items || '<div class="small muted">Brak wyróżniających cech' + (mine ? ' (jak dotąd)' : '') + '.</div>'}${hint}`;
  }

  // ---------- Starty w bieżącym sezonie ----------
  function seasonResultsHtml(j) {
    const s = st();
    const rows = [];
    for (const { e, date, res } of calendarEvents()) {
      if (!res) continue;
      let place = null;
      if (res.type === 'ind') {
        const row = res.ranking.find((x) => x.id === j.id);
        if (row) place = row.dsq || !row.rank ? '<span class="neg">DSQ</span>' : (row.rank <= 3 ? medalIcon(row.rank) + ' ' : '') + row.rank + '.';
        else {
          const q = res.qual && res.qual.jumps.find((x) => x.id === j.id);
          if (q) place = `<span class="muted">kw. (${q.rank}.)</span>`;
        }
      } else {
        const row = res.ranking.find((x) => x.members.includes(j.id));
        if (row) place = (row.rank <= 3 ? medalIcon(row.rank) + ' ' : '') + row.rank + '. <span class="muted small">druż.</span>';
      }
      if (place) rows.push(`<tr><td class="nowrap">${fmtDay(date)}</td><td>${lvPill(e.level)} <a data-act="event" data-id="${e.id}">${esc(SJM.CAL.eventTitle(e))}</a></td><td>${W.flag(hillNation(e.hill))}</td><td class="num">${place}</td></tr>`);
    }
    return `<div class="card tight mt"><h3>Konkursy w sezonie ${s.season}/${String(s.season + 1).slice(2)}</h3>${rows.length
      ? `<div class="tbl-wrap" style="max-height:340px"><table class="small"><tr><th>Data</th><th>Zawody</th><th></th><th class="num">Msc</th></tr>${rows.reverse().join('')}</table></div>`
      : '<div class="small muted" style="padding:0 14px 10px">Brak startów w tym sezonie.</div>'}</div>`;
  }

  // ---------- Profil zawodnika (modal) ----------
  function jumperModal(id) {
    const s = st();
    const j = s.jumpers[id];
    if (!j) return;
    const mine = j.nation === s.nation;
    const c = j.career;
    const attrs = SJM.ATTRS.map((a) => `<div class="row between"><span title="${a.desc}">${a.name}</span><span class="row" style="gap:8px">${bar(j.attrs[a.key])}${attr(j.attrs[a.key])}</span></div>`).join('');
    const seasonBest = Object.entries(j.season.best).map(([lv, r]) => `${lvPill(lv)} ${r}.`).join(' ');
    const html = `<button class="close" data-act="close">×</button>
      <div class="row between"><div><h1 style="margin:0">${W.flag(j.nation)} ${esc(W.fullName(j))}</h1><div class="muted">${W.nationData(j.nation).name} · ${W.age(j)} lat (ur. ${j.born}) · ${j.height} cm ${mine ? '· ' + gPill(j.group) : ''}</div></div>
      <div class="row"><div style="text-align:center"><div class="small muted">Ocena</div><div style="font-size:28px">${ovr(W.overall(j))}</div></div><div style="text-align:center"><div class="small muted">Potencjał</div>${stars(M.potEstimate(j))}</div></div></div>
      <div class="grid g3 mt">
        <div class="card"><h3>Umiejętności</h3>${attrs}<div class="small muted mt">Na mamutach: ${ovr(W.skill(j, 200))} · na normalnej: ${ovr(W.skill(j, 95))}</div>${traitsHtml(j, mine)}</div>
        <div class="card"><h3>Stan</h3><div class="kv"><span class="k">Forma</span><span>${formStr(j.form)} ${U.fmt1(j.form)}</span><span class="k">Zmęczenie</span><span>${Math.round(j.fatigue)}%</span><span class="k">Morale</span><span>${Math.round(j.morale)}</span><span class="k">Uprawnienia</span><span>${licBadges(j)}</span><span class="k">Pkt poprz. sezonu</span><span class="small">PŚ ${(j.prevPts || {}).WC || 0} · LGP ${(j.prevPts || {}).SGP || 0} · PK ${(j.prevPts || {}).COC || 0} · LPK ${(j.prevPts || {}).SCOC || 0} · FC ${(j.prevPts || {}).FIS || 0}</span><span class="k">Zdrowie</span><span>${j.injury > 0 ? `<span class="inj">kontuzja (${Math.ceil(j.injury)} tyg.)</span>` : '<span class="pos">zdrowy</span>'}</span></div>
          ${mine ? `<div class="mt row"><label class="small">Przydział:</label><select data-change="group" data-id="${j.id}">${['A', 'B', 'J', 'R'].map((g) => `<option value="${g}" ${M.draftGroupOf(j) === g ? 'selected' : ''}>${GROUP_NAMES[g]}</option>`).join('')}</select></div>` : ''}
          <h3 class="mt">Sezon</h3><div class="kv small"><span class="k">Starty</span><span>${j.season.starts}</span><span class="k">Pkt PŚ</span><span>${s.standings.wc[j.id] || 0}${s.standings.wc[j.id] ? ` (${M.rankOf(s.standings.wc, j.id)}.)` : ''}</span>${s.standings.sgp && s.standings.sgp[j.id] ? `<span class="k">Pkt LGP</span><span>${s.standings.sgp[j.id]} (${M.rankOf(s.standings.sgp, j.id)}.)</span>` : ''}<span class="k">Zwycięstwa / podia</span><span>${j.season.wins} / ${j.season.podiums}</span><span class="k">Najlepsze</span><span>${seasonBest || '–'}</span></div></div>
        <div class="card"><h3>Kariera</h3><div class="kv small"><span class="k">Starty w PŚ (w grze)</span><span>${c.wcStarts}</span><span class="k">Zwycięstwa PŚ</span><span>${c.wins}</span><span class="k">Podia PŚ</span><span>${c.podiums}${c.realPodiums ? ` <span class="muted small" title="Prawdziwa kariera do marca 2026: 1. / 2. / 3. miejsca">(przed grą: ${c.realPodiums.g}–${c.realPodiums.s}–${c.realPodiums.b})</span>` : ""}</span><span class="k">Najlepsze miejsce</span><span>${c.best || '–'}</span><span class="k">Medale MŚ/IO (razem)</span><span>${medalIcon(1)} ${c.medals.g} ${medalIcon(2)} ${c.medals.s} ${medalIcon(3)} ${c.medals.b}</span>${c.medalsBy ? [["OWG", "Indywidualnie – IO"], ["WCH", "Indywidualnie – MŚ"], ["SFWC", "Indywidualnie – MŚ w lotach"]].filter(([k]) => c.medalsBy[k].g + c.medalsBy[k].s + c.medalsBy[k].b).map(([k, l]) => `<span class="k">${l}</span><span>${medalIcon(1)} ${c.medalsBy[k].g} ${medalIcon(2)} ${c.medalsBy[k].s} ${medalIcon(3)} ${c.medalsBy[k].b}</span>`).join("") : ""}<span class="k">Medale MŚJ</span><span>${c.jrMedals || 0}</span><span class="k">Kryształowe Kule</span><span>${c.globes}</span><span class="k">Złote Orły TCS</span><span>${c.tcs}</span></div></div>
      </div>
      ${j.log.length ? `<div class="card tight mt"><h3>Poprzednie sezony</h3><table><tr><th>Sezon</th><th class="num">Ocena</th><th class="num">Starty</th><th class="num">PŚ pkt</th><th class="num">PŚ msc</th><th class="num">Wygrane</th><th class="num">Podia</th><th class="num">PK pkt</th></tr>${j.log.slice().reverse().map((l) => `<tr><td>${l.season}</td><td class="num">${l.ovr}</td><td class="num">${l.starts}</td><td class="num">${l.wc}</td><td class="num">${l.wcRank || '–'}</td><td class="num">${l.wins}</td><td class="num">${l.podiums}</td><td class="num">${l.coc}</td></tr>`).join('')}</table></div>` : ''}${seasonResultsHtml(j)}`;
    openModal(html);
    addHelp($('#modal'), 'jumper');
  }

  function openModal(html) {
    const m = $('#modal');
    m.innerHTML = `<div class="box">${html}</div>`;
    m.classList.remove('hidden');
  }
  function closeModal() {
    const m = $('#modal');
    m.classList.add('hidden'); m.innerHTML = '';
    if (SJM.LIVE) SJM.LIVE.stop();
  }

  // ---------- Akcje ----------
  // ---------- Decyzje (wydarzenia losowe) ----------
  const CAT_ICONS = { zawodnicy: '🎿', młodzież: '🌱', sztab: '🧑‍💼', sponsorzy: '🤝', finanse: '💰', infrastruktura: '🏗️', media: '📺', kibice: '📣', przepisy: '📏', zdrowie: '🩺', zawody: '🏁', trening: '🏋️', zarząd: '🏛️', sprzęt: '🧰' };
  function decisionModal(resultText) {
    const list = SJM.EV.pending();
    if (resultText !== undefined) {
      openModal(`<h3>Skutek decyzji</h3><p style="line-height:1.6">${resultText}</p>
        <div class="row mt"><button class="btn primary" data-act="${list.length ? 'decisions' : 'close'}">${list.length ? `Następna decyzja (${list.length}) ▶` : 'OK'}</button></div>`);
      renderShell();
      return;
    }
    if (!list.length) { closeModal(); return; }
    const p = list[0];
    const ch = SJM.EV.choicesOf(p);
    openModal(`<div class="row between"><span class="pill">${CAT_ICONS[p.cat] || '❗'} ${esc(p.cat)}</span><span class="small muted">${list.length > 1 ? `decyzja 1 z ${list.length}` : ''}</span></div>
      <h2 class="mt">${esc(p.title)}</h2>
      <p style="line-height:1.6">${p.text}</p>
      <div class="decisions">${ch.map((c, i) => `<button class="decision" data-act="decide" data-c="${i}" ${c.disabled ? 'disabled' : ''}>
        <b>${esc(c.label)}</b><span class="small muted">${esc(c.hint || '')}${c.cost && !(c.hint || "").includes("€") ? ` · koszt ${U.money(c.cost)}` : ""}${c.disabled ? ' · <span class="neg">brak środków</span>' : ''}</span></button>`).join('')}</div>
      <p class="small muted mt">Budżet: ${U.money(st().player.budget)}</p>`);
  }

  function nextWeek() {
    const s = st();
    if (s.gameOver) return;
    if (s.staffWindow) { go('contracts'); return toast('Najpierw zakończ okno kontraktowe sztabu.'); }
    if (SJM.EV && SJM.EV.pending().length) return decisionModal();
    const wk = M.currentWeek();
    // tydzień startowy: najpierw zgłoszenia, potem wybór trybu rozegrania
    if (wk.events.length) {
      if (M.needsNominations()) { go('nominations'); return toast('Ustal i zatwierdź składy na ten tydzień.'); }
      const mode = (s.settings && s.settings.playMode) || 'ask';
      if (mode === 'ask') return playModal();
      return doPlay(mode === 'live' ? liveDefaults(wk) : []);
    }
    const r = M.playWeek();
    SJM.SAVE.save('auto');
    if (r === 'seasonEnd') return go('summary');
    if (screen === 'week' || screen === 'event' || screen === 'summary') return go('dashboard');
    render();
  }

  function onClick(e) {
    const el = e.target.closest('[data-act]');
    if (!el) { if (e.target.id === 'modal') closeModal(); return; }
    const a = el.dataset.act, d = el.dataset;
    const s = st();
    if (a !== 'drawer') $('#app').classList.remove('drawer-open'); // wysuwane menu na telefonie
    switch (a) {
      case 'drawer': return $('#app').classList.toggle('drawer-open');
      case 'nav': closeModal(); return go(d.screen, d.tab ? { tab: d.tab } : {});
      case "next": return nextWeek();
      case "decisions": return decisionModal();
      case "decide": { const r = SJM.EV.resolve(0, +d.c); if (!r) return decisionModal(); if (r.error) return toast(r.error, true); render(); return decisionModal(r.text); }
      case 'jumper': return jumperModal(d.id);
      case 'nation': closeModal(); return go('nation', { code: d.code });
      case 'event': closeModal(); return go('event', { id: d.id });
      case 'week': return go('week', { i: +d.i });
      case 'replay': return SJM.LIVE.open(d.id);
      case 'close': return closeModal();
      case 'help': return helpModal(d.key);
      case 'tab': params = { ...params, tab: d.tab }; return render();
      case 'sub': params = { ...params, sub: d.sub }; return render();
      case 'comp': params = { ...params, comp: d.comp }; return render();
      case 'staffrole': params = { ...params, role: d.role }; return render();
      case 'sort': {
        const cur = sortState[d.table];
        sortState[d.table] = { key: d.key, dir: cur && cur.key === d.key ? -cur.dir : -1 };
        return render();
      }
      case 'openmsg': { const m = s.inbox.find((x) => x.id === d.id); if (m) m.read = true; return go('inbox', { open: d.id }); }
      case 'togglemsg': { const m = s.inbox.find((x) => x.id === d.id); if (m) m.read = true; el.classList.toggle('open'); el.classList.remove('unread'); renderShell(); return; }
      case 'readall': s.inbox.forEach((m) => (m.read = true)); return render();
      case "confirmgroups": return result(M.confirmGroups(), 'Federacja zatwierdziła nowe kadry');
      case "discardgroups": M.discardGroups(); return result(null, 'Odrzucono zmiany w kadrach');
      case "autogroups": M.discardGroups(); M.autoGroups(); M.ensureNominations(); return result(null, 'Podzielono zawodników na kadry');
      case "assist": M.assistantFill(); return result(null, "Asystent zaproponował zawodników w Twoich cyklach");
      case "clearnom": { const n = M.ensureNominations(); Object.keys(n.byLevel).forEach((k) => { if (!M.isDelegated(k)) n.byLevel[k] = []; }); n.teams = {}; return render(); }
      case "deleg": M.setDelegated(d.lv, d.on === "1"); return render();
      case "ngpick": M.setNationalGroup(d.lv, +d.n); return render();
      case "confirmnom": { M.confirmNominations(); SJM.SAVE.save("auto"); return result(null, "Składy zatwierdzone"); }
      case "unconfirmnom": M.unconfirmNominations(); return render();
      case "playgo": return doPlay([...document.querySelectorAll(".liveev:checked")].map((x) => x.value));
      case "playfast": return doPlay([]);
      case 'hire': return result(M.hire(d.id), 'Zatrudniono');
      case 'renew': return result(M.renewOffer(d.id, +$('#rs-' + d.id).value, +$('#ry-' + d.id).value), 'Oferta złożona');
      case 'tcok': return teamChangeDone([...document.querySelectorAll('#modal .tcpick')].map((x) => x.value));
      case 'tcauto': return teamChangeDone(null);
      case 'promote': { const m = M.coachMoves().find((x) => x.from === d.from && x.to === d.to); if (m && m.replaces && !confirm(`Awansować ${m.name}? Kontrakt ${m.replaces} nie zostanie przedłużony.`)) return; return result(M.promoteCoach(d.from, d.to), 'Trener awansowany'); }
      case 'norenew': if (!confirm('Nie przedłużać kontraktu? Ta osoba trafi na rynek, ale nie będzie chciała z nami rozmawiać.')) return; return result(M.renewOffer(d.id, null), 'Kontrakt wygaśnie');
      case 'renewdone': return result(M.finishRenewals(), 'Okno kontraktowe otwarte');
      case 'cwrole': params = { ...params, role: d.role, cand: null }; return render();
      case 'pickcand': params = { ...params, cand: d.id }; return render();
      case 'staffbid': { const err = M.staffBid(d.id, +$('#bs').value, +$('#by').value); if (err) return toast(err, true); params = { ...params, cand: null, role: null }; return st().staffWindow ? render() : go('staff'); }
      case 'skipround': { M.skipRound(); params = { ...params, cand: null }; return st().staffWindow ? render() : go('staff'); }
      case 'passrole': {
        if (!confirm(`Spasować na funkcji „${SJM.STAFF_ROLES[M.ROLE_ORDER[st().staffWindow.roleIdx]].name}”? Do końca sezonu obowiązki przejmie słabszy p.o.`)) return;
        M.passRole(); params = { ...params, cand: null }; return st().staffWindow ? render() : go('staff');
      }
      case 'finishwin': {
        const left = M.vacancies(st().nation);
        if (left.length && !confirm(`Nieobsadzone stanowiska: ${left.map((r) => SJM.STAFF_ROLES[r].name).join(', ')}. Zakończyć okno? Do końca sezonu obowiązki przejmą słabsi p.o., a następców wybierzesz dopiero w kolejnym oknie. Kraje AI dokończą obsadę.`)) return;
        M.finishWindow(); SJM.SAVE.save('auto'); toast('Okno kontraktowe zamknięte'); return go('staff');
      }
      case 'fire': if (!confirm('Zwolnić tę osobę? Odprawa: 30% rocznej pensji.')) return; return result(M.fire(d.role), 'Zwolniono');
      case 'modern': return result(M.modernize(d.id), 'Rozpoczęto modernizację');
      case "homol": return result(M.homologate(d.id, d.cls), "Zgłoszono skocznię do inspekcji FIS");
      case 'igelit': return result(M.addIgelit(d.id), 'Rozpoczęto prace');
      case 'lights': return result(M.addLights(d.id), 'Rozpoczęto prace');
      case 'demolish': if (!confirm('Zamknąć skocznię na stałe?')) return; return result(M.demolish(d.id), 'Skocznia zamknięta');
      case 'facility': return result(M.upgradeFacility(d.key), 'Rozpoczęto rozbudowę');
      case 'build': return result(M.buildHill($('#build-type').value, $('#build-city').value.trim()), 'Rozpoczęto budowę');
      case 'bid': return result(M.bid(d.level, $('#bid-' + d.level).value), 'Kandydatura złożona');
      case 'unbid': return result(M.unbid(d.level, d.hill), 'Kandydatura wycofana');
      case 'save': return SJM.SAVE.save('manual').then((ok) => { if (ok) toast('Gra zapisana'); });
      case 'menu': return SJM.MAIN.showMenu();
    }
  }

  function onChange(e) {
    const el = e.target.closest('[data-change]');
    if (!el) return;
    const d = el.dataset;
    const s = st();
    switch (d.change) {
      case 'group': { const err = M.draftGroup(d.id, el.value); if (err) { toast(err, true); } M.ensureNominations(); render(); if (!$('#modal').classList.contains('hidden')) jumperModal(d.id); return; }
      case 'nominate': { const err = M.setNomination(d.id, el.value); if (err) toast(err, true); return render(); }
      case "jstatus": M.setStatus(d.id, el.value); return;
      case 'teampick': {
        const n = M.ensureNominations();
        const ev = M.currentWeek().events.find((x) => x.id === d.ev);
        const team = (n.teams[d.ev] || M.teamFor(s.nation, ev.level, n.byLevel[ev.level] || [], ev).map((j) => j.id)).slice();
        const slot = +d.slot, val = el.value;
        const other = team.indexOf(val);
        if (other >= 0) team[other] = team[slot];
        team[slot] = val;
        n.teams[d.ev] = team;
        return render();
      }
      case 'train': s.player.training[d.g][d.k] = el.value; return toast('Zmieniono plan treningowy');
    }
  }

  function init() {
    document.addEventListener('click', onClick);
    document.addEventListener('change', onChange);
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && SJM.state && !SJM.state.gameOver && !['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(document.activeElement.tagName) && $('#modal').classList.contains('hidden') && !$('#app').classList.contains('hidden')) {
        e.preventDefault(); nextWeek();
      }
      if (e.code === 'Escape') closeModal();
    });
  }

  // przycisk Wstecz w aplikacji na Androida: true, gdy gra coś zamknęła (inaczej aplikacja pyta o wyjście)
  function back() {
    if (!$('#modal').classList.contains('hidden')) { closeModal(); return true; }
    if ($('#app').classList.contains('hidden')) return false;
    if ($('#app').classList.contains('drawer-open')) { $('#app').classList.remove('drawer-open'); return true; }
    if (screen !== 'dashboard' && !st().gameOver) { go('dashboard'); return true; }
    return false;
  }

  return { init, render, go, back, toast, openModal, closeModal, jl, jlf, ovr, medalIcon, lvPill };
})();
