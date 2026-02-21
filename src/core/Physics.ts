import * as CANNON from 'cannon-es';

export class Physics {
    public world: CANNON.World;
    private timeStep: number = 1 / 60;

    constructor() {
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0)
        });

        // Basic default material
        const defaultMaterial = new CANNON.Material('default');
        const defaultContactMaterial = new CANNON.ContactMaterial(
            defaultMaterial,
            defaultMaterial,
            {
                friction: 0.0, // Frictionless platforming
                restitution: 0.0,
            }
        );
        this.world.addContactMaterial(defaultContactMaterial);
    }

    public update(deltaTime: number): void {
        this.world.step(this.timeStep, deltaTime, 3);
    }
}
