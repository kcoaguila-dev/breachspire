# Breachspire

This is the technical foundation for a 2D side-scrolling co-op roguelite.

## Architecture: Data-Driven ECS

This project uses a strict **Data -> ECS -> Render** architectural flow:

### 1. Data Layer (`public/data/`)
All game content (units, stats, floors, etc.) is defined in external JSON files. This allows game designers and AI agents to balance the game by editing data files alone, without touching simulation code.

* **Dev Note**: Data is kept in `public/data/` rather than `src/data/` because Vite handles dynamically fetched resources natively when they exist in `public/`. Otherwise they would be excluded from production builds.
* **Zod Schemas**: Data is validated at runtime load using Zod schemas (`src/data/schemas.ts`). If data is malformed, it throws a clear error immediately rather than failing silently later.
* **Loader**: The loader (`src/data/loader.ts`) handles fetching the JSON files and piping them through the Zod schemas.

### 2. ECS Layer (`src/ecs/`)
We use `bitECS` as our Entity Component System runtime.

* **Entities**: Pure numeric IDs.
* **Components**: Flat typed data (Structs of Arrays). E.g. `Position`, `Health`, `CombatType`.
* **Systems**: Pure functions operating on queries. E.g. `MovementSystem`, `FSMSystem`, `CombatSystem`.

The ECS simulation is entirely decoupled from the rendering engine. The `CombatSystem` implements a Rock-Paper-Scissors resolution (Melee > Ranged > Magic > Melee).

### 3. Render Layer (`src/scenes/`)
We use Phaser 3 for rendering.

* **No Gameplay Logic**: Phaser Scenes contain **NO** gameplay logic. Their only job is to render the visual representation of the ECS state.
* **RenderSyncSystem**: The ECS simulation layer and Phaser game-object layer are loosely coupled via `RenderSyncSystem.ts`, which reads ECS position/health state each frame and updates Phaser Sprites (or Primitives) to match.

## Getting Started

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Run tests: `npm run test`
4. Build for production: `npm run build`