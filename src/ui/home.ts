import * as THREE from 'three';
import gsap from 'gsap';

const GHOST_COUNT = 4;
const PARTICLE_COUNT = 120;

export class Home {
  private container: HTMLElement;
  private overlay: HTMLElement;
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private mainCube: THREE.Group;
  private innerCube: THREE.Group;
  private ghosts: THREE.LineSegments[] = [];
  private ghostAngles: number[] = [];
  private particles: THREE.Points;
  private animId = 0;
  private angle = 0;
  private angle2 = 0;
  private onStart: () => void = () => {};

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(ellipse at center, #0D1528 0%, var(--bg-deep) 100%);
      z-index: 5; overflow: hidden;
    `;

    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: block;';
    this.container.appendChild(this.canvas);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, parent.clientWidth / parent.clientHeight, 0.5, 20);
    this.camera.position.set(0, 0.3, 5.5);
    this.camera.lookAt(0, 0, 0);

    this.scene.fog = new THREE.FogExp2(0x0A0A1A, 0.015);

    const cubeGeom = new THREE.BoxGeometry(1.6, 1.6, 1.6);
    const edgeGeom = new THREE.EdgesGeometry(cubeGeom);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00E5FF, transparent: true, opacity: 0.9 });

    this.mainCube = new THREE.Group();
    const mainEdge = new THREE.LineSegments(edgeGeom, lineMat);
    this.mainCube.add(mainEdge);

    const innerGeom = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    const innerEdgeGeom = new THREE.EdgesGeometry(innerGeom);
    const innerLineMat = new THREE.LineBasicMaterial({ color: 0x7C4DFF, transparent: true, opacity: 0.6 });
    this.innerCube = new THREE.Group();
    this.innerCube.add(new THREE.LineSegments(innerEdgeGeom, innerLineMat));

    const pivot = new THREE.Group();
    pivot.add(this.mainCube);
    pivot.add(this.innerCube);
    this.scene.add(pivot);

    for (let i = 0; i < GHOST_COUNT; i++) {
      const ghostOpacity = 0.12 - i * 0.025;
      const ghostMat = new THREE.LineBasicMaterial({ color: 0x00E5FF, transparent: true, opacity: ghostOpacity });
      const ghost = new THREE.LineSegments(edgeGeom, ghostMat);
      pivot.add(ghost);
      this.ghosts.push(ghost);
      this.ghostAngles.push(0);
    }

    const pGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.0 + Math.random() * 1.8;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    pGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x00E5FF, size: 0.03, transparent: true, opacity: 0.6 });
    this.particles = new THREE.Points(pGeom, pMat);
    this.scene.add(this.particles);

    this.overlay = document.createElement('div');
    this.overlay.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none;';

    const titleWrapper = document.createElement('div');
    titleWrapper.style.cssText = 'position: relative;';

    const title = document.createElement('h1');
    title.textContent = '立体投影拼图';
    title.style.cssText = `
      font-family: var(--font-display);
      font-size: clamp(28px, 6vw, 52px);
      color: var(--cyan);
      letter-spacing: 8px;
      position: relative;
      text-shadow: 0 0 30px rgba(0,229,255,0.5), 0 0 60px rgba(0,229,255,0.2);
      opacity: 0;
      animation: homeFadeIn 1.8s ease 0.3s forwards, glitchPulse 6s ease-in-out 3s infinite;
      will-change: transform, opacity;
    `;

    const titleBefore = document.createElement('div');
    titleBefore.textContent = '立体投影拼图';
    titleBefore.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      font-family: var(--font-display);
      font-size: clamp(28px, 6vw, 52px);
      color: var(--cyan);
      letter-spacing: 8px;
      opacity: 0;
      pointer-events: none;
      animation: titleGlitchBefore 6s ease-in-out 3s infinite;
      will-change: clip-path;
    `;

    const titleAfter = document.createElement('div');
    titleAfter.textContent = '立体投影拼图';
    titleAfter.style.cssText = `
      position: absolute; top: 2px; left: -2px; width: 100%; height: 100%;
      font-family: var(--font-display);
      font-size: clamp(28px, 6vw, 52px);
      color: var(--pink);
      letter-spacing: 8px;
      opacity: 0;
      pointer-events: none;
      animation: titleGlitchAfter 6s ease-in-out 3s infinite;
      will-change: clip-path;
    `;

    titleWrapper.appendChild(titleBefore);
    titleWrapper.appendChild(titleAfter);
    titleWrapper.appendChild(title);

    const subtitle = document.createElement('div');
    subtitle.textContent = '旋转正方体组合，匹配目标投影';
    subtitle.style.cssText = `
      font-family: var(--font-mono);
      font-size: clamp(11px, 1.5vw, 14px);
      color: var(--text-dim);
      letter-spacing: 3px;
      margin-top: 12px;
      opacity: 0;
      animation: homeFadeIn 1.5s ease 0.8s forwards;
    `;

    const btn = document.createElement('button');
    btn.textContent = '开始游戏';
    btn.style.cssText = `
      font-family: var(--font-display);
      font-size: clamp(14px, 2vw, 18px);
      color: var(--cyan);
      background: transparent;
      border: 2px solid var(--cyan);
      border-radius: 8px;
      padding: 12px 48px;
      margin-top: 40px;
      cursor: pointer;
      letter-spacing: 6px;
      pointer-events: auto;
      transition: background 0.3s, color 0.3s;
      opacity: 0;
      animation: homeFadeIn 1.2s ease 1.3s forwards, homePulse 2.5s ease-in-out 2.5s infinite;
      will-change: opacity, transform;
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(0,229,255,0.15)';
      btn.style.color = '#fff';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'transparent';
      btn.style.color = 'var(--cyan)';
    });
    btn.addEventListener('click', () => {
      this.startTransition(() => {
        this.onStart();
      });
    });

    this.overlay.appendChild(titleWrapper);
    this.overlay.appendChild(subtitle);
    this.overlay.appendChild(btn);

    const scanlines = document.createElement('div');
    scanlines.style.cssText = `
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      pointer-events: none; z-index: 6;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0,0,0,0.03) 2px,
        rgba(0,0,0,0.03) 4px
      );
      animation: scanline 8s linear infinite;
      opacity: 0.15;
      will-change: transform;
    `;

    this.container.appendChild(this.overlay);
    this.container.appendChild(scanlines);
    parent.appendChild(this.container);

    this.resize();
    window.addEventListener('resize', this.resize);
    this.animate();
  }

  private resize = (): void => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  private animate = (): void => {
    this.animId = requestAnimationFrame(this.animate);
    const dt = 0.016;

    this.angle += 0.35 * dt;
    this.angle2 -= 0.28 * dt;

    this.mainCube.rotation.set(0.12 * Math.sin(this.angle * 0.7), this.angle, 0);
    this.innerCube.rotation.set(0.2 * Math.cos(this.angle2 * 0.8), this.angle2, 0.15 * Math.sin(this.angle2 * 0.5));

    for (let i = 0; i < GHOST_COUNT; i++) {
      const delay = (i + 1) * 0.06;
      this.ghostAngles[i] += (this.angle - delay - this.ghostAngles[i]) * 3 * dt;
      this.ghosts[i].rotation.copy(this.mainCube.rotation.clone().set(
        0.12 * Math.sin(this.ghostAngles[i] * 0.7),
        this.ghostAngles[i],
        0
      ));
    }

    this.particles.rotation.y += 0.08 * dt;
    this.particles.rotation.x += 0.03 * dt;

    this.renderer.render(this.scene, this.camera);
  };

  setOnStart(callback: () => void): void {
    this.onStart = callback;
  }

  private startTransition(onComplete: () => void): void {
    const tl = gsap.timeline({ onComplete });

    tl.to(this.overlay.children, {
      opacity: 0, y: -20, duration: 0.4, stagger: 0.05, ease: 'power2.in',
    }, 0);

    tl.to(this.mainCube.rotation, {
      y: this.angle + 4, duration: 0.7, ease: 'power3.in',
    }, 0);
    tl.to(this.innerCube.rotation, {
      y: this.angle2 - 3, duration: 0.7, ease: 'power3.in',
    }, 0);

    for (let i = 0; i < GHOST_COUNT; i++) {
      tl.to(this.ghosts[i].material, {
        opacity: 0, duration: 0.4, ease: 'power2.in',
      }, 0);
    }

    tl.to(this.particles.material, {
      opacity: 0, duration: 0.5, ease: 'power2.in',
    }, 0);

    const mainMat = (this.mainCube.children[0] as THREE.LineSegments).material;
    const innerMat = (this.innerCube.children[0] as THREE.LineSegments).material;
    tl.to(mainMat, {
      opacity: 0, duration: 0.5, ease: 'power2.in',
    }, 0.15);
    tl.to(innerMat, {
      opacity: 0, duration: 0.5, ease: 'power2.in',
    }, 0.15);

    tl.to(this.container, {
      opacity: 0, duration: 0.5, ease: 'power2.in',
    }, 0.2);
  }

  destroy(): void {
    window.removeEventListener('resize', this.resize);
    cancelAnimationFrame(this.animId);
    this.renderer.dispose();
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments || child instanceof THREE.Points) {
        child.geometry?.dispose();
        if (child.material) {
          const mat = child.material as THREE.Material;
          mat.dispose();
        }
      }
    });
    this.container.remove();
  }
}
