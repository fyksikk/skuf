/*
 * Final 12+ content pass.
 * Keeps internal ids (beer/brewery/relic_beer_shield) for save compatibility,
 * while replacing all player-facing alcohol references with neutral soft-drink content.
 */
(() => {
    'use strict';

    const CONTENT_VERSION = '12plus-1.0.2';

    function cleanText(value) {
        if (typeof value !== 'string' || !value) return value;
        return value
            .replace(/АЛКО-ДЕМОН/gi, 'БОСС')
            .replace(/Алкоголь и Фастфуд/gi, 'Фастфуд и Сладкое')
            .replace(/Ещё баночку и пиццу/gi, 'Ещё газировку и пиццу')
            .replace(/Мини-пивоварня/gi, 'Станция лимонада')
            .replace(/пивном ларьке/gi, 'магазине у дома')
            .replace(/Пивной Выходной/gi, 'Лимонадный Выходной')
            .replace(/Пивной щит/gi, 'Лимонадный щит')
            .replace(/Пивоварня/gi, 'Станция напитков')
            .replace(/Балтики/gi, 'Лимонада')
            .replace(/Балтика/gi, 'Лимонад')
            .replace(/\bпиво\b/gi, 'лимонад')
            .replace(/\bbeer\b/gi, 'Лимонад')
            .replace(/Похмелье/gi, 'Усталость')
            .replace(/🍺/g, '🥤');
    }

    function patchConfig() {
        if (typeof CONFIG === 'undefined') return;
        if (CONFIG.TV_CHANNELS?.[1]) CONFIG.TV_CHANNELS[1].quote = '«У нас срочный вызов, возможно криминал... По коням!»';
        if (CONFIG.DAILY_MODIFIERS?.[0]) Object.assign(CONFIG.DAILY_MODIFIERS[0], { id:'sunday_beer', title:'Лимонадный Выходной', desc:'🥤 Расходники выпадают чаще на 40%, +25% хайп', icon:'🥤' });
        if (CONFIG.BOSSES?.[5]) { CONFIG.BOSSES[5].name='Фастфуд и Сладкое'; CONFIG.BOSSES[5].quote='«Ещё газировку и пиццу, дела подождут!»'; }
        const hangover = CONFIG.GARBAGE_TYPES?.find(i => i.id === 'hangover'); if (hangover) hangover.name='Усталость';
        const shield = CONFIG.RELICS_POOL?.find(i => i.id === 'relic_beer_shield'); if (shield) { shield.badge='🥤'; shield.name='Лимонадный щит'; }
        const roomUpgrade = CONFIG.UPGRADES?.room?.find(i => i.id === 'r3'); if (roomUpgrade) { roomUpgrade.name='Станция лимонада'; roomUpgrade.desc='Автомат напитков в углу. Доход +320/сек и +1 Лимонад раз в 3 мин'; }
        const bank = CONFIG.EVENTS_POOL?.find(i => i.id === 'bank_call'); if (bank) bank.desc='«По вашей карте замечена подозрительная транзакция в магазине у дома. Переведите деньги на защищённый счёт!»';
        const crypto = CONFIG.EVENTS_POOL?.find(i => i.id === 'crypto_drop'); if (crypto?.choiceB) crypto.choiceB.penalty='Получаете +2 Лимонада, +2 Скрипта, +2 Флэша';
        const ach = CONFIG.ACHIEVEMENTS?.find(i => i.id === 'tier_skuf'); if (ach) ach.badge='🛋️';
        const sector = CONFIG.ROULETTE_SECTORS?.find(i => i.prize?.type === 'item' && i.prize?.item === 'beer'); if (sector) { sector.label='🥤 Лимонад'; sector.desc='+1 Лимонад'; }
        if (CONFIG.RANKS?.[2]) CONFIG.RANKS[2].title = cleanText(CONFIG.RANKS[2].title);
    }

    function rewriteGuide() {
        const title=document.querySelector('#guide-overlay .modal-top h3'); if(title) title.textContent='📖 КАК ИГРАТЬ';
        const open=document.getElementById('btn-open-guide'); if(open) open.textContent='КАК ИГРАТЬ';
        const content=document.querySelector('#guide-overlay .guide-content'); if(!content) return;
        content.innerHTML=`
<section class="guide-section"><h4>🎯 Цель</h4><p>Сбрасывайте мысли в стакан, соединяйте две одинаковые и развивайте цепочку от T1 до 👑 <b>Гигачада T10</b>. Слияния дают Мотивацию и наносят урон текущему боссу. Победите 20 основных боссов и продолжайте рекордный забег в endless-режиме.</p></section>
<section class="guide-section"><h4>🧠 Стакан и управление</h4><ul><li><b>Клик / тап по стакану</b> — прицелиться и сбросить следующую мысль. У ручного сброса есть короткий кулдаун.</li><li><b>Двойной тап</b> — микро-подброс тел; повторно через 4 секунды.</li><li><b>🧠 Встряска</b> — сильнее расталкивает завал и имеет отдельный кулдаун.</li><li><b>← / →</b> или A / D — наклон стакана; на телефоне можно включить гироскоп.</li><li><b>Space</b> — сброс мысли, <b>Z</b> — Автосброс.</li><li>Если устойчивые тела слишком долго находятся выше <b>красной линии</b>, наступает поражение.</li></ul></section>
<section class="guide-section"><h4>💎 Мотивация и 🫁 Дыхалка</h4><p><b>Мотивация</b> — основная валюта. HUD показывает текущий запас и автоматический доход <b>в секунду</b>. Она приходит от слияний, пассивных улучшений, квестов, событий, комнаты и оффлайн-дохода.</p><p><b>Тап по Скуфу</b> наносит прямой урон боссу, но расходует Дыхалку.</p></section>
<section class="guide-section"><h4>👹 День и босс</h4><p>У дня есть таймер. Победите босса до его окончания. В HUD показываются <b>Эффект дня</b> и <b>Эффект босса</b>; нажмите на чип, чтобы увидеть описание. После победы вы получаете награду и выбор реликвии.</p></section>
<section class="guide-section"><h4>🎒 Расходники</h4><ul><li>🥤 <b>Лимонад</b> — растворяет выбранную мысль или мусор.</li><li>📜 <b>Скрипт</b> — помогает соединить две одинаковые мысли.</li><li>⚡ <b>Флэш</b> — временно замедляет физику.</li><li>💣 <b>Петарда</b> — разбрасывает опасный завал.</li><li>🧲 <b>Магнит</b> — стягивает мысли к центру.</li></ul></section>
<section class="guide-section"><h4>🔥 Хайп, прокачка и Сансара</h4><p>Серии слияний заряжают <b>Хайп</b>. При 100% включается Fever с повышенной наградой. За Мотивацию покупаются улучшения Тела, Берлоги, Разума и Карьеры.</p><p><b>Сансара</b> сбрасывает текущий забег ради Золотых Диванов — валюты постоянных перков.</p></section>
<section class="guide-section"><h4>📋 Остальное</h4><ul><li>Квесты обновляются в 00:00 МСК.</li><li>Колесо Фортуны даёт бесплатные вращения по таймеру и за победы.</li><li>Комната интерактивна: телевизор, кот и купленные объекты дают эффекты.</li><li>☰ открывает Прокачку, Квесты, Сансару, Статистику, Лидерборд, Правила и Сброс.</li><li>На ПК левый HUD сворачивается влево, на телефоне верхний HUD — вверх; ключевые показатели остаются в мини-HUD.</li></ul></section>
<section class="guide-section"><h4>📺 Реклама и сохранение</h4><p>Rewarded-реклама <b>не обязательна</b>: на кнопке указана награда, а бонус выдаётся только после успешного просмотра. Во время рекламы игра ставится на паузу.</p><p>Прогресс сохраняется автоматически локально и, когда доступен профиль Яндекс Игр, в облако.</p></section>`;
    }

    function patchRoomLabels(){
        if(typeof RoomRenderer==='undefined'||!RoomRenderer.prototype?.getInteractiveTargets) return;
        const original=RoomRenderer.prototype.getInteractiveTargets; if(original.__content12Patched) return;
        const wrapped=function(...args){ const targets=original.apply(this,args); targets?.forEach?.(t=>{if(t?.id==='brewery') t.name='Станция напитков';}); return targets;};
        wrapped.__content12Patched=true; RoomRenderer.prototype.getInteractiveTargets=wrapped;
    }

    function patchRuntimeMessages(){
        if(typeof SkufLifeGame!=='undefined'&&SkufLifeGame.prototype?.spawnFloatingText){ const o=SkufLifeGame.prototype.spawnFloatingText; if(!o.__content12Patched){ const w=function(x,y,text,color,...rest){return o.call(this,x,y,cleanText(text),color,...rest);}; w.__content12Patched=true; SkufLifeGame.prototype.spawnFloatingText=w; }}
        if(typeof UIManager!=='undefined'&&UIManager.prototype?.setQuote){ const o=UIManager.prototype.setQuote; if(!o.__content12Patched){ const w=function(text){return o.call(this,cleanText(text));}; w.__content12Patched=true; UIManager.prototype.setQuote=w; }}
    }

    function labelRewardedButtons(){
        const labels={
            'btn-revive-ad':'📺 РЕКЛАМА → ВТОРОЕ ДЫХАНИЕ',
            'btn-claim-offline-x2':'📺 РЕКЛАМА → ЗАБРАТЬ ×2',
            'btn-shop-aid-ad':'📺 РЕКЛАМА → +1 ВСЕХ РАСХОДНИКОВ',
            'btn-do-prestige-ad':'📺 РЕКЛАМА → ПЕРЕРОЖДЕНИЕ + БОНУС',
            'btn-boss-freeze-ad':'📺 РЕКЛАМА → +35с',
            'btn-boss-nuke-ad':'📺 РЕКЛАМА → -15% HP',
            'btn-spin-wheel-ad':'📺 РЕКЛАМА → ЕЩЁ СПИН'
        };
        Object.entries(labels).forEach(([id,text])=>{
            const b=document.getElementById(id);
            if(!b) return;
            if(b.textContent!==text) b.textContent=text;
            const aria=text.replace('📺 ', '');
            if(b.getAttribute('aria-label')!==aria) b.setAttribute('aria-label',aria);
        });
        document.querySelectorAll('.boost-btn').forEach(b=>{if(/СМОТРЕТЬ|ADS/i.test(b.textContent||'')) b.textContent='📺 РЕКЛАМА → ПОЛУЧИТЬ БУСТ';});
        document.querySelectorAll('.quest-claim-btn').forEach(b=>{if(/2X НАГРАДА/i.test(b.textContent||'')) b.textContent='📺 РЕКЛАМА → НАГРАДА ×2';});
    }

    function sanitizeDom(root=document.body){
        if(!root) return;
        const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT); const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(n=>{const next=cleanText(n.nodeValue); if(next!==n.nodeValue) n.nodeValue=next;});
        root.querySelectorAll?.('[title]').forEach(el=>{const old=el.getAttribute('title');const next=cleanText(old);if(next!==old) el.setAttribute('title',next);});
        const slot=document.getElementById('slot-beer');
        if(slot){
            const title='Лимонад: растворить выбранную мысль или мусор';
            if(slot.title!==title) slot.title=title;
            const e=slot.querySelector('.slot-emoji');
            if(e&&e.textContent!=='🥤') e.textContent='🥤';
        }
        labelRewardedButtons();
    }

    function observeUi(){
        let queued=false; const flush=()=>{queued=false;sanitizeDom(document.body);};
        const obs=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(flush);});
        obs.observe(document.body,{childList:true,subtree:true,characterData:true});
    }

    patchConfig(); rewriteGuide(); patchRoomLabels(); patchRuntimeMessages(); sanitizeDom(document.body); observeUi();
    console.info(`[CONTENT ${CONTENT_VERSION}] 12+ presentation enabled`);
})();
