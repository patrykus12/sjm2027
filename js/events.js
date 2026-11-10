// ===== Wydarzenia losowe i decyzje =====
// Każde wydarzenie: id, kategoria, waga, cooldown (w turach), faza (season/summer/any),
// warunek when() zwracający kontekst (lub null), tytuł, treść i decyzje (albo auto – zdarzenie informacyjne).
SJM.EV = (function () {
  const U = SJM.U, W = SJM.W, M = SJM.M;
  const st = () => SJM.state;
  const P = () => st().player;
  const CHANCE = { season: 0.38, summer: 0.12 }; // szansa na wydarzenie w turze (lato: tydzień letni w kalendarzu)
  const MAX_PENDING = 2;

  function data() {
    const s = st();
    if (!s.ev) s.ev = { pending: [], last: {}, queue: [], seasonEnd: [], lastCat: null, count: 0 };
    return s.ev;
  }
  const now = () => M.turn();

  // ---------- Pomocnicze efekty ----------
  const my = () => M.myJumpers();
  const J = (id) => st().jumpers[id];
  const nm = (j) => (j ? W.fullName(j) : '?');
  const pick = (arr) => (arr.length ? U.pick(arr) : null);
  const ovr = (j) => W.overall(j);
  const age = (j) => W.age(j);
  const k = (v) => U.money(v);
  const chance = (p) => Math.random() < p;
  function money(v, label) { M.ledger('events', Math.round(v), label); }
  function board(v) { P().board = U.clamp(P().board + v, 0, 100); }
  function pop(v) { P().popularity = U.clamp(P().popularity + v, 0, 100); }
  function morale(j, v) { if (j) j.morale = U.clamp(j.morale + v, 0, 100); }
  function form(j, v) { if (j) j.form = U.clamp(j.form + v, -10, 10); }
  function fatigue(j, v) { if (j) j.fatigue = U.clamp(j.fatigue + v, 0, 100); }
  function attr(j, key, v) { if (j) j.attrs[key] = U.clamp(j.attrs[key] + v, 5, 99.5); }
  function attrsAll(j, v) { SJM.ATTRS.forEach((a) => attr(j, a.key, v)); }
  function injure(j, w) { if (j) j.injury = Math.max(j.injury, w); }
  function suspend(j, w) { if (j) j.suspended = Math.max(j.suspended || 0, w); }
  function mod(key, value, weeks, label) { M.addMod(key, value, weeks, label); }
  function schedule(id, turns, ctx) { data().queue.push({ id, at: now() + turns, ctx: ctx || {} }); }
  function atSeasonEnd(id, ctx) { data().seasonEnd.push({ id, ctx: ctx || {} }); }
  const group = (g) => my().filter((j) => j.group === g);
  const healthy = (arr) => arr.filter((j) => j.injury <= 0 && !(j.suspended > 0));
  const upcoming = () => st().calendar.weeks[st().week];
  const staff = (r) => P().staff[r];
  const sName = (x) => (x ? x.first + ' ' + x.last : '?');
  // odejście sztabowca w trakcie sezonu: trafia na rynek (nie chce już z nami rozmawiać), obowiązki przejmuje p.o.
  const staffLeaves = (role, toMarket = true) => {
    const x = staff(role);
    P().staff[role] = null;
    if (toMarket) { x.blocked = (x.blocked || []).concat(st().nation); st().staffMarket.push(x); }
    const po = M.interimStaff(role);
    return `Do końca sezonu obowiązki pełni ${sName(po)} (p.o., jakość ${po.quality}). Następcę wybierzesz w oknie kontraktowym po sezonie.`;
  };
  const natName = (c) => W.nationData(c).name;
  const myRank = () => M.ncOrder().indexOf(st().nation) + 1;
  const hasPts = () => Object.keys(st().standings.nc).length > 0;
  const bigHills = () => P().hills.filter((h) => h.K >= 85 && !h.building);
  const anyHill = () => P().hills.filter((h) => !h.building);
  const hill = (id) => P().hills.find((h) => h.id === id);
  const strongerNation = () => pick(SJM.NATIONS.filter((n) => n.code !== st().nation && n.strength >= 80)).code;
  const weakerNation = () => pick(SJM.NATIONS.filter((n) => n.code !== st().nation && n.strength < 55)).code;
  const OTHER_SPORTS = ['gimnastyki sportowej', 'akrobatyki', 'skoków do wody', 'snowboardu', 'narciarstwa alpejskiego', 'lekkoatletyki (skok wzwyż)'];

  // ---------- Szablony wydarzeń ----------
  const T = [
    // ===================== ZAWODNICY =====================
    {
      id: 'star_criticism', cat: 'zawodnicy', w: 6, phase: 'season',
      when: () => { const j = pick(group('A').filter((x) => ovr(x) > 85 && x.morale < 60)); return j && staff('coachA') ? { jid: j.id } : null; },
      title: (c) => `${nm(J(c.jid))} krytykuje trenera w mediach`,
      text: (c) => `W wywiadzie dla telewizji ${nm(J(c.jid))} stwierdził, że „plan treningowy kadry A nie odpowiada jego potrzebom". Trener ${sName(staff('coachA'))} jest wyraźnie urażony, a dziennikarze dzwonią po komentarz.`,
      choices: [
        { t: 'Publicznie upomnieć zawodnika', hint: 'zarząd +, morale zawodnika −−', fx: (c) => { morale(J(c.jid), -12); board(2); return 'Zawodnik przyjął upomnienie chłodno. Zarząd docenia stanowczość.'; } },
        { t: 'Rozmowa w cztery oczy', hint: 'morale +, szansa na zgodę', fx: (c) => { const j = J(c.jid); if (chance(0.65)) { morale(j, 10); return 'Szczera rozmowa oczyściła atmosferę – zawodnik przeprosił trenera.'; } morale(j, 3); mod('train', -0.03, 4, 'Napięcia w kadrze A'); return 'Rozmowa niewiele dała – w kadrze wciąż czuć napięcie.'; } },
        { t: 'Stanąć po stronie zawodnika', hint: 'morale ++, trener obrażony (trening −)', fx: (c) => { morale(J(c.jid), 15); mod('train', -0.06, 6, 'Obrażony trener główny'); board(-2); return 'Zawodnik jest zachwycony, ale trener główny traci zapał do pracy.'; } },
      ],
    },
    {
      id: 'form_crisis', cat: 'zawodnicy', w: 8, phase: 'season',
      when: () => { const j = pick(group('A').filter((x) => x.form < -3 && x.injury <= 0)); return j ? { jid: j.id } : null; },
      title: (c) => `Kryzys formy: ${nm(J(c.jid))}`,
      text: (c) => `${nm(J(c.jid))} od kilku tygodni skacze wyraźnie poniżej oczekiwań. Sztab proponuje kilka rozwiązań.`,
      choices: [
        { t: 'Indywidualny obóz w Planicy', hint: '−25 tys. €, forma ++, zmęczenie +', cost: () => 25000, fx: (c) => { const j = J(c.jid); money(-25000, 'Obóz indywidualny: ' + nm(j)); form(j, 4); fatigue(j, 10); return 'Kilka spokojnych dni na skoczni przyniosło poprawę – skoki znów są długie.'; } },
        { t: 'Odpoczynek od startów', hint: 'zmęczenie −−, forma +, morale −', fx: (c) => { const j = J(c.jid); fatigue(j, -35); form(j, 2.5); morale(j, -5); return 'Zawodnik odpoczywa – świeżość wróciła, choć nie jest zadowolony z przerwy.'; } },
        { t: 'Zaufać mu i nic nie zmieniać', hint: 'morale +, wynik niepewny', fx: (c) => { const j = J(c.jid); morale(j, 8); if (chance(0.5)) { form(j, 3); return 'Zaufanie zadziałało – zawodnik złapał rytm.'; } form(j, -1); return 'Niestety, kryzys się pogłębia.'; } },
      ],
    },
    {
      id: 'junior_quit', cat: 'młodzież', w: 6, phase: 'any',
      when: () => { const j = pick(my().filter((x) => age(x) <= 18 && x.pot >= 75 && (x.group === 'J' || x.group === 'R'))); return j ? { jid: j.id } : null; },
      title: (c) => `Utalentowany junior chce rzucić skoki`,
      text: (c) => `${nm(J(c.jid))} (${age(J(c.jid))} l.) rozważa zakończenie kariery – rodzice wolą, by skupił się na nauce. Trenerzy uważają go za jeden z największych talentów w kraju.`,
      choices: [
        { t: 'Zaproponować stypendium naukowo-sportowe', hint: '−20 tys. €, zostaje, morale ++', cost: () => 20000, fx: (c) => { const j = J(c.jid); money(-20000, 'Stypendium: ' + nm(j)); morale(j, 15); return 'Rodzina przyjęła stypendium – talent zostaje w skokach.'; } },
        { t: 'Rozmowa z rodzicami', hint: 'za darmo, 60% że zostanie', fx: (c) => { const j = J(c.jid); if (chance(0.6)) { morale(j, 6); return 'Udało się przekonać rodziców – junior zostaje.'; } delete st().jumpers[j.id]; return 'Rodzice byli nieugięci. Junior zakończył przygodę ze skokami.'; } },
        { t: 'Uszanować decyzję', hint: 'zawodnik odchodzi', fx: (c) => { delete st().jumpers[c.jid]; return 'Junior odchodzi ze sportu.'; } },
      ],
    },
    {
      id: 'nationality_switch', cat: 'zawodnicy', w: 4, phase: 'any', cd: 30,
      when: () => { const j = pick(my().filter((x) => x.group !== 'A' && ovr(x) >= 68 && ovr(x) <= 86 && age(x) >= 19 && age(x) <= 28)); return j ? { jid: j.id, nat: weakerNation() } : null; },
      title: (c) => `${nm(J(c.jid))} może zmienić obywatelstwo`,
      text: (c) => `Federacja (${natName(c.nat)}) zaproponowała ${nm(J(c.jid))} starty w swoich barwach – z gwarancją miejsca w Pucharze Świata. Zawodnik ma poczucie, że u nas nie dostaje szans.`,
      choices: [
        { t: 'Obiecać miejsce w kadrze A', hint: 'przechodzi do kadry A (jeśli jest miejsce), morale ++', fx: (c) => { const j = J(c.jid); const err = M.setGroup(j.id, 'A'); morale(j, 15); return err ? 'Obiecaliśmy więcej startów, ale kadra A jest pełna – zawodnik czeka na swoją szansę.' : 'Zawodnik dołącza do kadry A i zostaje.'; } },
        { t: 'Zaproponować stypendium', hint: '−40 tys. €, zostaje', cost: () => 40000, fx: (c) => { money(-40000, 'Stypendium zatrzymujące'); morale(J(c.jid), 10); return 'Stypendium przekonało zawodnika do pozostania.'; } },
        { t: 'Pozwolić mu odejść', hint: 'zawodnik zmienia barwy, popularność −', fx: (c) => { const j = J(c.jid); j.nation = c.nat; j.group = null; pop(-1); return `${nm(j)} będzie od teraz skakał dla kraju: ${natName(c.nat)}.`; } },
      ],
    },
    {
      id: 'party_scandal', cat: 'zawodnicy', w: 4, phase: 'season', cd: 25,
      when: () => { const j = pick(my().filter((x) => age(x) <= 25 && (x.group === 'A' || x.group === 'B'))); return j ? { jid: j.id } : null; },
      title: (c) => `Nocna impreza na zgrupowaniu`,
      text: (c) => `Media opublikowały zdjęcia ${nm(J(c.jid))} z nocnej imprezy w trakcie zgrupowania kadry. Kibice są podzieleni, zarząd czeka na reakcję.`,
      choices: [
        { t: 'Zawieszenie na 2 tygodnie', hint: 'zawodnik nie wystartuje, zarząd +', fx: (c) => { const j = J(c.jid); suspend(j, 2); morale(j, -10); board(3); return 'Zawodnik został zawieszony. Zarząd chwali dyscyplinę.'; } },
        { t: 'Kara finansowa i rozmowa', hint: 'morale −, zarząd +', fx: (c) => { morale(J(c.jid), -6); board(1); money(5000, 'Kara regulaminowa'); return 'Zawodnik zapłacił karę i przeprosił kolegów.'; } },
        { t: 'Przymknąć oko', hint: 'popularność −, zarząd −', fx: (c) => { morale(J(c.jid), 4); pop(-2); board(-3); group('A').forEach((x) => morale(x, -2)); return 'Sprawa ucichła, ale reszta kadry odbiera to jako brak konsekwencji.'; } },
      ],
    },
    {
      id: 'ski_brand', cat: 'zawodnicy', w: 5, phase: 'any',
      when: () => { const j = pick(group('A')); return j ? { jid: j.id } : null; },
      title: (c) => `${nm(J(c.jid))} chce zmienić narty`,
      text: (c) => `${nm(J(c.jid))} jest przekonany, że nowy model nart innego producenta da mu kilka metrów. Zmiana sprzętu w trakcie sezonu to jednak ryzyko.`,
      choices: [
        { t: 'Kupić nowe narty i testować', hint: '−30 tys. €, lot +, chwilowo forma −', cost: () => 30000, fx: (c) => { const j = J(c.jid); money(-30000, 'Nowe narty: ' + nm(j)); attr(j, 'flight', 1.5); form(j, -1.5); return 'Pierwsze skoki na nowych nartach są nierówne, ale potencjał jest wyraźny.'; } },
        { t: 'Odmówić – zostajemy przy sprawdzonym sprzęcie', hint: 'morale −', fx: (c) => { morale(J(c.jid), -7); return 'Zawodnik jest rozczarowany, ale akceptuje decyzję.'; } },
      ],
    },
    {
      id: 'personal_sponsor', cat: 'sponsorzy', w: 5, phase: 'any',
      when: () => { const j = pick(group('A').filter((x) => ovr(x) > 84)); return j ? { jid: j.id, amount: U.randInt(3, 8) * 10000 } : null; },
      title: (c) => `Osobisty sponsor dla ${nm(J(c.jid))}`,
      text: (c) => `Firma konkurencyjna wobec naszego sponsora generalnego chce podpisać osobisty kontrakt z ${nm(J(c.jid))}. Zawodnik bardzo na to liczy.`,
      choices: [
        { t: 'Zgodzić się', hint: 'morale ++, sponsorzy federacji − (10 tyg.)', fx: (c) => { morale(J(c.jid), 12); mod('sponsor', -0.08, 10, 'Konflikt sponsorów'); return 'Zawodnik podpisał kontrakt. Nasz sponsor generalny nie kryje niezadowolenia.'; } },
        { t: 'Odmówić', hint: 'morale −−', fx: (c) => { morale(J(c.jid), -12); return 'Zawodnik jest wyraźnie rozczarowany.'; } },
        { t: 'Negocjować kompromis', hint: '50%: obie strony zadowolone + wpływy', fx: (c) => { if (chance(0.5)) { money(c.amount, 'Prowizja od kontraktu sponsorskiego'); morale(J(c.jid), 8); return `Kompromis! Federacja otrzymuje ${k(c.amount)} prowizji.`; } morale(J(c.jid), -4); return 'Negocjacje zakończyły się fiaskiem.'; } },
      ],
    },
    {
      id: 'veteran_retire', cat: 'zawodnicy', w: 5, phase: 'season', cd: 25,
      when: () => { const j = pick(my().filter((x) => age(x) >= 32 && (x.group === 'A' || x.group === 'B'))); return j ? { jid: j.id } : null; },
      title: (c) => `${nm(J(c.jid))} myśli o końcu kariery`,
      text: (c) => `Doświadczony ${nm(J(c.jid))} (${age(J(c.jid))} l.) przyznał, że coraz trudniej mu się zmotywować. Rozważa zakończenie kariery jeszcze w tym sezonie.`,
      choices: [
        { t: 'Przekonać go do kontynuacji', hint: 'morale +, zostaje', fx: (c) => { morale(J(c.jid), 10); return 'Weteran zostaje – „jeszcze nie powiedziałem ostatniego słowa".'; } },
        { t: 'Zaproponować mu posadę w sztabie po karierze', hint: 'odchodzi teraz, tani trener na rynku', fx: (c) => { const j = J(c.jid); const x = W.genStaff(pick(['coachB', 'coachJ']), U.randInt(55, 72), st().nation); x.first = j.first; x.last = j.last; x.age = age(j); x.salary = Math.round(x.salary * 0.6 / 1000) * 1000; x.greed = 0.6; x.exJumper = true; st().staffMarket.unshift(x); delete st().jumpers[j.id]; pop(1); return `${nm(j)} kończy karierę i jest gotów pracować jako trener. Znajdziesz go wśród wolnych agentów i zatrudnisz w oknie kontraktowym po sezonie.`; } },
        { t: 'Uszanować jego decyzję', hint: 'kończy karierę, popularność +', fx: (c) => { const j = J(c.jid); delete st().jumpers[j.id]; pop(1); return `${nm(j)} pożegnał się z kibicami. Wzruszający moment.`; } },
      ],
    },
    {
      id: 'surgery_option', cat: 'zawodnicy', w: 6, phase: 'any',
      when: () => { const j = pick(my().filter((x) => x.injury >= 4 && ovr(x) > 75)); return j ? { jid: j.id } : null; },
      title: (c) => `Leczenie kontuzji: ${nm(J(c.jid))}`,
      text: (c) => `Lekarze przedstawili opcje leczenia ${nm(J(c.jid))} (przewidywana przerwa: ${Math.ceil(J(c.jid).injury)} tyg.).`,
      choices: [
        { t: 'Zabieg w klinice za granicą', hint: '−60 tys. €, przerwa o połowę krótsza', cost: () => 60000, fx: (c) => { const j = J(c.jid); money(-60000, 'Leczenie: ' + nm(j)); j.injury = Math.ceil(j.injury / 2); return 'Zabieg się udał – powrót znacznie szybciej.'; } },
        { t: 'Standardowa rehabilitacja', hint: 'bez kosztów', fx: () => 'Zawodnik przechodzi rehabilitację zgodnie z planem.' },
        { t: 'Przyspieszony powrót', hint: 'przerwa −60%, ryzyko nawrotu', fx: (c) => { const j = J(c.jid); j.injury = Math.ceil(j.injury * 0.4); if (chance(0.35)) schedule('reinjury', j.injury + U.randInt(2, 5), { jid: j.id }); return 'Zawodnik wraca szybciej niż zakładano…'; } },
      ],
    },
    {
      id: 'reinjury', cat: 'zawodnicy', w: 0, followup: true,
      when: (c) => (J(c.jid) ? c : null),
      title: (c) => `Nawrót kontuzji: ${nm(J(c.jid))}`,
      text: (c) => `Zbyt szybki powrót się zemścił – uraz ${nm(J(c.jid))} odnowił się na treningu.`,
      auto: (c) => { const j = J(c.jid); injure(j, U.randInt(4, 9)); morale(j, -10); return `Przerwa potrwa ok. ${Math.ceil(j.injury)} tygodni.`; },
    },
    {
      id: 'teammates_conflict', cat: 'zawodnicy', w: 5, phase: 'season',
      when: () => { const a = group('A'); if (a.length < 3) return null; const x = U.shuffle(a.slice()); return { a: x[0].id, b: x[1].id }; },
      title: () => 'Konflikt w kadrze A',
      text: (c) => `${nm(J(c.a))} i ${nm(J(c.b))} pokłócili się o kolejność w składzie drużyny. Atmosfera w pokoju hotelowym jest napięta.`,
      choices: [
        { t: 'Rozdzielić ich na zgrupowaniach', hint: '−5 tys. €', cost: () => 5000, fx: (c) => { money(-5000, 'Dodatkowe pokoje'); return 'Napięcie opadło, choć problem nie zniknął.'; } },
        { t: 'Wspólny wyjazd integracyjny', hint: '−30 tys. €, morale kadry A +, forma +', cost: () => 30000, fx: () => { money(-30000, 'Wyjazd integracyjny kadry A'); group('A').forEach((x) => { morale(x, 8); form(x, 1); }); return 'Wspólny rafting i grill zbliżyły zespół. Atmosfera wyraźnie lepsza.'; } },
        { t: `Stanąć po stronie jednego z nich`, hint: 'jeden morale ++, drugi −−', fx: (c) => { const [w, l] = ovr(J(c.a)) >= ovr(J(c.b)) ? [J(c.a), J(c.b)] : [J(c.b), J(c.a)]; morale(w, 10); morale(l, -15); return `Poparłeś ${nm(w)}. ${nm(l)} czuje się pominięty.`; } },
      ],
    },
    {
      id: 'talent_other_sport', cat: 'młodzież', w: 5, phase: 'any', cd: 30,
      when: () => ({ sport: pick(OTHER_SPORTS), age: U.randInt(14, 16) }),
      title: () => 'Talent z innej dyscypliny',
      text: (c) => `Koordynator szkolenia zauważył ${c.age}-latka trenującego ${c.sport}. Doskonała koordynacja i odwaga – mógłby zostać świetnym skoczkiem.`,
      choices: [
        { t: 'Zainwestować w indywidualny program', hint: '−30 tys. €, nowy junior z dużym potencjałem', cost: () => 30000, fx: (c) => { money(-30000, 'Program dla talentu'); const j = W.genJumper(st().nation, Math.max(15, c.age), 82, 5); j.group = 'R'; st().jumpers[j.id] = j; return `${nm(j)} rozpoczyna treningi na skoczni! Znajdziesz go w kadrze (kluby).`; } },
        { t: 'Zaprosić na testy bez zobowiązań', hint: '50% – dołączy z mniejszym potencjałem', fx: (c) => { if (chance(0.5)) { const j = W.genJumper(st().nation, Math.max(15, c.age), 74, 7); j.group = 'R'; st().jumpers[j.id] = j; return `${nm(j)} spróbował i został przy skokach.`; } return 'Chłopak wybrał jednak swoją dyscyplinę.'; } },
        { t: 'Nie angażować się', hint: 'brak efektu', fx: () => 'Temat zamknięty.' },
      ],
    },
    {
      id: 'personal_coach', cat: 'zawodnicy', w: 4, phase: 'any',
      when: () => { const j = pick(group('A').filter((x) => age(x) >= 24)); return j ? { jid: j.id } : null; },
      title: (c) => `${nm(J(c.jid))} chce trenera osobistego`,
      text: (c) => `${nm(J(c.jid))} chciałby część treningów realizować z osobistym trenerem spoza kadry. Inni zawodnicy pytają, czy też tak mogą.`,
      choices: [
        { t: 'Zgodzić się', hint: 'cechy +, morale ++, reszta kadry morale −, zarząd −', fx: (c) => { const j = J(c.jid); attrsAll(j, 0.6); morale(j, 12); group('A').filter((x) => x.id !== j.id).forEach((x) => morale(x, -3)); board(-2); return 'Zawodnik trenuje po swojemu – i na razie przynosi to efekty.'; } },
        { t: 'Odmówić – wszyscy trenują w systemie', hint: 'morale −−', fx: (c) => { morale(J(c.jid), -12); return 'Zawodnik podporządkował się, ale jest rozgoryczony.'; } },
      ],
    },
    {
      id: 'weight_issue', cat: 'zawodnicy', w: 4, phase: 'season',
      when: () => { const j = pick(group('A')); return j ? { jid: j.id } : null; },
      title: (c) => `Problem z wagą: ${nm(J(c.jid))}`,
      text: (c) => `Kontrola BMI wykazała, że ${nm(J(c.jid))} jest na granicy normy. Grozi mu obowiązek skakania na krótszych nartach.`,
      choices: [
        { t: 'Zatrudnić dietetyka', hint: '−15 tys. €, motoryka −, bez ryzyka', cost: () => 15000, fx: (c) => { money(-15000, 'Dietetyk kadry'); attr(J(c.jid), 'power', -0.8); return 'Waga wróciła do normy pod okiem specjalisty.'; } },
        { t: 'Zostawić to zawodnikowi', hint: 'ryzyko dyskwalifikacji', fx: (c) => { if (chance(0.45)) { mod('dsq', 1.0, 4, 'Problemy z wagą/sprzętem'); return 'Zawodnik nie poradził sobie sam – w najbliższych konkursach ryzyko dyskwalifikacji jest wyższe.'; } return 'Zawodnik sam zadbał o dietę.'; } },
      ],
    },
    {
      id: 'tv_show', cat: 'media', w: 5, phase: 'any',
      when: () => { const j = pick(group('A').filter((x) => x.season.podiums > 0 || ovr(x) > 88)); return j ? { jid: j.id } : null; },
      title: (c) => `${nm(J(c.jid))} zaproszony do programu rozrywkowego`,
      text: (c) => `Popularna stacja telewizyjna chce, by ${nm(J(c.jid))} wziął udział w kilku odcinkach programu rozrywkowego. To duża promocja dyscypliny, ale też dodatkowe obowiązki.`,
      choices: [
        { t: 'Zgodzić się', hint: '+25 tys. €, popularność ++, zmęczenie +, forma −', fx: (c) => { const j = J(c.jid); money(25000, 'Udział w programie TV'); pop(3); fatigue(j, 15); form(j, -1.5); return 'Program bije rekordy oglądalności!'; } },
        { t: 'Odmówić – sezon jest najważniejszy', hint: 'morale −', fx: (c) => { morale(J(c.jid), -4); return 'Zawodnik skupia się na skakaniu.'; } },
      ],
    },
    {
      id: 'motivation_low', cat: 'zawodnicy', w: 5, phase: 'season',
      when: () => { const j = pick(my().filter((x) => x.morale < 35 && (x.group === 'A' || x.group === 'B'))); return j ? { jid: j.id } : null; },
      title: (c) => `${nm(J(c.jid))} stracił motywację`,
      text: (c) => `Psycholog alarmuje: ${nm(J(c.jid))} jest przygnębiony i nie widzi sensu w treningach.`,
      choices: [
        { t: 'Intensywna praca z psychologiem', hint: '−10 tys. €, morale ++ (zależnie od psychologa)', cost: () => 10000, fx: (c) => { money(-10000, 'Sesje psychologiczne'); const q = staff('psych') ? staff('psych').quality : 30; morale(J(c.jid), 10 + q / 5); attr(J(c.jid), 'mental', 0.5); return 'Sesje przynoszą efekty – zawodnik odzyskuje radość ze skakania.'; } },
        { t: 'Dać mu dwa tygodnie wolnego', hint: 'zmęczenie 0, morale +, forma −', fx: (c) => { const j = J(c.jid); fatigue(j, -100); morale(j, 12); form(j, -1); return 'Zawodnik wyjechał z rodziną w góry – wróci wypoczęty.'; } },
        { t: 'Zagrozić przesunięciem do niższej kadry', hint: 'ryzykowne: bodziec albo załamanie', fx: (c) => { const j = J(c.jid); if (chance(0.5)) { morale(j, 12); form(j, 2); return 'Zadziałało jak zimny prysznic – zawodnik wziął się do pracy.'; } morale(j, -15); return 'To był błąd – zawodnik całkiem się zamknął w sobie.'; } },
      ],
    },
    {
      id: 'junior_promotion', cat: 'młodzież', w: 5, phase: 'season',
      when: () => { const j = pick(my().filter((x) => x.group === 'J' && ovr(x) >= 80)); return j ? { jid: j.id } : null; },
      title: (c) => `${nm(J(c.jid))} puka do kadry A`,
      text: (c) => `Junior ${nm(J(c.jid))} (${age(J(c.jid))} l., ocena ${Math.round(ovr(J(c.jid)))}) świetnie spisuje się na treningach i prosi o szansę w Pucharze Świata.`,
      choices: [
        { t: 'Awansować do kadry A', hint: 'morale ++, trener główny', fx: (c) => { const err = M.setGroup(c.jid, 'A'); if (err) return 'Kadra A jest pełna – musisz najpierw zwolnić miejsce (zakładka Kadra).'; morale(J(c.jid), 15); return 'Junior dołącza do kadry A!'; } },
        { t: 'Jeszcze nie teraz', hint: 'morale −', fx: (c) => { morale(J(c.jid), -5); return 'Junior zostaje w kadrze juniorów – jego czas przyjdzie.'; } },
      ],
    },
    {
      id: 'flu_wave', cat: 'zdrowie', w: 4, phase: 'season', cd: 22,
      when: () => (healthy(my().filter((x) => x.group === 'A' || x.group === 'B')).length >= 5 ? {} : null),
      title: () => 'Grypa w kadrze',
      text: () => 'Kilku zawodników ma gorączkę. Lekarz kadry sugeruje izolację chorych, ale przed nami ważne konkursy.',
      choices: [
        { t: 'Izolacja i odpoczynek', hint: 'chorzy pauzują 1 tydzień', fx: () => { const sick = U.shuffle(healthy(my().filter((x) => x.group === 'A' || x.group === 'B'))).slice(0, 3); sick.forEach((x) => { injure(x, 1); fatigue(x, -10); }); return `Pauzują: ${sick.map(nm).join(', ')}. Wirus nie rozprzestrzenił się dalej.`; } },
        { t: 'Leczyć i startować', hint: 'forma chorych −, ryzyko kolejnych zachorowań', fx: () => { const pool = healthy(my().filter((x) => x.group === 'A' || x.group === 'B')); const sick = U.shuffle(pool.slice()).slice(0, chance(0.4) ? 5 : 3); sick.forEach((x) => { form(x, -3); fatigue(x, 20); }); return `Osłabieni zawodnicy (${sick.map(nm).join(', ')}) wystartują, ale ich forma ucierpi.`; } },
      ],
    },
    {
      id: 'lost_luggage', cat: 'zawody', w: 4, phase: 'season',
      when: () => { const w = upcoming(); if (!w || !w.events.some((e) => e.level === 'WC' || ['WCH', 'OWG', 'SFWC'].includes(e.level))) return null; const j = pick(healthy(group('A'))); return j ? { jid: j.id } : null; },
      title: () => 'Zaginiony bagaż ze sprzętem',
      text: (c) => `Linia lotnicza zgubiła pokrowiec z nartami ${nm(J(c.jid))}. Do konkursu zostało kilka dni.`,
      choices: [
        { t: 'Kupić i dopasować nowy komplet', hint: '−20 tys. €', cost: () => 20000, fx: () => { money(-20000, 'Awaryjny zakup nart'); return 'Serwismeni pracowali całą noc – sprzęt gotowy.'; } },
        { t: 'Skakać na zapasowych nartach', hint: 'forma zawodnika −', fx: (c) => { form(J(c.jid), -2.5); morale(J(c.jid), -4); return 'Zapasowe narty nie są idealne…'; } },
      ],
    },
    {
      id: 'exam_session', cat: 'zawodnicy', w: 3, phase: 'season',
      when: () => { const j = pick(my().filter((x) => age(x) >= 19 && age(x) <= 24 && (x.group === 'A' || x.group === 'B'))); return j ? { jid: j.id } : null; },
      title: (c) => `Sesja egzaminacyjna: ${nm(J(c.jid))}`,
      text: (c) => `${nm(J(c.jid))} studiuje i właśnie trwa sesja. Uczelnia nie chce przesunąć egzaminów.`,
      choices: [
        { t: 'Pozwolić mu zdawać egzaminy', hint: 'zmęczenie +, morale +', fx: (c) => { fatigue(J(c.jid), 15); morale(J(c.jid), 8); return 'Zawodnik zdał wszystkie egzaminy!'; } },
        { t: 'Interweniować u rektora', hint: 'zarząd −, 70% przesunięcia', fx: (c) => { board(-1); if (chance(0.7)) { morale(J(c.jid), 5); return 'Uczelnia zgodziła się przesunąć egzaminy.'; } fatigue(J(c.jid), 15); return 'Rektor odmówił.'; } },
      ],
    },
    {
      id: 'viral_video', cat: 'media', w: 3, phase: 'any',
      when: () => { const j = pick(my().filter((x) => x.group === 'A' || x.group === 'J')); return j ? { jid: j.id } : null; },
      title: (c) => `Viral w sieci: ${nm(J(c.jid))}`,
      text: (c) => `Nagranie, na którym ${nm(J(c.jid))} uczy dzieci telemarku, obejrzało kilka milionów osób.`,
      auto: (c) => { pop(2); morale(J(c.jid), 6); return 'Popularność skoków rośnie.'; },
    },

    // ===================== SZTAB =====================
    {
      id: 'coach_raise', cat: 'sztab', w: 5, phase: 'any', cd: 30,
      when: () => { const r = pick(['coachA', 'coachB', 'tech', 'physio'].filter((x) => staff(x) && staff(x).quality >= 55)); return r ? { role: r } : null; },
      title: (c) => `${sName(staff(c.role))} żąda podwyżki`,
      text: (c) => `${SJM.STAFF_ROLES[c.role].name} ${sName(staff(c.role))} oczekuje podwyżki o 20% (obecnie ${k(staff(c.role).salary)} rocznie). W przeciwnym razie rozważy oferty z zagranicy.`,
      choices: [
        { t: 'Zgodzić się', hint: 'pensja +20%', fx: (c) => { const x = staff(c.role); x.salary = Math.round(x.salary * 1.2 / 1000) * 1000; return 'Umowa aneksowana – zadowolony pracownik zostaje.'; } },
        { t: 'Negocjować +10%', hint: '65% zgody, inaczej odejdzie', fx: (c) => { const x = staff(c.role); if (chance(0.65)) { x.salary = Math.round(x.salary * 1.1 / 1000) * 1000; return 'Kompromis osiągnięty.'; } return `${sName(x)} odchodzi z federacji. ${staffLeaves(c.role)}`; } },
        { t: 'Odmówić', hint: '45% że odejdzie', fx: (c) => { const x = staff(c.role); if (chance(0.45)) return `${sName(x)} przyjął ofertę z zagranicy. ${staffLeaves(c.role, false)}`; return 'Został, choć jest niezadowolony.'; } },
      ],
    },
    {
      id: 'coach_poach', cat: 'sztab', w: 4, phase: 'summer', cd: 30,
      when: () => { const r = pick(['coachA', 'coachB', 'coachJ', 'tech'].filter((x) => staff(x) && staff(x).quality >= 68)); return r ? { role: r, nat: strongerNation() } : null; },
      title: (c) => `${natName(c.nat)} chce podkupić ${sName(staff(c.role))}`,
      text: (c) => `Federacja (${natName(c.nat)}) złożyła ofertę naszemu specjaliście (${SJM.STAFF_ROLES[c.role].name}). Oferują wyraźnie wyższą pensję.`,
      choices: [
        { t: 'Kontroferta (+25% pensji)', hint: 'zostaje, wyższe koszty', fx: (c) => { const x = staff(c.role); x.salary = Math.round(x.salary * 1.25 / 1000) * 1000; return 'Specjalista zostaje u nas.'; } },
        { t: 'Puścić za odstępne', hint: '+ odstępne, stanowisko wolne', fx: (c) => { const x = staff(c.role); const fee = Math.round(x.salary * 0.8); money(fee, 'Odstępne za ' + sName(x)); return `Otrzymujemy ${k(fee)} odstępnego. ${staffLeaves(c.role, false)}`; } },
        { t: 'Odwołać się do lojalności', hint: '50/50', fx: (c) => { if (chance(0.5)) return 'Lojalność zwyciężyła – zostaje bez podwyżki!'; return `Niestety, odszedł. ${staffLeaves(c.role, false)}`; } },
      ],
    },
    {
      id: 'new_method', cat: 'sztab', w: 5, phase: 'any',
      when: () => ({ method: pick(['analizę biomechaniczną z czujnikami', 'trening w wirtualnej rzeczywistości', 'nowy system pomiaru siły odbicia', 'metodę treningu oddechowego']) }),
      title: () => 'Nowa metoda treningowa',
      text: (c) => `Asystenci proponują wprowadzenie: ${c.method}. Wymaga to inwestycji i przestawienia planów.`,
      choices: [
        { t: 'Wdrożyć', hint: '−40 tys. €, 70%: trening +8% przez 12 tyg.', cost: () => 40000, fx: () => { money(-40000, 'Wdrożenie nowej metody'); if (chance(0.7)) { mod('train', 0.08, 12, 'Nowa metoda treningowa'); return 'Metoda się sprawdza – zawodnicy robią szybsze postępy.'; } mod('train', -0.04, 4, 'Nieudany eksperyment'); return 'Eksperyment się nie powiódł i zaburzył cykl treningowy.'; } },
        { t: 'Zostać przy sprawdzonych metodach', hint: 'brak efektu', fx: () => 'Plan treningowy bez zmian.' },
      ],
    },
    {
      id: 'physio_overload', cat: 'zdrowie', w: 4, phase: 'season',
      when: () => (my().filter((x) => x.injury > 0).length >= 2 || my().filter((x) => x.fatigue > 55).length >= 4 ? {} : null),
      title: () => 'Fizjoterapeuci przeciążeni',
      text: () => 'Sztab medyczny nie nadąża – wielu zawodników jest zmęczonych lub kontuzjowanych.',
      choices: [
        { t: 'Zatrudnić dodatkowego fizjoterapeutę na sezon', hint: '−35 tys. €, ryzyko kontuzji −25% (15 tyg.)', cost: () => 35000, fx: () => { money(-35000, 'Dodatkowy fizjoterapeuta'); mod('injury', -0.25, 15, 'Wzmocniony sztab medyczny'); my().forEach((x) => fatigue(x, -8)); return 'Zawodnicy są pod lepszą opieką.'; } },
        { t: 'Poradzimy sobie', hint: 'ryzyko kontuzji +20% (8 tyg.)', fx: () => { mod('injury', 0.2, 8, 'Przeciążony sztab medyczny'); return 'Sztab pracuje ponad siły…'; } },
      ],
    },
    {
      id: 'suit_innovation', cat: 'sprzęt', w: 4, phase: 'any', cd: 30,
      when: () => (staff('tech') ? {} : null),
      title: () => 'Innowacja w kombinezonach',
      text: () => `Serwismen ${sName(staff('tech'))} opracował nowy krój kombinezonu, który – jak twierdzi – mieści się w przepisach i daje przewagę w locie.`,
      choices: [
        { t: 'Wdrożyć', hint: '−50 tys. €, sprzęt + (20 tyg.), ryzyko kontroli FIS', cost: () => 50000, fx: () => { money(-50000, 'Nowe kombinezony'); if (chance(0.82)) { mod('equip', 0.6, 20, 'Nowe kombinezony'); return 'Kombinezony przeszły kontrolę – zawodnicy czują różnicę w locie.'; } mod('dsq', 2.0, 3, 'Kombinezony pod lupą FIS'); board(-4); return 'FIS zakwestionował krój! Przez najbliższe tygodnie grożą nam dyskwalifikacje.'; } },
        { t: 'Nie ryzykować', hint: 'brak efektu', fx: () => 'Zostajemy przy dotychczasowym sprzęcie.' },
      ],
    },
    {
      id: 'staff_conflict', cat: 'sztab', w: 3, phase: 'any',
      when: () => (staff('coachA') && staff('coachB') ? {} : null),
      title: () => 'Spór trenerów',
      text: () => `${sName(staff('coachA'))} (kadra A) i ${sName(staff('coachB'))} (kadra B) nie mogą się porozumieć co do kryteriów przesunięć między kadrami.`,
      choices: [
        { t: 'Mediacja z psychologiem biznesu', hint: '−10 tys. €', cost: () => 10000, fx: () => { money(-10000, 'Mediacje w sztabie'); return 'Trenerzy wypracowali wspólne zasady.'; } },
        { t: 'Rozstrzygnąć na korzyść trenera głównego', hint: 'trening kadry B −', fx: () => { mod('train', -0.02, 6, 'Zniechęcony trener kadry B'); return 'Trener kadry B czuje się zlekceważony.'; } },
        { t: 'Zignorować', hint: 'trening −4% (6 tyg.)', fx: () => { mod('train', -0.04, 6, 'Konflikt w sztabie'); return 'Konflikt się tli…'; } },
      ],
    },
    {
      id: 'legend_mentor', cat: 'sztab', w: 3, phase: 'any', cd: 40,
      when: () => ({}),
      title: () => 'Legenda chce pomóc kadrze',
      text: () => 'Były mistrz świata, legenda narodowych skoków, oferuje bezpłatną pomoc jako mentor młodych zawodników. Ma jednak bardzo wyraziste poglądy i lubi media.',
      choices: [
        { t: 'Przyjąć pomoc', hint: 'psychika kadr +, popularność +, ryzyko medialnych sporów', fx: () => { my().filter((x) => x.group === 'A' || x.group === 'J').forEach((x) => attr(x, 'mental', 1.2)); pop(2); if (chance(0.3)) { board(-3); return 'Mentor pomaga, ale jego wywiady krytykujące federację irytują zarząd.'; } return 'Zawodnicy chłoną wiedzę mistrza.'; } },
        { t: 'Grzecznie odmówić', hint: 'popularność −', fx: () => { pop(-1); return 'Legenda nie kryje rozczarowania w mediach.'; } },
      ],
    },

    // ===================== SPONSORZY / FINANSE =====================
    {
      id: 'new_sponsor', cat: 'sponsorzy', w: 5, phase: 'summer', cd: 30,
      when: () => { const target = Math.max(1, (P().expectation ? P().expectation.nc : 6)); return { amount: Math.round(P().grant * U.randInt(6, 12) / 100 / 10000) * 10000, target }; },
      title: () => 'Nowy sponsor z warunkami',
      text: (c) => `Duża firma oferuje ${k(c.amount)} wsparcia na ten sezon, pod warunkiem zajęcia co najmniej ${c.target}. miejsca w Pucharze Narodów. W razie porażki zażąda zwrotu połowy kwoty.`,
      choices: [
        { t: 'Podpisać umowę', hint: `pieniądze teraz, rozliczenie po sezonie`, fx: (c) => { money(c.amount, 'Sponsor (umowa warunkowa)'); atSeasonEnd('sponsor_contract', c); return 'Umowa podpisana. Teraz trzeba dowieźć wynik.'; } },
        { t: 'Odrzucić', hint: 'brak ryzyka', fx: () => 'Bezpieczniej bez zobowiązań.' },
      ],
    },
    {
      id: 'sponsor_leaving', cat: 'sponsorzy', w: 5, phase: 'any', cd: 30,
      when: () => (P().board < 50 || (hasPts() && P().expectation && myRank() > P().expectation.nc + 1) ? {} : null),
      title: () => 'Sponsor generalny traci cierpliwość',
      text: () => 'Po słabych wynikach główny sponsor rozważa wycofanie się ze współpracy.',
      choices: [
        { t: 'Spotkanie i rabat na świadczenia', hint: 'sponsorzy −8% (20 tyg.)', fx: () => { mod('sponsor', -0.08, 20, 'Renegocjowana umowa sponsora'); return 'Sponsor zostaje na gorszych dla nas warunkach.'; } },
        { t: 'Obiecać poprawę wyników', hint: 'zarząd ocenia obietnicę po sezonie', fx: () => { const e = P().expectation; atSeasonEnd('board_promise', { target: e ? e.nc : 6 }); return 'Sponsor daje nam kredyt zaufania. Zarząd rozliczy tę obietnicę.'; } },
        { t: 'Pozwolić odejść i szukać nowego', hint: 'sponsorzy −25% (25 tyg.)', fx: () => { mod('sponsor', -0.25, 25, 'Odejście sponsora generalnego'); return 'Sponsor odchodzi. Szukamy następcy.'; } },
      ],
    },
    {
      id: 'ministry_youth_grant', cat: 'infrastruktura', w: 4, phase: 'any', cd: 40,
      when: () => ({}),
      title: () => 'Dotacja celowa z ministerstwa',
      text: () => 'Ministerstwo sportu proponuje sfinansowanie budowy małej skoczni dla dzieci (K-40). Warunek: obiekt w miejscowości wskazanej przez samorząd.',
      choices: [
        { t: 'Przyjąć dotację', hint: 'darmowa budowa skoczni K-40', fx: () => { const err = (() => { money(SJM.HILL_TYPES.small.cost, 'Dotacja ministerstwa'); return M.buildHill('small', M.randomHillCity()); })(); return err ? 'Coś poszło nie tak: ' + err : 'Rozpoczęto budowę nowej skoczni dla dzieci.'; } },
        { t: 'Odmówić', hint: 'brak efektu', fx: () => 'Dotacja trafi do innego związku.' },
      ],
    },
    {
      id: 'tv_rights', cat: 'media', w: 4, phase: 'summer',
      when: () => ({ amount: Math.round((50000 + P().popularity * 3000) / 10000) * 10000 }),
      title: () => 'Prawa telewizyjne',
      text: (c) => `Platforma streamingowa oferuje ${k(c.amount)} za wyłączność na transmisje mistrzostw kraju i materiały zza kulis. Transmisje będą jednak płatne dla kibiców.`,
      choices: [
        { t: 'Sprzedać prawa', hint: 'pieniądze, popularność −', fx: (c) => { money(c.amount, 'Prawa TV'); pop(-2); return 'Umowa podpisana.'; } },
        { t: 'Zostać przy telewizji publicznej', hint: 'popularność +', fx: () => { pop(1); return 'Kibice oglądają za darmo.'; } },
      ],
    },
    {
      id: 'crowdfunding', cat: 'kibice', w: 3, phase: 'any', cd: 30,
      when: () => (P().budget < P().grant * 0.15 ? {} : null),
      title: () => 'Kibice chcą zrzutki',
      text: () => 'Stowarzyszenie kibiców proponuje zbiórkę internetową na wyjazdy juniorów.',
      choices: [
        { t: 'Poprzeć zbiórkę', hint: 'pieniądze zależne od popularności', fx: () => { const v = Math.round(P().popularity * 900 / 1000) * 1000; money(v, 'Zbiórka kibiców'); pop(1); return `Zebrano ${k(v)}!`; } },
        { t: 'Podziękować – to nie wypada', hint: 'zarząd +', fx: () => { board(1); return 'Zarząd uważa, że federacja powinna sama finansować szkolenie.'; } },
      ],
    },
    {
      id: 'betting_sponsor', cat: 'sponsorzy', w: 3, phase: 'any', cd: 40,
      when: () => ({ amount: Math.round(P().grant * 0.05 / 10000) * 10000 + 50000 }),
      title: () => 'Oferta bukmachera',
      text: (c) => `Firma bukmacherska oferuje ${k(c.amount)} za logo na kombinezonach treningowych. Część środowiska uważa to za kontrowersyjne.`,
      choices: [
        { t: 'Przyjąć', hint: 'pieniądze, zarząd −, popularność −', fx: (c) => { money(c.amount, 'Sponsor – bukmacher'); board(-4); pop(-2); return 'Pieniądze na koncie, ale media krytykują decyzję.'; } },
        { t: 'Odrzucić', hint: 'zarząd +', fx: () => { board(2); return 'Zarząd docenia wizerunkowe podejście.'; } },
      ],
    },
    {
      id: 'budget_cut', cat: 'finanse', w: 3, phase: 'summer', cd: 40,
      when: () => ({ pct: U.randInt(4, 8) }),
      title: () => 'Cięcia w budżecie państwa',
      text: (c) => `Ministerstwo zapowiada obniżkę dotacji dla związków sportowych o ${c.pct}%.`,
      choices: [
        { t: 'Przyjąć cięcia', hint: 'dotacja −', fx: (c) => { P().grant = Math.round(P().grant * (1 - c.pct / 100) / 1000) * 1000; return 'Dotacja obniżona.'; } },
        { t: 'Lobbować w ministerstwie', hint: '−15 tys. €, 50% uniknięcia cięć', cost: () => 15000, fx: (c) => { money(-15000, 'Lobbing'); if (chance(0.5)) return 'Udało się obronić budżet skoków!'; P().grant = Math.round(P().grant * (1 - c.pct / 100) / 1000) * 1000; return 'Lobbing nic nie dał – dotacja obniżona.'; } },
        { t: 'Zaoszczędzić na zgrupowaniach zamiast tego', hint: 'trening −5% (15 tyg.), dotacja bez zmian', fx: () => { mod('train', -0.05, 15, 'Okrojone zgrupowania'); return 'Federacja zgłosiła własny plan oszczędności – dotacja pozostaje.'; } },
      ],
    },
    {
      id: 'podium_bonus', cat: 'sponsorzy', w: 4, phase: 'season', cd: 30,
      when: () => (group('A').some((x) => ovr(x) > 88) ? { amount: U.randInt(2, 5) * 5000 } : null),
      title: () => 'Premia za podia',
      text: (c) => `Producent sprzętu proponuje ${k(c.amount)} premii za każde podium w Pucharze Świata do końca sezonu – w zamian za logo na kaskach.`,
      choices: [
        { t: 'Przyjąć', hint: 'premia za każde podium', fx: (c) => { mod('podiumBonus', c.amount, 30, 'Premia sponsora za podia'); return 'Teraz każde podium to dodatkowe pieniądze.'; } },
        { t: 'Odrzucić (kolizja z obecnym sponsorem)', hint: 'brak efektu', fx: () => 'Bez zmian.' },
      ],
    },
    {
      id: 'apparel_deal', cat: 'sprzęt', w: 3, phase: 'summer', cd: 40,
      when: () => ({ amount: U.randInt(8, 20) * 10000 }),
      title: () => 'Nowy dostawca kombinezonów',
      text: (c) => `Nowa firma chce zostać dostawcą materiałów na kombinezony i płaci ${k(c.amount)}. Ich materiał nie był jednak testowany w Pucharze Świata.`,
      choices: [
        { t: 'Zmienić dostawcę', hint: 'pieniądze, sprzęt niepewny', fx: (c) => { money(c.amount, 'Umowa z dostawcą kombinezonów'); if (chance(0.5)) { mod('equip', 0.3, 20, 'Dobry materiał kombinezonów'); return 'Materiał okazał się świetny!'; } mod('equip', -0.4, 20, 'Słabszy materiał kombinezonów'); return 'Materiał jest gorszy od poprzedniego…'; } },
        { t: 'Zostać przy sprawdzonym', hint: 'brak efektu', fx: () => 'Bez zmian.' },
      ],
    },

    // ===================== INFRASTRUKTURA =====================
    {
      id: 'storm_damage', cat: 'infrastruktura', w: 4, phase: 'any',
      when: () => { const h = pick(bigHills()); return h ? { hid: h.id } : null; },
      title: (c) => `Wichura uszkodziła skocznię`,
      text: (c) => `Silny wiatr zerwał siatki ochronne i uszkodził tory najazdowe na skoczni ${hill(c.hid).name} (${hill(c.hid).city}).`,
      choices: [
        { t: 'Natychmiastowa naprawa', hint: 'koszt, stan bez zmian', cost: (c) => Math.round(SJM.HILL_TYPES[hill(c.hid).type].cost * 0.04), fx: (c) => { const h = hill(c.hid); const v = Math.round(SJM.HILL_TYPES[h.type].cost * 0.04); money(-v, 'Naprawa ' + h.name); return 'Ekipy naprawiły szkody w kilka dni.'; } },
        { t: 'Naprawić w ramach bieżącego utrzymania', hint: 'stan skoczni −25%', fx: (c) => { const h = hill(c.hid); h.condition = Math.max(0, h.condition - 25); return `Stan techniczny skoczni spadł do ${Math.round(h.condition)}%.`; } },
      ],
    },
    {
      id: 'lift_breakdown', cat: 'infrastruktura', w: 3, phase: 'any',
      when: () => { const h = pick(bigHills()); return h ? { hid: h.id } : null; },
      title: () => 'Awaria wyciągu',
      text: (c) => `Na skoczni ${hill(c.hid).name} zepsuł się wyciąg – zawodnicy wchodzą na górę pieszo.`,
      choices: [
        { t: 'Pilna naprawa', hint: '−35 tys. €', cost: () => 35000, fx: () => { money(-35000, 'Naprawa wyciągu'); return 'Wyciąg działa.'; } },
        { t: 'Poczekać na części', hint: 'trening −5% (5 tyg.)', fx: () => { mod('train', -0.05, 5, 'Awaria wyciągu'); return 'Treningi są krótsze i bardziej męczące.'; } },
      ],
    },
    {
      id: 'local_cofinance', cat: 'infrastruktura', w: 4, phase: 'any', cd: 30,
      when: () => { const h = pick(anyHill().filter((x) => x.condition < 80 && !M.hillProjectBusy(x.id))); return h ? { hid: h.id } : null; },
      title: () => 'Samorząd chce współfinansować modernizację',
      text: (c) => `Władze miasta ${hill(c.hid).city} oferują pokrycie połowy kosztów modernizacji skoczni ${hill(c.hid).name}.`,
      choices: [
        { t: 'Przyjąć i rozpocząć modernizację', hint: 'połowa kosztów', fx: (c) => { const h = hill(c.hid); const full = Math.round(SJM.HILL_TYPES[h.type].cost * 0.22 * (1 - h.condition / 200)); money(Math.round(full / 2), 'Dofinansowanie samorządu'); const err = M.modernize(h.id); return err ? 'Nie udało się rozpocząć: ' + err : 'Modernizacja ruszyła!'; } },
        { t: 'Odłożyć na później', hint: 'brak efektu', fx: () => 'Oferta przepadła.' },
      ],
    },
    {
      id: 'snow_shortage', cat: 'infrastruktura', w: 6, phase: 'season', cd: 15,
      when: () => { const w = upcoming(); if (!w) return null; const e = w.events.find((x) => M.hostNationOf(x.hill) === st().nation && x.level !== 'NAT'); return e ? { eid: e.id, level: e.level } : null; },
      title: () => 'Brak śniegu przed zawodami u nas!',
      text: (c) => `Odwilż zagraża zawodom (${SJM.LEVELS[c.level].name}), które organizujemy w tym tygodniu. Kontrolerzy FIS czekają na decyzję.`,
      choices: [
        { t: 'Sprowadzić śnieg i lód z magazynów', hint: 'koszt zależny od rangi', cost: (c) => (c.level === 'WC' ? 120000 : 30000), fx: (c) => { money(-(c.level === 'WC' ? 120000 : 30000), 'Przygotowanie skoczni (śnieg)'); pop(1); return 'Skocznia gotowa – zawody się odbędą!'; } },
        { t: 'Odwołać zawody', hint: 'popularność −, zarząd −', fx: (c) => { const w = upcoming(); w.events = w.events.filter((e) => !(M.hostNationOf(e.hill) === st().nation && e.level === c.level)); pop(-3); board(-3); M.ensureNominations(); return 'Zawody odwołane. Kibice są rozczarowani.'; } },
      ],
    },
    {
      id: 'city_hill_project', cat: 'infrastruktura', w: 2, phase: 'summer', cd: 50,
      when: () => ({ city: M.randomHillCity() }),
      title: (c) => `${c.city} chce mieć skocznię`,
      text: (c) => `Miasto ${c.city} proponuje wspólną budowę średniej skoczni (K-70) – pokryje 40% kosztów.`,
      choices: [
        { t: 'Wchodzimy w to', hint: `koszt 60% budowy`, cost: () => Math.round(SJM.HILL_TYPES.medium.cost * 0.6), fx: (c) => { money(Math.round(SJM.HILL_TYPES.medium.cost * 0.4), 'Wkład miasta ' + c.city); const err = M.buildHill('medium', c.city); return err ? 'Błąd: ' + err : 'Budowa ruszyła!'; } },
        { t: 'Nie teraz', hint: 'brak efektu', fx: () => 'Projekt odłożony.' },
      ],
    },
    {
      id: 'neighbors_noise', cat: 'infrastruktura', w: 2, phase: 'any',
      when: () => { const h = pick(anyHill().filter((x) => x.lights)); return h ? { hid: h.id } : null; },
      title: () => 'Skargi mieszkańców',
      text: (c) => `Mieszkańcy okolic skoczni ${hill(c.hid).name} skarżą się na światła i hałas podczas wieczornych treningów.`,
      choices: [
        { t: 'Ograniczyć wieczorne treningi', hint: 'trening −3% (8 tyg.)', fx: () => { mod('train', -0.03, 8, 'Ograniczone treningi wieczorne'); return 'Mieszkańcy zadowoleni.'; } },
        { t: 'Ufundować ekrany i festyn', hint: '−15 tys. €, popularność +', cost: () => 15000, fx: () => { money(-15000, 'Festyn dla mieszkańców'); pop(1); return 'Festyn ocieplił relacje z sąsiadami.'; } },
        { t: 'Zignorować', hint: 'popularność −', fx: () => { pop(-1); return 'Sprawa trafiła do lokalnej prasy.'; } },
      ],
    },
    {
      id: 'igelit_wear', cat: 'infrastruktura', w: 3, phase: 'summer',
      when: () => { const h = pick(anyHill().filter((x) => x.igelit)); return h ? { hid: h.id } : null; },
      title: () => 'Zużyty igelit',
      text: (c) => `Igelit na skoczni ${hill(c.hid).name} jest mocno zużyty – zawodnicy skarżą się na nierówną nawierzchnię.`,
      choices: [
        { t: 'Wymienić nawierzchnię', hint: 'koszt', cost: (c) => Math.round(SJM.HILL_TYPES[hill(c.hid).type].cost * 0.06), fx: (c) => { const h = hill(c.hid); money(-Math.round(SJM.HILL_TYPES[h.type].cost * 0.06), 'Wymiana igelitu ' + h.name); h.condition = Math.min(100, h.condition + 5); return 'Nowy igelit położony.'; } },
        { t: 'Zdjąć igelit', hint: 'skocznia bez treningów latem', fx: (c) => { hill(c.hid).igelit = false; return 'Igelit usunięty – skocznia zimowa.'; } },
      ],
    },

    // ===================== MEDIA / KIBICE =====================
    {
      id: 'documentary', cat: 'media', w: 3, phase: 'summer', cd: 40,
      when: () => ({ amount: U.randInt(8, 15) * 10000 }),
      title: () => 'Serial dokumentalny o kadrze',
      text: (c) => `Platforma streamingowa chce nakręcić serial dokumentalny o kulisach pracy kadry. Oferują ${k(c.amount)}.`,
      choices: [
        { t: 'Zgodzić się', hint: 'pieniądze, popularność ++, morale kadry A −', fx: (c) => { money(c.amount, 'Serial dokumentalny'); pop(4); group('A').forEach((x) => morale(x, -4)); return 'Kamery towarzyszą kadrze na każdym kroku.'; } },
        { t: 'Odmówić', hint: 'spokój w kadrze', fx: () => 'Kadra pracuje w spokoju.' },
      ],
    },
    {
      id: 'fan_protest', cat: 'kibice', w: 5, phase: 'season', cd: 20,
      when: () => (hasPts() && P().expectation && myRank() >= P().expectation.nc + 2 ? {} : null),
      title: () => 'Kibice niezadowoleni',
      text: () => 'Po serii słabych wyników kibice protestują w mediach społecznościowych. Hasztag z żądaniem zmian jest na topie.',
      choices: [
        { t: 'Konferencja prasowa i plan naprawczy', hint: 'popularność +, zarząd +', fx: () => { pop(2); board(2); return 'Szczere wystąpienie uspokoiło nastroje.'; } },
        { t: 'Zrzucić winę na zawodników', hint: 'zarząd +, morale kadry −−', fx: () => { board(1); group('A').forEach((x) => morale(x, -10)); return 'Zawodnicy czują się zdradzeni.'; } },
        { t: 'Przeczekać', hint: 'popularność −', fx: () => { pop(-3); return 'Burza w mediach trwa.'; } },
      ],
    },
    {
      id: 'open_training', cat: 'kibice', w: 3, phase: 'summer', cd: 30,
      when: () => ({}),
      title: () => 'Dzień otwarty na skoczni',
      text: () => 'Marketing proponuje zorganizowanie dnia otwartego: autografy, pokazowe skoki, konkurs dla dzieci.',
      choices: [
        { t: 'Organizujemy!', hint: '−12 tys. €, popularność +, więcej talentów', cost: () => 12000, fx: () => { money(-12000, 'Dzień otwarty'); pop(2); P().youthBonus = (P().youthBonus || 0) + 1; return 'Tłumy dzieci na skoczni! Kilkoro z nich zapisało się do klubów.'; } },
        { t: 'Nie w tym roku', hint: 'brak efektu', fx: () => 'Może następnym razem.' },
      ],
    },
    {
      id: 'leak', cat: 'media', w: 3, phase: 'season', cd: 30,
      when: () => ({}),
      title: () => 'Przeciek z federacji',
      text: () => 'Dziennikarz opublikował wewnętrzną korespondencję o planach budżetowych federacji. Ktoś ze sztabu rozmawia z mediami.',
      choices: [
        { t: 'Wewnętrzne śledztwo', hint: 'zarząd +, morale sztabu −', fx: () => { board(2); mod('train', -0.02, 4, 'Atmosfera podejrzliwości'); return 'Atmosfera w sztabie jest napięta, ale zarząd docenia działania.'; } },
        { t: 'Zdementować i zapomnieć', hint: 'popularność −', fx: () => { pop(-1); return 'Sprawa przycichła.'; } },
      ],
    },

    // ===================== FIS / PRZEPISY / ZDROWIE =====================
    {
      id: 'suit_controls', cat: 'przepisy', w: 4, phase: 'season', cd: 30,
      when: () => ({}),
      title: () => 'FIS zaostrza kontrole sprzętu',
      text: () => 'Kontrolerzy FIS zapowiadają skanowanie 3D kombinezonów przed każdym konkursem.',
      choices: [
        { t: 'Zainwestować w własny skaner', hint: '−30 tys. €, ryzyko DSQ −60% (20 tyg.)', cost: () => 30000, fx: () => { money(-30000, 'Skaner kombinezonów'); mod('dsq', -0.6, 20, 'Własny skaner kombinezonów'); return 'Każdy kombinezon sprawdzamy przed oddaniem do kontroli.'; } },
        { t: 'Nic nie zmieniać', hint: 'ryzyko DSQ +50% (8 tyg.)', fx: () => { mod('dsq', 0.5, 8, 'Zaostrzone kontrole FIS'); return 'Liczymy, że nasi serwismeni dadzą radę.'; } },
      ],
    },
    {
      id: 'doping_test', cat: 'zdrowie', w: 2, phase: 'any', cd: 50,
      when: () => { const j = pick(my().filter((x) => x.group === 'A' || x.group === 'B')); return j ? { jid: j.id } : null; },
      title: (c) => `Kontrola antydopingowa: ${nm(J(c.jid))}`,
      text: (c) => `${nm(J(c.jid))} zażył lek na przeziębienie bez konsultacji z lekarzem kadry. Wynik kontroli wymaga wyjaśnień.`,
      choices: [
        { t: 'Zatrudnić prawnika i eksperta', hint: '−25 tys. €, sprawa wyjaśniona', cost: () => 25000, fx: (c) => { money(-25000, 'Obsługa prawna'); morale(J(c.jid), -3); return 'Komisja uznała wyjaśnienia – zawodnik oczyszczony.'; } },
        { t: 'Współpracować bez prawnika', hint: '70% oczyszczenia', fx: (c) => { const j = J(c.jid); if (chance(0.7)) return 'Sprawa wyjaśniona – zawodnik oczyszczony.'; suspend(j, 6); board(-6); pop(-3); return 'Zawodnik został zawieszony na 6 tygodni. Duży cios wizerunkowy.'; } },
      ],
    },
    {
      id: 'protest_dsq', cat: 'przepisy', w: 4, phase: 'season',
      when: () => {
        const s = st(); const prev = s.calendar.weeks[s.week - 1]; if (!prev) return null;
        for (const e of prev.events) { const r = s.results[e.id]; if (!r || r.type !== 'ind') continue; const d = r.ranking.find((x) => x.dsq && x.nat === s.nation); if (d) return { jid: d.id }; }
        return null;
      },
      title: (c) => `Dyskwalifikacja ${nm(J(c.jid))}`,
      text: (c) => `${nm(J(c.jid))} został zdyskwalifikowany za nieprzepisowy kombinezon. Zawodnik twierdzi, że pomiar był błędny.`,
      choices: [
        { t: 'Złożyć oficjalny protest', hint: '−5 tys. €, morale +, zarząd ±', cost: () => 5000, fx: (c) => { money(-5000, 'Opłata protestowa'); morale(J(c.jid), 6); if (chance(0.25)) { board(2); return 'FIS przyznał, że procedura miała usterki – wynik nie zostanie zmieniony, ale kontrolerzy dostali upomnienie.'; } return 'Protest odrzucony.'; } },
        { t: 'Przyjąć decyzję i wyciągnąć wnioski', hint: 'ryzyko DSQ −30% (10 tyg.)', fx: () => { mod('dsq', -0.3, 10, 'Lekcja po dyskwalifikacji'); return 'Serwismeni jeszcze dokładniej sprawdzają sprzęt.'; } },
      ],
    },
    // odwołanie konkursu z powodu wiatru: losowane dopiero w dniu zawodów (M.playWeek), nie z wyprzedzeniem

    // ===================== OBOZY / TRENING =====================
    {
      id: 'joint_camp', cat: 'trening', w: 4, phase: 'any', cd: 25,
      when: () => ({ nat: strongerNation() }),
      title: (c) => `Zaproszenie na wspólny obóz (${natName(c.nat)})`,
      text: (c) => `Kadra (${natName(c.nat)}) zaprasza nas na wspólne zgrupowanie. Możliwość podpatrzenia metod najlepszych.`,
      choices: [
        { t: 'Jedziemy', hint: '−35 tys. €, trening kadry +6% (6 tyg.), forma +', cost: () => 35000, fx: () => { money(-35000, 'Wspólny obóz'); mod('train', 0.06, 6, 'Wnioski ze wspólnego obozu'); group('A').forEach((x) => form(x, 1)); return 'Obóz był bardzo owocny.'; } },
        { t: 'Odmówić – mamy własny plan', hint: 'brak efektu', fx: () => 'Trenujemy po swojemu.' },
      ],
    },
    {
      id: 'altitude_camp', cat: 'trening', w: 4, phase: 'summer', cd: 25,
      when: () => ({}),
      title: () => 'Obóz wysokogórski',
      text: () => 'Trener przygotowania motorycznego proponuje trzytygodniowy obóz wysokogórski dla kadry A i B.',
      choices: [
        { t: 'Zorganizować', hint: '−60 tys. €, motoryka kadry A/B +', cost: () => 60000, fx: () => { money(-60000, 'Obóz wysokogórski'); my().filter((x) => x.group === 'A' || x.group === 'B').forEach((x) => attr(x, 'power', U.rand() * 1.5 + 0.5)); return 'Zawodnicy wrócili silniejsi.'; } },
        { t: 'Zrezygnować', hint: 'brak efektu', fx: () => 'Trening w kraju.' },
      ],
    },
    {
      id: 'wind_tunnel_rent', cat: 'trening', w: 4, phase: 'summer', cd: 25,
      when: () => (P().facilities.tunnel < 1 ? {} : null),
      title: () => 'Wynajem tunelu aerodynamicznego',
      text: () => 'Nie mamy własnego tunelu. Ośrodek za granicą oferuje tygodniową sesję dla kadry A.',
      choices: [
        { t: 'Wynająć', hint: '−45 tys. €, lot kadry A +', cost: () => 45000, fx: () => { money(-45000, 'Wynajem tunelu'); group('A').forEach((x) => { attr(x, 'flight', U.rand() + 0.6); attr(x, 'flying', 0.5); }); return 'Pozycje w locie są wyraźnie lepsze.'; } },
        { t: 'Odpuścić', hint: 'brak efektu', fx: () => 'Bez tunelu w tym roku.' },
      ],
    },

    // ===================== MŁODZIEŻ =====================
    {
      id: 'sports_school', cat: 'młodzież', w: 3, phase: 'summer', cd: 40,
      when: () => ({}),
      title: () => 'Szkoła Mistrzostwa Sportowego',
      text: () => 'Dyrektor szkoły sportowej proponuje utworzenie klasy skoków narciarskich ze wspólnym finansowaniem.',
      choices: [
        { t: 'Podpisać porozumienie', hint: '−50 tys. €, więcej talentów w naborze', cost: () => 50000, fx: () => { money(-50000, 'Klasa sportowa'); P().youthBonus = (P().youthBonus || 0) + 2; return 'Od września rusza klasa skoczków!'; } },
        { t: 'Nie teraz', hint: 'brak efektu', fx: () => 'Może w przyszłości.' },
      ],
    },
    {
      id: 'parents_complaint', cat: 'młodzież', w: 3, phase: 'any',
      when: () => (staff('coachJ') && group('J').length ? {} : null),
      title: () => 'Skarga rodziców juniorów',
      text: () => `Rodzice juniorów skarżą się, że trener ${sName(staff('coachJ'))} stosuje zbyt surowe metody.`,
      choices: [
        { t: 'Poprzeć trenera', hint: 'morale juniorów −', fx: () => { group('J').forEach((x) => morale(x, -5)); return 'Trener ma pełne wsparcie.'; } },
        { t: 'Spotkanie i złagodzenie metod', hint: 'morale juniorów +, trening juniorów nieco wolniejszy', fx: () => { group('J').forEach((x) => morale(x, 6)); mod('train', -0.01, 8, 'Łagodniejsze treningi juniorów'); return 'Rodzice zadowoleni.'; } },
      ],
    },
    {
      id: 'kids_cup', cat: 'młodzież', w: 3, phase: 'any', cd: 30,
      when: () => ({}),
      title: () => 'Cykl zawodów dla dzieci',
      text: () => 'Lokalne kluby proponują ogólnokrajowy cykl zawodów dla dzieci pod patronatem federacji.',
      choices: [
        { t: 'Ufundować cykl', hint: '−25 tys. €, popularność +, więcej talentów', cost: () => 25000, fx: () => { money(-25000, 'Puchar dzieci'); pop(1); P().youthBonus = (P().youthBonus || 0) + 1; return 'Setki dzieci na starcie!'; } },
        { t: 'Tylko patronat', hint: 'popularność +', fx: () => { pop(0.5); return 'Patronat przyznany.'; } },
      ],
    },
    {
      id: 'junior_abroad', cat: 'młodzież', w: 3, phase: 'summer', cd: 30,
      when: () => { const j = pick(my().filter((x) => age(x) <= 18 && x.pot >= 78)); return j ? { jid: j.id, nat: strongerNation() } : null; },
      title: (c) => `${nm(J(c.jid))} zaproszony do zagranicznej akademii`,
      text: (c) => `Renomowana akademia (${natName(c.nat)}) chce przyjąć ${nm(J(c.jid))} na rok szkolenia. Świetna okazja – ale istnieje ryzyko, że zawodnik zostanie tam na stałe.`,
      choices: [
        { t: 'Wysłać go', hint: 'cechy ++, ryzyko utraty zawodnika', fx: (c) => { const j = J(c.jid); attrsAll(j, 2); j.pot = Math.min(99, j.pot + 1); if (chance(0.15)) { j.nation = c.nat; j.group = null; return `Po roku ${nm(j)} zdecydował się zostać i skakać dla kraju: ${natName(c.nat)}…`; } return 'Junior zrobił ogromne postępy i wraca do kraju.'; } },
        { t: 'Zostaje w kraju', hint: 'brak ryzyka', fx: () => 'Szkolimy go u siebie.' },
      ],
    },

    // ===================== ZARZĄD =====================
    {
      id: 'president_friend', cat: 'zarząd', w: 3, phase: 'any', cd: 40,
      when: () => ({}),
      title: () => 'Prośba prezesa',
      text: () => 'Prezes federacji sugeruje zatrudnienie swojego znajomego jako „koordynatora ds. logistyki". Kompetencje kandydata są… dyskusyjne.',
      choices: [
        { t: 'Zatrudnić', hint: '−30 tys. €, zarząd ++', cost: () => 30000, fx: () => { money(-30000, 'Koordynator logistyki'); board(6); return 'Prezes jest bardzo zadowolony.'; } },
        { t: 'Odmówić', hint: 'zarząd −−', fx: () => { board(-6); return 'Prezes przyjął odmowę z kamienną twarzą.'; } },
      ],
    },
    {
      id: 'midseason_review', cat: 'zarząd', w: 6, phase: 'season', cd: 18,
      when: () => (st().week >= 9 && st().week <= 12 && hasPts() && P().expectation ? { rank: myRank(), target: P().expectation.nc } : null),
      title: () => 'Posiedzenie zarządu w połowie sezonu',
      text: (c) => `Zarząd analizuje wyniki: obecnie ${c.rank}. miejsce w Pucharze Narodów (cel: ${c.target}.). ${c.rank <= c.target ? 'Członkowie zarządu są zadowoleni.' : 'Atmosfera jest napięta.'}`,
      choices: [
        { t: 'Złożyć obietnicę realizacji celu', hint: 'zarząd + teraz, rozliczenie po sezonie', fx: (c) => { board(3); atSeasonEnd('board_promise', { target: c.target }); return 'Zarząd trzyma Cię za słowo.'; } },
        { t: 'Przedstawić długofalowy plan rozwoju', hint: 'zarząd + (mniej)', fx: () => { board(1); return 'Zarząd docenia wizję, ale oczekuje wyników.'; } },
      ],
    },
    {
      id: 'federation_election', cat: 'zarząd', w: 2, phase: 'summer', cd: 60,
      when: () => ({}),
      title: () => 'Wybory w federacji',
      text: () => 'Zbliżają się wybory prezesa federacji. Obecny prezes oczekuje poparcia, kontrkandydat obiecuje zwiększenie budżetu na skoki.',
      choices: [
        { t: 'Poprzeć obecnego prezesa', hint: '60% wygra: zarząd ++, inaczej −−', fx: () => { if (chance(0.6)) { board(8); return 'Prezes wygrał wybory i pamięta o Twoim wsparciu.'; } board(-10); return 'Wygrał kontrkandydat – nowy zarząd patrzy na Ciebie nieufnie.'; } },
        { t: 'Poprzeć kontrkandydata', hint: '40% wygra: budżet +10%, inaczej zarząd −−', fx: () => { if (chance(0.4)) { P().grant = Math.round(P().grant * 1.1 / 1000) * 1000; board(5); return 'Nowy prezes zwiększył budżet skoków o 10%!'; } board(-12); return 'Twój kandydat przegrał. Obecny prezes tego nie zapomni.'; } },
        { t: 'Zachować neutralność', hint: 'brak efektu', fx: () => 'Skupiasz się na sporcie.' },
      ],
    },

    // ===================== REAKCJE NA WYNIKI =====================
    {
      id: 'big_win', cat: 'media', w: 9, phase: 'season', cd: 8,
      when: () => { const r = prevResults().find((x) => x.res.type === 'ind' && ['WC', 'WCH', 'OWG', 'SFWC'].includes(x.ev.level) && x.res.ranking[0] && x.res.ranking[0].nat === st().nation); return r ? { jid: r.res.ranking[0].id, ev: SJM.CAL.eventTitle(r.ev) } : null; },
      title: (c) => `Zwycięstwo ${nm(J(c.jid))} – kraj oszalał!`,
      text: (c) => `Po wygranej w konkursie ${c.ev} telefony się urywają: wywiady, programy śniadaniowe, sponsorzy. Trener prosi o spokój przed kolejnymi zawodami.`,
      choices: [
        { t: 'Tournée medialne', hint: '+20 tys. €, popularność ++, zmęczenie +', fx: (c) => { money(20000, 'Wywiady i reklamy po zwycięstwie'); pop(3); fatigue(J(c.jid), 12); return 'Zwycięzca jest wszędzie – w telewizji, radiu i na billboardach.'; } },
        { t: 'Odciąć zawodnika od mediów', hint: 'forma +, morale +', fx: (c) => { form(J(c.jid), 1); morale(J(c.jid), 5); pop(0.5); return 'Pełne skupienie na kolejnych konkursach.'; } },
      ],
    },
    {
      id: 'hill_record', cat: 'media', w: 6, phase: 'season', cd: 10,
      when: () => { for (const x of prevResults()) { if (x.res.type !== 'ind') continue; const h = W.getHill(x.ev.hill); for (const row of x.res.ranking) { if (row.nat !== st().nation) continue; const best = row.j.find((jj) => !jj.f && jj.d >= h.HS + 3); if (best) return { jid: row.id, d: best.d, hill: h.city }; } } return null; },
      title: (c) => `Kosmiczny skok ${nm(J(c.jid))}!`,
      text: (c) => `${nm(J(c.jid))} poszybował na ${U.fmt1(c.d).replace('.0', '')} m w ${c.hill} – daleko za rozmiar skoczni. Nagranie obiegło cały świat.`,
      auto: (c) => { pop(1.5); morale(J(c.jid), 8); return 'Popularność skoków rośnie.'; },
    },
    {
      id: 'medal_honors', cat: 'zarząd', w: 10, phase: 'season', cd: 6,
      when: () => { const m = (st().seasonMedals || []).filter((x) => x.nat === st().nation && x.level !== 'WJC'); const prevW = st().calendar.weeks[st().week - 1]; if (!m.length || !prevW || !prevW.events.some((e) => ['WCH', 'OWG', 'SFWC'].includes(e.level))) return null; return { n: m.length, gold: m.filter((x) => x.place === 1).length }; },
      title: () => 'Medaliści wracają do kraju',
      text: (c) => `Nasi skoczkowie wywalczyli ${c.n} ${c.n === 1 ? 'medal' : 'medale'}${c.gold ? `, w tym ${c.gold} złot${c.gold === 1 ? 'y' : 'e'}` : ''}! Ministerstwo przyznaje nagrody, a miasta chcą organizować powitania.`,
      choices: [
        { t: 'Wielka feta z kibicami', hint: 'premia z ministerstwa, popularność ++, zmęczenie kadry A +', fx: (c) => { money(30000 * c.n + 40000 * c.gold, 'Nagroda ministerstwa za medale'); pop(3); group('A').forEach((x) => fatigue(x, 10)); return 'Tysiące kibiców na powitaniu!'; } },
        { t: 'Skromne przyjęcie, sezon trwa', hint: 'premia z ministerstwa, forma kadry A +', fx: (c) => { money(30000 * c.n + 40000 * c.gold, 'Nagroda ministerstwa za medale'); group('A').forEach((x) => form(x, 0.8)); return 'Zawodnicy szybko wrócili do treningów.'; } },
      ],
    },
    {
      id: 'benched_unhappy', cat: 'zawodnicy', w: 6, phase: 'season', cd: 12,
      when: () => {
        const started = new Set(prevResults().flatMap((x) => (x.res.ranking || []).flatMap((r) => (r.members ? r.members : [r.id]))).concat(prevResults().flatMap((x) => (x.res.qual ? x.res.qual.jumps.map((q) => q.id) : []))));
        if (!prevResults().length) return null;
        const j = pick(healthy(group('A')).filter((x) => !started.has(x.id) && x.morale < 60));
        return j ? { jid: j.id } : null;
      },
      title: (c) => `${nm(J(c.jid))} pyta, dlaczego nie startuje`,
      text: (c) => `${nm(J(c.jid))} jest członkiem kadry A, ale w ostatni weekend nie wystartował. Przyszedł z pretensjami do Twojego biura.`,
      choices: [
        { t: 'Obiecać start w kolejnym konkursie PŚ', hint: 'morale ++ (pamiętaj o nominacji!)', fx: (c) => { morale(J(c.jid), 12); return 'Zawodnik wychodzi zmotywowany. Nie zapomnij go nominować.'; } },
        { t: 'Wyjaśnić kryteria wyboru', hint: 'morale −', fx: (c) => { morale(J(c.jid), -3); return 'Zawodnik przyjął wyjaśnienia bez entuzjazmu.'; } },
        { t: 'Wysłać na Puchar Kontynentalny po pewność siebie', hint: 'morale +, forma +', fx: (c) => { morale(J(c.jid), 4); form(J(c.jid), 1); return 'Starty w PK pozwolą mu odbudować pewność.'; } },
      ],
    },
    {
      id: 'home_crowd', cat: 'kibice', w: 5, phase: 'season', cd: 10,
      when: () => { const w = upcoming(); if (!w) return null; const e = w.events.find((x) => x.level === 'WC' && M.hostNationOf(x.hill) === st().nation); return e ? { city: W.getHill(e.hill).city } : null; },
      title: (c) => `Puchar Świata w ${c.city} – kampania promocyjna`,
      text: (c) => `Organizator zawodów w ${c.city} proponuje wspólną kampanię promocyjną, żeby zapełnić trybuny do ostatniego miejsca.`,
      choices: [
        { t: 'Dołożyć się do kampanii', hint: '−20 tys. €, popularność +, forma naszych +', cost: () => 20000, fx: () => { money(-20000, 'Kampania przed zawodami u siebie'); pop(2); group('A').forEach((x) => form(x, 1)); return 'Komplet publiczności! Atmosfera niesie zawodników.'; } },
        { t: 'Zostawić to organizatorowi', hint: 'brak efektu', fx: () => 'Trybuny będą pełne… mniej więcej.' },
      ],
    },
    {
      id: 'junior_hype', cat: 'młodzież', w: 5, phase: 'season', cd: 15,
      when: () => { for (const x of prevResults()) { if (x.res.type !== 'ind' || !['FIS', 'COC', 'WJC'].includes(x.ev.level)) continue; const r = x.res.ranking.find((r) => r.nat === st().nation && r.rank && r.rank <= 3 && J(r.id) && age(J(r.id)) <= 19); if (r) return { jid: r.id, lv: x.ev.level, rank: r.rank }; } return null; },
      title: (c) => `Media zachwycone juniorem: ${nm(J(c.jid))}`,
      text: (c) => `${c.rank}. miejsce w zawodach ${SJM.LEVELS[c.lv].name} sprawiło, że ${nm(J(c.jid))} (${age(J(c.jid))} l.) nazywany jest „następcą legend". Dziennikarze chcą wywiadów.`,
      choices: [
        { t: 'Chronić go przed mediami', hint: 'psychika +, popularność bez zmian', fx: (c) => { attr(J(c.jid), 'mental', 1); morale(J(c.jid), 4); return 'Junior spokojnie pracuje dalej.'; } },
        { t: 'Pozwolić mu cieszyć się sławą', hint: 'popularność +, ryzyko presji', fx: (c) => { pop(1.5); if (chance(0.4)) { attr(J(c.jid), 'mental', -1); morale(J(c.jid), -6); return 'Presja okazała się za duża dla młodego zawodnika.'; } morale(J(c.jid), 8); return 'Junior świetnie radzi sobie w roli gwiazdy.'; } },
      ],
    },

    // ===================== POZOSTAŁE =====================
    {
      id: 'agent_demands', cat: 'zawodnicy', w: 4, phase: 'any', cd: 25,
      when: () => { const j = pick(group('A').filter((x) => ovr(x) > 86)); return j ? { jid: j.id } : null; },
      title: (c) => `Menedżer ${nm(J(c.jid))} żąda wyższego stypendium`,
      text: (c) => `Agent ${nm(J(c.jid))} twierdzi, że jego klient jest niedoceniany i domaga się wyższego stypendium kadrowego.`,
      choices: [
        { t: 'Podnieść stypendium', hint: '−20 tys. €, morale ++', cost: () => 20000, fx: (c) => { money(-20000, 'Wyższe stypendium: ' + nm(J(c.jid))); morale(J(c.jid), 12); return 'Zawodnik czuje się doceniony.'; } },
        { t: 'Odmówić – zasady są równe dla wszystkich', hint: 'morale −, zarząd +', fx: (c) => { morale(J(c.jid), -8); board(1); return 'Agent zapowiada, że „wróci do tematu".'; } },
      ],
    },
    {
      id: 'supplier_bankrupt', cat: 'sprzęt', w: 3, phase: 'summer', cd: 50,
      when: () => ({}),
      title: () => 'Upadłość producenta nart',
      text: () => 'Firma, która dostarczała nam narty, ogłosiła upadłość. Zapas sprzętu wystarczy najwyżej do połowy sezonu.',
      choices: [
        { t: 'Wykupić zapas od syndyka', hint: '−80 tys. €', cost: () => 80000, fx: () => { money(-80000, 'Zapas nart'); return 'Mamy zapas na cały sezon.'; } },
        { t: 'Przejść na innego producenta', hint: 'sprzęt −0,4 (15 tyg.) – adaptacja', fx: () => { mod('equip', -0.4, 15, 'Adaptacja do nowych nart'); return 'Zawodnicy muszą przyzwyczaić się do nowych nart.'; } },
      ],
    },
    {
      id: 'university_research', cat: 'trening', w: 3, phase: 'any', cd: 40,
      when: () => ({}),
      title: () => 'Współpraca z uczelnią',
      text: () => 'Akademia Wychowania Fizycznego proponuje bezpłatny projekt badawczy: pomiary, analiza wideo, testy wydolności. Wymaga to jednak czasu zawodników.',
      choices: [
        { t: 'Podjąć współpracę', hint: 'trening +3% (20 tyg.), zmęczenie kadry A +', fx: () => { mod('train', 0.03, 20, 'Projekt badawczy z uczelnią'); group('A').forEach((x) => fatigue(x, 6)); return 'Naukowcy dostarczają cennych danych.'; } },
        { t: 'Odmówić', hint: 'brak efektu', fx: () => 'Może innym razem.' },
      ],
    },
    {
      id: 'charity_show', cat: 'kibice', w: 3, phase: 'any', cd: 30,
      when: () => ({}),
      title: () => 'Charytatywny pokaz skoków',
      text: () => 'Fundacja dziecięca prosi o udział kadry w charytatywnym pokazie skoków i licytacji pamiątek.',
      choices: [
        { t: 'Weźmiemy udział', hint: 'popularność +, zarząd +, zmęczenie +', fx: () => { pop(2); board(1); group('A').forEach((x) => fatigue(x, 5)); return 'Zebrano rekordową kwotę dla dzieci!'; } },
        { t: 'Wyślemy pamiątki, ale bez zawodników', hint: 'popularność +', fx: () => { pop(0.5); return 'Fundacja dziękuje za wsparcie.'; } },
      ],
    },
    {
      id: 'new_father', cat: 'zawodnicy', w: 3, phase: 'season', cd: 30,
      when: () => { const j = pick(group('A').filter((x) => age(x) >= 25)); return j ? { jid: j.id } : null; },
      title: (c) => `${nm(J(c.jid))} został ojcem!`,
      text: (c) => `${nm(J(c.jid))} prosi o tydzień wolnego, żeby być z rodziną po narodzinach dziecka.`,
      choices: [
        { t: 'Oczywiście – gratulacje!', hint: 'opuści 1 tydzień, morale ++', fx: (c) => { const j = J(c.jid); suspend(j, 1); morale(j, 15); fatigue(j, -20); return 'Szczęśliwy tata wróci za tydzień.'; } },
        { t: 'Poprosić, by został na zawodach', hint: 'morale −−', fx: (c) => { morale(J(c.jid), -12); return 'Zawodnik został, ale myślami jest w domu.'; } },
      ],
    },
    {
      id: 'coach_ill', cat: 'sztab', w: 3, phase: 'season', cd: 40,
      when: () => (staff('coachA') ? {} : null),
      title: () => 'Trener główny zachorował',
      text: () => `${sName(staff('coachA'))} trafił do szpitala i przez kilka tygodni nie będzie mógł prowadzić treningów.`,
      choices: [
        { t: 'Zatrudnić tymczasowego trenera', hint: '−25 tys. €', cost: () => 25000, fx: () => { money(-25000, 'Trener tymczasowy'); return 'Zastępca dobrze poprowadził zajęcia.'; } },
        { t: 'Asystenci przejmą obowiązki', hint: 'trening −6% (4 tyg.)', fx: () => { mod('train', -0.06, 4, 'Choroba trenera głównego'); return 'Asystenci robią, co mogą.'; } },
      ],
    },
    {
      id: 'visa_issue', cat: 'zawody', w: 3, phase: 'season', cd: 20,
      when: () => { const w = upcoming(); if (!w) return null; const e = w.events.find((x) => ['JPN', 'USA', 'CAN', 'CHN', 'KOR', 'KAZ'].includes(W.getHill(x.hill).nation || '')); if (!e) return null; const j = pick(healthy(my().filter((x) => x.group === 'A' || x.group === 'B'))); return j ? { jid: j.id, city: W.getHill(e.hill).city } : null; },
      title: () => 'Problem z wizą',
      text: (c) => `Przed wyjazdem do ${c.city} okazało się, że ${nm(J(c.jid))} nie ma ważnej wizy.`,
      choices: [
        { t: 'Ekspresowa procedura', hint: '−8 tys. €', cost: () => 8000, fx: () => { money(-8000, 'Wiza ekspresowa'); return 'Wiza wydana w 48 godzin.'; } },
        { t: 'Zawodnik zostaje w kraju', hint: 'opuści ten tydzień', fx: (c) => { suspend(J(c.jid), 1); return 'Zawodnik trenuje w kraju.'; } },
      ],
    },
    {
      id: 'audit', cat: 'zarząd', w: 2, phase: 'any', cd: 50,
      when: () => ({}),
      title: () => 'Kontrola finansowa',
      text: () => 'Audytorzy ministerstwa zakwestionowali rozliczenia części delegacji zagranicznych.',
      choices: [
        { t: 'Zwrócić sporną kwotę', hint: '−20 tys. €', cost: () => 20000, fx: () => { money(-20000, 'Zwrot po kontroli'); return 'Sprawa zamknięta.'; } },
        { t: 'Odwołać się', hint: '50%: zarząd −5', fx: () => { if (chance(0.5)) return 'Odwołanie uwzględnione!'; board(-5); money(-20000, 'Zwrot po kontroli'); return 'Odwołanie odrzucone – zwrot i niesmak w zarządzie.'; } },
      ],
    },
    {
      id: 'rival_accusation', cat: 'przepisy', w: 3, phase: 'season', cd: 30,
      when: () => (group('A').some((x) => x.season.podiums > 0) ? { nat: strongerNation() } : null),
      title: (c) => `Oskarżenia ze strony kadry ${natName(c.nat)}`,
      text: (c) => `Trener reprezentacji (${natName(c.nat)}) sugeruje w mediach, że nasze kombinezony „łamią ducha przepisów".`,
      choices: [
        { t: 'Ostra odpowiedź w mediach', hint: 'morale kadry +, zarząd −', fx: () => { group('A').forEach((x) => morale(x, 6)); board(-2); return 'Zawodnicy czują, że stoisz za nimi murem.'; } },
        { t: 'Zaproponować FIS dodatkową kontrolę', hint: 'zarząd +, popularność +', fx: () => { board(2); pop(1); return 'Kontrola potwierdziła, że wszystko jest w porządku.'; } },
        { t: 'Zignorować', hint: 'brak efektu', fx: () => 'Burza w szklance wody.' },
      ],
    },
    {
      id: 'kid_safety', cat: 'młodzież', w: 2, phase: 'any', cd: 40,
      when: () => (anyHill().some((h) => h.K < 85) ? {} : null),
      title: () => 'Wypadek na skoczni dla dzieci',
      text: () => 'Podczas zajęć klubowych dziecko upadło na małej skoczni. Na szczęście skończyło się na siniakach, ale rodzice pytają o bezpieczeństwo.',
      choices: [
        { t: 'Program bezpieczeństwa i nowe zabezpieczenia', hint: '−25 tys. €, zaufanie rodziców', cost: () => 25000, fx: () => { money(-25000, 'Program bezpieczeństwa'); pop(1); return 'Rodzice doceniają reakcję federacji.'; } },
        { t: 'Wypadki się zdarzają', hint: 'popularność −, mniej talentów', fx: () => { pop(-2); P().youthBonus = (P().youthBonus || 0) - 1; return 'Część rodziców wypisała dzieci z klubów.'; } },
      ],
    },
    {
      id: 'heritage_talent', cat: 'młodzież', w: 2, phase: 'summer', cd: 60,
      when: () => ({ from: weakerNation() }),
      title: () => 'Zawodnik z naszymi korzeniami',
      text: (c) => `Utalentowany 18-latek startujący dotąd dla kraju: ${natName(c.from)} ma naszych dziadków i chciałby reprezentować nasz kraj.`,
      choices: [
        { t: 'Przyjąć i załatwić formalności', hint: '−15 tys. €, nowy zawodnik', cost: () => 15000, fx: () => { money(-15000, 'Formalności obywatelskie'); const j = W.genJumper(st().nation, 18, 84, 4); j.group = 'J'; st().jumpers[j.id] = j; return `${nm(j)} dołącza do naszej kadry juniorów!`; } },
        { t: 'Podziękować', hint: 'brak efektu', fx: () => 'Zawodnik zostaje przy dotychczasowych barwach.' },
      ],
    },
    {
      id: 'legend_comeback', cat: 'zawodnicy', w: 2, phase: 'summer', cd: 60,
      when: () => { const r = pick((st().retired || []).filter((x) => x.nat === st().nation && st().season - x.retired <= 2 && st().season - x.born <= 38)); return r ? { name: r.name, born: r.born } : null; },
      title: (c) => `${c.name} chce wrócić!`,
      text: (c) => `Emerytowany ${c.name} zatęsknił za skakaniem i deklaruje powrót. Kibice szaleją, eksperci kręcą głowami.`,
      choices: [
        { t: 'Dać mu szansę', hint: 'popularność ++, nowy (stary) zawodnik', fx: (c) => { const ag = st().season - c.born; const j = W.genJumper(st().nation, ag, 80, 3); const [first, ...rest] = c.name.split(' '); j.first = first; j.last = rest.join(' '); j.attrs.mental = 90; j.attrs.consist = 85; j.group = 'B'; st().jumpers[j.id] = j; pop(3); return `${c.name} wraca do kadry B!`; } },
        { t: 'Odradzić powrót', hint: 'brak efektu', fx: () => 'Legenda zostaje na emeryturze.' },
      ],
    },
    {
      id: 'energy_drink', cat: 'sponsorzy', w: 3, phase: 'any', cd: 40,
      when: () => ({ amount: U.randInt(4, 9) * 10000 }),
      title: () => 'Producent napojów energetycznych',
      text: (c) => `Marka napojów energetycznych chce sponsorować wyjazdy kadry: ${k(c.amount)}. W zamian zawodnicy mają nagrywać filmy z ekstremalnymi wyzwaniami.`,
      choices: [
        { t: 'Przyjąć', hint: 'pieniądze, popularność +, ryzyko kontuzji +', fx: (c) => { money(c.amount, 'Sponsor – napoje'); pop(1.5); mod('injury', 0.1, 12, 'Ekstremalne nagrania dla sponsora'); return 'Filmy biją rekordy wyświetleń.'; } },
        { t: 'Odrzucić', hint: 'brak efektu', fx: () => 'Bez zmian.' },
      ],
    },
    {
      id: 'heat_wave', cat: 'trening', w: 3, phase: 'summer', cd: 40,
      when: () => ({}),
      title: () => 'Upały w czasie przygotowań',
      text: () => 'Fala upałów sprawiła, że igelit nagrzewa się do 60°C. Treningi trzeba przenieść na wczesne godziny poranne.',
      auto: () => { mod('train', -0.03, 4, 'Upały'); return 'Trening będzie nieco mniej efektywny przez kilka tygodni.'; },
    },
    {
      id: 'naming_rights', cat: 'sponsorzy', w: 2, phase: 'any', cd: 60,
      when: () => { const h = pick(anyHill().filter((x) => x.K >= 100)); return h ? { hid: h.id, amount: Math.round(SJM.HILL_TYPES[h.type].cost * 0.03 / 10000) * 10000 } : null; },
      title: (c) => `Prawa do nazwy skoczni ${hill(c.hid).name}`,
      text: (c) => `Korporacja chce zmienić nazwę skoczni ${hill(c.hid).name} na swoją markę. Oferuje ${k(c.amount)} rocznie. Tradycjonaliści protestują.`,
      choices: [
        { t: 'Sprzedać prawa do nazwy', hint: 'pieniądze, popularność −', fx: (c) => { const h = hill(c.hid); money(c.amount, 'Prawa do nazwy ' + h.name); h.name = pick(['Arena', 'Energy Hill', 'Tech Arena', 'Bank Arena']) + ' ' + h.city; pop(-1.5); return `Skocznia nazywa się teraz: ${h.name}.`; } },
        { t: 'Zachować tradycyjną nazwę', hint: 'popularność +', fx: () => { pop(1); return 'Kibice doceniają szacunek do tradycji.'; } },
      ],
    },
    {
      id: 'scouting_trip', cat: 'młodzież', w: 3, phase: 'any', cd: 30,
      when: () => (staff('scout') ? {} : null),
      title: () => 'Objazd klubów',
      text: () => `${sName(staff('scout'))} proponuje objazd klubów w całym kraju, by wyłowić ukryte talenty.`,
      choices: [
        { t: 'Sfinansować objazd', hint: '−15 tys. €, więcej talentów w naborze', cost: () => 15000, fx: () => { money(-15000, 'Objazd klubów'); P().youthBonus = (P().youthBonus || 0) + 1; return 'Koordynator wrócił z listą obiecujących dzieci.'; } },
        { t: 'Nie teraz', hint: 'brak efektu', fx: () => 'Odłożone.' },
      ],
    },
    {
      id: 'car_sponsor', cat: 'sponsorzy', w: 2, phase: 'summer', cd: 50,
      when: () => (P().popularity > 45 ? {} : null),
      title: () => 'Samochody od sponsora',
      text: () => 'Dealer samochodowy przekazał kadrze flotę busów i aut na sezon.',
      auto: () => { money(30000, 'Sponsor samochodowy (oszczędności)'); pop(0.5); return 'Oszczędności na transporcie: 30 tys. €.'; },
    },
    {
      id: 'no_starts_ultimatum', cat: 'zawodnicy', w: 7, phase: 'season', cd: 8,
      when: () => { if (st().week < 9) return null; const j = pick(my().filter((x) => age(x) >= 19 && age(x) <= 26 && x.season.starts <= 1 && x.injury <= 0 && x.morale < 55 && ovr(x) >= 65)); return j ? { jid: j.id, starts: j.season.starts } : null; },
      title: (c) => `${nm(J(c.jid))} stawia ultimatum`,
      text: (c) => `${nm(J(c.jid))} (${age(J(c.jid))} l.) w tym sezonie ${c.starts ? 'wystartował tylko raz' : 'nie wystartował ani razu'}. Mówi wprost: jeśli nic się nie zmieni, nie widzi sensu dalszego skakania.`,
      choices: [
        { t: 'Obiecać regularne starty do końca sezonu', hint: 'morale ++; jeśli nie dostanie co najmniej 3 startów – odejdzie', fx: (c) => { morale(J(c.jid), 14); atSeasonEnd('start_promise', { jid: c.jid, base: J(c.jid).season.starts }); return 'Zawodnik czeka na swoje szanse. Pamiętaj o nominacjach (PK, FIS Cup albo PŚ).'; } },
        { t: 'Zaproponować zmianę barw narodowych', hint: 'zawodnik przechodzi do innej federacji', fx: (c) => { const j = J(c.jid); j.nation = weakerNation(); j.group = null; pop(-0.5); return `${nm(j)} będzie skakał dla kraju: ${natName(j.nation)}.`; } },
        { t: 'Nie ustępować', hint: 'morale −, duże ryzyko odejścia po sezonie', fx: (c) => { const j = J(c.jid); morale(j, -8); j.quitRisk = true; return 'Zawodnik wyszedł bez słowa…'; } },
      ],
    },

    // ===================== WIATR I WARUNKI =====================
    {
      id: 'wind_complaint', cat: 'zawody', w: 6, phase: 'season', cd: 12,
      // nasz mocny zawodnik daleko w PŚ po skoku z wiatrem w plecy
      when: () => { for (const x of prevResults()) { if (x.res.type !== 'ind' || x.ev.level !== 'WC') continue; const r = x.res.ranking.find((r) => r.nat === st().nation && J(r.id) && ovr(J(r.id)) >= 84 && (!r.rank || r.rank > 20) && r.j.some((jj) => jj.w <= -0.6)); if (r) { const w = Math.min(...r.j.map((jj) => jj.w)); return { jid: r.id, ev: SJM.CAL.eventTitle(x.ev), w, rank: r.rank }; } } return null; },
      title: (c) => `${nm(J(c.jid))}: „wiatr mnie zabił”`,
      text: (c) => `W konkursie ${c.ev} ${nm(J(c.jid))} trafił na ${U.fmt1(-c.w).replace('.', ',')} m/s w plecy i skończył ${c.rank ? 'na ' + c.rank + '. miejscu' : 'poza finałową trzydziestką'}. Po zawodach mówił o loterii i niesprawiedliwej rekompensacie. Dziennikarze czekają na stanowisko federacji.`,
      choices: [
        { t: 'Analiza warunków z meteorologiem', hint: '−8 tys. €, morale +, start przy wietrze + (6 tyg.)', cost: () => 8000, fx: (c) => { money(-8000, 'Analiza warunków wiatrowych'); morale(J(c.jid), 6); mod('wind', 0.06, 6, 'Analiza warunków wiatrowych'); return 'Meteorolog pokazał, w których momentach warto czekać z sygnałem do startu. Zawodnik odzyskał spokój.'; } },
        { t: 'Poprzeć go publicznie i złożyć uwagi do FIS', hint: 'morale ++, zarząd −', fx: (c) => { morale(J(c.jid), 10); board(-2); return 'FIS odpisała uprzejmie, że rekompensata działa zgodnie z przepisami. Zawodnik docenia wsparcie.'; } },
        { t: 'Wiatr jest dla wszystkich – głowa do góry', hint: 'zarząd +, morale −', fx: (c) => { morale(J(c.jid), -5); board(1); return 'Zawodnik przyjął to chłodno, ale temat w mediach szybko ucichł.'; } },
      ],
    },
    {
      id: 'round_cancelled', cat: 'zawody', w: 7, phase: 'season', cd: 10,
      // seria odwołana z powodu wiatru, a nasz zawodnik był w czołówce lub tuż za nią
      when: () => { for (const x of prevResults()) { if (x.res.type !== 'ind' || !x.res.note) continue; const r = x.res.ranking.find((r) => r.nat === st().nation && r.rank && r.rank <= 12 && J(r.id)); if (r) return { jid: r.id, rank: r.rank, ev: SJM.CAL.eventTitle(x.ev), note: x.res.note }; } return null; },
      title: (c) => (c.rank <= 3 ? `Podium po skróconym konkursie: ${nm(J(c.jid))}` : `Skrócony konkurs w ${c.ev}`),
      text: (c) => `${c.note} ${nm(J(c.jid))} zajął ${c.rank}. miejsce. ${c.rank <= 3 ? 'Część ekspertów mówi o „podium z loterii”, kibice cieszą się z wyniku.' : 'Sztab uważa, że w drugiej serii stać go było na odrobienie strat.'}`,
      choices: [
        { t: 'Protest do jury', hint: '10%: uznany (zarząd +), w innym razie zarząd −', fx: () => { if (chance(0.1)) { board(3); return 'Jury przyznało, że warunki były na granicy, i FIS zapowiedziała zmianę procedur. Zarząd jest pod wrażeniem.'; } board(-2); return 'Protest odrzucono – decyzja o odwołaniu serii należy do jury.'; } },
        { t: 'Skupić się na następnych zawodach', hint: 'morale +', fx: (c) => { morale(J(c.jid), c.rank <= 3 ? 8 : 4); return c.rank <= 3 ? 'Punkty to punkty – zawodnik jedzie na kolejne zawody z uśmiechem.' : 'Zawodnik chce udowodnić swoje w pełnym konkursie.'; } },
      ],
    },
    {
      id: 'weather_expert', cat: 'sztab', w: 4, phase: 'season', cd: 40,
      when: () => (staff('coachA') ? {} : null),
      title: () => 'Specjalista od wiatru dla sztabu',
      text: () => `${sName(staff('coachA'))} chce dołączyć do sztabu meteorologa, który na bieżąco analizuje odczyty czujników wiatru. Trener podaje zawodnikowi sygnał do startu, a dobre rozpoznanie podmuchów to kilka punktów w każdym konkursie.`,
      choices: [
        { t: 'Zatrudnić meteorologa do końca sezonu', hint: '−45 tys. €, start przy wietrze +0,12 m/s (16 tyg.)', cost: () => 45000, fx: () => { money(-45000, 'Meteorolog w sztabie'); mod('wind', 0.12, 16, 'Meteorolog w sztabie'); return 'Meteorolog jeździ z kadrą na każde zawody PŚ. Trenerzy lepiej wyczuwają moment startu.'; } },
        { t: 'Szkolenie dla trenerów', hint: '−12 tys. €, start przy wietrze +0,06 m/s (10 tyg.)', cost: () => 12000, fx: () => { money(-12000, 'Szkolenie z warunków wiatrowych'); mod('wind', 0.06, 10, 'Szkolenie z warunków wiatrowych'); return 'Trenerzy przeszli kurs czytania wiatru i obsługi danych z czujników.'; } },
        { t: 'Nie teraz', hint: 'brak efektu', fx: () => 'Sztab radzi sobie po staremu.' },
      ],
    },
    {
      id: 'home_wind_forecast', cat: 'zawody', w: 4, phase: 'season', cd: 20,
      when: () => { const w = upcoming(); if (!w) return null; const e = w.events.find((x) => M.hostNationOf(x.hill) === st().nation && ['WC', 'COC'].includes(x.level)); return e ? { city: W.getHill(e.hill).city, lv: e.level } : null; },
      title: (c) => `Prognoza: silny wiatr w ${c.city}`,
      text: (c) => `Synoptycy zapowiadają porywisty wiatr na weekend ${c.lv === 'WC' ? 'Pucharu Świata' : 'Pucharu Kontynentalnego'} w ${c.city}. Organizator pyta, czy przygotować dodatkowe siatki przeciwwietrzne i rezerwowy termin.`,
      choices: [
        { t: 'Siatki i rezerwowy termin', hint: '−25 tys. €, zarząd +', cost: () => 25000, fx: () => { money(-25000, 'Zabezpieczenie przed wiatrem'); board(1); pop(0.5); return 'Skocznia jest gotowa na trudne warunki. Delegat FIS chwali organizację.'; } },
        { t: 'Zaryzykować', hint: '60%: wszystko gra, 40%: kibice rozczarowani', fx: () => { if (chance(0.6)) { pop(0.5); return 'Wiatr okazał się łaskawszy, niż straszyły prognozy.'; } pop(-2); money(-10000, 'Zwroty biletów'); return 'Wichura skróciła zawody, część kibiców żąda zwrotu biletów.'; } },
      ],
    },
    {
      id: 'flying_fear', cat: 'zawodnicy', w: 5, phase: 'season', cd: 20,
      when: () => { const w = upcoming(); if (!w || !w.events.some((e) => W.getHill(e.hill).K >= 170)) return null; const j = pick(healthy(my().filter((x) => (x.group === 'A' || x.group === 'B') && age(x) <= 23 && x.attrs.flying < 80 && !SJM.T.has(x, 'flyer')))); return j ? { jid: j.id } : null; },
      title: (c) => `${nm(J(c.jid))} boi się mamuta`,
      text: (c) => `Przed weekendem lotów ${nm(J(c.jid))} (${age(J(c.jid))} l.) przyznał trenerom, że na skoczni mamuciej czuje się niepewnie. Przy 230 metrach każdy błąd w locie kosztuje dużo.`,
      choices: [
        { t: 'Indywidualne zajęcia z lotów', hint: '−15 tys. €, loty +, morale +', cost: () => 15000, fx: (c) => { const j = J(c.jid); money(-15000, 'Zajęcia z lotów: ' + nm(j)); attr(j, 'flying', 2.5); morale(j, 5); return 'Analiza wideo i spokojne skoki treningowe zrobiły swoje – zawodnik czuje się pewniej.'; } },
        { t: 'Odpuścić mu ten weekend', hint: 'nie wystartuje, morale +', fx: (c) => { const j = J(c.jid); suspend(j, 1); morale(j, 4); return 'Zawodnik zostaje w kraju i trenuje na normalnej skoczni.'; } },
        { t: 'Nie ma wyjścia – musi skakać', hint: '50%: przełamanie (loty ++), 50%: morale −−', fx: (c) => { const j = J(c.jid); if (chance(0.5)) { attr(j, 'flying', 3.5); morale(j, 8); return 'Po pierwszym skoku za 200 m zawodnik nie może przestać się uśmiechać!'; } morale(j, -10); form(j, -1.5); return 'Skoki były asekuracyjne, a zawodnik wrócił przybity.'; } },
      ],
    },
    {
      id: 'fall_fear', cat: 'zawodnicy', w: 6, phase: 'season', cd: 12,
      // upadek w ostatnim konkursie bez poważnego urazu
      when: () => { for (const x of prevResults()) { const rows = x.res.type === 'ind' ? x.res.ranking : []; for (const r of rows) { if (r.nat !== st().nation || !r.j.some((jj) => jj.f)) continue; const j = J(r.id); if (j && j.injury <= 0) return { jid: j.id, ev: SJM.CAL.eventTitle(x.ev) }; } } return null; },
      title: (c) => `${nm(J(c.jid))} po upadku`,
      text: (c) => `${nm(J(c.jid))} upadł w konkursie ${c.ev}. Lekarze nie stwierdzili urazu, ale zawodnik przyznaje, że w głowie została blokada przy lądowaniu.`,
      choices: [
        { t: 'Sesje z psychologiem sportu', hint: '−8 tys. €, morale +, psychika +', cost: () => 8000, fx: (c) => { const j = J(c.jid); money(-8000, 'Psycholog: ' + nm(j)); morale(j, 6); attr(j, 'mental', 1); return 'Rozmowy pomogły – zawodnik znów skacze bez hamulców.'; } },
        { t: 'Tydzień przerwy od startów', hint: 'opuści tydzień, zmęczenie −−', fx: (c) => { const j = J(c.jid); suspend(j, 1); fatigue(j, -25); return 'Zawodnik odpoczywa i spokojnie wraca do skakania na treningach.'; } },
        { t: 'Od razu z powrotem na skocznię', hint: '60%: bez śladu, 40%: lądowanie − i forma −', fx: (c) => { const j = J(c.jid); if (chance(0.6)) { morale(j, 3); return '„Najlepiej od razu wsiąść na rower” – i zadziałało.'; } attr(j, 'landing', -1); form(j, -2); return 'Strach został – skoki są krótsze, a lądowania niepewne.'; } },
      ],
    },
    {
      id: 'team_fourth', cat: 'zawody', w: 6, phase: 'season', cd: 12,
      when: () => { const x = prevResults().find((x) => x.res.type === 'team' && x.res.ranking.some((r) => r.nat === st().nation && r.rank === 4)); if (!x) return null; const r = x.res.ranking; const diff = Math.round((r[2].total - r[3].total) * 10) / 10; return { ev: SJM.CAL.eventTitle(x.ev), diff }; },
      title: () => 'Czwarte miejsce w drużynówce',
      text: (c) => `W konkursie ${c.ev} zabrakło nam ${U.fmt1(c.diff).replace('.', ',')} pkt do podium. Najbardziej bolesne miejsce w sporcie. Zawodnicy są przybici, a media pytają o ustawienie składu.`,
      choices: [
        { t: 'Dodatkowe treningi drużynowe', hint: 'trening +3% (6 tyg.), zmęczenie kadry A +', fx: () => { mod('train', 0.03, 6, 'Treningi drużynowe po 4. miejscu'); group('A').forEach((x) => fatigue(x, 6)); return 'Kadra trenuje w dodatkowych blokach. Następnym razem podium!'; } },
        { t: 'Wspólna kolacja i podziękowania', hint: '−4 tys. €, morale kadry A +', cost: () => 4000, fx: () => { money(-4000, 'Kolacja kadry'); group('A').forEach((x) => morale(x, 5)); return 'Atmosfera się poprawiła – zawodnicy wiedzą, że byli blisko.'; } },
        { t: 'Publicznie wskazać najsłabsze ogniwo', hint: 'zarząd +, morale kadry A −', fx: () => { board(1); group('A').forEach((x) => morale(x, -4)); return 'Zarząd docenia konkret, ale w szatni zrobiło się chłodno.'; } },
      ],
    },

    // ===================== MEDIA, KIBICE, ZARZĄD =====================
    {
      id: 'social_media_star', cat: 'media', w: 4, phase: 'any', cd: 30,
      when: () => { const j = pick(my().filter((x) => age(x) <= 22 && (x.group === 'A' || x.group === 'B'))); return j ? { jid: j.id } : null; },
      title: (c) => `${nm(J(c.jid))} gwiazdą internetu`,
      text: (c) => `Filmy, które ${nm(J(c.jid))} (${age(J(c.jid))} l.) wrzuca z zawodów i treningów, oglądają setki tysięcy ludzi. Marki dopytują o współpracę, a trener narzeka, że telefon jest ważniejszy od rozgrzewki.`,
      choices: [
        { t: 'Szkolenie medialne i jasne zasady', hint: '−6 tys. €, popularność +', cost: () => 6000, fx: () => { money(-6000, 'Szkolenie medialne'); pop(2); return 'Zawodnik nagrywa dalej, ale nie w czasie treningu. Kibiców przybywa.'; } },
        { t: 'Niech nagrywa, ile chce', hint: 'popularność ++, morale +, forma −', fx: (c) => { const j = J(c.jid); pop(3); morale(j, 6); form(j, -1.5); return 'Zasięgi rosną, skoki – niekoniecznie.'; } },
        { t: 'Zakaz telefonów na zgrupowaniach', hint: 'forma +, morale −', fx: (c) => { const j = J(c.jid); form(j, 1); morale(j, -8); return 'Na zgrupowaniu panuje skupienie. Zawodnik jest obrażony.'; } },
      ],
    },
    {
      id: 'wrong_anthem', cat: 'kibice', w: 3, phase: 'season', cd: 40,
      // nasze zwycięstwo za granicą
      when: () => { const r = prevResults().find((x) => x.res.ranking[0] && (x.res.ranking[0].nat || '') === st().nation && x.res.type === 'ind' && M.hostNationOf(x.ev.hill) !== st().nation && x.ev.level !== 'NAT'); return r ? { jid: r.res.ranking[0].id, city: W.getHill(r.ev.hill).city } : null; },
      title: () => 'Pomylony hymn na dekoracji',
      text: (c) => `Podczas dekoracji w ${c.city} organizatorzy puścili zły hymn. ${nm(J(c.jid))} zaśpiewał nasz hymn a cappella, a nagranie obiegło internet.`,
      auto: (c) => { pop(1.5); morale(J(c.jid), 4); return 'Organizator przeprosił, a kibice pokochali zawodnika jeszcze bardziej.'; },
    },
    {
      id: 'fan_trip', cat: 'kibice', w: 3, phase: 'season', cd: 30,
      when: () => (P().popularity >= 40 ? {} : null),
      title: () => 'Wyjazd kibiców na zawody',
      text: () => 'Stowarzyszenie kibiców organizuje autokary na najbliższy weekend Pucharu Świata. Prosi federację o dofinansowanie biletów dla dzieci z klubów.',
      choices: [
        { t: 'Dofinansować', hint: '−10 tys. €, popularność +, morale kadry A +', cost: () => 10000, fx: () => { money(-10000, 'Dofinansowanie wyjazdu kibiców'); pop(2); group('A').forEach((x) => morale(x, 3)); return 'Nasze flagi zapełniły pół trybuny. Zawodnicy czuli się jak u siebie.'; } },
        { t: 'Gadżety, ale bez pieniędzy', hint: 'popularność +', fx: () => { pop(0.5); return 'Kibice dostali czapki i szaliki kadry.'; } },
      ],
    },
    {
      id: 'fis_committee', cat: 'zarząd', w: 2, phase: 'summer', cd: 60,
      when: () => ({}),
      title: () => 'Miejsce w komitecie skoków FIS',
      text: () => 'Zwolniło się miejsce w komitecie skoków narciarskich FIS. Federacja może zgłosić kandydata, ale kampania wśród innych federacji kosztuje.',
      choices: [
        { t: 'Zgłosić kandydata i prowadzić kampanię', hint: '−30 tys. €, 60%: zarząd ++, ryzyko dyskwalifikacji −25% (40 tyg.)', cost: () => 30000, fx: () => { money(-30000, 'Kampania do komitetu FIS'); if (chance(0.6)) { board(4); mod('dsq', -0.25, 40, 'Nasz człowiek w komitecie FIS'); return 'Nasz kandydat wszedł do komitetu. Znamy zmiany w przepisach sprzętowych z wyprzedzeniem.'; } board(-1); return 'Przegraliśmy głosowanie o kilka głosów.'; } },
        { t: 'Poprzeć kandydata innego kraju', hint: 'zarząd +', fx: () => { board(1); return 'Sojusznicy zapamiętają nasze poparcie.'; } },
      ],
    },

    // ===================== ZDROWIE, SPRZĘT, SZTAB, TRENING =====================
    {
      id: 'dietitian', cat: 'zdrowie', w: 3, phase: 'any', cd: 40,
      when: () => ({}),
      title: () => 'Dietetyk sportowy',
      text: () => 'Dietetyk z klubu piłkarskiej ekstraklasy proponuje kadrze plan żywieniowy: bezpieczna waga, więcej energii na treningach, mniej urazów przeciążeniowych.',
      choices: [
        { t: 'Zatrudnić na pół roku', hint: '−35 tys. €, ryzyko kontuzji −15%, trening +2% (20 tyg.)', cost: () => 35000, fx: () => { money(-35000, 'Dietetyk sportowy'); mod('injury', -0.15, 20, 'Plan żywieniowy'); mod('train', 0.02, 20, 'Plan żywieniowy'); return 'Zawodnicy jedzą mądrzej i mają więcej siły na treningach.'; } },
        { t: 'Jednorazowe konsultacje', hint: '−6 tys. €, ryzyko kontuzji −5% (8 tyg.)', cost: () => 6000, fx: () => { money(-6000, 'Konsultacje dietetyczne'); mod('injury', -0.05, 8, 'Konsultacje dietetyczne'); return 'Każdy zawodnik dostał indywidualne zalecenia.'; } },
        { t: 'Nie potrzebujemy', hint: 'brak efektu', fx: () => 'Zostajemy przy stołówce hotelowej.' },
      ],
    },
    {
      id: 'stolen_skis', cat: 'sprzęt', w: 3, phase: 'season', cd: 40,
      when: () => (group('A').length ? {} : null),
      title: () => 'Kradzież nart z busa',
      text: () => 'W nocy przed wyjazdem ktoś włamał się do busa serwisowego. Zniknęły narty i kombinezony części kadry A.',
      choices: [
        { t: 'Ekspresowy zakup nowego sprzętu', hint: '−45 tys. €', cost: () => 45000, fx: () => { money(-45000, 'Nowy sprzęt po kradzieży'); return 'Serwismeni pracowali całą noc – wszyscy wystartują na nowym sprzęcie.'; } },
        { t: 'Skakać na zapasowym sprzęcie', hint: 'sprzęt −0,5 (4 tyg.)', fx: () => { mod('equip', -0.5, 4, 'Zapasowy sprzęt po kradzieży'); return 'Zapasowe narty są starsze i wolniejsze na progu.'; } },
      ],
    },
    {
      id: 'mental_coach', cat: 'sztab', w: 3, phase: 'any', cd: 40,
      when: () => (group('A').length >= 3 ? {} : null),
      title: () => 'Psycholog sportu dla kadry A',
      text: () => 'Znany psycholog, który pracował z medalistami olimpijskimi, proponuje cykl warsztatów z koncentracji i radzenia sobie z presją.',
      choices: [
        { t: 'Warsztaty dla całej kadry A', hint: '−40 tys. €, psychika kadry A +', cost: () => 40000, fx: () => { money(-40000, 'Warsztaty z psychologiem'); group('A').forEach((x) => { attr(x, 'mental', 1.5); morale(x, 3); }); return 'Zawodnicy uczą się rutyn przed skokiem i oddychania na belce.'; } },
        { t: 'Tylko dla najmłodszych w kadrze', hint: '−15 tys. €, psychika młodych +', cost: () => 15000, fx: () => { money(-15000, 'Warsztaty z psychologiem (młodzi)'); my().filter((x) => (x.group === 'A' || x.group === 'B') && age(x) <= 22).forEach((x) => attr(x, 'mental', 2)); return 'Młodzi zawodnicy są wyraźnie spokojniejsi na zawodach.'; } },
        { t: 'Odmówić', hint: 'brak efektu', fx: () => 'Psycholog trafi do innej federacji.' },
      ],
    },
    {
      id: 'foreign_team_camp', cat: 'trening', w: 3, phase: 'summer', cd: 50,
      when: () => (bigHills().length ? { nat: strongerNation() } : null),
      title: (c) => `Kadra ${natName(c.nat)} chce trenować u nas`,
      text: (c) => `Reprezentacja (${natName(c.nat)}) szuka igelitu na letnie zgrupowanie i pyta o nasze skocznie. Zapłaci za wynajem, ale nasi zawodnicy będą mieli mniej czasu na skoczni.`,
      choices: [
        { t: 'Wynająć i trenować razem', hint: '+25 tys. €, trening +2% (6 tyg.)', fx: () => { money(25000, 'Wynajem skoczni zagranicznej kadrze'); mod('train', 0.02, 6, 'Wspólne treningi z czołową kadrą'); return 'Nasi zawodnicy podpatrują technikę rywali. Trenerzy wymieniają się doświadczeniami.'; } },
        { t: 'Wynająć w wolnych godzinach', hint: '+40 tys. €, trening −2% (4 tyg.)', fx: () => { money(40000, 'Wynajem skoczni zagranicznej kadrze'); mod('train', -0.02, 4, 'Skocznia zajęta przez gości'); return 'Budżet się cieszy, nasi trenują w gorszych godzinach.'; } },
        { t: 'Odmówić', hint: 'brak efektu', fx: () => 'Skocznie zostają do naszej dyspozycji.' },
      ],
    },
  ];
  // wyniki z poprzedniego tygodnia (dla wydarzeń reagujących)
  function prevResults() {
    const s = st();
    const w = s.calendar.weeks[s.week - 1];
    if (!w) return [];
    return w.events.map((ev) => ({ ev, res: s.results[ev.id] })).filter((x) => x.res && x.res.ranking && x.res.ranking.length);
  }
  const byId = Object.fromEntries(T.map((t) => [t.id, t]));

  // ---------- Silnik ----------
  function trigger(t, ctx) {
    const d = data();
    d.last[t.id] = now();
    d.lastCat = t.cat;
    d.count++;
    const title = t.title(ctx), text = t.text(ctx);
    if (t.auto) {
      const res = t.auto(ctx);
      M.news(title, `${text}<br><br>${res}`, 'event');
      cleanupNominations();
      return;
    }
    d.pending.push({ id: t.id, ctx, title, text, cat: t.cat });
  }

  function pickTemplate(phase) {
    const d = data();
    let pool = T.filter((t) => !t.followup && t.w > 0 && (t.phase === phase || t.phase === 'any') &&
      now() - (d.last[t.id] !== undefined ? d.last[t.id] : -999) >= (t.cd || 18) && t.cat !== d.lastCat &&
      !d.pending.some((p) => p.id === t.id));
    for (let tries = 0; tries < 12 && pool.length; tries++) {
      const total = U.sum(pool, (t) => t.w);
      let r = Math.random() * total, chosen = pool[0];
      for (const t of pool) { r -= t.w; if (r <= 0) { chosen = t; break; } }
      let ctx = null;
      try { ctx = chosen.when({}); } catch (e) { console.error(e); ctx = null; }
      if (ctx) return { t: chosen, ctx };
      pool = pool.filter((t) => t !== chosen);
    }
    return null;
  }

  function roll(phase, force) {
    const s = st();
    if (!s || s.gameOver) return;
    const d = data();
    // zaplanowane wydarzenia następcze
    const due = d.queue.filter((q) => q.at <= now());
    d.queue = d.queue.filter((q) => q.at > now());
    for (const q of due) {
      const t = byId[q.id];
      if (!t) continue;
      const ctx = t.when ? t.when(q.ctx) : q.ctx;
      if (ctx) trigger(t, ctx);
    }
    if (d.pending.length >= MAX_PENDING) return;
    const freq = { low: 0.5, normal: 1, high: 1.6, off: 0 }[(s.settings && s.settings.eventFreq) || "normal"];
    if (!freq) return;
    if (!force && Math.random() > CHANCE[phase] * freq) return;
    const r = pickTemplate(phase);
    if (r) trigger(r.t, r.ctx);
  }

  function valid(p) {
    if (!byId[p.id]) return false;
    for (const key of ['jid', 'a', 'b']) if (p.ctx[key] && !J(p.ctx[key])) return false;
    if (p.ctx.jid && J(p.ctx.jid).nation !== st().nation) return false;
    if (p.ctx.hid && !hill(p.ctx.hid)) return false;
    if (p.ctx.role && !staff(p.ctx.role)) return false;
    return true;
  }
  function pending() {
    const d = data();
    d.pending = d.pending.filter(valid);
    return d.pending;
  }
  function choicesOf(p) {
    const t = byId[p.id];
    return t.choices.map((c) => {
      const cost = c.cost ? c.cost(p.ctx) : 0;
      return { label: c.t, hint: c.hint, cost, disabled: cost > 0 && P().budget < cost };
    });
  }
  function resolve(idx, choiceIdx) {
    const d = data();
    const p = pending()[idx];
    if (!p) return null;
    const t = byId[p.id];
    const c = t.choices[choiceIdx];
    const cost = c.cost ? c.cost(p.ctx) : 0;
    if (cost > 0 && P().budget < cost) return { error: 'Brak środków na tę decyzję.' };
    let res;
    try { res = c.fx(p.ctx); } catch (e) { console.error(e); res = 'Decyzja została podjęta.'; }
    cleanupNominations();
    d.pending = d.pending.filter((x) => x !== p);
    M.news(p.title, `${p.text}<br><br><b>Decyzja:</b> ${c.t}<br>${res}`, 'event');
    return { text: res };
  }

  // usuwa z nominacji zawodników, którzy odeszli lub zmienili barwy
  function cleanupNominations() {
    const s = st();
    if (!s.nominations || !s.nominations.byLevel) return;
    const ok = (id) => s.jumpers[id] && s.jumpers[id].nation === s.nation;
    for (const lv of Object.keys(s.nominations.byLevel)) s.nominations.byLevel[lv] = s.nominations.byLevel[lv].filter(ok);
    for (const e of Object.keys(s.nominations.teams || {})) s.nominations.teams[e] = s.nominations.teams[e].filter(ok);
  }

  // rozliczenia po sezonie – zwraca zmianę oceny zarządu
  function seasonEnd(rank, exp, summary) {
    const d = data();
    let delta = 0;
    for (const it of d.seasonEnd) {
      if (it.id === 'sponsor_contract') {
        if (rank > it.ctx.target) { money(-Math.round(it.ctx.amount / 2), 'Zwrot dla sponsora (cel niezrealizowany)'); delta -= 3; summary.lines.push(`💸 Sponsor warunkowy zażądał zwrotu ${k(Math.round(it.ctx.amount / 2))} (cel: ${it.ctx.target}. miejsce).`); }
        else { money(Math.round(it.ctx.amount * 0.2), 'Premia sponsora za realizację celu'); summary.lines.push(`🤝 Warunki umowy sponsorskiej spełnione – premia ${k(Math.round(it.ctx.amount * 0.2))}.`); }
      }
      if (it.id === 'start_promise') {
        const j = J(it.ctx.jid);
        if (j && j.nation === st().nation) {
          const made = j.season.starts - it.ctx.base;
          if (made >= 3) { morale(j, 10); summary.lines.push(`✅ Dotrzymałeś obietnicy – ${nm(j)} dostał ${made} startów i zostaje w kadrze.`); }
          else { j.quitRisk = true; summary.lines.push(`❌ Niedotrzymana obietnica: ${nm(j)} wystartował tylko ${made} raz(y) i rozważa koniec kariery.`); }
        }
      }
      if (it.id === 'board_promise') {
        if (rank <= it.ctx.target) { delta += 5; summary.lines.push('✅ Dotrzymałeś obietnicy złożonej zarządowi.'); }
        else { delta -= 8; summary.lines.push('❌ Obietnica złożona zarządowi nie została dotrzymana.'); }
      }
    }
    d.seasonEnd = [];
    return delta;
  }

  return { roll, pending, choicesOf, resolve, seasonEnd, TEMPLATES: T, data };
})();
