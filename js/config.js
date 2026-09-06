const CONFIG = {
    ROOM_HEIGHT: 215,
    BRAIN_TOP_Y: 235,
    DANGER_LINE_Y: 285,
    DROP_Y: 255,
    
    // 10 УРОВНЕЙ ЭВОЛЮЦИИ МЫСЛЕЙ (Сбалансированы под широкий стакан 520px)
    TIERS: {
        1:  { name: "Квадробер", radius: 15, color: "#88d49e", emoji: "🐱", score: 2,   mappedImg: 1 },
        2:  { name: "Симп",       radius: 20, color: "#a8dadc", emoji: "🥺", score: 5,   mappedImg: 2 },
        3:  { name: "Тюбик",      radius: 26, color: "#457b9d", emoji: "🧪", score: 12,  mappedImg: 3 },
        4:  { name: "Зумер",      radius: 33, color: "#b5838d", emoji: "🧢", score: 25,  mappedImg: 4 },
        5:  { name: "Альтушка",   radius: 42, color: "#f285d1", emoji: "🎀", score: 55,  mappedImg: 5 },
        6:  { name: "Масик",      radius: 52, color: "#e5989b", emoji: "🧸", score: 120, mappedImg: 6 },
        7:  { name: "Дед",        radius: 64, color: "#f4a261", emoji: "👴", score: 260, mappedImg: 7 },
        8:  { name: "Скуф",       radius: 78, color: "#4a90e2", emoji: "🛋️", score: 600, mappedImg: 8 },
        9:  { name: "Сигма",      radius: 94, color: "#6d597a", emoji: "🗿", score: 1300, mappedImg: 9 },
        10: { name: "ГИГАЧАД",    radius: 112, color: "#ffd700", emoji: "👑", score: 3000, mappedImg: 10 }
    },

    // ФАЗЫ ПРОГРЕССИИ (каждые 3 дня)
    PHASES: {
        1: { name: "Хрущёвка", roomStage: 0, gravityMod: 1.0, trashMod: 1.0 },
        2: { name: "Квартира", roomStage: 1, gravityMod: 1.1, trashMod: 1.2 },
        3: { name: "Офис",     roomStage: 2, gravityMod: 1.2, trashMod: 1.4 },
        4: { name: "Пентхаус", roomStage: 3, gravityMod: 1.3, trashMod: 1.6 },
        5: { name: "Космос",   roomStage: 4, gravityMod: 1.5, trashMod: 1.8 }
    },

    // БОССЫ (Экспоненциальный рост HP для затяжной игры)
    BOSSES: {
        1:  { name: "Хозяйка Тамара 👵",       hp: 600 },
        2:  { name: "Коллектор Валера 🕶️",     hp: 1800 },
        3:  { name: "Начальник Михалыч 🏭",     hp: 4500 },
        4:  { name: "Бывшая 💔",                hp: 12000 },
        5:  { name: "Алкоголь 🍾",              hp: 30000 },
        6:  { name: "Депрессия 🌧️",            hp: 80000 },
        7:  { name: "Кризис ⏳",                 hp: 200000 },
        8:  { name: "Система 🏛️",              hp: 500000 },
        9:  { name: "Время ⏰",                 hp: 1200000 },
        10: { name: "СМЕРТЬ 💀",                hp: 3000000 }
    },

    // МУСОРНЫЕ МЫСЛИ
    GARBAGE_TYPES: [
        { name: "Кредит 💳",    color: "#475569", radius: 25 },
        { name: "Бывшая 💔",    color: "#334155", radius: 28 },
        { name: "Лень 🦥",      color: "#1e293b", radius: 26 },
        { name: "Дедлайн ⏰",   color: "#7c2d12", radius: 24 },
        { name: "Бессонница 🌙", color: "#1e1b4b", radius: 26 },
        { name: "Тревога ⚡",   color: "#581c87", radius: 25 }
    ],

    // РЕЛИКВИИ (Добавлены новые, старые перебалансированы)
    RELICS_POOL: [
        {
            id: "relic_espresso",
            badge: "☕",
            name: "Эспрессо-пулемёт",
            desc: "Сброс мыслей быстрее (160мс). Очки комбо х2",
            apply: (g) => { g.comboMultiplier *= 2; g.dropCooldownMs = 160; }
        },
        {
            id: "relic_beer_shield",
            badge: "🍺",
            name: "Пивной щит",
            desc: "Слияние T8 (Скуф) сжигает весь мусор на поле",
            apply: (g) => g.hasBeerShield = true
        },
        {
            id: "relic_magnet",
            badge: "🧲",
            name: "Нейро-магнит",
            desc: "T1 и T2 сами притягиваются друг к другу",
            apply: (g) => g.hasMagnetRelic = true
        },
        {
            id: "relic_iron_lungs",
            badge: "🫁",
            name: "Железные лёгкие",
            desc: "Дыхалка Скуфа восстанавливается в 2 раза быстрее",
            apply: (g) => g.staminaRecoveryRate *= 2
        },
        {
            id: "relic_skull_wall",
            badge: "🧠",
            name: "Стены из гипса",
            desc: "Череп расширяется на +24px навсегда",
            apply: (g) => g.physics.expandSkull(g.physics.cupWidthOffset + 24)
        },
        {
            id: "relic_stream_rig",
            badge: "💻",
            name: "Спонсор",
            desc: "Пассивный доход моментально +20/сек",
            apply: (g) => g.passiveIncome += 20
        },
        {
            id: "relic_pillow",
            badge: "🛌",
            name: "Ортопедическая подушка",
            desc: "Усталость наступает реже. Дыхалка качается медленней",
            apply: (g) => g.staminaRecoveryRate *= 1.5
        },
        {
            id: "relic_golden_cat",
            badge: "🐱",
            name: "Золотой Квадробер",
            desc: "Пассивный доход Скуфа +50/сек",
            apply: (g) => g.passiveIncome += 50
        }
    ],

    // НОВЫЕ ЦЕЛИ ДЛЯ ПРОКАЧКИ (Отображаются в комнате)
    UPGRADES: {
        hero: [
            { id: "h1", name: "Гантели (База х2)", desc: "Появляются в комнате. Клики х2", cost: 250, bought: false },
            { id: "h2", name: "Протеин (База х5)", desc: "Мышцы растут. Клики х5", cost: 1200, bought: false },
            { id: "h3", name: "Смокинг (База х15)", desc: "Солидный вид. Клики х15", cost: 5500, bought: false },
            { id: "h4", name: "Кибер-рука (База х50)", desc: "Технологии будущего. Клики х50", cost: 25000, bought: false },
            { id: "h5", name: "ФОРМА ГИГАЧАДА", desc: "Абсолютный идеал. Клики х200", cost: 120000, bought: false }
        ],
        room: [
            { id: "r1", name: "Уборка мусора", desc: "Чистый пол. Доход +5/сек", cost: 150, bought: false },
            { id: "r2", name: "Игровой ПК", desc: "Светящийся стол в комнате. Доход +30/сек", cost: 900, bought: false },
            { id: "r3", name: "Майнинг ферма", desc: "Стойка серверов в углу. Доход +120/сек", cost: 4000, bought: false },
            { id: "r4", name: "Умный дом", desc: "Роботы делают всё сами. Доход +500/сек", cost: 18000, bought: false },
            { id: "r5", name: "Личный дата-центр", desc: "Король интернета. Доход +2500/сек", cost: 80000, bought: false }
        ],
        brain: [
            { id: "b1", name: "Распил черепа", desc: "Стакан расширяется. Больше места!", cost: 500, bought: false },
            { id: "b2", name: "Холодный душ", desc: "Кулдаун встряски мыслей снижен до 7 сек", cost: 1500, bought: false },
            { id: "b3", name: "Медитация", desc: "Встряска теперь доступна каждые 4 сек", cost: 6000, bought: false },
            { id: "b4", name: "Осознанность", desc: "Грязные мысли падают в 2 раза реже", cost: 20000, bought: false }
        ]
    },

    // СОБЫТИЯ И ДИЛЕММЫ
    EVENTS_POOL: [
        {
            id: "bank_call",
            icon: "📞",
            title: "Звонок службы безопасности",
            desc: "«По вашей карте замечена активность. Переведите средства на защищенный счет!»",
            choiceA: {
                title: "Поверить и перевести (+450 🗿)",
                penalty: "В стакан падает тяжёлый «Кредит 💳»",
                action: (game) => {
                    game.motivation += 450;
                    game.physics.createGarbage(game.canvas.width / 2, CONFIG.DROP_Y, CONFIG.GARBAGE_TYPES[0]);
                }
            },
            choiceB: {
                title: "Послать звонящих",
                penalty: "Скуф разнервничался (-40% дыхалки)",
                action: (game) => {
                    game.stamina = Math.max(10, game.stamina - 40);
                    game.ui.setQuote("«Служба безопасности?.. Не на того напали!»");
                }
            }
        },
        {
            id: "crypto_drop",
            icon: "📈",
            title: "Скуфкоин взлетел!",
            desc: "Забытая крипта на бирже дала мощный памп. Фиксируем?",
            choiceA: {
                title: "Зафиксировать прибыль (+300 🗿)",
                penalty: "Скуф доволен и сыт",
                action: (game) => { game.motivation += 300; }
            },
            choiceB: {
                title: "Купить Балтику",
                penalty: "Получаете +2 расходника «Балтика 🍺»",
                action: (game) => {
                    game.items.beer += 2;
                    game.updateConsumablesUI();
                }
            }
        }
    ],

    // ДОСТИЖЕНИЯ
    ACHIEVEMENTS: [
        { id: "first_merge", name: "Первое слияние", desc: "Слейте 2 мысли", check: (game) => game.totalMerges >= 1 },
        { id: "gigachad", name: "Гигачад", desc: "Создайте Гигачада", check: (game) => game.gigachadsCreated >= 1 }
    ]
};