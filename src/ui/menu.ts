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

    const title = document.createElement('h1');
    title.textContent = '立体投影拼图';
    title.style.cssText = `
      font-family: var(--font-display);
      font-size: 36px;
      color: var(--cyan);
      letter-spacing: 6px;
      margin-bottom: 10px;
      text-shadow: 0 0 20px rgba(0, 229, 255, 0.5);
    `;

    const subtitle = document.createElement('div');
    subtitle.textContent = '旋转正方体组合，匹配目标投影';
    subtitle.style.cssText = `
      font-family: var(--font-mono);
      font-size: 14px;
      color: var(--text-dim);
      margin-bottom: 40px;
    `;

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(5, 80px);
      gap: 10px;
    `;

    for (let i = 1; i <= 20; i++) {
      grid.appendChild(this.createLevelCard(i));
    }

    this.container.appendChild(title);
    this.container.appendChild(subtitle);
    this.container.appendChild(grid);
    parent.appendChild(this.container);
  }

  private createLevelCard(id: number): HTMLElement {
    const card = document.createElement('div');
    const isUnlocked = id <= this.save.highestUnlocked;
    const isCompleted = this.save.levelStats[id]?.completed;

    card.textContent = String(id);
    card.style.cssText = `
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-display);
      font-size: 20px;
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
    if (stats) {
      card.title = `最佳: ${stats.bestTime.toFixed(1)}s · 旋转: ${stats.rotations}`;
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
