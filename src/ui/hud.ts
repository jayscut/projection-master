function computeStars(pct: number): number {
  if (pct >= 0.92) return 3;
  if (pct >= 0.84) return 2;
  if (pct >= 0.76) return 1;
  return 0;
}

export class HUD {
  private container: HTMLElement;
  private matchEl: HTMLElement;
  private starsEl: HTMLElement;
  private confirmBtn: HTMLButtonElement;
  private progressBar: HTMLElement;
  private progressFill: HTMLElement;
  private onConfirm: () => void = () => {};
  private lastRawPct = -1;
  private confirmVisible = false;
  private confirmFirstShown = false;

  constructor(parent: HTMLElement) {
    const isNarrow = parent.clientWidth < 480;
    const h = isNarrow ? '52px' : '66px';

    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: ${h};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      background: rgba(22, 33, 62, 0.9);
      border-top: 1px solid var(--cyan);
      backdrop-filter: blur(10px);
      font-family: var(--font-mono);
      font-size: ${isNarrow ? '14px' : '16px'};
      color: var(--text-primary);
      z-index: 10;
    `;

    this.progressBar = document.createElement('div');
    this.progressBar.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: rgba(255,255,255,0.05);
    `;
    this.progressFill = document.createElement('div');
    this.progressFill.style.cssText = `
      height: 100%;
      width: 0%;
      background: var(--cyan);
      transition: width 0.3s ease, background 0.3s ease;
    `;
    this.progressBar.appendChild(this.progressFill);
    this.container.appendChild(this.progressBar);

    const row = document.createElement('div');
    row.style.cssText = `
      display: flex;
      align-items: center;
      gap: ${isNarrow ? '8px' : '16px'};
    `;

    this.matchEl = document.createElement('span');
    this.matchEl.style.cssText = `
      font-weight: bold;
      font-size: ${isNarrow ? '16px' : '20px'};
      transition: transform 0.1s ease;
    `;

    this.starsEl = document.createElement('span');
    this.starsEl.style.cssText = `
      font-size: ${isNarrow ? '14px' : '20px'};
      letter-spacing: 2px;
    `;

    this.confirmBtn = document.createElement('button');
    this.confirmBtn.textContent = '确认';
    this.confirmBtn.style.cssText = `
      padding: ${isNarrow ? '4px 14px' : '6px 20px'};
      font-family: var(--font-display);
      font-size: ${isNarrow ? '12px' : '14px'};
      color: var(--bg-deep);
      background: var(--pink);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      letter-spacing: 2px;
      display: none;
    `;
    this.confirmBtn.addEventListener('click', () => this.onConfirm());

    row.appendChild(this.matchEl);
    row.appendChild(this.starsEl);
    row.appendChild(this.confirmBtn);
    this.container.appendChild(row);
    parent.appendChild(this.container);
  }

  setOnConfirm(callback: () => void): void {
    this.onConfirm = callback;
  }

  setMatchPercent(percent: number): void {
    const rawPct = percent * 100;
    if (Math.abs(rawPct - this.lastRawPct) < 0.5) return;
    this.lastRawPct = rawPct;

    const displayText = rawPct.toFixed(2);

    if (this.matchEl.textContent !== `匹配度 ${displayText}%`) {
      this.matchEl.textContent = `匹配度 ${displayText}%`;
      this.matchEl.style.animation = 'none';
      void this.matchEl.offsetWidth;
      this.matchEl.style.animation = 'numberBounce 0.3s ease';
    }

    if (rawPct >= 92) {
      this.matchEl.style.color = 'var(--pink)';
      this.progressFill.style.background = 'var(--pink)';
    } else if (rawPct >= 76) {
      this.matchEl.style.color = 'var(--purple)';
      this.progressFill.style.background = 'var(--purple)';
    } else {
      this.matchEl.style.color = 'var(--cyan)';
      this.progressFill.style.background = 'var(--cyan)';
    }

    this.progressFill.style.width = Math.min(rawPct, 100) + '%';

    const stars = computeStars(percent);
    let starsText = '';
    for (let i = 0; i < 3; i++) {
      starsText += i < stars ? '\u2605' : '\u2606';
    }
    this.starsEl.textContent = starsText;

    const shouldShow = stars > 0;
    if (shouldShow && !this.confirmVisible) {
      this.confirmVisible = true;
      this.confirmBtn.style.display = 'inline-block';
      if (!this.confirmFirstShown) {
        this.confirmFirstShown = true;
        this.confirmBtn.style.animation = 'none';
        void this.confirmBtn.offsetWidth;
        this.confirmBtn.style.animation = 'starPop 0.5s ease';
      }
      this.confirmBtn.style.animation += ', confirmPulse 2s ease-in-out infinite';
    } else if (!shouldShow && this.confirmVisible) {
      this.confirmVisible = false;
      this.confirmBtn.style.display = 'none';
      this.confirmBtn.style.animation = '';
    }
  }

  remove(): void {
    this.container.remove();
  }
}
