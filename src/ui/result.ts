import { formatTime } from './hud';

export interface ResultData {
  stars: number;
  levelName: string;
  levelId: number;
  matchPercent: number;
  time: number;
}

export class ResultPanel {
  private container: HTMLElement;
  private onNext: () => void = () => {};
  private onBack: () => void = () => {};

  constructor(parent: HTMLElement, data: ResultData) {
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
      z-index: 30;
      animation: fadeIn 0.5s ease;
    `;

    const levelLabel = document.createElement('div');
    levelLabel.textContent = `第 ${String(data.levelId).padStart(2, '0')} 关 · ${data.levelName}`;
    levelLabel.style.cssText = `
      font-family: var(--font-display);
      font-size: 20px;
      color: var(--cyan);
      letter-spacing: 3px;
      margin-bottom: 16px;
      animation: slideUp 0.5s ease both;
    `;

    const starsDiv = document.createElement('div');
    starsDiv.style.cssText = `
      font-size: 48px;
      letter-spacing: 8px;
      margin-bottom: 8px;
    `;
    for (let i = 0; i < 3; i++) {
      const span = document.createElement('span');
      span.textContent = i < data.stars ? '\u2605' : '\u2606';
      span.style.cssText = `
        display: inline-block;
        color: ${i < data.stars ? '#FFD700' : 'var(--text-dim)'};
        animation: starPop 0.5s ease both;
        animation-delay: ${0.3 + i * 0.2}s;
      `;
      starsDiv.appendChild(span);
    }

    const scoreLabel = document.createElement('div');
    scoreLabel.style.cssText = `
      font-family: var(--font-mono);
      font-size: 14px;
      color: var(--text-dim);
      margin-bottom: 8px;
      animation: slideUp 0.4s ease both;
      animation-delay: 0.7s;
    `;
    scoreLabel.innerHTML =
      `匹配度 <span style="color:var(--cyan)">${Math.round(data.matchPercent * 100)}%</span>` +
      `&nbsp;&nbsp;|&nbsp;&nbsp;` +
      `用时 <span style="color:var(--pink)">${formatTime(data.time)}</span>`;

    const btnRow = document.createElement('div');
    btnRow.style.cssText = `
      display: flex;
      gap: 16px;
      margin-top: 20px;
      animation: slideUp 0.4s ease both;
      animation-delay: 0.9s;
    `;

    const backBtn = document.createElement('button');
    backBtn.textContent = '返回选关';
    backBtn.style.cssText = `
      padding: 10px 24px;
      font-family: var(--font-display);
      font-size: 14px;
      color: var(--text-dim);
      background: transparent;
      border: 1px solid var(--text-dim);
      border-radius: 6px;
      cursor: pointer;
      letter-spacing: 3px;
      transition: border-color 0.2s, color 0.2s;
    `;
    backBtn.addEventListener('mouseenter', () => {
      backBtn.style.borderColor = 'var(--cyan)';
      backBtn.style.color = 'var(--cyan)';
    });
    backBtn.addEventListener('mouseleave', () => {
      backBtn.style.borderColor = 'var(--text-dim)';
      backBtn.style.color = 'var(--text-dim)';
    });
    backBtn.addEventListener('click', () => {
      this.remove();
      this.onBack();
    });

    const nextBtn = document.createElement('button');
    nextBtn.textContent = data.levelId >= 20 ? '通关完成' : '下一关';
    nextBtn.style.cssText = `
      padding: 10px 36px;
      font-family: var(--font-display);
      font-size: 16px;
      color: var(--bg-deep);
      background: var(--cyan);
      border: none;
      border-radius: 6px;
      cursor: pointer;
      letter-spacing: 4px;
      transition: box-shadow 0.2s;
    `;
    nextBtn.addEventListener('mouseenter', () => {
      nextBtn.style.boxShadow = '0 0 20px rgba(0, 229, 255, 0.5)';
    });
    nextBtn.addEventListener('mouseleave', () => {
      nextBtn.style.boxShadow = 'none';
    });
    nextBtn.addEventListener('click', () => {
      this.remove();
      this.onNext();
    });

    btnRow.appendChild(backBtn);
    if (data.levelId < 20) {
      btnRow.appendChild(nextBtn);
    }

    this.container.appendChild(levelLabel);
    this.container.appendChild(starsDiv);
    this.container.appendChild(scoreLabel);
    this.container.appendChild(btnRow);
    parent.appendChild(this.container);
  }

  setOnNext(callback: () => void): void {
    this.onNext = callback;
  }

  setOnBack(callback: () => void): void {
    this.onBack = callback;
  }

  remove(): void {
    this.container.remove();
  }
}
