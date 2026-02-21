# NAZAR — A Journey Into Darkness

**NAZAR** is a 2.5D dystopian puzzle-platformer inspired by the atmospheric tension of games like *INSIDE* and *LIMBO*. Built entirely in the browser using **Three.js** and **Cannon.js**, NAZAR delivers a cinematic, horrifying, and physics-driven adventure.

![Game Snapshot](public/favicon.svg) <!-- Update with actual gameplay screenshot when available -->

## 🕹️ Key Features

- **Atmospheric 2.5D Environment:** A handcrafted Level Act 1 that seamlessly transitions from a dark forest, to stealth encounters, to an ominous industrial facility.
- **Physics-Based Platforming:** Run, jump, and push boxes to traverse perilous gaps and scale vertical climbs, powered by the Cannon.js physics engine.
- **Unique Mind-Control Mechanic:** Hijack security drones to solve puzzles, bypass obstacles, and scout ahead.
- **Relentless Enemies & Hazards:** Hide behind cover to evade flashlight-wielding guards, survive timed doors and spike pits, and outrun a terrifying red-eyed wolf in an adrenaline-pumping chase sequence.
- **Cinematic Polish:** The camera dynamically zooms in during moments of tension (like stealth and the wolf chase) and pulls back to reveal massive vertical vistas.
- **100% Procedural Web Audio:** No external sound files are used. The game generates a dynamic, reactive soundscape including a dark sub-bass drone, wind gusts, creature sounds, aggressive wolf barking, and footsteps synced to the player's speed.
- **Cross-Platform & PWA Ready:** Playable on desktop (keyboard) and mobile (virtual joystick and touch buttons). Fully installable as a Progressive Web App (PWA) with offline capabilities.

## 🛠️ Tech Stack

- **Graphics:** [Three.js](https://threejs.org/) for 3D rendering and cinematic post-processing (Vignette, Bloom).
- **Physics:** [Cannon-es](https://pmndrs.github.io/cannon-es/) for robust 3D collision and rigid body dynamics.
- **Audio:** Native Web Audio API for custom procedural sound synthesis.
- **Build Tool:** [Vite](https://vitejs.dev/) for lightning-fast bundling and HMR.
- **Language:** TypeScript for type-safe game architecture.
- **Deployment:** Configured with `vite-plugin-pwa` for immediate web install.

## 🚀 Running Locally

To run the game on your local development server:

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd NAZAR
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the localhost URL provided (usually `http://localhost:5173`).

## 🎮 Controls

### Desktop
- **Move:** Left / Right Arrow Keys
- **Jump:** Spacebar / Up Arrow Key
- **Interact:** E (Push boxes, use mind-control helmet, pull levers)

### Mobile
- **Move:** Virtual Joystick (Bottom Left)
- **Jump:** Up Button (Bottom Right)
- **Interact:** E Button (Bottom Right)

## 🗺️ Act 1 Level Flow

1. **Forest Intro:** Learn the movement mechanics in a dark, atmospheric forest highlighted by abandoned vehicles with piercing headlights.
2. **First Gap & Box Puzzle:** Bridge a perilous gap using physics objects.
3. **Stealth Zone:** Evade two patrolling guards by hiding behind cover.
4. **Spike Gauntlet & Timed Doors:** Test your agility and reflexes.
5. **Facility Entrance:** Survive a vertical climb into the mysterious industrial complex.
6. **The Wolf Chase:** Sprint for your life from a relentless beast with glowing red eyes, hurdling obstacles until you reach the Safe Zone.

---
*Created as a technical showcase for dynamic web game development.*
