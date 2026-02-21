import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Player } from './Player';
import { DetectionSystem } from '../systems/DetectionSystem';

type EnemyState = 'PATROL' | 'CHASE';

export class Enemy {
    public mesh: THREE.Group;
    public body: CANNON.Body;

    private spotlight: THREE.SpotLight;
    private spotlightTarget: THREE.Object3D;

    private patrolSpeed = 3;
    private chaseSpeed = 7;
    private state: EnemyState = 'PATROL';
    private patrolDirection = 1;
    private detection: DetectionSystem;
    private faceDirection = 1;
    private patrolMinX: number;
    private patrolMaxX: number;

    constructor(scene: THREE.Scene, world: CANNON.World, position: CANNON.Vec3, patrolMinX = -15, patrolMaxX = 15) {
        this.patrolMinX = patrolMinX;
        this.patrolMaxX = patrolMaxX;

        // ----- Humanoid Visual (taller, black silhouette) -----
        this.mesh = new THREE.Group();

        const blackMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1.0 });
        const helmetMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6, metalness: 0.4 });

        // Torso (bigger than player)
        const torsoGeo = new THREE.BoxGeometry(0.7, 0.9, 0.35);
        const torso = new THREE.Mesh(torsoGeo, blackMat);
        torso.position.y = 0.45;
        torso.castShadow = true;
        this.mesh.add(torso);

        // Head (helmet-like)
        const headGeo = new THREE.BoxGeometry(0.4, 0.45, 0.4);
        const head = new THREE.Mesh(headGeo, helmetMat);
        head.position.y = 0.7;
        torso.add(head);

        // Arms
        const createLimb = (isArm: boolean) => {
            const g = new THREE.Group();
            const geo = new THREE.BoxGeometry(isArm ? 0.18 : 0.22, isArm ? 0.7 : 0.8, isArm ? 0.18 : 0.22);
            const m = new THREE.Mesh(geo, blackMat);
            m.position.y = isArm ? -0.35 : -0.4;
            m.castShadow = true;
            g.add(m);
            return g;
        };

        const leftArm = createLimb(true);
        leftArm.position.set(0.45, 0.35, 0);
        torso.add(leftArm);

        const rightArm = createLimb(true);
        rightArm.position.set(-0.45, 0.35, 0);
        torso.add(rightArm);

        // Torch in right hand
        const torchGroup = new THREE.Group();
        torchGroup.position.set(0, -0.55, 0.1);
        rightArm.add(torchGroup);

        // Torch stick
        const stickGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.5, 6);
        const stickMat = new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 1.0 });
        const stick = new THREE.Mesh(stickGeo, stickMat);
        torchGroup.add(stick);

        // Flame (emissive glow)
        const flameGeo = new THREE.SphereGeometry(0.12, 6, 6);
        const flameMat = new THREE.MeshStandardMaterial({
            color: 0xff6600,
            emissive: 0xff4400,
            emissiveIntensity: 3,
        });
        const flame = new THREE.Mesh(flameGeo, flameMat);
        flame.position.y = 0.3;
        flame.scale.y = 1.4;
        torchGroup.add(flame);

        // Torch point light (warm flicker)
        const torchLight = new THREE.PointLight(0xff6622, 4, 12);
        torchLight.position.y = 0.35;
        torchGroup.add(torchLight);

        // Legs
        const leftLeg = createLimb(false);
        leftLeg.position.set(0.18, 0, 0);
        this.mesh.add(leftLeg);

        const rightLeg = createLimb(false);
        rightLeg.position.set(-0.18, 0, 0);
        this.mesh.add(rightLeg);

        // Flashlight/Spotlight
        this.spotlight = new THREE.SpotLight(0xffffff, 5);
        this.spotlight.angle = Math.PI / 6;
        this.spotlight.penumbra = 0.5;
        this.spotlight.distance = 30;
        this.spotlight.castShadow = true;
        this.spotlight.shadow.mapSize.width = 1024;
        this.spotlight.shadow.mapSize.height = 1024;
        this.spotlight.shadow.camera.near = 0.5;
        this.spotlight.shadow.camera.far = 30;
        this.spotlight.position.set(0, 0.5, 0);
        this.mesh.add(this.spotlight);

        // Spotlight target
        this.spotlightTarget = new THREE.Object3D();
        this.spotlightTarget.position.set(10, 0, 0);
        this.mesh.add(this.spotlightTarget);
        this.spotlight.target = this.spotlightTarget;

        scene.add(this.mesh);

        // ----- Physics -----
        const shape = new CANNON.Box(new CANNON.Vec3(0.6, 1.1, 0.6));
        this.body = new CANNON.Body({
            mass: 10,
            position: position,
            fixedRotation: true,
            linearDamping: 0,
        });
        this.body.allowSleep = false;
        this.body.addShape(shape);
        world.addBody(this.body);

        this.detection = new DetectionSystem(this.body, this.mesh);
    }

    public update(player: Player, deltaTime: number): void {
        this.mesh.position.copy(this.body.position as unknown as THREE.Vector3);
        this.mesh.quaternion.copy(this.body.quaternion as unknown as THREE.Quaternion);

        const playerIsRunning = Math.abs(player.body.velocity.x) > 2;
        const enemyFacing = new THREE.Vector3(this.faceDirection, 0, 0);
        const alertState = this.detection.update(player, deltaTime, enemyFacing, playerIsRunning);

        if (alertState === 'UNAWARE') {
            this.state = 'PATROL';
        } else if (alertState === 'CHASE') {
            this.state = 'CHASE';
        }

        switch (this.state) {
            case 'PATROL':
                this.updatePatrol();
                break;
            case 'CHASE':
                this.updateChase(player);
                break;
        }

        // Kill player on grab
        const distToPlayer = this.body.position.distanceTo(player.body.position);
        if (distToPlayer < 1.5 && this.state === 'CHASE') {
            player.die();
        }
    }

    private updatePatrol(): void {
        this.body.velocity.x = this.patrolSpeed * this.patrolDirection;
        this.faceDirection = this.patrolDirection;

        // Turn around at bounds
        if (this.body.position.x > this.patrolMaxX) this.patrolDirection = -1;
        if (this.body.position.x < this.patrolMinX) this.patrolDirection = 1;

        // Update spotlight direction
        this.spotlightTarget.position.set(10 * this.patrolDirection, 0, 0);
    }

    private updateChase(player: Player): void {
        const dir = Math.sign(player.body.position.x - this.body.position.x);
        this.body.velocity.x = this.chaseSpeed * dir;
        this.faceDirection = dir;

        // Spotlight tracks the player
        this.spotlightTarget.position.set(10 * dir, 0, 0);
    }
}
