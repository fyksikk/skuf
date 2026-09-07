const CONFIG = {
    // Базовые пропорции (адаптируются под canvas.height в runtime)
    DEFAULT_ROOM_RATIO: 0.30, // 30% под комнату, 70% под стакан мыслей
    MIN_ROOM_HEIGHT: 135,
    MAX_ROOM_HEIGHT: 195,
    
    // 10 УРОВНЕЙ ЭВОЛЮЦИИ МЫСЛЕЙ (Экспоненциальная шкала наград для глубокого геймплея)
    TIERS: {
        1:  { name: "Квадробер", radius: 14, color: "#4ade80", score: 5,      mappedImg: 1, glow: "#22c55e" },
        2:  { name: "Симп",       radius: 18, color: "#38bdf8", score: 18,     mappedImg: 2, glow: "#0ea5e9" },
        3:  { name: "Тюбик",      radius: 23, color: "#818cf8", score: 55,     mappedImg: 3, glow: "#6366f1" },
        4:  { name: "Зумер",      radius: 29, color: "#c084fc", score: 165,    mappedImg: 4, glow: "#a855f7" },
        5:  { name: "Альтушка",   radius: 36, color: "#f472b6", score: 480,    mappedImg: 5, glow: "#ec4899" },
        6:  { name: "Масик",      radius: 44, color: "#fb7185", score: 1450,   mappedImg: 6, glow: "#f43f5e" },
        7:  { name: "Дед",        radius: 53, color: "#fb923c", score: 4400,   mappedImg: 7, glow: "#f97316" },
        8:  { name: "Скуф",       radius: 63, color: "#facc15", score: 13500,  mappedImg: 8, glow: "#eab308" },
        9:  { name: "Сигма",      radius: 74, color: "#a78bfa", score: 42000,  mappedImg: 9, glow: "#8b5cf6" },
        10: { name: "ГИГАЧАД",    radius: 86, color: "#ffd700", score: 135000, mappedImg: 10, glow: "#ffbf00" }
    },

    // ТЕЛЕКАНАЛЫ В КОМНАТЕ (Интерактивное переключение по клику)
    TV_CHANNELS: [
        { id: 0, title: "МАТЧ ТВ: СПАРТАК", quote: "«Судью на мыло! Гол был чистый!»", icon: "⚽", buff: "tap" },
        { id: 1, title: "УЛИЦЫ ФОНАРЕЙ", quote: "«У нас труп, возможно криминал... По коням!»", icon: "🚓", buff: "boss" },
        { id: 2, title: "КРИПТО-ПАМП 1000X", quote: "«Зеленая свеча! Закупаем на хаях!»", icon: "📈", buff: "income" },
        { id: 3, title: "СТРИМ АЛЬТУШКИ", quote: "«Спасибо за донат в 50 рублей, чмок!»", icon: "🎀", buff: "stamina" },
        { id: 4, title: "МАГАЗИН НА ДИВАНЕ", quote: "«Купите массажер для поясницы со скидкой 90%!»", icon: "🛋️", buff: "fever" }
    ],

    // ЛЕТАЮЩИЕ ИНСАЙТ-ПУЗЫРИ (Интерактивные клики по экрану)
    INSIGHT_BUBBLES: [
        { type: "insight", title: "Инсайт!", emoji: "💡", color: "#ffd700" },
        { type: "pizza", title: "Доставка!", emoji: "🍕", color: "#fb923c" },
        { type: "energy", title: "Хайп-Энергетик!", emoji: "⚡", color: "#00f0ff" },
        { type: "bomb", title: "Петарда!", emoji: "💣", color: "#ef4444" },
        { type: "spin", title: "Фриспин!", emoji: "🎡", color: "#a855f7" }
    ],

    // ФАЗЫ ПРОГРЕССИИ (смена окружения каждые 4 дня)
    PHASES: {
        1: { name: "Хрущёвка", roomStage: 0, gravityMod: 1.0, trashMod: 1.0, bgTitle: "Уютная однушка с ковром" },
        2: { name: "Евроремонт", roomStage: 1, gravityMod: 1.05, trashMod: 1.15, bgTitle: "Студия с подсветкой" },
        3: { name: "IT-Офис", roomStage: 2, gravityMod: 1.12, trashMod: 1.3, bgTitle: "Офис с пуфиками и кофемашиной" },
        4: { name: "Пентхаус", roomStage: 3, gravityMod: 1.2, trashMod: 1.5, bgTitle: "Пентхаус Сити с видом на огни" },
        5: { name: "Орбита", roomStage: 4, gravityMod: 1.3, trashMod: 1.7, bgTitle: "Космическая Скуф-Станция" }
    },

    // ЕЖЕДНЕВНЫЕ МОДИФИКАТОРЫ (Блок 5: Ротация по дням недели)
    DAILY_MODIFIERS: {
        0: { id: "sunday_beer", title: "Пивной Выходной", desc: "🍺 Расходники выпадают чаще на 40%, +25% хайп", icon: "🍺", color: "#facc15" },
        1: { id: "monday_grind", title: "Тяжёлый Понедельник", desc: "⚡ Боссы агрессивнее, но награда за слияния х2!", icon: "💼", color: "#f87171" },
        2: { id: "tuesday_crypto", title: "Крипто-Вторник", desc: "📈 Пассивный доход увеличен на +50%", icon: "💰", color: "#ffd700" },
        3: { id: "wednesday_cat", title: "День Котика", desc: "🐾 Кулдаун кота всего 5с, кот всегда удаляет мусор!", icon: "🐱", color: "#f472b6" },
        4: { id: "thursday_clean", title: "Чистый Четверг", desc: "🧹 Взрывы слияний шире на +50%, меньше тревог", icon: "✨", color: "#38bdf8" },
        5: { id: "friday_hype", title: "Пятничный Хайп", desc: "🔥 Лихорадка (Fever) длится в 2 раза дольше", icon: "🎉", color: "#ec4899" },
        6: { id: "saturday_chill", title: "Субботний Чилл", desc: "🛋️ Клики по Скуфу тратят на 50% меньше дыхалки", icon: "🎮", color: "#4ade80" }
    },

    // 20 МАСШТАБНЫХ БОССОВ (Глубокая многоуровневая экономика)
    BOSSES: {
        1:  { name: "Хозяйка Тамара",       hp: 3000,           quote: "«Аренда сама себя не заплатит, вставай!»", color: "#f87171" },
        2:  { name: "Коллектор Валера",     hp: 12000,          quote: "«За телефончик платить будем или как?»", color: "#fb923c" },
        3:  { name: "Начальник Михалыч",    hp: 45000,          quote: "«Выходи в субботу за отгул (нет)!»", color: "#facc15" },
        4:  { name: "Бывшая",               hp: 160000,         quote: "«Ты совсем не изменился...»", color: "#f472b6" },
        5:  { name: "Алкоголь и Фастфуд",   hp: 550000,         quote: "«Ещё баночку и пиццу, поспишь потом!»", color: "#c084fc" },
        6:  { name: "Депрессия",           hp: 1800000,        quote: "«Всё тлен, оставайся под одеялом...»", color: "#60a5fa" },
        7:  { name: "Инфоцыган Артём",      hp: 5500000,        quote: "«Купи курс успешного успеха за 99к!»", color: "#34d399" },
        8:  { name: "Крипто-Скамер",        hp: 18000000,       quote: "«Вложи всё в мемкоин SkufCoin, 1000x завтра!»", color: "#fbbf24" },
        9:  { name: "Синдром Самозванца",   hp: 55000000,       quote: "«Ты ничего не добился, тебе просто повезло!»", color: "#a78bfa" },
        10: { name: "Ипотека на 30 лет",    hp: 160000000,      quote: "«Каждый месяц 70% зарплаты — мне!»", color: "#f87171" },
        11: { name: "Служба Доставки",      hp: 450000000,      quote: "«Курьер уже у двери. Не вставай, он принесет!»", color: "#fb923c" },
        12: { name: "Нейросеть GPT-6",      hp: 1300000000,     quote: "«Я делаю твою работу за 0.2 секунды бесплатно.»", color: "#38bdf8" },
        13: { name: "Выгорание",            hp: 3800000000,     quote: "«У тебя нет энергии даже открыть глаза...»", color: "#ef4444" },
        14: { name: "Военком в дверях",     hp: 11000000000,    quote: "«Распишитесь в получении повесточки!»", color: "#4ade80" },
        15: { name: "Кризис Возраста",      hp: 32000000000,    quote: "«Пора купить мотоцикл и грустить под дождём.»", color: "#e879f9" },
        16: { name: "Бюрократия",           hp: 95000000000,    quote: "«Принесите справку о том, что вам нужна справка.»", color: "#94a3b8" },
        17: { name: "Гравитация Дивана",    hp: 280000000000,   quote: "«Диван стал чёрной дырой. Ты не встанешь никогда.»", color: "#6366f1" },
        18: { name: "Неумолимое Время",     hp: 850000000000,   quote: "«Тик-так. Ещё один год прошёл впустую...»", color: "#f59e0b" },
        19: { name: "СМЕРТЬ БЫТИЯ",         hp: 2500000000000,  quote: "«Конец близко. Покажи, на что способен Гигачад!»", color: "#dc2626" },
        20: { name: "ВЛАДЫКА СУДЬБЫ",       hp: 8000000000000,  quote: "«Ты прошёл сквозь огонь, ленивый воин. ПРЕВОЗМОГИ!»", color: "#ffd700" }
    },

    BOSS_ICONS: {
        1: "🏠",
        2: "💸",
        3: "👔",
        4: "💔",
        5: "🍔",
        6: "🌧️",
        7: "🎓",
        8: "🪙",
        9: "🎭",
        10: "🏦",
        11: "🛵",
        12: "🤖",
        13: "🔥",
        14: "🎖️",
        15: "🏍️",
        16: "🗂️",
        17: "🛋️",
        18: "⏳",
        19: "☠️",
        20: "👑"
    },

    // МУСОРНЫЕ ТРЕВОЖНЫЕ МЫСЛИ (не сливаются, взрываются слияниями)
    GARBAGE_TYPES: [
        { id: "credit", name: "Кредит", color: "#1e293b", highlight: "#334155", hazardColor: "#f59e0b", glow: "#f59e0b", radius: 21 },
        { id: "ex", name: "Бывшая", color: "#3b0764", highlight: "#4a044e", hazardColor: "#ec4899", glow: "#ec4899", radius: 21 },
        { id: "lazy", name: "Лень", color: "#0f172a", highlight: "#1e293b", hazardColor: "#38bdf8", glow: "#0284c7", radius: 21 },
        { id: "deadline", name: "Дедлайн", color: "#450a0a", highlight: "#7f1d1d", hazardColor: "#ef4444", glow: "#ef4444", radius: 21 },
        { id: "insomnia", name: "Бессонница", color: "#09090b", highlight: "#18181b", hazardColor: "#38bdf8", glow: "#0ea5e9", radius: 21 },
        { id: "anxiety", name: "Тревога", color: "#2e1065", highlight: "#581c87", hazardColor: "#a855f7", glow: "#c084fc", radius: 21 },
        { id: "hangover", name: "Похмелье", color: "#052e16", highlight: "#14532d", hazardColor: "#22c55e", glow: "#22c55e", radius: 21 },
        { id: "procrastination", name: "Прокрастинация", color: "#172554", highlight: "#1e3a8a", hazardColor: "#818cf8", glow: "#6366f1", radius: 21 }
    ],

    STORAGE_KEYS: {
        SAVE: 'skuf_save_v3',

        LEGACY_SAVE_V2:
            'skuf_save_v2',

        LEGACY_SAVE_V1:
            'skuf_save_v1',

        STATS:
            'skuf_stats_v1',

        HIGH_SCORE:
            'cyber_skuf_high_score',

        LOCAL_LB:
            'cyber_skuf_local_lb'
    },

    // РЕЛИКВИИ ЗАБЕГА (выбираются при победе над боссом)
    RELICS_POOL: [
        {
            id: "relic_espresso",
            badge: "☕",
            name: "Эспрессо-пулемёт",
            desc: "Сброс мыслей быстрее на 35%. Очки комбо х2",
        },
        {
            id: "relic_beer_shield",
            badge: "🍺",
            name: "Пивной щит",
            desc: "Слияние T8 (Скуф) сжигает весь мусор на поле",
        },
        {
            id: "relic_magnet",
            badge: "🧲",
            name: "Нейро-магнит",
            desc: "Мысли T1-T3 сами притягиваются друг к другу",
        },
        {
            id: "relic_iron_lungs",
            badge: "🫁",
            name: "Железные лёгкие",
            desc: "Дыхалка Скуфа восстанавливается в 2.5 раза быстрее",
        },
        {
            id: "relic_skull_wall",
            badge: "🧠",
            name: "Стены из гипса",
            desc: "Череп расширяется на +24px до конца текущего забега",
        },
        {
            id: "relic_stream_rig",
            badge: "💻",
            name: "Спонсорский контракт",
            desc: "Пассивный доход моментально +250/сек",
        },
        {
            id: "relic_pillow",
            badge: "🛌",
            name: "Ортопедическая подушка",
            desc: "Максимальная выносливость +50%, усталость наступает реже",
        },
        {
            id: "relic_golden_cat",
            badge: "🐱",
            name: "Золотой Квадробер",
            desc: "Слияние T1 дает +1,500 Мотивации и пассив +300/сек",
        },
        {
            id: "relic_flash_master",
            badge: "⚡",
            name: "Повелитель времени",
            desc: "Расходник «Флэш» длится 25 секунд вместо 12",
        },
        {
            id: "relic_chain_blast",
            badge: "💥",
            name: "Цепной взрыв",
            desc: "Слияния T5+ вызывают ударную волну, очищающую экран от мусора",
        },
        {
            id: "relic_banker",
            badge: "💎",
            name: "Швейцарский счет",
            desc: "Весь доход от слияний и кликов умножается на х1.5",
        },
        {
            id: "relic_boss_hunter",
            badge: "🎯",
            name: "Охотник на боссов",
            desc: "Урон по боссу увеличен на +75%",
        }
    ],

    // ГЛУБОКОЕ ДЕРЕВО ПРОКАЧКИ (4 КАТЕГОРИИ, 9 СТУПЕНЕЙ В КАЖДОЙ)
    UPGRADES: {
        hero: [
            { id: "h1", name: "Гантели из бетона", desc: "Появляются в комнате. Клики наносят x3 урона", cost: 250, bought: false, level: 1 },
            { id: "h2", name: "Протеиновый шейк", desc: "Клики х5. Шанс крита 15% на x8 урона", cost: 1600, bought: false, level: 2 },
            { id: "h3", name: "Ледяной душ и Закалка", desc: "Дыхалка восстанавливается на +100% быстрее", cost: 11000, bought: false, level: 3 },
            { id: "h4", name: "Стильный смокинг и Перстень", desc: "Клики х15. Критический урон возрастает до x15", cost: 75000, bought: false, level: 4 },
            { id: "h5", name: "Кибернетическая рука", desc: "Клики х40. Наносит авто-удары раз в 1.5 секунды", cost: 550000, bought: false, level: 5 },
            { id: "h6", name: "Титановый экзоскелет", desc: "Клики х120. Дыхалка больше никогда не падает до нуля", cost: 4200000, bought: false, level: 6 },
            { id: "h7", name: "Ядерный Реактор в Груди", desc: "Клики х450. Шанс крита возрастает до 30%", cost: 35000000, bought: false, level: 7 },
            { id: "h8", name: "АУРА ГИГАЧАДА", desc: "Клики х1800. Боссы получают пассивный урон от взгляда", cost: 320000000, bought: false, level: 8 },
            { id: "h9", name: "ДЕМИУРГ РЕАЛЬНОСТИ", desc: "Клики х8000. Криты наносят x50 колоссального урона", cost: 3000000000, bought: false, level: 9 }
        ],
        room: [
            { id: "r1", name: "Генеральная уборка", desc: "Чистый пол, выброшена пицца. Доход +12/сек", cost: 180, bought: false, level: 1 },
            { id: "r2", name: "RGB Игровой ПК", desc: "Светящийся стол в углу. Доход +65/сек", cost: 1200, bought: false, level: 2 },
            { id: "r3", name: "Мини-пивоварня", desc: "Балтика в углу. Доход +320/сек и +1 пиво раз в 3 мин", cost: 8500, bought: false, level: 3 },
            { id: "r4", name: "Стойка Майнинг-фермы", desc: "Сервер с диодами. Доход +1,600/сек", cost: 55000, bought: false, level: 4 },
            { id: "r5", name: "Умный Дом и Робот-пылесос", desc: "Авто-комфорт. Доход +8,500/сек", cost: 380000, bought: false, level: 5 },
            { id: "r6", name: "Личный дата-центр", desc: "Король интернета. Доход +45,000/сек", cost: 2800000, bought: false, level: 6 },
            { id: "r7", name: "Неоновый Сити-Пентхаус", desc: "Золотая мебель и панорама. Доход +250,000/сек", cost: 22000000, bought: false, level: 7 },
            { id: "r8", name: "Космическая Оранжерея", desc: "Доход +1,500,000/сек. Скуф живет в невесомости", cost: 180000000, bought: false, level: 8 },
            { id: "r9", name: "Орбитальная Сфера Дайсона", desc: "Энергия звезды. Доход +12,000,000/сек", cost: 1800000000, bought: false, level: 9 }
        ],
        brain: [
            { id: "b1", name: "Распил черепа I", desc: "Стакан расширяется на +18px. Больше простора!", cost: 350, bought: false, level: 1 },
            { id: "b2", name: "Скоростные синапсы", desc: "Кулдаун сброса мыслей снижен до 240 мс", cost: 2400, bought: false, level: 2 },
            { id: "b3", name: "Встряска мозга II", desc: "Кулдаун встряски снижен с 12 до 5 секунд", cost: 15000, bought: false, level: 3 },
            { id: "b4", name: "Осознанность и Дзен", desc: "Мусорные мысли падают на 60% реже", cost: 100000, bought: false, level: 4 },
            { id: "b5", name: "Распил черепа II", desc: "Стакан расширяется еще на +26px", cost: 750000, bought: false, level: 5 },
            { id: "b6", name: "Комбо-Стрик Мастер", desc: "Время жизни комбо +3.5 сек. Множитель комбо х2", cost: 5500000, bought: false, level: 6 },
            { id: "b7", name: "Третий Глаз Сигмы", desc: "Все слияния наносят тройной урон боссам", cost: 45000000, bought: false, level: 7 },
            { id: "b8", name: "Квантовый Резонанс", desc: "Слияния T6+ мгновенно сжигают весь мусор на поле", cost: 350000000, bought: false, level: 8 },
            { id: "b9", name: "Абсолютный Фокус", desc: "Лихорадка (Fever) длится дольше (+5.5 сек) и дает x3 Мотивации", cost: 2800000000, bought: false, level: 9 }
        ],
        career: [
            { id: "c1", name: "Стрим на Твиче", desc: "Донаты зрителей. Доход +25/сек", cost: 500, bought: false, level: 1 },
            { id: "c2", name: "Торговля Скуфкоином", desc: "Крипто-доход +180/сек", cost: 3800, bought: false, level: 2 },
            { id: "c3", name: "Курсы «Как встать с дивана»", desc: "Инфобизнес. Доход +950/сек", cost: 26000, bought: false, level: 3 },
            { id: "c4", name: "Свой маркетплейс мерча", desc: "Продажа кружек и худи. Доход +5,000/сек", cost: 190000, bought: false, level: 4 },
            { id: "c5", name: "IT-Стартап «База AI»", desc: "Инвестиции фондов. Доход +30,000/сек", cost: 1500000, bought: false, level: 5 },
            { id: "c6", name: "Выкуп Дома у Тамары", desc: "Тамара платит аренду сама! Доход +180,000/сек", cost: 12000000, bought: false, level: 6 },
            { id: "c7", name: "Мировая Корпорация Скуфа", desc: "Доход +1,100,000/сек. Вы управляете рынками", cost: 100000000, bought: false, level: 7 },
            { id: "c8", name: "Галактический Конгломерат", desc: "Доход +7,500,000/сек. Торговля планетами", cost: 850000000, bought: false, level: 8 },
            { id: "c9", name: "Банк Времени и Бытия", desc: "Доход +55,000,000/сек. Финансовый абсолют", cost: 7000000000, bought: false, level: 9 }
        ]
    },

    // САНСАРА И ПЕРЕРОЖДЕНИЕ (ПРЕСТИЖ НА 8 ПЕРКОВ)
    PRESTIGE_PERKS: [
        { id: "p1", name: "Генетическая База", desc: "+35% ко всей добываемой Мотивации навсегда", cost: 1, level: 0, max: 15 },
        { id: "p2", name: "Благородный Старт", desc: "Каждый уровень повышает стартовую пару мыслей: T2 → T3 → T4", cost: 2, level: 0, max: 3 },
        { id: "p3", name: "Титановые Легкие", desc: "+100 к максимальной Дыхалке за каждый уровень", cost: 2, level: 0, max: 5 },
        { id: "p4", name: "Оффлайн-Магнат", desc: "Лимит сна до 24 часов, оффлайн доход 100%", cost: 3, level: 0, max: 4 },
        { id: "p5", name: "Авто-Мыслитель", desc: "Включает аккуратный авто-сброс мыслей в фоновом режиме", cost: 4, level: 0, max: 1 },
        { id: "p6", name: "Квантовый Череп", desc: "Стакан навсегда на +25px шире с первого дня", cost: 4, level: 0, max: 3 },
        { id: "p7", name: "Охотник на Боссов", desc: "+50% урона по боссам от всех источников за уровень", cost: 3, level: 0, max: 5 },
        { id: "p8", name: "Золотой Конвейер", desc: "+25% к шансу бесплатных расходников и фриспинов", cost: 3, level: 0, max: 4 }
    ],

    // ПУЛ ЕЖЕДНЕВНЫХ КВЕСТОВ (ОБНОВЛЯЕТСЯ КАЖДЫЙ ДЕНЬ В 00:00 ПО МОСКВЕ)
    QUESTS_POOL: [
        { id: "q_taps_1", title: "Разминка костей", desc: "Сделайте 35 тапов по Скуфу", goal: 35, type: "taps", reward: 1200, rewardItem: "beer" },
        { id: "q_taps_2", title: "Массаж дивана", desc: "Сделайте 80 тапов по Скуфу", goal: 80, type: "taps", reward: 3500, rewardItem: "energy" },
        { id: "q_taps_3", title: "Скуф в ярости", desc: "Сделайте 160 тапов по Скуфу", goal: 160, type: "taps", reward: 9000, rewardItem: "bomb" },
        
        { id: "q_merges_1", title: "Первые мысли", desc: "Слейте 30 любых мыслей воедино", goal: 30, type: "merges", reward: 1800, rewardItem: "script" },
        { id: "q_merges_2", title: "Конвейер синапсов", desc: "Слейте 75 любых мыслей", goal: 75, type: "merges", reward: 4500, rewardItem: "beer" },
        { id: "q_merges_3", title: "Нейро-фабрика", desc: "Слейте 160 любых мыслей", goal: 160, type: "merges", reward: 12000, rewardItem: "magnet" },
        
        { id: "q_tier_5", title: "Культ Альтушки", desc: "Слейте 3 мысли уровня «Альтушка (T5)»", goal: 3, type: "tier_5", reward: 5000, rewardItem: "script" },
        { id: "q_tier_7", title: "Совет Старейшин", desc: "Слейте 2 мысли уровня «Дед (T7)»", goal: 2, type: "tier_7", reward: 9000, rewardItem: "beer" },
        { id: "q_tier_8", title: "Клон Скуфа", desc: "Слейте мысль уровня «Скуф (T8)»", goal: 1, type: "tier_8", reward: 15000, rewardItem: "energy" },
        { id: "q_tier_9", title: "Сигма-Движ", desc: "Слейте мысль уровня «Сигма (T9)»", goal: 1, type: "tier_9", reward: 35000, rewardItem: "magnet" },
        { id: "q_gigachad", title: "Рождение Гигачада", desc: "Слейте мысль 10 уровня «ГИГАЧАД»", goal: 1, type: "gigachad", reward: 80000, rewardItem: "bomb" },
        
        { id: "q_trash_1", title: "Голова без долгов", desc: "Уничтожьте 6 мусорных мыслей", goal: 6, type: "trash", reward: 2200, rewardItem: "script" },
        { id: "q_trash_2", title: "Генеральный клининг", desc: "Уничтожьте 15 мусорных мыслей", goal: 15, type: "trash", reward: 6000, rewardItem: "bomb" },
        { id: "q_trash_3", title: "Тотальная детоксикация", desc: "Уничтожьте 30 мусорных мыслей", goal: 30, type: "trash", reward: 16000, rewardItem: "beer" },
        
        { id: "q_combo_1", title: "Серия ударов", desc: "Наберите комбо x4 или выше", goal: 4, type: "combo", reward: 2500, rewardItem: "energy" },
        { id: "q_combo_2", title: "Нейро-шторм", desc: "Наберите комбо x7 или выше", goal: 7, type: "combo", reward: 7500, rewardItem: "script" },
        { id: "q_combo_3", title: "Сигма-Тайфун", desc: "Наберите комбо x10 или выше", goal: 10, type: "combo", reward: 20000, rewardItem: "energy" },
        
        { id: "q_boss_1", title: "Аренда отменяется", desc: "Победите 1 босса", goal: 1, type: "boss", reward: 5000, rewardItem: "beer" },
        { id: "q_boss_2", title: "Уничтожитель тиранов", desc: "Победите 3 боссов за день", goal: 3, type: "boss", reward: 18000, rewardItem: "bomb" },
        
        { id: "q_fever_1", title: "Хайпожор", desc: "Активируйте режим Лихорадки 2 раза", goal: 2, type: "fever", reward: 4000, rewardItem: "energy" },
        { id: "q_fever_2", title: "В огне событий", desc: "Активируйте режим Лихорадки 5 раз", goal: 5, type: "fever", reward: 11000, rewardItem: "magnet" },
        
        { id: "q_wheel_1", title: "Испытание Фортуны", desc: "Прокрутите Колесо Фортуны 2 раза", goal: 2, type: "spins", reward: 3500, rewardItem: "beer" },
        { id: "q_shake_1", title: "Шевеление извилинами", desc: "Используйте встряску мозга 3 раза", goal: 3, type: "shakes", reward: 2800, rewardItem: "script" }
    ],

    // СОБЫТИЯ И ДИЛЕММЫ
    EVENTS_POOL: [
        {
            id: "bank_call",
            icon: "📞",
            title: "Звонок службы безопасности",
            desc: "«По вашей карте замечена подозрительная транзакция в пивном ларьке. Переведите на защищенный счет!»",
            choiceA: {
                title: "Поверить и перевести (+3,500 🗿)",
                penalty: "В голову падает тяжелый «Кредит 💳»",
                action: (game) => {
                    game.addMotivation(3500);
                    game.physics.createGarbage(game.canvas.width / 2, game.dropY, CONFIG.GARBAGE_TYPES[0]);
                }
            },
            choiceB: {
                title: "Послать мошенников",
                penalty: "Скуф взбодрился (+120 к пассиву на 45 сек)",
                action: (game) => {
                    game.eventPassiveBonusTimer = 45;
                    game.eventPassiveBonusAmount = 120;
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
                title: "Зафиксировать прибыль (+8,000 🗿)",
                penalty: "Настроение на высоте!",
                action: (game) => { game.addMotivation(8000); }
            },
            choiceB: {
                title: "Купить ящик расходников",
                penalty: "Получаете +2 Балтики, +2 Скрипта, +2 Флэша",
                action: (game) => {
                    game.items.beer += 2;
                    game.items.script += 2;
                    game.items.energy += 2;
                    game.ui.updateConsumables(game.items);
                    game.saveGame();
                }
            }
        },
        {
            id: "couch_miracle",
            icon: "🛋️",
            title: "Находка под диванной подушкой",
            desc: "Рука нащупала что-то шуршащее в складках старого велюрового дивана...",
            choiceA: {
                title: "Достать заначку (+5,000 🗿)",
                penalty: "Скуф находит купюру пятилетней давности",
                action: (game) => { game.addMotivation(5000); }
            },
            choiceB: {
                title: "Достать старый пульт и батарейку",
                penalty: "Встряска мозга мгновенно перезаряжена",
                action: (game) => { game.shakeCooldown = 0; game.ui.updateShake(0); }
            }
        }
    ],

    // РАСШИРЕННЫЕ ДОСТИЖЕНИЯ (26 АЧИВОК С БОГАТОЙ ПРОГРЕССИЕЙ)
    ACHIEVEMENTS: [
        { id: "first_merge", badge: "🐱", name: "Первое слияние", desc: "Слейте первые две мысли воедино", check: (g) => g.totalMerges >= 1 },
        { id: "merges_25", badge: "🍕", name: "Перекус на диване", desc: "Совершите 25 слияний мыслей", check: (g) => g.totalMerges >= 25 },
        { id: "merges_100", badge: "🧠", name: "Шевеление извилинами", desc: "Совершите 100 слияний мыслей", check: (g) => g.totalMerges >= 100 },
        { id: "merges_300", badge: "⚡", name: "Нейронный шторм", desc: "Совершите 300 слияний мыслей", check: (g) => g.totalMerges >= 300 },
        { id: "merges_1000", badge: "🌌", name: "Владыка Синтеза", desc: "Совершите 1 000 слияний мыслей", check: (g) => g.totalMerges >= 1000 },
        
        { id: "tier_altushka", badge: "🎀", name: "Тяга к прекрасному", desc: "Создайте мысль 5 уровня (Альтушка)", check: (g) => (g.tierCreatedCounts && g.tierCreatedCounts[5] >= 1) || g.gigachadsCreated >= 1 },
        { id: "tier_skuf", badge: "🍺", name: "Зеркальное отражение", desc: "Создайте мысль 8 уровня (Скуф)", check: (g) => (g.tierCreatedCounts && g.tierCreatedCounts[8] >= 1) || g.gigachadsCreated >= 1 },
        { id: "tier_sigma", badge: "🗿", name: "Истинный Сигма", desc: "Создайте мысль 9 уровня (Сигма)", check: (g) => (g.tierCreatedCounts && g.tierCreatedCounts[9] >= 1) || g.gigachadsCreated >= 1 },
        { id: "gigachad", badge: "👑", name: "Явление Гигачада", desc: "Слейте мысль 10 уровня (ГИГАЧАД)", check: (g) => g.gigachadsCreated >= 1 },
        { id: "triple_gigachad", badge: "🌟", name: "Совет Гигачадов", desc: "Создайте 3 Гигачада за всё время", check: (g) => g.gigachadsCreated >= 3 },
        
        { id: "boss_slayer", badge: "👵", name: "Аренда отменяется", desc: "Одолейте первого босса Тамару", check: (g) => g.bossesDefeated >= 1 },
        { id: "bosses_3", badge: "🥊", name: "Разборки на кухне", desc: "Одолейте 3 разных боссов", check: (g) => g.bossesDefeated >= 3 },
        { id: "five_bosses", badge: "🏆", name: "Ветеран превозмогания", desc: "Одолейте 5 разных боссов", check: (g) => g.bossesDefeated >= 5 },
        { id: "bosses_10", badge: "⚔️", name: "Покоритель Судьбы", desc: "Одолейте 10 разных боссов", check: (g) => g.bossesDefeated >= 10 },
        { id: "bosses_20", badge: "🌌", name: "Абсолютный Триумфатор", desc: "Одолейте всех 20 боссов!", check: (g) => g.bossesDefeated >= 20 },
        
        { id: "combo_spark", badge: "✨", name: "Серия искр", desc: "Наберите серию комбо x3", check: (g) => g.maxCombo >= 3 },
        { id: "combo_master", badge: "🔥", name: "Нейро-вихрь", desc: "Наберите серию комбо x6", check: (g) => g.maxCombo >= 6 },
        { id: "combo_typhoon", badge: "🌪️", name: "Сигма-Тайфун", desc: "Наберите рекордное комбо x10", check: (g) => g.maxCombo >= 10 },
        
        { id: "cash_10k", badge: "💵", name: "Заначка в носке", desc: "Накопите 10 000 Мотивации", check: (g) => g.motivation >= 10000 || g.totalMotivationEarned >= 10000 },
        { id: "rich_skuf", badge: "💰", name: "Крипто-магнат", desc: "Накопите более 250 000 Мотивации", check: (g) => g.motivation >= 250000 || g.totalMotivationEarned >= 250000 },
        { id: "cash_5m", badge: "🏦", name: "Финансовый Демиург", desc: "Заработайте суммарно 5 000 000 Мотивации", check: (g) => g.totalMotivationEarned >= 5000000 },
        
        { id: "clean_freak", badge: "🧹", name: "Чистый разум", desc: "Уничтожьте 10 мусорных тревожных мыслей", check: (g) => g.trashDestroyed >= 10 },
        { id: "clean_master", badge: "✨", name: "Тотальный Дзен", desc: "Уничтожьте 50 мусорных мыслей", check: (g) => g.trashDestroyed >= 50 },
        
        { id: "skuf_tapper", badge: "🛋️", name: "Властелин Дивана", desc: "Сделайте 100 ударов по Скуфу", check: (g) => g.totalTaps >= 100 },
        { id: "lucky_wheel", badge: "🎡", name: "Любимчик Фортуны", desc: "Прокрутите Колесо Фортуны 5 раз", check: (g) => g.totalSpins >= 5 },
        { id: "rebirth", badge: "🌀", name: "Выход из матрицы", desc: "Совершите свое первое Перерождение (Сансара)", check: (g) => g.prestigeLevel >= 1 || g.prestigeCouches >= 1 }
    ],

    // РАСЧЕТ ДАТЫ И ВРЕМЕНИ ПО МОСКВЕ (UTC+3) ДЛЯ ЕЖЕДНЕВНЫХ КВЕСТОВ
    getMoscowDateKey() {
        try {
            const now = new Date();
            // Смещение UTC+3 в миллисекундах (3 * 3600 * 1000)
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const mskDate = new Date(utc + (3 * 3600000));
            const y = mskDate.getFullYear();
            const m = String(mskDate.getMonth() + 1).padStart(2, '0');
            const d = String(mskDate.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        } catch (e) {
            return new Date().toISOString().slice(0, 10);
        }
    },

    getMsUntilMoscowMidnight() {
        try {
            const now = new Date();
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const mskNow = new Date(utc + (3 * 3600000));
            
            const nextMidnightMSK = new Date(mskNow);
            nextMidnightMSK.setHours(24, 0, 0, 0);
            
            return Math.max(1000, nextMidnightMSK.getTime() - mskNow.getTime());
        } catch (e) {
            return 3600000;
        }
    },

    formatTimeHMS(ms) {
        const totalSec = Math.max(0, Math.floor(ms / 1000));
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    },

    // ФОРМАТИРОВАНИЕ ЧИСЕЛ С БУКВАМИ (1К, 1М, 1B, 1T, 1Qa, 1Qi, 1Sx, 1Sp, 1Oc, 1No, 1Dc...)
    formatNumber(num) {
        if (num === null || num === undefined || isNaN(num)) return "0";
        const sign = num < 0 ? "-" : "";
        const abs = Math.abs(num);
        if (abs < 1000) {
            return sign + Math.floor(abs).toString();
        }

        const suffixes = [
            { v: 1e93, s: "Tg" },
            { v: 1e90, s: "NoVg" },
            { v: 1e87, s: "OcVg" },
            { v: 1e84, s: "SpVg" },
            { v: 1e81, s: "SxVg" },
            { v: 1e78, s: "QiVg" },
            { v: 1e75, s: "QaVg" },
            { v: 1e72, s: "TVg" },
            { v: 1e69, s: "DVg" },
            { v: 1e66, s: "UVg" },
            { v: 1e63, s: "Vg" },
            { v: 1e60, s: "NoDc" },
            { v: 1e57, s: "OcDc" },
            { v: 1e54, s: "SpDc" },
            { v: 1e51, s: "SxDc" },
            { v: 1e48, s: "QiDc" },
            { v: 1e45, s: "QaDc" },
            { v: 1e42, s: "TDc" },
            { v: 1e39, s: "DDc" },
            { v: 1e36, s: "UDc" },
            { v: 1e33, s: "Dc" },
            { v: 1e30, s: "No" },
            { v: 1e27, s: "Oc" },
            { v: 1e24, s: "Sp" },
            { v: 1e21, s: "Sx" },
            { v: 1e18, s: "Qi" },
            { v: 1e15, s: "Qa" },
            { v: 1e12, s: "T" },
            { v: 1e9,  s: "B" },
            { v: 1e6,  s: "M" },
            { v: 1e3,  s: "K" }
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

    // КОЛЕСО ФОРТУНЫ / РУЛЕТКА
    ROULETTE_SECTORS: [
        { label: "💨 Пшик", desc: "Пусто! Повезёт позже", color: "#475569", weight: 34, prize: { type: 'empty' } },
        { label: "💣 Бомба", desc: "+1 Петарда", color: "#ef4444", weight: 16, prize: { type: 'item', item: 'bomb', count: 1 } },
        { label: "🧲 Магнит", desc: "+1 Магнит", color: "#8b5cf6", weight: 10, prize: { type: 'item', item: 'magnet', count: 1 } },
        { label: "⚡ Флэш", desc: "+1 Энергетик", color: "#06b6d4", weight: 15, prize: { type: 'item', item: 'energy', count: 1 } },
        { label: "🍺 Балтика", desc: "+1 Балтика", color: "#f59e0b", weight: 15, prize: { type: 'item', item: 'beer', count: 1 } },
        { label: "🗿 +5K", desc: "+5,000 Мотивации", color: "#10b981", weight: 7, prize: { type: 'motivation', amount: 5000 } },
        { label: "🛋️ +1 Диван", desc: "+1 Золотой Диван", color: "#a855f7", weight: 2.2, prize: { type: 'prestige', amount: 1 } },
        { label: "👑 ДЖЕКПОТ", desc: "Суперприз +50K!", color: "#ffd700", weight: 0.8, prize: { type: 'jackpot' } }
    ],

    // ХАЙП-РАНГИ (8 ТИТУЛОВ СКУФА С ПЕРЕСЧИТАННЫМИ ПОРОГАМИ)
    RANKS: [
        { title: "🛋️ Тюбик с дивана", req: 0, badge: "РАНГ 1", desc: "Смотрит рилсы 14 часов подряд" },
        { title: "🎀 Альтушка-хантер", req: 5000, badge: "РАНГ 2", desc: "Пытается скачать Госуслуги" },
        { title: "🍺 Скуф-Специалист", req: 40000, badge: "РАНГ 3", desc: "Разбирается в танках и скидках" },
        { title: "🕶️ Мастер Мемов", req: 300000, badge: "РАНГ 4", desc: "Понимает постиронию и скибиди" },
        { title: "🗿 Сигма-Самец", req: 2500000, badge: "РАНГ 5", desc: "Преисполнился в познании покоя" },
        { title: "👑 Гигачад Метавселенной", req: 20000000, badge: "РАНГ 6", desc: "Встал с дивана обеими ногами!" },
        { title: "🌌 Повелитель Дивана", req: 150000000, badge: "РАНГ 7", desc: "Диван парит в стратосфере" },
        { title: "👑 АБСОЛЮТНЫЙ ДЕМИУРГ", req: 1000000000, badge: "РАНГ 8", desc: "Создатель вечного кайфа" }
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
    ],

    // --- ВЕКТОРНЫЙ РЕНДЕР МОДЕЛЕЙ ПЕРСОНАЖЕЙ (10 ТИРОВ) ---
    drawCharacterVector(ctx, tier, radius, options = {}) {
        const conf = this.TIERS[tier] || this.TIERS[1];
        const r = radius || conf.radius || 20;
        const fx = options.fx !== false;
        const isAim = !!options.isAim;

        ctx.save();

        // Нормирование к системе координат [-32, +32]
        const s = r / 32;
        ctx.scale(s, s);

        // 1. Внешняя база сферы с объемным градиентом
        const sphereGrad = ctx.createRadialGradient(-10, -10, 3, 0, 0, 32);
        sphereGrad.addColorStop(0, conf.color);
        sphereGrad.addColorStop(0.75, conf.glow || conf.color);
        sphereGrad.addColorStop(1, '#090d16');
        ctx.fillStyle = sphereGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.fill();

        // 2. Отрисовка уникального персонажа по тиру
        switch (tier) {
            case 1: {
                // T1: КВАДРОБЕР (🐱 Зеленый, кошачьи ушки, аниме мордочка, усики)
                ctx.fillStyle = "#22c55e";
                ctx.beginPath();
                ctx.moveTo(-16, -22);
                ctx.lineTo(-26, -34);
                ctx.lineTo(-6, -26);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(16, -22);
                ctx.lineTo(26, -34);
                ctx.lineTo(6, -26);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = "#f472b6";
                ctx.beginPath();
                ctx.moveTo(-15, -23); ctx.lineTo(-22, -31); ctx.lineTo(-8, -26); ctx.closePath(); ctx.fill();
                ctx.beginPath();
                ctx.moveTo(15, -23); ctx.lineTo(22, -31); ctx.lineTo(8, -26); ctx.closePath(); ctx.fill();

                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.ellipse(-10, -4, 6.5, 8.5, 0, 0, Math.PI * 2);
                ctx.ellipse(10, -4, 6.5, 8.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#15803d";
                ctx.beginPath();
                ctx.arc(-9, -4, 4.5, 0, Math.PI * 2);
                ctx.arc(11, -4, 4.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(-11, -6, 2, 0, Math.PI * 2);
                ctx.arc(9, -6, 2, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "#f43f5e";
                ctx.beginPath();
                ctx.moveTo(0, 4); ctx.lineTo(-4, 0); ctx.lineTo(4, 0); ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = "#166534";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(-4, 7, 4, 0, Math.PI);
                ctx.arc(4, 7, 4, 0, Math.PI);
                ctx.stroke();

                ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(-12, 4); ctx.lineTo(-24, 2);
                ctx.moveTo(-12, 7); ctx.lineTo(-25, 9);
                ctx.moveTo(12, 4); ctx.lineTo(24, 2);
                ctx.moveTo(12, 7); ctx.lineTo(25, 9);
                ctx.stroke();
                break;
            }
            case 2: {
                // T2: СИМП (🥺 Голубой, умоляющие щенячьи глаза, румянец, сердечко)
                ctx.fillStyle = "rgba(244, 114, 182, 0.45)";
                ctx.beginPath();
                ctx.ellipse(-15, 8, 7, 4, 0, 0, Math.PI * 2);
                ctx.ellipse(15, 8, 7, 4, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "#0f172a";
                ctx.beginPath();
                ctx.arc(-10, -3, 9, 0, Math.PI * 2);
                ctx.arc(10, -3, 9, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "#38bdf8";
                ctx.beginPath();
                ctx.arc(-10, -2, 7, 0, Math.PI * 2);
                ctx.arc(10, -2, 7, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(-12, -6, 3.8, 0, Math.PI * 2);
                ctx.arc(8, -6, 3.8, 0, Math.PI * 2);
                ctx.arc(-8, 1, 1.8, 0, Math.PI * 2);
                ctx.arc(12, 1, 1.8, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = "#0369a1";
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.arc(0, 15, 6, Math.PI * 1.15, Math.PI * 1.85);
                ctx.stroke();

                ctx.fillStyle = "#ec4899";
                ctx.beginPath();
                ctx.moveTo(0, -22);
                ctx.bezierCurveTo(-6, -28, -12, -22, -6, -16);
                ctx.lineTo(0, -10);
                ctx.lineTo(6, -16);
                ctx.bezierCurveTo(12, -22, 6, -28, 0, -22);
                ctx.fill();
                break;
            }
            case 3: {
                // T3: ТЮБИК (🧪 Индиго, кудряшки-брокколи, круглые золотые очки)
                ctx.fillStyle = "#4338ca";
                for (let ox of [-16, -9, 0, 9, 16]) {
                    ctx.beginPath();
                    ctx.arc(ox, -20, 7.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                for (let ox of [-12, -4, 4, 12]) {
                    ctx.beginPath();
                    ctx.arc(ox, -25, 6.5, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.strokeStyle = "#fbbf24";
                ctx.lineWidth = 2.4;
                ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
                ctx.beginPath();
                ctx.arc(-10, -1, 8.5, 0, Math.PI * 2);
                ctx.fill(); ctx.stroke();
                ctx.beginPath();
                ctx.arc(10, -1, 8.5, 0, Math.PI * 2);
                ctx.fill(); ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(-1.5, -1); ctx.lineTo(1.5, -1);
                ctx.stroke();

                ctx.fillStyle = "#1e1b4b";
                ctx.beginPath();
                ctx.arc(-8, -1, 3.5, 0, Math.PI * 2);
                ctx.arc(8, -1, 3.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = "#312e81";
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.moveTo(-6, 14);
                ctx.quadraticCurveTo(2, 12, 10, 16);
                ctx.stroke();
                break;
            }
            case 4: {
                // T4: ЗУМЕР (🧢 Фиолетовый, кепка козырьком назад, узкие темные очки, AirPods)
                ctx.fillStyle = "#7e22ce";
                ctx.beginPath();
                ctx.arc(0, -14, 20, Math.PI * 0.9, Math.PI * 2.1);
                ctx.fill();
                ctx.fillStyle = "#6b21a8";
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(-22, -15, 44, 7, 3) : ctx.rect(-22, -15, 44, 7);
                ctx.fill();

                ctx.fillStyle = "#09090b";
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(-22, -4, 44, 9, 3) : ctx.rect(-22, -4, 44, 9);
                ctx.fill();
                ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
                ctx.beginPath();
                ctx.moveTo(-16, -2); ctx.lineTo(-10, 3); ctx.lineTo(-6, 3); ctx.lineTo(-12, -2); ctx.fill();
                ctx.beginPath();
                ctx.moveTo(6, -2); ctx.lineTo(12, 3); ctx.lineTo(16, 3); ctx.lineTo(10, -2); ctx.fill();

                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(-24, 6, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(-25, 6, 2.5, 7);
                ctx.beginPath();
                ctx.arc(24, 6, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(22.5, 6, 2.5, 7);

                ctx.strokeStyle = "#581c87";
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.arc(0, 14, 5, 0, Math.PI);
                ctx.stroke();
                break;
            }
            case 5: {
                // T5: АЛЬТУШКА (🎀 Розовая, два хвостика с бантиками, готический макияж, чокер)
                ctx.fillStyle = "#ec4899";
                ctx.beginPath();
                ctx.ellipse(-23, -12, 9, 14, -0.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#18181b";
                ctx.beginPath();
                ctx.ellipse(23, -12, 9, 14, 0.4, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "#09090b";
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(-10, 22, 20, 4, 1) : ctx.rect(-10, 22, 20, 4);
                ctx.fill();
                ctx.strokeStyle = "#e2e8f0";
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.arc(0, 24, 2.2, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = "#0f172a";
                ctx.beginPath();
                ctx.moveTo(-18, -4); ctx.lineTo(-6, -6); ctx.lineTo(-4, -1); ctx.lineTo(-15, 1); ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(18, -4); ctx.lineTo(6, -6); ctx.lineTo(4, -1); ctx.lineTo(15, 1); ctx.closePath();
                ctx.fill();

                ctx.fillStyle = "#f472b6";
                ctx.beginPath();
                ctx.arc(-10, -2, 3.5, 0, Math.PI * 2);
                ctx.arc(10, -2, 3.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "#831843";
                ctx.beginPath();
                ctx.arc(0, 12, 4, 0, Math.PI);
                ctx.fill();

                ctx.fillStyle = "#fb7185";
                ctx.beginPath();
                ctx.arc(-22, -18, 4, 0, Math.PI * 2);
                ctx.arc(22, -18, 4, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 6: {
                // T6: МАСИК (🧸 Розово-бежевый, капюшон с ушками мишки, добрые глаза, уютный шарф)
                ctx.fillStyle = "#f43f5e";
                ctx.beginPath();
                ctx.arc(-22, -20, 7, 0, Math.PI * 2);
                ctx.arc(22, -20, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#fecdd3";
                ctx.beginPath();
                ctx.arc(-22, -20, 4, 0, Math.PI * 2);
                ctx.arc(22, -20, 4, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "#fda4af";
                ctx.beginPath();
                ctx.arc(0, 2, 22, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "#1e293b";
                ctx.beginPath();
                ctx.arc(-8, -1, 3.2, 0, Math.PI * 2);
                ctx.arc(8, -1, 3.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(-9, -2, 1.2, 0, Math.PI * 2);
                ctx.arc(7, -2, 1.2, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "#fb7185";
                ctx.beginPath();
                ctx.ellipse(0, 5, 3.5, 2.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = "#881337";
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.arc(0, 9, 4, 0, Math.PI);
                ctx.stroke();

                ctx.fillStyle = "#e11d48";
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(-16, 18, 32, 7, 3) : ctx.rect(-16, 18, 32, 7);
                ctx.fill();
                break;
            }
            case 7: {
                // T7: ДЕД (👴 Оранжевый, кепка-восьмиклинка, пышные белые усы, круглые очки)
                ctx.fillStyle = "#7c2d12";
                ctx.beginPath();
                ctx.ellipse(0, -16, 21, 11, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#9a3412";
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(-22, -13, 44, 5, 2) : ctx.rect(-22, -13, 44, 5);
                ctx.fill();

                ctx.strokeStyle = "#e2e8f0";
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.arc(-10, -2, 7, 0, Math.PI * 2);
                ctx.arc(10, -2, 7, 0, Math.PI * 2);
                ctx.moveTo(-3, -2); ctx.lineTo(3, -2);
                ctx.stroke();

                ctx.fillStyle = "#0f172a";
                ctx.beginPath();
                ctx.arc(-10, -2, 2.8, 0, Math.PI * 2);
                ctx.arc(10, -2, 2.8, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "#f8fafc";
                ctx.beginPath();
                ctx.moveTo(-16, 6);
                ctx.quadraticCurveTo(-7, 2, 0, 6);
                ctx.quadraticCurveTo(7, 2, 16, 6);
                ctx.quadraticCurveTo(11, 16, 0, 11);
                ctx.quadraticCurveTo(-11, 16, -16, 6);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = "#cbd5e1";
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.fillStyle = "#ea580c";
                ctx.beginPath();
                ctx.ellipse(0, 1, 3.5, 3, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 8: {
                // T8: СКУФ (🛋️ Золотистый шар-скуф, залысина с зачесом, 3-дневная щетина, майка)
                ctx.fillStyle = "#522e18";
                ctx.beginPath();
                ctx.arc(-22, -10, 8, 0, Math.PI * 2);
                ctx.arc(22, -10, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#fde047";
                ctx.beginPath();
                ctx.ellipse(0, -18, 16, 10, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = "#522e18";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-15, -20); ctx.quadraticCurveTo(0, -24, 15, -18);
                ctx.moveTo(-12, -17); ctx.quadraticCurveTo(0, -20, 12, -15);
                ctx.stroke();

                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(-9, -4, 5.5, 0, Math.PI * 2);
                ctx.arc(9, -4, 5.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#854d0e";
                ctx.beginPath();
                ctx.arc(-8, -4, 3, 0, Math.PI * 2);
                ctx.arc(10, -4, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(-9, -5.5, 1.2, 0, Math.PI * 2);
                ctx.arc(9, -5.5, 1.2, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "#ca8a04";
                ctx.beginPath();
                ctx.arc(0, 1, 4.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "rgba(100, 70, 40, 0.4)";
                for (let px = -12; px <= 12; px += 4) {
                    for (let py = 6; py <= 15; py += 3) {
                        if (Math.hypot(px, py - 9) < 11) {
                            ctx.beginPath();
                            ctx.arc(px + (py % 2), py, 0.8, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                }

                ctx.strokeStyle = "#713f12";
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.arc(0, 8, 6, 0.2, Math.PI - 0.2);
                ctx.stroke();

                ctx.fillStyle = "#f8fafc";
                ctx.beginPath();
                ctx.moveTo(-18, 32);
                ctx.lineTo(-14, 21);
                ctx.quadraticCurveTo(0, 27, 14, 21);
                ctx.lineTo(18, 32);
                ctx.closePath();
                ctx.fill();
                break;
            }
            case 9: {
                // T9: СИГМА (🗿 Фиолетово-стальной, резкие скулы, hunter eyes, ухмылка)
                ctx.fillStyle = "#7c3aed";
                ctx.beginPath();
                ctx.moveTo(0, -24);
                ctx.lineTo(18, -12);
                ctx.lineTo(22, 4);
                ctx.lineTo(14, 18);
                ctx.lineTo(0, 25);
                ctx.lineTo(-14, 18);
                ctx.lineTo(-22, 4);
                ctx.lineTo(-18, -12);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = "#1e1b4b";
                ctx.beginPath();
                ctx.moveTo(-18, -12);
                ctx.lineTo(0, -27);
                ctx.lineTo(18, -12);
                ctx.lineTo(10, -13);
                ctx.lineTo(0, -18);
                ctx.lineTo(-10, -13);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = "#0f172a";
                ctx.fillRect(-14, -3, 10, 4);
                ctx.fillRect(4, -3, 10, 4);
                ctx.fillStyle = "#a855f7";
                ctx.shadowColor = "#c084fc";
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(-9, -1, 1.8, 0, Math.PI * 2);
                ctx.arc(9, -1, 1.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                ctx.strokeStyle = "#475569";
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.moveTo(0, -7); ctx.lineTo(-1, 5); ctx.lineTo(3, 5);
                ctx.stroke();

                ctx.strokeStyle = "#334155";
                ctx.lineWidth = 2.4;
                ctx.beginPath();
                ctx.moveTo(-7, 12);
                ctx.lineTo(2, 12);
                ctx.lineTo(6, 9);
                ctx.stroke();
                break;
            }
            case 10: {
                // T10: ГИГАЧАД (👑 Золотой, королевская корона, идеальная борода, лучезарная улыбка)
                ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
                ctx.lineWidth = 1.5;
                for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(a) * 26, Math.sin(a) * 26);
                    ctx.lineTo(Math.cos(a) * 32, Math.sin(a) * 32);
                    ctx.stroke();
                }

                ctx.fillStyle = "#facc15";
                ctx.beginPath();
                ctx.moveTo(-16, -13);
                ctx.lineTo(-20, -26);
                ctx.lineTo(-9, -20);
                ctx.lineTo(0, -30);
                ctx.lineTo(9, -20);
                ctx.lineTo(20, -26);
                ctx.lineTo(16, -13);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = "#b45309";
                ctx.lineWidth = 1.2;
                ctx.stroke();
                ctx.fillStyle = "#ef4444";
                ctx.beginPath();
                ctx.arc(0, -21, 2.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "#fef08a";
                ctx.beginPath();
                ctx.moveTo(0, -14);
                ctx.lineTo(17, -7);
                ctx.lineTo(18, 5);
                ctx.lineTo(12, 18);
                ctx.lineTo(0, 24);
                ctx.lineTo(-12, 18);
                ctx.lineTo(-18, 5);
                ctx.lineTo(-17, -7);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = "#18181b";
                ctx.beginPath();
                ctx.moveTo(-18, 2);
                ctx.lineTo(-12, 18);
                ctx.lineTo(0, 24);
                ctx.lineTo(12, 18);
                ctx.lineTo(18, 2);
                ctx.lineTo(14, 5);
                ctx.lineTo(8, 14);
                ctx.lineTo(0, 16);
                ctx.lineTo(-8, 14);
                ctx.lineTo(-14, 5);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = "#0f172a";
                ctx.fillRect(-13, -4, 9, 4);
                ctx.fillRect(4, -4, 9, 4);
                ctx.fillStyle = "#22d3ee";
                ctx.shadowColor = "#06b6d4";
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(-8, -2, 2, 0, Math.PI * 2);
                ctx.arc(8, -2, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(-8, 7, 16, 5, 2) : ctx.rect(-8, 7, 16, 5);
                ctx.fill();
                ctx.strokeStyle = "#18181b";
                ctx.lineWidth = 1;
                ctx.stroke();
                break;
            }
        }

        // 3. Объемный сферический 3D-блик
        if (fx) {
            const shine = ctx.createRadialGradient(-11, -11, 1, 0, 0, 32);
            shine.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
            shine.addColorStop(0.3, 'rgba(255, 255, 255, 0.08)');
            shine.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
            shine.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
            ctx.beginPath();
            ctx.arc(0, 0, 32, 0, Math.PI * 2);
            ctx.fillStyle = shine;
            ctx.fill();
        }

        // 4. Окантовка круга
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.lineWidth = isAim ? 2.5 : 1.6;
        ctx.strokeStyle = isAim ? 'rgba(255, 255, 255, 0.95)' : (conf.color || '#ffffff');
        ctx.stroke();

        // 5. Мини-бейдж с номером тира T1-T10
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.arc(19, 19, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = conf.color;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`T${tier}`, 19, 19.5);

        ctx.restore();
    },

    // Кэширование DataURL для использования в HTML <img>
    _charCache: {},
    getCharacterDataURL(tier, size = 64) {
        const key = `${tier}_${size}`;
        if (this._charCache[key]) return this._charCache[key];

        if (typeof document === 'undefined') return '';
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';

        ctx.translate(size / 2, size / 2);
        this.drawCharacterVector(ctx, tier, size / 2 - 2, { fx: true, isAim: false });
        
        try {
            const url = canvas.toDataURL('image/png');
            this._charCache[key] = url;
            return url;
        } catch (e) {
            return '';
        }
    },

    // ВЕКТОРНАЯ ОТРИСОВКА ТРЕВОЖНЫХ (МУСОРНЫХ) МЫСЛЕЙ
    drawGarbageVector(ctx, garbageIndexOrId, radius, options = {}) {
        const fx = options.fx !== false;
        const isAim = !!options.isAim;
        
        let index = 0;
        if (typeof garbageIndexOrId === 'number') {
            index = Math.abs(garbageIndexOrId) % 8;
        } else if (typeof garbageIndexOrId === 'string') {
            const found = this.GARBAGE_TYPES.findIndex(g => g.name === garbageIndexOrId || g.id === garbageIndexOrId);
            index = found !== -1 ? found : 0;
        }
        
        const gConf = this.GARBAGE_TYPES[index] || this.GARBAGE_TYPES[0];
        const r = radius || 20;

        ctx.save();
        const scale = r / 20;
        ctx.scale(scale, scale);

        // 1. Опасная тёмная пульсирующая аура (при включенном FX)
        if (fx) {
            ctx.shadowColor = gConf.glow || '#ef4444';
            ctx.shadowBlur = isAim ? 14 : 8;
        }

        // 2. Базовый фон шара (Тёмный градиент с опасным оттенком)
        const bgGrad = ctx.createRadialGradient(-5, -5, 2, 0, 0, 20);
        bgGrad.addColorStop(0, gConf.highlight || '#334155');
        bgGrad.addColorStop(0.7, gConf.color || '#0f172a');
        bgGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bgGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        // 3. Предупреждающая зубчатая / опасная окантовка (Hazard border)
        ctx.strokeStyle = gConf.hazardColor || '#ef4444';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(0, 0, 19, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // 4. Уникальная детализированная векторная графика для каждого типа
        ctx.shadowBlur = 0;
        switch (index) {
            case 0: {
                // КРЕДИТ / ДОЛГИ (Банковская карта с золотым чипом и предупреждением)
                ctx.fillStyle = '#0f172a';
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(-12, -8, 24, 16, 2.5) : ctx.rect(-12, -8, 24, 16);
                ctx.fill();
                ctx.stroke();

                // Золотой чип
                ctx.fillStyle = '#fbbf24';
                ctx.fillRect(-9, -4, 6, 5);
                ctx.strokeStyle = '#78350f';
                ctx.lineWidth = 0.6;
                ctx.strokeRect(-9, -4, 6, 5);

                // Полоса
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(0, -4, 9, 2);
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(0, 0, 9, 1.5);
                
                // Знак процента %
                ctx.font = 'bold 8px system-ui, sans-serif';
                ctx.fillStyle = '#ef4444';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('%', 5, 3);
                break;
            }
            case 1: {
                // БЫВШАЯ / РАЗБИТОЕ СЕРДЦЕ (Неоновое расколотое сердце со швами)
                ctx.fillStyle = '#ec4899';
                ctx.beginPath();
                ctx.moveTo(0, 7);
                ctx.bezierCurveTo(-11, 2, -13, -7, -6, -9);
                ctx.bezierCurveTo(-2, -9, -1, -6, 0, -4);
                ctx.lineTo(-2, -1);
                ctx.lineTo(2, 2);
                ctx.lineTo(0, 7);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = '#db2777';
                ctx.beginPath();
                ctx.moveTo(0, 7);
                ctx.bezierCurveTo(11, 2, 13, -7, 6, -9);
                ctx.bezierCurveTo(2, -9, 1, -6, 0, -4);
                ctx.lineTo(-2, -1);
                ctx.lineTo(2, 2);
                ctx.lineTo(0, 7);
                ctx.closePath();
                ctx.fill();

                // Трещина / шов
                ctx.strokeStyle = '#020617';
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.moveTo(0, -4);
                ctx.lineTo(-2, -1);
                ctx.lineTo(2, 2);
                ctx.lineTo(0, 7);
                ctx.stroke();

                // Швы
                ctx.strokeStyle = '#fbcfe8';
                ctx.lineWidth = 0.9;
                ctx.beginPath();
                ctx.moveTo(-3, -2); ctx.lineTo(1, 0);
                ctx.moveTo(0, 1); ctx.lineTo(4, 3);
                ctx.stroke();
                break;
            }
            case 2: {
                // ЛЕНЬ / АМБАРНЫЙ ЗАМОК (Тяжёлый висячий замок)
                ctx.fillStyle = '#475569';
                ctx.strokeStyle = '#cbd5e1';
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.arc(0, -4, 6.5, Math.PI, 0);
                ctx.stroke();

                const lockGrad = ctx.createLinearGradient(0, -3, 0, 10);
                lockGrad.addColorStop(0, '#64748b');
                lockGrad.addColorStop(1, '#1e293b');
                ctx.fillStyle = lockGrad;
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(-9, -3, 18, 14, 3) : ctx.rect(-9, -3, 18, 14);
                ctx.fill();
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 1;
                ctx.stroke();

                // Скважина
                ctx.fillStyle = '#020617';
                ctx.beginPath();
                ctx.arc(0, 2, 2, 0, Math.PI * 2);
                ctx.moveTo(-1.2, 2);
                ctx.lineTo(1.2, 2);
                ctx.lineTo(0.8, 7);
                ctx.lineTo(-0.8, 7);
                ctx.closePath();
                ctx.fill();
                break;
            }
            case 3: {
                // ДЕДЛАЙН / СЕКУНДОМЕР В ОГНЕ
                ctx.fillStyle = '#1e1b4b';
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 1, 9, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#ef4444';
                ctx.fillRect(-2, -11, 4, 3);

                // Огонь
                ctx.fillStyle = '#f97316';
                ctx.beginPath();
                ctx.moveTo(-5, -8);
                ctx.lineTo(0, -14);
                ctx.lineTo(3, -9);
                ctx.lineTo(6, -13);
                ctx.lineTo(4, -7);
                ctx.closePath();
                ctx.fill();

                // Стрелки
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(0, 1); ctx.lineTo(0, -5);
                ctx.moveTo(0, 1); ctx.lineTo(4, 1);
                ctx.stroke();

                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(0, 1, 1.5, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 4: {
                // БЕССОННИЦА / СМАРТФОН В ТЕМНОТЕ
                ctx.fillStyle = '#38bdf8';
                ctx.beginPath();
                ctx.arc(-2, -2, 8, 0.4, Math.PI * 1.5);
                ctx.arc(-5, -4, 6, Math.PI * 1.4, 0.6, true);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = '#0f172a';
                ctx.strokeStyle = '#00f0ff';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(1, -2, 9, 13, 1.5) : ctx.rect(1, -2, 9, 13);
                ctx.fill();
                ctx.stroke();

                const screenLight = ctx.createLinearGradient(5, 0, 5, 8);
                screenLight.addColorStop(0, '#38bdf8');
                screenLight.addColorStop(1, '#0284c7');
                ctx.fillStyle = screenLight;
                ctx.fillRect(2, 0, 7, 8);

                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(8, -1, 1.5, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 5: {
                // ТРЕВОГА / ПАНИЧЕСКАЯ АТАКА (Молния и электричество)
                ctx.strokeStyle = 'rgba(192, 132, 252, 0.4)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(0, 0, 10, 0, Math.PI * 1.8);
                ctx.stroke();

                ctx.fillStyle = '#fde047';
                ctx.strokeStyle = '#a855f7';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(1, -11);
                ctx.lineTo(-6, -1);
                ctx.lineTo(-1, -1);
                ctx.lineTo(-4, 11);
                ctx.lineTo(6, 0);
                ctx.lineTo(1, 0);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
            }
            case 6: {
                // ПОХМЕЛЬЕ / ТОКСИЧНАЯ КОЛБА
                ctx.fillStyle = '#14532d';
                ctx.strokeStyle = '#22c55e';
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.rect(-3, -11, 6, 4);
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(-3, -7);
                ctx.lineTo(-10, 7);
                ctx.quadraticCurveTo(0, 11, 10, 7);
                ctx.lineTo(3, -7);
                ctx.closePath();
                ctx.fillStyle = '#052e16';
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#22c55e';
                ctx.beginPath();
                ctx.moveTo(-7, 2);
                ctx.quadraticCurveTo(0, 0, 7, 2);
                ctx.lineTo(9, 6.5);
                ctx.quadraticCurveTo(0, 10, -9, 6.5);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = '#86efac';
                ctx.beginPath();
                ctx.arc(-2, 3, 1.3, 0, Math.PI * 2);
                ctx.arc(3, 4, 1.6, 0, Math.PI * 2);
                ctx.arc(0, -3, 1, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 7: {
                // ПРОКРАСТИНАЦИЯ / СПИРАЛЬ ВРЕМЕНИ
                ctx.strokeStyle = '#818cf8';
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                for (let a = 0; a < Math.PI * 3.5; a += 0.2) {
                    const rad = 2 + a * 2.2;
                    const px = Math.cos(a) * rad;
                    const py = Math.sin(a) * rad;
                    if (a === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.stroke();

                ctx.fillStyle = '#fde047';
                ctx.strokeStyle = '#312e81';
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(-5, -6); ctx.lineTo(5, -6); ctx.lineTo(0, 0); ctx.lineTo(5, 6); ctx.lineTo(-5, 6); ctx.lineTo(0, 0);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
            }
        }

        // 5. Тёмная плашка с аккуратным названием мысли снизу
        ctx.fillStyle = 'rgba(2, 6, 23, 0.94)';
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-16, 9.5, 32, 8.5, 3);
        } else {
            ctx.rect(-16, 9.5, 32, 8.5);
        }
        ctx.fill();
        ctx.strokeStyle = gConf.hazardColor || '#ef4444';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.font = 'bold 7px system-ui, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(gConf.name || 'ТРЕВОГА', 0, 13.8);

        // 6. Сферический 3D-блик
        if (fx) {
            const shine = ctx.createRadialGradient(-7, -7, 1, 0, 0, 20);
            shine.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
            shine.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
            shine.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
            shine.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
            ctx.fillStyle = shine;
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    },

    _garbageCache: {},
    getGarbageDataURL(typeIndex, size = 64) {
        const key = `${typeIndex}_${size}`;
        if (this._garbageCache[key]) return this._garbageCache[key];
        if (typeof document === 'undefined') return '';
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';
        ctx.translate(size / 2, size / 2);
        this.drawGarbageVector(ctx, typeIndex, size / 2 - 2, { fx: true, isAim: false });
        try {
            const url = canvas.toDataURL('image/png');
            this._garbageCache[key] = url;
            return url;
        } catch (e) {
            return '';
        }
    }
};

if (typeof window !== 'undefined') {
    window.formatNumber = function(num) {
        return CONFIG.formatNumber(num);
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
