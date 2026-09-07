/*
 * Runtime polish layer for CYBER-SKUF.
 * Keeps the base architecture intact while adding:
 * - fully synchronized daily modifiers;
 * - unique boss passives with HUD output;
 * - collapsible HUD for desktop and mobile.
 */
(() => {
    'use strict';

    const POLISH_VERSION = '1.0.5';

    const BOSS_EFFECTS = {
        1:{icon:'🏠',title:'Проверка квартиры',desc:'Атаки босса происходят на 8% чаще.',attackCooldownMult:.92},
        2:{icon:'💳',title:'Долговая петля',desc:'После сброса мысли есть +6% шанс получить дополнительный мусор.',extraGarbageChance:.06},
        3:{icon:'📋',title:'Сверхурочные',desc:'Восстановление Дыхалки снижено на 12%.',staminaRecoveryMult:.88},
        4:{icon:'💔',title:'Эмоциональные качели',desc:'Кулдаун сброса мыслей увеличен на 7%.',dropCooldownMult:1.07},
        5:{icon:'🍔',title:'Комбо-набор',desc:'Тапы по Скуфу расходуют на 15% больше Дыхалки.',tapStaminaMult:1.15},
        6:{icon:'🌧️',title:'Апатия',desc:'Пассивный доход снижен на 10%.',incomeMult:.90},
        7:{icon:'🎓',title:'Продажа воздуха',desc:'Босс получает на 8% меньше урона.',bossDamageTakenMult:.92},
        8:{icon:'🪙',title:'Рагпул',desc:'Пассивный доход снижен на 12%, но Хайп заряжается на 10% быстрее.',incomeMult:.88,feverChargeMult:1.10},
        9:{icon:'🎭',title:'Синдром сомнений',desc:'Босс получает на 10% меньше урона.',bossDamageTakenMult:.90},
        10:{icon:'🏦',title:'Проценты капают',desc:'После сброса мысли есть +7% шанс получить дополнительный мусор.',extraGarbageChance:.07},
        11:{icon:'🛵',title:'Курьер уже у двери',desc:'Атаки босса происходят на 10% чаще.',attackCooldownMult:.90},
        12:{icon:'🤖',title:'Автоматизация',desc:'Босс получает на 12% меньше урона, а сброс мыслей медленнее на 5%.',bossDamageTakenMult:.88,dropCooldownMult:1.05},
        13:{icon:'🔥',title:'Выгорание',desc:'Восстановление Дыхалки снижено на 25%.',staminaRecoveryMult:.75},
        14:{icon:'🎖️',title:'Внезапный визит',desc:'Атаки босса происходят на 16% чаще.',attackCooldownMult:.84},
        15:{icon:'🏍️',title:'Кризис среднего возраста',desc:'Тапы расходуют на 20% больше Дыхалки.',tapStaminaMult:1.20},
        16:{icon:'🗂️',title:'Бумажная волокита',desc:'Кулдаун сброса мыслей увеличен на 15%.',dropCooldownMult:1.15},
        17:{icon:'🛋️',title:'Чёрная дыра дивана',desc:'Дыхалка восстанавливается на 20% медленнее, тапы дороже на 10%.',staminaRecoveryMult:.80,tapStaminaMult:1.10},
        18:{icon:'⏳',title:'Тик-так',desc:'Атаки босса происходят на 20% чаще.',attackCooldownMult:.80},
        19:{icon:'☠️',title:'Последний порог',desc:'Босс получает на 15% меньше урона, +8% шанс дополнительного мусора.',bossDamageTakenMult:.85,extraGarbageChance:.08},
        20:{icon:'👑',title:'Судьба давит',desc:'Босс получает на 20% меньше урона, атакует на 22% чаще и чаще подкидывает мусор.',bossDamageTakenMult:.80,attackCooldownMult:.78,extraGarbageChance:.08}
    };

    function normalizeDailyModifiers(){
        if(typeof CONFIG==='undefined'||!CONFIG.DAILY_MODIFIERS)return;
        Object.assign(CONFIG.DAILY_MODIFIERS[0],{id:'sunday_beer',title:'Пивной Выходной',desc:'🍺 40% шанс дополнительного расходника после босса, заряд Хайпа +25%'});
        Object.assign(CONFIG.DAILY_MODIFIERS[1],{id:'monday_grind',title:'Тяжёлый Понедельник',desc:'💼 Награда за слияния x2, боссы атакуют на 25% чаще'});
        Object.assign(CONFIG.DAILY_MODIFIERS[2],{id:'tuesday_fever',title:'Крипто-Вторник',desc:'📈 Пассивный доход +50%, автосброс ускорен до 0.9с'});
        Object.assign(CONFIG.DAILY_MODIFIERS[3],{id:'wednesday_cat',title:'День Котика',desc:'🐾 Кулдаун кота 5с; если мусор есть, кот гарантированно убирает 1 штуку'});
        Object.assign(CONFIG.DAILY_MODIFIERS[4],{id:'thursday_clean',title:'Чистый Четверг',desc:'✨ Радиус очистки мусора от слияний увеличен на 50%'});
        Object.assign(CONFIG.DAILY_MODIFIERS[5],{id:'friday_hype',title:'Пятничный Хайп',desc:'🎉 Лихорадка / Fever длится в 2 раза дольше'});
        Object.assign(CONFIG.DAILY_MODIFIERS[6],{id:'saturday_chill',title:'Субботний Чилл',desc:'🎮 Тапы по Скуфу расходуют на 50% меньше Дыхалки'});
    }

    const getBossEffect=game=>BOSS_EFFECTS[Math.max(1,Math.min(20,Number(game?.currentBossIndex||game?.day||1)))]||BOSS_EFFECTS[1];

    function applyDerivedModifiers(game){
        if(!game)return;
        const e=getBossEffect(game);
        if(game.activeDailyMod?.id==='tuesday_fever')game.passiveIncome*=1.5;
        if(Number.isFinite(e.incomeMult))game.passiveIncome*=e.incomeMult;
        if(Number.isFinite(e.staminaRecoveryMult))game.staminaRecoveryRate*=e.staminaRecoveryMult;
        if(Number.isFinite(e.dropCooldownMult))game.baseDropCooldownMs=Math.max(140,Math.round((game.baseDropCooldownMs||380)*e.dropCooldownMult));
        game.updateDropCooldownFromState?.();
        game.hudDirty=true;
    }

    function spawnExtraGarbage(game,chance){
        if(!game?.physics||!chance||Math.random()>=chance)return;
        const list=CONFIG.GARBAGE_TYPES||[]; if(!list.length)return;
        const bounds=game.physics.getCupBounds();
        const garbage=list[Math.floor(Math.random()*list.length)];
        const x=bounds.leftX+32+Math.random()*Math.max(1,bounds.width-64);
        game.physics.createGarbage(x,game.dropY,garbage);
        game.spawnFloatingText?.(x,game.roomHeight+38,`⚠️ ${garbage.name}`,garbage.hazardColor||'#f59e0b');
    }

    function renderBossEffect(game,boss=null){
        const bossBar=document.getElementById('boss-bar'); if(!bossBar)return;
        let row=document.getElementById('boss-effect-row');
        if(!row){
            row=document.createElement('div'); row.id='boss-effect-row'; row.className='boss-effect-row';
            row.innerHTML='<span class="boss-effect-label">ЭФФЕКТ БОССА</span><span id="boss-effect-badge" class="boss-effect-badge"></span>';
            const daily=bossBar.querySelector('.mission-effect-row'), info=bossBar.querySelector('.boss-info');
            if(daily?.nextSibling)bossBar.insertBefore(row,daily.nextSibling); else if(info)bossBar.insertBefore(row,info); else bossBar.appendChild(row);
        }
        const isBreak=boss&&/ПЕРЕДЫШКА/i.test(String(boss.name||boss.title||''));
        row.classList.toggle('hidden',!!isBreak); if(isBreak)return;
        const e=getBossEffect(game), badge=document.getElementById('boss-effect-badge'); if(!badge)return;
        badge.textContent=`${e.icon} ${e.title}`; badge.title=e.desc; badge.dataset.desc=e.desc;
    }

    function patchGame(game){
        if(!game||game.__polishPatched)return; game.__polishPatched=true;
        game.initDailyModifier?.(); game.ui?.updateDailyModifier?.(game.activeDailyMod);

        const recalc=game.recalculatePassives.bind(game);
        game.recalculatePassives=function(...a){const r=recalc(...a);applyDerivedModifiers(this);return r;};

        const damage=game.dealBossDamage.bind(game);
        game.dealBossDamage=function(amount,...rest){
            if(this.bossBreakTimer>0)return damage(amount,...rest);
            const e=getBossEffect(this),m=this.__polishBypassBossResistance?1:(Number.isFinite(e.bossDamageTakenMult)?e.bossDamageTakenMult:1);
            return damage(Math.max(0,Number(amount||0)*m),...rest);
        };

        const bossNuke=game.applyBossNuke?.bind(game);
        if(bossNuke)game.applyBossNuke=function(...a){this.__polishBypassBossResistance=true;try{return bossNuke(...a);}finally{this.__polishBypassBossResistance=false;}};
        const boost=game.applyBoost?.bind(game);
        if(boost)game.applyBoost=function(type,...a){const bypass=type==='nuke';if(bypass)this.__polishBypassBossResistance=true;try{return boost(type,...a);}finally{if(bypass)this.__polishBypassBossResistance=false;}};

        const attack=game.executeBossAttack.bind(game);
        game.executeBossAttack=function(...a){const r=attack(...a),e=getBossEffect(this);if(Number.isFinite(e.attackCooldownMult))this.bossAttackTimer=Math.max(4.5,this.bossAttackTimer*e.attackCooldownMult);return r;};
        const garbage=game.checkGarbageSpawn.bind(game);
        game.checkGarbageSpawn=function(...a){const r=garbage(...a);spawnExtraGarbage(this,getBossEffect(this).extraGarbageChance||0);return r;};
        const tap=game.handleSkufTap.bind(game);
        game.handleSkufTap=function(...a){
            const before=this.stamina,r=tap(...a),spent=Math.max(0,before-this.stamina);
            if(spent>0){let m=getBossEffect(this).tapStaminaMult||1;if(this.activeDailyMod?.id==='saturday_chill')m*=.5;this.stamina=Math.max(0,Math.min(this.maxStamina,this.stamina-(spent*m-spent)));if(this.stamina>0)this.isExhausted=false;this.ui?.updateStamina?.(this.stamina,this.maxStamina,this.isExhausted);} return r;
        };
        const fever=game.triggerFeverMode.bind(game);
        game.triggerFeverMode=function(d=null,...a){if(this.activeDailyMod?.id==='friday_hype')d=(d??this.feverDuration??10)*2;return fever(d,...a);};
        const charge=game.addFeverCharge?.bind(game);
        if(charge)game.addFeverCharge=function(amount,...a){let m=this.activeDailyMod?.id==='sunday_beer'?1.25:1;m*=getBossEffect(this).feverChargeMult||1;return charge(Number(amount||0)*m,...a);};
        const defeated=game.onBossDefeated.bind(game);
        game.onBossDefeated=function(...a){const r=defeated(...a);if(this.activeDailyMod?.id==='sunday_beer'&&Math.random()<.40){const pool=['beer','script','energy','bomb','magnet'],item=pool[Math.floor(Math.random()*pool.length)];this.items[item]=(this.items[item]||0)+1;this.ui?.updateConsumables?.(this.items);this.spawnFloatingText?.(this.canvas.width/2,this.roomHeight+68,'🍺 ВЫХОДНОЙ: +1 РАСХОДНИК!','#facc15');this.saveGame?.();}return r;};
        const advance=game.advanceDay.bind(game);
        game.advanceDay=function(...a){const r=advance(...a);this.recalculatePassives();renderBossEffect(this,CONFIG.BOSSES[this.currentBossIndex]);return r;};

        for(const methodName of ['restart','resetGame','triggerPrestige']){
            const original=game[methodName]?.bind(game); if(!original)continue;
            game[methodName]=function(...a){const r=original(...a);this.recalculatePassives?.();this.ui?.updateDailyModifier?.(this.activeDailyMod);renderBossEffect(this,CONFIG.BOSSES[this.currentBossIndex]);return r;};
        }

        if(game.ui&&!game.ui.__bossEffectPatched){
            game.ui.__bossEffectPatched=true; const update=game.ui.updateBoss.bind(game.ui);
            game.ui.updateBoss=(...a)=>{const r=update(...a);renderBossEffect(game,a[0]);return r;};
        }
        game.recalculatePassives(); renderBossEffect(game,CONFIG.BOSSES[game.currentBossIndex]); game.ui?.updateDailyModifier?.(game.activeDailyMod);
        console.info(`[POLISH ${POLISH_VERSION}] Daily modifiers and boss passives enabled`);
    }

    function injectStyles(){
        if(document.getElementById('skuf-polish-styles'))return;
        const s=document.createElement('style');s.id='skuf-polish-styles';s.textContent=`
        .boss-effect-row{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:start;gap:5px;width:100%;margin:0 0 5px}.boss-effect-row.hidden{display:none!important}.boss-effect-label{padding:2px 5px;border-radius:6px;border:1px solid rgba(244,63,94,.30);background:rgba(244,63,94,.09);color:#fda4af;font-size:8px;font-weight:900;line-height:1.25;letter-spacing:.35px;white-space:nowrap}.boss-effect-badge{display:block;min-width:0;padding:2px 6px;border:1px solid rgba(244,63,94,.24);border-radius:6px;background:rgba(73,16,33,.24);color:#fecdd3;font-size:8.5px;font-weight:800;line-height:1.25;white-space:normal;overflow:hidden;cursor:help}.boss-effect-badge::after{content:" — " attr(data-desc);color:#aeb9cc;font-weight:600}
        #btn-collapse-hud{position:absolute;z-index:85;width:28px;height:42px;padding:0;border:1px solid rgba(0,229,255,.30);border-radius:0 10px 10px 0;background:rgba(5,9,18,.90);color:#67e8f9;font-size:18px;font-weight:900;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 0 14px rgba(0,229,255,.12);backdrop-filter:blur(8px);transition:left .22s ease,top .22s ease,transform .12s ease,background .12s ease;touch-action:manipulation}#btn-collapse-hud:hover{background:rgba(0,229,255,.10);border-color:rgba(0,229,255,.55)}
        @media (orientation:landscape) and (min-width:520px),(min-aspect-ratio:1.15/1) and (min-width:520px){#app-viewport{transition:grid-template-columns .22s ease}#app-viewport.hud-collapsed{grid-template-columns:0 minmax(0,1fr)!important}#app-viewport.hud-collapsed #status-bar,#app-viewport.hud-collapsed #boss-bar,#app-viewport.hud-collapsed #relics-bar,#app-viewport.hud-collapsed #consumables-bar,#app-viewport.hud-collapsed #desktop-sidebar,#app-viewport.hud-collapsed #action-panel{display:none!important}#app-viewport.hud-collapsed #canvas-wrapper{grid-column:1/-1!important;grid-row:1/-1!important;width:100%!important;height:100%!important}}
        @media (max-width:519px),(orientation:portrait) and (max-aspect-ratio:1.149/1){#btn-collapse-hud{width:46px;height:24px;border-radius:0 0 10px 10px;font-size:15px}#app-viewport.hud-collapsed #status-bar,#app-viewport.hud-collapsed #boss-bar,#app-viewport.hud-collapsed #relics-bar,#app-viewport.hud-collapsed #consumables-bar{display:none!important}#app-viewport.hud-collapsed #action-panel{display:block!important;flex-shrink:0}#app-viewport.hud-collapsed #canvas-wrapper{flex:1 1 auto!important;width:100%!important;height:100%!important;min-height:0!important}.boss-effect-badge::after,#daily-mod-badge.daily-mod-tag::after{display:none}.boss-effect-row,.mission-effect-row{grid-template-columns:auto minmax(0,1fr)}.boss-effect-badge,#daily-mod-badge.daily-mod-tag{white-space:nowrap!important;text-overflow:ellipsis!important}}
        `;document.head.appendChild(s);
    }

    const desktop=()=>window.matchMedia('(orientation: landscape) and (min-width: 520px), (min-aspect-ratio: 1.15/1) and (min-width: 520px)').matches;
    function initHudCollapse(){
        const app=document.getElementById('app-viewport');if(!app||document.getElementById('btn-collapse-hud'))return;
        const b=document.createElement('button');b.id='btn-collapse-hud';b.type='button';app.appendChild(b);
        const key=()=>desktop()?'skuf_hud_collapsed_desktop_v1':'skuf_hud_collapsed_mobile_v1';
        const stored=()=>{try{return localStorage.getItem(key())==='true'}catch{return false}};
        const save=v=>{try{localStorage.setItem(key(),String(v))}catch{}};
        const place=()=>{
            const c=app.classList.contains('hud-collapsed'),ar=app.getBoundingClientRect();
            if(desktop()){
                const r=document.getElementById('status-bar')?.getBoundingClientRect(),w=r&&r.width>0?r.width:300;
                b.style.left=c?'0px':`${Math.max(0,w-1)}px`;b.style.top='50%';b.style.right='auto';b.style.transform='translateY(-50%)';b.style.borderRadius='0 10px 10px 0';b.textContent=c?'›':'‹';b.title=c?'Развернуть левую панель':'Свернуть левую панель';
            }else{
                let top=4;if(!c)for(const id of ['relics-bar','boss-bar','status-bar']){const el=document.getElementById(id);if(!el||getComputedStyle(el).display==='none')continue;const r=el.getBoundingClientRect();if(r.height>0){top=Math.max(4,r.bottom-ar.top-12);break;}}
                b.style.left='50%';b.style.top=`${c?0:top}px`;b.style.right='auto';b.style.transform='translateX(-50%)';b.style.borderRadius='0 0 10px 10px';b.textContent=c?'⌄':'⌃';b.title=c?'Развернуть верхнюю панель':'Свернуть верхнюю панель';
            }
            b.setAttribute('aria-expanded',String(!c));b.setAttribute('aria-label',b.title);
        };
        const apply=c=>{app.classList.toggle('hud-collapsed',c);save(c);place();const resize=()=>window.gameInstance?.resizeCanvas?.();requestAnimationFrame(resize);setTimeout(resize,40);setTimeout(resize,240)};
        b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();apply(!app.classList.contains('hud-collapsed'))});
        let wasDesktop=desktop();apply(stored());
        window.addEventListener('resize',()=>{const d=desktop();if(d!==wasDesktop){wasDesktop=d;app.classList.toggle('hud-collapsed',stored())}place();window.gameInstance?.resizeCanvas?.()},{passive:true});
    }

    function waitForGame(){let n=0;const t=setInterval(()=>{n++;if(window.gameInstance){clearInterval(t);patchGame(window.gameInstance)}else if(n>240){clearInterval(t);console.warn('[POLISH] gameInstance was not created in time')}},50)}
    normalizeDailyModifiers();injectStyles();
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{initHudCollapse();waitForGame()});else{initHudCollapse();waitForGame()}
})();
