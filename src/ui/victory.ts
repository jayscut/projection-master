import * as THREE from 'three';
import gsap from 'gsap';
import { LEVELS } from '../levels/data';
import { Shape } from '../shapes/shape';
import { AmbientParticles } from '../effects/particles';
import { Synth } from '../audio/synth';
import { ISOMETRIC_ANGLE } from '../types';

const PHASE1_COLORS: number[] = [0x00E5FF, 0xFF4081, 0x7C4DFF];

interface ZenText {
  title: string;
  lines: string[];
}

function getZenText(totalStars: number): ZenText {
  if (totalStars >= 59) {
    return {
      title: '—— 投影大师 ——',
      lines: [
        '二十段旅程',
        '二十次觉知',
        '你已在光影交错中',
        '领悟了空间的真谛',
        '三维世界对你',
        '不再有秘密',
      ],
    };
  }
  if (totalStars >= 51) {
    return {
      title: '悟者',
      lines: [
        '二十段旅程',
        '二十场与空间的对话',
        '你在旋转与对弈中',
        '磨砺出一双通透的眼',
        '三维已成了你的母语',
      ],
    };
  }
  return {
    title: '行者',
    lines: [
      '二十段旅程',
      '你在光影的缝隙中穿行',
      '看见了每一个立方体的秘密',
      '路还很长',
      '但你已经遇见了光',
    ],
  };
}

export class VictoryScreen {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private particles: AmbientParticles;
  private shapes: Shape[] = [];
  private currentShape: Shape | null = null;
  private animId = 0;
  private skipped = false;
  private synth: Synth;
  private onComplete: () => void;
  private textOverlay: HTMLElement;
  private zen: ZenText;
  private timerIds: number[] = [];

  constructor(parent: HTMLElement, totalStars: number, synth: Synth, onComplete: () => void) {
    this.synth = synth;
    this.onComplete = onComplete;
    this.zen = getZenText(totalStars);

    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: var(--bg-deep); z-index: 50;
      overflow: hidden; cursor: pointer;
    `;

    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: block;';
    this.container.appendChild(this.canvas);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0A0A1A);

    this.scene = new THREE.Scene();

    const w = parent.clientWidth;
    const h = parent.clientHeight;
    const frustumSize = 7;
    const half = frustumSize / 2;
    const aspect = w / h;
    this.camera = new THREE.OrthographicCamera(
      -half * aspect, half * aspect, half, -half, 0.1, 100
    );
    const dist = 12;
    const el = ISOMETRIC_ANGLE.elevation;
    const az = ISOMETRIC_ANGLE.azimuth;
    this.camera.position.set(
      dist * Math.cos(el) * Math.cos(az),
      dist * Math.sin(el),
      dist * Math.cos(el) * Math.sin(az)
    );
    this.camera.lookAt(0, 0, 0);

    this.particles = new AmbientParticles(80, 8);
    this.scene.add(this.particles.points);

    for (const level of LEVELS) {
      const colorIdx = (level.id - 1) % 3;
      const shape = new Shape(level, PHASE1_COLORS[colorIdx], 0xFFFFFF);
      shape.group.visible = false;
      shape.group.scale.set(0, 0, 0);
      shape.group.position.set(0, 0, 0);
      this.scene.add(shape.group);
      this.shapes.push(shape);
    }

    this.textOverlay = document.createElement('div');
    this.textOverlay.style.cssText = `
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      pointer-events: none;
    `;
    this.container.appendChild(this.textOverlay);

    this.container.addEventListener('click', this.skip);
    document.addEventListener('keydown', this.skip);

    parent.appendChild(this.container);

    this.renderer.setSize(w, h);
    window.addEventListener('resize', this.resize);
    this.animate();

    this.startPhase1();
  }

  private resize = (): void => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    const frustumSize = 7;
    const half = frustumSize / 2;
    const aspect = w / h;
    this.camera.left = -half * aspect;
    this.camera.right = half * aspect;
    this.camera.top = half;
    this.camera.bottom = -half;
    this.camera.updateProjectionMatrix();
  };

  private animate = (): void => {
    this.animId = requestAnimationFrame(this.animate);
    this.particles.update(0.016);
    if (this.currentShape) {
      this.currentShape.group.rotation.y += 0.008;
      this.currentShape.group.rotation.x += 0.003;
    }
    this.renderer.render(this.scene, this.camera);
  };

  private addTimer(callback: () => void, delay: number): void {
    const id = window.setTimeout(() => {
      this.timerIds = this.timerIds.filter(t => t !== id);
      callback();
    }, delay);
    this.timerIds.push(id);
  }

  private clearTimers(): void {
    for (const id of this.timerIds) {
      clearTimeout(id);
    }
    this.timerIds = [];
  }

  private startPhase1(): void {
    this.showShape(0);
  }

  private showShape(index: number): void {
    if (this.skipped || index >= this.shapes.length) {
      this.startPhase2();
      return;
    }

    const prevShape = this.currentShape;
    const shape = this.shapes[index];
    this.currentShape = shape;

    const inDuration = 0.4;
    const outDuration = 0.5;

    if (prevShape) {
      gsap.to(prevShape.group.scale, {
        x: 0, y: 0, z: 0,
        duration: outDuration,
        ease: 'power2.in',
        onComplete: () => {
          prevShape.group.visible = false;
        },
      });
    }

    shape.group.visible = true;
    shape.group.rotation.set(0, 0, 0);

    gsap.fromTo(shape.group.scale,
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1, duration: inDuration, ease: 'back.out(1.5)' },
    );

    this.synth.playVictoryChime(index);

    const duration = Math.max(1.5 - index * 0.1, 0.6);
    this.addTimer(() => this.showShape(index + 1), duration * 1000);
  }

  private startPhase2(): void {
    if (this.currentShape) {
      gsap.to(this.currentShape.group.scale, {
        x: 0, y: 0, z: 0,
        duration: 0.5,
        ease: 'power2.in',
        onComplete: () => {
          if (this.currentShape) this.currentShape.group.visible = false;
          this.currentShape = null;
        },
      });
    }

    if (this.skipped) {
      this.finish();
      return;
    }

    this.addTimer(() => this.showTextLine(0), 600);
  }

  private showTextLine(index: number): void {
    if (this.skipped || index >= this.zen.lines.length) {
      this.showTitle();
      return;
    }

    const line = document.createElement('div');
    line.textContent = this.zen.lines[index];
    line.style.cssText = `
      font-family: var(--font-display);
      font-size: clamp(16px, 2.5vw, 24px);
      color: var(--cyan);
      letter-spacing: 4px;
      margin-bottom: 10px;
      text-shadow: 0 0 20px rgba(0,229,255,0.4), 0 0 40px rgba(0,229,255,0.15);
      opacity: 0;
      transform: translateY(20px);
    `;
    this.textOverlay.appendChild(line);

    gsap.to(line, {
      opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
      onComplete: () => {
        this.addTimer(() => this.showTextLine(index + 1), 1200);
      },
    });
  }

  private showTitle(): void {
    if (this.skipped) {
      this.finish();
      return;
    }

    const title = document.createElement('div');
    title.textContent = this.zen.title;
    title.style.cssText = `
      font-family: var(--font-display);
      font-size: clamp(22px, 4vw, 36px);
      color: var(--pink);
      letter-spacing: 6px;
      margin-top: 28px;
      text-shadow: 0 0 30px rgba(255,64,129,0.5), 0 0 60px rgba(255,64,129,0.2);
      opacity: 0;
      transform: translateY(20px);
      animation: neonPulse 3s ease-in-out infinite;
    `;
    this.textOverlay.appendChild(title);

    gsap.to(title, {
      opacity: 1, y: 0, duration: 1, ease: 'power2.out',
      onComplete: () => {
        this.synth.playVictoryFanfare();
        this.addTimer(() => this.showReturnButton(), 1500);
      },
    });
  }

  private showReturnButton(): void {
    if (this.skipped) {
      this.destroy();
      this.onComplete();
      return;
    }

    const btn = document.createElement('button');
    btn.textContent = '回到星空';
    btn.style.cssText = `
      font-family: var(--font-display);
      font-size: clamp(14px, 2vw, 18px);
      color: var(--cyan);
      background: transparent;
      border: 2px solid var(--cyan);
      border-radius: 8px;
      padding: 12px 48px;
      margin-top: 36px;
      cursor: pointer;
      letter-spacing: 6px;
      pointer-events: auto;
      opacity: 0;
      transition: background 0.3s, color 0.3s;
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(0,229,255,0.15)';
      btn.style.color = '#fff';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'transparent';
      btn.style.color = 'var(--cyan)';
    });
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.destroy();
      this.onComplete();
    });

    this.textOverlay.appendChild(btn);
    gsap.to(btn, { opacity: 1, duration: 0.6, ease: 'power2.out' });
  }

  private finish(): void {
    this.textOverlay.innerHTML = '';
    for (const line of this.zen.lines) {
      const el = document.createElement('div');
      el.textContent = line;
      el.style.cssText = `
        font-family: var(--font-display);
        font-size: clamp(16px, 2.5vw, 24px);
        color: var(--cyan);
        letter-spacing: 4px;
        margin-bottom: 10px;
        text-shadow: 0 0 20px rgba(0,229,255,0.4);
      `;
      this.textOverlay.appendChild(el);
    }
    const title = document.createElement('div');
    title.textContent = this.zen.title;
    title.style.cssText = `
      font-family: var(--font-display);
      font-size: clamp(22px, 4vw, 36px);
      color: var(--pink);
      letter-spacing: 6px;
      margin-top: 28px;
      text-shadow: 0 0 30px rgba(255,64,129,0.5);
    `;
    this.textOverlay.appendChild(title);
    this.showReturnButton();
  }

  private skip = (): void => {
    if (this.skipped) return;
    this.skipped = true;
    gsap.killTweensOf('*');
    this.clearTimers();
    this.finish();
  };

  destroy(): void {
    document.removeEventListener('keydown', this.skip);
    window.removeEventListener('resize', this.resize);
    this.clearTimers();
    cancelAnimationFrame(this.animId);
    this.renderer.dispose();
    this.particles.dispose();
    for (const shape of this.shapes) {
      shape.group.clear();
    }
    this.container.remove();
  }
}
