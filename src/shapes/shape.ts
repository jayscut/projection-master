import * as THREE from 'three';
import { LevelData, MarkerDef } from '../types';
import { createCubeMesh, getCubeCorners, getFaceCenter } from './cube';

export class Shape {
  public group: THREE.Group;
  private cubePositions: THREE.Vector3[] = [];
  private markers: readonly MarkerDef[] = [];

  constructor(level: LevelData, edgeColor?: number, markerColor?: number) {
    this.group = new THREE.Group();
    this.markers = level.markers;

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

  getMarkerPoints(): THREE.Vector3[] {
    this.group.updateMatrixWorld();
    const points: THREE.Vector3[] = [];
    for (const marker of this.markers) {
      if (marker.type === 'face') {
        const faceCenter = getFaceCenter(this.cubePositions[marker.cubeIndex], marker.face);
        faceCenter.applyMatrix4(this.group.matrixWorld);
        points.push(faceCenter);
      }
    }
    return points;
  }

  setRotation(x: number, y: number, z: number, w: number): void {
    this.group.quaternion.set(x, y, z, w);
  }

  resetRotation(x: number, y: number, z: number, w: number): void {
    this.group.quaternion.set(x, y, z, w);
  }
}
