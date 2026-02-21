import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class LevelChunk {
    public meshGroup: THREE.Group;
    public bodies: CANNON.Body[] = [];
    private startX: number;

    constructor(startX: number, scene: THREE.Scene, world: CANNON.World) {
        this.startX = startX;
        this.meshGroup = new THREE.Group();
        this.meshGroup.position.x = startX;
        scene.add(this.meshGroup);

        this.generateChunk(world);
    }

    private generateChunk(world: CANNON.World): void {
        const chunkWidth = 20;
        const chunkDepth = 120; // Massive depth to extend far past the camera and into the background

        // 1. Uneven Forest Floor
        const floorGeo = new THREE.PlaneGeometry(chunkWidth, chunkDepth, 15, 15);

        // Displace vertices to make it bumpy
        const posAttribute = floorGeo.attributes.position;
        for (let i = 0; i < posAttribute.count; i++) {
            const z = posAttribute.getZ(i);
            const y = posAttribute.getY(i);
            // Simple noise using sine waves for bumps
            const displacement = Math.sin(z * 1.5) * Math.cos(y * 1.5) * 0.4;
            posAttribute.setZ(i, z + displacement);
        }

        // Ensure accurate lighting on bumps
        floorGeo.computeVertexNormals();

        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x3a4045, // Much brighter muddy grey, so it contrasts with pure black shadows
            roughness: 1.0
        });
        const floorMesh = new THREE.Mesh(floorGeo, floorMat);

        // Plane is vertical by default, rotate to be horizontal
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.position.y = -0.5;
        // Centered along Z so it stretches far past the camera and back into fog
        floorMesh.position.z = 0;

        floorMesh.receiveShadow = true;
        this.meshGroup.add(floorMesh);

        // Physics Floor (Keep it a simple flat box for smooth player movement for now, 
        // full terrain physics is heavy and can cause snagging in 2D platformers)
        const floorShape = new CANNON.Box(new CANNON.Vec3(chunkWidth / 2, 0.5, chunkDepth / 2));
        const groundMaterial = new CANNON.Material('groundMaterial');
        groundMaterial.friction = 0.0;
        const floorBody = new CANNON.Body({
            mass: 0,
            material: groundMaterial,
            position: new CANNON.Vec3(this.startX, -1, -10)
        });
        floorBody.addShape(floorShape);
        world.addBody(floorBody);
        this.bodies.push(floorBody);

        // 2. Generate Trees
        const numTrees = Math.floor(Math.random() * 8) + 5; // 5 to 12 trees per chunk

        for (let i = 0; i < numTrees; i++) {
            // Random position within chunk width and depth
            const xOffset = (Math.random() - 0.5) * chunkWidth;
            // Place trees mostly in background, some in foreground
            const zOffset = Math.random() > 0.8 ? (Math.random() * 3) + 1 : -(Math.random() * 20) - 2;

            // Random thickness and height
            const radius = Math.random() * 0.5 + 0.2;
            const height = Math.random() * 20 + 15;

            const treeGeo = new THREE.CylinderGeometry(radius * 0.6, radius, height, 8);

            // Further back trees get slightly lighter material to blend with fog better, 
            // closer trees are pitch black silhouettes
            const colorIntensity = Math.min(1.0, Math.max(0, (-zOffset / 20))) * 0.15;
            const treeMat = new THREE.MeshStandardMaterial({
                color: new THREE.Color(colorIntensity, colorIntensity, colorIntensity + 0.02),
                roughness: 1.0
            });

            const treeMesh = new THREE.Mesh(treeGeo, treeMat);
            treeMesh.position.set(xOffset, height / 2 - 1, zOffset);

            // Only cast shadows if reasonably close to the light setup
            if (zOffset > -10) {
                treeMesh.castShadow = true;
                treeMesh.receiveShadow = true;
            }

            this.meshGroup.add(treeMesh);
        }

        // 3. Generate Fallen Logs & Debris
        const numLogs = Math.floor(Math.random() * 3);
        const logMat = new THREE.MeshStandardMaterial({ color: 0x020202, roughness: 1.0 });
        for (let i = 0; i < numLogs; i++) {
            const logLength = Math.random() * 4 + 2;
            const logGeo = new THREE.CylinderGeometry(0.3, 0.4, logLength, 6);
            const logMesh = new THREE.Mesh(logGeo, logMat);

            logMesh.position.set((Math.random() - 0.5) * chunkWidth, -0.6, (Math.random() - 0.5) * 10 - 5);
            logMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

            logMesh.castShadow = true;
            logMesh.receiveShadow = true;
            this.meshGroup.add(logMesh);
        }

        // 4. Occasional Abandoned Vehicle
        if (Math.random() < 0.25) {
            this.generateVehicle(chunkWidth);
        }
    }

    private generateVehicle(chunkWidth: number): void {
        const vehicleGroup = new THREE.Group();
        vehicleGroup.position.set((Math.random() - 0.5) * chunkWidth * 0.5, -0.2, (Math.random() * -5) - 2);

        // Dark, abstract trailer/van shape
        const vanGeo = new THREE.BoxGeometry(4, 2, 2);
        const vanMat = new THREE.MeshStandardMaterial({ color: 0x010202, roughness: 0.8 });
        const vanMesh = new THREE.Mesh(vanGeo, vanMat);
        vanMesh.castShadow = true;
        vanMesh.receiveShadow = true;
        vehicleGroup.add(vanMesh);

        // Glowing Headlights (Piercing the fog)
        const lightColor = 0xcceeff;

        const createHeadlight = (zOffset: number) => {
            // Emissive mesh for the bulb
            const bulbGeo = new THREE.BoxGeometry(0.1, 0.3, 0.3);
            const bulbMat = new THREE.MeshStandardMaterial({ color: lightColor, emissive: lightColor, emissiveIntensity: 2 });
            const bulb = new THREE.Mesh(bulbGeo, bulbMat);
            bulb.position.set(2.05, -0.2, zOffset);
            vehicleGroup.add(bulb);

            // Spotlight piercing fog
            const spotLight = new THREE.SpotLight(lightColor, 8);
            spotLight.position.set(2, -0.2, zOffset);
            spotLight.angle = Math.PI / 8;
            spotLight.penumbra = 0.6;
            spotLight.distance = 40;
            spotLight.castShadow = true;
            spotLight.shadow.mapSize.width = 512;
            spotLight.shadow.mapSize.height = 512;

            const target = new THREE.Object3D();
            target.position.set(20, -1, zOffset);
            vehicleGroup.add(target);
            spotLight.target = target;

            vehicleGroup.add(spotLight);
        };

        createHeadlight(0.6);
        createHeadlight(-0.6);

        // Slightly angled
        vehicleGroup.rotation.y = (Math.random() - 0.5) * 0.4;
        this.meshGroup.add(vehicleGroup);
    }

    public destroy(scene: THREE.Scene, world: CANNON.World): void {
        scene.remove(this.meshGroup);
        for (const body of this.bodies) {
            world.removeBody(body);
        }
    }
}

export class LevelManager {
    private scene: THREE.Scene;
    private world: CANNON.World;
    private chunks: LevelChunk[] = [];
    private currentChunkX: number = 0;
    private chunkSize: number = 20;

    constructor(scene: THREE.Scene, world: CANNON.World) {
        this.scene = scene;
        this.world = world;

        // Initial chunks
        this.chunks.push(new LevelChunk(0, scene, world));
        this.chunks.push(new LevelChunk(20, scene, world));
        this.chunks.push(new LevelChunk(-20, scene, world));
    }

    public update(playerX: number): void {
        // Check if player moved to next chunk bounds
        const targetChunkIndex = Math.floor((playerX + this.chunkSize / 2) / this.chunkSize);
        const targetChunkX = targetChunkIndex * this.chunkSize;

        if (targetChunkX !== this.currentChunkX) {
            this.currentChunkX = targetChunkX;
            // Load next async (mocked dynamically for now)
            console.log(`Loading chunk at ${targetChunkX + this.chunkSize}`);

            // Cleanup far chunks
            for (let i = this.chunks.length - 1; i >= 0; i--) {
                const chunk = this.chunks[i];
                if (Math.abs(chunk.meshGroup.position.x - targetChunkX) > this.chunkSize * 2) {
                    chunk.destroy(this.scene, this.world);
                    this.chunks.splice(i, 1);
                }
            }

            // Simple forward generation
            // Ensure there is a chunk ahead
            const forwardX = targetChunkX + this.chunkSize;
            if (!this.chunks.some(c => c.meshGroup.position.x === forwardX)) {
                this.chunks.push(new LevelChunk(forwardX, this.scene, this.world));
            }
        }
    }
}
