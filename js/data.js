// ===== Dane statyczne: kraje, skocznie, pule imion =====
window.SJM = window.SJM || {};

SJM.NATIONS = [
  // code, nazwa, flaga, siła (0-100), liczebność kadr, budżet roczny (mln €), popularność, pula imion
  { code: 'AUT', name: 'Austria',      flag: '🇦🇹', strength: 94, depth: 40, budget: 5.5, pop: 85, names: 'de' },
  { code: 'SLO', name: 'Słowenia',     flag: '🇸🇮', strength: 92, depth: 34, budget: 3.5, pop: 90, names: 'sl' },
  { code: 'GER', name: 'Niemcy',       flag: '🇩🇪', strength: 90, depth: 40, budget: 6.0, pop: 75, names: 'de' },
  { code: 'NOR', name: 'Norwegia',     flag: '🇳🇴', strength: 89, depth: 36, budget: 4.5, pop: 70, names: 'no' },
  { code: 'JPN', name: 'Japonia',      flag: '🇯🇵', strength: 86, depth: 32, budget: 4.0, pop: 60, names: 'jp' },
  { code: 'POL', name: 'Polska',       flag: '🇵🇱', strength: 84, depth: 34, budget: 4.0, pop: 88, names: 'pl' },
  { code: 'SUI', name: 'Szwajcaria',   flag: '🇨🇭', strength: 73, depth: 20, budget: 2.5, pop: 55, names: 'de' },
  { code: 'RUS', name: 'Rosja',        flag: '🇷🇺', strength: 66, depth: 28, budget: 3.0, pop: 45, names: 'ru' },
  { code: 'FIN', name: 'Finlandia',    flag: '🇫🇮', strength: 64, depth: 22, budget: 1.8, pop: 50, names: 'fi' },
  { code: 'CZE', name: 'Czechy',       flag: '🇨🇿', strength: 62, depth: 22, budget: 1.5, pop: 50, names: 'cz' },
  { code: 'ITA', name: 'Włochy',       flag: '🇮🇹', strength: 62, depth: 22, budget: 1.8, pop: 40, names: 'it' },
  { code: 'USA', name: 'USA',          flag: '🇺🇸', strength: 60, depth: 20, budget: 1.5, pop: 30, names: 'en' },
  { code: 'FRA', name: 'Francja',      flag: '🇫🇷', strength: 52, depth: 16, budget: 1.2, pop: 30, names: 'fr' },
  { code: 'KAZ', name: 'Kazachstan',   flag: '🇰🇿', strength: 50, depth: 16, budget: 1.2, pop: 35, names: 'kz' },
  { code: 'CHN', name: 'Chiny',        flag: '🇨🇳', strength: 45, depth: 14, budget: 2.0, pop: 20, names: 'cn' },
  { code: 'BUL', name: 'Bułgaria',     flag: '🇧🇬', strength: 44, depth: 10, budget: 0.5, pop: 30, names: 'bg' },
  { code: 'UKR', name: 'Ukraina',      flag: '🇺🇦', strength: 42, depth: 12, budget: 0.4, pop: 25, names: 'ua' },
  { code: 'CAN', name: 'Kanada',       flag: '🇨🇦', strength: 42, depth: 12, budget: 0.8, pop: 25, names: 'en' },
  { code: 'EST', name: 'Estonia',      flag: '🇪🇪', strength: 40, depth: 10, budget: 0.5, pop: 30, names: 'ee' },
  { code: 'ROU', name: 'Rumunia',      flag: '🇷🇴', strength: 40, depth: 12, budget: 0.6, pop: 25, names: 'ro' },
  { code: 'TUR', name: 'Turcja',       flag: '🇹🇷', strength: 40, depth: 12, budget: 0.8, pop: 20, names: 'tr' },
  { code: 'SWE', name: 'Szwecja',      flag: '🇸🇪', strength: 38, depth: 12, budget: 0.8, pop: 25, names: 'se' },
  { code: 'KOR', name: 'Korea Płd.',   flag: '🇰🇷', strength: 32, depth: 10, budget: 0.8, pop: 15, names: 'kr' },
  { code: 'SVK', name: 'Słowacja',     flag: '🇸🇰', strength: 28, depth: 8,  budget: 0.4, pop: 20, names: 'sk' },
  { code: 'GEO', name: 'Gruzja',       flag: '', strength: 22, depth: 6,  budget: 0.3, pop: 15, names: 'ge' },
  { code: 'LAT', name: 'Łotwa',        flag: '🇱🇻', strength: 14, depth: 4,  budget: 0.2, pop: 8,  names: 'lv' },
  { code: 'THA', name: 'Tajlandia',    flag: '', strength: 12, depth: 3,  budget: 0.3, pop: 5,  names: 'th' },
  { code: 'AZE', name: 'Azerbejdżan',  flag: '', strength: 10, depth: 3,  budget: 0.3, pop: 5,  names: 'az' },
];

// type: 'small' (K<65), 'medium' (K65-84), 'normal' (K85-99), 'large' (K100-134), 'giant' (K135-169, 1,6 pkt/m), 'flying' (K170+)
SJM.HILLS = [
  { id: 'zakopane',      name: 'Wielka Krokiew',        city: 'Zakopane',        nation: 'POL', K: 125, HS: 140 },
  { id: 'wisla',         name: 'Malinka',               city: 'Wisła',           nation: 'POL', K: 120, HS: 134 },
  { id: 'szczyrk',       name: 'Skalite',               city: 'Szczyrk',         nation: 'POL', K: 95,  HS: 104 },
  { id: 'zakopane_nh',   name: 'Średnia Krokiew',       city: 'Zakopane',        nation: 'POL', K: 95,  HS: 105 },
  { id: 'oberstdorf',    name: 'Schattenbergschanze',   city: 'Oberstdorf',      nation: 'GER', K: 120, HS: 137 },
  { id: 'garmisch',      name: 'Olympiaschanze',        city: 'Garmisch-Partenkirchen', nation: 'GER', K: 125, HS: 142 },
  { id: 'willingen',     name: 'Mühlenkopfschanze',     city: 'Willingen',       nation: 'GER', K: 130, HS: 147 },
  { id: 'klingenthal',   name: 'Vogtland Arena',        city: 'Klingenthal',     nation: 'GER', K: 125, HS: 140 },
  { id: 'titisee',       name: 'Hochfirstschanze',      city: 'Titisee-Neustadt', nation: 'GER', K: 125, HS: 142 },
  { id: 'brotterode',    name: 'Inselbergschanze',      city: 'Brotterode',      nation: 'GER', K: 105, HS: 117 },
  { id: 'hinterzarten',  name: 'Rothaus-Schanze',       city: 'Hinterzarten',    nation: 'GER', K: 95,  HS: 108 },
  { id: 'oberstdorf_f',  name: 'Heini-Klopfer',         city: 'Oberstdorf',      nation: 'GER', K: 200, HS: 235 },
  { id: 'innsbruck',     name: 'Bergisel',              city: 'Innsbruck',       nation: 'AUT', K: 120, HS: 128 },
  { id: 'bischofshofen', name: 'Paul-Außerleitner',     city: 'Bischofshofen',   nation: 'AUT', K: 125, HS: 142 },
  { id: 'kulm',          name: 'Kulm',                  city: 'Bad Mitterndorf', nation: 'AUT', K: 200, HS: 235 },
  { id: 'villach',       name: 'Alpenarena',            city: 'Villach',         nation: 'AUT', K: 90,  HS: 98 },
  { id: 'hinzenbach',    name: 'Aigner-Schanze',        city: 'Hinzenbach',      nation: 'AUT', K: 85,  HS: 90 },
  { id: 'stams',         name: 'Brunnentalschanze',     city: 'Stams',           nation: 'AUT', K: 105, HS: 115 },
  { id: 'planica_f',     name: 'Letalnica',             city: 'Planica',         nation: 'SLO', K: 200, HS: 240 },
  { id: 'planica',       name: 'Bloudkova velikanka',   city: 'Planica',         nation: 'SLO', K: 125, HS: 138 },
  { id: 'planica_nh',    name: 'Bloudkova (normalna)',  city: 'Planica',         nation: 'SLO', K: 95,  HS: 102 },
  { id: 'kranj',         name: 'Bauhenk',               city: 'Kranj',           nation: 'SLO', K: 100, HS: 109 },
  { id: 'ljubno',        name: 'Savina',               city: 'Ljubno',          nation: 'SLO', K: 85,  HS: 94 },
  { id: 'vikersund',     name: 'Vikersundbakken',       city: 'Vikersund',       nation: 'NOR', K: 200, HS: 240 },
  { id: 'oslo',          name: 'Holmenkollbakken',      city: 'Oslo',            nation: 'NOR', K: 120, HS: 134 },
  { id: 'lillehammer',   name: 'Lysgårdsbakken',        city: 'Lillehammer',     nation: 'NOR', K: 123, HS: 140 },
  { id: 'trondheim',     name: 'Granåsen',              city: 'Trondheim',       nation: 'NOR', K: 124, HS: 140 },
  { id: 'trondheim_nh',  name: 'Granåsen (normalna)',   city: 'Trondheim',       nation: 'NOR', K: 95,  HS: 105 },
  { id: 'rena',          name: 'Renabakkene',           city: 'Rena',            nation: 'NOR', K: 124, HS: 139 },
  { id: 'lahti',         name: 'Salpausselkä',          city: 'Lahti',           nation: 'FIN', K: 116, HS: 130 },
  { id: 'lahti_nh',      name: 'Salpausselkä (normalna)', city: 'Lahti',         nation: 'FIN', K: 90,  HS: 100 },
  { id: 'ruka',          name: 'Rukatunturi',           city: 'Ruka',            nation: 'FIN', K: 120, HS: 142 },
  { id: 'engelberg',     name: 'Gross-Titlis',          city: 'Engelberg',       nation: 'SUI', K: 125, HS: 140 },
  { id: 'kandersteg',    name: 'Lötschberg',            city: 'Kandersteg',      nation: 'SUI', K: 95,  HS: 106 },
  { id: 'einsiedeln',    name: 'Andreas Küttel Schanze', city: 'Einsiedeln',     nation: 'SUI', K: 105, HS: 117 },
  { id: 'sapporo',       name: 'Okurayama',             city: 'Sapporo',         nation: 'JPN', K: 123, HS: 137 },
  { id: 'hakuba',        name: 'Hakuba LH',             city: 'Hakuba',          nation: 'JPN', K: 120, HS: 131 },
  { id: 'liberec',       name: 'Ještěd',                city: 'Liberec',         nation: 'CZE', K: 120, HS: 136 },
  { id: 'liberec_nh',    name: 'Ještěd (normalna)',     city: 'Liberec',         nation: 'CZE', K: 90,  HS: 100 },
  { id: 'frenstat',      name: 'Areál Horečky',         city: 'Frenštát p. R.',  nation: 'CZE', K: 95,  HS: 106 },
  { id: 'predazzo',      name: 'Trampolino Dal Ben',    city: 'Predazzo',        nation: 'ITA', K: 128, HS: 141 },
  { id: 'predazzo_nh',   name: 'Dal Ben (normalna)',    city: 'Predazzo',        nation: 'ITA', K: 98,  HS: 107 },
  { id: 'lake_placid',   name: 'MacKenzie Intervale',   city: 'Lake Placid',     nation: 'USA', K: 120, HS: 128 },
  { id: 'lake_placid_nh',name: 'Intervale (normalna)',  city: 'Lake Placid',     nation: 'USA', K: 90,  HS: 100 },
  { id: 'iron_mountain', name: 'Pine Mountain',         city: 'Iron Mountain',   nation: 'USA', K: 120, HS: 133 },
  { id: 'park_city',     name: 'Utah Olympic Park',     city: 'Park City',       nation: 'USA', K: 120, HS: 134 },
  { id: 'park_city_nh',  name: 'Utah Olympic Park (normalna)', city: 'Park City', nation: 'USA', K: 90,  HS: 100 },
  { id: 'courchevel',    name: 'Le Praz',               city: 'Courchevel',      nation: 'FRA', K: 120, HS: 132 },
  { id: 'courchevel_nh', name: 'Le Praz (normalna)',    city: 'Courchevel',      nation: 'FRA', K: 90,  HS: 96 },
  { id: 'chaux_neuve',   name: 'La Côté Feuillée',      city: 'Chaux-Neuve',     nation: 'FRA', K: 106, HS: 118 },
  { id: 'almaty',        name: 'Sunkar',                city: 'Ałmaty',          nation: 'KAZ', K: 125, HS: 140 },
  { id: 'zhangjiakou',   name: 'Snow Ruyi',             city: 'Zhangjiakou',     nation: 'CHN', K: 125, HS: 140 },
  { id: 'zhangjiakou_nh',name: 'Snow Ruyi (normalna)',  city: 'Zhangjiakou',     nation: 'CHN', K: 95,  HS: 106 },
  { id: 'whistler',      name: 'Whistler Olympic Park', city: 'Whistler',        nation: 'CAN', K: 120, HS: 140 },
  { id: 'otepaa',        name: 'Tehvandi',              city: 'Otepää',          nation: 'EST', K: 90,  HS: 100 },
  { id: 'rasnov',        name: 'Trambulina Valea Cărbunării', city: 'Râșnov',    nation: 'ROU', K: 90,  HS: 97 },
  { id: 'erzurum',       name: 'Kiremitliktepe',        city: 'Erzurum',         nation: 'TUR', K: 125, HS: 140 },
  { id: 'erzurum_nh',    name: 'Kiremitliktepe (normalna)', city: 'Erzurum',     nation: 'TUR', K: 95,  HS: 109 },
  { id: 'falun',         name: 'Lugnet',                city: 'Falun',           nation: 'SWE', K: 120, HS: 132 },
  { id: 'falun_nh',      name: 'Lugnet (normalna)',     city: 'Falun',           nation: 'SWE', K: 90,  HS: 100 },
  { id: 'pyeongchang',   name: 'Alpensia',              city: 'Pjongczang',      nation: 'KOR', K: 125, HS: 140 },
  { id: 'vorokhta',      name: 'Awanhard',              city: 'Worochta',        nation: 'UKR', K: 75,  HS: 84 },
  { id: 'borovets',      name: 'Borowec',               city: 'Borowec',         nation: 'BUL', K: 75,  HS: 85 },
  { id: 'nizhny_tagil',  name: 'Aist',                  city: 'Niżny Tagił',     nation: 'RUS', K: 120, HS: 134 },
  { id: 'nizhny_tagil_nh', name: 'Aist (normalna)',     city: 'Niżny Tagił',     nation: 'RUS', K: 90,  HS: 97 },
  { id: 'chaikovsky',    name: 'Snieżinka',             city: 'Czajkowski',      nation: 'RUS', K: 125, HS: 140 },
  { id: 'sochi',         name: 'RusSki Gorki',          city: 'Krasnaja Polana', nation: 'RUS', K: 125, HS: 140 },
  { id: 'sochi_nh',      name: 'RusSki Gorki (normalna)', city: 'Krasnaja Polana', nation: 'RUS', K: 95, HS: 106 },
  // mniejsze i krajowe obiekty (K – przybliżone tam, gdzie znany jest tylko HS)
  { id: 'seefeld',       name: 'Toni-Seelos-Olympiaschanze', city: 'Seefeld',    nation: 'AUT', K: 99,  HS: 109 },
  { id: 'seefeld_s',     name: 'Toni-Seelos (mała)',    city: 'Seefeld',         nation: 'AUT', K: 68,  HS: 75 },
  { id: 'eisenerz',      name: 'Erzbergschanze',        city: 'Eisenerz',        nation: 'AUT', K: 100, HS: 109 },
  { id: 'eisenerz_s',    name: 'Erzberg (mała)',        city: 'Eisenerz',        nation: 'AUT', K: 63,  HS: 70 },
  { id: 'tschagguns',    name: 'Zelfenschanze',         city: 'Tschagguns',      nation: 'AUT', K: 93,  HS: 103 },
  { id: 'ramsau',        name: 'W90-Mattensprunganlage', city: 'Ramsau am Dachstein', nation: 'AUT', K: 90, HS: 98 },
  { id: 'mislinja',      name: 'Skakalnica Mislinja',   city: 'Mislinja',        nation: 'SLO', K: 77,  HS: 85 },
  { id: 'mislinja_s',    name: 'Mislinja (mała)',       city: 'Mislinja',        nation: 'SLO', K: 65,  HS: 72 },
  { id: 'velenje',       name: 'Skakalnica Velenje',    city: 'Velenje',         nation: 'SLO', K: 68,  HS: 75 },
  { id: 'planica_s',     name: 'Planica (mała)',        city: 'Planica',         nation: 'SLO', K: 72,  HS: 80 },
  { id: 'oberhof',       name: 'Kanzlersgrund',         city: 'Oberhof',         nation: 'GER', K: 120, HS: 140 },
  { id: 'oberhof_nh',    name: 'Kanzlersgrund (normalna)', city: 'Oberhof',      nation: 'GER', K: 90,  HS: 100 },
  { id: 'winterberg',    name: 'St.-Georg-Schanze',     city: 'Winterberg',      nation: 'GER', K: 79,  HS: 87 },
  { id: 'lillehammer_nh', name: 'Lysgårdsbakken (normalna)', city: 'Lillehammer', nation: 'NOR', K: 90, HS: 98 },
  { id: 'rena_nh',       name: 'Renabakkene (normalna)', city: 'Rena',           nation: 'NOR', K: 99,  HS: 109 },
  { id: 'vikersund_l',   name: 'Vikersund (duża)',      city: 'Vikersund',       nation: 'NOR', K: 106, HS: 117 },
  { id: 'vikersund_s',   name: 'Vikersund (mała)',      city: 'Vikersund',       nation: 'NOR', K: 65,  HS: 72 },
  { id: 'oslo_nh',       name: 'Midtstubakken',         city: 'Oslo',            nation: 'NOR', K: 95,  HS: 106 },
  { id: 'mo_i_rana',     name: 'Fageråsbakken',         city: 'Mo i Rana',       nation: 'NOR', K: 100, HS: 110 },
  { id: 'mo_i_rana_s',   name: 'Fageråsbakken (mała)',  city: 'Mo i Rana',       nation: 'NOR', K: 75,  HS: 82 },
  { id: 'drammen',       name: 'Skocznia Drammen',      city: 'Drammen',         nation: 'NOR', K: 72,  HS: 80 },
  { id: 'tromso',        name: 'Skocznia Tromsø',       city: 'Tromsø',          nation: 'NOR', K: 68,  HS: 75 },
  { id: 'zao',           name: 'Kuraray Zaō Schanze',   city: 'Zaō',             nation: 'JPN', K: 95,  HS: 102 },
  { id: 'hakuba_nh',     name: 'Hakuba NH',             city: 'Hakuba',          nation: 'JPN', K: 90,  HS: 98 },
  { id: 'sapporo_nh',    name: 'Miyanomori',            city: 'Sapporo',         nation: 'JPN', K: 90,  HS: 100 },
  { id: 'myoko',         name: 'Skocznia Myōkō Kōgen',  city: 'Myōkō Kōgen',     nation: 'JPN', K: 90,  HS: 100 },
  { id: 'nayoro',        name: 'Piyashiri',             city: 'Nayoro',          nation: 'JPN', K: 90,  HS: 100 },
  { id: 'nayoro_s',      name: 'Piyashiri (mała)',      city: 'Nayoro',          nation: 'JPN', K: 65,  HS: 71 },
  { id: 'iiyama',        name: 'Skocznia Iiyama',       city: 'Iiyama',          nation: 'JPN', K: 80,  HS: 89 },
  { id: 'szczyrk_s',     name: 'Skalite (średnia)',     city: 'Szczyrk',         nation: 'POL', K: 68,  HS: 75 },
  { id: 'zakopane_s',    name: 'Mała Krokiew',          city: 'Zakopane',        nation: 'POL', K: 63,  HS: 70 },
  { id: 'moscow',        name: 'Worobjowy Gory',        city: 'Moskwa',          nation: 'RUS', K: 72,  HS: 80 },
  { id: 'chaikovsky_nh', name: 'Snieżinka (normalna)',  city: 'Czajkowski',      nation: 'RUS', K: 92,  HS: 102 },
  { id: 'kuopio',        name: 'Puijo',                 city: 'Kuopio',          nation: 'FIN', K: 120, HS: 127 },
  { id: 'jyvaskyla',     name: 'Laajavuori',            city: 'Jyväskylä',       nation: 'FIN', K: 100, HS: 108 },
  { id: 'rovaniemi',     name: 'Ounasvaara',            city: 'Rovaniemi',       nation: 'FIN', K: 90,  HS: 100 },
  { id: 'rovaniemi_s',   name: 'Ounasvaara (mała)',     city: 'Rovaniemi',       nation: 'FIN', K: 63,  HS: 70 },
  { id: 'lahti_s',       name: 'Salpausselkä (mała)',   city: 'Lahti',           nation: 'FIN', K: 64,  HS: 70 },
  { id: 'ruka_s',        name: 'Rukatunturi (mała)',    city: 'Ruka',            nation: 'FIN', K: 64,  HS: 70 },
  { id: 'taivalkoski',   name: 'Skocznia Taivalkoski',  city: 'Taivalkoski',     nation: 'FIN', K: 72,  HS: 80 },
  { id: 'harrachov',     name: 'Čerťák (normalna)',     city: 'Harrachov',       nation: 'CZE', K: 90,  HS: 100 },
  { id: 'harrachov_s',   name: 'Čerťák (mała)',         city: 'Harrachov',       nation: 'CZE', K: 65,  HS: 73 },
  { id: 'roznov',        name: 'Skocznia Rožnov',       city: 'Rožnov p. R.',    nation: 'CZE', K: 70,  HS: 77 },
  { id: 'westby',        name: 'Snowflake',             city: 'Westby',          nation: 'USA', K: 106, HS: 118 },
  { id: 'steamboat',     name: 'Howelsen Hill',         city: 'Steamboat Springs', nation: 'USA', K: 90, HS: 100 },
  { id: 'steamboat_s',   name: 'Howelsen Hill (mała)',  city: 'Steamboat Springs', nation: 'USA', K: 68, HS: 75 },
  { id: 'brattleboro',   name: 'Harris Hill',           city: 'Brattleboro',     nation: 'USA', K: 90,  HS: 98 },
  { id: 'ishpeming',     name: 'Suicide Hill',          city: 'Ishpeming',       nation: 'USA', K: 87,  HS: 96 },
  { id: 'chamonix',      name: 'Le Mont',               city: 'Chamonix',        nation: 'FRA', K: 95,  HS: 105 },
  { id: 'premanon',      name: 'Les Tuffes',            city: 'Prémanon',        nation: 'FRA', K: 82,  HS: 90 },
  { id: 'almaty_nh',     name: 'Sunkar (normalna)',     city: 'Ałmaty',          nation: 'KAZ', K: 90,  HS: 100 },
  { id: 'shchuchinsk',   name: 'Skocznia Szczuczyńsk',  city: 'Szczuczyńsk',     nation: 'KAZ', K: 125, HS: 140 },
  { id: 'shchuchinsk_nh', name: 'Szczuczyńsk (normalna)', city: 'Szczuczyńsk',   nation: 'KAZ', K: 90,  HS: 99 },
  { id: 'laiyuan',       name: 'Skocznia Laiyuan',      city: 'Laiyuan',         nation: 'CHN', K: 125, HS: 140 },
  { id: 'laiyuan_nh',    name: 'Laiyuan (normalna)',    city: 'Laiyuan',         nation: 'CHN', K: 95,  HS: 106 },
  { id: 'laiyuan_s',     name: 'Laiyuan (mała)',        city: 'Laiyuan',         nation: 'CHN', K: 67,  HS: 74 },
  { id: 'yabuli',        name: 'Skocznia Yabuli',       city: 'Yabuli',          nation: 'CHN', K: 90,  HS: 98 },
  { id: 'altay',         name: 'Skocznia Altay',        city: 'Altay',           nation: 'CHN', K: 95,  HS: 104 },
  { id: 'jilin',         name: 'Skocznia Jilin',        city: 'Jilin',           nation: 'CHN', K: 90,  HS: 100 },
  { id: 'vorokhta_nh',   name: 'Awanhard (normalna)',   city: 'Worochta',        nation: 'UKR', K: 90,  HS: 100 },
  { id: 'whistler_nh',   name: 'Whistler Olympic Park (normalna)', city: 'Whistler', nation: 'CAN', K: 95, HS: 104 },
  { id: 'rasnov_s',      name: 'Valea Cărbunării (mała)', city: 'Râșnov',        nation: 'ROU', K: 64,  HS: 71 },
  { id: 'ornskoldsvik',  name: 'Paradiskullen',         city: 'Örnsköldsvik',    nation: 'SWE', K: 90,  HS: 100 },
  { id: 'solleftea',     name: 'Hallstabacken',         city: 'Sollefteå',       nation: 'SWE', K: 85,  HS: 92 },
  { id: 'pyeongchang_nh', name: 'Alpensia (normalna)',  city: 'Pjongczang',      nation: 'KOR', K: 98,  HS: 109 },
  { id: 'selce',         name: 'Skocznia Selce',        city: 'Selce',           nation: 'SVK', K: 65,  HS: 72 },
  { id: 'selce_s',       name: 'Selce (mała)',          city: 'Selce',           nation: 'SVK', K: 38,  HS: 42 },
  { id: 'banska_bystrica', name: 'Skocznia Bańska Bystrzyca', city: 'Bańska Bystrzyca', nation: 'SVK', K: 58, HS: 65 },
  { id: 'banska_bystrica_s', name: 'Bańska Bystrzyca (mała)', city: 'Bańska Bystrzyca', nation: 'SVK', K: 38, HS: 42 },
  { id: 'bakuriani',     name: 'Skocznia Bakuriani',    city: 'Bakuriani',       nation: 'GEO', K: 55,  HS: 61 },
];

// Skocznie klubowe i gminne w użytku (stan 2026): „Miasto:HS55,K40” – brakujący wymiar liczony w przybliżeniu (K ≈ 0,9·HS).
// Utrzymują je kluby i samorządy – związek nie płaci za ich utrzymanie i nie może ich zamknąć.
SJM.CLUB_HILLS_RAW = {
  AUT: 'Ramsau am Dachstein:HS55|Absam:HS69,HS44|Bischofshofen:HS78|Hinzenbach:HS47|Schattberg:HS42|Mayrhofen:K67,K40|Ramingstein:K50|Saalfelden:HS94,HS65|Tschagguns:HS66,HS40|Villach:HS68|Achomitz:K50|Bad Ischl:HS45|Hohnhart:HS55|Rottenmann:K40|Stams:HS66|Wörgl:K60',
  CAN: 'Red Deer:K45|Whistler:HS40',
  CHN: 'Altay:K70|Jilin:K50|Tonghua:K60,K40|Yabuli:K60',
  CZE: 'Desná:HS70,K40|Lomnice nad Popelkou:K43|Machov:K40|Nové Město na Moravě:K53|Frenštát p. R.:HS46|Harrachov:K40|Osek:K40',
  EST: 'Otepää:K45|Tallinn:HS60',
  FIN: 'Haapavesi:HS40|Janakkala:K45|Joroinen:K50|Kajaani:HS62|Kouvola:HS60|Taivalkoski:HS52,HS40|Vuokatti:HS54|Harjavalta:HS45|Jämsänkoski:HS47|Joensuu:K50|Jyväskylä:HS68,HS42|Kitee:HS60|Lapua:HS55|Paimio:HS62|Pielavesi:HS44|Rovaniemi:HS40|Saarijärvi:K46|Siilinjärvi:HS46|Suonenjoki:K50|Tampere:HS52',
  FRA: 'Autrans:HS64|Chamonix:HS55|Chaux-Neuve:HS60|Gérardmer:HS72|Courchevel:HS65|La Bresse:HS44',
  GER: 'Bad Elster:HS52|Bad Griesbach:HS63|Berchtesgaden:HS64|Bischofsgrün:HS71|Degenfeld:HS83,HS48|Garmisch-Partenkirchen:HS89,HS47|Haselbach:K50|Klingenthal:HS85,HS68,K40|Kottmar:K51|Meinerzhagen:HS68,HS40|Meßstetten:K40|Rastbüchl:HS78|Rodewisch:K45|Ruhpolding:K65,HS45|Schmiedefeld:HS50|Schonach:HS100|Wartenberg:HS42|Willingen:K47|Bad Freienwalde:HS66,K42|Baiersbronn:HS62,K43|Braunlage:K58,K40|Geyer:K40|Hinterzarten:HS77|Isny im Allgäu:K60|Johanngeorgenstadt:HS56|Lauscha:K47|Oberhof:HS70|Oberstdorf:HS60,HS42|Oberwiesenthal:HS105,HS69|Pöhla:HS66|Schönwald:HS42|Spitzkunnersdorf:K40|Wernigerode:HS67|Winterberg:HS47|Wippra:K45|Zschopau:K44',
  ITA: 'Predazzo:HS66|Pragelato:HS66',
  JPN: 'Asahi:HS68,HS45|Katashina:HS83|Koide:HS54|Myōkō Kōgen:HS68,K40|Ojiya:HS48|Oyama:HS83,HS54|Shimokawa:HS70,HS45|Sugadaira:HS65|Tayama:HS87,HS58,HS56|Yoichi:HS59|Goshogawara:K40|Hakuba:HS59|Iiyama:K60|Kazuno:HS86,HS56|Nozawa Onsen:HS61|Otari:HS54|Sapporo:HS60|Shiozawa:HS86,HS59|Yonezawa:HS53',
  KAZ: 'Ałmaty:HS66,HS45',
  KOR: 'Pjongczang:HS66',
  NOR: 'Alvdal:K52|Bulken:HS77,HS46|Evje:K45|Gausdal:HS68,HS44|Harstad:K45|Kongsberg:K85,HS45|Lillehammer:K40|Molde:HS100,K53|Mosjøen:K70,K50|Namsos:HS72,K45|Notodden:HS100,K40|Orkdal:HS75,HS50|Oslo:HS78,K54,HS66,HS44|Rena:K60|Skien:HS68,K62,HS42|Skogn:HS67,HS48|Spjelkavik:HS44|Steinkjer:HS50|Stryn:HS100,HS77,K40|Tromsø:HS50|Trondheim:HS68,K40|Trøgstad:K52|Voss:HS118|Hønefoss:K40|Indre Østfold:K40|Leksvik:K40|Oppheim:HS55|Os i Østerdalen:K46|Re:K44|Rissa:K50|Sprova:HS100|Stjørdal:HS90|Stranda:K67,K50|Tolga:HS66,HS44|Trysil:HS75|Våler:HS75|Vikersund:K45|Vinstra:HS80,K45|Bjørkelangen:K50|Hamar:HS78,K40|Holmestrand:HS67,HS44',
  POL: 'Szczyrk:HS44|Wisła:HS44|Zagórz:HS44|Zakopane:HS40',
  RUS: 'Ilinskij:K45|Krasnojarsk:HS44|Leninogorsk:K48|Łyswa:K48|Mieżdurieczensk:HS100,HS67,HS44|Niżny Nowogród:HS67,HS46|Uglegorsk:K40|Jużnosachalińsk:HS79|Berezniki:K64,K40|Czajkowski:HS72,K40|Kazań:K60|Kudymkar:HS50|Magadan:K60|Moskwa:K40|Niżny Tagił:HS66|Perm:K65,HS50|Toksowo:K65,K40|Ufa:HS100,K60,K40',
  SLO: 'Kranj:HS55,HS43|Ljubljana:HS62|Ljubno:HS45|Šentrupert:K45|Velenje:HS45|Zagorje ob Savi:HS55|Žiri:HS65,HS40|Logatec:HS53|Planica:HS61,HS45|Šebenje:HS55|Šmartno:HS45|Sopota:HS40',
  SUI: 'Einsiedeln:HS77,HS50|Gibswil:HS66|Kandersteg:HS74|Marbach:HS52|Wildhaus:HS45',
  SWE: 'Örnsköldsvik:K55|Sollentuna:HS40|Sollefteå:K55',
  UKR: 'Krzemieniec:K40|Werchowyna:K40',
  USA: 'Berlin:HS44|Cloquet:K40|Eau Claire:HS55|Iola:K60,K40|Ishpeming:HS66,K40|Park City:HS68,HS42|Steamboat Springs:HS45|Bloomington:HS78|Coleraine:K70,K40|Fox River Grove:HS77,K40|Lake Placid:HS53|Lebanon:K50|Salisbury:HS70|St. Paul:K46|Westby:K65,K40|Anchorage:HS68,HS42',
};
(function () {
  const slug = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[łŁ]/g, 'l').replace(/ø/g, 'o').replace(/ß/g, 'ss').toLowerCase().replace(/[^a-z0-9]+/g, '_');
  // małe obiekty z listy podstawowej oraz krajowe obiekty spoza głównego kalendarza (od Seefeld w dół listy)
  // utrzymują kluby, gminy i ośrodki – związek płaci tylko za główne areny
  const firstLocal = SJM.HILLS.findIndex((h) => h.id === 'seefeld');
  SJM.HILLS.forEach((h, i) => { if (h.K < 85 || (firstLocal >= 0 && i >= firstLocal)) h.club = true; });
  for (const [nation, raw] of Object.entries(SJM.CLUB_HILLS_RAW)) {
    for (const part of raw.split('|')) {
      const [city, sizes] = part.split(':');
      for (const sz of sizes.split(',')) {
        const v = +sz.replace(/\D/g, ''), isK = sz[0] === 'K';
        const K = isK ? v : Math.round(v * 0.9), HS = isK ? Math.round(v * 1.1) : v;
        let id = `c_${nation.toLowerCase()}_${slug(city)}_${HS}`;
        while (SJM.HILLS.some((h) => h.id === id)) id += "b";
        SJM.HILLS.push({ id, name: `${city} HS${HS}`, city, nation, K, HS, club: true });
      }
    }
  }
})();

// Organizatorzy wielkich imprez (rok zakończenia sezonu). Znani na starcie gry; kolejni wybierani w trakcie gry
// (IO – ogłoszenie po poprzednich igrzyskach, MŚ i MŚ w lotach – decyzja FIS 4 lata przed imprezą).
SJM.BIG_EVENT_HOSTS = {
  WCH: { // Mistrzostwa Świata (lata nieparzyste)
    2027: ['falun_nh', 'falun'], 2029: ['trondheim_nh', 'trondheim'],
  },
  // IO: 2030 Alpy Francuskie, 2034 Salt Lake City (Park City), 2038 Szwajcaria (uprzywilejowany dialog MKOl);
  // 2034 i 2038 ujawniane w grze dopiero po poprzednich igrzyskach, dalsze – losowane z OWG_CANDIDATES
  OWG: { 2030: { nat: 'FRA', hills: ['courchevel_nh', 'courchevel'] }, 2034: { nat: 'USA', hills: ['park_city_nh', 'park_city'] }, 2038: { nat: 'SUI', hills: ['kandersteg', 'engelberg'] } },
  SFWC: { 2028: 'vikersund' },
  WJC: ['lake_placid_nh', 'planica_nh', 'zakopane_nh', 'lahti_nh', 'otepaa', 'kandersteg', 'liberec_nh', 'rasnov', 'villach', 'predazzo_nh'],
};
// miejscowość olimpijskich skoczni dla krajów bez obiektów FIS
// lokalizacje nowych skoczni: najpierw miejsca, gdzie historycznie były skocznie (dziś nieczynne lub nieujęte w grze),
// potem większe miasta kraju
SJM.HILL_SITES = {
  POL: { hist: ['Karpacz', 'Szklarska Poręba', 'Krynica-Zdrój', 'Rabka-Zdrój', 'Goleszów', 'Duszniki-Zdrój', 'Wisła-Łabajów', 'Bystra'], cities: ['Bielsko-Biała', 'Kraków', 'Nowy Sącz', 'Jelenia Góra', 'Katowice', 'Warszawa', 'Wrocław'] },
  AUT: { hist: ['Saalfelden', 'Murau', 'Mürzzuschlag', 'Kitzbühel', 'Achenkirch', 'Bad Goisern', 'Lienz'], cities: ['Salzburg', 'Graz', 'Wiedeń', 'Linz', 'Klagenfurt'] },
  SLO: { hist: ['Žiri', 'Logatec', 'Bohinj', 'Tržič', 'Zagorje ob Savi', 'Ravne na Koroškem', 'Mozirje'], cities: ['Maribor', 'Celje', 'Novo Mesto'] },
  GER: { hist: ['Oberwiesenthal', 'Berchtesgaden', 'Ruhpolding', 'Lauscha', 'Baiersbronn', 'Schonach', 'Rastbüchl', 'Bischofsgrün', 'Braunlage'], cities: ['Monachium', 'Drezno', 'Freiburg', 'Erfurt', 'Stuttgart', 'Berlin'] },
  NOR: { hist: ['Kongsberg', 'Gjøvik', 'Steinkjer', 'Meråker', 'Narvik', 'Oppdal', 'Trysil', 'Notodden'], cities: ['Bergen', 'Stavanger', 'Bodø', 'Ålesund', 'Kristiansand'] },
  JPN: { hist: ['Shimokawa', 'Otaru', 'Asahikawa', 'Nozawa Onsen', 'Kazuno', 'Obihiro', 'Yoichi', 'Ōwani'], cities: ['Nagano', 'Aomori', 'Morioka', 'Tokio', 'Niigata'] },
  SUI: { hist: ['St. Moritz', 'Le Brassus', 'Gstaad', 'Unterwasser', 'Davos', 'Wildhaus'], cities: ['Zurych', 'Berno', 'Lucerna', 'Chur', 'Genewa'] },
  RUS: { hist: ['Toksowo', 'Krasnojarsk', 'Perm', 'Kirowsk', 'Archangielsk'], cities: ['Jekaterynburg', 'Sankt Petersburg', 'Nowosybirsk', 'Kazań', 'Ufa'] },
  FIN: { hist: ['Vuokatti', 'Tampere', 'Lieksa', 'Kouvola', 'Lapua', 'Kemijärvi'], cities: ['Helsinki', 'Oulu', 'Turku', 'Joensuu'] },
  CZE: { hist: ['Špindlerův Mlýn', 'Jablonec nad Nisou', 'Vrchlabí', 'Lomnice nad Popelkou', 'Jilemnice'], cities: ['Praga', 'Ostrawa', 'Brno', 'Hradec Králové'] },
  ITA: { hist: ['Cortina d’Ampezzo', 'Pragelato', 'Bardonecchia', 'Gallio', 'Ponte di Legno', 'Tarvisio', 'Pellizzano'], cities: ['Bolzano', 'Trento', 'Turyn', 'Mediolan', 'Belluno'] },
  USA: { hist: ['Leavenworth', 'Salisbury', 'Eau Claire', 'Fox River Grove', 'Coleraine', 'Red Wing', 'Lebanon'], cities: ['Denver', 'Minneapolis', 'Salt Lake City', 'Anchorage', 'Duluth'] },
  FRA: { hist: ['Saint-Nizier-du-Moucherotte', 'Autrans', 'Villard-de-Lans', 'Megève', 'Les Rousses'], cities: ['Grenoble', 'Annecy', 'Besançon', 'Lyon'] },
  KAZ: { hist: ['Ridder', 'Ust-Kamienogorsk'], cities: ['Astana', 'Karaganda', 'Szymkent'] },
  CHN: { hist: ['Tonghua', 'Changchun'], cities: ['Harbin', 'Shenyang', 'Pekin', 'Urumczi'] },
  BUL: { hist: ['Bansko', 'Czepełare', 'Samokow', 'Wełingrad'], cities: ['Sofia', 'Płowdiw'] },
  UKR: { hist: ['Tysowiec', 'Sławśko', 'Jaremcze'], cities: ['Lwów', 'Iwano-Frankiwsk', 'Kijów', 'Charków'] },
  CAN: { hist: ['Calgary', 'Thunder Bay', 'Revelstoke', 'Chelsea', 'Camrose'], cities: ['Vancouver', 'Montreal', 'Ottawa', 'Toronto'] },
  EST: { hist: ['Tallinn-Nõmme', 'Võru'], cities: ['Tartu', 'Tallinn', 'Pärnu'] },
  ROU: { hist: ['Poiana Brașov', 'Predeal', 'Sinaia', 'Vatra Dornei', 'Borșa'], cities: ['Braszów', 'Bukareszt', 'Kluż-Napoka'] },
  TUR: { hist: ['Sarıkamış', 'Uludağ'], cities: ['Kars', 'Ankara', 'Bursa', 'Stambuł'] },
  SWE: { hist: ['Östersund', 'Sundsvall', 'Gällivare', 'Härnösand'], cities: ['Sztokholm', 'Umeå', 'Göteborg', 'Luleå'] },
  KOR: { hist: ['Muju'], cities: ['Gangneung', 'Seul', 'Chuncheon'] },
  SVK: { hist: ['Szczyrbskie Jezioro', 'Kremnica', 'Ružomberok'], cities: ['Żylina', 'Koszyce', 'Poprad', 'Bratysława'] },
  GEO: { hist: [], cities: ['Gudauri', 'Tbilisi', 'Kutaisi', 'Batumi'] },
  LAT: { hist: ['Sigulda'], cities: ['Ryga', 'Cēsis', 'Valmiera'] },
  THA: { hist: [], cities: ['Chiang Mai', 'Bangkok', 'Chiang Rai'] },
  AZE: { hist: [], cities: ['Szahdag', 'Baku', 'Gabala'] },
  // uśpione nacje
  BLR: { hist: ['Raubiczy'], cities: ['Mińsk', 'Grodno', 'Witebsk', 'Mohylew'] },
  HUN: { hist: ['Mátraháza', 'Budapeszt-Svábhegy'], cities: ['Miszkolc', 'Eger', 'Pecz'] },
  GBR: { hist: [], cities: ['Aviemore', 'Glenshee', 'Inverness', 'Edynburg'] },
  BIH: { hist: ['Sarajewo', 'Igman'], cities: ['Banja Luka', 'Tuzla', 'Mostar'] },
  SRB: { hist: [], cities: ['Kopaonik', 'Zlatibor', 'Belgrad', 'Nisz'] },
  CRO: { hist: ['Delnice', 'Mrkopalj'], cities: ['Fužine', 'Zagrzeb', 'Rijeka'] },
  ESP: { hist: ['La Molina'], cities: ['Jaca', 'Baqueira', 'Sierra Nevada', 'Madryt'] },
  ISL: { hist: ['Akureyri', 'Ísafjörður', 'Siglufjörður'], cities: ['Reykjavík', 'Dalvík'] },
  KGZ: { hist: [], cities: ['Karakoł', 'Biszkek', 'Osz'] },
  PRK: { hist: [], cities: ['Masikryong', 'Pjongjang', 'Samdżijon'] },
  ARG: { hist: ['Bariloche'], cities: ['Ushuaia', 'Esquel', 'Mendoza'] },
  DEN: { hist: [], cities: ['Kopenhaga', 'Silkeborg', 'Aarhus', 'Aalborg'] },
  GRE: { hist: [], cities: ['Seli', 'Kalawryta', 'Saloniki', 'Ateny'] },
  NED: { hist: [], cities: ['Landgraaf', 'Kerkrade', 'Arnhem', 'Nijmegen', 'Amsterdam'] },
  LTU: { hist: [], cities: ['Anykščiai', 'Ignalina', 'Wilno', 'Kowno'] },
};

SJM.OLYMPIC_CITIES = { GEO: 'Bakuriani', THA: 'Chiang Mai', AZE: 'Szahdag', SVK: 'Szczyrbskie Jezioro', KOR: 'Pjongczang', SWE: 'Falun', ROU: 'Râșnov', BUL: 'Bansko', CAN: 'Whistler' };
// kandydaci do IO po 2038 (waga ~ szansa); obok potęg zimowych także kraje słabo związane ze skokami
// „Uśpione nacje”: kraje bez kadry skoczków, które mogą dołączyć w trakcie gry – rzadko, na skutek wydarzenia
// (join – szansa na sezon) albo po wyborze na gospodarza IO (owg – waga w losowaniu MKOl).
// city – ośrodek startowy (mała skocznia), story – nawiązanie do historii dyscypliny w kraju.
SJM.DORMANT_NATIONS = [
  { code: 'BLR', name: 'Białoruś',     flag: '', strength: 12, depth: 5, budget: 0.6, pop: 12, names: 'by', join: 0.015, owg: 0.05, city: 'Raubiczy',   story: 'nawiązuje do radzieckich tradycji ośrodka w Raubiczach pod Mińskiem' },
  { code: 'HUN', name: 'Węgry',        flag: '', strength: 10, depth: 4, budget: 0.5, pop: 8,  names: 'hu', join: 0.012,  owg: 0.15, city: 'Mátraháza',  story: 'wraca do tradycji z lat 30.–60., gdy węgierscy skoczkowie startowali na igrzyskach' },
  { code: 'GBR', name: 'Wielka Brytania', flag: '', strength: 8, depth: 4, budget: 0.9, pop: 10, names: 'gb', join: 0.01, owg: 0.25, city: 'Aviemore',   story: 'korzysta z popularności „efektu Eddiego Orła”' },
  { code: 'BIH', name: 'Bośnia i Hercegowina', flag: '', strength: 8, depth: 3, budget: 0.3, pop: 10, names: 'ba', join: 0.01, owg: 0.15, city: 'Sarajewo', story: 'odbudowuje skocznie na Igmanie, gdzie skakano podczas IO Sarajewo 1984' },
  { code: 'SRB', name: 'Serbia',       flag: '', strength: 8, depth: 3, budget: 0.3, pop: 7,  names: 'rs', join: 0.008, owg: 0,    city: 'Kopaonik',   story: 'buduje dyscyplinę od zera w ośrodku na Kopaoniku' },
  { code: 'CRO', name: 'Chorwacja',    flag: '', strength: 8, depth: 3, budget: 0.4, pop: 8,  names: 'hr', join: 0.008, owg: 0,    city: 'Delnice',    story: 'reaktywuje skocznie w Gorskim Kotarze (Delnice)' },
  { code: 'ESP', name: 'Hiszpania',    flag: '', strength: 7, depth: 3, budget: 0.7, pop: 6,  names: 'es', join: 0.008, owg: 0.35, city: 'La Molina',  story: 'wraca do skoków w Pirenejach (La Molina), gdzie dawniej działała skocznia' },
  { code: 'ISL', name: 'Islandia',     flag: '', strength: 7, depth: 3, budget: 0.3, pop: 9,  names: 'is', join: 0.006,  owg: 0,    city: 'Akureyri',   story: 'nawiązuje do dawnych skoków w Akureyri i Ísafjörður' },
  { code: 'KGZ', name: 'Kirgistan',    flag: '', strength: 7, depth: 3, budget: 0.2, pop: 6,  names: 'kg', join: 0.006,  owg: 0,    city: 'Karakoł',    story: 'tworzy szkółkę w górskim Karakole' },
  { code: 'PRK', name: 'Korea Płn.',   flag: '', strength: 9, depth: 4, budget: 0.3, pop: 6,  names: 'kp', join: 0.005, owg: 0.05, city: 'Masikryong', story: 'rozwija skoki w ośrodku narciarskim Masikryong' },
  { code: 'ARG', name: 'Argentyna',    flag: '', strength: 6, depth: 3, budget: 0.4, pop: 5,  names: 'ar', join: 0.005, owg: 0.1,  city: 'Bariloche',  story: 'reaktywuje skocznię na Cerro Otto w Bariloche' },
  { code: 'DEN', name: 'Dania',        flag: '', strength: 6, depth: 3, budget: 0.5, pop: 5,  names: 'dk', join: 0.004, owg: 0,    city: 'Kopenhaga',  story: 'zaczyna od zawodników trenujących w Norwegii' },
  { code: 'GRE', name: 'Grecja',       flag: '', strength: 5, depth: 3, budget: 0.3, pop: 4,  names: 'gr', join: 0.004, owg: 0,    city: 'Seli',       story: 'tworzy pierwszą szkółkę w górskim ośrodku Seli' },
  { code: 'NED', name: 'Holandia',     flag: '', strength: 6, depth: 3, budget: 0.8, pop: 6,  names: 'nl', join: 0.006, owg: 0,    city: 'Landgraaf',  story: 'zaczyna od treningów w hali SnowWorld w Landgraaf i obozów w Alpach' },
  { code: 'LTU', name: 'Litwa',        flag: '', strength: 5, depth: 3, budget: 0.4, pop: 4,  names: 'lt', join: 0.004, owg: 0,    city: 'Anykščiai',  story: 'buduje pierwszą małą skocznię w ośrodku Kalita w Anykščiai' },
];
// powody przebudzenia (wydarzenie losowe)
SJM.DORMANT_REASONS = [
  'Rząd ogłosił krajowy program odbudowy skoków narciarskich',
  'Lokalna inicjatywa: entuzjaści z klubu narciarskiego zbudowali skocznię i zebrali grupę dzieci',
  'FIS objęła kraj programem rozwoju dyscypliny (sprzęt, trenerzy, obozy)',
  'Bogaty mecenas sfinansował akademię skoków i zagranicznego trenera',
  'Były skoczek wrócił z emigracji i założył klub',
  'Narciarze klasyczni i kombinatorzy założyli sekcję skoków',
];
for (const d of SJM.DORMANT_NATIONS) SJM.OLYMPIC_CITIES[d.code] = SJM.OLYMPIC_CITIES[d.code] || d.city;

SJM.OWG_CANDIDATES = { NOR: 2, SWE: 2, CAN: 2, AUT: 1.5, JPN: 1.5, GER: 1.2, SUI: 1, ITA: 1, FRA: 1, USA: 1, FIN: 1, KOR: 1, CHN: 1, KAZ: 1, TUR: 0.8, POL: 0.8, CZE: 0.7, SLO: 0.6, GEO: 0.5, BUL: 0.5, ROU: 0.4 };

SJM.FIRST = {
  de: ['Lukas','Jonas','Felix','Maximilian','Elias','Paul','Leon','Tobias','Florian','Simon','Fabian','Johannes','Markus','Raphael','Daniel','David','Moritz','Julian','Niklas','Clemens','Valentin','Matthias','Andreas','Sebastian','Constantin','Philipp','Benedikt','Lorenz','Gregor','Kilian'],
  sl: ['Jaka','Žiga','Luka','Anže','Tilen','Rok','Matic','Timi','Nejc','Jernej','Bor','Aljaž','Gašper','Urban','Lovro','Mark','Tine','Jan','Miha','Domen','Vid','Klemen','Žan','Blaž'],
  no: ['Sander','Henrik','Kristoffer','Magnus','Sindre','Eirik','Fredrik','Mats','Ola','Håkon','Jørgen','Kasper','Tord','Vegard','Andreas','Even','Sivert','Torjus','Iver','Aksel','Joakim','Martin'],
  se: ['Erik','Oscar','Linus','Viktor','Gustav','Albin','Elias','Hugo','Anton','Isak','Filip','Ludvig','Lucas','Liam','William','Noah','Adam','Axel','Theo','Leo','Alexander','Emil','Olle','Jonathan','Melvin','Simon'],
  fi: ['Eetu','Niko','Antti','Kalle','Juho','Valtteri','Arttu','Jarkko','Lauri','Mikko','Otto','Aleksi','Joonas','Eero','Ville','Sami','Tuomas','Roope','Matti','Jussi','Heikki','Petteri','Veeti','Onni','Elias','Leo','Akseli'],
  pl: ['Jakub','Kacper','Mateusz','Paweł','Szymon','Tomasz','Wojciech','Bartosz','Michał','Krzysztof','Adrian','Damian','Dawid','Filip','Hubert','Igor','Jan','Kamil','Łukasz','Marcin','Mikołaj','Oskar','Patryk','Piotr','Przemysław','Sebastian','Stanisław','Tymoteusz','Wiktor','Zbigniew','Antoni','Franciszek'],
  cz: ['Jakub','Tomáš','Ondřej','Vojtěch','Filip','Lukáš','Martin','Petr','David','Adam','Matěj','Štěpán','Radek','Jiří','Václav','Daniel','Jan','Josef','Karel','Michal','Roman','Viktor','Šimon','Antonín','Marek'],
  it: ['Alessandro','Giovanni','Francesco','Lorenzo','Matteo','Andrea','Federico','Davide','Riccardo','Stefano','Marco','Luca','Daniele','Simone','Tommaso','Elia','Gabriele','Leonardo','Pietro','Nicola','Michele','Emanuele','Alberto'],
  en: ['Tyler','Ryan','Jason','Kevin','Andrew','Michael','Cole','Logan','Hunter','Jake','Evan','Mason','Connor','Dylan','Nathan','Owen','Brandon','Caleb','Ethan','Liam','Noah','Benjamin','Samuel'],
  fr: ['Hugo','Mathis','Louis','Valentin','Clément','Lucas','Théo','Enzo','Antoine','Nathan','Maxime','Baptiste','Romain','Julien','Alexis','Paul','Arthur','Jules','Léo','Raphaël','Tom','Adrien','Quentin'],
  kz: ['Danil','Sergey','Nikita','Ilya','Dmitriy','Alikhan','Arman','Ruslan','Timur','Nurlan','Yerlan','Maksim','Kirill','Artyom','Askar','Daniyar','Yerzhan','Bauyrzhan','Aidos','Sabirzhan','Nurzhan','Yevgeniy','Vladislav','Konstantin'],
  cn: ['Wei','Hao','Jun','Lei','Peng','Yang','Bo','Chen','Rui','Tao','Ming','Long','Xiang','Kai','Hui','Qiang','Yu','Jie','Zhen','Feng','Ning','Yi','Hong','Xin','Bin'],
  bg: ['Vladimir','Georgi','Ivan','Nikolay','Dimitar','Martin','Kaloyan','Stefan','Petar','Aleksandar','Hristo','Todor','Yordan','Krasimir','Boris','Kiril','Plamen','Svetoslav','Viktor','Radoslav','Lyubomir','Emil','Asen'],
  ua: ['Andriy','Vitaliy','Oleksandr','Yevhen','Bohdan','Taras','Mykola','Danylo','Maksym','Roman','Yurii','Ivan','Serhiy','Dmytro','Volodymyr','Artem','Vladyslav','Nazar','Oleh','Ihor','Kyrylo','Anton'],
  ee: ['Kaarel','Martti','Siim','Rasmus','Karl','Markus','Kristjan','Artti','Henri','Robin','Kristo','Mattias','Oliver','Sander','Hugo','Martin','Andreas','Kevin','Joosep','Mihkel','Taavi','Rauno','Ott'],
  ro: ['Andrei','Mihai','Ionuț','Alexandru','Cristian','Daniel','Florin','Răzvan','Sorin','Vlad','Radu','Gabriel','Ștefan','George','Marian','Bogdan','Adrian','Ciprian','Cosmin','Liviu','Eduard','Robert','Sergiu'],
  tr: ['Mehmet','Emre','Fatih','Muhammed','Yusuf','Burak','Ahmet','Ömer','Kerem','Furkan','Can','Ali','Hasan','Hüseyin','Mustafa','İbrahim','Murat','Serkan','Tolga','Oğuz','Berkay','Eren','Arda','Batuhan'],
  kr: ['Min-jun','Seo-jun','Ji-ho','Hyun-woo','Jun-seo','Dong-hyun','Sung-min','Jae-won','Tae-yang','Woo-jin','Ye-jun','Do-yun','Si-woo','Joo-won','Ha-jun','Eun-woo','Min-seok','Sang-hoon','Jae-hyun','Kyung-soo','Seung-woo','Hyun-jun','Young-min'],
  sk: ['Hektor','Martin','Tomáš','Jakub','Matej','Peter','Lukáš','Samuel','Adam','Michal','Dávid','Filip','Andrej','Juraj','Marek','Patrik','Richard','Roman','Šimon','Oliver','Tobias','Matúš','Erik','Viktor'],
  ru: ['Aleksandr','Dmitriy','Maksim','Ivan','Nikita','Artem','Kirill','Mikhail','Danil','Ilya','Roman','Egor','Sergey','Andrey','Vladislav','Konstantin','Semen','Denis','Evgeniy','Timofey','Aleksey','Pavel'],
  lv: ['Kārlis','Jānis','Roberts','Markuss','Mārtiņš','Edgars','Artūrs','Kristaps','Reinis','Ralfs','Toms','Rihards','Jēkabs','Dāvis','Andris','Artis','Gints','Ivars','Valters','Emīls','Daniels','Niks','Kristers','Oskars'],
  ge: ['Giorgi','Levan','Luka','Nika','Davit','Irakli','Saba','Lasha','Tornike','Aleksandre','Zurab','Giga','Beka','Tamaz','Vakhtang','Shota','Nodar','Tengiz','Gela','Mikheil','Revaz','Zviad','Dato'],
  th: ['Somchai','Anan','Kittisak','Narong','Prasert','Thanawat','Chaiyaphon','Somsak','Surasak','Wichai','Pongsak','Nattapong','Apichart','Sakda','Thanakorn','Kritsada','Phuwadon','Chatchai','Weerapong','Tanapat','Panupong','Sittichai','Jirayu','Pakorn'],
  az: ['Murad','Elvin','Ramin','Kamran','Farid','Rashad','Tural','Rustam','Orkhan','Anar','Nijat','Vugar','Samir','Javid','Emin','Ilkin','Tofig','Rauf','Ali','Huseyn','Kenan','Togrul','Ayhan','Shahin'],
  es: ['Pablo','Javier','Álvaro','Sergio','Adrián','Diego','Iker','Marc','Unai','Jordi','Hugo','Mario','Daniel','David','Carlos','Alejandro','Manuel','Raúl','Rubén','Íñigo','Aitor','Oriol','Pol','Martín'],
  is: ['Jón','Sigurður','Guðmundur','Gunnar','Ólafur','Einar','Kristján','Magnús','Stefán','Arnar','Birkir','Aron','Bjarki','Davíð','Elvar','Hilmar','Ingi','Kári','Óskar','Pétur','Róbert','Snorri','Viktor','Þór','Hákon'],
  gb: ['Oliver','Harry','Jack','Charlie','Thomas','George','James','William','Callum','Alfie','Rhys','Euan','Jacob','Joshua','Daniel','Samuel','Benjamin','Lewis','Kieran','Finlay','Owen','Ewan','Ethan','Max'],
  by: ['Ivan','Dzmitry','Aliaksandr','Maksim','Uladzislau','Artsiom','Yauhen','Mikita','Pavel','Kiryl','Andrei','Ilya','Siarhei','Raman','Vadzim','Dzianis','Ales','Mikhail','Viktar','Anton','Yahor','Uladzimir','Kanstantsin','Hleb'],
  hu: ['Bence','Máté','Levente','Dávid','Balázs','Ádám','Gergő','Péter','Zoltán','Márk','Dániel','Tamás','Gábor','László','István','Attila','Krisztián','Bálint','Norbert','Richárd','Botond','Zsolt','Milán','Kristóf'],
  rs: ['Nikola','Luka','Stefan','Marko','Lazar','Nemanja','Miloš','Filip','Đorđe','Vuk','Uroš','Strahinja','Aleksandar','Dušan','Petar','Jovan','Milan','Vladimir','Ivan','Bogdan','Mihajlo','Andrija','Ognjen','Vukašin'],
  hr: ['Luka','Ivan','Josip','Marko','Matej','Filip','Ante','Karlo','Domagoj','Dino','Fran','Tin','Petar','Mateo','Leon','Roko','Jakov','Lovro','Nikola','Marin','Tomislav','Krešimir','Bruno','Gabriel'],
  gr: ['Georgios','Dimitrios','Konstantinos','Nikolaos','Ioannis','Christos','Panagiotis','Vasileios','Athanasios','Stefanos','Alexandros','Michail','Evangelos','Spyridon','Emmanouil','Thomas','Theodoros','Charalampos','Ilias','Petros','Antonios','Stavros','Angelos','Sotirios'],
  dk: ['William','Noah','Oscar','Lucas','Magnus','Frederik','Emil','Mads','Rasmus','Kasper','Mikkel','Jonas','Alexander','Victor','Carl','Malthe','Elias','Aksel','Christian','Mathias','Anders','Søren','Niklas','Tobias'],
  nl: ['Daan','Sem','Lucas','Milan','Levi','Luuk','Thijs','Jesse','Bram','Ruben','Sven','Tim','Finn','Noah','Thomas','Stijn','Lars','Max','Jasper','Niels','Koen','Joris','Wouter','Pieter','Bas'],
  lt: ['Lukas','Matas','Jonas','Dominykas','Nojus','Kajus','Domantas','Mantas','Tomas','Paulius','Rokas','Justas','Gabrielius','Benas','Jokūbas','Ignas','Martynas','Augustas','Karolis','Dovydas','Ernestas','Arnas','Vytautas','Žygimantas'],
nl: ['Daan','Sem','Lucas','Milan','Levi','Luuk','Thijs','Jesse','Bram','Ruben','Sven','Tim'],
  kp: ['Chol-min','Myong-guk','Song-jin','Il-nam','Hyok','Kwang-jin','Jin-hyok','Chol-ung','Song-il','Il-bong','Kwang-hyok','Jong-su','Chol-jin','Song-chol','Myong-il','Kum-chol','Hyon-u','Ju-song','Yong-nam','Un-chol','Il-guk','Chung-il','Song-hyok'],
  kg: ['Aibek','Bakyt','Nursultan','Erlan','Daniyar','Azamat','Ruslan','Timur','Emil','Bekzat','Aidar','Kanat','Adilet','Almaz','Nurlan','Chyngyz','Talant','Ulan','Ernis','Islam','Kubanych','Marat','Mirlan','Samat','Tilek','Zhyrgal'],
  ba: ['Amar','Haris','Adnan','Emir','Kenan','Tarik','Nedim','Mirza','Ivan','Luka','Dino','Edin','Armin','Damir','Faruk','Harun','Kerim','Benjamin','Eldin','Elvir','Mustafa','Vedad','Nermin','Davor','Marko','Igor'],
  ar: ['Santiago','Mateo','Tomás','Nicolás','Joaquín','Facundo','Agustín','Lautaro','Franco','Ignacio','Matías','Bruno','Thiago','Benjamín','Valentín','Lucas','Gonzalo','Emiliano','Julián','Leandro','Pablo','Federico','Martín','Diego'],
  jp: ['Ren','Haruto','Sota','Yuto','Kaito','Riku','Daiki','Kenta','Shota','Naoki','Takumi','Ryota','Yuma','Kosei','Hiroto','Taiga','Sho','Masaki','Kazuya','Tomoya','Yuki','Ryo','Kazuki','Shun','Hayato'],
};

SJM.LAST = {
  de: ['Huber','Gruber','Wagner','Bauer','Leitner','Moser','Hofer','Steiner','Mayr','Egger','Brunner','Pichler','Fischer','Weber','Schuster','Lindner','Haas','Wimmer','Ortner','Aigner','Rieder','Neumann','Schmid','Zangerl','Strobl','Kofler','Hartl','Lechner','Wallner','Brandner','Kronthaler','Seidl','Frühwirt','Holzer','Feichtner','Gasser','Rainer','Stadler','Hofmann','Koch','Richter','Wolf','Schröder','Schwarz','Zimmermann','Braun','Krüger','Hartmann','Lange','Walter','Lehner','Berger','Winkler'],
  sl: ['Novak','Horvat','Kranjc','Zupan','Potočnik','Mlakar','Vidmar','Kovačič','Golob','Turk','Kos','Bizjak','Hribar','Kavčič','Rozman','Žagar','Petek','Jereb','Kolenc','Štern','Jelen','Pintar','Rupnik','Bergant','Krajnc','Zajc','Kralj','Pirc','Vovk','Kolar','Hočevar','Košir','Koren','Zupančič','Mlinar','Kokalj','Sever','Lešnik','Kuhar','Bevc','Erjavec','Primožič','Debeljak','Kovač','Gregorič','Oblak','Pavlič','Bajc','Lah','Čuk','Logar','Kern','Ambrožič','Uršič','Dolenc','Ferjan'],
  no: ['Hansen','Johansen','Olsen','Larsen','Andersen','Pedersen','Nilsen','Kristiansen','Jensen','Berg','Haugen','Hagen','Bakken','Solberg','Moen','Strand','Lund','Dahl','Eide','Myhre','Rønning','Aasen','Bjørnstad','Tveit','Sæther','Lie','Halvorsen','Eriksen','Iversen','Johnsen','Karlsen','Kristensen','Nygård','Fossum','Aas','Lunde','Brekke','Sandvik','Fjeld','Aune','Hovland','Vik','Ruud','Hauge','Midtbø','Bjerke','Hovde','Nordby','Engen','Lien','Rustad','Sørlie','Knutsen','Skjelbred','Nesheim','Grimstad'],
  se: ['Johansson','Karlsson','Lindqvist','Nyström','Bergström','Holm','Ek','Sjöberg','Lundin','Engström','Ström','Axelsson','Andersson','Nilsson','Eriksson','Larsson','Olsson','Persson','Svensson','Gustafsson','Pettersson','Jonsson','Jansson','Hansson','Bengtsson','Jönsson','Lindberg','Lindström','Jakobsson','Magnusson','Olofsson','Lindgren','Berg','Fredriksson','Henriksson','Isaksson','Sandberg','Forsberg','Sjögren','Wallin','Danielsson','Lund','Åberg','Hedlund','Holmberg','Nyberg','Söderberg','Mattsson','Nordin','Björk','Lundgren','Hedström','Ahlberg','Nordström'],
  fi: ['Virtanen','Korhonen','Mäkinen','Nieminen','Heikkinen','Laine','Koskinen','Järvinen','Lehtonen','Salminen','Hämäläinen','Kinnunen','Tuominen','Rantanen','Saarinen','Peltonen','Kallio','Hyvönen','Mäkelä','Hakala','Leinonen','Ahonen','Hautamäki','Nykänen','Kytösaho','Kiuru','Aalto','Karjalainen','Lehtinen','Jokinen','Turunen','Savolainen','Laitinen','Hiltunen','Miettinen','Pitkänen','Seppälä','Kärkkäinen','Rautio','Tervo','Kauppinen','Huttunen','Kettunen','Väisänen','Toivonen','Ojala','Manninen','Heinonen','Lappalainen','Vainio'],
  pl: ['Nowak','Wiśniewski','Wójcik','Kowalczyk','Kamiński','Lewandowski','Zieliński','Szymański','Woźniak','Dąbrowski','Kozłowski','Jankowski','Mazur','Kwiatkowski','Krawczyk','Piotrowski','Grabowski','Pawłowski','Michalski','Król','Wieczorek','Jabłoński','Majewski','Olszewski','Stępień','Malinowski','Górecki','Sikora','Bielecki','Gąsienica','Bachleda','Chowaniec','Krzeptowski','Hajduk','Gruszka','Pitoń','Łukaszczyk','Stopka','Kubiak','Gawlas','Nowakowski','Adamczyk','Dudek','Zając','Wróbel','Zawadzki','Sadowski','Bąk','Chmielewski','Włodarczyk','Borkowski','Czarnecki','Sawicki','Sokołowski','Urbański','Kubacki','Murańka'],
  cz: ['Novák','Svoboda','Dvořák','Černý','Procházka','Kučera','Veselý','Horák','Němec','Pokorný','Marek','Pospíšil','Hájek','Král','Jelínek','Růžička','Beneš','Fiala','Novotný','Krejčí','Sedláček','Doležal','Zeman','Kolář','Navrátil','Čermák','Vaněk','Urban','Blažek','Kříž','Kovář','Bartoš','Vlček','Polák','Musil','Šimek','Konečný','Malý','Holub','Štěpánek','Kadlec','Staněk','Dostál','Matějka','Hruška','Janda','Koubek','Říha','Vávra','Holý','Šťastný'],
  it: ['Rossi','Russo','Ferrari','Bianchi','Romano','Colombo','Ricci','Marino','Greco','Bruno','Gallo','Conti','De Luca','Costa','Fontana','Moretti','Dellasega','Pinter','Demetz','Mahlknecht','Senoner','Runggaldier','Esposito','Mancini','Lombardi','Barbieri','Rinaldi','Caruso','Ferrara','Galli','Martini','Leone','Longo','Gentile','Martinelli','Vitale','Serra','Coppola','De Santis','Marchetti','Parisi','Villa','Cattaneo','Ferri','Fabbri','Bassi','Insam','Bresadola','Morassi','Kostner','Pertile','Moroder'],
  en: ['Johnson','Williams','Brown','Miller','Davis','Anderson','Thompson','White','Harris','Martin','Clark','Lewis','Walker','Hall','Young','King','Wright','Scott','Baker','Carter','Mitchell','Campbell','Jones','Wilson','Moore','Taylor','Jackson','Thomas','Robinson','Green','Adams','Nelson','Hill','Roberts','Phillips','Evans','Turner','Parker','Collins','Edwards','Stewart','Morris','Murphy','Cook','Rogers','Bennett','Reed','Allen','Sanders','Price','Bryant','Hayes','Foster','Ward','Brooks'],
  fr: ['Martin','Bernard','Durand','Lefebvre','Moreau','Girard','Bonnet','Mercier','Fournier','Morel','Blanc','Guerin','Chevalier','Roux','Faure','Perrin','Dubois','Thomas','Robert','Richard','Petit','Simon','Laurent','Michel','David','Bertrand','Vincent','Lambert','Rousseau','Fontaine','Muller','Henry','Gauthier','Masson','Marchand','Duval','Denis','Dumont','Colin','Brun','Roussel','Picard','Lemoine','Gaillard','Barbier','Arnaud','Clément','Leroy','Roche','Boyer','Mathieu','Rey'],
  kz: ['Tkachenko','Sokolov','Nurgaliyev','Abenov','Kozlov','Zhaksybekov','Volkov','Mukhametov','Ivanov','Kaliyev','Seitkali','Petrov','Akhmetov','Orlov','Sadykov','Bekov','Omarov','Zhakupov','Suleimenov','Baimukhamedov','Ermekov','Iskakov','Kenzhebekov','Mukanov','Nurlanov','Orazbayev','Rakhimov','Sarsenbayev','Temirkhanov','Utepov','Yesenov','Zhumabayev','Kuznetsov','Popov','Novikov','Morozov','Lebedev','Fedorov','Pavlov','Belov','Grigoryev','Romanov','Kim','Tsoy','Pak','Shevchenko','Gusev','Korolev','Nikitin','Muminov','Kairatov','Dzhumabekov'],
  cn: ['Wang','Li','Zhang','Liu','Chen','Yang','Zhao','Huang','Zhou','Wu','Xu','Sun','Ma','Zhu','Hu','Guo','Gao','Lin','He','Luo','Zheng','Liang','Xie','Song','Tang','Han','Feng','Deng','Cao','Peng','Zeng','Xiao','Tian','Dong','Pan','Yuan','Cai','Jiang','Yu','Du','Ye','Cheng','Wei','Su','Lü','Ding','Ren','Shen','Yao','Lu','Jin','Fan','Fu','Bai'],
  bg: ['Ivanov','Georgiev','Dimitrov','Petrov','Nikolov','Todorov','Stoyanov','Kolev','Angelov','Marinov','Popov','Hristov','Iliev','Atanasov','Petkov','Mihaylov','Yordanov','Kostov','Vasilev','Pavlov','Simeonov','Tsvetkov','Ganchev','Zhivkov','Yankov','Kirov','Stefanov','Lazarov','Bozhinov','Krastev','Rusev','Mladenov','Tonev','Dimov','Hadzhiev','Nedelchev','Slavov','Doychev','Kostadinov','Zahariev','Penchev','Valchev','Gospodinov','Spasov','Radev','Peev','Zlatev','Bonev','Velikov','Zografski','Sakaliev'],
  ua: ['Shevchenko','Kovalenko','Bondarenko','Tkachuk','Kravchenko','Melnyk','Boyko','Moroz','Lysenko','Rudenko','Savchenko','Kovalchuk','Polishchuk','Marchenko','Pavlenko','Oliynyk','Kravets','Ponomarenko','Klymenko','Tkachenko','Levchenko','Shevchuk','Romanyuk','Kushnir','Hrytsenko','Karpenko','Zinchenko','Vasylenko','Petrenko','Ivanenko','Yaremchuk','Pasichnyk','Kalinichenko','Didyk','Hnatyuk','Melnychuk','Kozak','Mazur','Andrusiak','Fedoriv','Kalynyuk','Hladun','Danyliuk','Bilyk','Stepaniuk','Pryimak','Savchuk','Vovk','Lytvyn','Yakymchuk'],
  ee: ['Tamm','Saar','Sepp','Mägi','Kask','Kukk','Rebane','Ilves','Pärn','Koppel','Lepik','Kuusk','Mets','Raudsepp','Kõiv','Lill','Teder','Kuusik','Karu','Vaher','Põder','Oja','Laur','Kallas','Aavik','Luik','Toom','Kivi','Lepp','Jõgi','Kaasik','Peterson','Kruus','Saks','Rand','Kangur','Uibo','Paju','Org','Sild','Hein','Nurk','Roos','Unt','Pihlak','Käärik','Vares','Õunapuu','Liiv','Mölder','Nõmm','Laas','Aun','Raud'],
  ro: ['Popescu','Ionescu','Popa','Stan','Dumitru','Stoica','Gheorghe','Matei','Ciobanu','Munteanu','Rusu','Nistor','Constantin','Marin','Tudor','Dinu','Lazăr','Dobre','Barbu','Florea','Ilie','Ene','Toma','Dragomir','Moldovan','Neagu','Lungu','Mocanu','Oprea','Radu','Voicu','Sandu','Preda','Sima','Mihai','Cristea','Diaconu','Anghel','Iordache','Pop','Petrescu','Dumitrescu','Avram','Manole','Zamfir','Bălan','Nedelcu','Paraschiv','Crăciun','Felea','Cacina','Trofin','Sărac'],
  tr: ['Yılmaz','Kaya','Demir','Şahin','Çelik','Yıldız','Aydın','Öztürk','Arslan','Doğan','Kılıç','Aslan','Yıldırım','Özdemir','Aktaş','Polat','Özkan','Erdoğan','Koç','Kurt','Özer','Ateş','Bulut','Güneş','Karaca','Tekin','Çetin','Kara','Keskin','Ünal','Acar','Aksoy','Sarı','Taş','Uçar','Yavuz','Turan','Bozkurt','Kaplan','Avcı','Erdem','Işık','Sönmez','Akın','Güler','Korkmaz','Coşkun','Bayram','Tunç','Ekinci','Duman','Altun','İpcioğlu','Sevim'],
  kr: ['Kim','Lee','Park','Choi','Jung','Kang','Cho','Yoon','Jang','Lim','Han','Shin','Oh','Seo','Kwon','Hwang','Ahn','Song','Yoo','Hong','Jeon','Ko','Moon','Yang','Son','Bae','Baek','Heo','Nam','Shim','Noh','Ha','Kwak','Sung','Cha','Joo','Woo','Koo','Min','Ryu','Na','Jin','Ji','Eom','Chae','Won','Cheon','Bang','Gong','Hyun','Ham','Byun','Yeom','Yeo','Choo','Do','So','Seok','Pyo','Ma'],
  sk: ['Kováč','Horváth','Varga','Tóth','Nagy','Baláž','Szabó','Molnár','Lukáč','Hudák','Mráz','Polák','Kollár','Németh','Oravec','Šimko','Kováčik','Bartoš','Pavlík','Krajčí','Novák','Kubík','Ďurica','Gajdoš','Blaho','Hrušovský','Kmeť','Kuruc','Lacko','Mikuš','Páleník','Rusnák','Sloboda','Šebo','Urban','Vaško','Zelenák','Baran','Bielik','Čech','Fedor','Halák','Jurčo','Kopecký','Ličko','Majerník','Michalík','Ondruš','Repka','Slovák','Švec','Tomko','Valach','Žiak'],
  ru: ['Ivanov','Smirnov','Kuznetsov','Popov','Sokolov','Lebedev','Novikov','Morozov','Volkov','Solovyov','Vasilyev','Zaitsev','Pavlov','Semyonov','Golubev','Vinogradov','Bogdanov','Vorobyov','Fyodorov','Mikhailov','Belyaev','Tarasov','Belov','Komarov','Kozlov','Petrov','Fedorov','Egorov','Nikolaev','Orlov','Andreev','Makarov','Nikitin','Zakharov','Stepanov','Romanov','Kovalev','Ilyin','Gusev','Titov','Kuzmin','Kudryavtsev','Baranov','Kulikov','Alekseev','Bykov','Sorokin','Kiselev','Klimov','Polyakov','Frolov','Zhukov','Kornilov','Bazhenov','Nazarov'],
  lv: ['Bērziņš','Kalniņš','Ozoliņš','Jansons','Liepiņš','Krūmiņš','Balodis','Zariņš','Pētersons','Vītols','Kļaviņš','Celmiņš','Eglītis','Siliņš','Ozols','Vanags','Grīnbergs','Lācis','Kalējs','Strautiņš','Zvaigzne','Kārkliņš','Rozenbergs','Sproģis','Freimanis','Vilks','Lapiņš','Upītis','Dzenis','Kalnietis','Avotiņš','Bite','Muižnieks','Šteins','Bērtiņš','Kronbergs','Priede','Purmalis','Rudzītis','Sniedze','Ceriņš','Mežulis','Vilciņš','Zīverts','Dombrovskis','Puriņš','Briedis','Āboliņš','Krastiņš','Leimanis','Ziemelis','Graudiņš','Liepa'],
  ge: ['Beridze','Kapanadze','Gelashvili','Mamedov','Lomidze','Tsiklauri','Chikovani','Abashidze','Japaridze','Kiknadze','Jikia','Nozadze','Kipiani','Gogua','Gogishvili','Maisuradze','Kvaratskhelia','Kobakhidze','Natsvlishvili','Bakradze','Gabunia','Mchedlishvili','Khurtsidze','Shengelia','Ninua','Mikadze','Dolidze','Kakhiani','Tsertsvadze','Chkheidze','Gvaramia','Kalandadze','Melashvili','Burduli','Jorbenadze','Kvirikashvili','Tabatadze','Lortkipanidze','Abuladze','Davitashvili','Kurtanidze','Sulakvelidze','Tsitsishvili','Iashvili','Asatiani','Gotsiridze','Margvelashvili','Khachidze','Svanidze','Tsulukidze','Khelaia','Papava','Bregvadze','Zhvania'],
  th: ['Srisuk','Chaiyasit','Wongsawat','Thongchai','Boonma','Rattanakul','Saetang','Sukprasert','Chanthawong','Kongkaew','Phromma','Sombat','Thanakit','Siriwat','Ratanaporn','Kaewkham','Jaidee','Sriwong','Phongsri','Intharak','Wongchai','Thepsuwan','Rungrot','Suksawat','Kittiwong','Charoensuk','Sangthong','Somboon','Pattanasak','Chaiyaporn','Rattanasiri','Boonsong','Kanjanapong','Nakprasit','Prasertsri','Sirisuk','Tangsiri','Wattana','Yodkhao','Saelim','Panyarat','Meesuk','Kamolchai','Thongdee','Chantra','Sukjai','Seubsai','Khamwong','Phetrat','Duangjai','Rakchat','Inthong','Puangmalai'],
  az: ['Aliyev','Mammadov','Hasanov','Huseynov','Guliyev','Ismayilov','Abbasov','Babayev','Jafarov','Rzayev','Karimov','Najafov','Ahmadov','Askarov','Gasimov','Mustafayev','Rahimov','Sadigov','Valiyev','Zeynalov','Orujov','Ibrahimov','Hajiyev','Suleymanov','Musayev','Novruzov','Agayev','Bayramov','Isgandarov','Hasanli','Mammadli','Nasirov','Salimov','Gurbanov','Shirinov','Talibov','Yusifov','Abdullayev','Akhundov','Amirov','Asadov','Baghirov','Farzaliyev','Garayev','Heydarov','Javadov','Kazimov','Mahmudov','Mirzayev','Shukurov','Vahabov','Zamanov'],
  es: ['García','Fernández','López','Martínez','Sánchez','Pérez','Gómez','Ruiz','Navarro','Torres','Puig','Etxeberria','Rodríguez','González','Hernández','Jiménez','Díaz','Moreno','Muñoz','Álvarez','Romero','Alonso','Gutiérrez','Gil','Serrano','Blanco','Molina','Morales','Suárez','Ortega','Delgado','Castro','Ortiz','Rubio','Marín','Sanz','Iglesias','Núñez','Medina','Garrido','Cortés','Castillo','Santos','Lozano','Guerrero','Cano','Prieto','Méndez','Cruz','Calvo','Vidal','Ferrer','Soler','Vila','Aguirre','Arana','Urrutia'],
  is: ['Jónsson','Sigurðsson','Guðmundsson','Gunnarsson','Ólafsson','Einarsson','Kristjánsson','Magnússon','Stefánsson','Björnsson','Arnarsson','Jóhannsson','Pétursson','Árnason','Helgason','Halldórsson','Þórsson','Haraldsson','Kristinsson','Ragnarsson','Sveinsson','Friðriksson','Hauksson','Ingólfsson','Óskarsson','Karlsson','Bjarnason','Davíðsson','Egilsson','Finnsson','Gíslason','Hallgrímsson','Ásgeirsson','Baldursson','Brynjarsson','Eiríksson','Grétarsson','Hilmarsson','Jakobsson','Kárason','Leifsson','Marteinsson','Níelsson','Pálsson','Reynisson','Sigurjónsson','Snorrason','Valsson','Viðarsson','Þorsteinsson','Ævarsson','Atlason','Birgisson','Daníelsson'],
  gb: ['Smith','Jones','Taylor','Brown','Wilson','Evans','Edwards','Campbell','Stewart','MacLeod','Hughes','Clarke','Davies','Robinson','Wright','Thompson','White','Walker','Roberts','Green','Hall','Wood','Jackson','Harrison','Morgan','Baker','Turner','Hill','Cooper','Ward','Morris','Moore','King','Watson','Bell','Murray','Reid','Robertson','Thomson','Ross','Paterson','Fraser','Grant','Scott','Mitchell','Kelly','Shaw','Lloyd','Price','Griffiths','Lee','Fox','Russell','Davidson','Cameron','Ellis'],
  by: ['Ivanou','Kavalenka','Novik','Shamko','Lukashevich','Karpovich','Zhuk','Moroz','Baranau','Hrybko','Sakalou','Krivets','Kazlou','Petrachenka','Rabtsau','Shymanski','Bialou','Hrytsuk','Vasilevich','Yakimovich','Zhukau','Lapitski','Kuzmich','Martynau','Pashkevich','Kavaliou','Radzevich','Savitski','Klimovich','Hurynovich','Charniauski','Ramanau','Stankevich','Marozau','Lysenka','Kuzniatsou','Trafimau','Sidarenka','Barysau','Famin','Matsveyeu','Zaitsau','Paulau','Hlebau','Valadzko','Siamionau','Kryvitski','Yanushkevich','Navumau','Kastsiuk','Bahdanovich','Davydzenka'],
  hu: ['Nagy','Kovács','Tóth','Szabó','Horváth','Varga','Kiss','Molnár','Németh','Farkas','Balogh','Papp','Simon','Fekete','Szilágyi','Török','Fehér','Balázs','Gál','Kis','Szűcs','Pintér','Kocsis','Fodor','Szalai','Sipos','Magyar','Lukács','Gulyás','Biró','Király','Katona','László','Jakab','Bogdán','Sándor','Boros','Fazekas','Kelemen','Antal','Somogyi','Orosz','Fülöp','Veres','Vincze','Hegedűs','Deák','Budai','Bálint','Illés','Pál','Vass','Szekeres','Major','Bakos'],
  rs: ['Jovanović','Petrović','Nikolić','Marković','Đorđević','Stojanović','Ilić','Stanković','Pavlović','Milošević','Popović','Kostić','Lazić','Marinković','Simić','Ristić','Đurić','Mitrović','Živković','Tomić','Obradović','Savić','Petković','Milenković','Stevanović','Vasić','Lukić','Todorović','Kovačević','Ivanović','Matić','Bogdanović','Jović','Vuković','Antić','Mladenović','Filipović','Nedeljković','Radovanović','Stojković','Milovanović','Krstić','Zdravković','Božović','Perić','Ćirić','Gajić','Janković','Novaković','Spasić','Arsić','Pešić'],
  hr: ['Horvat','Kovačević','Babić','Marić','Jurić','Novak','Knežević','Vuković','Pavić','Perić','Božić','Radić','Blažević','Grgić','Pavlović','Kovačić','Lovrić','Brkić','Šarić','Mikulić','Barišić','Petrović','Tomić','Matić','Kolar','Vidović','Bošnjak','Klarić','Lončar','Filipović','Galić','Martinović','Pavičić','Jukić','Kralj','Sertić','Žužić','Mandić','Ćosić','Rukavina','Starčević','Tomljanović','Polić','Šimić','Bilić','Vrdoljak','Čović','Matijević','Živković','Herceg','Jelić','Butković','Kos','Pranjić','Radošević'],
  gr: ['Papadopoulos','Pappas','Nikolaidis','Georgiou','Oikonomou','Dimitriou','Karagiannis','Vlachos','Antoniou','Makris','Papadakis','Papageorgiou','Konstantinou','Vasileiou','Ioannou','Christodoulou','Alexiou','Theodorou','Athanasiou','Michailidis','Georgiadis','Papanikolaou','Stavropoulos','Angelopoulos','Kostopoulos','Panagiotopoulos','Dimopoulos','Lambrou','Mavridis','Raptis','Kyriakou','Karalis','Tsakiris','Chatzis','Sotiropoulos','Galanis','Anagnostou','Nikolaou','Zervas','Kontos','Petridis','Apostolou','Markou','Theodoridis','Spanos','Kouris','Katsaros','Stathopoulos','Lazaridis','Fotiou','Bakas','Triantafyllou','Nikolopoulos','Kalogeropoulos'],
  dk: ['Nielsen','Jensen','Hansen','Pedersen','Andersen','Christensen','Larsen','Sørensen','Rasmussen','Jørgensen','Madsen','Kristensen','Mortensen','Johansen','Olsen','Thomsen','Poulsen','Knudsen','Møller','Mikkelsen','Frederiksen','Laursen','Henriksen','Lund','Schmidt','Eriksen','Holm','Kristiansen','Clausen','Simonsen','Svendsen','Andreasen','Jakobsen','Iversen','Østergaard','Jeppesen','Vestergaard','Nissen','Lauridsen','Kjær','Dalsgaard','Mogensen','Jacobsen','Bach','Friis','Lindholm','Bertelsen','Overgaard','Petersen','Christiansen','Winther','Krogh','Dam','Bruun','Nygaard','Skov'],
  nl: ['de Jong','Jansen','de Vries','van den Berg','van Dijk','Bakker','Visser','Smit','Meijer','de Boer','Mulder','Bos','Dekker','Brouwer','de Graaf','van der Meer','van der Linden','Kok','Jacobs','de Haan','Vermeulen','van den Heuvel','van der Veen','van den Broek','de Bruijn','de Groot','Schouten','van Beek','Willems','van Vliet','van de Ven','Hoekstra','Maas','Verhoeven','Koster','van Dam','van der Wal','Prins','Blom','Huisman','Peters','de Wit','Kuipers','Hendriks','van Leeuwen','Bosman','Kramer','Postma','de Jonge','Bosch','Vos','Wolters','Hermans','Brink','Smits','Timmermans'],
  lt: ['Kazlauskas','Jankauskas','Petrauskas','Stankevičius','Vasiliauskas','Žukauskas','Butkus','Paulauskas','Urbonas','Kavaliauskas','Navickas','Baranauskas','Žilinskas','Lukoševičius','Rimkus','Kairys','Sakalauskas','Mockus','Šimkus','Balčiūnas','Jonaitis','Žemaitis','Kazakevičius','Vaitkus','Rutkauskas','Pocius','Ramanauskas','Kubilius','Grigas','Adomaitis','Bružas','Černiauskas','Dambrauskas','Gudaitis','Jakštas','Kriaučiūnas','Lapinskas','Malinauskas','Norkus','Paškevičius','Račkauskas','Savickas','Tamošiūnas','Urbonavičius','Valančius','Žukas','Bielskis','Daukša','Juška','Kalvaitis','Mikalauskas','Stonkus','Šukys','Ivanauskas','Kuzminskas'],
nl: ['de Jong','Jansen','de Vries','van den Berg','van Dijk','Bakker','Visser','Smit','Meijer','de Boer','Mulder','Bos'],
  kp: ['Kim','Ri','Pak','Choe','Jong','Kang','Han','O','Ryu','Hwang','Jang','Yun','Jo','Kwon','So','Hong','Mun','Yang','Son','Song','Pae','Paek','Hyon','No','Ha','Kwak','Sin','Cha','Ju','U','Ku','Min','Rim','Ra','Jin','Ji','Om','Chae','Won','Chon','Pang','Kong','Ham','Pyon','Yom','Yo','Chu','To','Sok','Pyo','Ma','Thak','Kye','Tong','Sung'],
  kg: ['Asanov','Mamatov','Abdyldaev','Toktogulov','Bekov','Sadykov','Usenov','Zhumabaev','Osmonov','Kasymov','Aliev','Turdubaev','Akmatov','Abdrakhmanov','Baisalov','Chotonov','Dzhaparov','Ermatov','Ibraimov','Imanaliev','Isakov','Kadyrov','Karimov','Kudaibergenov','Mambetov','Mamytov','Moldobaev','Nazarov','Omurbekov','Orozbaev','Rakhmanov','Ryskulov','Sabyrov','Satybaldiev','Sydykov','Temirov','Tokonov','Turgunbaev','Umetaliev','Zhusupov','Abylkasymov','Alymkulov','Asanaliev','Bakirov','Duishenbiev','Esenaliev','Ismailov','Kenzhebaev','Kurmanov','Musaev','Osmonaliev','Sultanov','Toktosunov','Zhakypov'],
  ba: ['Hodžić','Hadžić','Kovačević','Delić','Begić','Mehić','Husić','Babić','Dedić','Šehić','Jukić','Omerović','Alić','Hasanović','Ibrahimović','Karić','Kurtović','Mujić','Selimović','Smajić','Suljić','Avdić','Ahmetović','Bajrić','Čolić','Džeko','Hrustić','Imamović','Jusić','Mehmedović','Mušić','Osmanović','Pašić','Ramić','Salihović','Šabić','Tahirović','Zukić','Bešić','Halilović','Kovač','Marković','Petrović','Ilić','Lukić','Tomić','Jurić','Perić','Spahić','Softić','Hamzić','Mahmutović','Fejzić','Mujkić'],
  ar: ['González','Rodríguez','Fernández','López','Martínez','Pérez','Gómez','Sosa','Romero','Álvarez','Acosta','Benítez','Díaz','Sánchez','Ramírez','Torres','Flores','Ruiz','Molina','Castro','Silva','Rojas','Ortiz','Suárez','Medina','Herrera','Aguirre','Pereyra','Gutiérrez','Giménez','Moreno','Domínguez','Vázquez','Luna','Cabrera','Ríos','Morales','Ferreyra','Godoy','Ledesma','Juárez','Peralta','Quiroga','Vera','Muñoz','Ponce','Correa','Paz','Ojeda','Rossi','Bianchi','Ferrari','Romano','Navarro','Figueroa'],
  jp: ['Tanaka','Watanabe','Ito','Yamamoto','Nakamura','Suzuki','Takahashi','Yamada','Sasaki','Yamaguchi','Matsumoto','Inoue','Kimura','Hayashi','Shimizu','Yamazaki','Mori','Ikeda','Hashimoto','Ishikawa','Ogawa','Fujita','Okada','Goto','Hasegawa','Murakami','Kato','Yoshida','Abe','Kondo','Ishii','Saito','Sakamoto','Endo','Aoki','Fujii','Nishimura','Fukuda','Ota','Miura','Fujiwara','Okamoto','Matsuda','Nakajima','Kobayashi','Sato','Nakagawa','Harada','Kojima','Takeuchi','Kudo','Nomura','Uchida'],
};

// Punkty Pucharu Świata (miejsca 1-30)
SJM.WC_POINTS = [100, 80, 60, 50, 45, 40, 36, 32, 29, 26, 24, 22, 20, 18, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
SJM.TEAM_POINTS = [400, 350, 300, 250, 200, 150, 100, 50];

SJM.LEVELS = {
  WC:   { name: 'Puchar Świata',        short: 'PŚ',  prestige: 3, travel: 9000, prize: [80000, 60000, 40000, 25000, 20000, 15000, 12000, 10000, 9000, 8000], wcPoints: true },
  COC:  { name: 'Puchar Kontynentalny', short: 'PK',  prestige: 2, travel: 4000, prize: [5000, 3000, 2000], wcPoints: false },
  SGP:  { name: 'Letnie Grand Prix',    short: 'LGP', prestige: 2, travel: 6000, prize: [20000, 15000, 10000, 6000, 5000, 4000], wcPoints: false, summer: true },
  SCOC: { name: 'Letni Puchar Kontynentalny', short: 'LPK', prestige: 1, travel: 3000, prize: [2500, 1500, 1000], wcPoints: false, summer: true },
  FIS:  { name: 'FIS Cup',              short: 'FC',  prestige: 1, travel: 1800, prize: [1000, 600, 400], wcPoints: false },
  WCH:  { name: 'Mistrzostwa Świata',   short: 'MŚ',  prestige: 5, travel: 15000, prize: [100000, 70000, 50000], champs: true },
  OWG:  { name: 'Igrzyska Olimpijskie', short: 'IO',  prestige: 6, travel: 20000, prize: [150000, 100000, 70000], champs: true },
  SFWC: { name: 'MŚ w lotach',          short: 'MŚL', prestige: 4, travel: 12000, prize: [80000, 55000, 40000], champs: true },
  WJC:  { name: 'MŚ Juniorów',          short: 'MŚJ', prestige: 2, travel: 5000, prize: [0], champs: true, junior: true },
  NAT:  { name: 'Mistrzostwa Kraju',    short: 'MK',  prestige: 1, travel: 500, prize: [0], champs: true },
};

SJM.ATTRS = [
  { key: 'inrun',    name: 'Najazd',        short: 'NAJ', desc: 'Pozycja najazdowa i prędkość na progu' },
  { key: 'takeoff',  name: 'Wybicie',       short: 'WYB', desc: 'Timing i siła odbicia z progu' },
  { key: 'flight',   name: 'Lot',           short: 'LOT', desc: 'Technika lotu, wykorzystanie powietrza' },
  { key: 'landing',  name: 'Lądowanie',     short: 'LĄD', desc: 'Telemark i noty za styl' },
  { key: 'power',    name: 'Motoryka',      short: 'MOT', desc: 'Siła, skoczność, przygotowanie fizyczne' },
  { key: 'mental',   name: 'Psychika',      short: 'PSY', desc: 'Odporność na presję w ważnych skokach' },
  { key: 'consist',  name: 'Stabilność',    short: 'STA', desc: 'Powtarzalność skoków' },
  { key: 'flying',   name: 'Loty',          short: 'LTY', desc: 'Obycie na skoczniach mamucich' },
];

SJM.STAFF_ROLES = {
  coachA:   { name: 'Trener kadry A',       desc: 'Prowadzi kadrę Pucharu Świata', base: 220000 },
  coachB:   { name: 'Trener kadry B',       desc: 'Kadra Pucharu Kontynentalnego', base: 110000 },
  coachJ:   { name: 'Trener juniorów',      desc: 'Kadra juniorska i FIS Cup',     base: 70000 },
  physio:   { name: 'Fizjoterapeuta',       desc: 'Regeneracja i kontuzje',        base: 80000 },
  tech:     { name: 'Serwismen / technik',  desc: 'Narty, kombinezony, wiązania',  base: 90000 },
  psych:    { name: 'Psycholog sportowy',   desc: 'Odporność psychiczna, forma w imprezach', base: 60000 },
  scout:    { name: 'Koordynator szkolenia',desc: 'Wyszukiwanie i ocena talentów', base: 50000 },
};

// szansa, że zdobywca Kryształowej Kuli (do 29 lat) od razu kończy karierę („manewr Rosberga”)
SJM.ROSBERG_CHANCE = 0.04;

SJM.STAFF_FIRST =['Robert','Thomas','Stefan','Alexander','Heinz','Werner','Michal','Janez','Primož','Kari','Mika','Tor','Jan','Lars','Hiroshi','Peter','Martin','Andrzej','Marek','Rafał','Grzegorz','Christian','Bernhard','Franc','Goran','Matjaž'];
SJM.STAFF_LAST = ['Haller','Kogler','Steiner','Novak','Rossi','Ström','Lepistö','Nieminen','Wawrzyniak','Gąsior','Bukowski','Szostak','Brenner','Fuchs','Ziegler','Lindqvist','Jurman','Oberhauser','Kamiński','Lorenz','Bachmann','Takeda','Ruud','Hallén','Kasper'];

SJM.FACILITIES = {
  // cost[L] = koszt rozbudowy z poziomu L na L+1; maks. poziom = cost.length
  center:  { name: 'Centrum przygotowania fizycznego', desc: 'Szybszy rozwój motoryki i wybicia', cost: [400000, 800000, 1500000, 2600000, 4000000], upkeep: 60000 },
  tunnel:  { name: 'Tunel aerodynamiczny',              desc: 'Szybszy rozwój lotu i lotów narciarskich', cost: [2500000, 3500000, 5000000], upkeep: 120000 },
  medical: { name: 'Centrum medyczne',                  desc: 'Krótsze kontuzje, szybsza regeneracja', cost: [400000, 900000, 1600000, 2500000], upkeep: 50000 },
  academy: { name: 'Szkolenie dzieci i młodzieży',      desc: 'Więcej i zdolniejszych talentów co roku', cost: [250000, 600000, 1200000, 2200000, 3500000], upkeep: 80000 },
  lab:     { name: 'Laboratorium sprzętu',              desc: 'Lepsze narty i kombinezony, mniej dyskwalifikacji', cost: [900000, 1800000, 3000000], upkeep: 70000 },
};

SJM.HILL_TYPES = {
  small:  { name: 'Mała (K-40)',      K: 40,  HS: 45,  cost: 350000,   weeks: 10, upkeep: 15000 },
  medium: { name: 'Średnia (K-70)',   K: 70,  HS: 77,  cost: 1100000,  weeks: 16, upkeep: 35000 },
  normal: { name: 'Normalna (K-95)',  K: 95,  HS: 106, cost: 3200000,  weeks: 26, upkeep: 70000 },
  large:  { name: 'Duża (K-125)',     K: 125, HS: 140, cost: 8500000,  weeks: 40, upkeep: 140000 },
  giant:  { name: 'Gigantyczna (K-150)', K: 150, HS: 168, cost: 13500000, weeks: 48, upkeep: 210000 },
  flying: { name: 'Mamut (K-200)',    K: 200, HS: 235, cost: 22000000, weeks: 60, upkeep: 300000 },
};
