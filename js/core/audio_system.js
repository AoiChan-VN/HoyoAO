export const audioSystem = {
    context: null,
    buffers: {},
    bgmSource: null,
    isMuted: false,

    initialize(audioResources) {
        window.addEventListener("click", () => this.resumeContext(), { once: true });
        window.addEventListener("touchstart", () => this.resumeContext(), { once: true });

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        this.context = new AudioCtx();

        for (const [id, data] of Object.entries(audioResources)) {
            if (!data.buffer) continue;
            this.context.decodeAudioData(data.buffer.slice(0), (decodedBuffer) => {
                this.buffers[id] = { buffer: decodedBuffer, type: data.type };
            }, () => {});
        }
    },

    resumeContext() {
        if (this.context && this.context.state === "suspended") {
            this.context.resume();
        }
    },

    playSFX(id) {
        if (this.isMuted || !this.context || !this.buffers[id]) return;
        this.resumeContext();

        const source = this.context.createBufferSource();
        source.buffer = this.buffers[id].buffer;

        const gainNode = this.context.createGain();
        gainNode.gain.setValueAtTime(0.4, this.context.currentTime);

        source.connect(gainNode);
        gainNode.connect(this.context.destination);
        source.start(0);
    },

    playBGM(id) {
        if (!this.context || !this.buffers[id]) return;
        this.resumeContext();
        this.stopBGM();

        this.bgmSource = this.context.createBufferSource();
        this.bgmSource.buffer = this.buffers[id].buffer;
        this.bgmSource.loop = true;

        const gainNode = this.context.createGain();
        gainNode.gain.setValueAtTime(0.25, this.context.currentTime);

        this.bgmSource.connect(gainNode);
        gainNode.connect(this.context.destination);
        this.bgmSource.start(0);
    },

    stopBGM() {
        if (this.bgmSource) {
            try {
                this.bgmSource.stop(0);
            } catch (e) {}
            this.bgmSource = null;
        }
    },

    setMute(mute) {
        this.isMuted = mute;
        if (this.isMuted) {
            this.stopBGM();
        }
    }
};
 
