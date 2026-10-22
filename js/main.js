/* =========================================================
   Гостевой дом «Лотос», д. Курма — скрипты
   ========================================================= */
(() => {
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => innerWidth <= 720;
/* параллакс только на компьютере: на телефонах он лишь тратит батарею */
const allowParallax = !reduce && matchMedia('(hover:hover) and (pointer:fine) and (min-width:900px)').matches;

/* размеры фото: имя -> [ширина, высота] исходника; есть версии 480 / 960 / 1600 */
const IMG = {"baikal-panorama":[1080,1080],"winter-ice":[1280,960],"room-fridge":[960,1280],"room-double":[960,1280],"room-kitchen":[960,1280],"room-family":[960,1280],"room-bath":[960,1280],"bike":[960,1280],"veranda-view":[960,1280],"terrace":[960,1280],"shore":[1280,960],"houses":[1280,960],"dome-outside":[1290,2293],"dome-table":[2268,4032],"dome-couple":[2268,4032],"dome-lights":[3024,4032]};
const srcset = n => {
  const W = IMG[n][0], out = [`img/${n}-480.webp 480w`];
  if (W > 480) out.push(`img/${n}-960.webp ${Math.min(960, W)}w`);
  if (W > 960) out.push(`img/${n}-1600.webp ${Math.min(1600, W)}w`);
  return out.join(', ');
};

/* ---------- шапка и нижняя панель ---------- */
const hdr = $('#hdr'), mbar = $('#mbar'), hero = $('.hero');
const onScrollUI = () => {
  hdr.classList.toggle('is-solid', scrollY > 60);
  mbar.classList.toggle('is-on', scrollY > hero.offsetHeight * 0.6);
};
onScrollUI();

/* ---------- меню ---------- */
const menu = $('#menu'), openBtn = $('#openMenu');
const setMenu = o => {
  menu.classList.toggle('is-open', o);
  openBtn.setAttribute('aria-expanded', o);
  document.documentElement.style.overflow = o ? 'hidden' : '';
  if (o) setTimeout(() => $('#closeMenu').focus(), 300);
};
openBtn.addEventListener('click', () => setMenu(true));
$('#closeMenu').addEventListener('click', () => setMenu(false));
$$('.menu__nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));

/* ---------- вкладки ---------- */
$$('.tab').forEach(t => t.addEventListener('click', () => {
  $$('.tab').forEach(x => {
    x.setAttribute('aria-selected', x === t);
    $('#' + x.getAttribute('aria-controls')).hidden = x !== t;
  });
}));

/* ---------- появление при прокрутке (только то, что ниже первого экрана) ---------- */
if ('IntersectionObserver' in window && !reduce) {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.remove('pre', 'pre-mask');
    io.unobserve(e.target);
  }), { rootMargin: '0px 0px -6% 0px' });
  const vh = innerHeight;
  $$('[data-rv]').forEach(el => { if (el.getBoundingClientRect().top > vh) { el.classList.add('rv', 'pre'); io.observe(el); } });
  $$('[data-rv-mask]').forEach(el => { if (el.getBoundingClientRect().top > vh) { el.classList.add('rv-mask', 'pre-mask'); io.observe(el); } });
}

/* ---------- параллакс ---------- */
const para = allowParallax ? $$('[data-parallax]') : [];
const doPara = () => {
  for (const img of para) {
    const r = img.parentElement.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) continue;
    const k = parseFloat(img.dataset.parallax), c = r.top + r.height / 2 - innerHeight / 2;
    img.style.transform = `translate3d(0,${(-c * k).toFixed(1)}px,0) scale(1.18)`;
  }
};

/* ---------- ленты-слайдеры ---------- */
const rails = {};
$$('.rail').forEach(r => {
  rails[r.id] = r;
  const visible = () => [...r.children].filter(c => !c.classList.contains('is-out'));
  const gap = () => parseFloat(getComputedStyle(r).columnGap) || 16;
  const step = () => { const c = visible()[0]; return c ? c.getBoundingClientRect().width + gap() : 300; };
  const bar = $(`[data-progress="${r.id}"]`), cnt = $(`[data-count="${r.id}"]`);
  let raf = 0;
  const update = () => {
    raf = 0;
    const max = r.scrollWidth - r.clientWidth, p = max > 0 ? r.scrollLeft / max : 0;
    if (bar) { const w = Math.min(1, r.clientWidth / r.scrollWidth); bar.style.width = (w * 100) + '%'; bar.style.transform = `translateX(${p * (1 / w - 1) * 100}%)`; }
    if (cnt) { const n = visible().length, i = Math.min(n, Math.round(r.scrollLeft / step()) + 1); cnt.textContent = String(i).padStart(2, '0') + ' / ' + String(n).padStart(2, '0'); }
  };
  r.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  r._update = update; update();
  $$(`[data-prev="${r.id}"]`).forEach(b => b.addEventListener('click', () => r.scrollBy({ left: -step(), behavior: 'smooth' })));
  $$(`[data-next="${r.id}"]`).forEach(b => b.addEventListener('click', () => r.scrollBy({ left: step(), behavior: 'smooth' })));
  /* перетаскивание мышью (на телефоне работает обычный свайп) */
  let down = false, sx = 0, sl = 0, moved = false;
  r.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = r.scrollLeft; });
  addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 5) { moved = true; r.classList.add('is-drag'); } r.scrollLeft = sl - dx; });
  addEventListener('pointerup', () => {
    if (!down) return; down = false; r.classList.remove('is-drag');
    if (moved) { const s = step(); r.scrollTo({ left: Math.round(r.scrollLeft / s) * s, behavior: 'smooth' }); }
  });
});

/* ---------- сезон: лето / зима ---------- */
const pill = $('.season__pill'), sb = $$('[data-season]');
const placePill = b => { pill.style.width = b.offsetWidth + 'px'; pill.style.transform = `translateX(${b.offsetLeft}px)`; };
sb.forEach(b => b.addEventListener('click', () => {
  sb.forEach(x => x.setAttribute('aria-pressed', x === b));
  placePill(b);
  $$('#actRail .act').forEach(a => {
    const on = a.dataset.s.split(' ').includes(b.dataset.season);
    a.classList.toggle('is-out', !on);
    a.classList.remove('is-in');
    if (on) { void a.offsetWidth; a.classList.add('is-in'); }
  });
  rails.actRail.scrollTo({ left: 0 });
  rails.actRail._update();
  drawIce();
}));
requestAnimationFrame(() => placePill(sb[0]));

/* ---------- узор «трещины во льду» для карточек без фото ---------- */
function drawIce() {
  $$('canvas[data-ice]').forEach(cv => {
    const r = cv.getBoundingClientRect(); if (!r.width) return;
    const d = Math.min(devicePixelRatio || 1, 2);
    if (cv.width === Math.round(r.width * d)) return;
    cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
    const g = cv.getContext('2d'); g.scale(d, d);
    let seed = Math.round(r.width * 7 + r.height);
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    g.strokeStyle = 'rgba(225,240,243,.35)'; g.lineWidth = 1;
    for (let k = 0; k < 7; k++) {
      let x = rnd() * r.width, y = rnd() * r.height;
      g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 9; s++) {
        x += (rnd() - .5) * r.width * .35; y += (rnd() - .5) * r.height * .3; g.lineTo(x, y);
        if (rnd() > .6) { g.moveTo(x, y); g.lineTo(x + (rnd() - .5) * 60, y + (rnd() - .5) * 60); g.moveTo(x, y); }
      }
      g.stroke();
    }
    g.fillStyle = 'rgba(238,243,242,.5)';
    for (let k = 0; k < 40; k++) { g.beginPath(); g.arc(rnd() * r.width, rnd() * r.height, rnd() * 1.4, 0, 7); g.fill(); }
  });
}
drawIce();

/* пересчёт только при реальной смене ширины (на телефоне высота меняется при скролле) */
let lastW = innerWidth, rT;
addEventListener('resize', () => {
  if (innerWidth === lastW) return; lastW = innerWidth;
  clearTimeout(rT);
  rT = setTimeout(() => { drawIce(); placePill($('[data-season][aria-pressed="true"]')); Object.values(rails).forEach(r => r._update()); }, 150);
});

/* ---------- больше природы ---------- */
$('#morePlaces').addEventListener('click', e => {
  const p = $('#places'), on = !p.classList.contains('is-all');
  p.classList.toggle('is-all', on);
  $('span', e.currentTarget).textContent = on ? 'Свернуть' : 'Больше природы';
});

/* ---------- видео: играет только когда видно ---------- */
const vid = $('#domeVideo'), vbtn = $('#domePlay');
let userPaused = false;
const setIcon = () => { $('use', vbtn).setAttribute('href', vid.paused ? '#play' : '#pause'); vbtn.setAttribute('aria-label', vid.paused ? 'Смотреть' : 'Пауза'); };
vid.addEventListener('play', setIcon); vid.addEventListener('pause', setIcon); setIcon();
vbtn.addEventListener('click', () => { if (vid.paused) { userPaused = false; vid.play().catch(() => {}); } else { userPaused = true; vid.pause(); } });
if ('IntersectionObserver' in window && !reduce) {
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !userPaused) vid.play().catch(() => {});
    else if (!e.isIntersecting) vid.pause();
  }, { threshold: .35 }).observe(vid);
}

/* ---------- модальные окна ---------- */
let lastFocus = null;
const openModal = m => {
  lastFocus = document.activeElement; m.hidden = false;
  document.documentElement.style.overflow = 'hidden';
  const x = $('.modal__x', m); x && x.focus({ preventScroll: true });
};
const closeModal = m => {
  m.hidden = true;
  if (!$$('.modal').some(x => !x.hidden)) document.documentElement.style.overflow = '';
  lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
};
$$('.modal').forEach(m => $$('[data-close]', m).forEach(c => c.addEventListener('click', () => closeModal(m))));
addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const open = $$('.modal').filter(m => !m.hidden).pop();
  if (open) closeModal(open); else if (menu.classList.contains('is-open')) setMenu(false);
});

/* ---------- бронирование ---------- */
const bm = $('#bookModal');
const pick = (sel, text) => [...sel.options].forEach(o => o.selected = o.text === text);
document.addEventListener('click', e => {
  const b = e.target.closest('[data-book]'); if (!b) return;
  const rm = $('#roomModal');
  pick($('#bk-what'), b.dataset.what || 'Проживание');
  if (!rm.hidden) { pick($('#bk-room'), $('#rmTitle').textContent); rm.hidden = true; }
  $('#bookOk').hidden = true; $('#bookForm').hidden = false;
  openModal(bm);
});
$('#bookForm').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.currentTarget, req = $$('[required]', f), bad = req.filter(i => !i.value.trim());
  req.forEach(i => i.style.borderBottomColor = bad.includes(i) ? 'var(--lotus)' : '');
  if (bad.length) { bad[0].focus(); return; }
  f.hidden = true; $('#bookOk').hidden = false;
});

/* ---------- номера ---------- */
const ROOMS = {
  double:  { t: 'Стандарт',   d: 'Светлый номер с двуспальной кроватью и обеденным столом.', p: ['room-double', 'room-bath', 'room-fridge', 'terrace', 'veranda-view'],
             l: ['Тёплые полы', 'Двуспальная кровать', 'Душевая и санузел в номере', 'Чайник, микроволновка, посуда', 'Телевизор и Wi‑Fi', 'Полотенца и средства гигиены', 'Своя зона барбекю'] },
  family:  { t: 'Семейный',   d: 'Кровать и диван, обеденный стол. Удобно для семьи с детьми.', p: ['room-family', 'room-bath', 'room-kitchen', 'room-fridge', 'terrace'],
             l: ['Тёплые полы', 'Двуспальная кровать и диван', 'Душевая и санузел в номере', 'Чайник, микроволновка, посуда', 'Телевизор и Wi‑Fi', 'Полотенца и средства гигиены', 'Своя зона барбекю'] },
  kitchen: { t: 'С кухней',   d: 'Кухонный уголок с микроволновкой, чайником и посудой, шкаф для вещей.', p: ['room-kitchen', 'room-double', 'room-bath', 'room-fridge', 'veranda-view'],
             l: ['Тёплые полы', 'Кухонный уголок', 'Чайник, микроволновка, посуда', 'Телевизор и Wi‑Fi', 'Душевая и санузел', 'Полотенца и средства гигиены', 'Своя зона барбекю'] },
  terrace: { t: 'С террасой', d: 'Отдельный вход и своя терраса со столиком, откуда видно Байкал.', p: ['terrace', 'veranda-view', 'room-double', 'room-bath', 'houses'],
             l: ['Тёплые полы', 'Отдельный вход и терраса', 'Своя зона барбекю', 'Душевая и санузел', 'Чайник, микроволновка, посуда', 'Телевизор и Wi‑Fi', 'Полотенца и средства гигиены'] }
};
const rmMain = $('#rmMain'), rmThumbs = $('#rmThumbs');
const showImg = n => {
  rmMain.style.animation = 'none'; void rmMain.offsetWidth; rmMain.style.animation = '';
  rmMain.srcset = srcset(n); rmMain.src = `img/${n}-960.webp`;
  $$('button', rmThumbs).forEach(b => b.setAttribute('aria-current', b.dataset.src === n));
};
$$('[data-open-room]').forEach(b => b.addEventListener('click', () => {
  const r = ROOMS[b.dataset.openRoom];
  $('#rmTitle').textContent = r.t; $('#rmText').textContent = r.d;
  $('#rmList').innerHTML = r.l.map(x => `<li>${x}</li>`).join('');
  rmThumbs.innerHTML = r.p.map(s => `<button data-src="${s}" aria-label="Показать фото"><img src="img/${s}-480.webp" alt="" width="120" height="120" loading="lazy" decoding="async"></button>`).join('');
  $$('button', rmThumbs).forEach(t => t.addEventListener('click', () => showImg(t.dataset.src)));
  rmMain.alt = 'Фото номера «' + r.t + '»';
  showImg(r.p[0]);
  openModal($('#roomModal'));
}));
$$('.room .ph').forEach(ph => ph.style.cursor = 'pointer');

/* ---------- просмотр фото ---------- */
const lb = $('#lbImg');
$$('[data-lb]').forEach(b => b.addEventListener('click', () => {
  const n = b.dataset.lb; lb.srcset = srcset(n); lb.sizes = '90vw'; lb.src = `img/${n}-960.webp`;
  openModal($('#lightbox'));
}));

/* ---------- общий цикл прокрутки ---------- */
let tick = false;
addEventListener('scroll', () => {
  if (tick) return; tick = true;
  requestAnimationFrame(() => { onScrollUI(); doPara(); tick = false; });
}, { passive: true });
doPara();
})();
