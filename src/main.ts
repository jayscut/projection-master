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
  private startQuat = new THREE.Quaternion();
  private rotationCount = 0;
  private prevRotationX = 0;
  private prevRotationY = 0;
  private hintActive = false;
  private hintTimer = 0;

  constructor() {
    this.container = document.getElementById('app')!;

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

    const card = new CardFlip(this.container, level.name);
    card.flip(() => {
      this.enterPlaying(level);
    });

    this.synth.playCardFlip();
  }

  private enterPlaying(level: LevelData): void {
    this.state = 'PLAYING';

    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const viewportW = w / 2;
    const aspect = viewportW / h;

    this.targetViewport = createViewportScene(6, aspect);
    this.playerViewport = createViewportScene(6, aspect);

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
    this.startQuat.set(
      level.startRotation[0],
      level.startRotation[1],
      level.startRotation[2],
      level.startRotation[3]
    );
    addShapeToScene(this.playerViewport.scene, this.playerShape);

    this.successParticles = new ParticleSystem(200, 0xFF4081, 0.05);
    this.playerViewport.scene.add(this.successParticles.points);

    this.ambientParticles = new AmbientParticles(50, 8);
    this.playerViewport.scene.add(this.ambientParticles.points);

    const canvas = this.renderer.domElement;
    this.controls = new Controls(canvas);
    this.controls.setCallbacks({
      onReset: () => this.resetRotation(),
      onHint: () => this.showHint(),
      onToggleMute: () => this.toggleMute(),
    });
    this.prevRotationX = 0;
    this.prevRotationY = 0;

    this.hud = new HUD(this.container);
    this.hud.setLevelName(`第 ${String(level.id).padStart(2, '0')} 关 · ${level.name}`);
    this.hud.startTimer();

    this.synth.startAmbient();

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

    if (this.controls && this.playerShape) {
      const ctrl = this.controls.getState();

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
      this.playerShape.group.quaternion.copy(this.startQuat).multiply(quat);
    }

    if (this.targetShape && this.playerShape) {
      const targetCorners = this.targetShape.getCorners();
      const playerCorners = this.playerShape.getCorners();
      const tolerance = this.currentLevel?.tolerance ?? 0.08;
      this.matchPercent = computeMatchScore(targetCorners, playerCorners, tolerance);
    }

    if (this.matchPercent > 0.92 && this.playerShape) {
      this.onSuccess();
      return;
    }

    if (this.hintActive) {
      this.hintTimer -= dt;
      if (this.hintTimer <= 0) {
        this.hintActive = false;
      }
    }

    this.hud?.setMatchPercent(this.matchPercent);
    this.hud?.update();

    if (this.matchPercent > 0.5) {
      this.synth.playMatchTick(this.matchPercent);
    }

    if (this.ambientParticles && this.controls) {
      const ctrl = this.controls.getState();
      this.ambientParticles.update(dt, ctrl.mouseX, ctrl.mouseY);
    }
    this.successParticles?.update(dt);

    this.renderer.setSize(w, h);

    if (this.controls) {
      const ctrl = this.controls.getState();
      ctrl.onZoom = (delta: number) => {
        zoomViewport(this.playerViewport, delta);
      };
    }

    renderViewport(this.targetViewport, this.renderer, 0, 0, vw, h);
    renderViewport(this.playerViewport, this.renderer, vw, 0, vw, h);
  };

  private onSuccess(): void {
    this.state = 'SUCCESS';

    if (this.hud) {
      const elapsed = this.hud.stopTimer();
      if (this.currentLevel) {
        const id = this.currentLevel.id;
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

    this.controls?.destroy();
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

const game = new Game();
game.start();

(window as unknown as Record<string, unknown>).__game = game;
