import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js';

export class Engine {
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;
    public composer: EffectComposer;

    private width: number;
    private height: number;

    constructor() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // Initialize Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.fog = new THREE.FogExp2(0x000000, 0.05);

        // Initialize Camera (Cinematic Perspective with narrow FOV for "shooting from far" look)
        const aspect = this.width / this.height;
        this.camera = new THREE.PerspectiveCamera(22, aspect, 0.1, 1000); // 22 degree FOV compresses depth

        // Positioned far back, looking slightly down at the scene
        this.camera.position.set(0, 4, 30);
        this.camera.lookAt(0, 1, 0);

        // Initialize Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // INSIDE aesthetic: physically correct lighting but stylized tone mapping
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.8;

        document.body.appendChild(this.renderer.domElement);

        // Setup Post-Processing Composer
        this.composer = new EffectComposer(this.renderer);

        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // UnrealBloomPass for glowing headlights (resolution, strength, radius, threshold)
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.2,  // Bloom strength
            0.8,  // Bloom radius
            0.6   // Bloom threshold (only bright things glow)
        );
        this.composer.addPass(bloomPass);

        // Vignette Shader to darken screen edges (lessened for visibility)
        const vignettePass = new ShaderPass(VignetteShader);
        vignettePass.uniforms['offset'].value = 1.0;
        vignettePass.uniforms['darkness'].value = 1.2;
        this.composer.addPass(vignettePass);

        // FilmPass for cinematic grain and slight scanlines (intensity, grayscale)
        const filmPass = new FilmPass(0.35, false);
        this.composer.addPass(filmPass);

        // Handle Resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    private onWindowResize(): void {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        const aspect = this.width / this.height;

        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.width, this.height);
        this.composer.setSize(this.width, this.height);
    }

    public render(): void {
        this.composer.render();
    }
}
