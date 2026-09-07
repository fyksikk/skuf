/*
 * CYBER-SKUF — gameplay-first HUD v1.5
 * Compact presentation layer. Core game/UI logic stays in ui.js/game.js/polish.js.
 */
(() => {
'use strict';

const VERSION='1.5.0';
const app=()=>document.getElementById('app-viewport');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function styles(){
  document.getElementById('skuf-ui-focus-styles')?.remove();
  const s=document.createElement('style');
  s.id='skuf-ui-focus-styles';
  s.textContent=`
  #app-viewport.ui-focus .hud-nav-bar{display:none!important}
  #app-viewport.ui-focus #status-bar{gap:4px;padding-top:6px;padding-bottom:6px}
  #app-viewport.ui-focus .hud-top-row{min-height:34px;gap:7px}
  #app-viewport.ui-focus #motivation-counter{font-size:14px;line-height:1;white-space:nowrap}
  #app-viewport.ui-focus .stamina-box{gap:2px}
  #app-viewport.ui-focus .stamina-label-row{min-height:10px;line-height:1}
  #app-viewport.ui-focus .stamina-label-row .label{font-size:7.5px;opacity:.72}
  #app-viewport.ui-focus #stamina-track{height:5px}
  #app-viewport.ui-focus .hud-quick-actions{gap:4px;flex-shrink:0}
  #app-viewport.ui-focus .hud-quick-actions .hud-mini-btn,#btn-open-hub-menu{
    width:30px;min-width:30px;height:30px;padding:0;border-radius:9px
  }
  #app-viewport.ui-focus .hud-quick-actions .hud-btn-caption{display:none!important}
  #app-viewport.ui-focus .hud-quick-actions .hud-mini-btn,
  #app-viewport.ui-focus .boost-btn-glow,
  #app-viewport.ui-focus .roulette-btn-glow{
    background:rgba(255,255,255,.05)!important;border-color:rgba(255,255,255,.1)!important;box-shadow:none!important
  }
  #app-viewport.ui-focus .roulette-btn-glow .hud-badge-gold{
    min-width:8px;width:8px;height:8px;padding:0;border-radius:50%;font-size:0;right:-2px;top:-2px
  }
  #btn-open-hub-menu{
    position:relative;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);
    color:#dbe5f3;display:inline-flex;align-items:center;justify-content:center;font:900 16px/1 inherit;cursor:pointer
  }

  /* DESKTOP: number is self-explanatory again + passive income is visible. */
  @media (orientation:landscape) and (min-width:520px),(min-aspect-ratio:1.15/1) and (min-width:520px){
    #app-viewport.ui-focus .motivation-box{
      display:grid;grid-template-columns:auto 1fr;grid-template-areas:"l l" "v p";
      align-items:baseline;column-gap:7px;row-gap:3px;min-width:0
    }
    #app-viewport.ui-focus .motivation-box .label{
      display:block!important;grid-area:l;width:max-content;font-size:7.5px;line-height:1;color:#7dd3fc;opacity:.85
    }
    #app-viewport.ui-focus #motivation-counter{grid-area:v;font-size:15px}
    #app-viewport.ui-focus #passive-counter{
      display:block!important;grid-area:p;margin:0;color:#86efac;font-size:8.5px;font-weight:800;line-height:1;white-space:nowrap
    }
    #app-viewport.ui-focus:not(.hud-collapsed){
      --skuf-focus-sidebar:clamp(245px,22vw,270px);
      grid-template-columns:var(--skuf-focus-sidebar) minmax(0,1fr)!important
    }
    #app-viewport.ui-focus:not(.hud-collapsed) #btn-collapse-hud{left:calc(var(--skuf-focus-sidebar) - 1px)!important}
    #app-viewport.ui-focus.hud-collapsed #btn-collapse-hud{left:0!important}
    #app-viewport.ui-focus #desktop-sidebar{gap:5px;padding:6px 8px;overflow:hidden}
    #app-viewport.ui-focus #desktop-sidebar .profile-section,
    #app-viewport.ui-focus #desktop-sidebar .metrics-section,
    #app-viewport.ui-focus #desktop-sidebar .actions-section{display:none!important}
    #app-viewport.ui-focus #desktop-sidebar .evo-section{padding:6px 7px;margin:0}
    #app-viewport.ui-focus #desktop-sidebar .evo-icons-row{gap:3px;margin-top:3px}
    #app-viewport.ui-focus #desktop-sidebar .evo-ball-chip{border-radius:7px;padding:2px}
    #app-viewport.ui-focus #desktop-sidebar .evo-chip-tier{font-size:7px}

    /* Five controls no longer fight for one 260px row. */
    #app-viewport.ui-focus .action-buttons-group{
      display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr));gap:4px!important
    }
    #app-viewport.ui-focus #btn-brain-shake,#app-viewport.ui-focus #btn-toggle-autodrop{grid-column:span 3;min-width:0}
    #app-viewport.ui-focus #btn-tilt-left,#app-viewport.ui-focus #btn-tilt-right,#app-viewport.ui-focus #btn-toggle-gyro{
      grid-column:span 2;min-width:0
    }
    #app-viewport.ui-focus #action-panel{padding:5px 7px}
  }

  @media (max-width:519px),(orientation:portrait) and (max-aspect-ratio:1.149/1){
    #app-viewport.ui-focus #status-bar{padding:5px 7px;gap:3px}
    #app-viewport.ui-focus .motivation-box .label,#app-viewport.ui-focus #passive-counter{display:none!important}
    #app-viewport.ui-focus #motivation-counter{font-size:13px}
    #app-viewport.ui-focus .action-buttons-group{
      display:grid!important;grid-template-columns:minmax(0,1.16fr) minmax(0,1.22fr) 37px 37px 37px;
      gap:4px!important;width:100%
    }
    #app-viewport.ui-focus .action-btn{min-width:0!important;width:100%!important;padding-left:5px!important;padding-right:5px!important}
    #app-viewport.ui-focus #btn-brain-shake,#app-viewport.ui-focus #btn-toggle-autodrop{font-size:9px!important}
    #app-viewport.ui-focus #btn-tilt-left,#app-viewport.ui-focus #btn-tilt-right,#app-viewport.ui-focus #btn-toggle-gyro{
      padding:0!important;font-size:16px!important
    }
  }

  /* MENU: 2 equal columns. No "Ли..." and no lonely reset card. */
  #hub-menu-popover{
    position:absolute;z-index:125;width:min(300px,calc(100% - 16px));padding:9px;
    border:1px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(6,10,20,.97);
    box-shadow:0 18px 42px rgba(0,0,0,.48);backdrop-filter:blur(14px);
    opacity:0;transform:translateY(-5px) scale(.985);pointer-events:none;transition:.14s
  }
  #hub-menu-popover.open{opacity:1;transform:none;pointer-events:auto}
  .hub-menu-head{display:flex;align-items:center;justify-content:space-between;padding:0 2px 7px;color:#94a3b8;font-size:9px;font-weight:900}
  .hub-menu-close{width:26px;height:26px;padding:0;border:0;border-radius:8px;background:transparent;color:#94a3b8;cursor:pointer}
  .hub-menu-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
  #hub-menu-popover .hub-menu-item{
    min-width:0;width:100%;min-height:42px;padding:7px 9px;border:1px solid rgba(255,255,255,.075);
    border-radius:10px;background:rgba(255,255,255,.038);color:#dbe5f3;display:flex!important;
    flex-direction:row;align-items:center;justify-content:flex-start;gap:7px;box-shadow:none!important;overflow:hidden
  }
  #hub-menu-popover .hub-menu-item.menu-danger{grid-column:1/-1;color:#fca5a5;border-color:rgba(239,68,68,.16);background:rgba(127,29,29,.1)}
  .hub-menu-icon{flex:0 0 auto;font-size:16px}
  .hub-menu-label{min-width:0;font-size:10px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

  /* ROOM SETTINGS */
  .room-quick-settings.ui-settings-group{display:flex;align-items:center;gap:3px;padding:3px;border-radius:10px;background:rgba(5,9,18,.64)}
  .room-quick-settings.settings-collapsed .room-quick-btn:not(.room-settings-toggle){display:none!important}
  .room-settings-toggle{order:-1}
  .room-quick-settings.ui-settings-group .room-quick-btn{width:28px;min-width:28px;height:28px;padding:0;border-radius:7px;font-size:13px}

  /* BOSS HUD */
  #app-viewport.ui-focus #boss-bar{padding-top:4px;padding-bottom:4px}
  #app-viewport.ui-focus .mission-top-row{margin-bottom:2px}
  #app-viewport.ui-focus .crisis-tag{max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #app-viewport.ui-focus .effect-chip-strip{display:flex!important;align-items:center;gap:4px;margin-bottom:4px;min-width:0}
  #app-viewport.ui-focus #daily-mod-badge.daily-mod-tag,#app-viewport.ui-focus .boss-effect-badge{
    flex:1 1 0;min-width:0;height:21px;padding:0 6px;border-radius:6px;display:flex;align-items:center;
    white-space:nowrap!important;overflow:hidden;text-overflow:ellipsis;font-size:8px;line-height:1
  }
  #app-viewport.ui-focus .boss-info{margin-bottom:2px;gap:4px}
  #app-viewport.ui-focus #boss-hp-text{font-size:8.5px;white-space:nowrap}
  #app-viewport.ui-focus #boss-day-tag,#app-viewport.ui-focus #boss-quote-bubble,
  #app-viewport.ui-focus .quote-strip,#app-viewport.ui-focus .skuf-status-desc{display:none!important}
  #btn-toggle-boss-assist{
    width:24px;min-width:24px;height:24px;padding:0;border:1px solid rgba(255,255,255,.075);border-radius:7px;
    background:rgba(255,255,255,.03);color:#94a3b8;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center
  }
  #boss-tactical-assist.focus-collapsed{display:none!important}
  #boss-tactical-assist.focus-expanded{display:flex!important;margin-top:4px}

  #app-viewport.ui-focus #fever-bar{
    left:50%!important;right:auto!important;width:min(300px,48%)!important;height:10px!important;
    transform:translateX(-50%);top:6px!important;opacity:.86
  }

  /* COLLAPSED MINI HUD: include passive income too. */
  #compact-play-hud{
    position:absolute;z-index:68;top:7px;left:50%;transform:translateX(-50%);display:none;align-items:center;gap:6px;
    width:min(470px,calc(100% - 124px));min-height:30px;padding:5px 9px 7px;border:1px solid rgba(255,255,255,.08);
    border-radius:10px;background:rgba(5,9,18,.74);backdrop-filter:blur(8px);pointer-events:none
  }
  #app-viewport.hud-collapsed #compact-play-hud{display:flex}
  .compact-play-stat{min-width:0;color:#e2e8f0;font-size:9px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .compact-play-stat.score{color:#facc15}.compact-play-stat.passive{color:#86efac}.compact-play-stat.timer{margin-left:auto}
  .compact-play-bars{position:absolute;left:9px;right:9px;bottom:2px;display:grid;grid-template-columns:1fr 1fr;gap:4px;height:2px}
  .compact-play-track{overflow:hidden;border-radius:999px;background:rgba(255,255,255,.08)}
  .compact-play-fill{width:100%;height:100%;border-radius:inherit;transition:width .15s linear}
  #compact-play-stamina-fill{background:#19d3c5}#compact-play-boss-fill{background:#ff4d6d}
  @media(max-width:430px){#compact-play-hud{width:min(330px,calc(100% - 78px));gap:4px}.compact-play-stat{font-size:8px}.compact-play-stat.passive{display:none}}

  /* ROULETTE: fewer words and less dead space. */
  #app-viewport.ui-focus .roulette-modal{width:min(340px,calc(100% - 16px));padding:12px}
  #app-viewport.ui-focus .roulette-modal>p{display:none!important}
  #app-viewport.ui-focus .roulette-modal .wheel-container{margin:5px auto 7px}
  #app-viewport.ui-focus #roulette-canvas{width:min(232px,72vw)!important;height:auto!important;max-width:100%}
  #app-viewport.ui-focus .roulette-prize-banner{min-height:24px;margin:5px 0 7px;padding:4px 6px;font-size:10px;line-height:1.2}
  #app-viewport.ui-focus #btn-spin-wheel,#app-viewport.ui-focus #btn-spin-wheel-ad{
    min-height:44px;padding:8px 10px!important;border-radius:12px;font-size:11.5px!important;line-height:1.15;white-space:normal
  }

  #app-viewport.ui-focus .modal-box{border-radius:16px;border-color:rgba(255,255,255,.1);box-shadow:0 24px 60px rgba(0,0,0,.5)}
  #app-viewport.ui-focus .upg-desc,#app-viewport.ui-focus .quest-desc,#app-viewport.ui-focus .boost-desc{
    display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden
  }
  `;
  document.head.appendChild(s);
}

function menu(){
  const A=app(),quick=document.querySelector('.hud-quick-actions');
  if(!A||!quick||document.getElementById('btn-open-hub-menu'))return;

  const open=document.createElement('button');
  open.id='btn-open-hub-menu';open.type='button';open.textContent='☰';open.title='Меню';open.setAttribute('aria-label','Открыть меню');
  quick.appendChild(open);

  const pop=document.createElement('div');
  pop.id='hub-menu-popover';
  pop.innerHTML='<div class="hub-menu-head"><span>МЕНЮ</span><button type="button" class="hub-menu-close">✕</button></div><div class="hub-menu-grid"></div>';
  A.appendChild(pop);
  const grid=pop.querySelector('.hub-menu-grid');

  [
    ['btn-open-shop','🛠️','Прокачка'],['btn-open-quests','📋','Квесты'],['btn-open-prestige','🌀','Сансара'],
    ['btn-open-stats','📊','Статистика'],['btn-open-leaderboard','🏆','Лидерборд'],['btn-side-guide','📖','Правила'],
    ['btn-reset-game','🗑️','Сброс']
  ].forEach(([id,icon,label])=>{
    const b=document.getElementById(id);if(!b)return;
    b.classList.add('hub-menu-item');
    if(id==='btn-reset-game')b.classList.add('menu-danger');
    b.innerHTML=`<span class="hub-menu-icon">${icon}</span><span class="hub-menu-label">${label}</span>`;
    b.title=label;b.setAttribute('aria-label',label);grid.appendChild(b);
  });

  const place=()=>{
    const ar=A.getBoundingClientRect(),br=open.getBoundingClientRect(),w=Math.min(300,Math.max(230,ar.width-16));
    pop.style.width=w+'px';
    pop.style.left=clamp(br.right-ar.left-w,6,Math.max(6,ar.width-w-6))+'px';
    pop.style.top=clamp(br.bottom-ar.top+6,6,Math.max(6,ar.height-Math.max(170,pop.offsetHeight)-6))+'px';
  };
  const close=()=>{pop.classList.remove('open');open.classList.remove('active')};
  open.onclick=e=>{e.stopPropagation();if(pop.classList.contains('open'))close();else{place();pop.classList.add('open');open.classList.add('active')}};
  pop.querySelector('.hub-menu-close').onclick=close;
  grid.onclick=e=>{if(e.target.closest('.hub-menu-item'))close()};
  document.addEventListener('pointerdown',e=>{if(pop.classList.contains('open')&&!pop.contains(e.target)&&!open.contains(e.target))close()},{passive:true});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  window.addEventListener('resize',()=>{if(pop.classList.contains('open'))place()},{passive:true});
}

function settings(){
  const g=document.querySelector('.room-quick-settings');
  if(!g||document.getElementById('btn-room-settings-toggle'))return;
  g.classList.add('ui-settings-group','settings-collapsed');
  const b=document.createElement('button');
  b.id='btn-room-settings-toggle';b.type='button';b.className='room-quick-btn room-settings-toggle';b.textContent='⚙️';b.title='Звук и эффекты';
  g.prepend(b);
  let t;
  const set=o=>{g.classList.toggle('settings-collapsed',!o);b.textContent=o?'✕':'⚙️';clearTimeout(t);if(o)t=setTimeout(()=>set(false),7000)};
  b.onclick=e=>{e.stopPropagation();set(g.classList.contains('settings-collapsed'))};
  document.addEventListener('pointerdown',e=>{if(!g.classList.contains('settings-collapsed')&&!g.contains(e.target))set(false)},{passive:true});
}

function bossBadge(){
  const bar=document.getElementById('boss-bar');if(!bar)return;
  let strip=document.getElementById('effect-chip-strip');
  if(!strip){
    strip=document.createElement('div');strip.id='effect-chip-strip';strip.className='effect-chip-strip';
    const top=bar.querySelector('.mission-top-row'),info=bar.querySelector('.boss-info');
    if(top?.nextSibling)bar.insertBefore(strip,top.nextSibling);else if(info)bar.insertBefore(strip,info);else bar.prepend(strip);
  }
  const daily=document.getElementById('daily-mod-badge');if(daily&&daily.parentElement!==strip)strip.appendChild(daily);
  let b=document.getElementById('boss-effect-badge');
  if(!b){
    /* Attached placeholder fixes polish.js lazy-badge bug; its next render fills it. */
    b=document.createElement('button');b.id='boss-effect-badge';b.type='button';b.className='boss-effect-badge';
    b.textContent='👹 Эффект босса';b.title='Эффект текущего босса';strip.appendChild(b);
    b.onclick=()=>{
      const txt=b.title;if(!txt)return;
      let toast=document.getElementById('polish-hud-toast');
      if(!toast){toast=document.createElement('div');toast.id='polish-hud-toast';toast.className='polish-hud-toast';app()?.appendChild(toast)}
      if(toast){toast.textContent=`${b.textContent}: ${txt}`;toast.classList.add('visible');clearTimeout(b._t);b._t=setTimeout(()=>toast.classList.remove('visible'),2800)}
    };
  }else if(b.parentElement!==strip)strip.appendChild(b);
}

function bossAssist(){
  const tactical=document.getElementById('boss-tactical-assist');
  if(!tactical||document.getElementById('btn-toggle-boss-assist'))return;
  const b=document.createElement('button');b.id='btn-toggle-boss-assist';b.type='button';b.textContent='🎬';b.title='Помощь за рекламу';
  (document.querySelector('#boss-bar .boss-info')||tactical.parentNode).appendChild(b);
  tactical.classList.add('focus-collapsed');
  const set=o=>{tactical.classList.toggle('focus-collapsed',!o);tactical.classList.toggle('focus-expanded',o);b.classList.toggle('open',o)};
  b.onclick=()=>set(!tactical.classList.contains('focus-expanded'));
  tactical.addEventListener('click',e=>{if(e.target.closest('button'))setTimeout(()=>set(false),120)});
}

function controls(){
  const l=document.querySelector('#btn-tilt-left .action-icon'),r=document.querySelector('#btn-tilt-right .action-icon');
  if(l)l.textContent='←';if(r)r.textContent='→';
}

function compact(){
  const A=app(),wrap=document.getElementById('canvas-wrapper');
  if(!A||!wrap||document.getElementById('compact-play-hud'))return;
  const h=document.createElement('div');h.id='compact-play-hud';
  h.innerHTML=`<span id="compact-play-score" class="compact-play-stat score">💎 0</span>
  <span id="compact-play-passive" class="compact-play-stat passive">+0/с</span>
  <span id="compact-play-boss" class="compact-play-stat">👹 100%</span>
  <span id="compact-play-timer" class="compact-play-stat timer">⏳ 00:00</span>
  <span class="compact-play-bars"><span class="compact-play-track"><span id="compact-play-stamina-fill" class="compact-play-fill"></span></span>
  <span class="compact-play-track"><span id="compact-play-boss-fill" class="compact-play-fill"></span></span></span>`;
  wrap.appendChild(h);
  const update=()=>{
    if(!A.classList.contains('hud-collapsed'))return;
    const m=document.getElementById('motivation-counter')?.textContent?.trim();
    if(m)document.getElementById('compact-play-score').textContent='💎 '+m.replace(/^💎\s*/,'');
    document.getElementById('compact-play-passive').textContent=document.getElementById('passive-counter')?.textContent?.trim()||'+0/с';
    const bw=document.getElementById('boss-hp-fill')?.style.width||'100%',bi=document.getElementById('boss-icon')?.textContent?.trim()||'👹';
    document.getElementById('compact-play-boss').textContent=`${bi} ${bw}`;
    const tm=document.getElementById('rent-timer-display')?.textContent?.trim();if(tm)document.getElementById('compact-play-timer').textContent=tm;
    document.getElementById('compact-play-stamina-fill').style.width=document.getElementById('stamina-bar')?.style.width||'100%';
    document.getElementById('compact-play-boss-fill').style.width=bw;
  };
  setInterval(update,300);
  new MutationObserver(update).observe(A,{attributes:true,attributeFilter:['class']});
}

function roulette(){
  const b=document.getElementById('btn-spin-wheel');if(!b)return;
  let lock=false;
  const fix=()=>{
    if(lock)return;
    const t=b.textContent?.trim()||'';
    const f=t.match(/КРУТИТЬ БЕСПЛАТНО!?\s*\(Осталось:\s*(\d+)\)/i),w=t.match(/Ожидание:\s*(\d+)с/i);
    let n=t;
    if(f){n=`КРУТИТЬ • БЕСПЛАТНО ×${f[1]}`;b.title=`Бесплатных вращений: ${f[1]}`}
    else if(w){n=`СПИН ЧЕРЕЗ ${w[1]}с`;b.title='Или победите босса'}
    if(n!==t){lock=true;b.textContent=n;lock=false}
  };
  new MutationObserver(fix).observe(b,{childList:true,characterData:true,subtree:true});fix();
}

function boot(){
  const A=app();if(!A||A.dataset.uiFocusV15)return;
  A.dataset.uiFocusV15='1';A.classList.add('ui-focus');
  menu();settings();bossBadge();bossAssist();controls();compact();roulette();
  setTimeout(bossBadge,80);setTimeout(bossBadge,250);
  console.info(`[UI FOCUS ${VERSION}] enabled`);
}
styles();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
