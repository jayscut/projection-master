import { SaveData } from '../types';

export class Menu {
  private container: HTMLElement;
  private onLevelSelect: (levelId: number) => void = () => {};
  private save: SaveData;

  constructor(parent: HTMLElement, saveData: SaveData) {
    this.save = saveData;

    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: radial-gradient(ellipse at center, var(--bg-mid), var(--bg-deep));
      z-index: 5;
    `;

    const cols = 5;
    const cardSize = 80;
    const gap = 10;
    const isNarrow = parent.clientWidth < 480;

    const title = document.createElement('h1');
    title.textContent = '立体投影拼图';
    title.style.cssText = `
      font-family: var(--font-display);
      font-size: ${isNarrow ? '24px' : '36px'};
      color: var(--cyan);
      letter-spacing: ${isNarrow ? '4px' : '6px'};
      margin-bottom: 10px;
      text-shadow: 0 0 20px rgba(0, 229, 255, 0.5);
      animation: neonPulse 3s ease-in-out infinite;
    `;

    const subtitle = document.createElement('div');
    subtitle.textContent = '旋转正方体组合，匹配目标投影';
    subtitle.style.cssText = `
      font-family: var(--font-mono);
      font-size: ${isNarrow ? '12px' : '14px'};
      color: var(--text-dim);
      margin-bottom: ${isNarrow ? '24px' : '40px'};
    `;

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(${isNarrow ? '4' : '5'}, ${isNarrow ? '56px' : '80px'});
      gap: ${isNarrow ? '8px' : '10px'};
    `;

    for (let i = 1; i <= 20; i++) {
      grid.appendChild(this.createLevelCard(i, isNarrow));
    }

    this.container.appendChild(title);
    this.container.appendChild(subtitle);
    this.container.appendChild(grid);
    parent.appendChild(this.container);
  }

  private createLevelCard(id: number, isNarrow: boolean): HTMLElement {
    const card = document.createElement('div');
    const isUnlocked = id <= this.save.highestUnlocked;
    const isCompleted = this.save.levelStats[id]?.completed;
    const size = isNarrow ? '56px' : '80px';
    const fontSize = isNarrow ? '16px' : '20px';

    card.textContent = String(id);
    card.style.cssText = `
      width: ${size};
      height: ${size};
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-display);
      font-size: ${fontSize};
      border-radius: 8px;
      cursor: ${isUnlocked ? 'pointer' : 'not-allowed'};
      transition: transform 0.2s, box-shadow 0.2s;
      border: 2px solid ${
        isCompleted ? 'var(--pink)' :
        isUnlocked ? 'var(--cyan)' : 'var(--text-dim)'
      };
      color: ${
        isCompleted ? 'var(--pink)' :
        isUnlocked ? 'var(--cyan)' : 'var(--text-dim)'
      };
      background: ${isUnlocked ? 'rgba(0, 229, 255, 0.05)' : 'rgba(85, 85, 119, 0.05)'};
      opacity: ${isUnlocked ? 1 : 0.4};
    `;

    const stats = this.save.levelStats[id];
    if (stats?.completed) {
      card.title = `\u2605\u2605\u2605`.slice(0, stats.stars) + '\u2606\u2606\u2606'.slice(stats.stars);
    }

    if (isUnlocked) {
      card.addEventListener('click', () => this.onLevelSelect(id));
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'scale(1.1)';
        card.style.boxShadow = `0 0 20px ${isCompleted ? 'rgba(255,64,129,0.4)' : 'rgba(0,229,255,0.4)'}`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'scale(1)';
        card.style.boxShadow = 'none';
      });
    }

    return card;
  }

  setOnLevelSelect(callback: (levelId: number) => void): void {
    this.onLevelSelect = callback;
  }

  remove(): void {
    this.container.remove();
  }
}
