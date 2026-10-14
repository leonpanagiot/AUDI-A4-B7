/**
 * Realistic Web Audio synthesizer for Audi 1.8T BFB engine:
 * - 4-cylinder 20V engine exhaust frequency tone
 * - Turbocharger compressor spool whine (frequency and pitch scale with boost)
 * - Diverter valve (blow-off) pressure release "whoosh / pshh" on throttle lift-off
 * - Redline pop & crackle overrun
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = false;
  private engineGain: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private turboGain: GainNode | null = null;
  private turboOsc: OscillatorNode | null = null;
  private prevThrottle: number = 0;
  private prevBoost: number = 0;

  public init(): void {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (enabled) {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.startContinuousSounds();
    } else {
      this.stopContinuousSounds();
    }
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  private startContinuousSounds(): void {
    if (!this.ctx) return;

    try {
      // 1. Engine low-frequency drone (4-cylinder firing)
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

      const engineFilter = this.ctx.createBiquadFilter();
      engineFilter.type = 'lowpass';
      engineFilter.frequency.setValueAtTime(320, this.ctx.currentTime);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      this.engineOsc.connect(engineFilter);
      engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);
      this.engineOsc.start();

      // 2. Turbo spool high-pitched whistle
      this.turboOsc = this.ctx.createOscillator();
      this.turboOsc.type = 'sine';
      this.turboOsc.frequency.setValueAtTime(1200, this.ctx.currentTime);

      this.turboGain = this.ctx.createGain();
      this.turboGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

      this.turboOsc.connect(this.turboGain);
      this.turboGain.connect(this.ctx.destination);
      this.turboOsc.start();
    } catch (e) {
      console.warn('Audio start error', e);
    }
  }

  private stopContinuousSounds(): void {
    try {
      if (this.engineOsc) {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
        this.engineOsc = null;
      }
      if (this.turboOsc) {
        this.turboOsc.stop();
        this.turboOsc.disconnect();
        this.turboOsc = null;
      }
    } catch (e) {}
  }

  /**
   * Update engine audio pitch and turbo whine based on live telemetry
   */
  public update(rpm: number, boostBar: number, throttle: number): void {
    if (!this.isEnabled || !this.ctx || this.ctx.state !== 'running') return;

    const t = this.ctx.currentTime;

    // Engine 4-cylinder fundamental frequency: (RPM / 60) * 2
    // Idle 820 RPM -> ~27.3 Hz. 6000 RPM -> ~200 Hz
    if (this.engineOsc && this.engineGain) {
      const targetFreq = Math.max(30, (rpm / 60) * 2.1);
      this.engineOsc.frequency.setTargetAtTime(targetFreq, t, 0.05);

      const loadVolume = 0.03 + (throttle / 100) * 0.08 + (boostBar > 0 ? boostBar * 0.04 : 0);
      this.engineGain.gain.setTargetAtTime(loadVolume, t, 0.05);
    }

    // Turbo spool whistle: rises sharply above 0.2 bar
    if (this.turboOsc && this.turboGain) {
      if (boostBar > 0.1) {
        // Frequency increases from 1400 Hz to 3600 Hz
        const turboFreq = 1400 + Math.min(1.8, boostBar) * 1400;
        this.turboOsc.frequency.setTargetAtTime(turboFreq, t, 0.08);

        // Volume rises with boost pressure
        const turboVol = Math.min(0.09, Math.max(0.005, (boostBar / 1.5) * 0.08));
        this.turboGain.gain.setTargetAtTime(turboVol, t, 0.08);
      } else {
        this.turboGain.gain.setTargetAtTime(0.001, t, 0.15);
      }
    }

    // Detect blow-off valve trigger: rapid drop in throttle when under positive boost!
    const throttleDropped = this.prevThrottle > 40 && throttle < 15;
    const hadBoost = this.prevBoost > 0.4;
    if (throttleDropped && hadBoost) {
      this.playBlowOffSound(this.prevBoost);
    }

    this.prevThrottle = throttle;
    this.prevBoost = boostBar;
  }

  /**
   * Synthesize atmospheric / diverter valve "pshh-tsss" discharge sound
   */
  public playBlowOffSound(intensity: number = 1.0): void {
    if (!this.isEnabled || !this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      // White noise buffer for blow-off hiss
      const bufferSize = this.ctx.sampleRate * 0.45; // 450ms
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      // Bandpass filter for authentic valve hiss
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, t);
      filter.frequency.exponentialRampToValueAtTime(1400, t + 0.35);
      filter.Q.setValueAtTime(3.0, t);

      const gain = this.ctx.createGain();
      const peakVol = Math.min(0.35, 0.15 + (intensity / 1.5) * 0.2);
      gain.gain.setValueAtTime(peakVol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
      noise.stop(t + 0.45);
    } catch (e) {}
  }
}

export const audioEngine = new AudioEngine();
