export class Synth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 0.5;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 0.5;
    }
    if (this.ambientGain) {
      this.ambientGain.gain.value = this.muted ? 0 : 0.08;
    }
    return this.muted;
  }

  startAmbient(): void {
    const ctx = this.ensureContext();
    if (this.ambientOsc) return;

    this.ambientOsc = ctx.createOscillator();
    this.ambientGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    this.ambientOsc.type = 'sawtooth';
    this.ambientOsc.frequency.value = 55;

    filter.type = 'lowpass';
    filter.frequency.value = 200;
    filter.Q.value = 5;

    this.ambientGain.gain.value = this.muted ? 0 : 0.08;

    this.ambientOsc.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain!);
    this.ambientOsc.start();
  }

  stopAmbient(): void {
    this.ambientOsc?.stop();
    this.ambientOsc = null;
    this.ambientGain = null;
  }

  playMatchTick(matchPercent: number): void {
    const ctx = this.ensureContext();
    if (this.muted) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 440 + matchPercent * 440;

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  playCardFlip(): void {
    const ctx = this.ensureContext();
    if (this.muted) return;

    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(2000, ctx.currentTime + 0.3);
    filter.Q.value = 1;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    source.start();
  }

  playSuccess(): void {
    const ctx = this.ensureContext();
    if (this.muted) return;

    const notes = [261.63, 329.63, 392.00, 523.25];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const startTime = ctx.currentTime + i * 0.2;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  playUIClick(): void {
    const ctx = this.ensureContext();
    if (this.muted) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.value = 880;

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }
}
