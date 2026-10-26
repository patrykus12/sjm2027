// Prawdziwe sztaby szkoleniowe (sezon 2026/27) – używane przy grze z bazą prawdziwych zawodników.
// q = jakość w grze (ocena autorska), b = rok urodzenia (gdy znany), nat = narodowość, jeśli inna niż kraj kadry.
// Źródła: de.wikipedia.org (Skisprung-Weltcup 2026/27), komunikaty PZN, U.S. Ski & Snowboard, Svaz lyžařů ČR.
SJM.REAL_STAFF = {
  POL: {
    coachA: { first: 'Maciej', last: 'Maciusiak', q: 72 },
    coachB: { first: 'Wojciech', last: 'Topór', q: 62 },
    coachJ: { first: 'Daniel', last: 'Kwiatkowski', q: 56 },
  },
  AUT: {
    coachA: { first: 'Andreas', last: 'Widhölzl', q: 82, b: 1976 },
  },
  GER: {
    coachA: { first: 'Andreas', last: 'Mitter', q: 76, nat: 'AUT' },
    coachB: { first: 'Thomas', last: 'Thurnbichler', q: 70, b: 1989, nat: 'AUT' },
    coachJ: { first: 'Christian', last: 'Winkler', q: 58 },
  },
  SLO: {
    coachA: { first: 'Robert', last: 'Hrgota', q: 84, b: 1988 },
    coachB: { first: 'Gašper', last: 'Vodan', q: 62 },
    coachJ: { first: 'Gorazd', last: 'Bertoncelj', q: 62 },
  },
  NOR: {
    coachA: { first: 'Rune', last: 'Velta', q: 72, b: 1989 },
    coachB: { first: 'Andreas', last: 'Varsi Breivik', q: 56 },
    coachJ: { first: 'Yngve', last: 'Ludvigsen', q: 54 },
  },
  JPN: {
    coachA: { first: 'Kento', last: 'Sakuyama', q: 72 },
  },
  SUI: {
    coachA: { first: 'Bine', last: 'Norčič', q: 70, b: 1981, nat: 'SLO' },
    coachB: { first: 'Carlo', last: 'Brömel', q: 54 },
    coachJ: { first: 'Marvin', last: 'Scherrer', q: 48 },
  },
  FIN: {
    coachA: { first: 'Lauri', last: 'Hakola', q: 60, b: 1979 },
    coachB: { first: 'Jarkko', last: 'Saapunki', q: 50 },
    coachJ: { first: 'Eetu', last: 'Kytösaho', q: 48 },
  },
  CZE: {
    coachA: { first: 'Jaroslav', last: 'Sakala', q: 58, b: 1969 },
  },
  ITA: {
    coachA: { first: 'Ivo', last: 'Pertile', q: 62 },
    coachB: { first: 'Virginio', last: 'Lunardi', q: 52 },
    coachJ: { first: 'Romed', last: 'Moroder', q: 48 },
  },
  USA: {
    coachA: { first: 'Tore', last: 'Sneli', q: 52, nat: 'NOR' },
  },
  FRA: {
    coachA: { first: 'Nicolas', last: 'Dessum', q: 58, b: 1977 },
    coachB: { first: 'Yoann', last: 'Morel', q: 50 },
    coachJ: { first: 'David', last: 'Viry', q: 46 },
  },
};

// Prawdziwi trenerzy bez posady w kadrze narodowej – pojawiają się na rynku sztabu.
SJM.REAL_STAFF_FREE = [
  { role: 'coachA', first: 'Stefan', last: 'Horngacher', q: 88, b: 1969, nat: 'AUT' },
  { role: 'coachA', first: 'Alexander', last: 'Stöckl', q: 84, b: 1973, nat: 'AUT' },
  { role: 'coachA', first: 'Werner', last: 'Schuster', q: 82, b: 1969, nat: 'AUT' },
  { role: 'coachA', first: 'Alexander', last: 'Pointner', q: 78, b: 1971, nat: 'AUT' },
  { role: 'coachB', first: 'Igor', last: 'Medved', q: 60, b: 1981, nat: 'SLO' },
  { role: 'coachB', first: 'Gaj', last: 'Trček', q: 56, nat: 'SLO' },
];
