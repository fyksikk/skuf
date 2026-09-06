const CONFIG = {
    // Базовые пропорции (адаптируются под canvas.height в runtime)
    DEFAULT_ROOM_RATIO: 0.30, // 30% под комнату, 70% под стакан мыслей
    MIN_ROOM_HEIGHT: 135,
    MAX_ROOM_HEIGHT: 195,
    
    // 10 УРОВНЕЙ ЭВОЛЮЦИИ МЫСЛЕЙ (Сбалансированы под любой стакан)
    TIERS: {
        1:  { name: "Квадробер", radius: 15, color: "#4ade80", emoji: "🐱", score: 2,   mappedImg: 1, glow: "#22c55e" },
        2:  { name: "Симп",       radius: 20, color: "#38bdf8", emoji: "🥺", score: 6,   mappedImg: 2, glow: "#0ea5e9" },
        3:  { name: "Тюбик",      radius: 26, color: "#818cf8", emoji: "🧪", score: 16,  mappedImg: 3, glow: "#6366f1" },
        4:  { name: "Зумер",      radius: 33, color: "#c084fc", emoji: "🧢", score: 36,  mappedImg: 4, glow: "#a855f7" },
        5:  { name: "Альтушка",   radius: 41, color: "#f472b6", emoji: "🎀", score: 80,  mappedImg: 5, glow: "#ec4899" },
        6:  { name: "Масик",      radius: 50, color: "#fb7185", emoji: "🧸", score: 180, mappedImg: 6, glow: "#f43f5e" },
        7:  { name: "Дед",        radius: 61, color: "#fb923c", emoji: "👴", score: 400, mappedImg: 7, glow: "#f97316" },
        8:  { name: "Скуф",       radius: 73, color: "#facc15", emoji: "🛋️", score: 950, mappedImg: 8, glow: "#eab308" },
        9:  { name: "Сигма",      radius: 87, color: "#a78bfa", emoji: "🗿", score: 2200, mappedImg: 9, glow: "#8b5cf6" },
        10: { name: "ГИГАЧАД",    radius: 104, color: "#ffd700", emoji: "👑", score: 5000, mappedImg: 10, glow: "#ffbf00" }
    },

    // ФАЗЫ ПРОГРЕССИИ (смена окружения каждые 3-4 дня)
    PHASES: {
        1: { name: "Хрущёвка", roomStage: 0, gravityMod: 1.0, trashMod: 1.0, bgTitle: "Уютная однушка с ковром" },
        2: { name: "Евроремонт", roomStage: 1, gravityMod: 1.05, trashMod: 1.15, bgTitle: "Студия с подсветкой" },
        3: { name: "IT-Офис", roomStage: 2, gravityMod: 1.12, trashMod: 1.3, bgTitle: "Офис с пуфиками и кофемашиной" },
        4: { name: "Пентхаус", roomStage: 3, gravityMod: 1.2, trashMod: 1.5, bgTitle: "Пентхаус Сити с видом на огни" },
        5: { name: "Орбита", roomStage: 4, gravityMod: 1.3, trashMod: 1.7, bgTitle: "Космическая Скуф-Станция" }
    },

    // 20 РАЗНООБРАЗНЫХ БОССОВ ДЛЯ ДОЛГОЙ ИГРЫ
    BOSSES: {
        1:  { name: "Хозяйка Тамара 👵",       hp: 600,     quote: "«Аренда сама себя не заплатит, вставай!»", color: "#f87171" },
        2:  { name: "Коллектор Валера 🕶️",     hp: 1600,    quote: "«За телефончик платить будем или как?»", color: "#fb923c" },
        3:  { name: "Начальник Михалыч 🏭",     hp: 3800,    quote: "«Выходи в субботу за отгул (нет)!»", color: "#facc15" },
        4:  { name: "Бывшая 💔",                hp: 8500,    quote: "«Ты совсем не изменился...»", color: "#f472b6" },
        5:  { name: "Алкоголь и Фастфуд 🍾",    hp: 18000,   quote: "«Ещё баночку и пиццу, поспишь потом!»", color: "#c084fc" },
        6:  { name: "Депрессия 🌧️",            hp: 38000,   quote: "«Всё тлен, оставайся под одеялом...»", color: "#60a5fa" },
        7:  { name: "Инфоцыган Артём 📱",       hp: 75000,   quote: "«Купи курс успешного успеха за 99к!»", color: "#34d399" },
        8:  { name: "Крипто-Скамер 📉",         hp: 140000,  quote: "«Вложи всё в мемкоин SkufCoin, 1000x завтра!»", color: "#fbbf24" },
        9:  { name: "Синдром Самозванца 🎭",    hp: 260000,  quote: "«Ты ничего не добился, тебе просто повезло!»", color: "#a78bfa" },
        10: { name: "Ипотека на 30 лет 🏦",     hp: 480000,  quote: "«Каждый месяц 70% зарплаты — мне!»", color: "#f87171" },
        11: { name: "Служба Доставки 🍕",       hp: 850000,  quote: "«Курьер уже у двери. Не вставай, он принесет!»", color: "#fb923c" },
        12: { name: "Нейросеть GPT-6 🤖",       hp: 1500000, quote: "«Я делаю твою работу за 0.2 секунды бесплатно.»", color: "#38bdf8" },
        13: { name: "Выгорание 🔥",             hp: 2600000, quote: "«У тебя нет энергии даже открыть глаза...»", color: "#ef4444" },
        14: { name: "Военком в дверях 🪖",      hp: 4500000, quote: "«Распишитесь в получении повесточки!»", color: "#4ade80" },
        15: { name: "Кризис Среднего Возраста 🏎️", hp: 7500000, quote: "«Пора купить мотоцикл и грустить под дождём.»", color: "#e879f9" },
        16: { name: "Государственная Бюрократия 🏛️", hp: 12500000, quote: "«Принесите справку о том, что вам нужна справка.»", color: "#94a3b8" },
        17: { name: "Гравитация Дивана 🕳️",     hp: 20000000, quote: "«Диван стал чёрной дырой. Ты не встанешь никогда.»", color: "#6366f1" },
        18: { name: "Неумолимое Время ⏰",       hp: 35000000, quote: "«Тик-так. Ещё один год прошёл впустую...»", color: "#f59e0b" },
        19: { name: "СМЕРТЬ БЫТИЯ 💀",          hp: 60000000, quote: "«Конец близко. Покажи, на что способен Гигачад!»", color: "#dc2626" },
        20: { name: "АБСОЛЮТНЫЙ ВЛАДЫКА СУДЬБЫ 👑", hp: 100000000, quote: "«Ты прошёл сквозь огонь, ленивый воин. ПРЕВОЗМОГИ!»", color: "#ffd700" }
    },

    // МУСОРНЫЕ МЫСЛИ (не сливаются, взрываются слияниями)
    GARBAGE_TYPES: [
        { name: "Кредит 💳",    color: "#475569", radius: 25 },
        { name: "Бывшая 💔",    color: "#4a1525", radius: 27 },
        { name: "Лень 🦥",      color: "#1e293b", radius: 26 },
        { name: "Дедлайн ⏰",   color: "#7c2d12", radius: 24 },
        { name: "Бессонница 🌙", color: "#1e1b4b", radius: 25 },
        { name: "Тревога ⚡",   color: "#581c87", radius: 25 },
        { name: "Похмелье 🤢",  color: "#14532d", radius: 28 },
        { name: "Прокрастинация 💤", color: "#312e81", radius: 26 }
    ],

    // РЕЛИКВИИ ЗАБЕГА (выбираются при победе над боссом)
    RELICS_POOL: [
        {
            id: "relic_espresso",
            badge: "☕",
            name: "Эспрессо-пулемёт",
            desc: "Сброс мыслей быстрее. Очки комбо х2",
            apply: (g) => { g.comboMultiplier *= 2; g.dropCooldownMs = Math.max(140, g.dropCooldownMs - 120); }
        },
        {
            id: "relic_beer_shield",
            badge: "🍺",
            name: "Пивной щит",
            desc: "Слияние T8 (Скуф) сжигает весь мусор на поле",
            apply: (g) => { g.hasBeerShield = true; }
        },
        {
            id: "relic_magnet",
            badge: "🧲",
            name: "Нейро-магнит",
            desc: "Мысли T1 и T2 сами притягиваются друг к другу",
            apply: (g) => { g.hasMagnetRelic = true; }
        },
        {
            id: "relic_iron_lungs",
            badge: "🫁",
            name: "Железные лёгкие",
            desc: "Дыхалка Скуфа восстанавливается в 2.5 раза быстрее",
            apply: (g) => { g.staminaRecoveryRate *= 2.5; }
        },
        {
            id: "relic_skull_wall",
            badge: "🧠",
            name: "Стены из гипса",
            desc: "Череп расширяется на +24px навсегда",
            apply: (g) => { g.physics.expandSkull(g.physics.cupWidthOffset + 24); }
        },
        {
            id: "relic_stream_rig",
            badge: "💻",
            name: "Спонсорский контракт",
            desc: "Пассивный доход моментально +50/сек",
            apply: (g) => { g.passiveIncome += 50; }
        },
        {
            id: "relic_pillow",
            badge: "🛌",
            name: "Ортопедическая подушка",
            desc: "Максимальная выносливость +50%, усталость наступает реже",
            apply: (g) => { g.maxStamina = (g.maxStamina || 100) + 50; g.stamina = g.maxStamina; }
        },
        {
            id: "relic_golden_cat",
            badge: "🐱",
            name: "Золотой Квадробер",
            desc: "Слияние T1 дает +500 Мотивации и пассивный доход +80/сек",
            apply: (g) => { g.passiveIncome += 80; g.hasGoldenCat = true; }
        },
        {
            id: "relic_flash_master",
            badge: "⚡",
            name: "Повелитель времени",
            desc: "Расходник «Флэш» длится 25 секунд вместо 10",
            apply: (g) => { g.flashDuration = 25000; }
        },
        {
            id: "relic_chain_blast",
            badge: "💥",
            name: "Цепной взрыв",
            desc: "Слияния T5+ вызывают ударную волну, очищающую экран от мусора",
            apply: (g) => { g.hasChainBlast = true; }
        },
        {
            id: "relic_banker",
            badge: "💎",
            name: "Швейцарский счет",
            desc: "Весь доход от слияний и кликов умножается на х1.5",
            apply: (g) => { g.globalIncomeMultiplier = (g.globalIncomeMultiplier || 1.0) * 1.5; }
        },
        {
            id: "relic_boss_hunter",
            badge: "🎯",
            name: "Охотник на боссов",
            desc: "Урон по боссу увеличен на +75%",
            apply: (g) => { g.bossDamageMultiplier = (g.bossDamageMultiplier || 1.0) * 1.75; }
        }
    ],

    // ГЛУБОКОЕ ДЕРЕВО ПРОКАЧКИ (4 КАТЕГОРИИ ДЛЯ ДОЛГОЙ ИГРЫ)
    UPGRADES: {
        hero: [
            { id: "h1", name: "Гантели из бетона", desc: "Появляются в комнате. Клики х2 урона", cost: 150, bought: false, level: 1 },
            { id: "h2", name: "Протеиновый шейк", desc: "Клики х5. Шанс крита 15% на x10", cost: 850, bought: false, level: 2 },
            { id: "h3", name: "Ледяной душ", desc: "Дыхалка восстанавливается на +80% быстрее", cost: 3200, bought: false, level: 3 },
            { id: "h4", name: "Стильный смокинг", desc: "Клики х15. Авторитет Скуфа растет", cost: 12000, bought: false, level: 4 },
            { id: "h5", name: "Кибернетическая рука", desc: "Клики х50. Наносит авто-удары раз в 2 секунды", cost: 55000, bought: false, level: 5 },
            { id: "h6", name: "Титановый экзоскелет", desc: "Клики х150. Дыхалка больше никогда не падает до нуля", cost: 240000, bought: false, level: 6 },
            { id: "h7", name: "АУРА ГИГАЧАДА", desc: "Клики х600. Боссы получают пассивный урон от одного взгляда", cost: 1000000, bought: false, level: 7 }
        ],
        room: [
            { id: "r1", name: "Генеральная уборка", desc: "Чистый пол, выброшена пицца. Доход +5/сек", cost: 100, bought: false, level: 1 },
            { id: "r2", name: "RGB Игровой ПК", desc: "Светящийся стол в углу. Доход +25/сек", cost: 650, bought: false, level: 2 },
            { id: "r3", name: "Мини-пивоварня", desc: "Балтика в углу. Доход +90/сек и +1 пиво раз в 4 мин", cost: 2800, bought: false, level: 3 },
            { id: "r4", name: "Стойка Майнинг-фермы", desc: "Сервер с диодами. Доход +350/сек", cost: 11000, bought: false, level: 4 },
            { id: "r5", name: "Умный Дом и Робот-пылесос", desc: "Авто-комфорт. Доход +1400/сек", cost: 48000, bought: false, level: 5 },
            { id: "r6", name: "Личный дата-центр", desc: "Король интернета. Доход +6500/сек", cost: 210000, bought: false, level: 6 },
            { id: "r7", name: "Неоновый Сити-Пентхаус", desc: "Золотая мебель и панорама. Доход +30000/сек", cost: 950000, bought: false, level: 7 },
            { id: "r8", name: "Космическая Оранжерея", desc: "Доход +150000/сек. Скуф живет в невесомости", cost: 4500000, bought: false, level: 8 }
        ],
        brain: [
            { id: "b1", name: "Распил черепа I", desc: "Стакан расширяется на +18px. Больше простора!", cost: 350, bought: false, level: 1 },
            { id: "b2", name: "Скоростные синапсы", desc: "Кулдаун сброса мыслей снижен на 30%", cost: 1400, bought: false, level: 2 },
            { id: "b3", name: "Встряска мозга II", desc: "Кулдаун встряски снижен с 12 до 6 секунд", cost: 5000, bought: false, level: 3 },
            { id: "b4", name: "Осознанность и Дзен", desc: "Мусорные мысли падают в 2 раза реже", cost: 19000, bought: false, level: 4 },
            { id: "b5", name: "Распил черепа II", desc: "Стакан расширяется еще на +24px", cost: 75000, bought: false, level: 5 },
            { id: "b6", name: "Комбо-Стрик Мастер", desc: "Время жизни комбо +3 сек. Множитель комбо х2", cost: 300000, bought: false, level: 6 },
            { id: "b7", name: "Третий Глаз Сигмы", desc: "Все слияния наносят двойной урон боссам", cost: 1200000, bought: false, level: 7 }
        ],
        career: [
            { id: "c1", name: "Стрим на Твиче", desc: "Донаты зрителей. Доход +15/сек", cost: 400, bought: false, level: 1 },
            { id: "c2", name: "Торговля Скуфкоином", desc: "Крипто-доход +75/сек", cost: 1800, bought: false, level: 2 },
            { id: "c3", name: "Курсы «Как встать с дивана»", desc: "Инфобизнес. Доход +300/сек", cost: 7500, bought: false, level: 3 },
            { id: "c4", name: "Свой маркетплейс мерча", desc: "Продажа кружек и худи. Доход +1200/сек", cost: 32000, bought: false, level: 4 },
            { id: "c5", name: "IT-Стартап «База AI»", desc: "Инвестиции фондов. Доход +5000/сек", cost: 150000, bought: false, level: 5 },
            { id: "c6", name: "Выкуп Дома у Тамары", desc: "Тамара платит аренду сама! Доход +22000/сек", cost: 700000, bought: false, level: 6 },
            { id: "c7", name: "Мировая Корпорация Скуфа", desc: "Доход +100000/сек. Вы управляете экономикой", cost: 3500000, bought: false, level: 7 }
        ]
    },

    // САНСАРА И ПЕРЕРОЖДЕНИЕ (ПРЕСТИЖ)
    PRESTIGE_PERKS: [
        { id: "p1", name: "Генетическая База", desc: "+30% ко всей добываемой Мотивации навсегда", cost: 1, level: 0, max: 10 },
        { id: "p2", name: "Благородный Старт", desc: "Начинать новые забеги с мыслями T2 и T3", cost: 2, level: 0, max: 3 },
        { id: "p3", name: "Титановые Легкие", desc: "Стартовая дыхалка увеличена в 2 раза", cost: 2, level: 0, max: 5 },
        { id: "p4", name: "Оффлайн-Магнат", desc: "Лимит сна увеличен до 24 часов, оффлайн доход 100%", cost: 3, level: 0, max: 4 },
        { id: "p5", name: "Авто-Мыслитель", desc: "Включает аккуратный авто-сброс мыслей в фоновом режиме", cost: 5, level: 0, max: 1 },
        { id: "p6", name: "Квантовый Череп", desc: "Стакан навсегда на +30px шире с первого дня", cost: 4, level: 0, max: 3 }
    ],

    // ЗАДАНИЯ И КВЕСТЫ (РЕГУЛЯРНЫЕ НАГРАДЫ)
    DAILY_QUESTS: [
        { id: "q1", title: "Разминка костей", desc: "Сделайте 30 тапов по дивану", goal: 30, type: "taps", reward: 200, rewardItem: "beer" },
        { id: "q2", title: "Уборка в голове", desc: "Уничтожьте 6 мусорных мыслей", goal: 6, type: "trash", reward: 350, rewardItem: "script" },
        { id: "q3", title: "Мастер комбо", desc: "Наберите комбо x4 или выше", goal: 4, type: "combo", reward: 500, rewardItem: "energy" },
        { id: "q4", title: "Конвейер мыслей", desc: "Слейте 40 любых мыслей", goal: 40, type: "merges", reward: 600, rewardItem: "beer" },
        { id: "q5", title: "Гроза Хозяек", desc: "Победите любого босса", goal: 1, type: "boss", reward: 1000, rewardItem: "script" },
        { id: "q6", title: "Рождение Гигачада", desc: "Создайте хотя бы одного Гигачада", goal: 1, type: "gigachad", reward: 3000, rewardItem: "energy" }
    ],

    // СОБЫТИЯ И ДИЛЕММЫ
    EVENTS_POOL: [
        {
            id: "bank_call",
            icon: "📞",
            title: "Звонок службы безопасности",
            desc: "«По вашей карте замечена подозрительная транзакция в пивном ларьке. Переведите на защищенный счет!»",
            choiceA: {
                title: "Поверить и перевести (+600 🗿)",
                penalty: "В голову падает тяжелый «Кредит 💳»",
                action: (game) => {
                    game.motivation += 600;
                    game.physics.createGarbage(game.canvas.width / 2, game.dropY, CONFIG.GARBAGE_TYPES[0]);
                }
            },
            choiceB: {
                title: "Послать мошенников",
                penalty: "Скуф взбодрился (+20 к пассиву на 30 сек)",
                action: (game) => {
                    game.passiveIncome += 20;
                    setTimeout(() => { game.passiveIncome = Math.max(0, game.passiveIncome - 20); }, 30000);
                    game.ui.setQuote("«Служба безопасности?.. Не на того напали!»");
                }
            }
        },
        {
            id: "crypto_drop",
            icon: "📈",
            title: "Скуфкоин взлетел на бирже!",
            desc: "Забытая криптовалюта сделала мощный скачок на графиках. Фиксируем или докупаем?",
            choiceA: {
                title: "Зафиксировать прибыль (+1200 🗿)",
                penalty: "Настроение на высоте!",
                action: (game) => { game.motivation += 1200; }
            },
            choiceB: {
                title: "Купить ящик расходников",
                penalty: "Получаете +2 Балтики, +1 Скрипт, +1 Флэш",
                action: (game) => {
                    game.items.beer += 2;
                    game.items.script += 1;
                    game.items.energy += 1;
                    game.updateConsumablesUI();
                }
            }
        },
        {
            id: "couch_miracle",
            icon: "🛋️",
            title: "Находка под диванной подушкой",
            desc: "Рука нащупала что-то шуршащее в складках старого велюрового дивана...",
            choiceA: {
                title: "Достать заначку (+800 🗿)",
                penalty: "Скуф находит купюру пятилетней давности",
                action: (game) => { game.motivation += 800; }
            },
            choiceB: {
                title: "Достать старый пульт и батарейку",
                penalty: "Встряска мозга мгновенно перезаряжена",
                action: (game) => { game.shakeCooldown = 0; game.ui.updateShake(0); }
            }
        }
    ],

    // ДОСТИЖЕНИЯ
    ACHIEVEMENTS: [
        { id: "first_merge", badge: "🐱", name: "Первое слияние", desc: "Слейте первые две мысли воедино", check: (g) => g.totalMerges >= 1 },
        { id: "gigachad", badge: "👑", name: "Явление Гигачада", desc: "Слейте мысль 10 уровня", check: (g) => g.gigachadsCreated >= 1 },
        { id: "boss_slayer", badge: "👵", name: "Аренда отменяется", desc: "Одолейте первого босса Тамару", check: (g) => g.bossesDefeated >= 1 },
        { id: "five_bosses", badge: "🏆", name: "Ветеран превозмогания", desc: "Одолейте 5 разных боссов", check: (g) => g.bossesDefeated >= 5 },
        { id: "combo_master", badge: "🔥", name: "Нейро-вихрь", desc: "Наберите серию комбо x6", check: (g) => g.maxCombo >= 6 },
        { id: "rich_skuf", badge: "💰", name: "Крипто-магнат", desc: "Накопите более 50 000 Мотивации", check: (g) => g.motivation >= 50000 },
        { id: "clean_freak", badge: "✨", name: "Чистый разум", desc: "Уничтожьте 25 мусорных мыслей", check: (g) => g.trashDestroyed >= 25 },
        { id: "rebirth", badge: "🌀", name: "Выход из матрицы", desc: "Совершите свое первое Перерождение", check: (g) => g.prestigeLevel >= 1 }
    ],

    // ФОРМАТИРОВАНИЕ ЧИСЕЛ С БУКВАМИ (1К, 1М, 1B, 1T, 1Qa, 1Qi, 1Sx, 1Sp, 1Oc, 1No, 1Dc...)
    formatNumber(num) {
        if (num === null || num === undefined || isNaN(num)) return "0";
        const sign = num < 0 ? "-" : "";
        const abs = Math.abs(num);
        if (abs < 1000) {
            return sign + Math.floor(abs).toString();
        }

        const suffixes = [
            { v: 1e93, s: "Tg" },   // Trigintillion
            { v: 1e90, s: "NoVg" }, // Novemvigintillion
            { v: 1e87, s: "OcVg" }, // Octovigintillion
            { v: 1e84, s: "SpVg" }, // Septemvigintillion
            { v: 1e81, s: "SxVg" }, // Sesvigintillion
            { v: 1e78, s: "QiVg" }, // Quinvigintillion
            { v: 1e75, s: "QaVg" }, // Quattuorvigintillion
            { v: 1e72, s: "TVg" },  // Trevigintillion
            { v: 1e69, s: "DVg" },  // Duovigintillion
            { v: 1e66, s: "UVg" },  // Unvigintillion
            { v: 1e63, s: "Vg" },   // Vigintillion
            { v: 1e60, s: "NoDc" }, // Novemdecillion
            { v: 1e57, s: "OcDc" }, // Octodecillion
            { v: 1e54, s: "SpDc" }, // Septendecillion
            { v: 1e51, s: "SxDc" }, // Sedecillion
            { v: 1e48, s: "QiDc" }, // Quindecillion
            { v: 1e45, s: "QaDc" }, // Quattuordecillion
            { v: 1e42, s: "TDc" },  // Tredecillion
            { v: 1e39, s: "DDc" },  // Duodecillion
            { v: 1e36, s: "UDc" },  // Undecillion
            { v: 1e33, s: "Dc" },   // Decillion
            { v: 1e30, s: "No" },   // Nonillion
            { v: 1e27, s: "Oc" },   // Octillion
            { v: 1e24, s: "Sp" },   // Septillion
            { v: 1e21, s: "Sx" },   // Sextillion
            { v: 1e18, s: "Qi" },   // Quintillion
            { v: 1e15, s: "Qa" },   // Quadrillion
            { v: 1e12, s: "T" },    // Trillion
            { v: 1e9,  s: "B" },    // Billion
            { v: 1e6,  s: "M" },    // Million
            { v: 1e3,  s: "K" }     // Thousand
        ];

        for (let i = 0; i < suffixes.length; i++) {
            if (abs >= suffixes[i].v) {
                const val = abs / suffixes[i].v;
                let formatted;
                if (val >= 100) {
                    formatted = Math.floor(val).toString();
                } else if (val >= 10) {
                    formatted = val.toFixed(1).replace(/\.0$/, '');
                } else {
                    formatted = val.toFixed(2).replace(/\.?0+$/, '');
                }
                return sign + formatted + suffixes[i].s;
            }
        }

        return sign + Math.floor(abs).toString();
    },

    // КОЛЕСО ФОРТУНЫ / РУЛЕТКА (Сбалансированные веса и шансы выпадения)
    ROULETTE_SECTORS: [
        { label: "💨 Пшик", desc: "Пусто! Повезёт позже", color: "#475569", weight: 36, prize: { type: 'empty' } },
        { label: "💣 Бомба", desc: "+1 Петарда", color: "#ef4444", weight: 16, prize: { type: 'item', item: 'bomb', count: 1 } },
        { label: "🧲 Магнит", desc: "+1 Магнит", color: "#8b5cf6", weight: 10, prize: { type: 'item', item: 'magnet', count: 1 } },
        { label: "⚡ Флэш", desc: "+1 Энергетик", color: "#06b6d4", weight: 15, prize: { type: 'item', item: 'energy', count: 1 } },
        { label: "🍺 Балтика", desc: "+1 Балтика", color: "#f59e0b", weight: 15, prize: { type: 'item', item: 'beer', count: 1 } },
        { label: "🗿 +1.5K", desc: "+1,500 Мотивации", color: "#10b981", weight: 6, prize: { type: 'motivation', amount: 1500 } },
        { label: "🛋️ +1 Диван", desc: "+1 Золотой Диван", color: "#a855f7", weight: 1.5, prize: { type: 'prestige', amount: 1 } },
        { label: "👑 ДЖЕКПОТ", desc: "Суперприз +10K!", color: "#ffd700", weight: 0.5, prize: { type: 'jackpot' } }
    ],

    // ХАЙП-РАНГИ (ТИУТЛЫ СКУФА)
    RANKS: [
        { title: "🛋️ Тюбик с дивана", req: 0, badge: "РАНГ 1", desc: "Смотрит рилсы 14 часов подряд" },
        { title: "🎀 Альтушка-хантер", req: 1500, badge: "РАНГ 2", desc: "Пытается скачать Госуслуги" },
        { title: "🍺 Скуф-Специалист", req: 6000, badge: "РАНГ 3", desc: "Разбирается в танках и скидках" },
        { title: "🕶️ Мастер Мемов", req: 25000, badge: "РАНГ 4", desc: "Понимает постиронию и скибиди" },
        { title: "🗿 Сигма-Самец", req: 90000, badge: "РАНГ 5", desc: "Преисполнился в познании покоя" },
        { title: "👑 Гигачад Метавселенной", req: 300000, badge: "РАНГ 6", desc: "Встал с дивана обеими ногами!" },
        { title: "🌌 Абсолютный Демиург", req: 1000000, badge: "РАНГ 7", desc: "Создатель вечного кайфа" }
    ],

    // МЕМНЫЕ ВСПЛЫВАЮЩИЕ НАДПИСИ ПРИ СЛИЯНИЯХ И FEVER
    MEME_POPUPS: [
        "БАЗА! 🗿",
        "СИГМА! 🔥",
        "ШЕДЕВРО-МЕРДЖ! ⚡",
        "ФЛЕКС! 🕶️",
        "ТУДА ЕГО! 🥊",
        "МЕГА-ХОРОШ! 💥",
        "1000-7? 🧠",
        "ИМБА! 🚀",
        "СКУФ В АТАКЕ! 🦁",
        "ДЕНЬГИ НА БАЗУ! 💰",
        "ПРОСТО ГЕНИЙ! 🧬"
    ]
};

if (typeof window !== 'undefined') {
    window.formatNumber = function(num) {
        return CONFIG.formatNumber(num);
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
