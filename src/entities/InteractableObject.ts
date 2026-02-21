import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export type InteractableType = 'box' | 'pressurePlate' | 'lever';

export class InteractableObject {
    public mesh: THREE.Mesh;
    public body: CANNON.Body;
    public type: InteractableType;
    public isActive = false;

    private onActivate?: () => void;
    private onDeactivate?: () => void;

    constructor(
        scene: THREE.Scene,
        world: CANNON.World,
        type: InteractableType,
        position: CANNON.Vec3,
        callbacks?: { onActivate?: () => void; onDeactivate?: () => void }
    ) {
        this.type = type;
        this.onActivate = callbacks?.onActivate;
        this.onDeactivate = callbacks?.onDeactivate;

        // ---- Visual ----
        let geo: THREE.BufferGeometry;
        let mat: THREE.MeshStandardMaterial;

        if (type === 'box') {
            geo = new THREE.BoxGeometry(1, 1, 1);
            mat = new THREE.MeshStandardMaterial({ color: 0x443322, roughness: 0.9 });
        } else if (type === 'pressurePlate') {
            geo = new THREE.BoxGeometry(1.5, 0.1, 1.5);
            mat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 1.0 });
        } else { // lever
            geo = new THREE.BoxGeometry(0.2, 0.8, 0.2);
            mat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8, metalness: 0.6 });
        }

        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.position.copy(position as unknown as THREE.Vector3);
        scene.add(this.mesh);

        // ---- Physics ----
        const halfExtents =
            type === 'box' ? new CANNON.Vec3(0.5, 0.5, 0.5) :
                type === 'pressurePlate' ? new CANNON.Vec3(0.75, 0.05, 0.75) :
                    new CANNON.Vec3(0.1, 0.4, 0.1);

        const shape = new CANNON.Box(halfExtents);
        this.body = new CANNON.Body({
            mass: type === 'box' ? 10 : 0, // Pushable box; plates/levers are static
            position: position.clone(),
        });
        this.body.addShape(shape);
        this.body.allowSleep = false;
        world.addBody(this.body);
    }

    /**
     * Call from game loop - syncs mesh to physics and checks activation.
     */
    public update(playerBody: CANNON.Body): void {
        // Sync visual to physics (important for the movable box)
        this.mesh.position.copy(this.body.position as unknown as THREE.Vector3);
        this.mesh.quaternion.copy(this.body.quaternion as unknown as THREE.Quaternion);

        if (this.type === 'pressurePlate') {
            const dist = this.body.position.distanceTo(playerBody.position);
            const shouldBeActive = dist < 1.5;

            if (shouldBeActive && !this.isActive) {
                this.isActive = true;
                this.onActivate?.();
                // Visual feedback: push plate down
                this.mesh.position.y -= 0.05;
            } else if (!shouldBeActive && this.isActive) {
                this.isActive = false;
                this.onDeactivate?.();
                this.mesh.position.y += 0.05;
            }
        }
    }

    /** Toggle lever on interact button proximity */
    public tryInteract(playerBody: CANNON.Body): void {
        if (this.type !== 'lever') return;
        const dist = this.body.position.distanceTo(playerBody.position);
        if (dist > 2) return;

        this.isActive = !this.isActive;
        this.mesh.rotation.z = this.isActive ? -0.5 : 0;

        if (this.isActive) this.onActivate?.();
        else this.onDeactivate?.();
    }

    public destroy(scene: THREE.Scene, world: CANNON.World): void {
        scene.remove(this.mesh);
        world.removeBody(this.body);
    }
}
