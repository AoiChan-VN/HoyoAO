import { database } from "./state/database.js";
import { localStorageSystem } from "./state/local_storage.js";
import { gameState } from "./state/game_state.js";
import { resourceLoader } from "./core/resource_loader.js";
import { inputManager } from "./core/input_manager.js";
import { audioSystem } from "./core/audio_system.js";
import { uiManager } from "./ui/ui_manager.js";
import { gameLoop } from "./core/game_loop.js";

document.addEventListener("DOMContentLoaded", () => {
    localStorageSystem.initialize();
    gameState.initialize();
    
    const uiElements = {
        canvas: document.getElementById("webgl-canvas"),
        hud: document.getElementById("game-hud"),
        score: document.getElementById("hud-score"),
        credits: document.getElementById("hud-credits"),
        hpBar: document.getElementById("hud-hp-bar"),
        shieldBar: document.getElementById("hud-shield-bar"),
        btnPause: document.getElementById("btn-pause-game"),
        screenMenu: document.getElementById("screen-menu"),
        btnStart: document.getElementById("btn-start-game"),
        btnOpenInventory: document.getElementById("btn-open-inventory"),
        btnOpenShop: document.getElementById("btn-open-shop"),
        screenShop: document.getElementById("screen-shop"),
        shopCurrency: document.getElementById("shop-currency"),
        shopItemContainer: document.getElementById("shop-item-container"),
        btnCloseShop: document.getElementById("btn-close-shop"),
        screenInventory: document.getElementById("screen-inventory"),
        inventoryItemContainer: document.getElementById("inventory-item-container"),
        btnCloseInventory: document.getElementById("btn-close-inventory"),
        screenPause: document.getElementById("screen-pause"),
        btnResume: document.getElementById("btn-resume-game"),
        btnQuit: document.getElementById("btn-quit-game"),
        screenGameover: document.getElementById("screen-gameover"),
        finalScore: document.getElementById("final-score"),
        finalCredits: document.getElementById("final-credits"),
        btnRestart: document.getElementById("btn-restart-game"),
        btnGoMenu: document.getElementById("btn-go-menu"),
        screenLoading: document.getElementById("screen-loading"),
        loadingText: document.getElementById("loading-text"),
        joystickZone: document.getElementById("virtual-joystick-zone"),
        joystickBase: document.getElementById("joystick-base"),
        joystickHandle: document.getElementById("joystick-handle"),
        btnVirtualFire: document.getElementById("btn-virtual-fire")
    };

    uiManager.initialize(uiElements);
    inputManager.initialize(uiElements.canvas, uiElements.joystickBase, uiElements.joystickHandle, uiElements.btnVirtualFire);

    const manifest = {
        models: [
            { id: "player_ship", url: "assets/models/player_ship.json" },
            { id: "enemy_drone", url: "assets/models/enemy_drone.json" },
            { id: "enemy_boss", url: "assets/models/enemy_boss.json" }
        ],
        audio: [
            { id: "sfx_laser", url: "assets/audio/sfx_laser.mp3", type: "sfx" },
            { id: "sfx_explosion", url: "assets/audio/sfx_explosion.mp3", type: "sfx" },
            { id: "sfx_upgrade", url: "assets/audio/sfx_upgrade.mp3", type: "sfx" },
            { id: "bgm_space_battle", url: "assets/audio/bgm_space_battle.mp3", type: "bgm" }
        ],
        textures: [
            { id: "space_skybox", url: "assets/textures/space_skybox.jpg" },
            { id: "particle_glow", url: "assets/textures/particle_glow.png" },
            { id: "ship_hull_ao", url: "assets/textures/ship_hull_ao.jpg" }
        ]
    };

    resourceLoader.load(
        manifest,
        (progress) => {
            uiManager.updateLoadingProgress(progress);
        },
        (resources) => {
            audioSystem.initialize(resources.audio);
            uiManager.onResourcesLoaded(resources);
            gameLoop.initialize(uiElements.canvas, resources);
            uiManager.showScreen("menu");
        }
    );

    window.addEventListener("resize", () => {
        if (uiElements.canvas) {
            uiElements.canvas.width = window.innerWidth;
            uiElements.canvas.height = window.innerHeight;
            gameLoop.onResize(window.innerWidth, window.innerHeight);
        }
    });
});
 
