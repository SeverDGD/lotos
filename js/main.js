/* =========================================================
   Гостевой дом «Лотос», д. Курма — скрипты сайта
   ========================================================= */

/* ===== КОНТАКТЫ: меняйте здесь, обновятся по всему сайту ===== */
const CONTACTS = {
  phone: '+7 (995) 046-79-68',
  tel: '+79950467968',
  telegram: '',   // например: 'https://t.me/lotos_kurma'
  max: ''         // ссылка на профиль или чат в Max
};

(() => {
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const P = window.LotosPricing, API = window.LotosAPI;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
const desktop = () => innerWidth > 900;
const allowFx = !reduce && fine && innerWidth > 900;

/* версии фото: имя -> [[файл, ширина], ...] */
const IMG = {"baikal-panorama":[["baikal-panorama-480.webp",480],["baikal-panorama-960.webp",960],["baikal-panorama-1600.webp",1080]],"banya-in":[["banya-in-480.webp",480],["banya-in-960.webp",600]],"banya-out":[["banya-out-480.webp",480],["banya-out-960.webp",600]],"banya-snow":[["banya-snow-480.webp",480],["banya-snow-960.webp",800]],"bay-hills":[["bay-hills-480.webp",480],["bay-hills-960.webp",600]],"bbq-lounge":[["bbq-lounge-480.webp",480],["bbq-lounge-960.webp",800]],"bike":[["bike-480.webp",480],["bike-960.webp",960]],"buggy-blue":[["buggy-blue-480.webp",480],["buggy-blue-960.webp",747]],"buggy-dusk":[["buggy-dusk-480.webp",480],["buggy-dusk-960.webp",761]],"buggy-group":[["buggy-group-480.webp",480],["buggy-group-960.webp",637]],"buggy-mirror":[["buggy-mirror-480.webp",480],["buggy-mirror-960.webp",613]],"buggy-shamanka":[["buggy-shamanka-480.webp",478]],"buggy-sunset":[["buggy-sunset-480.webp",480],["buggy-sunset-960.webp",492]],"dome-couple":[["dome-couple-480.webp",480],["dome-couple-960.webp",960],["dome-couple-1600.webp",1600]],"dome-lights":[["dome-lights-480.webp",480],["dome-lights-960.webp",960],["dome-lights-1600.webp",1600]],"dome-outside":[["dome-outside-480.webp",480],["dome-outside-960.webp",960],["dome-outside-1600.webp",1290]],"dome-table":[["dome-table-480.webp",480],["dome-table-960.webp",960],["dome-table-1600.webp",1600]],"hero-dome":[["hero-dome-480.webp",480],["hero-dome-960.webp",960],["hero-dome-1600.webp",1600],["hero-dome-1920.webp",1920]],"horses":[["horses-480.webp",466]],"horses-water":[["horses-water-480.webp",466]],"houses":[["houses-480.webp",480],["houses-960.webp",960],["houses-1600.webp",1280]],"hovercraft-dawn":[["hovercraft-dawn-480.webp",480],["hovercraft-dawn-960.webp",960]],"hovercraft-green":[["hovercraft-green-480.webp",450]],"hovercraft-sunset":[["hovercraft-sunset-480.webp",450]],"ice-buggies":[["ice-buggies-480.webp",480],["ice-buggies-960.webp",484]],"ice-grotto":[["ice-grotto-480.webp",480],["ice-grotto-960.webp",960]],"olkhon-gates":[["olkhon-gates-480.webp",480],["olkhon-gates-960.webp",720]],"room-bath":[["room-bath-480.webp",480],["room-bath-960.webp",960]],"room-double":[["room-double-480.webp",480],["room-double-960.webp",960]],"room-kitchen":[["room-kitchen-480.webp",480],["room-kitchen-960.webp",960],["room-kitchen-1600.webp",1280]],"room-overview":[["room-overview-480.webp",480],["room-overview-960.webp",960]],"room-sofa":[["room-sofa-480.webp",480],["room-sofa-960.webp",960]],"room-window":[["room-window-480.webp",480],["room-window-960.webp",960]],"shore":[["shore-480.webp",480],["shore-960.webp",960],["shore-1600.webp",1280]],"spring":[["spring-480.webp",480],["spring-960.webp",960],["spring-1600.webp",1280]],"sunset-sea":[["sunset-sea-480.webp",480],["sunset-sea-960.webp",800]],"terrace":[["terrace-480.webp",480],["terrace-960.webp",960]],"veranda-view":[["veranda-view-480.webp",480],["veranda-view-960.webp",960]]};
const srcset = n => (IMG[n] || []).map(([f, w]) => `img/${f} ${w}w`).join(', ');
const midSrc = n => { const v = IMG[n] || []; const m = v.find(([, w]) => w >= 900) || v[v.length - 1]; return m ? 'img/' + m[0] : ''; };

/* ---------- всплывающее сообщение ---------- */
const toastEl = $('#toast'); let toastT;
const toast = msg => { toastEl.textContent = msg; toastEl.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('is-on'), 3200); };

/* ---------- контакты ---------- */
$$('[data-tel]').forEach(a => { a.href = 'tel:' + CONTACTS.tel; if (!a.children.length && a.textContent.trim().startsWith('+')) a.textContent = CONTACTS.phone; });
$$('[data-link]').forEach(a => {
  const url = CONTACTS[a.dataset.link];
  if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; }
  else a.addEventListener('click', e => { e.preventDefault(); toast('Ссылка на ' + (a.dataset.link === 'max' ? 'Max' : 'Telegram') + ' скоро появится. Пока звоните: ' + CONTACTS.phone); });
});

/* ---------- прелоадер ---------- */
const pre = $('.preloader');
if (pre && document.documentElement.classList.contains('js-preload')) {
  pre.addEventListener('animationend', e => { if (e.animationName === 'preOut') pre.remove(); });
}

/* ---------- шапка, прогресс, нижняя панель ---------- */
const hdr = $('#hdr'), mbar = $('#mbar'), hero = $('.hero'), prog = $('#progressTop');
let lastY = scrollY;
const onScrollUI = () => {
  const y = scrollY;
  hdr.classList.toggle('is-solid', y > 60);
  hdr.classList.toggle('is-hidden', y > lastY && y > innerHeight && !document.documentElement.classList.contains('menu-open'));
  lastY = y;
  mbar.classList.toggle('is-on', y > hero.offsetHeight * 0.6);
  const h = document.documentElement.scrollHeight - innerHeight;
  prog.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
};
onScrollUI();

/* ---------- меню ---------- */
const menu = $('#menu'), openBtn = $('#openMenu');
const setMenu = o => {
  menu.classList.toggle('is-open', o);
  document.documentElement.classList.toggle('menu-open', o);
  openBtn.setAttribute('aria-expanded', o);
  document.documentElement.style.overflow = o ? 'hidden' : '';
  if (o) setTimeout(() => $('#closeMenu').focus(), 300);
};
openBtn.addEventListener('click', () => setMenu(true));
$('#closeMenu').addEventListener('click', () => setMenu(false));
$$('.menu__nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));

/* ---------- слайдер первого экрана ---------- */
(() => {
  const slides = $$('.hero__slide'), dots = $$('.hero__dot'), cap = $('#heroCaption');
  const DUR = 7000; let i = 0, timer;
  const show = n => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('is-on', k === i));
    dots.forEach((d, k) => { d.classList.remove('is-on'); if (k === i) { void d.offsetWidth; d.classList.add('is-on'); } });
    const [a, b] = slides[i].dataset.caption.split('|');
    cap.innerHTML = `${a}<b>${b}</b>`;
    clearTimeout(timer); if (!reduce) timer = setTimeout(() => show(i + 1), DUR);
  };
  dots.forEach((d, k) => d.addEventListener('click', () => show(k)));
  document.documentElement.style.setProperty('--dur', DUR + 'ms');
  // свайп по первому экрану на телефоне
  let sx = null;
  hero.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1)); sx = null; });
  const delay = document.documentElement.classList.contains('js-preload') ? 1900 : 0;
  setTimeout(() => show(0), delay);
})();

/* ---------- вкладки ---------- */
$$('.tab').forEach(t => t.addEventListener('click', () => {
  $$('.tab').forEach(x => { x.setAttribute('aria-selected', x === t); $('#' + x.getAttribute('aria-controls')).hidden = x !== t; });
}));

/* ---------- заголовки по словам ---------- */
const splitEls = $$('[data-split]');
splitEls.forEach(el => {
  let i = 0;
  const walk = node => {
    [...node.childNodes].forEach(ch => {
      if (ch.nodeType === 3) {
        const parts = ch.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
          // неразрывные пробелы оставляем внутри слова
          const w = document.createElement('span'); w.className = 'split-w';
          const inner = document.createElement('span'); inner.style.setProperty('--i', i++); inner.textContent = p;
          w.appendChild(inner); frag.appendChild(w);
        });
        ch.replaceWith(frag);
      } else if (ch.nodeType === 1 && !ch.classList.contains('split-w')) walk(ch);
    });
  };
  walk(el);
});

/* ---------- появление при прокрутке ---------- */
if ('IntersectionObserver' in window && !reduce) {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.remove('pre', 'pre-mask', 'split-pre');
    io.unobserve(e.target);
  }), { rootMargin: '0px 0px -8% 0px' });
  const vh = innerHeight;
  const below = el => el.getBoundingClientRect().top > vh * 0.92;
  $$('[data-rv]').forEach(el => { if (below(el)) { el.classList.add('rv', 'pre'); io.observe(el); } });
  $$('[data-rv-mask]').forEach(el => { if (below(el)) { el.classList.add('rv-mask', 'pre-mask'); io.observe(el); } });
  splitEls.forEach(el => { if (below(el)) { el.classList.add('split-pre'); io.observe(el); } });
}

/* ---------- счётчики цен ---------- */
const countIO = 'IntersectionObserver' in window && !reduce ? new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; countIO.unobserve(e.target);
  const el = e.target, to = +el.dataset.countTo, t0 = performance.now(), dur = 1400;
  const step = t => { const k = Math.min(1, (t - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - k, 4)) / 100) * 100; el.textContent = P.rub(v).replace(/\s₽$/, ''); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}), { threshold: .6 }) : null;
const watchCounters = () => { if (countIO) $$('[data-count-to]').forEach(el => { if (el.getBoundingClientRect().top > innerHeight) countIO.observe(el); }); };
watchCounters();

/* ---------- параллакс (только компьютер) ---------- */
const para = allowFx ? $$('[data-parallax]') : [];
const doPara = () => {
  for (const img of para) {
    const r = img.parentElement.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) continue;
    const k = parseFloat(img.dataset.parallax), c = r.top + r.height / 2 - innerHeight / 2;
    if (!img.closest('.pre-mask')) img.style.transform = `translate3d(0,${(-c * k).toFixed(1)}px,0) scale(1.2)`;
  }
};

/* ---------- бегущая строка: ускоряется от прокрутки ---------- */
(() => {
  const track = $('#marquee'); if (!track || reduce) return;
  document.documentElement.classList.add('js-marquee');
  let x = 0, vel = 0, prevY = scrollY, visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(track);
  const tick = () => {
    const dy = scrollY - prevY; prevY = scrollY;
    vel += (Math.min(40, Math.abs(dy)) * 0.15 - vel) * 0.08;
    if (visible) {
      x -= 0.6 + vel;
      const half = track.scrollWidth / 2;
      if (-x >= half) x += half;
      track.style.transform = `translate3d(${x}px,0,0)`;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();

/* ---------- магнитные кнопки, наклон карточек (только компьютер) ---------- */
if (allowFx) {
  $$('.btn, .rail__btn').forEach(b => {
    b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px,${(e.clientY - r.top - r.height / 2) * .3}px)`; });
    b.addEventListener('mouseleave', () => { b.style.transform = ''; });
  });
  $$('[data-tilt]').forEach(c => {
    c.addEventListener('mousemove', e => {
      const r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      c.style.transform = `perspective(900px) rotateY(${(px - .5) * 8}deg) rotateX(${(.5 - py) * 8}deg)`;
      c.style.setProperty('--mx', px * 100 + '%'); c.style.setProperty('--my', py * 100 + '%');
    });
    c.addEventListener('mouseleave', () => { c.style.transform = ''; });
  });
}
/* волна от нажатия на кнопку */
document.addEventListener('pointerdown', e => {
  const b = e.target.closest('.btn'); if (!b || reduce) return;
  const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2, sp = document.createElement('span');
  sp.className = 'ripple'; sp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
  b.appendChild(sp); setTimeout(() => sp.remove(), 700);
});

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
  let down = false, sx = 0, sl = 0, moved = false;
  r.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.target.closest('a,button')) return; down = true; moved = false; sx = e.clientX; sl = r.scrollLeft; });
  addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 5) { moved = true; r.classList.add('is-drag'); } r.scrollLeft = sl - dx; });
  addEventListener('pointerup', () => { if (!down) return; down = false; r.classList.remove('is-drag'); if (moved) { const s = step(); r.scrollTo({ left: Math.round(r.scrollLeft / s) * s, behavior: 'smooth' }); } });
});

/* ---------- сезоны + снег ---------- */
/* ---------- атмосфера сезона: зимой снег, летом солнце с лучами и бликами ---------- */
const makeFx = (cv, build, draw) => {
  if (!cv || reduce) return { set() {} };
  const g = cv.getContext('2d'); let on = false, vis = false, raf = 0, W = 0, H = 0, st = null;
  const size = () => { const d = Math.min(devicePixelRatio || 1, 2); W = cv.offsetWidth; H = cv.offsetHeight; cv.width = W * d; cv.height = H * d; g.setTransform(d, 0, 0, d, 0, 0); st = build(W, H); };
  const frame = t => { g.clearRect(0, 0, W, H); draw(g, W, H, st, t); raf = (on || cv.classList.contains('is-on')) && vis ? requestAnimationFrame(frame) : 0; };
  const run = () => { if (on && vis && !raf) { if (!W) size(); raf = requestAnimationFrame(frame); } };
  new IntersectionObserver(([e]) => { vis = e.isIntersecting; run(); }).observe(cv);
  addEventListener('resize', () => { if (W) size(); });
  // после затухания (1,2 с) останавливаем отрисовку, чтобы не тратить батарею
  return { set(v) { on = v; cv.classList.toggle('is-on', v); run(); if (!v) setTimeout(() => { if (!on && raf) { cancelAnimationFrame(raf); raf = 0; } }, 1300); } };
};
const snow = makeFx($('#snowCanvas'),
  (W, H) => Array.from({ length: Math.round(Math.min(140, W * H / 9000)) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 2.2 + .6, s: Math.random() * .6 + .3, w: Math.random() * Math.PI * 2 })),
  (g, W, H, flakes) => {
    g.fillStyle = 'rgba(238,243,242,.75)';
    for (const f of flakes) { f.y += f.s; f.w += .01; f.x += Math.sin(f.w) * .4; if (f.y > H + 5) { f.y = -5; f.x = Math.random() * W; } g.beginPath(); g.arc(f.x, f.y, f.r, 0, 6.3); g.fill(); }
  });
const sun = makeFx($('#sunCanvas'),
  (W, H) => ({
    rays: Array.from({ length: 9 }, (_, i) => ({ a: 1.8 + i * 0.15 + Math.random() * 0.06, w: 0.03 + Math.random() * 0.05, ph: Math.random() * 6.3, sp: 0.00018 + Math.random() * 0.00025 })),
    motes: Array.from({ length: Math.round(Math.min(70, W * H / 14000)) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.8 + .5, vy: -(Math.random() * .35 + .08), w: Math.random() * 6.3, ph: Math.random() * 6.3 }))
  }),
  (g, W, H, st, t) => {
    const sx = W * (W < 700 ? .9 : .84), sy = -H * .06, L = Math.hypot(W, H) * 1.1;
    g.globalCompositeOperation = 'lighter';
    // свечение солнца
    const pulse = 1 + Math.sin(t * .0008) * .06;
    let gr = g.createRadialGradient(sx, sy, 0, sx, sy, Math.min(W, 900) * .55 * pulse);
    gr.addColorStop(0, 'rgba(255,226,170,.55)'); gr.addColorStop(.25, 'rgba(255,196,120,.22)'); gr.addColorStop(1, 'rgba(255,170,90,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // лучи
    for (const r of st.rays) {
      const a = r.a + Math.sin(t * r.sp + r.ph) * .045, al = .022 + (Math.sin(t * r.sp * 1.7 + r.ph) + 1) * .02;
      const lg = g.createLinearGradient(sx, sy, sx + Math.cos(a) * L, sy + Math.sin(a) * L);
      lg.addColorStop(0, `rgba(255,222,160,${al * 2.4})`); lg.addColorStop(.3, `rgba(255,205,140,${al})`); lg.addColorStop(.75, 'rgba(255,190,120,0)');
      g.fillStyle = lg; g.beginPath(); g.moveTo(sx, sy);
      g.lineTo(sx + Math.cos(a - r.w) * L, sy + Math.sin(a - r.w) * L);
      g.lineTo(sx + Math.cos(a + r.w) * L, sy + Math.sin(a + r.w) * L);
      g.closePath(); g.fill();
    }
    // блики-искорки в воздухе
    for (const m of st.motes) {
      m.y += m.vy; m.w += .008; m.x += Math.sin(m.w) * .25;
      if (m.y < -10) { m.y = H + 10; m.x = Math.random() * W; }
      const tw = .35 + (Math.sin(t * .002 + m.ph) + 1) * .3;
      g.fillStyle = `rgba(255,214,150,${tw * .18})`; g.beginPath(); g.arc(m.x, m.y, m.r * 3.2, 0, 6.3); g.fill();
      g.fillStyle = `rgba(255,236,200,${tw})`; g.beginPath(); g.arc(m.x, m.y, m.r * .8, 0, 6.3); g.fill();
    }
    // мягкие «блики объектива» по линии от солнца к центру
    const cx = W * .5, cy = H * .55;
    [[.35, 46, .06], [.55, 22, .08], [.8, 70, .035]].forEach(([k, rad, al], i) => {
      const x = sx + (cx - sx) * k + Math.sin(t * .0004 + i) * 6, y = sy + (cy - sy) * k;
      const fg = g.createRadialGradient(x, y, 0, x, y, rad);
      fg.addColorStop(0, `rgba(255,220,170,${al})`); fg.addColorStop(.7, `rgba(255,190,140,${al * .5})`); fg.addColorStop(1, 'rgba(255,190,140,0)');
      g.fillStyle = fg; g.beginPath(); g.arc(x, y, rad, 0, 6.3); g.fill();
    });
    g.globalCompositeOperation = 'source-over';
  });
const pill = $('.season__pill'), sb = $$('[data-season]');
const placePill = b => { pill.style.width = b.offsetWidth + 'px'; pill.style.transform = `translateX(${b.offsetLeft}px)`; };
const setSeason = (season, animate) => {
  sb.forEach(x => x.setAttribute('aria-pressed', x.dataset.season === season));
  placePill(sb.find(x => x.dataset.season === season));
  let k = 0;
  $$('#actRail .act').forEach(a => {
    const on = a.dataset.s.split(' ').includes(season);
    a.classList.toggle('is-out', !on); a.classList.remove('is-in');
    if (on && animate) { a.style.setProperty('--i', k++); void a.offsetWidth; a.classList.add('is-in'); }
  });
  rails.actRail.scrollTo({ left: 0 }); rails.actRail._update();
  snow.set(season === 'winter'); sun.set(season === 'summer');
  $('#activities').classList.toggle('is-summer', season === 'summer');
};
sb.forEach(b => b.addEventListener('click', () => setSeason(b.dataset.season, true)));
// сезон по текущему месяцу
const nowSeason = P.isWinter(P.DEFAULT_PRICING, new Date().toISOString().slice(0, 10)) ? 'winter' : 'summer';
requestAnimationFrame(() => setSeason(nowSeason, false));

/* ---------- узор «лёд» для карточек без фото ---------- */
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
      let x = rnd() * r.width, y = rnd() * r.height; g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 9; s++) { x += (rnd() - .5) * r.width * .35; y += (rnd() - .5) * r.height * .3; g.lineTo(x, y); if (rnd() > .6) { g.moveTo(x, y); g.lineTo(x + (rnd() - .5) * 60, y + (rnd() - .5) * 60); g.moveTo(x, y); } }
      g.stroke();
    }
    g.fillStyle = 'rgba(238,243,242,.5)';
    for (let k = 0; k < 40; k++) { g.beginPath(); g.arc(rnd() * r.width, rnd() * r.height, rnd() * 1.4, 0, 7); g.fill(); }
  });
}
drawIce();

let lastW = innerWidth, rT;
addEventListener('resize', () => {
  if (innerWidth === lastW) return; lastW = innerWidth;
  clearTimeout(rT);
  rT = setTimeout(() => { drawIce(); placePill($('[data-season][aria-pressed="true"]')); Object.values(rails).forEach(r => r._update()); placeKindPill(); }, 150);
});

/* ---------- больше природы ---------- */
$('#morePlaces').addEventListener('click', e => {
  const p = $('#places'), on = !p.classList.contains('is-all');
  p.classList.toggle('is-all', on);
  $('span', e.currentTarget).textContent = on ? 'Свернуть' : 'Больше природы';
});

/* ---------- видео: играют, только когда видны ---------- */
$$('video[data-autoplay]').forEach(vid => {
  const btn = vid.parentElement.querySelector('.phone__play');
  let userPaused = false;
  const setIcon = () => { $('use', btn).setAttribute('href', vid.paused ? '#play' : '#pause'); btn.setAttribute('aria-label', vid.paused ? 'Смотреть' : 'Пауза'); };
  vid.addEventListener('play', setIcon); vid.addEventListener('pause', setIcon); setIcon();
  btn.addEventListener('click', () => { if (vid.paused) { userPaused = false; vid.play().catch(() => {}); } else { userPaused = true; vid.pause(); } });
  if ('IntersectionObserver' in window && !reduce) new IntersectionObserver(([e]) => { if (e.isIntersecting && !userPaused) vid.play().catch(() => {}); else if (!e.isIntersecting) vid.pause(); }, { threshold: .35 }).observe(vid);
});

/* ---------- окна ---------- */
let lastFocus = null;
const openModal = m => { lastFocus = document.activeElement; m.hidden = false; document.documentElement.style.overflow = 'hidden'; const x = $('.modal__x', m); x && x.focus({ preventScroll: true }); };
const closeModal = m => { m.hidden = true; if (!$$('.modal').some(x => !x.hidden)) document.documentElement.style.overflow = ''; lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true }); };
$$('.modal').forEach(m => $$('[data-close]', m).forEach(c => c.addEventListener('click', () => closeModal(m))));
addEventListener('keydown', e => {
  const open = $$('.modal').filter(m => !m.hidden).pop();
  if (e.key === 'Escape') { if (open) closeModal(open); else if (menu.classList.contains('is-open')) setMenu(false); }
  if (open && open.id === 'lightbox' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) lbGo(lbI + (e.key === 'ArrowRight' ? 1 : -1));
});

/* ---------- галерея с листанием ---------- */
const lbItems = $$('[data-lb]'), lbImg = $('#lbImg'), lb = $('#lightbox');
let lbI = 0;
const lbGo = n => {
  lbI = (n + lbItems.length) % lbItems.length;
  const name = lbItems[lbI].dataset.lb;
  lbImg.style.animation = 'none'; void lbImg.offsetWidth; lbImg.style.animation = '';
  lbImg.srcset = srcset(name); lbImg.sizes = '92vw'; lbImg.src = midSrc(name);
  lbImg.alt = $('img', lbItems[lbI]).alt;
  $('#lbCount').textContent = `${lbI + 1} / ${lbItems.length}`;
};
lbItems.forEach((b, k) => b.addEventListener('click', () => { lbGo(k); openModal(lb); }));
$('#lbPrev').addEventListener('click', () => lbGo(lbI - 1));
$('#lbNext').addEventListener('click', () => lbGo(lbI + 1));
let lsx = null;
lb.addEventListener('touchstart', e => { lsx = e.touches[0].clientX; }, { passive: true });
lb.addEventListener('touchend', e => { if (lsx == null) return; const dx = e.changedTouches[0].clientX - lsx; if (Math.abs(dx) > 50) lbGo(lbI + (dx < 0 ? 1 : -1)); lsx = null; });

/* =========================================================
   БРОНИРОВАНИЕ
   ========================================================= */
let pricing = P.DEFAULT_PRICING, today = new Date().toISOString().slice(0, 10), units = [];
const bk = { kind: 'stay', unit: '', from: null, to: null, date: null, guests: 2, hours: 2, people: 2, busy: { units: {}, any: [] }, monthStart: null };
const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const dShort = d => { const [, m, dd] = d.split('-'); return `${+dd} ${MONTHS_GEN[+m - 1]}`; };
const nightsWord = n => n % 10 === 1 && n % 100 !== 11 ? 'ночь' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'ночи' : 'ночей';

function renderPrices() {
  const grid = $('#pricesGrid'); if (!grid || !pricing.rooms.length) return;
  const fmtRange = r => { const a = dShort(r.from), b = dShort(r.to); return r.from <= today ? `до ${b}` : r.from === r.to ? a : `${a} — ${b}`; };
  grid.innerHTML = pricing.rooms.map((r, i) => `<div class="price-card${today >= r.from && today <= r.to ? ' is-now' : ''}" data-rv style="--d:${i * .1}s"><span class="price-card__now">сейчас</span><span class="price-card__when">${fmtRange(r)}</span><span class="price-card__sum"><span data-count-to="${r.price}">${P.rub(r.price).replace(/\s₽$/, '')}</span><small>₽</small></span><span class="price-card__label">${r.label}</span></div>`).join('');
  grid.dataset.n = Math.min(pricing.rooms.length, 3);
  watchCounters();
  const cur = P.roomRule(pricing, today) || pricing.rooms.find(r => r.to >= today) || pricing.rooms[0];
  $$('[data-room-price]').forEach(el => { el.innerHTML = `от ${P.rub(Math.min(...pricing.rooms.filter(r => r.to >= today).map(r => r.price).concat(cur ? [cur.price] : [])))} <small>/ сутки</small>`; });
  $$('[data-banya]').forEach(el => { el.textContent = P.rub(pricing.banya[el.dataset.banya]); });
  (pricing.buggy || []).forEach(x => {
    $$(`[data-buggy="${x.name}"]`).forEach(el => { el.innerHTML = x.price == null ? 'по договорённости' : `${x.priceTo ? P.rub(x.price).replace(/\s₽$/, '') + '–' + P.rub(x.priceTo) : P.rub(x.price)}<small>с человека</small>`; });
    $$(`[data-buggy-plain="${x.name}"]`).forEach(el => { if (x.price != null) el.textContent = P.rub(x.price); });
  });
  const hp = $('#hivusPrices'), hv = pricing.hovercraft || [];
  if (hp && hv.length) {
    const groups = [];
    hv.forEach(x => { let g = groups.find(g => g.name === x.group); if (!g) groups.push(g = { name: x.group, items: [] }); g.items.push(x); });
    hp.innerHTML = groups.map(g => `<div class="menu-list__g"><h4>${g.name}</h4>${g.items.map(x => `<p><span>${x.name}</span><i></i><b>${x.price == null ? 'по договорённости' : P.rub(x.price) + (x.perPerson ? ' <small>с человека</small>' : '')}</b></p>`).join('')}</div>`).join('');
  }
  $$('[data-banya-line]').forEach(el => { el.textContent = P.rub(pricing.banya[el.dataset.banyaLine]) + ' / час'; });
}

async function loadAvailability() {
  const from = P.addDays(today, -1), to = P.addDays(today, 400);
  try { bk.busy = await API.availability(from, to); } catch (e) { bk.busy = { units: {}, any: [] }; }
  renderCal();
}
const busySet = () => new Set(bk.unit ? (bk.busy.units[bk.unit] || []) : (bk.busy.any || []));
/* дни, которые менеджер закрыл для услуги (баня, СВП, багги) */
const svcSet = () => { const k = P.serviceKey(bk.kind, bk.kind === 'tour' ? $('#bk-service').value : null); return new Set(k && bk.busy.services ? (bk.busy.services[k] || []) : []); };

/* календарь */
const cal = $('#bkCal');
function monthGrid(y, m, busy) {
  const first = new Date(Date.UTC(y, m, 1)), startDow = (first.getUTCDay() + 6) % 7, days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  let h = `<div class="cal__month"><div class="cal__title">${MONTHS[m]} ${y}</div><div class="cal__grid">` + ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'].map(d => `<div class="cal__dow">${d}</div>`).join('');
  for (let i = 0; i < startDow; i++) h += '<span class="cal__d is-empty"></span>';
  for (let d = 1; d <= days; d++) {
    const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const past = ds < today, isBusy = busy.has(ds);
    const cls = ['cal__d'];
    if (ds === today) cls.push('is-today');
    if (isBusy && !past) cls.push('is-busy');
    if (bk.kind === 'stay') {
      if (bk.from === ds && !bk.to) cls.push('is-one');
      if (bk.from === ds && bk.to) cls.push('is-start');
      if (bk.to === ds) cls.push('is-end');
      if (bk.from && bk.to && ds > bk.from && ds < bk.to) cls.push('is-in');
    } else if (bk.date === ds) cls.push('is-one');
    // для выезда можно выбрать занятый день (в этот день уже никто не ночует у вас)
    const canCheckout = bk.kind === 'stay' && bk.from && !bk.to && ds > bk.from && ![...P.nights(bk.from, ds)].some(n => busy.has(n));
    const disabled = past || (isBusy && (bk.kind !== 'stay' || !canCheckout));
    let price = '';
    if (bk.kind === 'stay' && !past && !isBusy) { const r = P.roomRule(pricing, ds); if (r) price = `<small>${String(r.price / 1000).replace('.', ',')}&nbsp;т.р.</small>`; }
    if (bk.kind === 'banya' && !past) price = `<small>${String(Math.round(P.banyaRate(pricing, ds) / 100) / 10).replace('.', ',')}&nbsp;т.р.</small>`;
    h += `<button type="button" class="${cls.join(' ')}" data-d="${ds}" ${disabled ? 'disabled' : ''} aria-label="${dShort(ds)}${isBusy ? ', занято' : ''}">${d}${price}</button>`;
  }
  return h + '</div></div>';
}
function renderCal() {
  if (!bk.monthStart) { const [y, m] = today.split('-'); bk.monthStart = [+y, +m - 1]; }
  const [y, m] = bk.monthStart, busy = bk.kind === 'stay' ? busySet() : svcSet();
  const n = new Date(Date.UTC(y, m + 1, 1));
  const atStart = `${y}-${String(m + 1).padStart(2, '0')}` <= today.slice(0, 7);
  let hint = '';
  if (bk.kind === 'stay') hint = !bk.from ? 'Выберите дату заезда' : !bk.to ? 'Теперь выберите дату выезда' : `${dShort(bk.from)} — ${dShort(bk.to)}`;
  else hint = bk.date ? dShort(bk.date) : (bk.kind === 'banya' ? 'Выберите дату для бани' : 'Выберите желаемую дату (можно уточнить с менеджером)');
  cal.innerHTML = `<div class="cal__head"><button type="button" class="cal__nav" data-nav="-1" aria-label="Предыдущий месяц" ${atStart ? 'disabled' : ''}><svg><use href="#arl"/></svg></button><div class="cal__hint" aria-live="polite">${hint}</div><button type="button" class="cal__nav" data-nav="1" aria-label="Следующий месяц"><svg><use href="#arr"/></svg></button></div>
    <div class="cal__months">${monthGrid(y, m, busy)}${monthGrid(n.getUTCFullYear(), n.getUTCMonth(), busy)}</div>
    <div class="cal__legend"><span><i class="l-sel"></i>выбрано</span>${bk.kind === 'stay' ? '<span><i class="l-busy"></i>занято</span><span>«10 т.р.» — цена за сутки, тыс. ₽</span>' : bk.kind === 'banya' ? '<span><i class="l-busy"></i>занято</span><span>«3,5 т.р.» — цена за час, тыс. ₽</span>' : '<span><i class="l-busy"></i>занято</span>'}</div>`;
  renderSum();
}
cal.addEventListener('click', e => {
  const nav = e.target.closest('[data-nav]');
  if (nav) { const [y, m] = bk.monthStart, d = new Date(Date.UTC(y, m + (+nav.dataset.nav), 1)); bk.monthStart = [d.getUTCFullYear(), d.getUTCMonth()]; renderCal(); return; }
  const b = e.target.closest('[data-d]'); if (!b || b.disabled) return;
  const d = b.dataset.d;
  if (bk.kind === 'stay') {
    const busy = busySet();
    if (!bk.from || bk.to || d <= bk.from) { if (busy.has(d)) return; bk.from = d; bk.to = null; }
    else if (P.nights(bk.from, d).some(n => busy.has(n))) { if (!busy.has(d)) { bk.from = d; bk.to = null; } }
    else if (P.diffDays(bk.from, d) > 30) { toast('Онлайн-заявка — до 30 ночей. Для долгого проживания позвоните нам.'); return; }
    else bk.to = d;
  } else bk.date = bk.date === d ? null : d;
  renderCal(); validate();
});

function renderSum() {
  const box = $('#bkSum'); let html = '';
  if (bk.kind === 'stay' && bk.from && bk.to) {
    const q = P.stayQuote(pricing, bk.from, bk.to);
    if (q) {
      html = `<div class="bk__sum-top"><span>${dShort(bk.from)} — ${dShort(bk.to)} · ${q.nights} ${nightsWord(q.nights)}</span><b>${q.unknownNights ? 'уточним' : P.rub(q.total)}</b></div>
        <ul>${q.breakdown.map(g => `<li><span>${g.label}: ${g.count} × ${P.rub(g.price)}</span><span>${P.rub(g.count * g.price)}</span></li>`).join('')}${q.unknownNights ? `<li><span>Даты без утверждённой цены: ${q.unknownNights}</span><span>уточнит менеджер</span></li>` : ''}</ul>`;
    }
  } else if (bk.kind === 'banya' && bk.date) {
    const q = P.banyaQuote(pricing, bk.date, bk.hours);
    html = `<div class="bk__sum-top"><span>${dShort(bk.date)} · ${q.hours} ч · ${q.season}</span><b>${P.rub(q.total)}</b></div><p>${P.rub(q.rate)} в час. Время начала обсудите с менеджером.</p>`;
  } else if (bk.kind === 'tour') {
    const svc = $('#bk-service').value, q = P.tourQuote(pricing, svc, bk.people);
    if (q || bk.date) html = `<div class="bk__sum-top"><span>${svc}${bk.date ? ' · ' + dShort(bk.date) : ''}</span><b${q ? '' : ' style="font-size:24px"'}>${q ? (q.priceFrom ? 'от ' : '') + P.rub(q.total) : 'по договорённости'}</b></div><p>${q ? (q.perPerson ? `${q.priceFrom ? 'От ' : ''}${P.rub(q.price)} × ${q.people} чел. ` : 'Цена за поездку на судне. ') + 'Время и детали обсудите с менеджером.' : 'Стоимость менеджер рассчитает под ваш запрос.'}</p>`;
  } else if (bk.kind === 'dome' && bk.date) {
    html = `<div class="bk__sum-top"><span>${dShort(bk.date)}</span><b style="font-size:24px">по договорённости</b></div><p>Стоимость менеджер рассчитает под ваш запрос.</p>`;
  }
  box.innerHTML = html; box.hidden = !html;
  const rate = $('#bk-rate'); if (rate) rate.textContent = P.rub(P.banyaRate(pricing, bk.date || today)) + ' / час';
}

/* вид брони */
const kpill = $('.bk__kpill'), kinds = $$('.bk__kind');
function placeKindPill() { const b = kinds.find(k => k.getAttribute('aria-pressed') === 'true'); if (b) { kpill.style.width = b.offsetWidth + 'px'; kpill.style.transform = `translateX(${b.offsetLeft}px)`; } }
const STEP1 = { stay: 'Номер и даты', banya: 'Дата и время', tour: 'Экскурсия и дата', dome: 'Желаемая дата' };
function setKind(k) {
  bk.kind = k;
  kinds.forEach(b => b.setAttribute('aria-pressed', b.dataset.kind === k));
  placeKindPill();
  $$('[data-for]').forEach(r => { r.hidden = r.dataset.for !== k; });
  $('#bkStep1Title').textContent = STEP1[k];
  renderCal(); validate();
}
kinds.forEach(b => b.addEventListener('click', () => setKind(b.dataset.kind)));
$('#bk-unit').addEventListener('change', e => { bk.unit = e.target.value; const busy = busySet(); if (bk.from && (busy.has(bk.from) || (bk.to && P.nights(bk.from, bk.to).some(n => busy.has(n))))) { bk.from = bk.to = null; toast('В этом номере выбранные даты заняты — выберите другие'); } renderCal(); validate(); });
$$('[data-step]').forEach(b => b.addEventListener('click', () => {
  const [k, d] = b.dataset.step.split(':'), lim = { guests: [1, 5], hours: [1, 8], people: [1, 30] }[k];
  bk[k] = Math.max(lim[0], Math.min(lim[1], bk[k] + +d));
  $('#bk-' + k).textContent = k === 'hours' ? bk[k] + ' ч' : bk[k];
  renderSum();
}));
/* кнопки «Забронировать» по всему сайту */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-book]'); if (!b) return;
  const m = b.closest('.modal'); if (m) closeModal(m);
  setKind(b.dataset.book);
  if (b.dataset.unit) { $('#bk-unit').value = b.dataset.unit; $('#bk-unit').dispatchEvent(new Event('change')); }
  if (b.dataset.service) { const sel = $('#bk-service'); [...sel.options].forEach(o => { o.selected = o.value === b.dataset.service; }); renderSum(); }
});
$('#bk-service').addEventListener('change', () => { if (bk.date && svcSet().has(bk.date)) { bk.date = null; toast('На выбранную дату эта услуга уже занята — выберите другой день'); } renderCal(); });

/* маска телефона */
const phone = $('#bk-phone');
phone.addEventListener('input', () => {
  let d = phone.value.replace(/\D/g, '');
  if (!d) { phone.value = ''; return validate(); }
  if (d[0] === '8') d = '7' + d.slice(1);
  if (d[0] === '9') d = '7' + d;
  if (d[0] !== '7') { phone.value = '+' + d.slice(0, 15); return validate(); }
  d = d.slice(1, 11);
  let s = '+7';
  if (d.length) s += ' (' + d.slice(0, 3);
  if (d.length >= 3) s += ')';
  if (d.length > 3) s += ' ' + d.slice(3, 6);
  if (d.length > 6) s += '-' + d.slice(6, 8);
  if (d.length > 8) s += '-' + d.slice(8, 10);
  phone.value = s; validate();
});
phone.addEventListener('focus', () => { if (!phone.value) phone.value = '+7 ('; });
phone.addEventListener('blur', () => { if (phone.value.replace(/\D/g, '').length <= 1) phone.value = ''; });

const nameEl = $('#bk-name'), consent = $('#bk-consent'), submit = $('#bkSubmit'), err = $('#bkErr');
const phoneOk = () => { const d = phone.value.replace(/\D/g, ''); return (d.length === 11 && d[0] === '7') || (phone.value.startsWith('+') && d.length >= 10 && d.length <= 15 && d[0] !== '7'); };
const nameOk = () => /^[\p{L}\s.'’\-]{2,120}$/u.test(nameEl.value.trim());
const detailsOk = () => bk.kind === 'stay' ? !!(bk.from && bk.to) : bk.kind === 'banya' ? !!bk.date : true;
function validate() { submit.disabled = !consent.checked; return detailsOk() && phoneOk() && nameOk() && consent.checked; }
[nameEl, consent].forEach(el => el.addEventListener('input', validate));
consent.addEventListener('change', () => { $('#f-consent').classList.remove('is-bad'); validate(); });
const mark = (id, bad) => { const f = $('#' + id); f.classList.toggle('is-bad', bad); let m = $('.field__err', f); if (bad && !m) { m = document.createElement('span'); m.className = 'field__err'; f.appendChild(m); } if (m) m.textContent = bad ? (id === 'f-name' ? 'Укажите ФИО буквами' : 'Проверьте номер телефона') : ''; };
nameEl.addEventListener('blur', () => { if (nameEl.value) mark('f-name', !nameOk()); });
phone.addEventListener('blur', () => { if (phone.value) mark('f-phone', !phoneOk()); });

function petals(x, y) {
  if (reduce) return;
  for (let i = 0; i < 26; i++) {
    const p = document.createElement('span'); p.className = 'petal';
    const a = Math.random() * Math.PI * 2, dist = 120 + Math.random() * 220;
    p.style.cssText = `left:${x}px;top:${y}px;--x:${Math.cos(a) * dist}px;--y:${Math.sin(a) * dist + 160}px;--r:${Math.random() * 540 - 270}deg;--d:${1.6 + Math.random()}s`;
    document.body.appendChild(p); setTimeout(() => p.remove(), 2800);
  }
}

$('#bkForm').addEventListener('submit', async e => {
  e.preventDefault(); err.hidden = true;
  if (!detailsOk()) { toast(bk.kind === 'stay' ? 'Выберите даты заезда и выезда в календаре' : 'Выберите дату в календаре'); cal.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
  if (!nameOk()) { mark('f-name', true); nameEl.focus(); return; }
  if (!phoneOk()) { mark('f-phone', true); phone.focus(); return; }
  if (!consent.checked) { $('#f-consent').classList.add('is-bad'); return; }
  const body = { kind: bk.kind, name: nameEl.value.trim(), phone: phone.value, note: $('#bk-note').value.trim(), consent: true, website: $('#bk-website').value };
  if (bk.kind === 'stay') Object.assign(body, { unit_id: bk.unit ? +bk.unit : null, date_from: bk.from, date_to: bk.to, guests: bk.guests });
  if (bk.kind === 'banya') Object.assign(body, { date_from: bk.date, hours: bk.hours });
  if (bk.kind === 'tour') Object.assign(body, { date_from: bk.date, service: $('#bk-service').value, guests: bk.people });
  if (bk.kind === 'dome') Object.assign(body, { date_from: bk.date, guests: 2 });
  submit.disabled = true; const label = submit.firstChild.textContent; submit.firstChild.textContent = 'Отправляем… ';
  try {
    const r = await API.createOrder(body);
    $('#bkNum').textContent = 'Заявка № ' + r.number;
    $('#bkForm').hidden = true; $('#bkDone').hidden = false;
    const rect = $('#bkDone').getBoundingClientRect(); petals(rect.left + rect.width / 2, rect.top + 120);
    $('#bk').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (ex) {
    err.textContent = ex.message || 'Не удалось отправить заявку. Позвоните нам: ' + CONTACTS.phone; err.hidden = false;
    if (ex.status === 409) { bk.from = bk.to = null; loadAvailability(); }
  } finally { submit.firstChild.textContent = label; validate(); }
});
$('#bkAgain').addEventListener('click', () => {
  $('#bkForm').reset(); bk.from = bk.to = bk.date = null; consent.checked = false;
  $('#bkForm').hidden = false; $('#bkDone').hidden = true; loadAvailability(); validate();
});

/* старт брони: конфигурация с сервера (или демо) */
(async () => {
  try {
    const cfg = await API.config();
    pricing = cfg.pricing || pricing; today = cfg.today || today; units = cfg.units || [];
    $('#bk-unit').innerHTML = '<option value="">Любой свободный</option>' + units.map(u => `<option value="${u.id}">${u.name}${u.note ? ' — ' + u.note : ''}</option>`).join('');
    const picks = $('#roomPicks');
    if (picks && units.length) picks.innerHTML = units.map(u => `<a class="pick" href="#booking" data-book="stay" data-unit="${u.id}"><b>${u.name}</b><span>${u.note || 'стандартная комплектация'}</span><i>Выбрать <svg><use href="#arr"/></svg></i></a>`).join('');
    if (cfg.tours) $('#bk-service').innerHTML = cfg.tours.map(t => `<option value="${t}">${t}</option>`).join('');
  } catch (e) {}
  if (API.mode === 'demo') { $('#demoFlag').hidden = false; $('#adminLink').hidden = false; }
  renderPrices(); setKind('stay'); loadAvailability();
})();
requestAnimationFrame(placeKindPill);

/* ---------- общий цикл прокрутки ---------- */
let tick = false;
addEventListener('scroll', () => { if (tick) return; tick = true; requestAnimationFrame(() => { onScrollUI(); doPara(); tick = false; }); }, { passive: true });
doPara();
})();
