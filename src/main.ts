import './style.css';
import { LEVELS } from './levels/data';

const appEl = document.getElementById('app');
if (appEl) appEl.textContent = 'Loading...';

console.log(`Loaded ${LEVELS.length} levels (partial)`);
if (LEVELS.length !== 10) throw new Error(`Expected 10 levels, got ${LEVELS.length}`);

LEVELS.forEach(l => {
  if (l.cubes.length === 0) throw new Error(`Level ${l.id} has no cubes`);
  if (l.id < 1 || l.id > 20) throw new Error(`Level ${l.id} has invalid id`);
});
console.log('Level validation passed');
