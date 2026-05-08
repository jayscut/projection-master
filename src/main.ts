import './style.css';
import { LEVELS } from './levels/data';

const appEl = document.getElementById('app');
if (appEl) appEl.textContent = 'Loading...';

console.log(`Loaded ${LEVELS.length} levels`);
if (LEVELS.length !== 20) throw new Error(`Expected 20 levels, got ${LEVELS.length}`);

LEVELS.forEach(l => {
  if (l.cubes.length === 0) throw new Error(`Level ${l.id} has no cubes`);
  if (l.id < 1 || l.id > 20) throw new Error(`Level ${l.id} has invalid id`);
  for (const rot of [l.targetRotation, l.startRotation]) {
    const mag = rot[0]**2 + rot[1]**2 + rot[2]**2 + rot[3]**2;
    if (Math.abs(mag - 1) > 0.01) throw new Error(`Level ${l.id} has non-unit quaternion: ${mag}`);
  }
});
console.log('Level validation passed');
