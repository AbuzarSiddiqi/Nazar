import * as THREE from 'three';

export class LightingAndFog {
    private scene: THREE.Scene;
    private particles!: THREE.Points;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.setupFog();
        this.setupLights();
        this.setupParticles();
    }

    private setupFog(): void {
        // Playdead INSIDE style: Milky, cool grey (Brightened per user request)
        const fogColor = new THREE.Color(0x485258);
        this.scene.fog = new THREE.FogExp2(fogColor, 0.03); // Slightly less dense
        this.scene.background = fogColor;
    }

    private setupLights(): void {
        // "Moonlight" or ambient rim lighting. Stark and cool.
        const dirLight = new THREE.DirectionalLight(0xddeeff, 2.5);
        dirLight.position.set(-15, 20, 15); // Angled from the front to clearly illuminate the ground and faces
        dirLight.castShadow = true;

        // Shadow constraints
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 100;
        dirLight.shadow.camera.left = -30;
        dirLight.shadow.camera.right = 30;
        dirLight.shadow.camera.top = 30;
        dirLight.shadow.camera.bottom = -30;
        dirLight.shadow.bias = -0.0005;

        this.scene.add(dirLight);

        // Ambient fill light so that shadowed areas aren't purely pitch black
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
    }

    private setupParticles(): void {
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            // Spread across a large area
            positions[i * 3] = (Math.random() - 0.5) * 80;
            positions[i * 3 + 1] = Math.random() * 20; // 0 to 20 height
            positions[i * 3 + 2] = (Math.random() - 0.5) * 40;

            velocities.push({
                x: (Math.random() - 0.5) * 0.1,
                y: -Math.random() * 0.05 - 0.02,
                z: (Math.random() - 0.5) * 0.1
            });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Slightly opaque, glowing particles
        const material = new THREE.PointsMaterial({
            color: 0x88aabb,
            size: 0.08,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geometry, material);
        // Store velocities in userData for update loop
        this.particles.userData.velocities = velocities;
        this.scene.add(this.particles);
    }

    public update(deltaTime: number): void {
        if (!this.particles) return;

        const positions = this.particles.geometry.attributes.position.array as Float32Array;
        const velocities = this.particles.userData.velocities;

        for (let i = 0; i < velocities.length; i++) {
            positions[i * 3] += velocities[i].x * deltaTime;
            positions[i * 3 + 1] += velocities[i].y * deltaTime;
            positions[i * 3 + 2] += velocities[i].z * deltaTime;

            // Reset if they fall too low
            if (positions[i * 3 + 1] < -2) {
                positions[i * 3 + 1] = 20;
                positions[i * 3] = (Math.random() - 0.5) * 80;
                positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
            }
        }

        this.particles.geometry.attributes.position.needsUpdate = true;
    }
}
