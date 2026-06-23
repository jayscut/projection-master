import * as THREE from 'three';
import { LevelData } from '../types';
import { Shape } from '../shapes/shape';
import { setIsometricAngle } from '../engine/camera';

const THUMB_SIZE = 160;
const FIT_MARGIN = 1.3;

let cache: Record<number, string> | null = null;

export function getThumbnails(levels: LevelData[]): Record<number, string> {
  if (cache) return cache;

  const result: Record<number, string> = {};

  const canvas = document.createElement('canvas');
  canvas.width = THUMB_SIZE;
  canvas.height = THUMB_SIZE;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(1);
  renderer.setSize(THUMB_SIZE, THUMB_SIZE, false);
  renderer.setClearColor(0x000000, 0);

  const disposeGroup = (group: THREE.Group): void => {
    const seen = new Set<THREE.Material>();
    group.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
        child.geometry?.dispose();
        const mat = child.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) {
          mat.forEach((m) => seen.add(m));
        } else {
          seen.add(mat);
        }
      }
    });
    seen.forEach((m) => m.dispose());
  };

  for (const level of levels) {
    const scene = new THREE.Scene();
    const shape = new Shape(level, 0xFF4081, 0xFFFFFF);
    shape.setRotation(
      level.targetRotation[0],
      level.targetRotation[1],
      level.targetRotation[2],
      level.targetRotation[3]
    );
    scene.add(shape.group);

    const box = new THREE.Box3().setFromObject(shape.group);
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    shape.group.position.sub(sphere.center);

    const radius = Math.max(sphere.radius, 1);
    const frustumSize = radius * 2 * FIT_MARGIN;

    const camera = new THREE.OrthographicCamera(
      -frustumSize / 2, frustumSize / 2,
      frustumSize / 2, -frustumSize / 2,
      0.1, 100,
    );
    setIsometricAngle(camera);

    renderer.render(scene, camera);
    result[level.id] = canvas.toDataURL('image/png');

    disposeGroup(shape.group);
  }

  renderer.dispose();

  cache = result;
  return result;
}
