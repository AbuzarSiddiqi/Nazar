import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Player } from './Player';

/**
 * Wolf — A terrifying four-legged pursuer with glowing red eyes.
 * Once triggered, it relentlessly chases the player at high speed.
 * If it catches the player, instant death.
 */
export class Wolf {
    public mesh: THREE.Group;
    public body: CANNON.Body;
    public isChasing = false;

    private chaseSpeed = 5.8; // Slightly slower than player sprint (6.5) so player CAN escape
    private eyeGlow: THREE.PointLight;
    private leftEye: THREE.Mesh;
    private rightEye: THREE.Mesh;
    private legs: THREE.Group[] = [];
    private animTime = 0;

    constructor(scene: THREE.Scene, world: CANNON.World, position: CANNON.Vec3) {
        this.mesh = new THREE.Group();

        const blackMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1.0 });
        const eyeMat = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 4,
        });

        // Body (low, horizontal)
        const bodyGeo = new THREE.BoxGeometry(1.6, 0.5, 0.5);
        const bodyMesh = new THREE.Mesh(bodyGeo, blackMat);
        bodyMesh.position.y = 0.1;
        bodyMesh.castShadow = true;
        this.mesh.add(bodyMesh);

        // Head
        const headGeo = new THREE.BoxGeometry(0.5, 0.4, 0.4);
        const head = new THREE.Mesh(headGeo, blackMat);
        head.position.set(0.9, 0.3, 0);
        head.castShadow = true;
        this.mesh.add(head);

        // Snout
        const snoutGeo = new THREE.BoxGeometry(0.35, 0.2, 0.25);
        const snout = new THREE.Mesh(snoutGeo, blackMat);
        snout.position.set(0.3, -0.05, 0);
        head.add(snout);

        // Ears (pointed)
        const earGeo = new THREE.ConeGeometry(0.08, 0.2, 4);
        const leftEar = new THREE.Mesh(earGeo, blackMat);
        leftEar.position.set(-0.05, 0.25, 0.12);
        head.add(leftEar);
        const rightEar = new THREE.Mesh(earGeo, blackMat);
        rightEar.position.set(-0.05, 0.25, -0.12);
        head.add(rightEar);

        // Glowing red eyes
        const eyeGeo = new THREE.SphereGeometry(0.06, 6, 6);
        this.leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        this.leftEye.position.set(0.2, 0.08, 0.12);
        head.add(this.leftEye);

        this.rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        this.rightEye.position.set(0.2, 0.08, -0.12);
        head.add(this.rightEye);

        // Red eye glow point light
        this.eyeGlow = new THREE.PointLight(0xff0000, 3, 8);
        this.eyeGlow.position.set(0.25, 0.08, 0);
        head.add(this.eyeGlow);

        // Tail
        const tailGeo = new THREE.BoxGeometry(0.6, 0.1, 0.1);
        const tail = new THREE.Mesh(tailGeo, blackMat);
        tail.position.set(-1.0, 0.25, 0);
        tail.rotation.z = 0.4;
        this.mesh.add(tail);

        // 4 Legs
        const createLeg = (x: number, z: number): THREE.Group => {
            const leg = new THREE.Group();
            const legGeo = new THREE.BoxGeometry(0.12, 0.5, 0.12);
            const legMesh = new THREE.Mesh(legGeo, blackMat);
            legMesh.position.y = -0.25;
            legMesh.castShadow = true;
            leg.add(legMesh);
            leg.position.set(x, -0.1, z);
            this.mesh.add(leg);
            return leg;
        };

        this.legs.push(createLeg(0.5, 0.18));   // Front-left
        this.legs.push(createLeg(0.5, -0.18));  // Front-right
        this.legs.push(createLeg(-0.5, 0.18));  // Back-left
        this.legs.push(createLeg(-0.5, -0.18)); // Back-right

        // Initially hidden until chase triggers
        this.mesh.visible = false;
        scene.add(this.mesh);

        // Physics
        const shape = new CANNON.Box(new CANNON.Vec3(0.8, 0.3, 0.3));
        this.body = new CANNON.Body({
            mass: 8,
            position: position,
            fixedRotation: true,
            linearDamping: 0,
        });
        this.body.allowSleep = false;
        this.body.addShape(shape);

        // Start with collision disabled until chase begins
        this.body.collisionResponse = false;
        world.addBody(this.body);
    }

    /** Trigger the chase! */
    public startChase(): void {
        if (this.isChasing) return;
        this.isChasing = true;
        this.mesh.visible = true;
        this.body.collisionResponse = true;
    }

    public update(player: Player, deltaTime: number): void {
        // Sync visual to physics
        this.mesh.position.copy(this.body.position as unknown as THREE.Vector3);

        if (!this.isChasing) return;

        this.animTime += deltaTime;

        // Chase the player — always run toward them
        const dir = Math.sign(player.body.position.x - this.body.position.x);
        this.body.velocity.x = this.chaseSpeed * dir;

        // Face direction
        this.mesh.scale.x = dir > 0 ? 1 : -1;

        // Animate legs (galloping motion)
        const gallopSpeed = 12;
        const legSwing = 0.7;
        // Front legs: offset pair
        this.legs[0].rotation.z = Math.sin(this.animTime * gallopSpeed) * legSwing;
        this.legs[1].rotation.z = Math.sin(this.animTime * gallopSpeed + Math.PI * 0.3) * legSwing;
        // Back legs: offset pair
        this.legs[2].rotation.z = Math.sin(this.animTime * gallopSpeed + Math.PI) * legSwing;
        this.legs[3].rotation.z = Math.sin(this.animTime * gallopSpeed + Math.PI * 1.3) * legSwing;

        // Body bob (galloping bounce)
        this.mesh.position.y = this.body.position.y + Math.abs(Math.sin(this.animTime * gallopSpeed * 0.5)) * 0.1;

        // Eye glow flicker
        this.eyeGlow.intensity = 2.5 + Math.sin(this.animTime * 8) * 1.5;

        // Kill player on contact
        const dist = this.body.position.distanceTo(player.body.position);
        if (dist < 1.5) {
            player.die();
        }
    }
}
