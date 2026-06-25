import { gameState } from "../state/game_state.js";
import { GAME_STATES } from "../config/constants.js";
import { viewMenu } from "./view_menu.js";
import { viewShop } from "./view_shop.js";
import { viewInventory } from "./view_inventory.js";
import { gameLoop } from "../core/game_loop.js";
import { renderer } from "../graphics/renderer.js";

export const uiManager = {
    el: null,

    initialize(elements) {
        this.el = elements;
        this.setupEventListeners();
    },

    setupEventListeners() {
        this.el.btnStart.addEventListener("click", () => {
            this.startNewGame();
        });

        this.el.btnOpenShop.addEventListener("click", () => {
            this.showScreen("shop");
        });

        this.el.btnCloseShop.addEventListener("click", () => {
            this.showScreen("menu");
        });

        this.el.btnOpenInventory.addEventListener("click", () => {
            this.showScreen("inventory");
        });

        this.el.btnCloseInventory.addEventListener("click", () => {
            this.showScreen("menu");
        });

        this.el.btnPause.addEventListener("click", () => {
            this.pauseGame();
        });

        this.el.btnResume.addEventListener("click", () => {
            this.resumeGame();
        });

        this.el.btnQuit.addEventListener("click", () => {
            this.quitToMenu();
        });

        this.el.btnRestart.addEventListener("click", () => {
            this.startNewGame();
        });

        this.el.btnGoMenu.addEventListener("click", () => {
            this.showScreen("menu");
        });
    },

    updateLoadingProgress(progress) {
        if (this.el.loadingText) {
            this.el.loadingText.textContent = `DANG TẢI TÀI NGUYÊN KHÔNG GIAN... ${progress}%`;
        }
    },

    onResourcesLoaded(resources) {
        this.hideAllScreens();
        if (this.el.screenLoading) {
            this.el.screenLoading.classList.add("hidden");
        }
    },

    showScreen(screenType) {
        this.hideAllScreens();
        
        if (screenType === "menu") {
            gameState.changeState(GAME_STATES.MENU);
            this.el.screenMenu.classList.remove("hidden");
            viewMenu.render();
        } else if (screenType === "shop") {
            gameState.changeState(GAME_STATES.SHOP);
            this.el.screenShop.classList.remove("hidden");
            viewShop.render(this.el.shopCurrency, this.el.shopItemContainer);
        } else if (screenType === "inventory") {
            gameState.changeState(GAME_STATES.INVENTORY);
            this.el.screenInventory.classList.remove("hidden");
            viewInventory.render(this.el.inventoryItemContainer);
        } else if (screenType === "playing") {
            gameState.changeState(GAME_STATES.PLAYING);
            this.el.hud.classList.remove("hidden");
            if (inputManager.isMobile) {
                this.el.joystickZone.classList.remove("hidden");
            }
        } else if (screenType === "paused") {
            this.el.screenPause.classList.remove("hidden");
            this.el.hud.classList.remove("hidden");
        } else if (screenType === "gameover") {
            this.el.screenGameover.classList.remove("hidden");
            this.el.finalScore.textContent = gameState.score;
            this.el.finalCredits.textContent = gameState.creditsEarned;
        }
    },

    hideAllScreens() {
        this.el.screenMenu.classList.add("hidden");
        this.el.screenShop.classList.add("hidden");
        this.el.screenInventory.classList.add("hidden");
        this.el.screenPause.classList.add("hidden");
        this.el.screenGameover.classList.add("hidden");
        this.el.hud.classList.add("hidden");
        this.el.joystickZone.classList.add("hidden");
    },

    startNewGame() {
        if (!renderer.gl) {
            renderer.initialize(this.el.canvas);
        }
        gameState.resetGame();
        this.showScreen("playing");
        gameLoop.start();
    },

    pauseGame() {
        if (gameState.getCurrentState() === GAME_STATES.PLAYING) {
            gameState.changeState(GAME_STATES.PAUSED);
            this.el.screenPause.classList.remove("hidden");
        }
    },

    resumeGame() {
        if (gameState.getCurrentState() === GAME_STATES.PAUSED) {
            gameState.changeState(GAME_STATES.PLAYING);
            this.el.screenPause.classList.add("hidden");
        }
    },

    quitToMenu() {
        gameLoop.stop();
        this.showScreen("menu");
    },

    updateHUD() {
        if (gameState.getCurrentState() !== GAME_STATES.PLAYING) return;

        this.el.score.textContent = `SCORE: ${gameState.score}`;
        this.el.credits.textContent = `CREDITS: ${database.getCredits()}$`;

        const hpPercent = Math.max(0, (gameState.player.hp / gameState.player.maxHp) * 100);
        const shieldPercent = Math.max(0, (gameState.player.shield / gameState.player.maxShield) * 100);

        this.el.hpBar.style.width = `${hpPercent}%`;
        this.el.shieldBar.style.width = `${shieldPercent}%`;

        if (gameState.player.isDead) {
            this.showScreen("gameover");
            gameLoop.stop();
        }
    }
};
 
