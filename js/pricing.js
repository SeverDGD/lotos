/* =========================================================
   Расчёт стоимости. Один и тот же файл используют сайт (браузер)
   и сервер (Node.js), поэтому цена на сайте и в админке совпадает.
   Даты везде в формате "ГГГГ-ММ-ДД".
   ========================================================= */
(function (root) {
  'use strict';

  /* Цены по умолчанию. Их можно поменять в админ-панели → «Настройки». */
  var DEFAULT_PRICING = {
    rooms: [
      // цена за номер в сутки; правило применяется к ночи, которая НАЧИНАЕТСЯ в эту дату
      { from: '2026-11-01', to: '2026-12-30', price: 10000, label: 'До 31 декабря' },
      { from: '2026-12-31', to: '2027-01-02', price: 14000, label: 'Новогодние праздники' },
      { from: '2027-01-03', to: '2027-04-30', price: 12000, label: 'Ледовый период' }
    ],
    banya: {
      summer: 3000,               // ₽ в час
      winter: 3500,               // ₽ в час
      winterMonths: [11, 12, 1, 2, 3, 4]
    },
    /* СВП (судно на воздушной подушке) «Спутник 12», зима 2027.
       price: null — «по договорённости»; perPerson — цена за человека */
    hovercraft: [
      { group: 'Прогулки', name: 'Час', price: 13000 },
      { group: 'Прогулки', name: 'Рассветный час', price: 14000 },
      { group: 'Прогулки', name: 'Тур-день', price: 85000 },
      { group: 'Переходы', name: 'Листвянка — Хужир', price: 120000 },
      { group: 'Переходы', name: 'Хужир — Турка', price: 120000 },
      { group: 'Трансфер Куркут — Хужир', name: 'Прямой', price: 35000 },
      { group: 'Трансфер Куркут — Хужир', name: 'С заездом на Огой', price: 43000 },
      { group: 'Ещё', name: 'Переправа', price: 1000, perPerson: true },
      { group: 'Ещё', name: 'Организация рыбалки', price: null }
    ],
    /* туры на багги по льду Малого Моря, цена за человека; priceFrom — «от» (зависит от группы) */
    buggy: [
      { name: 'Долина Курмы', time: '1 час', km: '15 км', price: 4500 },
      { name: 'Загадки Малого Моря', time: '2 часа', km: '40 км', price: 8000 },
      { name: 'Места силы', time: '3 часа', km: '80–100 км', price: 12000 },
      { name: 'Места силы + баня на льду и обед в иглу', time: '4 часа', km: '80–100 км', price: 14000 },
      { name: 'Ольхонские ворота', time: '2,5–3 часа', km: '', price: 12000 },
      { name: 'Хобой', time: '6–8 часов', km: '', price: 17000 },
      { name: 'Лёд и пламя', time: '2 дня, 1 ночь', km: '', price: 45000, priceTo: 55000 }
    ]
  };
  var OTHER_TOURS = ['СВП «Хивус»', 'Катер', 'Конная прогулка', 'Другое'];
  var SVP = 'СВП «Спутник 12»: ';

  /* список экскурсий для формы брони: СВП «Спутник 12», багги, потом остальное */
  function tourOptions(cfg) {
    var h = (cfg && cfg.hovercraft) || DEFAULT_PRICING.hovercraft;
    var g = (cfg && cfg.buggy) || DEFAULT_PRICING.buggy;
    return h.map(function (x) {
      var low = x.name.charAt(0).toLowerCase() + x.name.slice(1);
      var label = SVP + (x.group === 'Прогулки' || x.group === 'Ещё' ? low : x.group === 'Переходы' ? 'переход ' + x.name : x.group.toLowerCase().replace('куркут', 'Куркут').replace('хужир', 'Хужир') + ' (' + low + ')');
      return { value: label, label: label, price: x.price == null ? null : x.price, perPerson: !!x.perPerson };
    }).concat(g.map(function (x) {
      var label = 'Багги: ' + x.name;
      return { value: label, label: label, price: x.price == null ? null : x.price, perPerson: true, priceFrom: !!x.priceTo };
    })).concat(OTHER_TOURS.map(function (n) { return { value: n, label: n, price: null, perPerson: false }; }));
  }
  function tourQuote(cfg, service, people) {
    var o = tourOptions(cfg).filter(function (x) { return x.value === service; })[0];
    if (!o || o.price == null) return null;
    var n = Math.max(1, parseInt(people, 10) || 1);
    return { total: o.perPerson ? o.price * n : o.price, price: o.price, perPerson: o.perPerson, priceFrom: !!o.priceFrom, people: n };
  }

  /* к какой строке календаря услуг относится заявка */
  function serviceKey(kind, service) {
    if (kind === 'banya') return 'banya';
    if (kind !== 'tour' || !service) return null;
    if (service.indexOf('СВП «Спутник') === 0) return 'sputnik';
    if (service.indexOf('СВП «Хивус') === 0) return 'hivus';
    if (service.indexOf('Багги') === 0) return 'buggy';
    return null;
  }

  function parse(d) {
    var p = String(d).split('-');
    return Date.UTC(+p[0], +p[1] - 1, +p[2]);
  }
  function fmt(t) {
    var d = new Date(t);
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
  }
  function isDate(s) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s))) return false;
    return fmt(parse(s)) === s;
  }
  function addDays(d, n) { return fmt(parse(d) + n * 86400000); }
  function diffDays(a, b) { return Math.round((parse(b) - parse(a)) / 86400000); }

  /* все ночи проживания: от даты заезда включительно до даты выезда не включительно */
  function nights(from, to) {
    var out = [], n = diffDays(from, to);
    for (var i = 0; i < n; i++) out.push(addDays(from, i));
    return out;
  }

  function roomRule(cfg, date) {
    var rules = (cfg && cfg.rooms) || DEFAULT_PRICING.rooms;
    for (var i = 0; i < rules.length; i++) {
      if (date >= rules[i].from && date <= rules[i].to) return rules[i];
    }
    return null;
  }

  /* стоимость проживания: итог, разбивка по периодам и признак «есть ночи без цены» */
  function stayQuote(cfg, from, to) {
    if (!isDate(from) || !isDate(to) || to <= from) return null;
    var list = nights(from, to), total = 0, unknown = 0, groups = [];
    list.forEach(function (d) {
      var r = roomRule(cfg, d);
      if (!r) { unknown++; return; }
      total += r.price;
      var g = groups[groups.length - 1];
      if (g && g.label === r.label && g.price === r.price) g.count++;
      else groups.push({ label: r.label, price: r.price, count: 1 });
    });
    return { nights: list.length, total: total, breakdown: groups, unknownNights: unknown };
  }

  function isWinter(cfg, date) {
    var b = (cfg && cfg.banya) || DEFAULT_PRICING.banya;
    var m = new Date(parse(date)).getUTCMonth() + 1;
    return (b.winterMonths || []).indexOf(m) !== -1;
  }
  function banyaRate(cfg, date) {
    var b = (cfg && cfg.banya) || DEFAULT_PRICING.banya;
    return isWinter(cfg, date) ? b.winter : b.summer;
  }
  function banyaQuote(cfg, date, hours) {
    if (!isDate(date)) return null;
    var h = Math.max(1, Math.min(12, parseInt(hours, 10) || 1));
    var rate = banyaRate(cfg, date);
    return { hours: h, rate: rate, total: rate * h, season: isWinter(cfg, date) ? 'зима' : 'лето' };
  }

  /* 12000 → «12 000 ₽» */
  function rub(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
  }

  var api = {
    DEFAULT_PRICING: DEFAULT_PRICING,
    parse: parse, fmt: fmt, isDate: isDate, addDays: addDays, diffDays: diffDays, nights: nights,
    roomRule: roomRule, stayQuote: stayQuote, tourOptions: tourOptions, tourQuote: tourQuote, serviceKey: serviceKey, banyaRate: banyaRate, banyaQuote: banyaQuote, isWinter: isWinter, rub: rub
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LotosPricing = api;
})(this);
