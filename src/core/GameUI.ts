export type GameState = 'HOME' | 'PLAYING' | 'DEAD';

export class GameUI {
    public state: GameState = 'HOME';

    private homeScreen: HTMLElement;
    private deathScreen: HTMLElement;
    private mobileControls: HTMLElement;
    private ingameUI: HTMLElement;
    private playBtn: HTMLElement;
    private replayBtn: HTMLElement;
    private ingameRetryBtn: HTMLElement;

    // Mobile joystick state
    public joystickX = 0; // -1 to 1
    public mobileJump = false;
    public mobileInteract = false;

    private onPlay: () => void;
    private onReplay: () => void;
    private isMobile: boolean;

    // Joystick internals
    private joystickBase: HTMLElement;
    private joystickKnob: HTMLElement;
    private joystickTouchId: number | null = null;
    private joystickCenterX = 0;
    private joystickCenterY = 0;
    private joystickRadius = 40;

    constructor(onPlay: () => void, onReplay: () => void) {
        this.onPlay = onPlay;
        this.onReplay = onReplay;

        this.homeScreen = document.getElementById('home-screen')!;
        this.deathScreen = document.getElementById('death-screen')!;
        this.mobileControls = document.getElementById('mobile-controls')!;
        this.ingameUI = document.getElementById('ingame-ui')!;
        this.playBtn = document.getElementById('play-btn')!;
        this.replayBtn = document.getElementById('replay-btn')!;
        this.ingameRetryBtn = document.getElementById('ingame-retry-btn')!;
        this.joystickBase = document.getElementById('joystick-base')!;
        this.joystickKnob = document.getElementById('joystick-knob')!;

        this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        this.setupEvents();
    }

    private setupEvents(): void {
        // Play button
        this.playBtn.addEventListener('click', async () => {
            this.state = 'PLAYING';
            this.homeScreen.classList.add('hidden');
            this.ingameUI.classList.remove('hidden');
            if (this.isMobile) {
                this.mobileControls.classList.remove('hidden');

                // Request Fullscreen and lock to Landscape on supported mobile browsers
                try {
                    const docElm = document.documentElement as any;
                    if (docElm.requestFullscreen) {
                        await docElm.requestFullscreen();
                    } else if (docElm.webkitRequestFullscreen) {
                        await docElm.webkitRequestFullscreen(); // Safari
                    }

                    if (screen.orientation && 'lock' in screen.orientation) {
                        await (screen.orientation as any).lock('landscape');
                    }
                } catch (err) {
                    console.warn("Could not lock orientation or enter fullscreen:", err);
                }
            }
            this.onPlay();
        });

        // Replay button (on death screen)
        this.replayBtn.addEventListener('click', () => {
            this.state = 'PLAYING';
            this.deathScreen.classList.add('hidden');
            this.ingameUI.classList.remove('hidden');
            if (this.isMobile) this.mobileControls.classList.remove('hidden');
            this.onReplay();
        });

        // In-game Retry button (from pause/HUD)
        this.ingameRetryBtn.addEventListener('click', () => {
            if (this.state === 'PLAYING') {
                this.onReplay(); // same effect as replay (reset to checkpoint)
            }
        });

        // Mobile joystick
        if (this.isMobile) {
            this.setupJoystick();
            this.setupMobileButtons();
        }
    }

    private setupJoystick(): void {
        const zone = document.getElementById('joystick-zone')!;

        zone.addEventListener('touchstart', (e) => {
            // Don't track if already tracking
            if (this.joystickTouchId !== null) return;
            const touch = e.changedTouches[0];
            this.joystickTouchId = touch.identifier;

            const rect = this.joystickBase.getBoundingClientRect();
            this.joystickCenterX = rect.left + rect.width / 2;
            this.joystickCenterY = rect.top + rect.height / 2;
            this.updateJoystick(touch.clientX, touch.clientY);
            e.preventDefault();
        });

        zone.addEventListener('touchmove', (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === this.joystickTouchId) {
                    this.updateJoystick(touch.clientX, touch.clientY);
                    e.preventDefault();
                    return;
                }
            }
        });

        const endJoystick = (e: TouchEvent) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.joystickTouchId) {
                    this.joystickTouchId = null;
                    this.joystickX = 0;
                    this.joystickKnob.style.transform = `translate(0px, 0px)`;
                    return;
                }
            }
        };
        zone.addEventListener('touchend', endJoystick);
        zone.addEventListener('touchcancel', endJoystick);
    }

    private updateJoystick(touchX: number, touchY: number): void {
        const dx = touchX - this.joystickCenterX;
        const dy = touchY - this.joystickCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const clamped = Math.min(dist, this.joystickRadius);
        const angle = Math.atan2(dy, dx);

        const clampedX = Math.cos(angle) * clamped;
        const clampedY = Math.sin(angle) * clamped;

        this.joystickKnob.style.transform = `translate(${clampedX}px, ${clampedY}px)`;

        // Only track horizontal for 2.5D
        this.joystickX = clampedX / this.joystickRadius;
    }

    private setupMobileButtons(): void {
        const jumpBtn = document.getElementById('btn-jump')!;
        const interactBtn = document.getElementById('btn-interact')!;

        jumpBtn.addEventListener('touchstart', (e) => {
            this.mobileJump = true;
            e.preventDefault();
        });
        jumpBtn.addEventListener('touchend', () => { this.mobileJump = false; });
        jumpBtn.addEventListener('touchcancel', () => { this.mobileJump = false; });

        interactBtn.addEventListener('touchstart', (e) => {
            this.mobileInteract = true;
            e.preventDefault();
        });
        interactBtn.addEventListener('touchend', () => { this.mobileInteract = false; });
        interactBtn.addEventListener('touchcancel', () => { this.mobileInteract = false; });
    }

    public showDeathScreen(): void {
        this.state = 'DEAD';
        this.deathScreen.classList.remove('hidden');
        this.ingameUI.classList.add('hidden');
        if (this.isMobile) this.mobileControls.classList.add('hidden');
    }

    public hideDeathScreen(): void {
        this.deathScreen.classList.add('hidden');
    }
}
