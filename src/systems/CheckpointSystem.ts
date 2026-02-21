import * as CANNON from 'cannon-es';

export interface CheckpointData {
    position: CANNON.Vec3;
    id: number;
}

export class CheckpointSystem {
    private checkpoints: CheckpointData[] = [];
    private lastReachedId = -1;

    /**
     * Register a checkpoint at a world position. The first registered is always the default spawn.
     */
    public register(position: CANNON.Vec3): CheckpointData {
        const cp: CheckpointData = { position: position.clone(), id: this.checkpoints.length };
        this.checkpoints.push(cp);
        return cp;
    }

    /**
     * Call from the game loop to check if the player has crossed any checkpoint.
     */
    public checkPlayer(playerBody: CANNON.Body): void {
        const px = playerBody.position.x;
        const py = playerBody.position.y;

        for (const cp of this.checkpoints) {
            if (cp.id <= this.lastReachedId) continue;
            // Simple 2D range check (X/Y plane only for 2.5D)
            const dx = px - cp.position.x;
            const dy = py - cp.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 3) {
                this.lastReachedId = cp.id;
            }
        }
    }

    /**
     * Returns the last saved checkpoint position, or origin as fallback.
     */
    public getSpawnPosition(): CANNON.Vec3 {
        const reached = this.checkpoints.find(c => c.id === this.lastReachedId);
        return reached ? reached.position.clone() : new CANNON.Vec3(0, 5, 0);
    }

    /**
     * Teleport the player body to the last checkpoint instantly (no loading screen).
     */
    public respawn(playerBody: CANNON.Body): void {
        const pos = this.getSpawnPosition();
        playerBody.position.copy(pos);
        playerBody.velocity.set(0, 0, 0);
        playerBody.angularVelocity.set(0, 0, 0);
        playerBody.wakeUp();
    }
}
