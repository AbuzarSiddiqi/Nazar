import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Wolf } from '../entities/Wolf';
import { InteractableObject } from '../entities/InteractableObject';
import { HazardZone } from './HazardZone';
import { CheckpointSystem } from '../systems/CheckpointSystem';
import { InputManager } from '../core/InputManager';

// Zero-friction material for all ground bodies
function groundMat(): CANNON.Material {
    const m = new CANNON.Material('ground');
    m.friction = 0.0;
    return m;
}

/** Static platform (visual + physics) */
function createPlatform(
    scene: THREE.Scene, world: CANNON.World,
    x: number, y: number, w: number, h: number,
    color = 0x3a4045, depth = 120, rotationZ = 0
): CANNON.Body {
    // Visual
    const geo = new THREE.BoxGeometry(w, h, depth);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 1.0 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, 0);
    mesh.rotation.z = rotationZ;
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    scene.add(mesh);

    // Physics
    const shape = new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, depth / 2));
    const body = new CANNON.Body({ mass: 0, material: groundMat(), position: new CANNON.Vec3(x, y, 0) });
    if (rotationZ !== 0) {
        body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), rotationZ);
    }
    body.addShape(shape);
    world.addBody(body);
    return body;
}

/** Thin wall or door (visual + physics) */
function createWall(
    scene: THREE.Scene, world: CANNON.World,
    x: number, y: number, w: number, h: number,
    color = 0x222222
): { mesh: THREE.Mesh; body: CANNON.Body } {
    const geo = new THREE.BoxGeometry(w, h, 2);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, 0);
    mesh.castShadow = true;
    scene.add(mesh);

    const shape = new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, 1));
    const body = new CANNON.Body({ mass: 0, position: new CANNON.Vec3(x, y, 0) });
    body.addShape(shape);
    world.addBody(body);
    return { mesh, body };
}

/** Background tree decoration */
function createTree(scene: THREE.Scene, x: number, z: number): void {
    const height = Math.random() * 20 + 12;
    const radius = Math.random() * 0.5 + 0.2;
    const geo = new THREE.CylinderGeometry(radius * 0.6, radius, height, 6);
    const intensity = Math.min(1.0, Math.max(0, (-z / 20))) * 0.15;
    const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(intensity, intensity, intensity + 0.02),
        roughness: 1.0
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, height / 2 - 1, z);
    if (z > -10) { mesh.castShadow = true; }
    scene.add(mesh);
}

/** Cover/hide crate (visual only, not pushable — just decoration to hide behind) */
function createCover(scene: THREE.Scene, world: CANNON.World, x: number, y: number): CANNON.Body {
    const geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const mat = new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 1.0 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const shape = new CANNON.Box(new CANNON.Vec3(0.75, 0.75, 0.75));
    const body = new CANNON.Body({ mass: 0, position: new CANNON.Vec3(x, y, 0) });
    body.addShape(shape);
    world.addBody(body);
    return body;
}

/** Uneven ground plane for visual depth (no physics) */
function createGroundVisual(scene: THREE.Scene, x: number, w: number): void {
    const depth = 120;
    const geo = new THREE.PlaneGeometry(w, depth, 10, 10);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const z = pos.getZ(i);
        const y = pos.getY(i);
        pos.setZ(i, z + Math.sin(z * 1.5) * Math.cos(y * 1.5) * 0.3);
    }
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ color: 0x3a4045, roughness: 1.0 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, -0.5, 0);
    mesh.receiveShadow = true;
    scene.add(mesh);
}

/** Abandoned vehicle with headlights piercing through darkness */
function createVehicle(scene: THREE.Scene, x: number, z: number, rotY = 0): void {
    const group = new THREE.Group();
    group.position.set(x, -0.2, z);

    // Dark van/trailer silhouette
    const vanGeo = new THREE.BoxGeometry(4, 2, 2);
    const vanMat = new THREE.MeshStandardMaterial({ color: 0x010202, roughness: 0.8 });
    const van = new THREE.Mesh(vanGeo, vanMat);
    van.castShadow = true;
    van.receiveShadow = true;
    group.add(van);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.15, 8);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 1.0 });
    const wheelPositions = [[-1.2, -0.8, 1.0], [1.2, -0.8, 1.0], [-1.2, -0.8, -1.0], [1.2, -0.8, -1.0]];
    for (const [wx, wy, wz] of wheelPositions) {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(wx, wy, wz);
        group.add(wheel);
    }

    // Piercing headlights (the defining atmosphere visual)
    const lightColor = 0xcceeff;
    const createHeadlight = (zOff: number) => {
        // Emissive bulb
        const bulbGeo = new THREE.BoxGeometry(0.1, 0.3, 0.3);
        const bulbMat = new THREE.MeshStandardMaterial({ color: lightColor, emissive: lightColor, emissiveIntensity: 2 });
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        bulb.position.set(2.05, -0.2, zOff);
        group.add(bulb);

        // Spotlight beam cutting through fog
        const spot = new THREE.SpotLight(lightColor, 8);
        spot.position.set(2, -0.2, zOff);
        spot.angle = Math.PI / 8;
        spot.penumbra = 0.6;
        spot.distance = 40;
        spot.castShadow = true;
        spot.shadow.mapSize.set(512, 512);

        const target = new THREE.Object3D();
        target.position.set(20, -1, zOff);
        group.add(target);
        spot.target = target;
        group.add(spot);
    };

    createHeadlight(0.6);
    createHeadlight(-0.6);

    group.rotation.y = rotY;
    scene.add(group);
}

// ===========================
// LEVEL BUILDER
// ===========================

export class LevelBuilder {
    public enemies: Enemy[] = [];
    public interactables: InteractableObject[] = [];
    public hazards: HazardZone[] = [];
    public checkpointSystem: CheckpointSystem;
    public wolf: Wolf | null = null;
    public wolfChaseTriggered = false;
    public wolfChaseX = 190; // Player X position that triggers the chase
    private safeZoneDoor: { mesh: THREE.Mesh; body: CANNON.Body; isClosed: boolean } | null = null;

    // Timed door state
    private timedDoor: { mesh: THREE.Mesh; body: CANNON.Body; openTimer: number; isOpen: boolean } | null = null;
    private world: CANNON.World;
    private scene: THREE.Scene;

    constructor(scene: THREE.Scene, world: CANNON.World) {
        this.scene = scene;
        this.world = world;
        this.checkpointSystem = new CheckpointSystem();

        this.buildSection1_ForestIntro();
        this.buildSection2_FirstGap();
        this.buildSection3_BoxPuzzle();
        this.buildSection4_StealthZone();
        this.buildSection5_SpikeGauntlet();
        this.buildSection6_LeverDoor();
        this.buildSection7_VerticalClimb();
        this.buildSection8_FacilityEntrance();
        this.buildSection9_WolfChase();
        this.buildSection10_DesperateRun();
        this.buildSection11_SafeZone();
    }

    // =====================================
    // SECTION 1: Forest Intro (x: 0 → 20)
    // Learn to run and jump
    // =====================================
    private buildSection1_ForestIntro(): void {
        // Cliff to slide down at start
        createPlatform(this.scene, this.world, -4, 5, 12, 1, 0x3a4045, 120, -Math.PI / 4);

        // Ground platform
        createPlatform(this.scene, this.world, 10, -1.5, 22, 1);
        createGroundVisual(this.scene, 10, 22);

        // Checkpoint: Start
        this.checkpointSystem.register(new CANNON.Vec3(-3, 8, 0));

        // Background trees
        for (let i = 0; i < 15; i++) {
            createTree(this.scene, -10 + Math.random() * 30, -(Math.random() * 20 + 3));
        }

        // Massive, dark foreground trees (Silhouettes wrapping the screen edges)
        // varying in distance (z), radius (r), and slight tilt for a natural, 2.5D parallax feel
        const createForegroundTree = (x: number, z: number, r: number, tiltZ: number = 0) => {
            // Randomize the number of segments slightly to make some look more stylized/angular
            const segments = Math.floor(Math.random() * 3) + 6;
            const geo = new THREE.CylinderGeometry(r * 0.7, r, 40, segments);
            const mat = new THREE.MeshBasicMaterial({ color: 0x010203 }); // Pitch black silhouette
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, 10, z);
            mesh.rotation.z = tiltZ;
            this.scene.add(mesh);
        };

        // Place silhouettes with varying Z depth for parallax
        // Closer = higher Z, moves faster. Further = lower Z, moves slower.
        createForegroundTree(-8, 22, 1.8, 0.05);  // Very close, slightly tilted left
        createForegroundTree(-2, 12, 0.8, -0.02); // Further back, thinner
        createForegroundTree(6, 25, 2.5, -0.08);  // Massive, very close, blocking right side
        createForegroundTree(14, 15, 1.2, 0.04);  // Mid-ground foreground
        createForegroundTree(22, 28, 3.0, 0.02);  // Huge tree later on

        // Abandoned vehicle with headlights
        createVehicle(this.scene, 8, -6, 0.15);

        // Moon light (Dim, cool blue light washing over the start sequence)
        const moonLight = new THREE.DirectionalLight(0xaaccff, 0.4);
        moonLight.position.set(-10, 20, 10);
        moonLight.target.position.set(5, 0, 0);
        moonLight.castShadow = true;
        moonLight.shadow.mapSize.width = 1024;
        moonLight.shadow.mapSize.height = 1024;
        moonLight.shadow.camera.near = 0.5;
        moonLight.shadow.camera.far = 50;
        moonLight.shadow.camera.left = -15;
        moonLight.shadow.camera.right = 15;
        moonLight.shadow.camera.top = 15;
        moonLight.shadow.camera.bottom = -15;
        this.scene.add(moonLight);
        this.scene.add(moonLight.target);
    }

    // =====================================
    // SECTION 2: First Gap (x: 20 → 40)
    // First death lesson — jump over the gap
    // =====================================
    private buildSection2_FirstGap(): void {
        // Left ground (before gap)
        createPlatform(this.scene, this.world, 24, -1.5, 6, 1);
        createGroundVisual(this.scene, 24, 6);

        // GAP from x:27 to x:31 — no ground!

        // Right ground (after gap)
        createPlatform(this.scene, this.world, 35, -1.5, 8, 1);
        createGroundVisual(this.scene, 35, 8);

        // Death zone below the gap
        this.hazards.push(new HazardZone(this.scene, 'fall', 29, -8, 6, 10, false));

        // Checkpoint after gap
        this.checkpointSystem.register(new CANNON.Vec3(32, 2, 0));

        // Trees
        for (let i = 0; i < 6; i++) {
            createTree(this.scene, 22 + Math.random() * 16, -(Math.random() * 15 + 4));
        }
        // Vehicle in background with eerie headlights
        createVehicle(this.scene, 34, -8, -0.2);
    }

    // =====================================
    // SECTION 3: Box Puzzle (x: 40 → 65)
    // Push box to reach high ledge
    // =====================================
    private buildSection3_BoxPuzzle(): void {
        // Ground before gap
        createPlatform(this.scene, this.world, 44, -1.5, 10, 1);
        createGroundVisual(this.scene, 44, 10);

        // Small gap (x:49 → x:52) — player must push box into the gap to cross
        // OR jump across if skilled

        // Ground after the gap
        createPlatform(this.scene, this.world, 58, -1.5, 14, 1);
        createGroundVisual(this.scene, 58, 14);

        // Pushable box — push it into the gap to create a bridge, or use as a step
        this.interactables.push(
            new InteractableObject(this.scene, this.world, 'box', new CANNON.Vec3(46, 0.5, 0))
        );

        // Small raised ledge to reward exploration
        createPlatform(this.scene, this.world, 55, 1.0, 3, 0.4, 0x2a3035);

        // Death zone below the gap
        this.hazards.push(new HazardZone(this.scene, 'fall', 50.5, -8, 5, 10, false));

        // Checkpoint
        this.checkpointSystem.register(new CANNON.Vec3(53, 2, 0));

        // Trees
        for (let i = 0; i < 5; i++) {
            createTree(this.scene, 42 + Math.random() * 20, -(Math.random() * 15 + 5));
        }
    }

    // =====================================
    // SECTION 4: Stealth Zone (x: 65 → 95)
    // 2 guards patrolling; hide behind cover
    // =====================================
    private buildSection4_StealthZone(): void {
        // Ground
        createPlatform(this.scene, this.world, 80, -1.5, 32, 1);
        createGroundVisual(this.scene, 80, 32);

        // Cover crates to hide behind
        createCover(this.scene, this.world, 70, -0.25);
        createCover(this.scene, this.world, 78, -0.25);
        createCover(this.scene, this.world, 86, -0.25);

        // Guard 1: patrols x:72 → x:82
        this.enemies.push(new Enemy(this.scene, this.world, new CANNON.Vec3(75, 2, 0), 72, 82));

        // Guard 2: patrols x:83 → x:92
        this.enemies.push(new Enemy(this.scene, this.world, new CANNON.Vec3(88, 2, 0), 83, 92));

        // Checkpoint after stealth
        this.checkpointSystem.register(new CANNON.Vec3(93, 2, 0));

        // Parked guard vehicle with headlights illuminating the zone
        createVehicle(this.scene, 75, -5, 0.3);
    }

    // =====================================
    // SECTION 5: Spike Gauntlet (x: 95 → 120)
    // 4 spike pits with safe islands
    // =====================================
    private buildSection5_SpikeGauntlet(): void {
        // Entry platform
        createPlatform(this.scene, this.world, 97, -1.5, 4, 1);
        createGroundVisual(this.scene, 97, 4);

        // Spike pit 1 (x:99→102), island 1 (x:102→105)
        this.hazards.push(new HazardZone(this.scene, 'spike', 100.5, -2, 3, 2));
        createPlatform(this.scene, this.world, 103.5, -1.5, 3, 1);

        // Spike pit 2 (x:105→108), island 2 (x:108→111)
        this.hazards.push(new HazardZone(this.scene, 'spike', 106.5, -2, 3, 2));
        createPlatform(this.scene, this.world, 109.5, -1.5, 3, 1);

        // Spike pit 3 (x:111→114), island 3 (x:114→117)
        this.hazards.push(new HazardZone(this.scene, 'spike', 112.5, -2, 3, 2));
        createPlatform(this.scene, this.world, 115.5, -1.5, 3, 1);

        // Spike pit 4 (x:117→120), exit platform
        this.hazards.push(new HazardZone(this.scene, 'spike', 118.5, -2, 3, 2));

        // Exit ground
        createPlatform(this.scene, this.world, 122, -1.5, 4, 1);
        createGroundVisual(this.scene, 122, 4);

        // Checkpoint after spikes
        this.checkpointSystem.register(new CANNON.Vec3(121, 2, 0));
    }

    // =====================================
    // SECTION 6: Lever & Door (x: 120 → 145)
    // Pull lever, sprint through timed door
    // =====================================
    private buildSection6_LeverDoor(): void {
        // Ground
        createPlatform(this.scene, this.world, 134, -1.5, 22, 1);
        createGroundVisual(this.scene, 134, 22);

        // The door wall (blocks path until lever pulled)
        const door = createWall(this.scene, this.world, 140, 1, 0.5, 5, 0x444444);
        this.timedDoor = { mesh: door.mesh, body: door.body, openTimer: 0, isOpen: false };

        // Lever (at x:128 — player must run 12 units to reach door before it closes)
        this.interactables.push(
            new InteractableObject(this.scene, this.world, 'lever', new CANNON.Vec3(128, 0, 0), {
                onActivate: () => {
                    if (this.timedDoor) {
                        this.timedDoor.isOpen = true;
                        this.timedDoor.openTimer = 5.0; // 5 seconds
                        this.timedDoor.mesh.visible = false;
                        this.timedDoor.body.collisionResponse = false;
                    }
                }
            })
        );

        // Checkpoint before door
        this.checkpointSystem.register(new CANNON.Vec3(126, 2, 0));
    }

    // =====================================
    // SECTION 7: Vertical Climb (x: 145 → 165)
    // Stacked platforms going up
    // =====================================
    private buildSection7_VerticalClimb(): void {
        // Base ground
        createPlatform(this.scene, this.world, 150, -1.5, 10, 1);
        createGroundVisual(this.scene, 150, 10);

        // Climbing platforms (staircase going up-right)
        createPlatform(this.scene, this.world, 153, 0.5, 3, 0.4, 0x2a3035);
        createPlatform(this.scene, this.world, 156, 2.5, 3, 0.4, 0x2a3035);
        createPlatform(this.scene, this.world, 159, 4.5, 4, 0.4, 0x2a3035);

        // Top ground — wide and connected directly to descending path
        createPlatform(this.scene, this.world, 164, 4.5, 6, 1, 0x2a3035);

        // Checkpoint at top
        this.checkpointSystem.register(new CANNON.Vec3(163, 7, 0));
    }

    // =====================================
    // SECTION 8: Facility Entrance (x: 165 → 195)
    // Descend and reach the facility
    // =====================================
    private buildSection8_FacilityEntrance(): void {
        // Descending steps — smooth path from climb top to ground
        createPlatform(this.scene, this.world, 169, 3.0, 4, 0.4, 0x2a3035);
        createPlatform(this.scene, this.world, 173, 1.5, 4, 0.4, 0x2a3035);

        // Facility ground (concrete-like) – long flat area
        createPlatform(this.scene, this.world, 183, -1.5, 24, 1, 0x444444);
        createGroundVisual(this.scene, 183, 24);

        // Final checkpoint
        this.checkpointSystem.register(new CANNON.Vec3(178, 2, 0));

        // The mind control helmet is placed directly in main.ts
    }

    // =====================================
    // SECTION 9: Wolf Chase Trigger (x: 190 → 230)
    // Sprint! The wolf appears behind you
    // =====================================
    private buildSection9_WolfChase(): void {
        // Long continuous ground for the chase
        createPlatform(this.scene, this.world, 210, -1.5, 40, 1);
        createGroundVisual(this.scene, 210, 40);

        // Scattered logs (visual only so wolf and player don't get snagged during the fast chase)
        const createVisualLog = (x: number) => {
            const geo = new THREE.BoxGeometry(1.5, 0.8, 1.5);
            const mat = new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 1.0 });
            const m = new THREE.Mesh(geo, mat);
            m.position.set(x, -0.6, 0);
            m.castShadow = true;
            this.scene.add(m);
        };
        createVisualLog(198);
        createVisualLog(206);
        createVisualLog(215);
        createVisualLog(222);

        // Dense forest trees for atmosphere
        for (let i = 0; i < 15; i++) {
            createTree(this.scene, 192 + Math.random() * 36, -(Math.random() * 25 + 3));
        }
        for (let i = 0; i < 5; i++) {
            createTree(this.scene, 195 + Math.random() * 30, Math.random() * 3 + 1);
        }

        // Checkpoint at very start of chase (in case they die)
        this.checkpointSystem.register(new CANNON.Vec3(192, 2, 0));

        // Wolf spawns behind the player 
        this.wolf = new Wolf(this.scene, this.world, new CANNON.Vec3(185, 0, 0));
    }

    // =====================================
    // SECTION 10: Desperate Run (x: 230 → 280)
    // Gaps, spikes, and the wolf right behind
    // =====================================
    private buildSection10_DesperateRun(): void {
        // Platform with gap
        createPlatform(this.scene, this.world, 235, -1.5, 8, 1);

        // Gap (x:239 → x:243) — must jump!
        this.hazards.push(new HazardZone(this.scene, 'fall', 241, -8, 4, 10, false));

        // Landing platform
        createPlatform(this.scene, this.world, 247, -1.5, 8, 1);

        // Spike hazard (x:251 → x:254)
        this.hazards.push(new HazardZone(this.scene, 'spike', 252.5, -2, 3, 2));

        // More ground with obstacles
        createPlatform(this.scene, this.world, 260, -1.5, 14, 1);
        createGroundVisual(this.scene, 260, 14);
        const geo = new THREE.BoxGeometry(1.5, 0.8, 1.5);
        const mat = new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 1.0 });
        const m1 = new THREE.Mesh(geo, mat);
        m1.position.set(258, -0.6, 0); m1.castShadow = true; this.scene.add(m1);
        const m2 = new THREE.Mesh(geo, mat);
        m2.position.set(265, -0.6, 0); m2.castShadow = true; this.scene.add(m2);

        // Another gap (x:267 → x:271)
        this.hazards.push(new HazardZone(this.scene, 'fall', 269, -8, 4, 10, false));

        // Final sprint ground
        createPlatform(this.scene, this.world, 276, -1.5, 12, 1);
        createGroundVisual(this.scene, 276, 12);

        // Dense chase forest
        for (let i = 0; i < 12; i++) {
            createTree(this.scene, 232 + Math.random() * 48, -(Math.random() * 20 + 3));
        }

        // Checkpoint mid-chase
        this.checkpointSystem.register(new CANNON.Vec3(248, 2, 0));
    }

    // =====================================
    // SECTION 11: Safe Zone (x: 280 → 300)
    // Door slams shut behind you, wolf can’t reach
    // =====================================
    private buildSection11_SafeZone(): void {
        // Narrow entrance
        createPlatform(this.scene, this.world, 290, -1.5, 20, 1, 0x444444);
        createGroundVisual(this.scene, 290, 20);

        // Heavy steel door that the wolf can’t pass
        // It starts high up (y=4) so player can pass underneath
        const door = createWall(this.scene, this.world, 284, 4.0, 0.5, 5, 0x111111);
        this.safeZoneDoor = { mesh: door.mesh, body: door.body, isClosed: false };

        // End of Act 1 visual — a dim light at the end
        const endLight = new THREE.PointLight(0x8899aa, 3, 20);
        endLight.position.set(295, 3, 0);
        this.scene.add(endLight);

        // Final checkpoint
        this.checkpointSystem.register(new CANNON.Vec3(288, 2, 0));

        // Vehicle at the end with headlights (escape vehicle?)
        createVehicle(this.scene, 295, -3, 0);
    }

    // =====================================
    // UPDATE LOOP
    // =====================================
    public update(player: Player, inputManager: InputManager, deltaTime: number): void {
        // Update all enemies
        for (const enemy of this.enemies) {
            enemy.update(player, deltaTime);
        }

        // Update all interactable objects
        for (const obj of this.interactables) {
            obj.update(player.body);
        }

        // Handle lever interaction on key press
        if (inputManager.isInteractPressed()) {
            for (const obj of this.interactables) {
                obj.tryInteract(player.body);
            }
        }

        // Check all hazard zones
        for (const hz of this.hazards) {
            hz.check(player);
        }

        // Checkpoint detection
        this.checkpointSystem.checkPlayer(player.body);

        // Out-of-bounds kill
        if (player.body.position.y < -15) {
            player.die();
        }

        // ---- Timed door logic ----
        if (this.timedDoor && this.timedDoor.isOpen) {
            this.timedDoor.openTimer -= deltaTime;
            if (this.timedDoor.openTimer <= 0) {
                this.timedDoor.isOpen = false;
                this.timedDoor.mesh.visible = true;
                this.timedDoor.body.collisionResponse = true;
            }
        }

        // ---- Wolf chase trigger ----
        if (this.wolf) {
            if (!this.wolfChaseTriggered && player.body.position.x > this.wolfChaseX) {
                this.wolfChaseTriggered = true;
                this.wolf.startChase();
            }
            this.wolf.update(player, deltaTime);

            // If player reaches safe zone (x > 284.5), slam the door and stop the wolf
            if (this.wolfChaseTriggered && player.body.position.x > 284.5) {
                // Slam door
                if (this.safeZoneDoor && !this.safeZoneDoor.isClosed) {
                    this.safeZoneDoor.isClosed = true;
                    this.safeZoneDoor.mesh.position.y = 1.0;
                    this.safeZoneDoor.body.position.y = 1.0;
                }

                // Wolf can't reach anymore
                this.wolf.isChasing = false;
                this.wolf.body.velocity.set(0, 0, 0);
            }
        }
    }
}
