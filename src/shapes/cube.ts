import * as THREE from 'three';

const CUBE_SIZE = 1;
const GAP = 0.1;
export const TOTAL = CUBE_SIZE + GAP;

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

  const geo = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
  const edgesGeo = new THREE.EdgesGeometry(geo);
  const edgesMat = new THREE.LineBasicMaterial({ color: edgeColor, linewidth: 1 });
  const edges = new THREE.LineSegments(edgesGeo, edgesMat);
  group.add(edges);

  const faceMat = new THREE.MeshBasicMaterial({
    color: faceColor,
    transparent: true,
    opacity: faceOpacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const h = CUBE_SIZE / 2;
  const faceDefs: { pos: THREE.Vector3 }[] = [
    { pos: new THREE.Vector3(0, 0, h) },
    { pos: new THREE.Vector3(0, 0, -h) },
    { pos: new THREE.Vector3(0, h, 0) },
    { pos: new THREE.Vector3(0, -h, 0) },
    { pos: new THREE.Vector3(h, 0, 0) },
    { pos: new THREE.Vector3(-h, 0, 0) },
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
