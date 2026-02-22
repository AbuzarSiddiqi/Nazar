import './style.css';
import { Engine } from './core/Engine';
import { Physics } from './core/Physics';
import { InputManager } from './core/InputManager';
import { AudioManager } from './core/AudioManager';
import { LightingAndFog } from './environment/LightingAndFog';
import { Player } from './entities/Player';
import { MindControlSystem } from './systems/MindControlSystem';
import { LevelBuilder } from './environment/LevelBuilder';
import { GameUI } from './core/GameUI';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// Initialize core systems
const engine = new Engine();
const physics = new Physics();
const inputManager = new InputManager();
const audio = new AudioManager();

// Atmosphere
const atmosphere = new LightingAndFog(engine.scene);

// Player
const player = new Player(engine.scene, physics.world);

// Build the Level
const level = new LevelBuilder(engine.scene, physics.world);

// Mind control helmet (placed at Section 8 — Facility Entrance)
const mindControl = new MindControlSystem(engine.scene, new CANNON.Vec3(185, 2, 0));

// ===== GAME UI =====
let gameRunning = false;
let deathCooldown = 0; // Prevent instant re-death after respawn

let introState = 0; // 0 = Not started, 1 = Falling/Sliding, 2 = Recovery, 3 = Intro Done/Playing
let introRecoveryTimer = 0;

const gameUI = new GameUI(
    // onPlay
    () => {
        gameRunning = true;
        audio.start(); // Start ambient audio on first user interaction

        // Start cinematic intro
        player.isStartingIntro = true;
        player.body.position.set(-5, 12, 0); // Spawn high up
        player.body.velocity.set(0, -2, 0); // Give initial downward velocity
        introState = 1;

        // Snap camera
        engine.camera.position.x = -5;
        engine.camera.position.y = 10;
    },
    // onReplay
    () => {
        gameRunning = true;
        audio.start();
        deathCooldown = 1.0;
        level.checkpointSystem.respawn(player.body);
        player.body.velocity.set(0, 0, 0);
    }
);

// Connect mobile controls to input
inputManager.setGameUI(gameUI);

// Hook player death into UI
player.onDeath = () => {
    if (deathCooldown > 0) return; // Don't die during invulnerability
    level.checkpointSystem.respawn(player.body);
    player.body.velocity.set(0, 0, 0);
    gameUI.showDeathScreen();
    gameRunning = false;
};

// Game Loop Variables
let lastTime = performance.now();

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(e => console.error("SW Registration failed: ", e));
    });
}

function gameLoop(time: number) {
    requestAnimationFrame(gameLoop);

    const deltaTime = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    // Death cooldown
    if (deathCooldown > 0) deathCooldown -= deltaTime;

    // Only update game logic when playing
    if (gameRunning) {
        // Intro Sequence Logic
        if (introState === 1) {
            // End when Grounded, stopped sliding, and velocity settles
            if (player.body.velocity.y > -0.1 && player.body.velocity.y < 0.1 && player.body.position.y < 5) {
                if (Math.abs(player.body.velocity.x) < 0.5) {
                    player.body.velocity.x = 0; // force stop
                    introState = 2;
                    introRecoveryTimer = 1.0; // wait 1s before control
                }
            }
        } else if (introState === 2) {
            introRecoveryTimer -= deltaTime;
            if (introRecoveryTimer <= 0) {
                introState = 3;
                player.isStartingIntro = false;
            }
        }
        // Player
        player.update(inputManager, deltaTime);

        // Level handles enemies, interactables, hazards, checkpoints
        level.update(player, inputManager, deltaTime);

        // Mind control
        mindControl.update(player, inputManager);

        // Physics
        physics.update(deltaTime);

        // Atmosphere
        atmosphere.update(deltaTime);

        // Audio — player speed + nearest enemy distance
        const playerSpeed = Math.abs(player.body.velocity.x);
        let nearestEnemyDist = 999;
        for (const enemy of level.enemies) {
            const d = player.body.position.distanceTo(enemy.body.position);
            if (d < nearestEnemyDist) nearestEnemyDist = d;
        }
        // Wolf distance for audio
        let wolfDist = 999;
        if (level.wolf && level.wolfChaseTriggered) {
            wolfDist = player.body.position.distanceTo(level.wolf.body.position);
        }
        audio.update(deltaTime, playerSpeed, nearestEnemyDist, wolfDist);
    }

    // Camera follow (smooth even when dead for visual continuity)
    let targetX = player.mesh.position.x;
    let targetY = player.mesh.position.y + 2;
    if (player.isMindControlling && mindControl.drones.length > 0) {
        targetX = mindControl.drones[0].mesh.position.x;
        targetY = mindControl.drones[0].mesh.position.y + 2;
    }
    engine.camera.position.x = THREE.MathUtils.lerp(engine.camera.position.x, targetX, 0.05);
    engine.camera.position.y = THREE.MathUtils.lerp(engine.camera.position.y, targetY, 0.03);

    // ---- Cinematic Camera Zoom ----
    const px = player.mesh.position.x;
    let targetZ = 30; // Default wide shot
    let lerpSpeed = 0.02; // Default smooth

    if (px > 65 && px < 95) {
        // Stealth zone — zoom IN for tension
        targetZ = 22;
    } else if (px > 95 && px < 120) {
        // Spike gauntlet — zoom OUT to see the full challenge
        targetZ = 35;
    } else if (px > 145 && px < 170) {
        // Vertical climb — zoom OUT to see the height
        targetZ = 38;
    } else if (px > 170 && px < 190) {
        // Facility entrance — zoom IN for intimacy
        targetZ = 24;
    } else if (px > 190 && px < 230) {
        // WOLF CHASE — extreme close-up for adrenaline!
        targetZ = 18;
        lerpSpeed = 0.04; // Faster zoom for panic
    } else if (px > 230 && px < 282) {
        // Desperate run — pull out slightly to see obstacles
        targetZ = 22;
    } else if (px > 282) {
        // Safe zone — relief wide shot
        targetZ = 35;
        lerpSpeed = 0.01; // Slow ease out for emotional release
    }

    engine.camera.position.z = THREE.MathUtils.lerp(engine.camera.position.z, targetZ, lerpSpeed);

    // Always render (home screen shows the 3D scene behind the overlay)
    engine.render();
}

requestAnimationFrame(gameLoop);
