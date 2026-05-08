import * as THREE from 'three';

export class ParticleSystem {
  public points: THREE.Points;
  protected velocities: Float32Array;
  protected life: Float32Array;
  protected maxLife: Float32Array;
  protected count: number;
  protected geometry: THREE.BufferGeometry;

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

        this.velocities[i * 3 + 1] -= dt * 0.5;
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
      this.life[i] = this.maxLife[i];
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.points.visible = true;
  }

  update(dt: number, mouseX?: number, mouseY?: number): void {
    const posArr = this.geometry.attributes.position.array as Float32Array;
    const mx = mouseX ? (mouseX / window.innerWidth - 0.5) * 0.2 : 0;
    const my = mouseY ? (mouseY / window.innerHeight - 0.5) * 0.2 : 0;

    for (let i = 0; i < this.count; i++) {
      posArr[i * 3 + 1] += 0.001 + my * 0.01;
      posArr[i * 3] += mx * 0.01;

      if (posArr[i * 3 + 1] > this.bounds) posArr[i * 3 + 1] = -this.bounds;
      if (posArr[i * 3 + 1] < -this.bounds) posArr[i * 3 + 1] = this.bounds;
    }
    this.geometry.attributes.position.needsUpdate = true;
  }
}
