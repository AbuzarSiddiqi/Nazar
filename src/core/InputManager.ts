import { GameUI } from './GameUI';

export class InputManager {
    public keys: { [key: string]: boolean } = {};
    private gameUI: GameUI | null = null;

    constructor() {
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    /** Connect the GameUI for mobile joystick/button input */
    public setGameUI(ui: GameUI): void {
        this.gameUI = ui;
    }

    private onKeyDown(event: KeyboardEvent): void {
        this.keys[event.code] = true;
    }

    private onKeyUp(event: KeyboardEvent): void {
        this.keys[event.code] = false;
    }

    public isMovingLeft(): boolean {
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) return true;
        if (this.gameUI && this.gameUI.joystickX < -0.3) return true;
        return false;
    }

    public isMovingRight(): boolean {
        if (this.keys['ArrowRight'] || this.keys['KeyD']) return true;
        if (this.gameUI && this.gameUI.joystickX > 0.3) return true;
        return false;
    }

    public isJumpPressed(): boolean {
        if (this.keys['Space']) return true;
        if (this.gameUI && this.gameUI.mobileJump) return true;
        return false;
    }

    public isInteractPressed(): boolean {
        if (this.keys['KeyE'] || this.keys['Enter']) return true;
        if (this.gameUI && this.gameUI.mobileInteract) return true;
        return false;
    }
}

