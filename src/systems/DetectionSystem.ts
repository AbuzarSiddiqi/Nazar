import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Player } from '../entities/Player';

export type AlertState = 'UNAWARE' | 'SUSPICIOUS' | 'CHASE';

export class DetectionSystem {
    public alertState: AlertState = 'UNAWARE';

    // How long the enemy has been suspicious before entering chase
    private suspiciousTimer = 0;
    private readonly suspiciousThreshold = 1.5; // seconds

    // Sound radius thresholds
    private readonly runSoundRadius = 12;
    private readonly walkSoundRadius = 4;

    // Visual cone (degrees half-angle)
    private readonly fieldOfViewAngle = 70 * (Math.PI / 180);
    private readonly visionRange = 15;

    private readonly chaseDistanceLose = 20; // Distance at which chase is dropped

    private enemyBody: CANNON.Body;

    constructor(enemyBody: CANNON.Body, _enemyMesh: THREE.Group) {
        this.enemyBody = enemyBody;
    }

    /**
     * Returns the alert state this frame.
     * enemyFacing: normalized direction the enemy is looking (world space)
     */
    public update(
        player: Player,
        deltaTime: number,
        enemyFacing: THREE.Vector3,
        playerIsRunning: boolean
    ): AlertState {
        const enemyPos = new THREE.Vector3(
            this.enemyBody.position.x,
            this.enemyBody.position.y,
            this.enemyBody.position.z
        );
        const playerPos = player.mesh.position;
        const dist = enemyPos.distanceTo(playerPos);

        const canSee = this.checkLineOfSight(enemyPos, playerPos, enemyFacing, dist);
        const canHear = this.checkSound(dist, playerIsRunning);

        if (this.alertState === 'UNAWARE') {
            if (canSee || canHear) {
                this.alertState = 'SUSPICIOUS';
                this.suspiciousTimer = 0;
            }
        } else if (this.alertState === 'SUSPICIOUS') {
            if (!canSee && !canHear) {
                // Back to unaware if lost contact
                this.suspiciousTimer = Math.max(0, this.suspiciousTimer - deltaTime);
                if (this.suspiciousTimer <= 0) this.alertState = 'UNAWARE';
            } else {
                this.suspiciousTimer += deltaTime;
                if (this.suspiciousTimer >= this.suspiciousThreshold) {
                    this.alertState = 'CHASE';
                }
            }
        } else if (this.alertState === 'CHASE') {
            // Lose the player if they get far enough and are out of sight
            if (dist > this.chaseDistanceLose && !canSee) {
                this.alertState = 'SUSPICIOUS';
                this.suspiciousTimer = this.suspiciousThreshold * 0.5;
            }
        }

        return this.alertState;
    }

    private checkLineOfSight(
        enemyPos: THREE.Vector3,
        playerPos: THREE.Vector3,
        enemyFacing: THREE.Vector3,
        dist: number
    ): boolean {
        if (dist > this.visionRange) return false;

        const toPlayer = new THREE.Vector3().subVectors(playerPos, enemyPos).normalize();
        const angle = enemyFacing.angleTo(toPlayer);

        return angle < this.fieldOfViewAngle;
    }

    private checkSound(dist: number, playerIsRunning: boolean): boolean {
        const radius = playerIsRunning ? this.runSoundRadius : this.walkSoundRadius;
        return dist < radius;
    }

    public reset(): void {
        this.alertState = 'UNAWARE';
        this.suspiciousTimer = 0;
    }
}
