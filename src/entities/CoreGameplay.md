# INSIDE-Style Game Design Document
## Complete Gameplay Mechanics & Systems

---

## **CORE CHARACTER MECHANICS**

### **Movement System**

**Basic Movement:**
- **Walk/Run**: Single speed - character automatically transitions from walk to run based on input duration
- **Momentum-based**: Character has weight and inertia, can't stop instantly
- **Acceleration curve**: 0.2-0.3 seconds to reach full speed
- **Deceleration**: Gradual slowdown when releasing input, slight slide on wet surfaces
- **No jump button spam**: Single jump with realistic arc, can't jump again until grounded
- **Ledge detection**: Automatic grab when jumping near ledges
- **Crouch/Crawl**: Contextual - automatically crouches in low spaces

**Advanced Movement:**
- **Swimming**: Slower movement in water, limited breath meter (oxygen bar), panic animation when drowning
- **Climbing**: Context-sensitive - ladders, chains, ropes, vines
- **Pushing/Pulling**: Heavy objects require continuous input, character strains visibly
- **Sliding**: Down slopes and inclines, limited control
- **Ragdoll physics**: When dying or falling from height
- **Momentum preservation**: Running jump goes further than standing jump

**Animation States:**
- Idle (breathing, looking around nervously)
- Walk (cautious steps)
- Run (desperate sprint)
- Jump (fear in body language)
- Climb (strained movement)
- Swim (frantic paddling)
- Push/Pull (visible effort)
- Death (multiple variations)
- Stealth crouch (when near threats)

---

## **INTERACTION MECHANICS**

### **Object Interaction**

**Grabbable Objects:**
- **Boxes/Crates**: Push, pull, stack to reach heights, create barriers
- **Chains/Ropes**: Swing across gaps, pull to activate mechanisms
- **Levers/Switches**: Pull to open doors, activate machinery, change environment
- **Doors**: Slide open, push through, some locked requiring keys/power
- **Wheels/Valves**: Rotate to drain water, open gates, redirect power

**Environmental Interactions:**
- **Breakable floors**: Collapse under weight, telegraphed with cracks
- **Moving platforms**: Time jumps, ride on machinery
- **Elevators/Lifts**: Call with buttons, ride up/down
- **Water valves**: Raise/lower water levels for puzzle solving
- **Electrical panels**: Restore power to areas, risk of electrocution
- **Conveyor belts**: Auto-movement, can fight against direction

**Contextual Actions:**
- **Hide**: Crouch behind objects when enemies near
- **Peek**: Look around corners at danger
- **Wait**: Stay still when searchlights sweep
- **Hold breath**: Underwater or when hiding in tight spaces

---

## **PUZZLE MECHANICS**

### **Physics-Based Puzzles**

**Weight & Balance:**
- Counterweight systems - place objects on one side to raise the other
- Seesaw platforms - character's weight matters
- Pressure plates - hold down with boxes or self
- Breaking supports - remove wrong piece and structure collapses

**Timing Puzzles:**
- Moving platforms synchronized with hazards
- Opening doors that close after timer
- Avoiding patrol patterns of enemies/machines
- Rhythm-based: jump between gears, pistons, crushers

**Water Puzzles:**
- Flood/drain rooms to access different areas
- Underwater switches that need breath management
- Buoyancy - objects float, character sinks
- Water pressure - opens/closes certain passages

**Light & Shadow:**
- Avoid spotlight beams
- Use shadows to hide from enemies
- Redirect light with mirrors/prisms
- Darkness hiding secrets/paths

**Electrical/Power:**
- Restore power to sections
- Create circuits by connecting cables
- Risk of electrocution in water
- Timed power failures

### **Environmental Storytelling Puzzles**

**Following Clues:**
- Bloodstains leading to paths
- Broken fences showing escape routes
- Arrows/graffiti left by previous victims
- Environmental damage hinting at solutions
- Bodies positioned to show what NOT to do

---

## **THREATS & OBSTACLES**

### **Environmental Hazards**

**Instant Death Traps:**
- **Spiked pits**: Fall into spikes
- **Crushers**: Industrial presses, falling machinery
- **Drowning**: Run out of breath underwater
- **Electrocution**: Live wires, water + electricity
- **Falls**: Too high = death
- **Fire/Explosions**: Incinerators, gas leaks
- **Toxic water**: Acid pools, contaminated liquid

**Damaging Hazards:**
- **Barbed wire**: Slows movement, causes damage
- **Steam vents**: Block paths, burn if touched
- **Unstable structures**: Collapse when used
- **Extreme cold**: Need to find warmth quickly
- **Strong currents**: Underwater areas drag you to hazards

### **Enemy Types**

**Human Enemies:**

1. **Guards/Pursuers**:
   - Patrol patterns (predictable routes)
   - Alert states: Unaware → Suspicious → Chase
   - Grab character on contact = instant death
   - Flashlight search patterns
   - Some use dogs that smell/hear better
   - Can be distracted by thrown objects

2. **Scientists/Observers**:
   - Don't chase but trigger alarms
   - Activate security systems
   - Unlock hostile test subjects
   - Environmental manipulation (flood rooms, lock doors)

3. **Mind-Controlled Workers**:
   - Shambling, zombie-like movement
   - Follow last command given
   - Can be controlled by player in special sections
   - Used as puzzle elements (sacrifice them to progress)

**Creatures/Experiments:**

1. **Aquatic Horror** (inspired by INSIDE's underwater creature):
   - Appears in dark water sections
   - Creates tension through sound/movement in water
   - Instant kill if catches you
   - Must hide in barrels/seaweed when it passes
   - Sonar-like detection

2. **Industrial Machinery**:
   - Robotic arms that grab
   - Automated systems treating humans as cargo
   - Crushing/compacting machines
   - No intelligence, just following programming

3. **Dogs/Animals**:
   - Chase in short bursts
   - Better hearing/smell than humans
   - Can track you through vents
   - Distracted by meat/food

### **Stealth Mechanics**

**Detection System:**
- **Visual cones**: Enemies have limited field of view
- **Sound propagation**: Running makes noise, walking quiet
- **Light exposure**: Stay in shadows to avoid detection
- **Cover system**: Automatic crouch behind waist-high objects
- **Distraction**: Throw objects to create noise elsewhere

**Consequences of Detection:**
- Immediate chase sequence
- Alarms lock down areas
- Reinforcements arrive
- Failed stealth = must restart section
- Some areas allow no detection at all

---

## **GAMEPLAY FLOW & PACING**

### **Level Structure**

**Act 1 - Escape & Discovery (Tutorial disguised as narrative)**
- Wake in forest, mysterious pursuers
- Learn movement: run, jump, climb
- Introduce basic environmental puzzles
- First death teaches consequences
- Discover facility entrance

**Act 2 - The Facility (Core gameplay)**
- Industrial complex exploration
- Puzzle complexity increases
- Introduce all enemy types gradually
- Environmental storytelling reveals experiments
- Water sections with breath management
- Mind-control sequences

**Act 3 - Descent into Horror (Escalation)**
- Darker, more oppressive environments
- Puzzles require using "failures" of facility
- Moral choices (sacrifice others to progress)
- Main creature/threat recurring
- Machinery becomes more hostile
- Flooding sections

**Act 4 - The Truth (Climax)**
- Revelation of player's true nature
- Mechanics flip (hunted becomes hunter)
- Escape sequence with all skills needed
- Final massive puzzle/set piece
- Ambiguous ending

### **Pacing Rhythm**

**Tension-Release Cycle:**
1. **Safe exploration** (3-5 minutes): Learn environment, find collectibles
2. **Puzzle introduction** (2-4 minutes): Figure out what's needed
3. **Execution phase** (1-3 minutes): Perform solution, some risk
4. **Chase/Threat** (30-90 seconds): Intense escape, high stakes
5. **Breathing room** (1-2 minutes): Safe area, environmental storytelling
6. **Repeat with increased difficulty**

**Death & Checkpoints:**
- Frequent checkpoints (every 30-60 seconds of progress)
- Death is quick, restart is instant (no loading screens)
- Death animations are brutal but fast (respect player time)
- Each death teaches something about the solution
- "Trial and death" is expected gameplay loop

---

## **UNIQUE MECHANICS (What Makes It Special)**

### **Mind Control Sequences**

**Player Controls Multiple Bodies:**
- Gain ability to control "husks" (mindless workers)
- Command them to: stand on pressure plates, be sacrificed, form human bridges
- Possess different husks for different abilities
- Some puzzles require coordinating 3-5 husks simultaneously
- Ethical horror: you're using people as tools

**Mechanics:**
- Switch between controlled husks with button
- Give simple commands: move here, pull this, wait
- Husks die easily (water, falls, enemies)
- Must preserve certain husks to solve puzzle
- Can abandon husks, they stand idle forever

### **Blob/Mass Mechanic** (Late game twist)

**Become the Monster:**
- Player merges with organic mass
- Movement changes: can absorb objects, crash through walls
- Invincible to previous threats
- New perspective on earlier areas
- Rampage through facility
- Still vulnerable to specific traps (incineration, containment)

### **Underwater Exploration**

**Breath Management System:**
- Oxygen meter depletes while underwater
- Must surface or find air pockets
- Panic animations as oxygen runs low
- Can drown with violent struggle animation
- Some areas require memorizing path before diving
- Underwater debris can trap you

**Underwater Mechanics:**
- Slower movement, floaty controls
- Vertical navigation important
- Currents push/pull character
- Visibility limited in murky water
- Creature lurking creates tension
- Chain-pulling puzzles while managing breath

### **Dynamic Environment Changes**

**Flooding Mechanics:**
- Trigger flood to access upper routes
- Drain water to find lower paths
- Same room, completely different puzzle when flooded
- Water carries objects (and you)
- Electrical hazards change when wet

**Destruction & Permanence:**
- Break glass, it stays broken
- Topple structures, they're permanently down
- Some puzzles require destroying one path to access another
- Environmental scarring from your passage

---

## **CHARACTER PROBLEMS & CHALLENGES**

### **Physical Limitations (Weakness by Design)**

**The Boy is NOT Powerful:**
- **No combat ability**: Cannot fight, only flee
- **Fragile**: One hit = death
- **Small & weak**: Can't move heavy objects alone
- **Limited breath**: Drowns quickly
- **Slow swimmer**: Vulnerable in water
- **Poor climber**: Can't climb smooth surfaces
- **Height disadvantage**: Can't reach high places without help
- **No weapons**: Completely defenseless

### **Environmental Vulnerabilities**

**Constant Dangers:**
- **Hypothermia**: Cold water sections drain health slowly
- **Exhaustion**: Long chase sequences show character fatigued
- **Injury**: Limping after long falls (temporary)
- **Disorientation**: Dark areas with limited visibility
- **Claustrophobia**: Tight vents and tunnels (can get stuck)
- **Vertigo**: High areas with deadly falls

### **Psychological Obstacles**

**Fear & Hesitation:**
- Character visibly afraid (idle animations show nervousness)
- Hesitant at edges of high places
- Flinches at loud noises
- Looks behind when chased
- Covers ears near machinery
- Shows exhaustion and despair in safe moments

### **Social Isolation**

**Completely Alone:**
- No allies or companions
- No dialogue (universal understanding)
- No guidance or hints from NPCs
- Surrounded by hostile forces
- Every human met is a threat
- Only "help" comes from environmental clues left by the dead

---

## **PROGRESSION & ABILITIES**

### **NO Traditional Upgrades**

**Skills Through Context Only:**
- Character doesn't "level up"
- All abilities available from start
- Progression through:
  - Learning enemy patterns
  - Discovering environmental rules
  - Player skill improvement
  - Understanding puzzle language

### **Environmental Tools (Temporary Power)**

**Context-Specific Items:**
- **Flashlight** (limited battery, specific sections only)
- **Oxygen tank** (extends breath for one section)
- **Protective gear** (temporary hazard immunity)
- **Keycards/Keys** (open specific doors, then useless)
- **Mind control helmet** (specific puzzle areas)

**These are LOST after use** - maintains vulnerability

---

## **COLLECTIBLES & SECRETS**

### **Hidden Orbs/Devices**

**Optional Exploration Rewards:**
- 13-20 hidden collectibles throughout game
- Glowing orbs in secret areas
- Require backtracking or risky detours
- Each unlocked reveals part of larger mystery
- Collecting all unlocks secret ending/area
- No map, must remember locations

**Encourages:**
- Environmental awareness
- Risk vs reward decisions
- Thorough exploration
- Replayability

### **Environmental Storytelling Collectibles**

**Documents/Logs:**
- Scattered papers showing facility history
- Research notes on experiments
- Missing person posters
- Incident reports
- Corporate memos showing moral decay

**Visual Storytelling:**
- Abandoned personal items
- Graffiti from other escapees
- Body positioning telling stories
- Failed escape attempts visible
- Photos/propaganda posters

---

## **DEATH & FAILURE STATES**

### **Death Scenarios (All Contextual)**

1. **Capture Deaths:**
   - Grabbed by guards → dragged away struggling
   - Caught in net → hauled up by machinery
   - Cornered → lights fade as they close in

2. **Environmental Deaths:**
   - Crushed → brutal but quick squish
   - Drowned → panic struggle then stillness
   - Electrocuted → violent spasm then collapse
   - Burned → engulfed in flames (cut away quickly)
   - Impaled → slump on spikes
   - Fall damage → ragdoll impact

3. **Creature Deaths:**
   - Pulled underwater → dragged into darkness
   - Mauled by dogs → quick cutaway
   - Machinery grab → pulled into gears
   - Shockwave blast → thrown against wall

**Death Philosophy:**
- Deaths are memorable but not gratuitous
- Each death type appears 1-3 times maximum
- Teaches you about hazard
- Instant restart maintains flow
- Never punishes player with long waits

---

## **DIFFICULTY BALANCE**

### **No Difficulty Settings**

**Universal Challenge:**
- Everyone experiences same difficulty
- Balanced for "intended experience"
- Checkpoints adjusted per section
- Some puzzles have multiple solutions (easier/harder)

### **Challenge Sources**

**Not Reflexes, But Thinking:**
- Puzzles require observation
- Timing challenges are forgiving (2-3 second windows)
- Chase sequences scripted (not random)
- Deaths teach, not frustrate
- Solution always logical once you see it

**Difficulty Curve:**
- Hours 1-2: Tutorial disguised as gameplay (Easy)
- Hours 2-4: Core mechanics mastered (Medium)
- Hours 4-6: Combining all learned skills (Hard)
- Hours 6-8: Mind-control complexity (Very Hard)
- Hours 8-10: Endgame mastery required (Intense)

---

## **PLAYER EMOTIONAL JOURNEY**

### **Intended Feelings Per Act**

**Act 1 - Confusion & Fear:**
- "What's happening?"
- "Who are these people?"
- "I just need to survive"
- Adrenaline from chase

**Act 2 - Horror & Discovery:**
- "What is this place?"
- "These experiments are terrible"
- "I'm just a child facing this horror"
- Dread from understanding

**Act 3 - Desperation & Determination:**
- "I must escape"
- "Using these horrors against themselves"
- "I'll do anything to survive"
- Moral compromise

**Act 4 - Revelation & Ambiguity:**
- "Wait, what am I?"
- "Was I ever the victim?"
- "What have I been a part of?"
- Existential uncertainty

---

## **GAMEPLAY LOOP SUMMARY**

### **Minute-to-Minute Gameplay:**

1. **Enter new area** → Establish mood through visual/audio
2. **Observe environment** → Identify hazards, exits, objects
3. **Spot the obstacle** → Door locked, path blocked, enemy patrol
4. **Analyze puzzle elements** → Boxes, switches, water, timing
5. **Formulate plan** → Mental map of solution
6. **Execute (often die)** → Learn through failure
7. **Refine and succeed** → Satisfaction of completion
8. **Brief respite** → Environmental storytelling moment
9. **Repeat** with increased complexity

### **Session-to-Session (Per Play Session):**

- Complete 3-5 major puzzle sequences
- Experience 1-2 chase/intense sequences
- Discover 1-2 story revelations
- Die 15-30 times (expected and designed)
- Find 0-2 collectibles if exploring
- Progress 15-25 minutes of story
- Leave wanting "one more puzzle"

---

## **CORE GAMEPLAY PILLARS**

1. **Environmental Puzzle-Solving** (40% of gameplay)
2. **Stealth & Evasion** (30% of gameplay)
3. **Tense Traversal** (20% of gameplay)
4. **Atmospheric Exploration** (10% of gameplay)

**Every mechanic serves:**
- Building atmosphere
- Telling story without words
- Creating memorable moments
- Maintaining tension
- Respecting player intelligence

---

This creates a game where the character is perpetually vulnerable, the player must think rather than shoot, every death has meaning, and the journey itself becomes the story. The character doesn't become powerful - the PLAYER becomes skilled at surviving despite being powerless.

Would you like me to detail specific puzzle examples or chase sequence designs?