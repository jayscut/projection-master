# 立体投影拼图游戏 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based 3D cube projection puzzle game with 20 levels, neon cyberpunk visuals, and procedurally generated audio.

**Architecture:** Vite + TypeScript build system. Three.js for 3D rendering with dual orthographic viewports (target + player). GSAP for UI transitions. Web Audio API for procedural sound. localStorage for persistence. State machine (`MENU → CARD_FLIP → PLAYING → SUCCESS → MENU`).

**Tech Stack:** Vite, TypeScript, Three.js, GSAP, Web Audio API

---

## Task 1: Project Scaffold

**Files:**
- Create: `/home/jay/tmp/20260501/package.json`
- Create: `/home/jay/tmp/20260501/tsconfig.json`
- Create: `/home/jay/tmp/20260501/vite.config.ts`
- Create: `/home/jay/tmp/20260501/index.html`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "cube-projection-puzzle",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "gsap": "^3.12.5",
    "three": "^0.170.0"
  },
  "devDependencies": {
    "typescript": "^5.6.3",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: Dependencies installed without errors.

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
  },
});
```

- [ ] **Step 5: Create index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>立体投影拼图</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet" />
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 6: Verify dev server starts**

Run: `npx vite --host 0.0.0.0`
Expected: Dev server starts, browser opens to blank page without errors.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts index.html
git commit -m "feat: scaffold vite + typescript project"
```

---

## Task 2: Global Styles & Fonts

**Files:**
- Create: `/home/jay/tmp/20260501/src/style.css`

- [ ] **Step 1: Create style.css**

```css
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --cyan: #00E5FF;
  --pink: #FF4081;
  --purple: #7C4DFF;
  --bg-deep: #0A0A1A;
  --bg-mid: #16213E;
  --text-primary: #E0E0E0;
  --text-dim: #555577;
  --font-mono: 'Courier New', monospace;
  --font-display: 'Orbitron', sans-serif;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--bg-deep);
  color: var(--text-primary);
  font-family: var(--font-mono);
}

#app {
  width: 100%;
  height: 100%;
  position: relative;
}

canvas {
  display: block;
}

.hidden {
  display: none !important;
}
```

- [ ] **Step 2: Import styles in main.ts**

Create a minimal `/home/jay/tmp/20260501/src/main.ts`:

```typescript
import './style.css';

document.getElementById('app')!.innerText = 'Loading...';
```

Run: `npx vite build`
Expected: Build succeeds, no CSS warnings.

- [ ] **Step 3: Commit**

```bash
git add src/style.css src/main.ts
git commit -m "feat: add global styles and fonts"
```

---

## Task 3: Shared Types

**Files:**
- Create: `/home/jay/tmp/20260501/src/types.ts`

- [ ] **Step 1: Create types.ts with all shared interfaces**

```typescript
export interface CubeDef {
  x: number;
  y: number;
  z: number;
}

export interface MarkerDef {
  type: 'face' | 'cube';
  cubeIndex: number;
  face?: string;
  color: string;
}

export interface LevelData {
  id: number;
  name: string;
  cubes: [number, number, number][];
  targetRotation: [number, number, number, number];
  startRotation: [number, number, number, number];
  markers: MarkerDef[];
  tolerance: number;
}

export interface LevelStats {
  bestTime: number;
  rotations: number;
  completed: boolean;
}

export interface SaveData {
  highestUnlocked: number;
  levelStats: Record<string, LevelStats>;
  muted: boolean;
}

export type GameState = 'MENU' | 'CARD_FLIP' | 'PLAYING' | 'SUCCESS';

export const ISOMETRIC_ANGLE = {
  elevation: Math.atan(Math.SQRT1_2), // ~35.264°
  azimuth: Math.PI / 4,               // 45°
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add shared types"
```

---

## Task 4: Level Data — Part 1 (Levels 1-10)

**Files:**
- Create: `/home/jay/tmp/20260501/src/levels/data.ts`

- [ ] **Step 1: Write levels 1-10 definitions**

```typescript
import { LevelData } from '../types';

export const LEVELS: LevelData[] = [
  // Stage: Tutorial (1 cube)
  {
    id: 1,
    name: '初识立方',
    cubes: [[0, 0, 0]],
    targetRotation: [0, 0, 0, 1],
    startRotation: [0, 0.3827, 0, 0.9239],
    markers: [],
    tolerance: 0.12,
  },
  {
    id: 2,
    name: '旋转初探',
    cubes: [[0, 0, 0]],
    targetRotation: [0, 0, 0, 1],
    startRotation: [0.3536, 0.3536, 0.1464, 0.8536],
    markers: [],
    tolerance: 0.12,
  },
  {
    id: 3,
    name: '方向感',
    cubes: [[0, 0, 0]],
    targetRotation: [0, 0, 0, 1],
    startRotation: [0.5, 0.5, 0.5, 0.5],
    markers: [
      { type: 'face', cubeIndex: 0, face: 'top', color: '#FF4081' },
    ],
    tolerance: 0.10,
  },
  // Stage: Basic (2-3 cubes)
  {
    id: 4,
    name: '双立方',
    cubes: [[0, 0, 0], [1, 0, 0]],
    targetRotation: [0, 0, 0, 1],
    startRotation: [0, 0.5, 0, 0.866],
    markers: [],
    tolerance: 0.10,
  },
  {
    id: 5,
    name: '拐角',
    cubes: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
    targetRotation: [0, 0, 0, 1],
    startRotation: [0.3, 0.3, 0.3, 0.8367],
    markers: [],
    tolerance: 0.09,
  },
  {
    id: 6,
    name: '标记挑战',
    cubes: [[0, 0, 0], [1, 0, 0]],
    targetRotation: [0, 0, 0, 1],
    startRotation: [0.25, 0.25, 0.25, 0.9014],
    markers: [
      { type: 'face', cubeIndex: 1, face: 'top', color: '#FF4081' },
    ],
    tolerance: 0.09,
  },
  // Stage: Intermediate (4-5 cubes)
  {
    id: 7,
    name: 'L形之谜',
    cubes: [[0, 0, 0], [0, 1, 0], [0, 2, 0], [1, 0, 0]],
    targetRotation: [0, 0, 0, 1],
    startRotation: [0.4, 0.2, 0.6, 0.6633],
    markers: [],
    tolerance: 0.08,
  },
  {
    id: 8,
    name: 'T形挑战',
    cubes: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [1, 1, 0]],
    targetRotation: [0, 0, 0, 1],
    startRotation: [0.35, 0.45, 0.25, 0.7875],
    markers: [],
    tolerance: 0.08,
  },
  {
    id: 9,
    name: '对称陷阱',
    cubes: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]],
    targetRotation: [0, 0, 0, 1],
    startRotation: [0.45, 0.35, 0.55, 0.6104],
    markers: [
      { type: 'cube', cubeIndex: 2, color: '#FF4081' },
    ],
    tolerance: 0.08,
  },
  {
    id: 10,
    name: '立方之星',
    cubes: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [-1, 0, 0], [0, -1, 0]],
    targetRotation: [0, 0, 0, 1],
    startRotation: [0.5, 0.3, 0.4, 0.7071],
    markers: [],
    tolerance: 0.08,
  },
];
```

- [ ] **Step 2: Verify parsing**

Add to `/home/jay/tmp/20260501/src/main.ts`:

```typescript
import { LEVELS } from './levels/data';
console.log(`Loaded ${LEVELS.length} levels (partial)`);
if (LEVELS.length !== 10) throw new Error(`Expected 10 levels, got ${LEVELS.length}`);
// Validate each level has required fields
LEVELS.forEach(l => {
  if (l.cubes.length === 0) throw new Error(`Level ${l.id} has no cubes`);
  if (l.id < 1 || l.id > 20) throw new Error(`Level ${l.id} has invalid id`);
});
console.log('Level validation passed');
```

Run: Open browser console after `npx vite`.
Expected: "Loaded 10 levels (partial)" and "Level validation passed" in console.

- [ ] **Step 3: Commit**

```bash
git add src/levels/data.ts src/main.ts
git commit -m "feat: add level data (1-10)"
```

---

## Task 5: Level Data — Part 2 (Levels 11-20)

**Files:**
- Modify: `/home/jay/tmp/20260501/src/levels/data.ts`

- [ ] **Step 1: Add levels 11-20 to the LEVELS array**

Append to the LEVELS array in `data.ts`:

```typescript
  // Stage: Advanced (6-8 cubes)
  {
    id: 11,
    name: '六面迷宫',
    cubes: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [1, 0, 1]],
    targetRotation: [0, 0, 0, 1],
    startRotation: [0.4, 0.5, 0.3, 0.7071],
    markers: [
      { type: 'face', cubeIndex: 2, face: 'top', color: '#FF4081' },
    ],
    tolerance: 0.08,
  },
  {
    id: 12,
    name: '阶梯',
    cubes: [[0, 0, 0], [1, 0, 0], [1, 1, 0], [2, 1, 0], [2, 2, 0], [3, 2, 0]],
    targetRotation: [0, 0, 0, 1],
    startRotation: [0.5, 0.4, 0.6, 0.4804],
    markers: [],
    tolerance: 0.07,
  },
  {
    id: 13,
    name: '十字军',
    cubes: [[0, 0, 0], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]],
    targetRotation: [0, 0, 0, 1],
    startRotation: [0.45, 0.55, 0.35, 0.6085],
    markers: [
      { type: 'cube', cubeIndex: 3, color: '#7C4DFF' },
      { type: 'cube', cubeIndex: 6, color: '#FF4081' },
    ],
    tolerance: 0.07,
  },
  {
    id: 14,
    name: '双塔',
    cubes: [[0, 0, 0], [0, 1, 0], [0, 2, 0], [2, 0, 0], [2, 1, 0], [2, 2, 0], [1, 0, 0]],
    targetRotation: [0, 0, 0, 1],
    startRotation: [0.35, 0.45, 0.55, 0.6085],
    markers: [
      { type: 'face', cubeIndex: 2, face: 'top', color: '#FF4081' },
    ],
    tolerance: 0.07,
  },
  {
    id: 15,
    name: '方块蛇',
    cubes: [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 2, 0], [1, 2, 0], [2, 2, 0]],
    targetRotation: [0, 0, 0, 1],
    startRotation: [0.55, 0.35, 0.5, 0.5762],
    markers: [],
    tolerance: 0.07,
  },
  // Stage: Expert (9-12 cubes)
  {
    id: 16,
    name: '螺旋梯',
    cubes: [
      [0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 2], [0, 2, 2],
      [0, 2, 3], [1, 2, 3], [1, 3, 3], [1, 3, 4],
    ],
    targetRotation: [0, 0, 0, 1],
    startRotation: [0.5, 0.5, 0.5, 0.5],
    markers: [
      { type: 'face', cubeIndex: 8, face: 'top', color: '#FF4081' },
    ],
    tolerance: 0.06,
  },
  {
    id: 17,
    name: '金字塔',
    cubes: [
      [0, 0, 0], [0, 0, 1], [0, 1, 0], [1, 0, 0],
      [0, -1, 0], [-1, 0, 0], [0, 0, -1],
      [0, 1, 1], [1, 1, 0], [1, 0, 1],
    ],
    targetRotation: [0, 0, 0, 1],
    startRotation: [0.6, 0.4, 0.5, 0.4804],
    markers: [],
    tolerance: 0.06,
  },
  {
    id: 18,
    name: '立方矩阵',
    cubes: [
      [0, 0, 0], [0, 0, 1], [0, 1, 0], [0, 1, 1],
      [1, 0, 0], [1, 0, 1], [1, 1, 0], [1, 1, 1],
      [2, 1, 0], [2, 1, 1],
    ],
    targetRotation: [0, 0, 0, 1],
    startRotation: [0.4, 0.5, 0.6, 0.4804],
    markers: [
      { type: 'cube', cubeIndex: 8, color: '#FF4081' },
      { type: 'cube', cubeIndex: 9, color: '#7C4DFF' },
    ],
    tolerance: 0.06,
  },
  {
    id: 19,
    name: '无尽回廊',
    cubes: [
      [0, 0, 0], [1, 0, 0], [2, 0, 0],
      [0, 1, 0], [1, 1, 0], [2, 1, 0],
      [0, 2, 0], [1, 2, 0], [2, 2, 0],
      [1, 0, 1], [1, 1, 1],
    ],
    targetRotation: [0, 0, 0, 1],
    startRotation: [0.5, 0.5, 0.5, 0.5],
    markers: [
      { type: 'face', cubeIndex: 0, face: 'front', color: '#FF4081' },
      { type: 'face', cubeIndex: 10, face: 'top', color: '#7C4DFF' },
    ],
    tolerance: 0.06,
  },
  {
    id: 20,
    name: '终极立方',
    cubes: [
      [0, 0, 0], [0, 0, 1], [0, 0, 2], [0, 1, 0],
      [0, 1, 1], [0, 1, 2], [0, 2, 0], [0, 2, 1],
      [0, 2, 2], [1, 0, 0], [1, 1, 0], [1, 2, 0],
    ],
    targetRotation: [0, 0, 0, 1],
    startRotation: [0.5, 0.5, 0.5, 0.5],
    markers: [
      { type: 'cube', cubeIndex: 8, color: '#FF4081' },
      { type: 'face', cubeIndex: 2, face: 'front', color: '#7C4DFF' },
      { type: 'face', cubeIndex: 11, face: 'top', color: '#00E5FF' },
    ],
    tolerance: 0.06,
  },
];
```

Update the closing `];` for the array. Ensure the array now has 20 elements total.

- [ ] **Step 2: Verify full level count**

Update `/home/jay/tmp/20260501/src/main.ts`:

```typescript
import { LEVELS } from './levels/data';
console.log(`Loaded ${LEVELS.length} levels`);
if (LEVELS.length !== 20) throw new Error(`Expected 20 levels, got ${LEVELS.length}`);
LEVELS.forEach(l => {
  if (l.cubes.length === 0) throw new Error(`Level ${l.id} has no cubes`);
  if (l.id < 1 || l.id > 20) throw new Error(`Level ${l.id} has invalid id`);
  if (!l.targetRotation || l.targetRotation.length !== 4) throw new Error(`Level ${l.id} bad targetRotation`);
  if (!l.startRotation || l.startRotation.length !== 4) throw new Error(`Level ${l.id} bad startRotation`);
  if (typeof l.tolerance !== 'number' || l.tolerance <= 0) throw new Error(`Level ${l.id} bad tolerance`);
});
console.log('All 20 levels validated');
```

Run: `npx vite` and check browser console.
Expected: "All 20 levels validated".

- [ ] **Step 3: Commit**

```bash
git add src/levels/data.ts src/main.ts
git commit -m "feat: complete level data (11-20)"
```

---

## Task 6: Matching Algorithm

**Files:**
- Create: `/home/jay/tmp/20260501/src/matching/matcher.ts`

- [ ] **Step 1: Create shared types import line then write matcher**

```typescript
import * as THREE from 'three';

function extractCentroid(points: THREE.Vector3[]): THREE.Vector3 {
  const center = new THREE.Vector3();
  for (const p of points) {
    center.add(p);
  }
  center.divideScalar(points.length);
  return center;
}

function normalizePoints(points: THREE.Vector3[], centroid: THREE.Vector3, scale: number): THREE.Vector3[] {
  const result: THREE.Vector3[] = [];
  for (const p of points) {
    result.push(p.clone().sub(centroid).multiplyScalar(1 / scale));
  }
  return result;
}

function computeScale(points: THREE.Vector3[], centroid: THREE.Vector3): number {
  let maxDist = 0;
  for (const p of points) {
    const d = p.distanceTo(centroid);
    if (d > maxDist) maxDist = d;
  }
  return maxDist || 1;
}

export function computeMatchScore(
  targetCorners: THREE.Vector3[],
  playerCorners: THREE.Vector3[],
  tolerance: number
): number {
  if (targetCorners.length === 0 || playerCorners.length === 0) {
    return 0;
  }

  const targetCentroid = extractCentroid(targetCorners);
  const playerCentroid = extractCentroid(playerCorners);

  const targetScale = computeScale(targetCorners, targetCentroid);
  const playerScale = computeScale(playerCorners, playerCentroid);

  const normTarget = normalizePoints(targetCorners, targetCentroid, targetScale);
  const normPlayer = normalizePoints(playerCorners, playerCentroid, playerScale);

  let sumSqDist = 0;
  const usedTargetIndices = new Set<number>();

  for (const playerPt of normPlayer) {
    let minDistSq = Infinity;
    let bestIdx = -1;

    for (let i = 0; i < normTarget.length; i++) {
      const dSq = playerPt.distanceToSquared(normTarget[i]);
      if (dSq < minDistSq) {
        minDistSq = dSq;
        bestIdx = i;
      }
    }

    sumSqDist += minDistSq;
    if (bestIdx >= 0) {
      usedTargetIndices.add(bestIdx);
    }
  }

  const rmse = Math.sqrt(sumSqDist / playerCorners.length);
  const score = Math.max(0, 1 - rmse / tolerance);
  return score;
}

export function consoleTestMatcher(): void {
  const target = [new THREE.Vector3(0, 0, 0)];
  const player = [new THREE.Vector3(0, 0, 0)];
  const score = computeMatchScore(target, player, 0.1);
  console.log('Perfect match score:', score);
  if (score < 0.99) throw new Error('Perfect match should be ~1.0');

  const rotated = [new THREE.Vector3(1, 0, 0)];
  const bad = [new THREE.Vector3(0, 0, 0)];
  const badScore = computeMatchScore(rotated, bad, 0.1);
  console.log('Bad match score:', badScore);
  if (badScore > 0.01) throw new Error('Bad match should be near 0');

  console.log('Matcher self-test passed');
}
```

- [ ] **Step 2: Test in browser console**

Update `/home/jay/tmp/20260501/src/main.ts`:

```typescript
import './style.css';
import { consoleTestMatcher } from './matching/matcher';

consoleTestMatcher();
```

Run: `npx vite` and check browser console.
Expected: "Matcher self-test passed".

- [ ] **Step 3: Commit**

```bash
git add src/matching/matcher.ts src/main.ts
git commit -m "feat: implement RMSE-based matching algorithm"
```

---

## Task 7: Cube Mesh

**Files:**
- Create: `/home/jay/tmp/20260501/src/shapes/cube.ts`

- [ ] **Step 1: Write cube mesh generator**

```typescript
import * as THREE from 'three';

const CUBE_SIZE = 1;
const GAP = 0.1;
const TOTAL = CUBE_SIZE + GAP;

export interface CubeMeshOptions {
  edgeColor?: number;
  faceColor?: number;
  faceOpacity?: number;
  markerFace?: string | null;
  markerColor?: number;
}

export function createCubeMesh(options: CubeMeshOptions = {}): THREE.Group {
  const {
    edgeColor = 0x00E5FF,
    faceColor = 0x00E5FF,
    faceOpacity = 0.15,
    markerFace = null,
    markerColor = 0xFF4081,
  } = options;

  const group = new THREE.Group();

  // Edges (wireframe)
  const geo = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
  const edgesGeo = new THREE.EdgesGeometry(geo);
  const edgesMat = new THREE.LineBasicMaterial({ color: edgeColor, linewidth: 1 });
  const edges = new THREE.LineSegments(edgesGeo, edgesMat);
  group.add(edges);

  // Semi-transparent faces
  const faceMat = new THREE.MeshBasicMaterial({
    color: faceColor,
    transparent: true,
    opacity: faceOpacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  // 6 faces as individual planes
  const h = CUBE_SIZE / 2;
  const faceDefs: { normal: THREE.Vector3; pos: THREE.Vector3 }[] = [
    { normal: new THREE.Vector3(0, 0, 1), pos: new THREE.Vector3(0, 0, h) },   // front
    { normal: new THREE.Vector3(0, 0, -1), pos: new THREE.Vector3(0, 0, -h) },  // back
    { normal: new THREE.Vector3(0, 1, 0), pos: new THREE.Vector3(0, h, 0) },    // top
    { normal: new THREE.Vector3(0, -1, 0), pos: new THREE.Vector3(0, -h, 0) },  // bottom
    { normal: new THREE.Vector3(1, 0, 0), pos: new THREE.Vector3(h, 0, 0) },    // right
    { normal: new THREE.Vector3(-1, 0, 0), pos: new THREE.Vector3(-h, 0, 0) },  // left
  ];

  const faceNames = ['front', 'back', 'top', 'bottom', 'right', 'left'];

  for (let i = 0; i < faceDefs.length; i++) {
    const { pos } = faceDefs[i];
    const isMarker = markerFace === faceNames[i];
    const mat = isMarker
      ? new THREE.MeshBasicMaterial({
          color: markerColor,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      : faceMat;

    const planeGeo = new THREE.PlaneGeometry(CUBE_SIZE, CUBE_SIZE);
    const plane = new THREE.Mesh(planeGeo, mat);
    plane.position.copy(pos);
    plane.lookAt(new THREE.Vector3().copy(pos).multiplyScalar(2));

    if (isMarker) {
      plane.scale.set(1.05, 1.05, 1.05);
    }

    group.add(plane);
  }

  return group;
}

export function getCubeCorners(position: THREE.Vector3): THREE.Vector3[] {
  const h = CUBE_SIZE / 2;
  const corners: THREE.Vector3[] = [];
  for (const x of [-h, h]) {
    for (const y of [-h, h]) {
      for (const z of [-h, h]) {
        corners.push(new THREE.Vector3(x, y, z).add(position.clone().multiplyScalar(TOTAL)));
      }
    }
  }
  return corners;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/shapes/cube.ts
git commit -m "feat: add cube mesh generator"
```

---

## Task 8: Shape Collection

**Files:**
- Create: `/home/jay/tmp/20260501/src/shapes/shape.ts`

- [ ] **Step 1: Write shape class**

```typescript
import * as THREE from 'three';
import { LevelData, MarkerDef } from '../types';
import { createCubeMesh, getCubeCorners, TOTAL } from './cube';

export class Shape {
  public group: THREE.Group;
  private cubes: { pos: THREE.Vector3; mesh: THREE.Group }[] = [];

  constructor(level: LevelData, edgeColor?: number, markerColor?: number) {
    this.group = new THREE.Group();

    for (let i = 0; i < level.cubes.length; i++) {
      const [cx, cy, cz] = level.cubes[i];
      const pos = new THREE.Vector3(cx * TOTAL, cy * TOTAL, cz * TOTAL);

      const marker = level.markers.find(m => m.cubeIndex === i);
      const mesh = createCubeMesh({
        edgeColor,
        markerColor,
        faceColor: edgeColor,
        markerFace: marker?.type === 'face' ? marker.face : null,
      });

      if (marker?.type === 'cube') {
        mesh.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
            (child.material as THREE.MeshBasicMaterial).color.set(markerColor);
            (child.material as THREE.MeshBasicMaterial).opacity = 0.35;
          }
        });
      }

      mesh.position.copy(pos);
      this.group.add(mesh);
      this.cubes.push({ pos: pos.clone(), mesh });
    }
  }

  getCorners(): THREE.Vector3[] {
    const corners: THREE.Vector3[] = [];
    for (const cube of this.cubes) {
      const localCorners = getCubeCorners(cube.pos);
      for (const c of localCorners) {
        c.applyMatrix4(this.group.matrixWorld);
      }
      corners.push(...localCorners);
    }
    return corners;
  }

  setRotation(x: number, y: number, z: number, w: number): void {
    this.group.quaternion.set(x, y, z, w);
  }

  resetRotation(x: number, y: number, z: number, w: number): void {
    this.group.quaternion.set(x, y, z, w);
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/shapes/shape.ts
git commit -m "feat: add shape collection class"
```

---

## Task 9: Orthographic Camera

**Files:**
- Create: `/home/jay/tmp/20260501/src/engine/camera.ts`

- [ ] **Step 1: Write camera setup**

```typescript
import * as THREE from 'three';
import { ISOMETRIC_ANGLE } from '../types';

export function createOrthoCamera(
  frustumSize: number,
  aspect: number
): THREE.OrthographicCamera {
  const half = frustumSize / 2;
  const camera = new THREE.OrthographicCamera(
    -half * aspect,
    half * aspect,
    half,
    -half,
    0.1,
    100
  );

  camera.position.set(5, 5, 5);
  camera.lookAt(0, 0, 0);

  return camera;
}

export function setIsometricAngle(camera: THREE.OrthographicCamera): void {
  const dist = 10;
  const el = ISOMETRIC_ANGLE.elevation;
  const az = ISOMETRIC_ANGLE.azimuth;

  camera.position.set(
    dist * Math.cos(el) * Math.cos(az),
    dist * Math.sin(el),
    dist * Math.cos(el) * Math.sin(az)
  );
  camera.lookAt(0, 0, 0);
}

export function setFrustumSize(camera: THREE.OrthographicCamera, size: number): void {
  const aspect = camera.right / camera.top;
  const half = size / 2;
  camera.left = -half * aspect;
  camera.right = half * aspect;
  camera.top = half;
  camera.bottom = -half;
  camera.updateProjectionMatrix();
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/engine/camera.ts
git commit -m "feat: add orthographic camera setup"
```

---

## Task 10: Renderer & Background Grid

**Files:**
- Create: `/home/jay/tmp/20260501/src/engine/renderer.ts`

- [ ] **Step 1: Write renderer setup with grid**

```typescript
import * as THREE from 'three';

export function createRenderer(container: HTMLElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x0A0A1A);
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', () => {
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  return renderer;
}

export function createBackgroundGrid(scene: THREE.Scene): void {
  const gridHelper = new THREE.PolarGridHelper(8, 32, 24, 64, 0x16213E, 0x16213E);
  gridHelper.position.y = -4;
  scene.add(gridHelper);

  const grid2 = new THREE.PolarGridHelper(8, 32, 24, 64, 0x16213E, 0x16213E);
  grid2.position.y = -4;
  grid2.rotation.x = -Math.PI / 2;
  scene.add(grid2);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/engine/renderer.ts
git commit -m "feat: add renderer and background grid"
```

---

## Task 11: 3D Scene Manager

**Files:**
- Create: `/home/jay/tmp/20260501/src/engine/scene3d.ts`

- [ ] **Step 1: Write scene manager with dual viewport support**

```typescript
import * as THREE from 'three';
import { createOrthoCamera, setIsometricAngle, setFrustumSize } from './camera';
import { createBackgroundGrid } from './renderer';
import { Shape } from '../shapes/shape';
import { LevelData } from '../types';

export interface ViewportScene {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  frustumSize: number;
}

export function createViewportScene(
  frustumSize: number,
  aspect: number
): ViewportScene {
  const scene = new THREE.Scene();
  const camera = createOrthoCamera(frustumSize, aspect);
  setIsometricAngle(camera);

  createBackgroundGrid(scene);

  return { scene, camera, frustumSize };
}

export function addShapeToScene(scene: THREE.Scene, shape: Shape): void {
  scene.add(shape.group);
}

export function renderViewport(
  viewport: ViewportScene,
  renderer: THREE.WebGLRenderer,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const { scene, camera } = viewport;
  const aspect = width / height;

  const half = viewport.frustumSize / 2;
  camera.left = -half * aspect;
  camera.right = half * aspect;
  camera.top = half;
  camera.bottom = -half;
  camera.updateProjectionMatrix();

  renderer.setViewport(x, y, width, height);
  renderer.setScissor(x, y, width, height);
  renderer.setScissorTest(true);
  renderer.render(scene, camera);
  renderer.setScissorTest(false);
}

export function zoomViewport(
  viewport: ViewportScene,
  delta: number
): void {
  viewport.frustumSize = Math.max(2, Math.min(16, viewport.frustumSize + delta * 0.5));
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/engine/scene3d.ts
git commit -m "feat: add 3D scene manager with dual viewports"
```

---

## Task 12: Input Controls

**Files:**
- Create: `/home/jay/tmp/20260501/src/input/controls.ts`

- [ ] **Step 1: Write mouse and keyboard controls**

```typescript
import * as THREE from 'three';

export interface ControlsState {
  rotationX: number;
  rotationY: number;
  isDragging: boolean;
  mouseX: number;
  mouseY: number;
  onReset: () => void;
  onHint: () => void;
  onToggleMute: () => void;
  onZoom: (delta: number) => void;
}

export class Controls {
  private state: ControlsState;
  private target: HTMLElement;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartRotX = 0;
  private dragStartRotY = 0;

  constructor(target: HTMLElement) {
    this.target = target;
    this.state = {
      rotationX: 0,
      rotationY: 0,
      isDragging: false,
      mouseX: 0,
      mouseY: 0,
      onReset: () => {},
      onHint: () => {},
      onToggleMute: () => {},
      onZoom: () => {},
    };

    this.bindEvents();
  }

  getState(): ControlsState {
    return this.state;
  }

  setCallbacks(callbacks: {
    onReset: () => void;
    onHint: () => void;
    onToggleMute: () => void;
  }): void {
    this.state.onReset = callbacks.onReset;
    this.state.onHint = callbacks.onHint;
    this.state.onToggleMute = callbacks.onToggleMute;
  }

  private bindEvents(): void {
    this.target.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.target.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    window.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    this.state.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.dragStartRotX = this.state.rotationX;
    this.dragStartRotY = this.state.rotationY;
  }

  private onMouseMove(e: MouseEvent): void {
    this.state.mouseX = e.clientX;
    this.state.mouseY = e.clientY;

    if (this.state.isDragging) {
      const dx = e.clientX - this.dragStartX;
      const dy = e.clientY - this.dragStartY;
      this.state.rotationX = this.dragStartRotX - dy * 0.005;
      this.state.rotationY = this.dragStartRotY + dx * 0.005;
    }
  }

  private onMouseUp(): void {
    this.state.isDragging = false;
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.state.onZoom(e.deltaY > 0 ? 1 : -1);
  }

  private onKeyDown(e: KeyboardEvent): void {
    switch (e.key.toUpperCase()) {
      case 'R':
        this.state.onReset();
        break;
      case 'H':
        this.state.onHint();
        break;
      case 'M':
        this.state.onToggleMute();
        break;
      case 'ARROWUP':
        this.state.rotationX -= Math.PI / 8;
        break;
      case 'ARROWDOWN':
        this.state.rotationX += Math.PI / 8;
        break;
      case 'ARROWLEFT':
        this.state.rotationY -= Math.PI / 8;
        break;
      case 'ARROWRIGHT':
        this.state.rotationY += Math.PI / 8;
        break;
      case 'Q':
        this.state.rotationY -= Math.PI / 8;
        break;
      case 'E':
        this.state.rotationY += Math.PI / 8;
        break;
    }
  }

  updateRotation(shapeRotation: THREE.Quaternion): void {
    const euler = new THREE.Euler(this.state.rotationX, this.state.rotationY, 0, 'YXZ');
    shapeRotation.setFromEuler(euler);
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/input/controls.ts
git commit -m "feat: add mouse and keyboard controls"
```

---

## Task 13: Audio Synthesizer

**Files:**
- Create: `/home/jay/tmp/20260501/src/audio/synth.ts`

- [ ] **Step 1: Write Web Audio synthesizer**

```typescript
export class Synth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 0.5;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 0.5;
    }
    if (this.ambientGain) {
      this.ambientGain.gain.value = this.muted ? 0 : 0.08;
    }
    return this.muted;
  }

  startAmbient(): void {
    const ctx = this.ensureContext();
    if (this.ambientOsc) return;

    this.ambientOsc = ctx.createOscillator();
    this.ambientGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    this.ambientOsc.type = 'sawtooth';
    this.ambientOsc.frequency.value = 55;

    filter.type = 'lowpass';
    filter.frequency.value = 200;
    filter.Q.value = 5;

    this.ambientGain.gain.value = this.muted ? 0 : 0.08;

    this.ambientOsc.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain!);
    this.ambientOsc.start();
  }

  stopAmbient(): void {
    this.ambientOsc?.stop();
    this.ambientOsc = null;
    this.ambientGain = null;
  }

  playMatchTick(matchPercent: number): void {
    const ctx = this.ensureContext();
    if (this.muted) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 440 + matchPercent * 440;

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  playCardFlip(): void {
    const ctx = this.ensureContext();
    if (this.muted) return;

    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(2000, ctx.currentTime + 0.3);
    filter.Q.value = 1;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    source.start();
  }

  playSuccess(): void {
    const ctx = this.ensureContext();
    if (this.muted) return;

    const notes = [261.63, 329.63, 392.00, 523.25]; // C-E-G-C

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const startTime = ctx.currentTime + i * 0.2;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  playUIClick(): void {
    const ctx = this.ensureContext();
    if (this.muted) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.value = 880;

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/audio/synth.ts
git commit -m "feat: add Web Audio synthesizer"
```

---

## Task 14: Particle Effects

**Files:**
- Create: `/home/jay/tmp/20260501/src/effects/particles.ts`

- [ ] **Step 1: Write particle systems**

```typescript
import * as THREE from 'three';

export class ParticleSystem {
  public points: THREE.Points;
  private velocities: Float32Array;
  private life: Float32Array;
  private maxLife: Float32Array;
  private count: number;
  private geometry: THREE.BufferGeometry;

  constructor(count: number, color: number, size: number) {
    this.count = count;
    this.geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    this.life = new Float32Array(count);
    this.maxLife = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      this.life[i] = 0;
      this.maxLife[i] = 1;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color,
      size,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.8,
    });

    this.points = new THREE.Points(this.geometry, material);
    this.points.visible = false;
  }

  burst(origin: THREE.Vector3, spread: number, lifeRange: [number, number]): void {
    const posArr = this.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < this.count; i++) {
      posArr[i * 3] = origin.x + (Math.random() - 0.5) * 0.5;
      posArr[i * 3 + 1] = origin.y + (Math.random() - 0.5) * 0.5;
      posArr[i * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.5;

      this.velocities[i * 3] = (Math.random() - 0.5) * spread;
      this.velocities[i * 3 + 1] = (Math.random() - 0.5) * spread;
      this.velocities[i * 3 + 2] = (Math.random() - 0.5) * spread;

      this.life[i] = 0;
      this.maxLife[i] = lifeRange[0] + Math.random() * (lifeRange[1] - lifeRange[0]);
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.points.visible = true;
  }

  update(dt: number): void {
    if (!this.points.visible) return;

    let anyAlive = false;
    const posArr = this.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < this.count; i++) {
      if (this.life[i] < this.maxLife[i]) {
        anyAlive = true;
        this.life[i] += dt;
        posArr[i * 3] += this.velocities[i * 3] * dt;
        posArr[i * 3 + 1] += this.velocities[i * 3 + 1] * dt;
        posArr[i * 3 + 2] += this.velocities[i * 3 + 2] * dt;

        const fade = 1 - this.life[i] / this.maxLife[i];
        this.velocities[i * 3 + 1] -= dt * 0.5; // gravity
      }
    }

    if (!anyAlive) {
      this.points.visible = false;
    }
    this.geometry.attributes.position.needsUpdate = true;
  }

  dispose(): void {
    this.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}

export class AmbientParticles extends ParticleSystem {
  private bounds: number;

  constructor(count: number, bounds: number) {
    super(count, 0x7C4DFF, 0.03);
    this.bounds = bounds;

    const posArr = this.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      posArr[i * 3] = (Math.random() - 0.5) * bounds * 2;
      posArr[i * 3 + 1] = (Math.random() - 0.5) * bounds * 2;
      posArr[i * 3 + 2] = (Math.random() - 0.5) * bounds * 2;
      this.life[i] = this.maxLife[i]; // all alive permanently
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.points.visible = true;
  }

  update(_dt: number, mouseX?: number, mouseY?: number): void {
    const posArr = this.geometry.attributes.position.array as Float32Array;
    const mx = mouseX ? (mouseX / window.innerWidth - 0.5) * 0.2 : 0;
    const my = mouseY ? (mouseY / window.innerHeight - 0.5) * 0.2 : 0;

    for (let i = 0; i < this.count; i++) {
      posArr[i * 3 + 1] += 0.001 + my * 0.01;
      posArr[i * 3] += mx * 0.01;

      // Wrap around
      if (posArr[i * 3 + 1] > this.bounds) posArr[i * 3 + 1] = -this.bounds;
      if (posArr[i * 3 + 1] < -this.bounds) posArr[i * 3 + 1] = this.bounds;
    }
    this.geometry.attributes.position.needsUpdate = true;
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/effects/particles.ts
git commit -m "feat: add particle effects (drag trail, success burst, ambient)"
```

---

## Task 15: GSAP Animation Helpers

**Files:**
- Create: `/home/jay/tmp/20260501/src/effects/animations.ts`

- [ ] **Step 1: Write GSAP animation utilities**

```typescript
import gsap from 'gsap';
import * as THREE from 'three';

export function animateMatchRing(
  ringMesh: THREE.Mesh,
  fromRatio: number,
  toRatio: number,
  duration: number
): gsap.core.Tween {
  const target = { progress: fromRatio };
  return gsap.to(target, {
    progress: toRatio,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      ringMesh.scale.set(target.progress, target.progress, target.progress);
    },
  });
}

export function animateCardFlip(
  element: HTMLElement,
  onComplete: () => void
): gsap.core.Timeline {
  const tl = gsap.timeline({
    onComplete,
  });

  tl.to(element, {
    rotationY: 90,
    duration: 0.3,
    ease: 'power2.in',
  });
  tl.to(element, {
    rotationY: 180,
    duration: 0.3,
    ease: 'power2.out',
  }, 0.3);
  tl.to(element, {
    rotationY: 0,
    duration: 0.4,
    ease: 'power2.out',
    onComplete,
  });

  return tl;
}

export function animateSuccessBurst(
  shape: THREE.Group,
  onComplete: () => void
): void {
  const cubes = shape.children;
  const positions = cubes.map(c => c.position.clone());

  cubes.forEach((cube, i) => {
    const x = (Math.random() - 0.5) * 3;
    const y = (Math.random() - 0.5) * 3;
    const z = (Math.random() - 0.5) * 3;

    gsap.to(cube.position, {
      x: x,
      y: y,
      z: z,
      duration: 0.5,
      delay: i * 0.03,
      ease: 'power2.out',
    });

    gsap.to(cube.position, {
      x: positions[i].x,
      y: positions[i].y,
      z: positions[i].z,
      duration: 0.6,
      delay: 0.6 + i * 0.03,
      ease: 'elastic.out(1, 0.5)',
      onComplete: i === cubes.length - 1 ? onComplete : undefined,
    });
  });
}

export function animateTransition(
  element: HTMLElement,
  direction: 'in' | 'out'
): gsap.core.Tween {
  return gsap.to(element, {
    opacity: direction === 'in' ? 1 : 0,
    duration: 0.4,
    ease: 'power2.inOut',
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/effects/animations.ts
git commit -m "feat: add GSAP animation helpers"
```

---

## Task 16: HUD Component

**Files:**
- Create: `/home/jay/tmp/20260501/src/ui/hud.ts`

- [ ] **Step 1: Write HUD component**

```typescript
export class HUD {
  private container: HTMLElement;
  private matchEl: HTMLElement;
  private timeEl: HTMLElement;
  private levelNameEl: HTMLElement;
  private startTime = 0;
  private running = false;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-around;
      background: rgba(22, 33, 62, 0.9);
      border-top: 1px solid var(--cyan);
      backdrop-filter: blur(10px);
      font-family: var(--font-mono);
      font-size: 18px;
      color: var(--text-primary);
      z-index: 10;
    `;

    this.levelNameEl = document.createElement('span');
    this.levelNameEl.style.cssText = `
      color: var(--cyan);
      font-family: var(--font-display);
      font-size: 16px;
      letter-spacing: 2px;
    `;

    this.matchEl = document.createElement('span');
    this.matchEl.style.cssText = `
      font-size: 22px;
      font-weight: bold;
    `;

    this.timeEl = document.createElement('span');
    this.timeEl.style.cssText = `
      font-family: var(--font-mono);
      color: var(--text-dim);
    `;

    this.container.appendChild(this.levelNameEl);
    this.container.appendChild(this.matchEl);
    this.container.appendChild(this.timeEl);
    parent.appendChild(this.container);
  }

  setLevelName(name: string): void {
    this.levelNameEl.textContent = name;
  }

  setMatchPercent(percent: number): void {
    const pct = Math.round(percent * 100);
    this.matchEl.textContent = `匹配度: ${pct}%`;
    if (pct > 90) {
      this.matchEl.style.color = 'var(--pink)';
    } else if (pct > 50) {
      this.matchEl.style.color = 'var(--purple)';
    } else {
      this.matchEl.style.color = 'var(--cyan)';
    }
  }

  startTimer(): void {
    this.startTime = performance.now();
    this.running = true;
  }

  stopTimer(): number {
    this.running = false;
    return (performance.now() - this.startTime) / 1000;
  }

  update(): void {
    if (!this.running) return;
    const elapsed = (performance.now() - this.startTime) / 1000;
    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);
    this.timeEl.textContent = `⏱ ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  getElapsed(): number {
    return (performance.now() - this.startTime) / 1000;
  }

  remove(): void {
    this.container.remove();
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/ui/hud.ts
git commit -m "feat: add HUD component"
```

---

## Task 17: Card Flip Component

**Files:**
- Create: `/home/jay/tmp/20260501/src/ui/card.ts`

- [ ] **Step 1: Write card flip component**

```typescript
import gsap from 'gsap';

export class CardFlip {
  private container: HTMLElement;
  private front: HTMLElement;
  private back: HTMLElement;
  private card: HTMLElement;

  constructor(parent: HTMLElement, levelName: string) {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      perspective: 1000px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-deep);
      z-index: 20;
    `;

    this.card = document.createElement('div');
    this.card.style.cssText = `
      width: 300px;
      height: 400px;
      position: relative;
      transform-style: preserve-3d;
      transform: rotateY(0deg);
    `;

    this.front = this.createFace('正面', '🧊', levelName, false);
    this.back = this.createFace('背面', '🔮', '准备开始', true);

    this.front.style.backfaceVisibility = 'hidden';
    this.back.style.backfaceVisibility = 'hidden';

    this.card.appendChild(this.front);
    this.card.appendChild(this.back);
    this.container.appendChild(this.card);
    
    // Start card hidden
    parent.appendChild(this.container);
    this.card.style.transform = 'rotateY(0deg)';
  }

  private createFace(
    label: string,
    icon: string,
    name: string,
    isBack: boolean
  ): HTMLElement {
    const face = document.createElement('div');
    face.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      background: var(--bg-mid);
      border: 2px solid var(--cyan);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
      box-shadow: 0 0 30px rgba(0, 229, 255, 0.2);
      font-family: var(--font-display);
    `;

    if (isBack) {
      face.style.transform = 'rotateY(180deg)';
    }

    const iconEl = document.createElement('div');
    iconEl.textContent = icon;
    iconEl.style.cssText = 'font-size: 80px;';

    const nameEl = document.createElement('div');
    nameEl.textContent = name;
    nameEl.style.cssText = `
      color: var(--cyan);
      font-size: 24px;
      letter-spacing: 4px;
    `;

    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    labelEl.style.cssText = `
      color: var(--text-dim);
      font-size: 14px;
    `;

    face.appendChild(iconEl);
    face.appendChild(nameEl);
    face.appendChild(labelEl);

    return face;
  }

  flip(onComplete: () => void): void {
    const tl = gsap.timeline({ onComplete });

    tl.to(this.card, {
      rotationY: 90,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => {
        // Update back face content at halfway point
        this.front.style.display = 'none';
      },
    });

    tl.to(this.card, {
      rotationY: 180,
      duration: 0.5,
      ease: 'power2.out',
    });

    tl.to(this.container, {
      opacity: 0,
      duration: 0.5,
      delay: 0.5,
      ease: 'power2.in',
      onComplete: () => {
        this.remove();
        onComplete();
      },
    });
  }

  remove(): void {
    this.container.remove();
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/ui/card.ts
git commit -m "feat: add card flip component"
```

---

## Task 18: Menu Component

**Files:**
- Create: `/home/jay/tmp/20260501/src/ui/menu.ts`

- [ ] **Step 1: Write menu with level select grid**

```typescript
import { SaveData } from '../types';

export class Menu {
  private container: HTMLElement;
  private grid: HTMLElement;
  private onLevelSelect: (levelId: number) => void = () => {};
  private save: SaveData;

  constructor(parent: HTMLElement, saveData: SaveData) {
    this.save = saveData;

    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: radial-gradient(ellipse at center, var(--bg-mid), var(--bg-deep));
      z-index: 5;
    `;

    const title = document.createElement('h1');
    title.textContent = '立体投影拼图';
    title.style.cssText = `
      font-family: var(--font-display);
      font-size: 36px;
      color: var(--cyan);
      letter-spacing: 6px;
      margin-bottom: 10px;
      text-shadow: 0 0 20px rgba(0, 229, 255, 0.5);
    `;

    const subtitle = document.createElement('div');
    subtitle.textContent = '旋转正方体组合，匹配目标投影';
    subtitle.style.cssText = `
      font-family: var(--font-mono);
      font-size: 14px;
      color: var(--text-dim);
      margin-bottom: 40px;
    `;

    this.grid = document.createElement('div');
    this.grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(5, 80px);
      gap: 10px;
    `;

    for (let i = 1; i <= 20; i++) {
      this.grid.appendChild(this.createLevelCard(i));
    }

    this.container.appendChild(title);
    this.container.appendChild(subtitle);
    this.container.appendChild(this.grid);
    parent.appendChild(this.container);
  }

  private createLevelCard(id: number): HTMLElement {
    const card = document.createElement('div');
    const isUnlocked = id <= this.save.highestUnlocked;
    const isCompleted = this.save.levelStats[id]?.completed;

    card.textContent = String(id);
    card.style.cssText = `
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-display);
      font-size: 20px;
      border-radius: 8px;
      cursor: ${isUnlocked ? 'pointer' : 'not-allowed'};
      transition: transform 0.2s, box-shadow 0.2s;
      border: 2px solid ${
        isCompleted ? 'var(--pink)' :
        isUnlocked ? 'var(--cyan)' : 'var(--text-dim)'
      };
      color: ${
        isCompleted ? 'var(--pink)' :
        isUnlocked ? 'var(--cyan)' : 'var(--text-dim)'
      };
      background: ${isUnlocked ? 'rgba(0, 229, 255, 0.05)' : 'rgba(85, 85, 119, 0.05)'};
      opacity: ${isUnlocked ? 1 : 0.4};
    `;

    const stats = this.save.levelStats[id];
    if (stats) {
      card.title = `最佳: ${stats.bestTime.toFixed(1)}s · 旋转: ${stats.rotations}`;
    }

    if (isUnlocked) {
      card.addEventListener('click', () => this.onLevelSelect(id));
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'scale(1.1)';
        card.style.boxShadow = `0 0 20px ${isCompleted ? 'rgba(255,64,129,0.4)' : 'rgba(0,229,255,0.4)'}`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'scale(1)';
        card.style.boxShadow = 'none';
      });
    }

    return card;
  }

  setOnLevelSelect(callback: (levelId: number) => void): void {
    this.onLevelSelect = callback;
  }

  remove(): void {
    this.container.remove();
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/ui/menu.ts
git commit -m "feat: add menu component with level select grid"
```

---

## Task 19: Game State Machine & Main Entry

**Files:**
- Modify: `/home/jay/tmp/20260501/src/main.ts`
- No create (main.ts already exists from earlier tasks)

- [ ] **Step 1: Delete old main.ts content and write full game state machine**

```typescript
import './style.css';
import * as THREE from 'three';
import { LEVELS, SaveData, GameState } from './levels/data';
import { computeMatchScore } from './matching/matcher';
import { Shape } from './shapes/shape';
import { createRenderer } from './engine/renderer';
import {
  createViewportScene,
  addShapeToScene,
  renderViewport,
  zoomViewport,
} from './engine/scene3d';
import { Controls } from './input/controls';
import { Synth } from './audio/synth';
import { ParticleSystem, AmbientParticles } from './effects/particles';
import { animateSuccessBurst } from './effects/animations';
import { HUD } from './ui/hud';
import { CardFlip } from './ui/card';
import { Menu } from './ui/menu';
import { LevelData } from './types';

const STORAGE_KEY = 'cube_puzzle_save';
const DEFAULT_SAVE: SaveData = {
  highestUnlocked: 1,
  levelStats: {},
  muted: false,
};

class Game {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private targetViewport!: ReturnType<typeof createViewportScene>;
  private playerViewport!: ReturnType<typeof createViewportScene>;
  private targetShape: Shape | null = null;
  private playerShape: Shape | null = null;
  private controls: Controls | null = null;
  private synth: Synth;
  private successParticles: ParticleSystem | null = null;
  private ambientParticles: AmbientParticles | null = null;
  private hud: HUD | null = null;
  private currentLevel: LevelData | null = null;
  private state: GameState = 'MENU';
  private saveData: SaveData;
  private menu: Menu | null = null;
  private animationId = 0;
  private lastTime = 0;
  private matchPercent = 0;
  private rotationCount = 0;
  private prevRotationX = 0;
  private prevRotationY = 0;
  private hintActive = false;
  private hintTimer = 0;

  constructor() {
    this.container = document.getElementById('app')!;

    // Load save
    const saved = localStorage.getItem(STORAGE_KEY);
    this.saveData = saved ? { ...DEFAULT_SAVE, ...JSON.parse(saved) } : { ...DEFAULT_SAVE };

    this.renderer = createRenderer(this.container);
    this.synth = new Synth();
    if (this.saveData.muted) this.synth.toggleMute();
  }

  start(): void {
    this.showMenu();
  }

  private showMenu(): void {
    this.state = 'MENU';
    this.cleanup();
    this.menu = new Menu(this.container, this.saveData);
    this.menu.setOnLevelSelect((id) => {
      this.synth.playUIClick();
      this.startLevel(id);
    });
  }

  private startLevel(levelId: number): void {
    const level = LEVELS.find(l => l.id === levelId);
    if (!level) return;

    this.currentLevel = level;
    this.state = 'CARD_FLIP';
    this.matchPercent = 0;
    this.rotationCount = 0;
    this.hintActive = false;
    this.hintTimer = 0;
    this.cleanup();

    // Show card flip
    const card = new CardFlip(this.container, level.name);
    card.flip(() => {
      this.enterPlaying(level);
    });

    this.synth.playCardFlip();
  }

  private enterPlaying(level: LevelData): void {
    this.state = 'PLAYING';

    // Create viewports
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const viewportW = w / 2;
    const aspect = viewportW / h;

    this.targetViewport = createViewportScene(6, aspect);
    this.playerViewport = createViewportScene(6, aspect);

    // Create shapes
    this.targetShape = new Shape(level, 0xFF4081, 0xFF4081);
    this.targetShape.setRotation(
      level.targetRotation[0],
      level.targetRotation[1],
      level.targetRotation[2],
      level.targetRotation[3]
    );
    addShapeToScene(this.targetViewport.scene, this.targetShape);

    this.playerShape = new Shape(level, 0x00E5FF, 0xFF4081);
    this.playerShape.setRotation(
      level.startRotation[0],
      level.startRotation[1],
      level.startRotation[2],
      level.startRotation[3]
    );
    addShapeToScene(this.playerViewport.scene, this.playerShape);

    // Particles
    this.successParticles = new ParticleSystem(200, 0xFF4081, 0.05);
    this.playerViewport.scene.add(this.successParticles.points);

    this.ambientParticles = new AmbientParticles(50, 8);
    this.playerViewport.scene.add(this.ambientParticles.points);

    // Controls
    const canvas = this.renderer.domElement;
    this.controls = new Controls(canvas);
    this.controls.setCallbacks({
      onReset: () => this.resetRotation(),
      onHint: () => this.showHint(),
      onToggleMute: () => this.toggleMute(),
    });
    this.prevRotationX = 0;
    this.prevRotationY = 0;

    // HUD
    this.hud = new HUD(this.container);
    this.hud.setLevelName(`第 ${String(level.id).padStart(2, '0')} 关 · ${level.name}`);
    this.hud.startTimer();

    // Audio
    this.synth.startAmbient();

    // Start render loop
    this.lastTime = performance.now();
    this.animate();
  }

  private resetRotation(): void {
    if (!this.currentLevel || !this.playerShape) return;
    const r = this.currentLevel.startRotation;
    this.playerShape.resetRotation(r[0], r[1], r[2], r[3]);
    if (this.controls) {
      const state = this.controls.getState();
      state.rotationX = 0;
      state.rotationY = 0;
    }
  }

  private showHint(): void {
    this.hintActive = true;
    this.hintTimer = 1.0;
  }

  private toggleMute(): void {
    const muted = this.synth.toggleMute();
    this.saveData.muted = muted;
    this.save();
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.saveData));
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (this.state !== 'PLAYING') return;

    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const vw = w / 2;

    // Update controls
    if (this.controls && this.playerShape) {
      const ctrl = this.controls.getState();

      // Track rotation count
      const currentRX = ctrl.rotationX;
      const currentRY = ctrl.rotationY;
      if (Math.abs(currentRX - this.prevRotationX) > 0.01 ||
          Math.abs(currentRY - this.prevRotationY) > 0.01) {
        this.rotationCount++;
      }
      this.prevRotationX = currentRX;
      this.prevRotationY = currentRY;

      const quat = new THREE.Quaternion();
      this.controls.updateRotation(quat);
      this.playerShape.group.quaternion.copy(quat);
    }

    // Match calculation
    if (this.targetShape && this.playerShape) {
      const targetCorners = this.targetShape.getCorners();
      const playerCorners = this.playerShape.getCorners();
      const tolerance = this.currentLevel?.tolerance ?? 0.08;
      this.matchPercent = computeMatchScore(targetCorners, playerCorners, tolerance);
    }

    // Success check
    if (this.matchPercent > 0.92 && this.playerShape) {
      this.onSuccess();
      return;
    }

    // Hint timer
    if (this.hintActive) {
      this.hintTimer -= dt;
      if (this.hintTimer <= 0) {
        this.hintActive = false;
      }
    }

    // Update HUD
    this.hud?.setMatchPercent(this.matchPercent);
    this.hud?.update();

    // Match tick audio
    if (this.matchPercent > 0.5) {
      this.synth.playMatchTick(this.matchPercent);
    }

    // Update particles
    if (this.ambientParticles && this.controls) {
      const ctrl = this.controls.getState();
      this.ambientParticles.update(dt, ctrl.mouseX, ctrl.mouseY);
    }
    this.successParticles?.update(dt);

    // Render
    this.renderer.setSize(w, h);

    // Target viewport (left)
    renderViewport(this.targetViewport, this.renderer, 0, 0, vw, h);

    // Player viewport (right)
    if (this.hintActive) {
      // Flash target shape as hint by briefly showing target rotation overlay
      const playerOpacity = this.playerShape.group.children[0]?.children[0]
        ? (this.playerShape.group.children[0].children[0] as THREE.Mesh).material
        : null;
      if (playerOpacity && 'opacity' in playerOpacity) {
        (playerOpacity as THREE.MeshBasicMaterial).opacity = 0.05;
      }
    }
    renderViewport(this.playerViewport, this.renderer, vw, 0, vw, h);

    // Handle zoom
    if (this.controls) {
      const ctrl = this.controls.getState();
      ctrl.onZoom = (delta: number) => {
        zoomViewport(this.playerViewport, delta);
      };
    }
  };

  private onSuccess(): void {
    this.state = 'SUCCESS';

    if (this.hud) {
      const elapsed = this.hud.stopTimer();
      if (this.currentLevel) {
        const id = String(this.currentLevel.id);
        const existing = this.saveData.levelStats[id];
        if (!existing || !existing.completed || elapsed < existing.bestTime) {
          this.saveData.levelStats[id] = {
            bestTime: elapsed,
            rotations: this.rotationCount,
            completed: true,
          };
        }
        if (this.currentLevel.id >= this.saveData.highestUnlocked) {
          this.saveData.highestUnlocked = Math.min(20, this.currentLevel.id + 1);
        }
      }
      this.save();
    }

    this.synth.stopAmbient();
    this.synth.playSuccess();

    // Success burst
    if (this.playerShape) {
      this.successParticles?.burst(new THREE.Vector3(0, 0, 0), 2, [0.5, 1.5]);
      animateSuccessBurst(this.playerShape.group, () => {
        setTimeout(() => this.showMenu(), 1000);
      });
    }
  }

  private cleanup(): void {
    cancelAnimationFrame(this.animationId);

    if (this.targetShape?.group) {
      this.targetShape.group.clear();
    }
    if (this.playerShape?.group) {
      this.playerShape.group.clear();
    }

    this.hud?.remove();
    this.menu?.remove();

    this.targetShape = null;
    this.playerShape = null;
    this.controls = null;
    this.hud = null;
    this.menu = null;
    this.successParticles?.dispose();
    this.ambientParticles?.dispose();
    this.successParticles = null;
    this.ambientParticles = null;
    this.synth.stopAmbient();
  }

  destroy(): void {
    this.cleanup();
    this.renderer.dispose();
  }
}

// Start game
const game = new Game();
game.start();

// Expose for debugging
(window as unknown as Record<string, unknown>).__game = game;
```

- [ ] **Step 2: Fix imports — main.ts now imports LEVELS, SaveData and GameState from levels/data, and LevelData from types**

The import in main.ts should be:

```typescript
import type { SaveData, GameState } from '../types';
import { LEVELS } from './levels/data';
```

Wait — let me re-examine. The types are in `src/types.ts`. The levels are in `src/levels/data.ts`. From main.ts in `src/`, the imports should be:

```typescript
import type { SaveData, GameState, LevelData } from './types';
import { LEVELS } from './levels/data';
```

Let me fix the import statement in the code above to be correct. Actually I already wrote `import { LEVELS, SaveData, GameState } from './levels/data';` which is wrong — SaveData and GameState are in types.ts. Let me fix that.

The correct imports:

```typescript
import './style.css';
import * as THREE from 'three';
import type { SaveData, GameState, LevelData } from './types';
import { LEVELS } from './levels/data';
import { computeMatchScore } from './matching/matcher';
import { Shape } from './shapes/shape';
import { createRenderer } from './engine/renderer';
import {
  createViewportScene,
  addShapeToScene,
  renderViewport,
  zoomViewport,
} from './engine/scene3d';
import { Controls } from './input/controls';
import { Synth } from './audio/synth';
import { ParticleSystem, AmbientParticles } from './effects/particles';
import { animateSuccessBurst } from './effects/animations';
import { HUD } from './ui/hud';
import { CardFlip } from './ui/card';
import { Menu } from './ui/menu';
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Should compile but may have some errors. Fix any issues.

- [ ] **Step 4: Commit**

```bash
git add src/main.ts
git commit -m "feat: implement game state machine and main entry"
```

---

## Task 20: Integration, Build & Verify

**Files:**
- Modify: `/home/jay/tmp/20260501/src/main.ts` (fix any remaining issues)

- [ ] **Step 1: TypeScript compilation check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 2: Production build**

Run: `npx vite build`
Expected: Build succeeds, outputs to `dist/`.

- [ ] **Step 3: Verify dev server runs the game**

Run: `npx vite --host 0.0.0.0`
Expected: Browser shows menu with 20 level cards. Level 1 is unlocked and clickable. Card flip animation plays, then dual-viewport 3D scene appears with HUD at bottom. Mouse drag rotates the right cube. Match percentage updates.

Manual QA checklist:
- [ ] Menu displays with 20 level cards, level 1 unlocked (cyan border)
- [ ] Clicking level 1 plays card flip sound and animation
- [ ] Playing view shows two 3D viewports side by side
- [ ] Left viewport shows target shape (pink edges), static
- [ ] Right viewport shows player shape (cyan edges), rotatable
- [ ] Mouse drag rotates player shape smoothly
- [ ] Scroll wheel zooms in/out on player viewport
- [ ] HUD shows level name, match percent, timer
- [ ] Match percent updates in real-time during rotation
- [ ] Pressing R resets rotation to start position
- [ ] Pressing M toggles mute
- [ ] Reaching >92% match triggers success animation and returns to menu
- [ ] Completing level 1 unlocks level 2 in the menu
- [ ] Refresh browser — save persists (level 2 still unlocked)
- [ ] Arrow keys snap rotate 90°

- [ ] **Step 4: Verify all 20 levels load**

Check console for "All 20 levels validated" from the earlier level data task.
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: final integration and verification"
```
