const CONFIG = {
    // Базовые пропорции (адаптируются под canvas.height в runtime)
    DEFAULT_ROOM_RATIO: 0.30, // 30% под комнату, 70% под стакан мыслей
    MIN_ROOM_HEIGHT: 135,
    MAX_ROOM_HEIGHT: 195,
    
    // 10 УРОВНЕЙ ЭВОЛЮЦИИ МЫСЛЕЙ (Экспоненциальная шкала наград для глубокого геймплея)
    TIERS: {
        1:  { name: "Квадробер", radius: 14, color: "#4ade80", emoji: "🐱", score: 5,      mappedImg: 1, glow: "#22c55e" },
        2:  { name: "Симп",       radius: 18, color: "#38bdf8", emoji: "🥺", score: 18,     mappedImg: 2, glow: "#0ea5e9" },
        3:  { name: "Тюбик",      radius: 23, color: "#818cf8", emoji: "🧪", score: 55,     mappedImg: 3, glow: "#6366f1" },
        4:  { name: "Зумер",      radius: 29, color: "#c084fc", emoji: "🧢", score: 165,    mappedImg: 4, glow: "#a855f7" },
        5:  { name: "Альтушка",   radius: 36, color: "#f472b6", emoji: "🎀", score: 480,    mappedImg: 5, glow: "#ec4899" },
        6:  { name: "Масик",      radius: 44, color: "#fb7185", emoji: "🧸", score: 1450,   mappedImg: 6, glow: "#f43f5e" },
        7:  { name: "Дед",        radius: 53, color: "#fb923c", emoji: "👴", score: 4400,   mappedImg: 7, glow: "#f97316" },
        8:  { name: "Скуф",       radius: 63, color: "#facc15", emoji: "🛋️", score: 13500,  mappedImg: 8, glow: "#eab308" },
        9:  { name: "Сигма",      radius: 74, color: "#a78bfa", emoji: "🗿", score: 42000,  mappedImg: 9, glow: "#8b5cf6" },
        10: { name: "ГИГАЧАД",    radius: 86, color: "#ffd700", emoji: "👑", score: 135000, mappedImg: 10, glow: "#ffbf00" }
    },

    // ТЕЛЕКАНАЛЫ В КОМНАТЕ (Интерактивное переключение по клику)
    TV_CHANNELS: [
        { id: 0, title: "⚽ МАТЧ ТВ: СПАРТАК", quote: "«Судью на мыло! Гол был чистый!»", icon: "⚽", buff: "tap" },
        { id: 1, title: "📺 УЛИЦЫ ФОНАРЕЙ", quote: "«У нас труп, возможно криминал... По коням!»", icon: "🚓", buff: "boss" },
        { id: 2, title: "📈 КРИПТО-ПАМП 1000X", quote: "«Зеленая свеча! Закупаем на хаях!»", icon: "📉", buff: "income" },
        { id: 3, title: "🎀 СТРИМ АЛЬТУШКИ", quote: "«Спасибо за донат в 50 рублей, чмок!»", icon: "🎀", buff: "stamina" },
        { id: 4, title: "🛋️ МАГАЗИН НА ДИВАНЕ", quote: "«Купите массажер для поясницы со скидкой 90%!»", icon: "🛋️", buff: "fever" }
    ],

    // ЛЕТАЮЩИЕ ИНСАЙТ-ПУЗЫРИ (Интерактивные клики по экрану)
    INSIGHT_BUBBLES: [
        { type: "insight", emoji: "💡", title: "Инсайт!", color: "#ffd700" },
        { type: "pizza", emoji: "🍕", title: "Доставка!", color: "#fb923c" },
        { type: "energy", emoji: "⚡", title: "Хайп-Энергетик!", color: "#00f0ff" },
        { type: "bomb", emoji: "💣", title: "Петарда!", color: "#ef4444" },
        { type: "spin", emoji: "🎡", title: "Фриспин!", color: "#a855f7" }
    ],

    // ФАЗЫ ПРОГРЕССИИ (смена окружения каждые 4 дня)
    PHASES: {
        1: { name: "Хрущёвка", roomStage: 0, gravityMod: 1.0, trashMod: 1.0, bgTitle: "Уютная однушка с ковром" },
        2: { name: "Евроремонт", roomStage: 1, gravityMod: 1.05, trashMod: 1.15, bgTitle: "Студия с подсветкой" },
        3: { name: "IT-Офис", roomStage: 2, gravityMod: 1.12, trashMod: 1.3, bgTitle: "Офис с пуфиками и кофемашиной" },
        4: { name: "Пентхаус", roomStage: 3, gravityMod: 1.2, trashMod: 1.5, bgTitle: "Пентхаус Сити с видом на огни" },
        5: { name: "Орбита", roomStage: 4, gravityMod: 1.3, trashMod: 1.7, bgTitle: "Космическая Скуф-Станция" }
    },

    // 20 МАСШТАБНЫХ БОССОВ (Глубокая многоуровневая экономика)
    BOSSES: {
        1:  { name: "Хозяйка Тамара 👵",       hp: 3000,           quote: "«Аренда сама себя не заплатит, вставай!»", color: "#f87171" },
        2:  { name: "Коллектор Валера 🕶️",     hp: 12000,          quote: "«За телефончик платить будем или как?»", color: "#fb923c" },
        3:  { name: "Начальник Михалыч 🏭",     hp: 45000,          quote: "«Выходи в субботу за отгул (нет)!»", color: "#facc15" },
        4:  { name: "Бывшая 💔",                hp: 160000,         quote: "«Ты совсем не изменился...»", color: "#f472b6" },
        5:  { name: "Алкоголь и Фастфуд 🍾",    hp: 550000,         quote: "«Ещё баночку и пиццу, поспишь потом!»", color: "#c084fc" },
        6:  { name: "Депрессия 🌧️",            hp: 1800000,        quote: "«Всё тлен, оставайся под одеялом...»", color: "#60a5fa" },
        7:  { name: "Инфоцыган Артём 📱",       hp: 5500000,        quote: "«Купи курс успешного успеха за 99к!»", color: "#34d399" },
        8:  { name: "Крипто-Скамер 📉",         hp: 18000000,       quote: "«Вложи всё в мемкоин SkufCoin, 1000x завтра!»", color: "#fbbf24" },
        9:  { name: "Синдром Самозванца 🎭",    hp: 55000000,       quote: "«Ты ничего не добился, тебе просто повезло!»", color: "#a78bfa" },
        10: { name: "Ипотека на 30 лет 🏦",     hp: 160000000,      quote: "«Каждый месяц 70% зарплаты — мне!»", color: "#f87171" },
        11: { name: "Служба Доставки 🍕",       hp: 450000000,      quote: "«Курьер уже у двери. Не вставай, он принесет!»", color: "#fb923c" },
        12: { name: "Нейросеть GPT-6 🤖",       hp: 1300000000,     quote: "«Я делаю твою работу за 0.2 секунды бесплатно.»", color: "#38bdf8" },
        13: { name: "Выгорание 🔥",             hp: 3800000000,     quote: "«У тебя нет энергии даже открыть глаза...»", color: "#ef4444" },
        14: { name: "Военком в дверях 🪖",      hp: 11000000000,    quote: "«Распишитесь в получении повесточки!»", color: "#4ade80" },
        15: { name: "Кризис Среднего Возраста 🏎️", hp: 32000000000,  quote: "«Пора купить мотоцикл и грустить под дождём.»", color: "#e879f9" },
        16: { name: "Государственная Бюрократия 🏛️", hp: 95000000000, quote: "«Принесите справку о том, что вам нужна справка.»", color: "#94a3b8" },
        17: { name: "Гравитация Дивана 🕳️",     hp: 280000000000,   quote: "«Диван стал чёрной дырой. Ты не встанешь никогда.»", color: "#6366f1" },
        18: { name: "Неумолимое Время ⏰",       hp: 850000000000,   quote: "«Тик-так. Ещё один год прошёл впустую...»", color: "#f59e0b" },
        19: { name: "СМЕРТЬ БЫТИЯ 💀",          hp: 2500000000000,  quote: "«Конец близко. Покажи, на что способен Гигачад!»", color: "#dc2626" },
        20: { name: "АБСОЛЮТНЫЙ ВЛАДЫКА СУДЬБЫ 👑", hp: 8000000000000, quote: "«Ты прошёл сквозь огонь, ленивый воин. ПРЕВОЗМОГИ!»", color: "#ffd700" }
    },

    // МУСОРНЫЕ МЫСЛИ (не сливаются, взрываются слияниями)
    GARBAGE_TYPES: [
        { name: "Кредит 💳",    color: "#475569", radius: 20 },
        { name: "Бывшая 💔",    color: "#4a1525", radius: 21 },
        { name: "Лень 🦥",      color: "#1e293b", radius: 20 },
        { name: "Дедлайн ⏰",   color: "#7c2d12", radius: 19 },
        { name: "Бессонница 🌙", color: "#1e1b4b", radius: 20 },
        { name: "Тревога ⚡",   color: "#581c87", radius: 20 },
        { name: "Похмелье 🤢",  color: "#14532d", radius: 21 },
        { name: "Прокрастинация 💤", color: "#312e81", radius: 20 }
    ],

    // РЕЛИКВИИ ЗАБЕГА (выбираются при победе над боссом)
    RELICS_POOL: [
        {
            id: "relic_espresso",
            badge: "☕",
            name: "Эспрессо-пулемёт",
            desc: "Сброс мыслей быстрее на 35%. Очки комбо х2",
            apply: (g) => { g.comboMultiplier *= 2; g.dropCooldownMs = Math.max(140, Math.floor(g.dropCooldownMs * 0.65)); }
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
            desc: "Мысли T1-T3 сами притягиваются друг к другу",
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
            desc: "Пассивный доход моментально +250/сек",
            apply: (g) => { g.passiveIncome += 250; }
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
            desc: "Слияние T1 дает +1,500 Мотивации и пассив +300/сек",
            apply: (g) => { g.passiveIncome += 300; g.hasGoldenCat = true; }
        },
        {
            id: "relic_flash_master",
            badge: "⚡",
            name: "Повелитель времени",
            desc: "Расходник «Флэш» длится 25 секунд вместо 12",
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
            { id: "b9", name: "Абсолютный Фокус", desc: "Лихорадка (Fever) длится в 2 раза дольше и дает x5 очков", cost: 2800000000, bought: false, level: 9 }
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
        { id: "p2", name: "Благородный Старт", desc: "Начинать новые забеги с мыслями T2, T3 или T4", cost: 2, level: 0, max: 3 },
        { id: "p3", name: "Титановые Легкие", desc: "Стартовая дыхалка увеличена в 2 раза за уровень", cost: 2, level: 0, max: 5 },
        { id: "p4", name: "Оффлайн-Магнат", desc: "Лимит сна до 24 часов, оффлайн доход 100%", cost: 3, level: 0, max: 4 },
        { id: "p5", name: "Авто-Мыслитель", desc: "Включает аккуратный авто-сброс мыслей в фоновом режиме", cost: 4, level: 0, max: 1 },
        { id: "p6", name: "Квантовый Череп", desc: "Стакан навсегда на +25px шире с первого дня", cost: 4, level: 0, max: 3 },
        { id: "p7", name: "Охотник на Боссов", desc: "+50% урона по боссам от всех источников за уровень", cost: 3, level: 0, max: 5 },
        { id: "p8", name: "Золотой Конвейер", desc: "+25% к шансу бесплатных расходников и фриспинов", cost: 3, level: 0, max: 4 }
    ],

    // ЗАДАНИЯ И КВЕСТЫ (РЕГУЛЯРНЫЕ НАГРАДЫ)
    DAILY_QUESTS: [
        { id: "q1", title: "Разминка костей", desc: "Сделайте 40 тапов по дивану", goal: 40, type: "taps", reward: 800, rewardItem: "beer" },
        { id: "q2", title: "Уборка в голове", desc: "Уничтожьте 8 мусорных мыслей", goal: 8, type: "trash", reward: 1500, rewardItem: "script" },
        { id: "q3", title: "Мастер комбо", desc: "Наберите комбо x5 или выше", goal: 5, type: "combo", reward: 2500, rewardItem: "energy" },
        { id: "q4", title: "Конвейер мыслей", desc: "Слейте 60 любых мыслей", goal: 60, type: "merges", reward: 4000, rewardItem: "beer" },
        { id: "q5", title: "Гроза Хозяек", desc: "Победите любого босса", goal: 1, type: "boss", reward: 8000, rewardItem: "script" },
        { id: "q6", title: "Рождение Гигачада", desc: "Создайте хотя бы одного Гигачада", goal: 1, type: "gigachad", reward: 25000, rewardItem: "energy" }
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
                    game.motivation += 3500;
                    game.physics.createGarbage(game.canvas.width / 2, game.dropY, CONFIG.GARBAGE_TYPES[0]);
                }
            },
            choiceB: {
                title: "Послать мошенников",
                penalty: "Скуф взбодрился (+120 к пассиву на 45 сек)",
                action: (game) => {
                    game.passiveIncome += 120;
                    setTimeout(() => { game.passiveIncome = Math.max(0, game.passiveIncome - 120); }, 45000);
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
                action: (game) => { game.motivation += 8000; }
            },
            choiceB: {
                title: "Купить ящик расходников",
                penalty: "Получаете +2 Балтики, +2 Скрипта, +2 Флэша",
                action: (game) => {
                    game.items.beer += 2;
                    game.items.script += 2;
                    game.items.energy += 2;
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
                title: "Достать заначку (+5,000 🗿)",
                penalty: "Скуф находит купюру пятилетней давности",
                action: (game) => { game.motivation += 5000; }
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
        { id: "rich_skuf", badge: "💰", name: "Крипто-магнат", desc: "Накопите более 250 000 Мотивации", check: (g) => g.motivation >= 250000 },
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
