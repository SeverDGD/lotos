/* =========================================================
   Связь сайта и админки с сервером.
   Если сервер не отвечает (например, при просмотре макета без сервера),
   включается демо-режим: всё хранится в этом браузере (localStorage).
   ========================================================= */
(function (root) {
  'use strict';
  var P = root.LotosPricing;
  var BASE = '/api';

  function timeoutFetch(url, opts, ms) {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, ms || 6000);
    opts = opts || {};
    if (ctrl) opts.signal = ctrl.signal;
    return fetch(url, opts).finally(function () { clearTimeout(t); });
  }
  async function call(method, path, body) {
    var opts = { method: method, credentials: 'same-origin', headers: { 'Accept': 'application/json' } };
    if (method !== 'GET') opts.headers['X-Lotos'] = '1';
    if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    var res = await timeoutFetch(BASE + path, opts, 15000);
    var data = {};
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) { var err = new Error(data.error || 'Ошибка ' + res.status); err.status = res.status; throw err; }
    return data;
  }

  /* ---------- демо-хранилище ---------- */
  var KEY = 'lotos_demo_v3';
  var mem = null;
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function seed() {
    var t = todayStr(), a = P.addDays;
    var now = new Date().toISOString();
    var notes = ['крайний, ближе к берегу', 'второй от края', 'в середине корпуса', 'в середине корпуса', 'второй от края', 'крайний'];
    var units = notes.map(function (n, i) { return { id: i + 1, name: 'Номер ' + (i + 1), note: n, avito_ical_url: '' }; });
    var services = [{ id: 101, name: 'Баня на колёсах', skey: 'banya' }, { id: 102, name: 'СВП «Спутник 12»', skey: 'sputnik' }, { id: 103, name: 'СВП «Хивус 10»', skey: 'hivus' }, { id: 104, name: 'Багги', skey: 'buggy' }];
    function o(n, name, phone, kind, extra, status, final) {
      return Object.assign({ number: n, created_at: now, updated_at: now, name: name, phone: phone, kind: kind, unit_id: null, date_from: null, date_to: null, hours: null, guests: null, service: null, note: '', est_price: null, status: status, final_price: final || null, manager_note: '' }, extra);
    }
    var s = JSON.parse(JSON.stringify(P.DEFAULT_PRICING));
    var orders = [
      o(1001, 'Пример: Иванов Иван', '+79000000001', 'stay', { unit_id: 2, date_from: a(t, 6), date_to: a(t, 9), guests: 3, est_price: P.stayQuote(s, a(t, 6), a(t, 9)).total }, 'done', 30000),
      o(1002, 'Пример: Петрова Анна', '+79000000002', 'banya', { date_from: a(t, 4), hours: 3, est_price: P.banyaQuote(s, a(t, 4), 3).total }, 'in_progress'),
      o(1003, 'Пример: Сидоров Олег', '+79000000003', 'stay', { unit_id: 1, date_from: a(t, 12), date_to: a(t, 15), guests: 2, est_price: P.stayQuote(s, a(t, 12), a(t, 15)).total }, 'in_progress'),
      o(1004, 'Пример: Козлова Мария', '+79000000004', 'tour', { service: 'СВП «Спутник 12»: рассветный час', date_from: a(t, 20), guests: 4, est_price: 14000 }, 'new'),
      o(1005, 'Пример: Смирнов Денис', '+79000000005', 'stay', { date_from: a(t, 25), date_to: a(t, 27), guests: 2, est_price: P.stayQuote(s, a(t, 25), a(t, 27)).total }, 'rejected')
    ];
    orders[0].completed_at = now;
    return { units: units, services: services, orders: orders, blocks: {}, external: {}, pricing: s, telegram: {}, nextNumber: 1006 };
  }
  function load() {
    if (mem) return mem;
    try { mem = JSON.parse(localStorage.getItem(KEY)); } catch (e) { mem = null; }
    if (!mem || !mem.units) mem = seed();
    if (!mem.pricing.hovercraft) mem.pricing.hovercraft = JSON.parse(JSON.stringify(P.DEFAULT_PRICING.hovercraft));
    if (!mem.pricing.hovercraft2) mem.pricing.hovercraft2 = JSON.parse(JSON.stringify(P.DEFAULT_PRICING.hovercraft2));
    (mem.services || []).forEach(function (s) { if (s.skey === 'hivus') s.name = 'СВП «Хивус 10»'; });
    if (!mem.pricing.buggy) mem.pricing.buggy = JSON.parse(JSON.stringify(P.DEFAULT_PRICING.buggy));
    return mem;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) {} }
  var BLOCKING = ['in_progress', 'done'];
  var STATUS_RU = { new: 'Новая', in_progress: 'В обработке', done: 'Успешно завершена', rejected: 'Отказ' };
  var KINDS = { stay: 'Проживание', banya: 'Баня на колёсах', dome: 'Ужин под куполом', tour: 'Экскурсия / тур' };
  function busy(db, unitId, from, to, ext) {
    var m = {};
    db.orders.forEach(function (o) {
      if (o.kind !== 'stay' || o.unit_id !== unitId || BLOCKING.indexOf(o.status) === -1 || !o.date_from) return;
      P.nights(o.date_from, o.date_to).forEach(function (d) { if (d >= from && d < to) m[d] = { type: 'order', number: o.number, status: o.status }; });
    });
    (db.blocks[unitId] || []).forEach(function (d) { if (d >= from && d < to && !m[d]) m[d] = { type: 'block' }; });
    return m;
  }
  function svcDays(db, sv, from, to) {
    var m = {};
    db.orders.forEach(function (o) {
      if (BLOCKING.indexOf(o.status) === -1 || !o.date_from || o.date_from < from || o.date_from >= to) return;
      if (P.serviceKey(o.kind, o.service) !== sv.skey) return;
      if (m[o.date_from]) { m[o.date_from].count++; m[o.date_from].numbers.push(o.number); }
      else m[o.date_from] = { type: 'order', number: o.number, numbers: [o.number], count: 1, status: o.status };
    });
    (db.blocks[sv.id] || []).forEach(function (d) { if (d >= from && d < to) { if (m[d]) m[d].blocked = true; else m[d] = { type: 'block' }; } });
    return m;
  }
  function row(db, o) { var u = db.units.filter(function (x) { return x.id === o.unit_id; })[0]; return Object.assign({}, o, { unit_name: u ? u.name : null, status_ru: STATUS_RU[o.status], kind_ru: KINDS[o.kind] }); }
  function stats(db) {
    var by = { new: 0, in_progress: 0, done: 0, rejected: 0 }, total = 0, month = 0, m = todayStr().slice(0, 7);
    db.orders.forEach(function (o) { by[o.status]++; if (o.status === 'done' && o.final_price) { total += o.final_price; if ((o.completed_at || '').slice(0, 7) === m) month += o.final_price; } });
    return { by: by, revenue_total: total, revenue_month: month };
  }
  function demoErr(msg, status) { var e = new Error(msg); e.status = status || 400; return e; }

  var demo = {
    config: async function () { var db = load(); return { units: db.units.map(function (u) { return { id: u.id, name: u.name, note: u.note }; }), pricing: db.pricing, today: todayStr(), tours: P.tourOptions(db.pricing).map(function (t) { return t.value; }) }; },
    availability: async function (from, to) {
      var db = load(), per = {};
      db.units.forEach(function (u) { per[u.id] = Object.keys(busy(db, u.id, from, to)).sort(); });
      var any = db.units.length ? per[db.units[0].id].filter(function (d) { return db.units.every(function (u) { return per[u.id].indexOf(d) !== -1; }); }) : [];
      var svc = {}; (db.services || []).forEach(function (sv) { svc[sv.skey] = (db.blocks[sv.id] || []).filter(function (d) { return d >= from && d < to; }); });
      return { from: from, to: to, today: todayStr(), units: per, any: any, services: svc };
    },
    createOrder: async function (b) {
      var db = load();
      if (b.consent !== true) throw demoErr('Нужно согласие на обработку персональных данных');
      if (b.unit_id && b.kind === 'stay' && Object.keys(busy(db, +b.unit_id, b.date_from, b.date_to)).length) throw demoErr('Часть выбранных дат уже занята. Выберите другие даты.', 409);
      var sk = P.serviceKey(b.kind, b.service), sv = (db.services || []).filter(function (x) { return x.skey === sk; })[0];
      if (sv && b.date_from && (db.blocks[sv.id] || []).indexOf(b.date_from) !== -1) throw demoErr('На эту дату уже всё занято. Выберите другой день или позвоните нам.', 409);
      var est = null;
      if (b.kind === 'stay') { var q = P.stayQuote(db.pricing, b.date_from, b.date_to); est = q && !q.unknownNights ? q.total : null; }
      if (b.kind === 'banya') est = P.banyaQuote(db.pricing, b.date_from, b.hours).total;
      if (b.kind === 'tour') { var tq = P.tourQuote(db.pricing, b.service, b.guests); est = tq ? tq.total : null; }
      var now = new Date().toISOString();
      var o = { number: db.nextNumber++, created_at: now, updated_at: now, name: b.name, phone: b.phone, kind: b.kind, unit_id: b.unit_id ? +b.unit_id : null, date_from: b.date_from || null, date_to: b.date_to || null, hours: b.hours || null, guests: b.guests || null, service: b.service || null, note: b.note || '', est_price: est, status: 'new', final_price: null, manager_note: '' };
      db.orders.push(o); save();
      return { number: o.number, est_price: est };
    },
    admin: {
      login: async function (pw) { if (String(pw).trim().toLowerCase() !== 'demo') throw demoErr('Неверный пароль. В демо-режиме пароль: demo', 401); try { sessionStorage.setItem('lotos_demo_auth', '1'); } catch (e) {} return { ok: true }; },
      logout: async function () { try { sessionStorage.removeItem('lotos_demo_auth'); } catch (e) {} return { ok: true }; },
      me: async function () { var ok = false; try { ok = sessionStorage.getItem('lotos_demo_auth') === '1'; } catch (e) {} if (!ok) throw demoErr('Нужно войти', 401); return { ok: true }; },
      orders: async function (q) {
        var db = load(), list = db.orders.slice().sort(function (a, b) { return b.number - a.number; });
        if (q.status) list = list.filter(function (o) { return o.status === q.status; });
        if (q.q) { var s = q.q.toLowerCase(), dg = s.replace(/\D/g, ''); list = list.filter(function (o) { return o.name.toLowerCase().indexOf(s) !== -1 || (dg && (o.phone.indexOf(dg) !== -1 || String(o.number).indexOf(dg) !== -1)); }); }
        return { orders: list.map(function (o) { return row(db, o); }), stats: stats(db), units: db.units.map(function (u) { return { id: u.id, name: u.name }; }) };
      },
      patch: async function (n, b) {
        var db = load(), o = db.orders.filter(function (x) { return x.number === n; })[0];
        if (!o) throw demoErr('Заявка не найдена', 404);
        var next = Object.assign({}, o, b);
        if ('unit_id' in b) next.unit_id = b.unit_id ? +b.unit_id : null;
        if (next.kind === 'stay' && next.unit_id && next.date_from && next.date_to && BLOCKING.indexOf(next.status) !== -1) {
          var m = busy(db, next.unit_id, next.date_from, next.date_to);
          for (var d in m) if (!(m[d].type === 'order' && m[d].number === o.number)) throw demoErr('Дата ' + d.split('-').reverse().join('.') + ' в этом номере уже занята', 409);
        }
        if (b.status === 'done' && o.status !== 'done') next.completed_at = new Date().toISOString();
        if (next.kind === 'stay' && next.date_from && next.date_to) { var q = P.stayQuote(db.pricing, next.date_from, next.date_to); next.est_price = q && !q.unknownNights ? q.total : null; }
        if (next.kind === 'banya' && next.date_from) next.est_price = P.banyaQuote(db.pricing, next.date_from, next.hours || 1).total;
        if ('final_price' in b) next.final_price = b.final_price === '' || b.final_price == null ? null : Math.round(+b.final_price);
        next.updated_at = new Date().toISOString();
        Object.assign(o, next); save();
        return { order: row(db, o), stats: stats(db) };
      },
      del: async function (n) { var db = load(); db.orders = db.orders.filter(function (o) { return o.number !== n; }); save(); return { ok: true, stats: stats(db) }; },
      calendar: async function (q) {
        var db = load();
        var pending = db.orders.filter(function (o) { return o.kind === 'stay' && o.status === 'new' && o.date_to > q.from && o.date_from < q.to; }).map(function (o) { return row(db, o); });
        return { from: q.from, to: q.to, units: db.units.map(function (u) { return { id: u.id, name: u.name, days: busy(db, u.id, q.from, q.to) }; }), services: (db.services || []).map(function (sv) { return { id: sv.id, name: sv.name, skey: sv.skey, days: svcDays(db, sv, q.from, q.to) }; }), pending: pending };
      },
      block: async function (b) { var db = load(), arr = db.blocks[b.unit_id] = db.blocks[b.unit_id] || []; (b.dates || [b.date]).forEach(function (d) { var i = arr.indexOf(d); if (b.blocked && i === -1) arr.push(d); if (!b.blocked && i !== -1) arr.splice(i, 1); }); save(); return { ok: true }; },
      settings: async function () { var db = load(); return { pricing: db.pricing, telegram: { has_token: !!db.telegram.token, token_hint: db.telegram.token ? '…' + db.telegram.token.slice(-6) : '', chat_id: db.telegram.chat_id || '' }, units: db.units.map(function (u) { return { id: u.id, name: u.name, note: u.note || '', avito_ical_url: u.avito_ical_url || '', last_sync_status: u.avito_ical_url ? 'в демо-режиме синхронизация не выполняется' : '', export_url: location.origin + '/ical/<ссылка появится на сервере>.ics' }; }) }; },
      savePricing: async function (p) { var db = load(); db.pricing = p; save(); return { pricing: p }; },
      saveTelegram: async function (b) { var db = load(); if (b.token) db.telegram.token = b.token; if ('chat_id' in b) db.telegram.chat_id = b.chat_id; save(); return { ok: true }; },
      tgChats: async function () { throw demoErr('В демо-режиме Telegram не подключается. На сервере эта кнопка найдёт ваш чат.'); },
      tgTest: async function () { throw demoErr('В демо-режиме сообщения не отправляются.'); },
      addUnit: async function (name) { var db = load(); var id = Math.max.apply(null, db.units.map(function (u) { return u.id; }).concat([0])) + 1; db.units.push({ id: id, name: name, avito_ical_url: '' }); save(); return demo.admin.settings(); },
      patchUnit: async function (id, b) { var db = load(); db.units.forEach(function (u) { if (u.id === id) Object.assign(u, b); }); save(); return demo.admin.settings(); },
      delUnit: async function (id) { var db = load(); db.units = db.units.filter(function (u) { return u.id !== id; }); save(); return demo.admin.settings(); },
      syncUnit: async function () { throw demoErr('В демо-режиме синхронизация с Авито не выполняется.'); },
      password: async function () { throw demoErr('В демо-режиме пароль не меняется.'); },
      reset: function () { mem = seed(); save(); }
    }
  };

  var server = {
    config: function () { return call('GET', '/public/config'); },
    availability: function (from, to) { return call('GET', '/public/availability?from=' + from + '&to=' + to); },
    createOrder: function (b) { return call('POST', '/public/orders', b); },
    admin: {
      login: function (pw) { return call('POST', '/admin/login', { password: pw }); },
      logout: function () { return call('POST', '/admin/logout', {}); },
      me: function () { return call('GET', '/admin/me'); },
      orders: function (q) { var s = new URLSearchParams(); if (q.status) s.set('status', q.status); if (q.q) s.set('q', q.q); return call('GET', '/admin/orders?' + s); },
      patch: function (n, b) { return call('PATCH', '/admin/orders/' + n, b); },
      del: function (n) { return call('DELETE', '/admin/orders/' + n); },
      calendar: function (q) { return call('GET', '/admin/calendar?from=' + q.from + '&to=' + q.to); },
      block: function (b) { return call('POST', '/admin/blocks', b); },
      settings: function () { return call('GET', '/admin/settings'); },
      savePricing: function (p) { return call('PUT', '/admin/settings/pricing', p); },
      saveTelegram: function (b) { return call('PUT', '/admin/settings/telegram', b); },
      tgChats: function () { return call('POST', '/admin/telegram/chats', {}); },
      tgTest: function () { return call('POST', '/admin/telegram/test', {}); },
      addUnit: function (name) { return call('POST', '/admin/units', { name: name }); },
      patchUnit: function (id, b) { return call('PATCH', '/admin/units/' + id, b); },
      delUnit: function (id) { return call('DELETE', '/admin/units/' + id); },
      syncUnit: function (id) { return call('POST', '/admin/units/' + id + '/sync', {}); },
      password: function (cur, next) { return call('POST', '/admin/password', { current: cur, next: next }); }
    }
  };

  /* определяем, есть ли сервер */
  var ready = (async function () {
    try {
      var res = await timeoutFetch(BASE + '/public/config', { headers: { 'Accept': 'application/json' } }, 4000);
      var ct = res.headers.get('content-type') || '';
      if (res.ok && ct.indexOf('application/json') !== -1) { var cfg = await res.json(); if (cfg && cfg.units) { api.mode = 'server'; api.impl = server; api.initialConfig = cfg; return api; } }
    } catch (e) {}
    api.mode = 'demo'; api.impl = demo;
    return api;
  })();

  var api = {
    mode: 'pending', impl: null, initialConfig: null, ready: ready,
    config: async function () { await ready; return api.initialConfig || api.impl.config(); },
    availability: async function (f, t) { await ready; return api.impl.availability(f, t); },
    createOrder: async function (b) { await ready; return api.impl.createOrder(b); },
    admin: new Proxy({}, { get: function (_, k) { return async function () { await ready; return api.impl.admin[k].apply(null, arguments); }; } })
  };
  root.LotosAPI = api;
})(this);
