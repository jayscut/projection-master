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
