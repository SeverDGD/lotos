/* Гостевой дом «Лотос» — скрипты */
(()=>{
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* header state */
const hdr=$('#hdr');
const onScrollHdr=()=>hdr.classList.toggle('is-solid',scrollY>60);
onScrollHdr();

/* overlay menu */
const menu=$('#menu'), openBtn=$('#openMenu');
const setMenu=o=>{menu.classList.toggle('is-open',o);openBtn.setAttribute('aria-expanded',o);document.documentElement.style.overflow=o?'hidden':''; if(o) setTimeout(()=>$('#closeMenu').focus(),300);};
openBtn.onclick=()=>setMenu(true);
$('#closeMenu').onclick=()=>setMenu(false);
$$('.menu__nav a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));

/* tabs */
$$('.tab').forEach(t=>t.addEventListener('click',()=>{
  $$('.tab').forEach(x=>{x.setAttribute('aria-selected',x===t);$('#'+x.getAttribute('aria-controls')).hidden=x!==t;});
}));

/* reveal on scroll — only for blocks that start below the first screen */
const vh=innerHeight;
const io='IntersectionObserver' in window && !reduce ? new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting) return;
  e.target.classList.remove('pre','pre-mask'); io.unobserve(e.target);
}),{rootMargin:'0px 0px -8% 0px'}) : null;
if(io){
  $$('[data-rv]').forEach((el,i)=>{ if(el.getBoundingClientRect().top>vh){el.classList.add('rv','pre'); io.observe(el);} });
  $$('[data-rv-mask]').forEach(el=>{ if(el.getBoundingClientRect().top>vh){el.classList.add('rv-mask','pre-mask'); io.observe(el);} });
}

/* parallax */
const para=$$('[data-parallax]');
const doPara=()=>{ if(reduce) return;
  para.forEach(img=>{const r=img.parentElement.getBoundingClientRect(); if(r.bottom<0||r.top>innerHeight) return;
    const k=parseFloat(img.dataset.parallax), c=(r.top+r.height/2-innerHeight/2);
    img.style.transform=`translate3d(0,${(-c*k).toFixed(1)}px,0) scale(1.18)`;});
};

/* rails */
const rails={};
$$('.rail').forEach(r=>{
  rails[r.id]=r;
  const visible=()=>[...r.children].filter(c=>!c.classList.contains('is-out'));
  const step=()=>{const c=visible()[0]; return c? c.getBoundingClientRect().width+20 : 300;};
  const update=()=>{
    const max=r.scrollWidth-r.clientWidth, p=max>0?r.scrollLeft/max:0;
    const bar=$(`[data-progress="${r.id}"]`); if(bar){const w=Math.min(1,r.clientWidth/r.scrollWidth);bar.style.width=(w*100)+'%';bar.style.transform=`translateX(${p*(1/w-1)*100}%)`;}
    const cnt=$(`[data-count="${r.id}"]`); if(cnt){const n=visible().length, i=Math.min(n,Math.round(r.scrollLeft/step())+1);cnt.textContent=String(i).padStart(2,'0')+' / '+String(n).padStart(2,'0');}
  };
  r.addEventListener('scroll',update,{passive:true}); addEventListener('resize',update); update(); r._update=update;
  $$(`[data-prev="${r.id}"]`).forEach(b=>b.onclick=()=>r.scrollBy({left:-step(),behavior:'smooth'}));
  $$(`[data-next="${r.id}"]`).forEach(b=>b.onclick=()=>r.scrollBy({left:step(),behavior:'smooth'}));
  /* mouse drag */
  let down=false,sx=0,sl=0,moved=false;
  r.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')return;down=true;moved=false;sx=e.clientX;sl=r.scrollLeft;});
  addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-sx;if(Math.abs(dx)>5){moved=true;r.classList.add('is-drag');}r.scrollLeft=sl-dx;});
  addEventListener('pointerup',()=>{if(!down)return;down=false;r.classList.remove('is-drag');
    if(moved){const s=step();r.scrollTo({left:Math.round(r.scrollLeft/s)*s,behavior:'smooth'});}});
});

/* season switch */
const pill=$('.season__pill');
const placePill=b=>{pill.style.width=b.offsetWidth+'px';pill.style.transform=`translateX(${b.offsetLeft-5}px)`;};
const sb=$$('[data-season]');
sb.forEach(b=>b.addEventListener('click',()=>{
  sb.forEach(x=>x.setAttribute('aria-pressed',x===b)); placePill(b);
  $$('#actRail .act').forEach(a=>{const on=a.dataset.s===b.dataset.season;a.classList.toggle('is-out',!on);a.classList.remove('is-in');if(on){void a.offsetWidth;a.classList.add('is-in');}});
  rails.actRail.scrollTo({left:0}); rails.actRail._update(); drawIce();
}));
requestAnimationFrame(()=>placePill(sb[0]));
addEventListener('resize',()=>placePill($('[data-season][aria-pressed="true"]')));

/* ice crack placeholders (canvas) */
function drawIce(){ $$('canvas[data-ice]').forEach(cv=>{
  const r=cv.getBoundingClientRect(); if(!r.width) return; const d=devicePixelRatio||1;
  cv.width=r.width*d; cv.height=r.height*d; const g=cv.getContext('2d'); g.scale(d,d);
  let seed=r.width*7+r.height; const rnd=()=>(seed=(seed*9301+49297)%233280)/233280;
  g.strokeStyle='rgba(225,240,243,.35)'; g.lineWidth=1;
  for(let k=0;k<7;k++){ let x=rnd()*r.width,y=rnd()*r.height; g.beginPath(); g.moveTo(x,y);
    for(let s=0;s<9;s++){ x+= (rnd()-.5)*r.width*.35; y+=(rnd()-.5)*r.height*.3; g.lineTo(x,y);
      if(rnd()>.6){ g.moveTo(x,y); g.lineTo(x+(rnd()-.5)*60,y+(rnd()-.5)*60); g.moveTo(x,y);} }
    g.stroke(); }
  g.fillStyle='rgba(238,243,242,.5)'; for(let k=0;k<40;k++){g.beginPath();g.arc(rnd()*r.width,rnd()*r.height,rnd()*1.4,0,7);g.fill();}
});}
drawIce(); addEventListener('resize',drawIce);

/* more places */
$('#morePlaces').addEventListener('click',e=>{const p=$('#places');const on=!p.classList.contains('is-all');p.classList.toggle('is-all',on);
  e.currentTarget.firstChild.textContent=on?'Свернуть ':'Больше природы ';});

/* modals */
let lastFocus=null;
const openModal=m=>{lastFocus=document.activeElement;m.hidden=false;document.documentElement.style.overflow='hidden';const x=$('.modal__x',m);x&&x.focus();};
const closeModal=m=>{m.hidden=true;if(!$$('.modal').some(x=>!x.hidden))document.documentElement.style.overflow='';lastFocus&&lastFocus.focus&&lastFocus.focus();};
$$('.modal').forEach(m=>$$('[data-close]',m).forEach(c=>c.addEventListener('click',()=>closeModal(m))));
addEventListener('keydown',e=>{if(e.key!=='Escape')return;const open=$$('.modal').filter(m=>!m.hidden).pop();if(open)closeModal(open);else if(menu.classList.contains('is-open'))setMenu(false);});

/* booking */
const bm=$('#bookModal');
document.addEventListener('click',e=>{const b=e.target.closest('[data-book]');if(!b)return;
  const rm=$('#roomModal'); if(!rm.hidden){const t=$('#rmTitle').textContent;const sel=$('#bk-room');[...sel.options].forEach(o=>o.selected=o.text===t);rm.hidden=true;}
  $('#bookOk').hidden=true;$('#bookForm').hidden=false;openModal(bm);});
$('#bookForm').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget;
  const bad=$$('[required]',f).filter(i=>!i.value.trim());$$('[required]',f).forEach(i=>i.style.borderBottomColor=bad.includes(i)?'var(--lotus)':'');
  if(bad.length){bad[0].focus();return;}f.hidden=true;$('#bookOk').hidden=false;});

/* rooms data */
const ROOMS={
  double:{t:'Стандарт',d:'Светлый номер для двоих с двуспальной кроватью и обеденным столом.',p:['room-double','room-bath','room-fridge','terrace','veranda-view'],l:['До 2 гостей','Двуспальная кровать','Душевая и санузел в номере','Холодильник, Wi‑Fi','Выход на веранду']},
  family:{t:'Семейный',d:'Кровать и раскладной диван, стол на четверых. Подходит для семьи с детьми.',p:['room-family','room-bath','room-kitchen','room-fridge','terrace'],l:['До 4 гостей','Двуспальная кровать и диван','Душевая и санузел в номере','Холодильник, ТВ, Wi‑Fi','Обеденная зона']},
  kitchen:{t:'С кухней',d:'Номер с кухонным уголком: микроволновка, чайник, посуда и шкаф для вещей.',p:['room-kitchen','room-double','room-bath','room-fridge','veranda-view'],l:['2–3 гостя','Кухонный уголок','Телевизор','Душевая и санузел','Холодильник, Wi‑Fi']},
  terrace:{t:'С террасой',d:'Отдельный вход и своя терраса со столиком, откуда видно степь и Байкал.',p:['terrace','veranda-view','room-double','room-bath','houses'],l:['До 2 гостей','Отдельный вход','Терраса со столом','Душевая и санузел','Wi‑Fi']}
};
const rmMain=$('#rmMain'), rmThumbs=$('#rmThumbs');
const showImg=(src)=>{rmMain.style.animation='none';void rmMain.offsetWidth;rmMain.style.animation='';rmMain.src='img/'+src+'.jpg';$$('button',rmThumbs).forEach(b=>b.setAttribute('aria-current',b.dataset.src===src));};
$$('[data-open-room]').forEach(b=>b.addEventListener('click',()=>{
  const r=ROOMS[b.dataset.openRoom];$('#rmTitle').textContent=r.t;$('#rmText').textContent=r.d;
  $('#rmList').innerHTML=r.l.map(x=>`<li>${x}</li>`).join('');
  rmThumbs.innerHTML=r.p.map(s=>`<button data-src="${s}" aria-label="Показать фото"><img src="img/${s}.jpg" alt=""></button>`).join('');
  $$('button',rmThumbs).forEach(t=>t.onclick=()=>showImg(t.dataset.src));
  rmMain.alt='Фото номера «'+r.t+'»'; showImg(r.p[0]); openModal($('#roomModal'));
}));
$$('.room .ph').forEach(ph=>{ph.style.cursor='pointer';ph.addEventListener('click',()=>$('[data-open-room]',ph.parentElement).click());});

/* lightbox */
$$('[data-lb]').forEach(b=>b.addEventListener('click',()=>{$('#lbImg').src=b.dataset.lb;openModal($('#lightbox'));}));

/* scroll loop */
let tick=false;
addEventListener('scroll',()=>{if(tick)return;tick=true;requestAnimationFrame(()=>{onScrollHdr();doPara();tick=false;});},{passive:true});
doPara();
})();
