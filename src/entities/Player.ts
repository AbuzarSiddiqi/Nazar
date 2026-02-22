import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { InputManager } from '../core/InputManager';

export class Player {
    public mesh: THREE.Group;
    public body: CANNON.Body;
    private world: CANNON.World;

    private movementSpeed = 6.5; // Slightly faster base run
    private jumpForce = 7.5; // Slightly snappier jump

    public isMindControlling = false; // Flag to disable input when in helmet
    public isStartingIntro = false; // Flag to disable input during intro falling sequence
    public onDeath: (() => void) | null = null; // Callback for death events (e.g. checkpoint respawn)

    // Animation Parts
    private torsoGroup!: THREE.Mesh;
    private leftArmGroup!: THREE.Group;
    private rightArmGroup!: THREE.Group;
    private leftLegGroup!: THREE.Group;
    private rightLegGroup!: THREE.Group;
    private headMesh!: THREE.Mesh;
    private walkTime = 0;

    // Movement State
    private coyoteTime = 0.1; // seconds of coyote time
    private coyoteTimer = 0;
    private wasGrounded = false;
    private jumpHeld = false;
    private jumpUsed = false;

    constructor(scene: THREE.Scene, world: CANNON.World) {
        this.world = world;
        // Visual (Articulated boy silhouette)
        this.mesh = new THREE.Group();

        // Materials
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.8 }); // Pale skin
        const shirtMat = new THREE.MeshStandardMaterial({ color: 0x661111, roughness: 0.9 }); // Dark Red
        const pantsMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1.0 }); // Nearly black

        // Torso
        const torsoGeo = new THREE.BoxGeometry(0.5, 0.7, 0.3);
        this.torsoGroup = new THREE.Mesh(torsoGeo, shirtMat);
        this.torsoGroup.position.y = 0.35;
        this.torsoGroup.castShadow = true;
        this.mesh.add(this.torsoGroup);

        // Head
        const headGeo = new THREE.BoxGeometry(0.35, 0.4, 0.35);
        this.headMesh = new THREE.Mesh(headGeo, skinMat);
        this.headMesh.position.y = 0.55;
        this.torsoGroup.add(this.headMesh);

        // Arm creation helper
        const createLimb = (isArm: boolean, material: THREE.Material) => {
            const group = new THREE.Group();
            const geo = new THREE.BoxGeometry(isArm ? 0.15 : 0.2, isArm ? 0.6 : 0.7, isArm ? 0.15 : 0.2);
            const mesh = new THREE.Mesh(geo, material);
            // Move mesh down so the group acts as a shoulder/hip joint at Y=0
            mesh.position.y = isArm ? -0.3 : -0.35;
            mesh.castShadow = true;
            group.add(mesh);
            return group;
        };

        // Arms (Attached to Torso)
        this.leftArmGroup = createLimb(true, skinMat);
        this.leftArmGroup.position.set(0.35, 0.3, 0);
        this.torsoGroup.add(this.leftArmGroup);

        this.rightArmGroup = createLimb(true, skinMat);
        this.rightArmGroup.position.set(-0.35, 0.3, 0);
        this.torsoGroup.add(this.rightArmGroup);

        // Legs (Attached to root mesh)
        this.leftLegGroup = createLimb(false, pantsMat);
        this.leftLegGroup.position.set(0.15, 0, 0);
        this.mesh.add(this.leftLegGroup);

        this.rightLegGroup = createLimb(false, pantsMat);
        this.rightLegGroup.position.set(-0.15, 0, 0);
        this.mesh.add(this.rightLegGroup);

        scene.add(this.mesh);

        // Physics
        const shape = new CANNON.Box(new CANNON.Vec3(0.5, 1, 0.5));

        // Zero friction material so the player doesn't drag on the ground while walking
        const physicsMaterial = new CANNON.Material('playerMaterial');
        physicsMaterial.friction = 0.0;

        this.body = new CANNON.Body({
            mass: 5,
            material: physicsMaterial,
            position: new CANNON.Vec3(0, 5, 0),
            fixedRotation: true,
            linearDamping: 0, // No velocity damping — we handle deceleration ourselves
        });
        this.body.allowSleep = false;
        this.body.addShape(shape);
        world.addBody(this.body);
    }

    public update(inputManager: InputManager, deltaTime: number): void {
        this.mesh.position.copy(this.body.position as unknown as THREE.Vector3);

        let takeInput = !this.isMindControlling && !this.isStartingIntro;

        const velocity = this.body.velocity;

        // ---- Ground Detection ----
        const from = this.body.position;
        const to = new CANNON.Vec3(from.x, from.y - 1.1, from.z);
        const result = new CANNON.RaycastResult();
        this.world.raycastClosest(from, to, { skipBackfaces: true }, result);
        const isGrounded = result.hasHit;

        // ---- Coyote Time ----
        if (isGrounded) {
            this.coyoteTimer = this.coyoteTime;
        } else {
            this.coyoteTimer = Math.max(0, this.coyoteTimer - deltaTime);
        }
        const canJump = this.coyoteTimer > 0;

        // ---- Horizontal Movement ----
        let targetVelX = 0;
        if (takeInput && inputManager.isMovingLeft()) {
            targetVelX = -this.movementSpeed;
        } else if (takeInput && inputManager.isMovingRight()) {
            targetVelX = this.movementSpeed;
        }

        if (isGrounded) {
            if (this.isStartingIntro) {
                // Dampen velocity if basically stopped vertically
                if (Math.abs(velocity.y) < 0.1) {
                    velocity.x *= 0.95;
                    if (Math.abs(velocity.x) < 0.1) velocity.x = 0;
                }
            } else if (this.isMindControlling) {
                velocity.x *= 0.8;
                if (Math.abs(velocity.x) < 0.1) velocity.x = 0;
            } else {
                // Direct velocity assignment — reliable on ground
                if (targetVelX !== 0) {
                    velocity.x = targetVelX;
                } else {
                    // Slight deceleration slide when stopping
                    velocity.x *= 0.8;
                    if (Math.abs(velocity.x) < 0.1) velocity.x = 0;
                }
            }
        } else {
            // Air control — momentum based, much less responsive
            if (takeInput) {
                const airAccel = 15;
                if (targetVelX !== 0) {
                    const step = airAccel * deltaTime;
                    if (Math.abs(velocity.x - targetVelX) < step) {
                        velocity.x = targetVelX;
                    } else {
                        velocity.x += Math.sign(targetVelX - velocity.x) * step;
                    }
                }
            }
        }

        // ---- Jump (Single-lock with coyote time) ----
        const jumpJustPressed = takeInput && inputManager.isJumpPressed() && !this.jumpHeld;
        this.jumpHeld = takeInput && inputManager.isJumpPressed();

        if (jumpJustPressed && canJump && !this.jumpUsed) {
            velocity.y = this.jumpForce;
            this.coyoteTimer = 0;
            this.jumpUsed = true;
        }
        if (isGrounded) {
            this.jumpUsed = false;
        }

        // ---- Fall damage ----
        if (!this.isStartingIntro && isGrounded && !this.wasGrounded && velocity.y < -20) {
            this.die();
        }
        this.wasGrounded = isGrounded;


        // --- Realistic Procedural Animations ---
        const speed = Math.abs(velocity.x);

        // Face the direction of movement smoothly
        if (velocity.x > 0.1) {
            this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, Math.PI / 2, deltaTime * 10);
        } else if (velocity.x < -0.1) {
            this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, -Math.PI / 2, deltaTime * 10);
        }

        if (isGrounded) {
            if (speed > 0.1) {
                // Heavy, frantic running
                this.walkTime += deltaTime * 18; // Fast frantic step cadence

                // Sine waves for cyclical animation. Using offset phases for arms vs legs
                const legSwing = Math.sin(this.walkTime);
                const armSwing = Math.sin(this.walkTime + Math.PI); // Arms swing opposite to legs

                // Double frequency for vertical bobbing (bobs twice per full stride)
                const bobbing = Math.abs(Math.cos(this.walkTime));

                // 1. Limbs
                this.leftLegGroup.rotation.x = legSwing * 1.0;
                this.rightLegGroup.rotation.x = -legSwing * 1.0;

                // Arms swing more wildly, with a slight bent elbow look (base rotation)
                this.leftArmGroup.rotation.x = armSwing * 1.2 + 0.2;
                this.rightArmGroup.rotation.x = -armSwing * 1.2 + 0.2;

                // Arms slightly outward
                this.leftArmGroup.rotation.z = 0.1;
                this.rightArmGroup.rotation.z = -0.1;

                // 2. Torso leaning and bobbing
                // Lean forward heavily when running
                this.torsoGroup.rotation.x = THREE.MathUtils.lerp(this.torsoGroup.rotation.x, 0.4, 0.2);

                // Torso bobs up and down with steps, settling lower to ground (heavy)
                this.torsoGroup.position.y = 0.35 - (bobbing * 0.15);

                // 3. Head looks forward/up slightly to counter torso lean
                this.headMesh.rotation.x = -0.2 + (bobbing * 0.1);

            } else {
                // Idle Breathing
                this.walkTime += deltaTime * 2;
                const breath = Math.sin(this.walkTime);

                // Return smoothly to idle
                this.leftLegGroup.rotation.x = THREE.MathUtils.lerp(this.leftLegGroup.rotation.x, 0, 0.1);
                this.rightLegGroup.rotation.x = THREE.MathUtils.lerp(this.rightLegGroup.rotation.x, 0, 0.1);

                this.leftArmGroup.rotation.x = THREE.MathUtils.lerp(this.leftArmGroup.rotation.x, 0, 0.1);
                this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(this.rightArmGroup.rotation.x, 0, 0.1);
                this.leftArmGroup.rotation.z = THREE.MathUtils.lerp(this.leftArmGroup.rotation.z, 0.05, 0.1);
                this.rightArmGroup.rotation.z = THREE.MathUtils.lerp(this.rightArmGroup.rotation.z, -0.05, 0.1);

                this.torsoGroup.rotation.x = THREE.MathUtils.lerp(this.torsoGroup.rotation.x, 0, 0.1);
                this.torsoGroup.position.y = 0.35 + (breath * 0.02); // Gentle breathing bob
                this.headMesh.rotation.x = THREE.MathUtils.lerp(this.headMesh.rotation.x, 0, 0.1);
            }
        } else {
            // Jumping/Falling pose (Frantic flailing)
            this.walkTime += deltaTime * 5; // Fast flailing arms
            const flail = Math.sin(this.walkTime);

            // Torso straightens out mid-air
            this.torsoGroup.rotation.x = THREE.MathUtils.lerp(this.torsoGroup.rotation.x, 0.1, 0.1);
            this.torsoGroup.position.y = THREE.MathUtils.lerp(this.torsoGroup.position.y, 0.35, 0.1);
            this.headMesh.rotation.x = THREE.MathUtils.lerp(this.headMesh.rotation.x, 0, 0.1);

            // Arms raised and flailing slightly
            this.leftArmGroup.rotation.x = THREE.MathUtils.lerp(this.leftArmGroup.rotation.x, -2.5 + (flail * 0.3), 0.1);
            this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(this.rightArmGroup.rotation.x, -2.5 - (flail * 0.3), 0.1);

            // Legs curled slightly for jump
            this.leftLegGroup.rotation.x = THREE.MathUtils.lerp(this.leftLegGroup.rotation.x, -0.4, 0.1);
            this.rightLegGroup.rotation.x = THREE.MathUtils.lerp(this.rightLegGroup.rotation.x, 0.2, 0.1);
        }
    }

    public die(): void {
        console.log("Player died!");
        if (this.onDeath) {
            this.onDeath(); // Let external systems (e.g. checkpoints) handle repositioning
        } else {
            // Fallback if no checkpoint system hooked up
            this.body.position.set(0, 5, 0);
            this.body.velocity.set(0, 0, 0);
        }
    }
}
