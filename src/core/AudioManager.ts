/**
 * AudioManager — Procedural dark ambient sound design using Web Audio API.
 * No external files needed. All sounds generated procedurally.
 *
 * Layers:
 *  1. Dark drone (constant low-frequency pad)
 *  2. Wind gusts (filtered noise bursts)
 *  3. Footstep sounds (synced to player movement)
 *  4. Forest night sounds (random chirps, cracks)
 *  5. Enemy growl (proximity-based)
 */
export class AudioManager {
    private ctx: AudioContext;
    private masterGain: GainNode;
    private started = false;

    // Drone layer
    private droneOsc1: OscillatorNode | null = null;
    private droneOsc2: OscillatorNode | null = null;
    private droneGain: GainNode | null = null;

    // Wind layer
    private windGain: GainNode | null = null;
    private windFilter: BiquadFilterNode | null = null;

    // Footstep timing
    private footstepTimer = 0;

    // Random forest sounds
    private forestTimer = 0;

    // Enemy growl
    private growlTimer = 0;

    constructor() {
        this.ctx = new window.AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.6;
        this.masterGain.connect(this.ctx.destination);
    }

    /** Must be called after user interaction (click/tap) — browser policy */
    public start(): void {
        if (this.started) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.started = true;

        this.startDrone();
        this.startWind();
    }

    // ==========================
    // DARK DRONE PAD
    // ==========================
    private startDrone(): void {
        this.droneGain = this.ctx.createGain();
        this.droneGain.gain.value = 0.12;
        this.droneGain.connect(this.masterGain);

        // Low sub-bass drone
        this.droneOsc1 = this.ctx.createOscillator();
        this.droneOsc1.type = 'sine';
        this.droneOsc1.frequency.value = 45; // Deep sub
        this.droneOsc1.connect(this.droneGain);
        this.droneOsc1.start();

        // Slightly detuned second oscillator for thick, eerie texture
        this.droneOsc2 = this.ctx.createOscillator();
        this.droneOsc2.type = 'sawtooth';
        this.droneOsc2.frequency.value = 46.5;

        const droneFilter = this.ctx.createBiquadFilter();
        droneFilter.type = 'lowpass';
        droneFilter.frequency.value = 120;
        droneFilter.Q.value = 2;

        this.droneOsc2.connect(droneFilter);
        droneFilter.connect(this.droneGain);
        this.droneOsc2.start();

        // Slow LFO to modulate drone pitch for movement
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.05; // Very slow
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 3;
        lfo.connect(lfoGain);
        lfoGain.connect(this.droneOsc1.frequency);
        lfo.start();
    }

    // ==========================
    // WIND GUSTS (filtered noise)
    // ==========================
    private startWind(): void {
        // Create noise buffer
        const bufferSize = this.ctx.sampleRate * 4;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        this.windFilter = this.ctx.createBiquadFilter();
        this.windFilter.type = 'bandpass';
        this.windFilter.frequency.value = 400;
        this.windFilter.Q.value = 0.5;

        this.windGain = this.ctx.createGain();
        this.windGain.gain.value = 0.04;

        noise.connect(this.windFilter);
        this.windFilter.connect(this.windGain);
        this.windGain.connect(this.masterGain);
        noise.start();

        // Slowly modulate wind intensity
        this.modulateWind();
    }

    private modulateWind(): void {
        if (!this.windGain || !this.windFilter) return;
        const t = this.ctx.currentTime;
        // Random gusts every 3-8 seconds
        const nextGust = 3 + Math.random() * 5;
        this.windGain.gain.setValueAtTime(0.02, t);
        this.windGain.gain.linearRampToValueAtTime(0.08 + Math.random() * 0.06, t + 1.5);
        this.windGain.gain.linearRampToValueAtTime(0.02, t + nextGust);
        this.windFilter.frequency.setValueAtTime(300 + Math.random() * 400, t);

        setTimeout(() => this.modulateWind(), nextGust * 1000);
    }

    // ==========================
    // FOOTSTEP SOUNDS
    // ==========================
    private playFootstep(): void {
        if (!this.started) return;
        const t = this.ctx.currentTime;

        // Short noise burst filtered to sound like a step on dirt
        const bufferSize = this.ctx.sampleRate * 0.08;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const env = 1 - i / bufferSize; // Decay envelope
            data[i] = (Math.random() * 2 - 1) * env * env;
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600 + Math.random() * 400;
        filter.Q.value = 1;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        source.start(t);
        source.stop(t + 0.12);
    }

    // ==========================
    // FOREST CREATURE SOUNDS
    // ==========================
    private playCreatureSound(): void {
        if (!this.started) return;
        const t = this.ctx.currentTime;
        const type = Math.random();

        if (type < 0.4) {
            // Twig snap
            const bufferSize = this.ctx.sampleRate * 0.03;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
            }
            const src = this.ctx.createBufferSource();
            src.buffer = buffer;
            const g = this.ctx.createGain();
            g.gain.value = 0.06;
            const pan = this.ctx.createStereoPanner();
            pan.pan.value = Math.random() * 2 - 1;
            src.connect(g);
            g.connect(pan);
            pan.connect(this.masterGain);
            src.start(t);
        } else if (type < 0.7) {
            // Distant owl/bird chirp — two quick tones
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1800 + Math.random() * 600, t);
            osc.frequency.linearRampToValueAtTime(1200 + Math.random() * 400, t + 0.15);
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.04, t + 0.02);
            g.gain.linearRampToValueAtTime(0, t + 0.2);
            const pan = this.ctx.createStereoPanner();
            pan.pan.value = Math.random() * 2 - 1;
            osc.connect(g);
            g.connect(pan);
            pan.connect(this.masterGain);
            osc.start(t);
            osc.stop(t + 0.25);
        } else {
            // Low distant rumble
            const osc = this.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = 60 + Math.random() * 30;
            const f = this.ctx.createBiquadFilter();
            f.type = 'lowpass';
            f.frequency.value = 150;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.06, t + 0.5);
            g.gain.linearRampToValueAtTime(0, t + 2);
            osc.connect(f);
            f.connect(g);
            g.connect(this.masterGain);
            osc.start(t);
            osc.stop(t + 2.5);
        }
    }

    // ==========================
    // ENEMY GROWL
    // ==========================
    private playGrowl(intensity: number): void {
        if (!this.started) return;
        const t = this.ctx.currentTime;

        // Low guttural oscillator
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(70 + Math.random() * 20, t);
        osc.frequency.linearRampToValueAtTime(50 + Math.random() * 15, t + 0.8);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300;
        filter.Q.value = 5;

        const gain = this.ctx.createGain();
        const vol = Math.min(0.15, intensity * 0.12);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.2);
        gain.gain.linearRampToValueAtTime(0, t + 1.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 1.5);
    }

    // ==========================
    // WOLF BARK
    // ==========================
    private playWolfBark(): void {
        if (!this.started) return;
        const t = this.ctx.currentTime;

        // Aggressive bark — sharp noise burst with pitch drop
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(250 + Math.random() * 50, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.15);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 400;
        filter.Q.value = 3;

        // Noise layer for the harsh bark texture
        const noiseLen = this.ctx.sampleRate * 0.12;
        const noiseBuf = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
        const noiseData = noiseBuf.getChannelData(0);
        for (let i = 0; i < noiseLen; i++) {
            noiseData[i] = (Math.random() * 2 - 1) * (1 - i / noiseLen);
        }
        const noiseSrc = this.ctx.createBufferSource();
        noiseSrc.buffer = noiseBuf;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        osc.connect(filter);
        filter.connect(gain);
        noiseSrc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        noiseSrc.start(t);
        osc.stop(t + 0.25);
        noiseSrc.stop(t + 0.15);
    }

    // ==========================
    // UPDATE (call every frame)
    // ==========================
    public update(deltaTime: number, playerSpeed: number, nearestEnemyDist: number, wolfDist = 999): void {
        if (!this.started) return;

        // Footsteps — based on player speed
        if (playerSpeed > 0.5) {
            const stepInterval = playerSpeed > 3 ? 0.28 : 0.45;
            this.footstepTimer += deltaTime;
            if (this.footstepTimer > stepInterval) {
                this.footstepTimer = 0;
                this.playFootstep();
            }
        } else {
            this.footstepTimer = 0.3;
        }

        // Forest creature sounds — random intervals (quieter during chase)
        if (wolfDist > 30) {
            this.forestTimer += deltaTime;
            if (this.forestTimer > 4 + Math.random() * 8) {
                this.forestTimer = 0;
                this.playCreatureSound();
            }
        }

        // Enemy growl — proximity based
        if (nearestEnemyDist < 15) {
            this.growlTimer += deltaTime;
            const growlInterval = nearestEnemyDist < 5 ? 2 : 5;
            if (this.growlTimer > growlInterval) {
                this.growlTimer = 0;
                const intensity = 1 - (nearestEnemyDist / 15);
                this.playGrowl(intensity);
            }
        }

        // Wolf barking — when wolf is chasing
        if (wolfDist < 30) {
            this.growlTimer += deltaTime;
            const barkInterval = wolfDist < 8 ? 0.8 : 2.0;
            if (this.growlTimer > barkInterval) {
                this.growlTimer = 0;
                this.playWolfBark();
            }
        }

        // Modulate drone intensity based on danger
        if (this.droneGain) {
            let dangerLevel = 0.1;
            if (wolfDist < 20) {
                dangerLevel = 0.3; // Heart pounding during chase
            } else if (nearestEnemyDist < 10) {
                dangerLevel = 0.2;
            }
            this.droneGain.gain.linearRampToValueAtTime(dangerLevel, this.ctx.currentTime + 0.5);
        }
    }

    public setMasterVolume(volume: number): void {
        this.masterGain.gain.value = volume;
    }
}
