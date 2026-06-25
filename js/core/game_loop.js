import { gameState } from "../state/game_state.js";
import { renderer } from "../graphics/renderer.js";
import { inputManager } from "./input_manager.js";
import { audioSystem } from "./audio_system.js";
import { uiManager } from "../ui/ui_manager.js";
import { GAME_STATES } from "../config/constants.js";

export const gameLoop = {
    canvas: null,
    resources: null,
    lastTime: 0,
    animationFrameId: null,

    initialize(canvas, resources) {
        this.canvas = canvas;
        this.resources = resources;
        this.lastTime = 0;
        this.animationFrameId = null;
    },

    start() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.lastTime = performance.now();
        const loop = (time) => {
            this.handleTick(time);
            this.animationFrameId = requestAnimationFrame(loop);
        };
        this.animationFrameId = requestAnimationFrame(loop);
    },

    stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    },

    handleTick(time) {
        let dt = (time - this.lastTime) / 1000;
        this.lastTime = time;

        if (dt > 0.1) {
            dt = 0.1;
        }

        const currentState = gameState.getCurrentState();

        if (currentState === GAME_STATES.PLAYING) {
            this.updateGame(dt);
            this.renderGame();
        } else if (currentState === GAME_STATES.PAUSED) {
            this.renderGame();
        }
    },

    updateGame(dt) {
        inputManager.update(dt);
        gameState.update(dt);
        uiManager.updateHUD();
    },

    renderGame() {
        renderer.clear();
        renderer.renderScene(this.resources);
    },

    onResize(width, height) {
        renderer.setViewPort(width, height);
    }
};
 
