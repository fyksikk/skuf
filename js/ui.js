class UIManager {
    constructor(callbacks) {
        this.callbacks = callbacks;
        this.currentTab = 'hero';
        this.dom = {
            startMenu: document.getElementById('start-menu-overlay'),
            guideModal: document.getElementById('guide-overlay'),
            btnStartGame: document.getElementById('btn-start-game'),
            btnOpenGuide: document.getElementById('btn-open-guide'),
            btnCloseGuide: document.getElementById('btn-close-guide'),
            btnGuideBack: document.getElementById('btn-guide-back'),
            motivation: document.getElementById('motivation-counter'),
            passive: document.getElementById('passive-counter'),
            staminaBar: document.getElementById('stamina-bar'),
            staminaAlert: document.getElementById('stamina-alert'),
            nextCircle: document.getElementById('next-thought-circle'),
            btnShake: document.getElementById('btn-brain-shake'),
            quote: document.getElementById('hero-quote'),
            shopModal: document.getElementById('shop-overlay'),
            upgradesList: document.getElementById('upgrades-container'),
            gameoverModal: document.getElementById('gameover-overlay'),
            finalScore: document.getElementById('gameover-stats'),
            relicsContainer: document.getElementById('relics-container'),
            perkModal: document.getElementById('perk-overlay'),
            perkGrid: document.getElementById('perk-cards-container')
        };
        
        this.initEvents();
    }

    initEvents() {
        // Стартовое меню
        this.dom.btnStartGame.addEventListener('click', () => {
            this.dom.startMenu.classList.remove('active');
            if (this.callbacks.onGameStart) this.callbacks.onGameStart();
        });

        // Мануал по выживанию (Гайд)
        this.dom.btnOpenGuide.addEventListener('click', () => {
            this.dom.guideModal.classList.add('active');
        });

        const closeGuide = () => this.dom.guideModal.classList.remove('active');
        this.dom.btnCloseGuide.addEventListener('click', closeGuide);
        this.dom.btnGuideBack.addEventListener('click', closeGuide);

        // Встряска и рестарт
        this.dom.btnShake.addEventListener('click', () => this.callbacks.onShake());
        document.getElementById('btn-retry').addEventListener('click', () => location.reload());
        
        // Магазин (Цели)
        document.getElementById('btn-open-shop').addEventListener('click', () => {
            this.dom.shopModal.classList.add('active');
            this.renderShop();
        });
        document.getElementById('btn-close-shop').addEventListener('click', () => {
            this.dom.shopModal.classList.remove('active');
        });

        // Вкладки магазина
        document.querySelectorAll('.shop-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentTab = e.target.dataset.category;
                this.renderShop();
            });
        });
    }

    updateMotivation(val, passive) {
        this.dom.motivation.textContent = `${val} 🗿`;
        this.dom.passive.textContent = `+${passive}/сек`;
    }

    updateStamina(percent, isExhausted) {
        this.dom.staminaBar.style.width = `${percent}%`;
        if (isExhausted) {
            this.dom.staminaBar.style.background = "#ef4444";
            this.dom.staminaAlert.textContent = "ОДЫШКА!";
        } else {
            this.dom.staminaBar.style.background = "linear-gradient(90deg, #ef4444, #3b82f6)";
            this.dom.staminaAlert.textContent = "";
        }
    }

    renderRelics(relics) {
        this.dom.relicsContainer.innerHTML = "";
        relics.forEach(r => {
            const badge = document.createElement('span');
            badge.className = "relic-badge";
            badge.textContent = r.badge;
            badge.title = `${r.name}: ${r.desc}`;
            this.dom.relicsContainer.appendChild(badge);
        });
    }

    showPerkDraft(perks, onSelectCallback) {
        this.dom.perkGrid.innerHTML = "";
        let canClick = false;
        const delayMs = 1500; // Anti-Missclick задержка 1.5 секунды

        perks.forEach(perk => {
            const card = document.createElement('div');
            card.className = "perk-card locked";
            card.innerHTML = `
                <h4>${perk.name}</h4>
                <p>${perk.desc}</p>
                <div class="unlock-progress"></div>
            `;
            card.addEventListener('click', () => {
                if (!canClick) return;
                this.dom.perkModal.classList.remove('active');
                onSelectCallback(perk);
            });
            this.dom.perkGrid.appendChild(card);
        });
        
        this.dom.perkModal.classList.add('active');

        // Снимаем блокировку после окончания анимации полосы загрузки
        setTimeout(() => {
            canClick = true;
            document.querySelectorAll('.perk-card').forEach(c => {
                c.classList.remove('locked');
                const bar = c.querySelector('.unlock-progress');
                if (bar) bar.style.display = 'none';
            });
        }, delayMs);
    }

    updateNextThought(nextItem) {
        if (nextItem.isGarbage) {
            this.dom.nextCircle.style.backgroundImage = "none";
            this.dom.nextCircle.style.backgroundColor = nextItem.data.color || "#334155";
            this.dom.nextCircle.style.borderColor = "#ef4444";
            this.dom.nextCircle.textContent = "⚠️";
            this.dom.nextCircle.style.display = "flex";
            this.dom.nextCircle.style.alignItems = "center";
            this.dom.nextCircle.style.justifyContent = "center";
        } else {
            const tierConf = CONFIG.TIERS[nextItem.tier];
            if (tierConf.mappedImg) {
                this.dom.nextCircle.textContent = "";
                this.dom.nextCircle.style.backgroundImage = `url('char_${tierConf.mappedImg}.png')`;
                this.dom.nextCircle.style.backgroundColor = tierConf.color;
                this.dom.nextCircle.style.display = "block";
            } else {
                this.dom.nextCircle.style.backgroundImage = "none";
                this.dom.nextCircle.style.backgroundColor = tierConf.color;
                this.dom.nextCircle.textContent = tierConf.emoji;
                this.dom.nextCircle.style.display = "flex";
                this.dom.nextCircle.style.alignItems = "center";
                this.dom.nextCircle.style.justifyContent = "center";
            }
            this.dom.nextCircle.style.borderColor = tierConf.color;
        }
    }

    updateShake(cooldown) {
        let label = document.getElementById("btn-shake-label");
        
        // Безопасное обновление текста без удаления картинки
        if (!this.dom.btnShake.querySelector("img")) {
            this.dom.btnShake.innerHTML = `
                <img src="item_shake.png" alt="Встряска" class="shake-icon">
                <span id="btn-shake-label">Встряска мозга</span>
            `;
            label = document.getElementById("btn-shake-label");
        }

        if (cooldown > 0) {
            this.dom.btnShake.disabled = true;
            if (label) label.textContent = `Жди: ${Math.ceil(cooldown)}с`;
        } else {
            this.dom.btnShake.disabled = false;
            if (label) label.textContent = "Встряска мозга";
        }
    }

    setQuote(text) {
        this.dom.quote.textContent = text;
    }

    showGameOver(days, reason) {
        document.getElementById('gameover-reason').textContent = reason;
        this.dom.finalScore.textContent = `Прожито дней: ${days}`;
        this.dom.gameoverModal.classList.add('active');
    }

    renderShop() {
        this.dom.upgradesList.innerHTML = "";
        const list = CONFIG.UPGRADES[this.currentTab];
        
        list.forEach(item => {
            const card = document.createElement('div');
            card.className = "upgrade-card";
            card.innerHTML = `
                <div class="card-text">
                    <h4>${item.name}</h4>
                    <p>${item.desc}</p>
                </div>
                <button class="btn-buy-goal" ${item.bought ? 'disabled' : ''} data-id="${item.id}">
                    ${item.bought ? 'КУПЛЕНО' : `${item.cost} 🗿`}
                </button>
            `;
            this.dom.upgradesList.appendChild(card);
        });

        this.dom.upgradesList.querySelectorAll('.btn-buy-goal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.callbacks.onBuyUpgrade(this.currentTab, e.target.dataset.id);
            });
        });
    }
}