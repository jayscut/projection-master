export class HUD {
  private container: HTMLElement;
  private matchEl: HTMLElement;
  private timeEl: HTMLElement;
  private levelNameEl: HTMLElement;
  private startTime = 0;
  private running = false;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-around;
      background: rgba(22, 33, 62, 0.9);
      border-top: 1px solid var(--cyan);
      backdrop-filter: blur(10px);
      font-family: var(--font-mono);
      font-size: 18px;
      color: var(--text-primary);
      z-index: 10;
    `;

    this.levelNameEl = document.createElement('span');
    this.levelNameEl.style.cssText = `
      color: var(--cyan);
      font-family: var(--font-display);
      font-size: 16px;
      letter-spacing: 2px;
    `;

    this.matchEl = document.createElement('span');
    this.matchEl.style.cssText = `
      font-size: 22px;
      font-weight: bold;
    `;

    this.timeEl = document.createElement('span');
    this.timeEl.style.cssText = `
      font-family: var(--font-mono);
      color: var(--text-dim);
    `;

    this.container.appendChild(this.levelNameEl);
    this.container.appendChild(this.matchEl);
    this.container.appendChild(this.timeEl);
    parent.appendChild(this.container);
  }

  setLevelName(name: string): void {
    this.levelNameEl.textContent = name;
  }

  setMatchPercent(percent: number): void {
    const pct = Math.round(percent * 100);
    this.matchEl.textContent = `匹配度: ${pct}%`;
    if (pct > 90) {
      this.matchEl.style.color = 'var(--pink)';
    } else if (pct > 50) {
      this.matchEl.style.color = 'var(--purple)';
    } else {
      this.matchEl.style.color = 'var(--cyan)';
    }
  }

  startTimer(): void {
    this.startTime = performance.now();
    this.running = true;
  }

  stopTimer(): number {
    this.running = false;
    return (performance.now() - this.startTime) / 1000;
  }

  update(): void {
    if (!this.running) return;
    const elapsed = (performance.now() - this.startTime) / 1000;
    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);
    this.timeEl.textContent = `⏱ ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  getElapsed(): number {
    return (performance.now() - this.startTime) / 1000;
  }

  remove(): void {
    this.container.remove();
  }
}
