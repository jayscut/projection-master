import './style.css';
import * as THREE from 'three';
import gsap from 'gsap';
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
import { animateSuccessBurst, animateShapeAssemble } from './effects/animations';
import { HUD } from './ui/hud';
import { CardFlip } from './ui/card';
import { Home } from './ui/home';
import { Menu } from './ui/menu';
import { ResultPanel } from './ui/result';

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
  private state: GameState = 'HOME';
  private saveData: SaveData;
  private home: Home | null = null;
  private menu: Menu | null = null;
  private animationId = 0;
  private lastTime = 0;
  private matchPercent = 0;
  private lastMatchPercent = 0;
  private startQuat = new THREE.Quaternion();
  private prevQuat = new THREE.Quaternion();
  private rotationCount = 0;
  private hintActive = false;
  private hintTimer = 0;
  private prevStars = 0;
  private targetBaseQuat = new THREE.Quaternion();
  private targetSnapping = false;
  private debugPanel: HTMLElement | null = null; // toggle via URL #debug

  constructor() {
    this.container = document.getElementById('app')!;

    const saved = localStorage.getItem(STORAGE_KEY);
    this.saveData = saved ? { ...DEFAULT_SAVE, ...JSON.parse(saved) } : { ...DEFAULT_SAVE };

    this.renderer = createRenderer(this.container);
    this.synth = new Synth();
    if (this.saveData.muted) this.synth.toggleMute();

    if (window.location.hash === '#debug') {
      this.debugPanel = document.createElement('pre');
      this.debugPanel.style.cssText = `
        position:absolute;top:0;left:0;right:0;bottom:0;z-index:50;
        display:flex;gap:20px;pointer-events:none;
        font:10px/1.4 monospace;color:#0f0;padding:8px;
        background:rgba(0,0,0,0.7);overflow:hidden;
      `;
      this.container.appendChild(this.debugPanel);
    }

    // Unlock AudioContext on first user interaction
    const unlock = () => {
      this.synth.unlock();
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('keydown', unlock);
    };
    document.addEventListener('click', unlock);
    document.addEventListener('touchstart', unlock);
    document.addEventListener('keydown', unlock);
  }

  start(): void {
    this.showHome();
  }

  private showHome(): void {
    this.state = 'HOME';
    this.cleanup();
    this.home = new Home(this.container);
    this.home.setOnStart(() => {
      this.showMenu(true);
    });
  }

  private showMenu(animated = false): void {
    this.state = 'MENU';
    this.cleanup();
    this.menu = new Menu(this.container, this.saveData);

    if (animated) {
      this.menu.container.style.animation = 'fadeIn 0.5s ease both';
      const cards = this.menu.container.querySelectorAll('.level-card');
      cards.forEach((card, i) => {
        (card as HTMLElement).style.animation = 'none';
        void (card as HTMLElement).offsetWidth;
        (card as HTMLElement).style.animation = `cardStaggerIn 0.4s ease both`;
        (card as HTMLElement).style.animationDelay = `${0.3 + i * 0.04}s`;
      });
    }

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

    this.targetShape = new Shape(level, 0xFF4081, 0xFFFFFF);
    this.targetShape.setRotation(
      level.targetRotation[0],
      level.targetRotation[1],
      level.targetRotation[2],
      level.targetRotation[3]
    );
    this.targetBaseQuat.set(
      level.targetRotation[0],
      level.targetRotation[1],
      level.targetRotation[2],
      level.targetRotation[3]
    );
    addShapeToScene(this.targetViewport.scene, this.targetShape);

    this.playerShape = new Shape(level, 0x00E5FF, 0xFFFFFF);
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
    this.controls = new Controls(canvas, this.playerViewport.camera);
    this.controls.setCallbacks({
      onReset: () => this.resetRotation(),
      onHint: () => this.showHint(),
      onToggleMute: () => this.toggleMute(),
    });
    this.prevQuat.identity();

    this.lastMatchPercent = 0;

    this.hud = new HUD(this.container, () => {
      if (this.lastMatchPercent > 0) {
        this.showBackConfirm(() => {
          this.showMenu();
        });
      } else {
        this.showMenu();
      }
    });
    this.hud.setOnConfirm(() => this.confirmSuccess());

    // Intro animations
    animateShapeAssemble(this.targetShape!.group);
    requestAnimationFrame(() => animateShapeAssemble(this.playerShape!.group));

    // Opacity breathing glow on player shape faces (visual only)
    const breatheObj = { val: 0.13 };
    gsap.to(breatheObj, {
      val: 0.22,
      duration: 2.5,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
      onUpdate: () => {
        if (!this.playerShape) return;
        this.playerShape.group.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
            const mat = child.material as THREE.MeshBasicMaterial;
            if (mat.opacity < 0.3) mat.opacity = breatheObj.val;
          }
        });
      },
    });

    this.prevStars = 0;
    this.animate();
  }

  private resetRotation(): void {
    if (!this.currentLevel || !this.playerShape) return;
    this.playerShape.resetRotation(
      this.currentLevel.startRotation[0],
      this.currentLevel.startRotation[1],
      this.currentLevel.startRotation[2],
      this.currentLevel.startRotation[3]
    );
    this.controls?.reset();
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
    const isMobile = w < 768;

    if (this.controls && this.playerShape) {
      this.controls.update(dt);

      const quat = new THREE.Quaternion();
      this.controls.updateRotation(quat);
      this.playerShape.group.quaternion.copy(quat).multiply(this.startQuat);

      if (quat.angleTo(this.prevQuat) > 0.005) {
        this.rotationCount++;
        this.prevQuat.copy(quat);
      }
    }

    if (this.targetShape && this.playerShape) {
      const savedTargetQuat = this.targetShape.group.quaternion.clone();
      this.targetShape.group.quaternion.copy(this.targetBaseQuat);
      const targetCorners = this.targetShape.getCorners();
      const playerCorners = this.playerShape.getCorners();
      const targetMarkers = this.targetShape.getMarkerPoints();
      const playerMarkers = this.playerShape.getMarkerPoints();
      this.targetShape.group.quaternion.copy(savedTargetQuat);
      const tolerance = this.currentLevel?.tolerance ?? 0.08;
      this.matchPercent = computeMatchScore(
        targetCorners, playerCorners, targetMarkers, playerMarkers, tolerance
      );

      if (this.debugPanel && this.currentLevel) {
        const tq = this.targetShape.group.quaternion;
        const pq = this.playerShape.group.quaternion;
        const fmt = (v: THREE.Vector3) => `(${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)})`;
        const fmtQ = (q: THREE.Quaternion) => `[${q.x.toFixed(3)},${q.y.toFixed(3)},${q.z.toFixed(3)},${q.w.toFixed(3)}]`;
        this.debugPanel.innerHTML =
          `<div style="flex:1;white-space:pre-wrap">` +
          `【目标 · ${this.currentLevel.name}】\n` +
          `旋转: ${fmtQ(tq)}\n容差: ${tolerance}\n` +
          `角点数: ${targetCorners.length}  面标记点: ${targetMarkers.length}\n` +
          targetCorners.map(c => fmt(c)).join('\n') +
          (targetMarkers.length ? '\n---面心---\n' + targetMarkers.map(c => fmt(c)).join('\n') : '') +
          `</div>` +
          `<div style="flex:1;white-space:pre-wrap">` +
          `【玩家 · 匹配 ${(this.matchPercent*100).toFixed(1)}%】\n` +
          `旋转: ${fmtQ(pq)}\n` +
          `RMSE≈${(tolerance*(1-this.matchPercent)).toFixed(4)}\n` +
          `角点数: ${playerCorners.length}  面标记点: ${playerMarkers.length}\n` +
          playerCorners.map(c => fmt(c)).join('\n') +
          (playerMarkers.length ? '\n---面心---\n' + playerMarkers.map(c => fmt(c)).join('\n') : '') +
          `</div>`;
      }
    }

    if (this.hintActive) {
      this.hintTimer -= dt;
      if (this.hintTimer <= 0) {
        this.hintActive = false;
      }
    }

    // Target peek rotation + snapback
    if (this.controls && this.targetShape) {
      if (this.controls.isDraggingTarget()) {
        this.targetSnapping = false;
        gsap.killTweensOf(this.targetShape!.group.quaternion);
      }

      const targetOffset = new THREE.Quaternion();
      this.controls.getTargetQuat(targetOffset);

      if (!this.targetSnapping) {
        if (this.controls.needsTargetSnap()) {
          this.controls.consumeTargetSnap();
          this.targetSnapping = true;
          const fromQuat = targetOffset.clone();
          const snapObj = { t: 0 };
          gsap.to(snapObj, {
            t: 1,
            duration: 0.5,
            ease: 'elastic.out(1, 0.5)',
            onUpdate: () => {
              this.targetShape!.group.quaternion
                .slerpQuaternions(fromQuat, new THREE.Quaternion(), snapObj.t)
                .multiply(this.targetBaseQuat);
            },
            onComplete: () => {
              this.targetShape!.group.quaternion.copy(this.targetBaseQuat);
              this.targetSnapping = false;
            },
          });
        } else {
          this.targetShape.group.quaternion.copy(targetOffset).multiply(this.targetBaseQuat);
        }
      }
    }

    this.lastMatchPercent = this.matchPercent;
    this.hud?.setMatchPercent(this.matchPercent);

    // Threshold particle burst when stars increase
    const stars = this.getStars();
    if (stars > 0 && stars > this.prevStars && this.playerShape) {
      this.prevStars = stars;
      this.successParticles?.burst(new THREE.Vector3(0, 0, 0), 1.5, [0.2, 0.5]);
    }

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

    if (isMobile) {
      const vh = h / 2;
      renderViewport(this.targetViewport, this.renderer, 0, 0, w, vh);
      renderViewport(this.playerViewport, this.renderer, 0, vh, w, vh);
    } else {
      const vw = w / 2;
      renderViewport(this.targetViewport, this.renderer, 0, 0, vw, h);
      renderViewport(this.playerViewport, this.renderer, vw, 0, vw, h);
    }
  };

  private confirmSuccess(): void {
    if (this.state !== 'PLAYING' || !this.playerShape) return;
    this.state = 'SUCCESS';

    const stars = this.getStars();

    if (this.currentLevel) {
      const id = this.currentLevel.id;
      const existing = this.saveData.levelStats[id];
      if (!existing || !existing.completed || stars > existing.stars) {
        this.saveData.levelStats[id] = { stars, completed: true };
      }
      if (id >= this.saveData.highestUnlocked) {
        this.saveData.highestUnlocked = Math.min(20, id + 1);
      }
      this.save();
    }

    this.synth.playSuccess();
    this.hud?.remove();
    this.hud = null;

    this.successParticles?.burst(new THREE.Vector3(0, 0, 0), 2, [0.5, 1.5]);
    animateSuccessBurst(this.playerShape.group, () => {
      if (this.currentLevel) {
        this.showResult(this.currentLevel.name, this.currentLevel.id);
      }
    });
  }

  private getStars(): number {
    if (this.matchPercent >= 0.92) return 3;
    if (this.matchPercent >= 0.84) return 2;
    if (this.matchPercent >= 0.76) return 1;
    return 0;
  }

  private showResult(levelName: string, levelId: number): void {
    const result = new ResultPanel(this.container, {
      stars: this.getStars(),
      levelName,
      levelId,
      matchPercent: this.matchPercent,
    });
    result.setOnBack(() => {
      this.showMenu();
    });
    result.setOnNext(() => {
      result.remove();
      const nextId = levelId + 1;
      if (nextId <= 20 && this.saveData.highestUnlocked >= nextId) {
        this.startLevel(nextId);
      } else {
        this.showMenu();
      }
    });
  }

  private showBackConfirm(onConfirm: () => void): void {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(10,10,26,0.85); z-index: 40;
      animation: fadeIn 0.2s ease;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
      background: var(--bg-mid);
      border: 1px solid var(--cyan);
      border-radius: 12px;
      padding: 24px 36px;
      text-align: center;
      animation: slideUp 0.3s ease;
      max-width: 320px;
    `;

    const msg = document.createElement('div');
    msg.textContent = '确定放弃当前进度？';
    msg.style.cssText = `
      font-family: var(--font-mono);
      font-size: 15px;
      color: var(--text-primary);
      margin-bottom: 20px;
    `;

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display: flex; gap: 12px; justify-content: center;';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.style.cssText = `
      padding: 8px 24px;
      font-family: var(--font-display);
      font-size: 13px;
      color: var(--text-dim);
      background: transparent;
      border: 1px solid var(--text-dim);
      border-radius: 6px;
      cursor: pointer;
    `;
    cancelBtn.addEventListener('click', () => overlay.remove());

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = '确定';
    confirmBtn.style.cssText = `
      padding: 8px 24px;
      font-family: var(--font-display);
      font-size: 13px;
      color: var(--bg-deep);
      background: var(--pink);
      border: none;
      border-radius: 6px;
      cursor: pointer;
    `;
    confirmBtn.addEventListener('click', () => {
      overlay.remove();
      onConfirm();
    });

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(confirmBtn);
    box.appendChild(msg);
    box.appendChild(btnRow);
    overlay.appendChild(box);
    this.container.appendChild(overlay);
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
    this.home?.destroy();

    this.controls?.destroy();
    this.targetShape = null;
    this.playerShape = null;
    this.controls = null;
    this.hud = null;
    this.menu = null;
    this.home = null;
    this.successParticles?.dispose();
    this.ambientParticles?.dispose();
    this.successParticles = null;
    this.ambientParticles = null;
  }

  destroy(): void {
    this.cleanup();
    this.renderer.dispose();
  }
}

const game = new Game();
game.start();

(window as unknown as Record<string, unknown>).__game = game;
