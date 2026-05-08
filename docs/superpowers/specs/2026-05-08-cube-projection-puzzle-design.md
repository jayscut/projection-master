# 立体投影拼图游戏 — 设计规格

## 概述

一款基于浏览器的 3D 拼图游戏。玩家通过旋转由正方体组成的立体图形，使其与目标朝向一致。游戏通过等轴测（正交投影）视角连接 3D 形状与 2D 投影，培养空间想象力。20 个关卡，从简单（1 个正方体）到复杂（12 个正方体）。

**核心机制：** 玩家拖动鼠标自由旋转 3D 图形，直到其角点坐标与目标图形的角点坐标在模糊容差范围内匹配。

**界面语言：全部使用中文。**

---

## Architecture

### Tech Stack
- **Build:** Vite + TypeScript
- **Rendering:** Three.js with `OrthographicCamera` (isometric view)
- **Animations:** GSAP for UI transitions; custom WebGL particles for effects
- **Audio:** Web Audio API (procedurally generated, no external files)
- **Persistence:** `localStorage`
- **工作目录：** 项目根目录 `/home/jay/tmp/20260501`，所有临时文件和资源存放在项目本地目录下

### File Structure
```
/
├── index.html                  # Entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.ts                 # Game state machine, scene router
    ├── style.css               # Global styles, fonts, layout
    ├── engine/
    │   ├── scene3d.ts          # Three.js scene manager (factories for left/right scenes)
    │   ├── camera.ts           # Orthographic camera setup, isometric angle config
    │   └── renderer.ts         # WebGLRenderer, post-processing, background grid
    ├── shapes/
    │   ├── cube.ts             # Single cube mesh generation (edges + face material)
    │   └── shape.ts            # Shape = collection of cubes, vertex extraction, transform
    ├── matching/
    │   └── matcher.ts          # RMSE-based corner vertex matching algorithm
    ├── levels/
    │   └── data.ts             # 20 level definitions (cubes, rotations, markers, tolerance)
    ├── ui/
    │   ├── card.ts             # Card flip component (3D CSS transform)
    │   ├── hud.ts              # In-game HUD (match %, timer, level info)
    │   └── menu.ts             # Main menu, level select grid
    ├── effects/
    │   ├── particles.ts        # Particle system (drag trail, success burst, ambient)
    │   └── animations.ts       # GSAP-based animation helpers
    ├── input/
    │   └── controls.ts         # Mouse drag rotation, scroll zoom, keyboard controls
    └── audio/
        └── synth.ts            # Web Audio API synthesizer (ambient, SFX)
```

### Scene State Machine
```
MENU → CARD_FLIP → PLAYING → SUCCESS → MENU
                      ↑                      │
                      └─── RESET ────────────┘
```

- **MENU:** Level select grid (locked/unlocked cards)
- **CARD_FLIP:** 3D card flip animation revealing the target shape
- **PLAYING:** Left panel = target (static), Right panel = player shape (rotatable), HUD at bottom
- **SUCCESS:** Victory animation (particle burst + transition)
- **RESET:** Player can press R to reset rotation (stays in PLAYING)

---

## Game Layout (PLAYING state)

```
┌──────────────────────────────────────────────┐
│  ┌─────────────┐  ┌─────────────┐            │
│  │   目标图形   │  │   你的操作   │            │
│  │   (不可动)  │  │   (可旋转)   │            │
│  │             │  │             │            │
│  │   🧊        │  │   🧊        │            │
│  │             │  │   ⟳ 🖱      │            │
│  └─────────────┘  └─────────────┘            │
│  ┌─────────────────────────────────────────┐ │
│  │ 第 07 关 · L形    匹配度: 82%   02:34   │ │
│  └─────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

- Two equal-sized 3D viewports, side by side
- Left: target shape, camera fixed, no interaction (标注"目标图形")
- Right: player shape, free rotation via mouse drag (标注"你的操作")
- Bottom bar: level name (Chinese), match percentage (匹配度), elapsed time
- Target and player cameras share identical isometric angle
- All UI text in Chinese

---

## Matching Algorithm

### Input
- Target shape: set of world-space corner vertices (pre-computed at level load)
- Player shape: set of world-space corner vertices (recomputed each frame)

### Steps
1. Extract all unique 3D corner positions from both shapes
2. Normalize both point clouds: translate centroid to origin, scale to unit bounding box
3. For each player corner, find the closest target corner (Euclidean distance)
4. Compute RMSE across all matched pairs
5. Convert to match score: `score = 1.0 - min(rmse / threshold, 1.0)`
6. Display score as percentage on HUD
7. If score > 0.92 (RMSE < threshold * 0.08 equivalent), auto-trigger SUCCESS

### Why RMSE
- Normalization removes translation/scale, leaving only rotation as the variable
- Closest-match pairing handles symmetric shapes gracefully
- Smooth 0-100% score gives continuous feedback, not binary pass/fail
- Threshold (default 0.08) provides ~8% error tolerance

### Difference Markers
To disambiguate symmetric shapes, specific cubes/faces carry a visual marker (pink glow on a face, or an entire cube in distinct color). The player must align the marker position with the target's marker position. The matching algorithm includes marker vertex positions in the point cloud to enforce correct marker alignment.

---

## Level System

### Data Format
```js
{
  id: Number,
  name: String,
  cubes: [[x,y,z], ...],       // Unit cube positions relative to shape center
  targetRotation: [x,y,z,w],   // Quaternion (how the target appears)
  startRotation: [x,y,z,w],    // Quaternion (player's starting orientation)
  markers: [
    { type: "face", cubeIndex: 0, face: "top", color: "#FF4081" },
    { type: "cube", cubeIndex: 3, color: "#FF4081" }
  ],
  tolerance: 0.08              // Per-level override for matching threshold
}
```

### Difficulty Progression (Jump Curve)

| Stage      | Levels | Cubes | Description |
|------------|--------|-------|-------------|
| Tutorial   | 1-3    | 1     | Single cube, learn controls, small rotation offset |
| Basic      | 4-6    | 2-3   | Simple combos, introduce face markers |
| Intermediate | 7-10  | 4-5   | L-shapes, T-shapes, symmetry traps, larger rotation offsets |
| Advanced   | 11-15  | 6-8   | Complex combinations, multiple markers |
| Expert     | 16-20  | 9-12  | Spiral/stairs, near-complete rotation offsets |

- Jump at level 7 (from 3 to 4-5 cubes with tricky shapes)
- Another jump at level 11 (from 5 to 6-8 cubes)
- Final jump at level 16 (9-12 cubes)

---

## Controls

| Input | Action |
|-------|--------|
| Mouse drag (left button) | Free rotation on X/Y axes |
| Scroll wheel | Zoom in/out (ortho frustum size) |
| Arrow keys ↑↓←→ | Snap rotate 90° on X/Y axes |
| Q / E keys | Snap rotate 90° on Z axis |
| R key | Reset rotation to start position |
| H key | Show hint (brief flash of target overlay) |
| M key | Toggle mute |

---

## Visual Style: Neon Cyberpunk

### Color Palette
| Role | Color | Usage |
|------|-------|-------|
| Cyan (`#00E5FF`) | Primary | Player cube edges, wireframe, highlights |
| Pink (`#FF4081`) | Accent | Target cube edges, markers, success effects |
| Purple (`#7C4DFF`) | Secondary | Particles, match progress glow, transitions |
| Deep Black (`#0A0A1A`) | Background | Canvas background |
| Dark Blue (`#16213E`) | Midground | Card backs, UI panels |

### Visual Effects
- **Cube style:** Wireframe edges with semi-transparent faces, glow on hover proximity
- **Background:** Subtle isometric grid, slow pulsing
- **Drag trail:** Particle sparkles emit from mouse position during rotation
- **Match progress:** Neon ring around player viewport fills from 0 to 360° as match % increases
- **Success burst:** All cube edges explode outward as particles, reform as one shape, then transition
- **Card flip:** 3D CSS transform with cyan glow border reveal
- **Ambient particles:** Slow floating dots in the background, responding to cursor position

### Typography
- Monospace for HUD (match %, timer)
- Geometric sans-serif for titles (loaded via Google Fonts: Orbitron or similar)

---

## Audio (Web Audio API)

### Layers
1. **Ambient drone:** Low-pass filtered sawtooth, subtle volume, loops during PLAYING
2. **Match tick:** Short sine pluck, pitch rises as match % increases (every frame above 50%)
3. **Card flip:** White noise burst with filter sweep (0.3s)
4. **Success:** Rising arpeggio (C-E-G-C), 1.5s, with reverb
5. **UI click:** Short click transient (0.05s)

### Implementation
- Single `AudioContext`, resumed on first user interaction
- All sounds procedurally generated (no audio files)
- Mute toggle persists to localStorage

---

## Persistence (localStorage)

```js
{
  highestUnlocked: 3,           // Highest level player can access
  levelStats: {
    "1": { bestTime: 12.3, rotations: 45, completed: true },
    "2": { bestTime: 23.1, rotations: 67, completed: true },
    // ...
  },
  muted: false
}
```

- Only saves on level completion
- No mid-level save (levels are short enough to restart)

---

## Scope & Non-Goals

### In Scope
- 20 playable levels with increasing complexity
- Card flip intro animation
- Real-time match score display
- Particle effects on drag and success
- Procedural audio
- localStorage persistence
- Keyboard + mouse controls
- Hints (flash target overlay)

### Out of Scope
- Mobile/touch support (desktop browser only)
- Multiplayer / leaderboard
- Level editor
- Custom shapes
- Achievements system
- Localization

---

## Testing Strategy

Since this is a game with visual output, testing focuses on:
1. **Algorithm correctness:** Unit-test the RMSE matcher with known inputs/outputs in console
2. **Level data integrity:** Validate all 20 levels parse correctly on load
3. **Manual testing:** Play through all levels to verify difficulty curve

No formal test framework — console-based validation during development.
