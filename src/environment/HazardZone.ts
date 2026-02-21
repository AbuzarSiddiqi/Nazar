import * as THREE from 'three';
import { Player } from '../entities/Player';

export type HazardType = 'spike' | 'fall' | 'kill';

export class HazardZone {
    private triggerArea: { x: number; y: number; w: number; h: number };

    constructor(
        scene: THREE.Scene,
        type: HazardType,
        x: number, y: number,
        width: number, height: number,
        showVisual = true
    ) {
        this.triggerArea = { x, y, w: width, h: height };

        if (showVisual && type === 'spike') {
            // Create visible spike geometry
            const group = new THREE.Group();
            const spikeCount = Math.ceil(width / 0.5);
            for (let i = 0; i < spikeCount; i++) {
                const spikeGeo = new THREE.ConeGeometry(0.15, 0.6, 4);
                const spikeMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
                const spike = new THREE.Mesh(spikeGeo, spikeMat);
                spike.position.set(x - width / 2 + i * 0.5 + 0.25, y + 0.3, 0);
                spike.castShadow = true;
                group.add(spike);
            }
            scene.add(group);
        }
    }

    /**
     * Check if the player has entered this hazard zone. Call player.die() if so.
     */
    public check(player: Player): void {
        const px = player.body.position.x;
        const py = player.body.position.y;
        const { x, y, w, h } = this.triggerArea;

        if (px > x - w / 2 && px < x + w / 2 &&
            py > y - h / 2 && py < y + h / 2) {
            player.die();
        }
    }
}

/**
 * Convenience factory for a death floor below the map.
 * Any y position below threshold triggers instant death.
 */
export function createOutOfBoundsKill(player: Player, yThreshold = -15): void {
    // Called every frame
    if (player.body.position.y < yThreshold) {
        player.die();
    }
}
