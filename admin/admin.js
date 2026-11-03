/* =========================================================
   Админ-панель «Лотос»
   ========================================================= */
(() => {
'use strict';
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const P = window.LotosPricing, A = window.LotosAPI.admin, API = window.LotosAPI;
const ST = { new: 'Новая', in_progress: 'В обработке', done: 'Успешно завершена', rejected: 'Отказ' };
const KIND = { stay: 'Проживание', banya: 'Баня на колёсах', dome: 'Ужин под куполом', tour: 'Экскурсия' };
const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rub = n => n == null || n === '' ? '—' : P.rub(n);
const dru = d => d ? d.split('-').reverse().join('.') : '';
const dtru = iso => { if (!iso) return ''; const d = new Date(iso); return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }); };
const phoneFmt = p => { const d = String(p).replace(/\D/g, ''); return d.length === 11 && d[0] === '7' ? `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9)}` : p; };
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

let toastT;
const toast = (msg, bad) => { const t = $('#toast'); t.textContent = msg; t.classList.toggle('is-err', !!bad); t.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-on'), 3400); };
const guard = fn => async (...a) => { try { return await fn(...a); } catch (e) { if (e.status === 401) return showLogin(); toast(e.message || 'Ошибка', true); } };

/* ---------- вход ---------- */
function showLogin() { $('#app').hidden = true; $('#login').hidden = false; $('#loginHint').hidden = API.mode !== 'demo'; setTimeout(() => $('#loginPw').focus(), 50); }
async function showApp() { $('#login').hidden = true; $('#app').hidden = false; $('#demoBar').hidden = API.mode !== 'demo'; await loadOrders(); openFromHash(); startPolling(); }
$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault(); const er = $('#loginErr'); er.hidden = true;
  try { await A.login($('#loginPw').value); $('#loginPw').value = ''; showApp(); }
  catch (ex) { er.textContent = ex.message; er.hidden = false; }
});
$('#logout').addEventListener('click', async () => { try { await A.logout(); } catch (e) {} stopPolling(); showLogin(); });
$('#demoReset').addEventListener('click', () => { A.reset(); loadOrders(); toast('Демо-данные сброшены'); });

/* ---------- разделы ---------- */
const views = { orders: () => loadOrders(), calendar: () => loadCalendar(), settings: () => loadSettings() };
$$('.side__nav button').forEach(b => b.addEventListener('click', () => {
  $$('.side__nav button').forEach(x => x.classList.toggle('is-on', x === b));
  $$('.view').forEach(v => { v.hidden = v.id !== 'v-' + b.dataset.view; });
  views[b.dataset.view]();
  scrollTo(0, 0);
}));

/* =========================================================
   ЗАЯВКИ
   ========================================================= */
let filter = { status: '', q: '' }, orders = [], units = [], knownMax = 0, firstLoad = true;
function renderStats(s) {
  const card = (st, label, n) => `<button class="stat" data-goto="${st}"><span><i class="st-${st}" style="background:currentColor"></i>${label}</span><b>${n}</b></button>`;
  $('#stats').innerHTML = card('new', 'Новые', s.by.new) + card('in_progress', 'В обработке', s.by.in_progress) + card('done', 'Завершены', s.by.done) + card('rejected', 'Отказ', s.by.rejected)
    + `<div class="stat stat--money"><span>Выручка за месяц</span><b>${rub(s.revenue_month)}</b></div><div class="stat"><span>Выручка всего</span><b>${rub(s.revenue_total)}</b></div>`;
  $$('#stats [data-goto]').forEach(b => b.addEventListener('click', () => setStatus(b.dataset.goto)));
  const n = s.by.new; const badge = $('#navNew'); badge.hidden = !n; badge.textContent = n;
  document.title = (n ? `(${n}) ` : '') + 'Лотос — админ-панель';
}
function what(o) {
  let s = KIND[o.kind] || o.kind;
  if (o.unit_name) s += ` · ${o.unit_name}`;
  if (o.service) s += ` · ${o.service}`;
  return s;
}
function when(o) {
  if (o.kind === 'stay' && o.date_from) { const n = P.diffDays(o.date_from, o.date_to); return `${dru(o.date_from)} – ${dru(o.date_to)}<div class="muted">${n} ноч.${o.guests ? `, гостей: ${o.guests}` : ''}</div>`; }
  if (o.date_from) return dru(o.date_from) + (o.hours ? `<div class="muted">${o.hours} ч</div>` : o.guests ? `<div class="muted">человек: ${o.guests}</div>` : '');
  return '<span class="muted">дата не указана</span>';
}
function renderOrders(fresh) {
  const tb = $('#ordersTbl tbody');
  tb.innerHTML = orders.map(o => `<tr data-n="${o.number}" class="${o.status === 'new' ? 'is-new' : ''} ${fresh.has(o.number) ? 'is-fresh' : ''}">
    <td class="num">№ ${o.number}</td>
    <td class="muted">${dtru(o.created_at)}</td>
    <td class="who"><b>${esc(o.name)}</b><a href="tel:${esc(o.phone)}" onclick="event.stopPropagation()">${esc(phoneFmt(o.phone))}</a></td>
    <td>${esc(what(o))}</td>
    <td>${when(o)}</td>
    <td class="r money">${o.status === 'done' && o.final_price != null ? `<b>${rub(o.final_price)}</b><small>итог</small>` : o.est_price ? `${rub(o.est_price)}<small>расчёт</small>` : '<span class="muted">договорная</span>'}</td>
    <td><span class="pill st-${o.status}">${ST[o.status]}</span></td></tr>`).join('');
  $('#ordersEmpty').hidden = orders.length > 0;
  $('#ordersEmpty').textContent = filter.status || filter.q ? 'Ничего не найдено' : 'Заявок пока нет';
  $$('tr[data-n]', tb).forEach(tr => tr.addEventListener('click', () => openOrder(+tr.dataset.n)));
}
const loadOrders = guard(async (silent) => {
  const r = await A.orders(filter);
  units = r.units || units;
  const maxN = Math.max(0, ...r.orders.map(o => o.number));
  const fresh = new Set(firstLoad ? [] : r.orders.filter(o => o.number > knownMax).map(o => o.number));
  if (!firstLoad && fresh.size && silent) { toast(`Новая заявка № ${Math.max(...fresh)}`); }
  if (!filter.status && !filter.q) knownMax = Math.max(knownMax, maxN);
  firstLoad = false;
  orders = r.orders; renderStats(r.stats); renderOrders(fresh);
});
function setStatus(st) { filter.status = st; $$('#statusChips button').forEach(b => b.classList.toggle('is-on', b.dataset.st === st)); loadOrders(); }
$$('#statusChips button').forEach(b => b.addEventListener('click', () => setStatus(b.dataset.st)));
let qT; $('#q').addEventListener('input', e => { clearTimeout(qT); qT = setTimeout(() => { filter.q = e.target.value.trim(); loadOrders(); }, 300); });
$('#refresh').addEventListener('click', () => loadOrders());

let poll;
function startPolling() { stopPolling(); poll = setInterval(() => { if (!document.hidden && !$('#v-orders').hidden && $('#drawer').hidden) loadOrders(true); }, 30000); }
function stopPolling() { clearInterval(poll); }
document.addEventListener('visibilitychange', () => { if (!document.hidden && !$('#app').hidden && !$('#v-orders').hidden) loadOrders(true); });

/* ---------- карточка заявки ---------- */
let cur = null;
function openFromHash() { const m = location.hash.match(/order-(\d+)/); if (m) openOrder(+m[1]); }
addEventListener('hashchange', openFromHash);
async function openOrder(n) {
  let o = orders.find(x => x.number === n);
  if (!o) { try { const r = await A.orders({ q: String(n) }); o = r.orders.find(x => x.number === n); units = r.units || units; } catch (e) {} }
  if (!o) return toast('Заявка № ' + n + ' не найдена', true);
  cur = { ...o };
  renderDrawer();
  $('#drawer').hidden = false;
}
function renderDrawer() {
  const o = cur;
  $('#dTitle').textContent = 'Заявка № ' + o.number;
  $('#dCreated').textContent = 'создана ' + dtru(o.created_at);
  const unitSel = `<select id="dUnit"><option value="">Не выбран</option>${units.map(u => `<option value="${u.id}" ${u.id === o.unit_id ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select>`;
  let details = '';
  if (o.kind === 'stay') details = `<div class="grid2"><label class="f"><span>Заезд</span><input type="date" id="dFrom" value="${o.date_from || ''}"></label><label class="f"><span>Выезд</span><input type="date" id="dTo" value="${o.date_to || ''}"></label></div><label class="f"><span>Номер</span>${unitSel}</label>`;
  else if (o.kind === 'banya') details = `<div class="grid2"><label class="f"><span>Дата</span><input type="date" id="dFrom" value="${o.date_from || ''}"></label><label class="f"><span>Часов</span><input type="number" min="1" max="12" id="dHours" value="${o.hours || 1}"></label></div>`;
  else details = `<label class="f"><span>Дата</span><input type="date" id="dFrom" value="${o.date_from || ''}"></label>`;
  $('#dBody').innerHTML = `
    <div class="block"><h3>Клиент</h3>
      <div class="client"><b>${esc(o.name)}</b><a href="tel:${esc(o.phone)}">${esc(phoneFmt(o.phone))}</a></div>
      <div class="row" style="margin:0"><a class="b" href="tel:${esc(o.phone)}"><svg><use href="#i-phone"/></svg>Позвонить</a><button class="b" id="dCopy"><svg><use href="#i-copy"/></svg>Скопировать телефон</button></div>
    </div>
    <div class="block"><h3>${esc(KIND[o.kind])}${o.service ? ' · ' + esc(o.service) : ''}</h3>
      <dl class="kv">${o.guests ? `<dt>${o.kind === 'stay' ? 'Гостей' : 'Человек'}</dt><dd>${o.guests}</dd>` : ''}<dt>Расчётная сумма</dt><dd id="dEst">${o.est_price ? rub(o.est_price) : 'договорная'}</dd></dl>
      ${details}
      ${o.note ? `<div><div class="sub" style="margin-bottom:4px">Пожелания клиента</div><div class="note">${esc(o.note)}</div></div>` : ''}
    </div>
    <div class="block"><h3>Статус</h3>
      <div class="seg" id="dSeg">${Object.keys(ST).map(s => `<button data-s="${s}" class="${o.status === s ? 'is-on' : ''}">${ST[s]}</button>`).join('')}</div>
      <div class="final" id="dFinal" ${o.status === 'done' ? '' : 'hidden'}>
        <label class="f"><span>Итоговая сумма, ₽ (с учётом всех услуг)</span><input type="number" min="0" step="100" inputmode="numeric" id="dFinalIn" value="${o.final_price ?? ''}" placeholder="${o.est_price || ''}"></label>
        ${o.est_price ? `<button class="lnk" id="dUseEst" style="justify-self:start">Подставить расчётную: ${rub(o.est_price)}</button>` : ''}
      </div>
      <label class="f"><span>Комментарий менеджера</span><textarea id="dNote" placeholder="Например: предоплату внёс, приедут к 18:00">${esc(o.manager_note || '')}</textarea></label>
    </div>
    <div class="actions"><button class="b b--primary" id="dSave">Сохранить</button><button class="b b--danger" id="dDel">Удалить заявку</button></div>
    <p class="sub">Согласие на обработку данных: ${o.consent_at ? dtru(o.consent_at) : 'получено при отправке формы'}.</p>`;
  $$('#dSeg button').forEach(b => b.addEventListener('click', () => { cur.status = b.dataset.s; $$('#dSeg button').forEach(x => x.classList.toggle('is-on', x === b)); $('#dFinal').hidden = cur.status !== 'done'; if (cur.status === 'done') $('#dFinalIn').focus(); }));
  const ue = $('#dUseEst'); if (ue) ue.addEventListener('click', () => { $('#dFinalIn').value = o.est_price; });
  $('#dCopy').addEventListener('click', () => { navigator.clipboard.writeText(o.phone).then(() => toast('Телефон скопирован'), () => toast(o.phone)); });
  $('#dSave').addEventListener('click', saveOrder);
  const del = $('#dDel');
  del.addEventListener('click', guard(async () => {
    if (!del.classList.contains('is-armed')) { del.classList.add('is-armed'); del.textContent = 'Точно удалить? Нажмите ещё раз'; setTimeout(() => { del.classList.remove('is-armed'); del.textContent = 'Удалить заявку'; }, 4000); return; }
    await A.del(o.number); closeDrawer(); toast('Заявка удалена'); loadOrders();
  }));
}
const saveOrder = guard(async () => {
  const b = { status: cur.status, manager_note: $('#dNote').value };
  if (cur.status === 'done') {
    const v = $('#dFinalIn').value;
    if (v === '') { toast('Укажите итоговую сумму', true); $('#dFinalIn').focus(); return; }
    b.final_price = +v;
  }
  if ($('#dFrom')) b.date_from = $('#dFrom').value || null;
  if ($('#dTo')) b.date_to = $('#dTo').value || null;
  if ($('#dHours')) b.hours = +$('#dHours').value || 1;
  if ($('#dUnit')) b.unit_id = $('#dUnit').value ? +$('#dUnit').value : null;
  const r = await A.patch(cur.number, b);
  toast('Сохранено: ' + ST[r.order.status]);
  closeDrawer(); loadOrders();
  if (!$('#v-calendar').hidden) loadCalendar();
});
function closeDrawer() { $('#drawer').hidden = true; cur = null; if (location.hash) history.replaceState(null, '', location.pathname + location.search); }
$$('#drawer [data-close]').forEach(b => b.addEventListener('click', closeDrawer));
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#drawer').hidden) closeDrawer(); });

/* =========================================================
   КАЛЕНДАРЬ
   ========================================================= */
let calMonth = (() => { const t = todayStr(); return [+t.slice(0, 4), +t.slice(5, 7) - 1]; })();
const loadCalendar = guard(async () => {
  const [y, m] = calMonth;
  const from = `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const days = new Date(y, m + 1, 0).getDate();
  const to = P.addDays(from, days);
  $('#calTitle').textContent = `${MONTHS[m]} ${y}`;
  const r = await A.calendar({ from, to });
  const t = todayStr();
  const list = Array.from({ length: days }, (_, i) => P.addDays(from, i));
  let h = '<thead><tr><th class="bu">Номер</th>' + list.map(d => { const dow = new Date(d + 'T00:00:00').getDay(); return `<th class="${dow === 0 || dow === 6 ? 'we' : ''} ${d === t ? 'today' : ''}">${+d.slice(8)}<br><span style="font-weight:400">${['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'][dow]}</span></th>`; }).join('') + '</tr></thead><tbody>';
  for (const u of r.units) {
    h += `<tr><th class="bu">${esc(u.name)}</th>`;
    let prev = null;
    for (const d of list) {
      const v = u.days[d];
      const cls = [d < t ? 'past' : ''];
      let label = '', title = 'Свободно — нажмите, чтобы закрыть';
      if (v) {
        if (v.type === 'order') { cls.push('t-order-' + v.status); label = prev && prev.type === 'order' && prev.number === v.number ? '' : '№' + v.number; title = `Заявка № ${v.number} (${ST[v.status]})`; }
        if (v.type === 'block') { cls.push('t-block'); label = '×'; title = 'Закрыто вручную — нажмите, чтобы открыть'; }
        if (v.type === 'avito') { cls.push('t-avito'); label = 'А'; title = 'Занято на Авито'; }
      }
      prev = v;
      h += `<td class="${cls.join(' ')}"><button data-u="${u.id}" data-d="${d}" data-t="${v ? v.type : ''}" data-n="${v && v.number || ''}" title="${title}">${label}</button></td>`;
    }
    h += '</tr>';
  }
  /* услуги: баня, СВП, багги */
  if (r.services && r.services.length) {
    h += `<tr class="grp"><th class="bu">Услуги</th><td colspan="${list.length}"></td></tr>`;
    for (const sv of r.services) {
      h += `<tr class="svc"><th class="bu">${esc(sv.name)}</th>`;
      for (const d of list) {
        const v = sv.days[d];
        const cls = [d < t ? 'past' : ''];
        let label = '', title = 'Свободно — нажмите, чтобы закрыть день для новых заявок';
        if (v && v.type === 'order') { cls.push('t-order-' + v.status); if (v.blocked) cls.push('is-closed'); label = v.count > 1 ? v.count + ' заяв.' : '№' + v.number; title = `Заявки: ${v.numbers.map(n => '№' + n).join(', ')}${v.blocked ? ' · день закрыт' : ''}`; }
        if (v && v.type === 'block') { cls.push('t-block'); label = '×'; title = 'День закрыт — нажмите, чтобы открыть'; }
        h += `<td class="${cls.join(' ')}"><button data-u="${sv.id}" data-d="${d}" data-svc="1" data-t="${v ? v.type : ''}" data-n="${v && v.numbers ? v.numbers.join(',') : ''}" data-closed="${v && (v.blocked || v.type === 'block') ? 1 : 0}" title="${title}">${label}</button></td>`;
      }
      h += '</tr>';
    }
  }
  $('#board').innerHTML = h + '</tbody>';
  // на телефоне сразу прокручиваем к сегодняшнему дню
  const tcell = $('#board thead th.today'), wrap = $('.board-wrap');
  if (tcell && wrap) wrap.scrollLeft = Math.max(0, tcell.offsetLeft - $('#board th.bu').offsetWidth - 8);
  $('#pending').innerHTML = r.pending.length ? r.pending.map(o => `<button data-n="${o.number}"><span><b>№ ${o.number}</b> · ${esc(o.name)}</span><span>${dru(o.date_from)} – ${dru(o.date_to)} · ${esc(o.unit_name || 'номер не выбран')}</span></button>`).join('') : '<p class="sub">Нет новых заявок на этот месяц.</p>';
  $$('#pending button').forEach(b => b.addEventListener('click', async () => { if (!orders.length) await loadOrders(); openOrder(+b.dataset.n); }));
});
$('#board').addEventListener('click', guard(async e => {
  const b = e.target.closest('button[data-d]'); if (!b) return;
  if (b.dataset.d < todayStr()) return;
  if (b.dataset.svc && b.dataset.t === 'order') return cellMenu(b);
  if (b.dataset.t === 'order') { if (!orders.length) await loadOrders(); return openOrder(+b.dataset.n); }
  if (b.dataset.t === 'avito') return toast('Эта дата занята на Авито. Освободить её можно только там.');
  await A.block({ unit_id: +b.dataset.u, dates: [b.dataset.d], blocked: b.dataset.t !== 'block' });
  loadCalendar();
}));
/* меню ячейки услуги: открыть заявку или закрыть/открыть день */
function cellMenu(b) {
  const old = $('#cellMenu'); if (old) old.remove();
  const nums = b.dataset.n.split(',').filter(Boolean), closed = b.dataset.closed === '1';
  const m = document.createElement('div'); m.id = 'cellMenu'; m.className = 'cellmenu';
  m.innerHTML = nums.map(n => `<button data-open="${n}">Открыть заявку № ${n}</button>`).join('') + `<button data-toggle>${closed ? 'Открыть день для заявок' : 'Закрыть день для новых заявок'}</button>`;
  document.body.appendChild(m);
  const r = b.getBoundingClientRect();
  m.style.left = Math.min(innerWidth - m.offsetWidth - 8, Math.max(8, r.left)) + 'px';
  m.style.top = Math.min(innerHeight - m.offsetHeight - 8, r.bottom + 6) + 'px';
  m.addEventListener('click', guard(async e => {
    const o = e.target.closest('[data-open]'), tg = e.target.closest('[data-toggle]');
    if (o) { m.remove(); if (!orders.length) await loadOrders(); openOrder(+o.dataset.open); }
    if (tg) { m.remove(); await A.block({ unit_id: +b.dataset.u, dates: [b.dataset.d], blocked: !closed }); loadCalendar(); }
  }));
  setTimeout(() => document.addEventListener('click', function off(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('click', off); } }), 0);
}
$('#calPrev').addEventListener('click', () => { const d = new Date(calMonth[0], calMonth[1] - 1, 1); calMonth = [d.getFullYear(), d.getMonth()]; loadCalendar(); });
$('#calNext').addEventListener('click', () => { const d = new Date(calMonth[0], calMonth[1] + 1, 1); calMonth = [d.getFullYear(), d.getMonth()]; loadCalendar(); });

/* =========================================================
   НАСТРОЙКИ
   ========================================================= */
let pricingDraft = null;
const loadSettings = guard(async () => {
  const s = await A.settings();
  $('#tgHint').textContent = s.telegram.has_token ? `(сохранён ${s.telegram.token_hint}; чтобы заменить, вставьте новый)` : '(не задан)';
  $('#tgChat').value = s.telegram.chat_id || '';
  renderUnits(s.units);
  pricingDraft = JSON.parse(JSON.stringify(s.pricing));
  renderPricing();
});
$('#tgSave').addEventListener('click', guard(async () => { await A.saveTelegram({ token: $('#tgToken').value.trim(), chat_id: $('#tgChat').value.trim() }); $('#tgToken').value = ''; toast('Настройки Telegram сохранены'); loadSettings(); }));
$('#tgFind').addEventListener('click', guard(async () => {
  const r = await A.tgChats();
  $('#tgChats').innerHTML = r.chats.length ? r.chats.map(c => `<button data-id="${esc(c.id)}">${esc(c.title)} · ${esc(c.id)}</button>`).join('') : '<span class="sub">Чатов не найдено. Напишите боту любое сообщение и нажмите ещё раз.</span>';
  $$('#tgChats button').forEach(b => b.addEventListener('click', () => { $('#tgChat').value = b.dataset.id; toast('Чат выбран. Нажмите «Сохранить».'); }));
}));
$('#tgTest').addEventListener('click', guard(async () => { await A.tgTest(); toast('Тестовое сообщение отправлено'); }));

function renderUnits(list) {
  $('#units').innerHTML = list.map(u => `<div class="unit" data-id="${u.id}">
    <div class="unit__top"><input class="inp" data-k="name" value="${esc(u.name)}" aria-label="Название номера"><input class="inp" data-k="note" value="${esc(u.note || '')}" placeholder="Подпись, например: крайний, ближе к берегу" aria-label="Подпись номера" style="font-weight:400"><button class="b" data-a="save">Сохранить</button><button class="b" data-a="sync">Обновить из Авито</button><button class="b b--danger" data-a="del">Удалить</button></div>
    <label class="f"><span>Ссылка из Авито (импорт)</span><input data-k="avito_ical_url" value="${esc(u.avito_ical_url)}" placeholder="https://www.avito.ru/…/calendar.ics"></label>
    <div class="f"><span>Ссылка для Авито (экспорт)</span><div class="copy"><input class="inp" readonly value="${esc(u.export_url)}"><button class="b" data-a="copy"><svg><use href="#i-copy"/></svg>Копировать</button></div></div>
    ${u.last_sync_status ? `<div class="unit__status">Последняя синхронизация: ${u.last_sync_at ? dtru(u.last_sync_at) + ' — ' : ''}${esc(u.last_sync_status)}</div>` : ''}
  </div>`).join('');
  $$('#units .unit').forEach(el => {
    const id = +el.dataset.id;
    el.addEventListener('click', guard(async e => {
      const a = e.target.closest('[data-a]'); if (!a) return;
      if (a.dataset.a === 'save') { const r = await A.patchUnit(id, { name: $('[data-k=name]', el).value, note: $('[data-k=note]', el).value, avito_ical_url: $('[data-k=avito_ical_url]', el).value.trim() }); renderUnits(r.units); toast('Сохранено'); }
      if (a.dataset.a === 'sync') { a.disabled = true; try { const r = await A.syncUnit(id); renderUnits(r.units); toast(r.result.ok ? (r.result.skipped ? 'Ссылка из Авито не указана' : `Готово: занятых дат с Авито — ${r.result.count}`) : 'Ошибка: ' + r.result.error, !r.result.ok); } finally { a.disabled = false; } }
      if (a.dataset.a === 'copy') { const v = $('.copy input', el); navigator.clipboard.writeText(v.value).then(() => toast('Ссылка скопирована'), () => { v.select(); toast('Скопируйте ссылку вручную'); }); }
      if (a.dataset.a === 'del') {
        if (!a.classList.contains('is-armed')) { a.classList.add('is-armed'); a.textContent = 'Точно удалить?'; setTimeout(() => { a.classList.remove('is-armed'); a.textContent = 'Удалить'; }, 4000); return; }
        const r = await A.delUnit(id); renderUnits(r.units); toast('Номер удалён');
      }
    }));
  });
}
$('#addUnit').addEventListener('click', guard(async () => { const n = $('#newUnit').value.trim(); if (!n) return toast('Введите название', true); const r = await A.addUnit(n); $('#newUnit').value = ''; renderUnits(r.units); toast('Номер добавлен'); }));

function renderPricing() {
  const p = pricingDraft;
  $('#priceTbl tbody').innerHTML = p.rooms.map((r, i) => `<tr data-i="${i}"><td><input type="date" data-k="from" value="${r.from}"></td><td><input type="date" data-k="to" value="${r.to}"></td><td><input type="number" min="0" step="500" data-k="price" value="${r.price}"></td><td><input data-k="label" value="${esc(r.label)}"></td><td><button class="b b--icon b--danger" data-del="${i}" aria-label="Удалить период"><svg><use href="#i-x"/></svg></button></td></tr>`).join('');
  $$('#priceTbl input').forEach(inp => inp.addEventListener('input', () => { const i = +inp.closest('tr').dataset.i, k = inp.dataset.k; p.rooms[i][k] = k === 'price' ? +inp.value : inp.value; }));
  $$('#priceTbl [data-del]').forEach(b => b.addEventListener('click', () => { p.rooms.splice(+b.dataset.del, 1); renderPricing(); }));
  p.hovercraft = p.hovercraft || [];
  $('#hivusTbl tbody').innerHTML = p.hovercraft.map((h, i) => `<tr data-i="${i}"><td><input data-k="group" value="${esc(h.group)}"></td><td><input data-k="name" value="${esc(h.name)}"></td><td><input type="number" min="0" step="500" data-k="price" value="${h.price ?? ''}" placeholder="договорная"></td><td style="text-align:center"><input type="checkbox" data-k="perPerson" ${h.perPerson ? 'checked' : ''} style="width:20px;min-height:20px;accent-color:var(--lotus)"></td><td><button class="b b--icon b--danger" data-hdel="${i}" aria-label="Удалить программу"><svg><use href="#i-x"/></svg></button></td></tr>`).join('');
  $$('#hivusTbl input').forEach(inp => inp.addEventListener('input', () => { const h = p.hovercraft[+inp.closest('tr').dataset.i], k = inp.dataset.k; h[k] = k === 'perPerson' ? inp.checked : k === 'price' ? (inp.value === '' ? null : +inp.value) : inp.value; }));
  $$('#hivusTbl [data-hdel]').forEach(b => b.addEventListener('click', () => { p.hovercraft.splice(+b.dataset.hdel, 1); renderPricing(); }));
  p.buggy = p.buggy || [];
  $('#buggyTbl tbody').innerHTML = p.buggy.map((h, i) => `<tr data-i="${i}"><td><input data-k="name" value="${esc(h.name)}"></td><td><input data-k="time" value="${esc(h.time || '')}"></td><td><input data-k="km" value="${esc(h.km || '')}"></td><td><input type="number" min="0" step="500" data-k="price" value="${h.price ?? ''}" placeholder="договорная"></td><td><input type="number" min="0" step="500" data-k="priceTo" value="${h.priceTo ?? ''}" placeholder="—"></td><td><button class="b b--icon b--danger" data-gdel="${i}" aria-label="Удалить тур"><svg><use href="#i-x"/></svg></button></td></tr>`).join('');
  $$('#buggyTbl input').forEach(inp => inp.addEventListener('input', () => { const h = p.buggy[+inp.closest('tr').dataset.i], k = inp.dataset.k; h[k] = (k === 'price' || k === 'priceTo') ? (inp.value === '' ? null : +inp.value) : inp.value; }));
  $$('#buggyTbl [data-gdel]').forEach(b => b.addEventListener('click', () => { p.buggy.splice(+b.dataset.gdel, 1); renderPricing(); }));
  $('#banyaSummer').value = p.banya.summer; $('#banyaWinter').value = p.banya.winter;
  $('#winterMonths').innerHTML = MONTHS.map((m, i) => `<label><input type="checkbox" value="${i + 1}" ${p.banya.winterMonths.includes(i + 1) ? 'checked' : ''}>${m}</label>`).join('');
}
$('#addPeriod').addEventListener('click', () => { const last = pricingDraft.rooms[pricingDraft.rooms.length - 1]; const from = last ? P.addDays(last.to, 1) : todayStr(); pricingDraft.rooms.push({ from, to: P.addDays(from, 30), price: last ? last.price : 10000, label: 'Новый период' }); renderPricing(); });
$('#addBuggy').addEventListener('click', () => { pricingDraft.buggy = pricingDraft.buggy || []; pricingDraft.buggy.push({ name: 'Новый тур', time: '', km: '', price: null, priceTo: null }); renderPricing(); });
$('#addHivus').addEventListener('click', () => { pricingDraft.hovercraft = pricingDraft.hovercraft || []; pricingDraft.hovercraft.push({ group: 'Прогулки', name: 'Новая программа', price: null, perPerson: false }); renderPricing(); });
$('#savePricing').addEventListener('click', guard(async () => {
  const p = pricingDraft;
  p.banya.summer = +$('#banyaSummer').value; p.banya.winter = +$('#banyaWinter').value;
  p.banya.winterMonths = $$('#winterMonths input:checked').map(x => +x.value);
  for (const r of p.rooms) if (!P.isDate(r.from) || !P.isDate(r.to) || r.to < r.from) return toast('Проверьте даты периодов: «по» не раньше «с»', true);
  const r = await A.savePricing(p); pricingDraft = r.pricing; renderPricing(); toast('Цены сохранены и уже действуют на сайте');
}));
$('#pwSave').addEventListener('click', guard(async () => { await A.password($('#pwCur').value, $('#pwNew').value); $('#pwCur').value = $('#pwNew').value = ''; toast('Пароль изменён'); }));

/* ---------- старт ---------- */
(async () => {
  await API.ready;
  try { await A.me(); showApp(); } catch (e) { showLogin(); }
})();
})();
