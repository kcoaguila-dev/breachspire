# AGENTS.md — Breachspire Architecture Reference
> **This file is the law.** Every AI coding agent working on this repository must read this file before touching any source file.
> No exceptions. No skipping ahead.

---

## 0. Project Identity

**Breachspire** is a 2D side-scrolling co-op roguelite built with:

| Tool | Version | Why |
|---|---|---|
| **Phaser 4** | `^4.2.x` | Stable since April 2026. WebGL-only renderer. Render Node arch, SpriteGPULayer, bitECS used internally by Phaser itself. Canvas deprecated. |
| **bitECS** | `^0.3.x` | Data-oriented ECS. Entities are numbers. Components are flat typed arrays. |
| **Zod** | `^4.x` | Schema validation of all external JSON at load time. |
| **Vite** | latest | Dev server + bundler. `npm run dev` to start. |
| **TypeScript** | strict | `"strict": true` in tsconfig. No `any`, no casting away types. |
| **Vitest** | latest | Headless unit tests. Every system needs coverage. `npm test` to run. |

**Distribution:** itch.io HTML5 first -> Steam (Electron) only after itch.io validates fun.
**No Godot. No Unity. No React. The stack is decided. Do not relitigate it.**

---

## 1. The Three Absolute Laws

These are invariants. Breaking any one of them is a blocking architectural error, not a style disagreement.

### LAW 1 — Data -> ECS -> Render. Never the other way.

```
public/data/**/*.json
    |  (fetch + Zod.parse at startup — throws on invalid data)
src/data/schemas.ts + loader.ts
    |  (validated stats -> addComponent calls)
src/ecs/world.ts  (createUnitEntity, createFloorEntity, etc.)
    |  (pure system functions run each frame)
src/ecs/systems/*.ts
    |  (one direction only: read ECS state, update Phaser objects)
src/ecs/systems/RenderSyncSystem.ts
    |
Phaser GameObjects (Rectangle, Sprite, Text, etc.)
```

Data never flows upward. Phaser objects never write to ECS components. Systems never talk to each other directly — they each read and write shared component arrays.

### LAW 2 — Phaser Scenes contain zero gameplay logic

Scenes are **wiring files only**. The only things permitted in a Phaser Scene:

- Instantiate systems with `createXSystem()`
- Call `loadUnitData()` / `loadFloorData()` etc. in `create()`
- Call systems in order inside `update(delta)`
- Pass `this` (the scene reference) and `spriteMap` into `RenderSyncSystem`

**If you are writing a conditional, a calculation, or a loop inside a Scene — stop. Move it into a system.**

### LAW 3 — All external data is validated by Zod before it touches the ECS

Every JSON file in `public/data/` has a corresponding Zod schema in `src/data/schemas.ts`.
`loader.ts` calls `Schema.parse(data)` — which **throws immediately** on invalid data.
If a new archetype type is added (floors, upgrades, abilities), the schema comes first, then the JSON.

**Silent data failures are forbidden.** A typo in a JSON stat file must crash at startup with a readable Zod error, not produce a ghost entity with 0 HP.

---

## 2. Repository Layout

```
breachspire/
|-- public/
|   `-- data/                   <- Runtime-fetched JSON. NOT bundled into JS.
|       |-- heroes/             <- Hero archetypes (knight.json, mage.json, ...)
|       |-- monsters/           <- Monster archetypes (goblin.json, troll.json, ...)
|       |-- floors/             <- Floor definitions (floor_01.json, ...) [NEXT]
|       `-- meta/               <- Camp upgrade trees [FUTURE]
|
|-- src/
|   |-- data/
|   |   |-- schemas.ts          <- ALL Zod schemas live here
|   |   `-- loader.ts           <- Generic fetch + parse helpers
|   |
|   |-- ecs/
|   |   |-- components/
|   |   |   `-- index.ts        <- ALL bitECS component definitions live here
|   |   |-- systems/            <- One file per system
|   |   |   |-- CombatSystem.ts
|   |   |   |-- FSMSystem.ts
|   |   |   |-- MovementSystem.ts
|   |   |   |-- RenderSyncSystem.ts
|   |   |   `-- [NewSystem].ts  <- Follow the template in section 5
|   |   `-- world.ts            <- World singleton + entity factory functions
|   |
|   |-- scenes/
|   |   |-- BootScene.ts        <- Preload only. Immediately starts next scene.
|   |   `-- [GameScene].ts      <- Wiring only. No gameplay logic.
|   |
|   `-- main.ts                 <- Phaser.Game config. Scene list only.
|
|-- tests/
|   |-- combat.test.ts
|   |-- schema.test.ts
|   `-- [system].test.ts        <- Every system gets a test file
|
|-- AGENTS.md                   <- You are here. Read before touching anything.
|-- package.json
|-- tsconfig.json
`-- index.html
```

**`public/data/` vs `src/data/`:**
- `public/data/` = **JSON files** that are runtime-fetched by the browser. Vite serves them as static assets.
- `src/data/` = **TypeScript files** (schemas, loader). Compiled and bundled.
- Never put JSON in `src/`. Never put TypeScript in `public/`.

---

## 3. ECS Component Conventions

All components live in `src/ecs/components/index.ts`. This is the single source of truth for the ECS data model.

### Type Selection Rules

| Data type | bitECS type | Use for |
|---|---|---|
| World position / velocity / HP | `Types.f32` | Continuous numeric values |
| Enum state (FSM, faction, combat type) | `Types.ui8` | Max 255 distinct values |
| Entity reference (target ID) | `Types.eid` | Links between entities |
| Large integer ID | `Types.ui32` | Rarely needed |

### Component Definition Pattern

```typescript
// CORRECT — flat, typed, no objects
export const Health = defineComponent({
  current: Types.f32,
  max: Types.f32,
});

// WRONG — never store objects, strings, or arrays in bitECS components
export const UnitInfo = defineComponent({
  name: "string",   // ILLEGAL in bitECS
});
```

### Enums Always Accompany Numeric Components

Every numeric component that represents a discrete state must have a paired TypeScript enum:

```typescript
export enum FSMStateValues {
  IDLE             = 0,
  MOVE_TO_LADDER   = 1,
  ENGAGE_TARGET    = 2,
  ATTACK_BARRICADE = 3,
  FLEE             = 4,
}

export const FSMState = defineComponent({
  state:        Types.ui8,  // Use FSMStateValues enum
  targetEntity: Types.eid,
});
```

Never use magic numbers when reading/writing component values. Always use the enum.

### Existing Components (as of PR #1)

| Component | Fields | Purpose |
|---|---|---|
| `Position` | `x: f32, y: f32` | World position |
| `Velocity` | `x: f32, y: f32` | Movement vector |
| `Health` | `current: f32, max: f32` | HP tracking |
| `Attack` | `power: f32` | Base damage |
| `Speed` | `value: f32` | Movement speed (px/sec) |
| `CombatTypeComponent` | `type: ui8` | RPS type (CombatTypeValues enum) |
| `FactionTag` | `faction: ui8` | Hero vs Monster (FactionValues enum) |
| `FSMState` | `state: ui8, targetEntity: eid` | AI state machine |
| `SpriteComponent` | `textureId: ui32` | Texture mapping (reserved) |

---

## 4. Data Schema Conventions

All Zod schemas live in `src/data/schemas.ts`. All loaders live in `src/data/loader.ts`.

### Schema Pattern

```typescript
// Step 1: Define string enums for discriminated fields
export const FactionEnum    = z.enum(["hero", "monster"]);
export const CombatTypeEnum = z.enum(["melee", "ranged", "magic"]);

// Step 2: Define the schema object
export const UnitStatsSchema = z.object({
  id:         z.string(),
  name:       z.string(),
  faction:    FactionEnum,
  combatType: CombatTypeEnum,
  health:     z.number().int().positive(),
  attack:     z.number().int().positive(),
  speed:      z.number().positive(),
});

// Step 3: Export the inferred TypeScript type
export type UnitStats = z.infer<typeof UnitStatsSchema>;
```

### Loader Pattern

```typescript
export async function loadUnitData(url: string): Promise<UnitStats> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load data from ${url}: ${response.statusText}`);
  }
  const data = await response.json();
  return UnitStatsSchema.parse(data);  // Throws ZodError on invalid data
}
```

### Adding a New Archetype Type (e.g., FloorData)

1. Add `FloorSchema` and `FloorData` type to `schemas.ts`
2. Add `loadFloorData(url)` to `loader.ts`
3. Create `public/data/floors/floor_01.json` matching the schema
4. Add a schema test in `tests/schema.test.ts` covering valid and invalid cases
5. Add an entity factory in `world.ts`: `createFloorEntity(world, data, ...)`

**Schema first. JSON second. Entity factory third. Never the other order.**

---

## 5. System Authoring Guide

Every system follows the same factory-closure pattern. Canonical template:

```typescript
// src/ecs/systems/ExampleSystem.ts
import { defineQuery, IWorld } from "bitecs";
import { ComponentA, ComponentB } from "../components";

// Module-level query — defined once, reused every frame
const exampleQuery = defineQuery([ComponentA, ComponentB]);

// ─────────────────────────────────────────────────────
// EXPORTED PURE LOGIC — testable by Vitest without Phaser or world
// ─────────────────────────────────────────────────────
export function computeExample(inputA: number, inputB: number): number {
  // Pure logic here. No ECS reads, no Phaser calls.
  return inputA + inputB;
}

// ─────────────────────────────────────────────────────
// SYSTEM FACTORY — returns a closure capturing external deps
// ─────────────────────────────────────────────────────
export function createExampleSystem(/* external deps if any */) {
  // Closure-local state (cooldowns, counters, etc.) — lives here, NOT at module scope
  const localState = new Map<number, number>();

  return (world: IWorld, delta: number): IWorld => {
    const entities = exampleQuery(world);

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      // Dead entity guard — every system's inner loop must have this
      // if (Health.current[eid] <= 0) continue;

      // Read components, run logic, write components
    }

    return world;
  };
}
```

### System Rules

1. **Factory creates the closure.** Per-system state (cooldown Maps, spawn timers) lives inside the closure, not as module-level globals.
2. **Pure logic functions are exported separately** so Vitest can test them without mocking bitECS or Phaser.
3. **Systems always return `world`.**
4. **Systems do not call other systems.** Use a shared component as the communication channel.
5. **Dead entity guard first** inside every inner loop.
6. **`delta` is in milliseconds.** Velocity is in px/sec. Formula: `position += (velocity * delta) / 1000`.

### System Execution Order (inside Scene.update)

```
1. FSMSystem          — decides intent (state transitions, target selection)
2. MovementSystem     — applies velocity to position
3. CombatSystem       — applies damage if in range + cooldown ready
4. DeathSystem        — removes dead entities from world + spriteMap [TODO - M2]
5. RenderSyncSystem   — mirrors ECS state to Phaser objects (ALWAYS LAST)
```

`RenderSyncSystem` is always last. It never writes ECS components.

---

## 6. RPS Combat System

**Melee (0) > Ranged (1) > Magic (2) > Melee (0)**

| Attacker | Defender | Multiplier |
|---|---|---|
| Melee | Ranged | 1.5x (advantage) |
| Ranged | Melee | 0.5x (disadvantage) |
| Ranged | Magic | 1.5x (advantage) |
| Magic | Ranged | 0.5x (disadvantage) |
| Magic | Melee | 1.5x (advantage) |
| Melee | Magic | 0.5x (disadvantage) |
| Any | Same | 1.0x (neutral) |

`getCombatMultiplier(attackerType, defenderType)` is the pure function. The Vitest suite in `tests/combat.test.ts` must pass before any combat-adjacent change is merged.

Health is always clamped at 0:
```typescript
Health.current[targetEid] = Math.max(0, Health.current[targetEid] - finalDamage);
```

Attack rate: closure-local cooldown Map (not a component). Base cooldown: 1000ms.

---

## 7. Testing Requirements

Every merged PR must pass `npm test` with 0 failures.

### What to Test

| What | Test file | How |
|---|---|---|
| Combat multiplier logic | `tests/combat.test.ts` | Call `getCombatMultiplier()` directly |
| Schema validation | `tests/schema.test.ts` | `Schema.safeParse()` with valid + invalid inputs |
| Floor-clear logic | `tests/floor.test.ts` | Call pure `computeFloorClear()` directly |
| Spawn rate throttling | `tests/spawn.test.ts` | Call pure `computeSpawnRate(clearedFloors)` directly |
| Death + entity removal | `tests/death.test.ts` | Create real bitECS world, run DeathSystem |

### Tests Must Never

- Import Phaser (requires DOM — Vitest runs in Node)
- Call `createWorld()` unless specifically testing a system requiring live ECS state
- Use `setTimeout` or real async timers
- Assert floating-point equality without `.toBeCloseTo()`

---

## 8. FSM State Reference

| State | `ui8` | Meaning |
|---|---|---|
| `IDLE` | 0 | No target. Scanning for enemies each tick. |
| `MOVE_TO_LADDER` | 1 | Hero climbing to next tower floor. |
| `ENGAGE_TARGET` | 2 | Locked onto target. Moving toward it or attacking. |
| `ATTACK_BARRICADE` | 3 | Attacking a floor barricade. |
| `FLEE` | 4 | Retreating (HP below threshold or soft-fail trigger). |

FSMSystem decides intent. MovementSystem executes motion. CombatSystem executes attacks.
State transitions are FSMSystem's exclusive responsibility.

---

## 9. Branch and PR Workflow

```
main                    <- stable, always passing tests
  `-- feat/[feature]   <- one branch per feature/system
        `-- PR -> main  <- always requires npm test passing
```

### Branch Naming

| Type | Pattern | Example |
|---|---|---|
| New game system | `feat/[system-name]` | `feat/floor-collapse` |
| Bug fix | `fix/[description]` | `fix/health-clamping` |
| Data authoring | `data/[archetype-type]` | `data/hero-archetypes` |
| Refactor | `refactor/[area]` | `refactor/fsm-states` |

### PR Checklist

- [ ] `npm test` passes with 0 failures
- [ ] `npm run build` succeeds
- [ ] No gameplay logic in any Phaser Scene
- [ ] New JSON archetypes have Zod schemas committed in the same PR
- [ ] New systems have a test file (happy path + at least one failure path)
- [ ] No hardcoded stat values in `.ts` source files
- [ ] Dead entity guard in every system's inner loop

---

## 10. Vertical Slice Roadmap

### ✅ M1 — Foundation (DONE)
- bitECS + Zod + Phaser 4.2.1 WebGL wiring
- Knight vs Goblin demo
- RPS combat multipliers & test coverage

### ✅ M2 — Living Twin-Spires & Camp World Primitives (DONE)
- Central Camp (Light Aether Core + Left/Right Camp Walls)
- Twin Spires (Left & Right Spires accumulating Dark Energy to grow floors)
- Schemas & Loaders for CampConfig and SpireConfig

### ✅ M3 — Dual-Front Siege & Floor-Collapse Loop (DONE)
- MonsterSpawnSystem (spawns throttled by cleared floors)
- CampSiegeSystem (monsters attack walls; breach detection)
- FloorCollapseSystem (destroying floor barricades collapses floors & cuts spawns)
- GameStateSystem (Victory / Defeat evaluation)

### ✅ M4 — Hero / Commander Split & Action Controls (DONE)
- PlayerInputSystem (WASD/Arrows/Space action hero controls)
- CameraFollowSystem (smooth lerp camera across camp & spires)
- CommanderSupportSystem (Rally Flag, Wall Repair pulse, Aether Surge)
- LeaderDeathSystem (Soft-fail retreat to Camp Core on 0 HP)
- Archetypes: Warrior, Archer, Mage, Commander, Troll, Dark Archer, Cultist

### ✅ M5 — Flying Hero & Alcove Threat System (DONE)
- Valkyrie flying hero archetype (`canReachElevated: true`)
- Alcove Nests & NestTargetingSystem
- FlightEnergySystem (recharge ONLY on cleared floors, never at base camp)

### ✅ M6 — Camp Meta-Progression & Persistence (DONE)
- RunStateManager (`localStorage` serialization with fallback)
- Camp upgrades tree (`public/data/meta/camp_upgrades.json`)
- MetaProgressionSystem applying starting wall HP, energy rate, and hero bonuses

---

### 🔲 Phase 7 — Audio/Visual Presentation & Polish (NEXT)
- Sprite sheets & animations for heroes and monsters
- Combat VFX (attack trails, floor collapse rumble particles, edge-screen damage alerts)
- Audio pipeline (SFX for attacks, wall impacts, aether collection, background music)

### 🔲 Phase 8 — In-Game HUD & itch.io Deployment
- HUD (Light Energy gauge, Spire height meters, Wall HP indicators)
- Title screen & Run summary / Upgrade shop menu
- GitHub Actions automated deployment to itch.io via Butler

---

## 11. Anti-Patterns — Never Do These

| Forbidden | Instead |
|---|---|
| Game logic in a Phaser Scene | Write a system, call it from Scene.update |
| Hardcode HP/attack/speed in `.ts` | Put stats in `public/data/`, load via Zod |
| Strings in bitECS components | Numeric enums + lookup tables |
| Skip Zod validation on external JSON | Always call `Schema.parse(data)` |
| Health below zero | Always `Math.max(0, hp - damage)` |
| Leaking dead entities (no removal) | Call `removeEntity(world, eid)` in DeathSystem |
| Systems calling other systems | Use a shared component as the signal |
| Instant run-over on leader death | Soft-fail retreat (keep loot, retry run) |
| Recharge flight at base camp | Only recharge on cleared tower floors |
| Shared roster before vertical slice | Defer until core loop is proven fun |
| Phaser import in a Vitest test | Only test pure logic functions |
| `type: any` anywhere | Type everything. `strict: true` is non-negotiable. |

---

## 12. How to Add a New Monster or Hero (Full Workflow)

1. Extend the schema if the archetype needs new fields
2. Add the JSON in the correct `public/data/` subdirectory
3. Add a schema test in `tests/schema.test.ts` that parses the new JSON content
4. `npm test` — must pass before any further steps
5. Add the load call in the relevant Scene's `create()` method
6. Spawn the entity using the existing factory function

No TypeScript source file should need to change when adding a new unit of an existing archetype type.

---

## 13. Quick Reference — Commands

```bash
npm run dev        # start Vite dev server (localhost:5173)
npm test           # run Vitest (headless, no browser)
npm run build      # TypeScript compile + Vite production build
```

```bash
# Verify health clamp is present
grep -n "Math.max" src/ecs/systems/CombatSystem.ts

# Verify Phaser is 3.x
grep "phaser" package.json

# Verify no game logic leaked into scenes
grep -n "if\|for\|while\|Math\." src/scenes/*.ts
```

---

## 14. Settled Decisions — Do Not Relitigate

| Decision | Resolution |
|---|---|
| Phaser 3 vs Phaser 4 | **Phaser 4** — stable since April 10 2026 (v4.0.0). Canvas deprecated in v4. Migrated from v3 — Scene API unchanged, `scene.add.*` unchanged, physics block removed (we never used it — bitECS owns movement). |
| bitECS vs Phaser built-in | **bitECS** — more control, aligns with Phaser 4 direction |
| JSON in `public/` vs `src/` | **`public/`** — runtime fetch, not bundled |
| Electron now vs later | **Later** — only needed for Steam |
| Shared roster model | **Deferred** — post vertical-slice |
| Flying unit Option A vs B | **Option B** (canReachElevated flag) — cheaper, upgradeable later |
| Scenes as game logic containers | **Forbidden** — wiring only |

If you have new information that changes a decision, document the rationale before changing course.
