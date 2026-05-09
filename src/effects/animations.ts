import gsap from 'gsap';
import * as THREE from 'three';

export function animateSuccessBurst(
  shape: THREE.Group,
  onComplete: () => void
): void {
  const cubes = shape.children;
  const positions = cubes.map(c => c.position.clone());

  cubes.forEach((cube, i) => {
    const x = (Math.random() - 0.5) * 3;
    const y = (Math.random() - 0.5) * 3;
    const z = (Math.random() - 0.5) * 3;

    gsap.to(cube.position, {
      x,
      y,
      z,
      duration: 0.5,
      delay: i * 0.03,
      ease: 'power2.out',
    });

    gsap.to(cube.position, {
      x: positions[i].x,
      y: positions[i].y,
      z: positions[i].z,
      duration: 0.6,
      delay: 0.6 + i * 0.03,
      ease: 'elastic.out(1, 0.5)',
      onComplete: i === cubes.length - 1 ? onComplete : undefined,
    });
  });
}

export function animateShapeAssemble(group: THREE.Group): void {
  const cubes = group.children;
  cubes.forEach((cube, i) => {
    const rx = (Math.random() - 0.5) * 6;
    const ry = (Math.random() - 0.5) * 6;
    const rz = (Math.random() - 0.5) * 6;

    gsap.fromTo(cube.position,
      { x: cube.position.x + rx, y: cube.position.y + ry, z: cube.position.z + rz },
      {
        x: cube.position.x,
        y: cube.position.y,
        z: cube.position.z,
        duration: 0.6,
        delay: i * 0.04,
        ease: 'power2.out',
      }
    );

    gsap.fromTo(cube.scale,
      { x: 0, y: 0, z: 0 },
      {
        x: 1, y: 1, z: 1,
        duration: 0.5,
        delay: i * 0.04,
        ease: 'back.out(1.5)',
      }
    );
  });
}
