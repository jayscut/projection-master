import * as THREE from 'three';

function extractCentroid(points: THREE.Vector3[]): THREE.Vector3 {
  const center = new THREE.Vector3();
  for (const p of points) {
    center.add(p);
  }
  center.divideScalar(points.length);
  return center;
}

function normalizePoints(points: THREE.Vector3[], centroid: THREE.Vector3, scale: number): THREE.Vector3[] {
  const result: THREE.Vector3[] = [];
  for (const p of points) {
    result.push(p.clone().sub(centroid).multiplyScalar(1 / scale));
  }
  return result;
}

function computeScale(points: THREE.Vector3[], centroid: THREE.Vector3): number {
  let maxDist = 0;
  for (const p of points) {
    const d = p.distanceTo(centroid);
    if (d > maxDist) maxDist = d;
  }
  return maxDist;
}

export function computeMatchScore(
  targetCorners: THREE.Vector3[],
  playerCorners: THREE.Vector3[],
  tolerance: number
): number {
  if (targetCorners.length === 0 || playerCorners.length === 0) {
    return 0;
  }

  const targetCentroid = extractCentroid(targetCorners);
  const playerCentroid = extractCentroid(playerCorners);

  const targetScale = computeScale(targetCorners, targetCentroid);
  const playerScale = computeScale(playerCorners, playerCentroid);
  const refScale = Math.max(targetScale, playerScale, 1e-6);

  const normTarget = normalizePoints(targetCorners, targetCentroid, refScale);
  const normPlayer = normalizePoints(playerCorners, playerCentroid, refScale);

  let sumSqDist = 0;

  for (const playerPt of normPlayer) {
    let minDistSq = Infinity;

    for (let i = 0; i < normTarget.length; i++) {
      const dSq = playerPt.distanceToSquared(normTarget[i]);
      if (dSq < minDistSq) {
        minDistSq = dSq;
      }
    }

    sumSqDist += minDistSq;
  }

  const rmse = Math.sqrt(sumSqDist / playerCorners.length);
  const score = Math.max(0, 1 - rmse / tolerance);
  return score;
}

export function consoleTestMatcher(): void {
  const target = [new THREE.Vector3(0, 0, 0)];
  const player = [new THREE.Vector3(0, 0, 0)];
  const score = computeMatchScore(target, player, 0.1);
  console.log('Perfect match score:', score);
  if (score < 0.99) throw new Error('Perfect match should be ~1.0');

  const rotated = [new THREE.Vector3(1, 0, 0)];
  const bad = [new THREE.Vector3(0, 0, 0)];
  const badScore = computeMatchScore(rotated, bad, 0.1);
  console.log('Bad match score:', badScore);
  if (badScore > 0.01) throw new Error('Bad match should be near 0');

  console.log('Matcher self-test passed');
}
