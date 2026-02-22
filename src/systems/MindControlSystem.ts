import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Player } from '../entities/Player';
import { InputManager } from '../core/InputManager';

export class Drone {
    public mesh: THREE.Mesh;
    public body: CANNON.Body;
    private world: CANNON.World;

    private movementSpeed = 6;
    private jumpForce = 6;

    constructor(scene: THREE.Scene, world: CANNON.World, position: CANNON.Vec3) {
        this.world = world;
        // Visual (Pale, ghostly appearance)
        const geometry = new THREE.BoxGeometry(0.9, 1.9, 0.9);
        const material = new THREE.MeshStandardMaterial({ color: 0x8888aa, opacity: 0.8, transparent: true });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);

        // Physics
        const shape = new CANNON.Box(new CANNON.Vec3(0.45, 0.95, 0.45));
        this.body = new CANNON.Body({
            mass: 5,
            position: position,
            fixedRotation: true
        });
        this.body.allowSleep = false; // Prevent body from sleeping
        this.body.addShape(shape);
        world.addBody(this.body);
    }

    public syncInput(inputManager: InputManager): void {
        // Perfectly mirrors input
        const velocity = this.body.velocity;

        if (inputManager.isMovingLeft()) {
            velocity.x = -this.movementSpeed;
        } else if (inputManager.isMovingRight()) {
            velocity.x = this.movementSpeed;
        } else {
            velocity.x = 0;
        }

        let isGrounded = false;
        const from = this.body.position;
        const to = new CANNON.Vec3(from.x, from.y - 1.0, from.z); // Slightly below half-height (0.95)

        const result = new CANNON.RaycastResult();
        this.world.raycastClosest(from, to, { skipBackfaces: true }, result);

        if (result.hasHit) {
            isGrounded = true;
        }

        if (inputManager.isJumpPressed() && isGrounded && Math.abs(velocity.y) < 0.1) {
            velocity.y = this.jumpForce;
        }
    }

    public updateVisuals(): void {
        this.mesh.position.copy(this.body.position as unknown as THREE.Vector3);
        this.mesh.quaternion.copy(this.body.quaternion as unknown as THREE.Quaternion);
    }
}

export class MindControlSystem {
    public drones: Drone[] = [];
    public helmetPosition: CANNON.Vec3;

    // Visually Glowing Helmet
    private helmetMesh: THREE.Mesh;
    private wasInteractPressed: boolean = false;

    constructor(scene: THREE.Scene, position: CANNON.Vec3) {
        this.helmetPosition = position;

        // Helmet Mesh (Yellow Glow)
        const geo = new THREE.SphereGeometry(0.5);
        const mat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.8 });
        this.helmetMesh = new THREE.Mesh(geo, mat);
        this.helmetMesh.position.copy(position as unknown as THREE.Vector3);
        scene.add(this.helmetMesh);
    }

    public update(player: Player, inputManager: InputManager): void {
        const isInteractCurrentlyPressed = inputManager.isInteractPressed();
        const interactJustPressed = isInteractCurrentlyPressed && !this.wasInteractPressed;

        // Check for helmet interaction
        const dist = player.body.position.distanceTo(this.helmetPosition);

        if (interactJustPressed) {
            if (!player.isMindControlling && dist < 2) {
                player.isMindControlling = true;
            } else if (player.isMindControlling) {
                player.isMindControlling = false;
            }
        }

        this.wasInteractPressed = isInteractCurrentlyPressed;

        // Mirror input to all linked drones
        if (player.isMindControlling) {
            for (const drone of this.drones) {
                drone.syncInput(inputManager);
            }
        } else {
            // Uncontrolled drones stand still
            for (const drone of this.drones) {
                drone.body.velocity.x = 0;
            }
        }

        // Sync visuals
        for (const drone of this.drones) {
            drone.updateVisuals();
        }
    }
}
