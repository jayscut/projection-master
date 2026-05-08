import gsap from 'gsap';

export class CardFlip {
  private container: HTMLElement;
  private front: HTMLElement;
  private back: HTMLElement;
  private card: HTMLElement;

  constructor(parent: HTMLElement, levelName: string) {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      perspective: 1000px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-deep);
      z-index: 20;
    `;

    this.card = document.createElement('div');
    this.card.style.cssText = `
      width: 300px;
      height: 400px;
      position: relative;
      transform-style: preserve-3d;
      transform: rotateY(0deg);
    `;

    this.front = this.createFace('正面', '🧊', levelName, false);
    this.back = this.createFace('背面', '🔮', '准备开始', true);

    this.front.style.backfaceVisibility = 'hidden';
    this.back.style.backfaceVisibility = 'hidden';

    this.card.appendChild(this.front);
    this.card.appendChild(this.back);
    this.container.appendChild(this.card);

    parent.appendChild(this.container);
  }

  private createFace(
    _label: string,
    icon: string,
    name: string,
    isBack: boolean
  ): HTMLElement {
    const face = document.createElement('div');
    face.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      background: var(--bg-mid);
      border: 2px solid var(--cyan);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
      box-shadow: 0 0 30px rgba(0, 229, 255, 0.2);
      font-family: var(--font-display);
    `;

    if (isBack) {
      face.style.transform = 'rotateY(180deg)';
    }

    const iconEl = document.createElement('div');
    iconEl.textContent = icon;
    iconEl.style.cssText = 'font-size: 80px;';

    const nameEl = document.createElement('div');
    nameEl.textContent = name;
    nameEl.style.cssText = `
      color: var(--cyan);
      font-size: 24px;
      letter-spacing: 4px;
    `;

    face.appendChild(iconEl);
    face.appendChild(nameEl);

    return face;
  }

  flip(onComplete: () => void): void {
    const tl = gsap.timeline();

    tl.to(this.card, {
      rotationY: 90,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => {
        this.front.style.display = 'none';
      },
    });

    tl.to(this.card, {
      rotationY: 180,
      duration: 0.5,
      ease: 'power2.out',
    });

    tl.to(this.container, {
      opacity: 0,
      duration: 0.5,
      delay: 0.5,
      ease: 'power2.in',
      onComplete: () => {
        this.remove();
        onComplete();
      },
    });
  }

  remove(): void {
    this.container.remove();
  }
}
