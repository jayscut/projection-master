import * as THREE from 'three';
import { LevelData } from '../types';
import { createCubeMesh, getCubeCorners } from './cube';

export class Shape {
  public group: THREE.Group;
  private cubePositions: THREE.Vector3[] = [];

  constructor(level: LevelData, edgeColor?: number, markerColor?: number) {
    this.group = new THREE.Group();

    for (let i = 0; i < level.cubes.length; i++) {
      const [cx, cy, cz] = level.cubes[i];
      const pos = new THREE.Vector3(cx, cy, cz);

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
            (child.material as THREE.MeshBasicMaterial).color.set(markerColor ?? 0xFF4081);
            (child.material as THREE.MeshBasicMaterial).opacity = 0.35;
          }
        });
      }

      mesh.position.copy(pos);
      this.group.add(mesh);
      this.cubePositions.push(pos.clone());
    }
  }

  getCorners(): THREE.Vector3[] {
    this.group.updateMatrixWorld();
    const corners: THREE.Vector3[] = [];
    for (const pos of this.cubePositions) {
      const localCorners = getCubeCorners(pos);
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
