export class SymphonyAudioEngine {
  private audioContext: AudioContext;
  private masterGain: GainNode;
  private oscillators: Map<string, { osc: OscillatorNode; gain: GainNode }> = new Map();
  private analyser: AnalyserNode;
  private isPlaying: boolean = false;

  constructor() {
    this.audioContext = new AudioContext();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.15; // Reduced volume to prevent static
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8; // Smoother analysis

    // Add a low-pass filter to reduce harsh frequencies
    const lowPassFilter = this.audioContext.createBiquadFilter();
    lowPassFilter.type = 'lowpass';
    lowPassFilter.frequency.value = 2000; // Cut frequencies above 2kHz
    lowPassFilter.Q.value = 1;

    this.masterGain.connect(lowPassFilter);
    lowPassFilter.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  getAnalyser(): AnalyserNode {
    return this.analyser;
  }

  startSymphony() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    const chordNotes = [
      { freq: 220.00, type: 'sine' as OscillatorType, gain: 0.015 },
      { freq: 277.18, type: 'sine' as OscillatorType, gain: 0.012 },
      { freq: 329.63, type: 'sine' as OscillatorType, gain: 0.015 },
      { freq: 440.00, type: 'sine' as OscillatorType, gain: 0.01 },
      { freq: 554.37, type: 'sine' as OscillatorType, gain: 0.008 },
    ];

    chordNotes.forEach((note, index) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = note.type;
      osc.frequency.value = note.freq;
      gain.gain.value = note.gain;

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();

      this.oscillators.set(`base-${index}`, { osc, gain });
    });
  }

  updateFromHands(leftHand: { x: number; y: number; openness: number } | null, rightHand: { x: number; y: number; openness: number } | null) {
    if (!this.isPlaying) this.startSymphony();

    if (leftHand) {
      // Smoother frequency mapping with better range
      const frequency = 200 + (1 - leftHand.y) * 600; // 200Hz to 800Hz
      const volume = Math.max(0.005, Math.min(0.08, leftHand.openness * 0.08));

      this.updateOrCreateOscillator('left', frequency, volume, 'sine');
    } else {
      this.removeOscillator('left');
    }

    if (rightHand) {
      // Smoother frequency mapping with better range  
      const frequency = 300 + (1 - rightHand.y) * 800; // 300Hz to 1100Hz
      const volume = Math.max(0.005, Math.min(0.08, rightHand.openness * 0.08));

      this.updateOrCreateOscillator('right', frequency, volume, 'triangle');
    } else {
      this.removeOscillator('right');
    }
  }

  private updateOrCreateOscillator(id: string, frequency: number, volume: number, type: OscillatorType) {
    let existing = this.oscillators.get(id);

    if (!existing) {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.value = 0;

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();

      this.oscillators.set(id, { osc, gain });

      gain.gain.linearRampToValueAtTime(
        volume,
        this.audioContext.currentTime + 0.05
      );
    } else {
      // Smoother frequency transitions
      existing.osc.frequency.linearRampToValueAtTime(
        Math.max(50, frequency),
        this.audioContext.currentTime + 0.05
      );
      existing.gain.gain.linearRampToValueAtTime(
        volume,
        this.audioContext.currentTime + 0.05
      );
    }
  }

  private removeOscillator(id: string) {
    const existing = this.oscillators.get(id);
    if (existing) {
      existing.gain.gain.linearRampToValueAtTime(
        0,
        this.audioContext.currentTime + 0.2
      );
      setTimeout(() => {
        if (this.oscillators.get(id) === existing) {
          existing.osc.stop();
          this.oscillators.delete(id);
        }
      }, 250);
    }
  }

  stop() {
    this.oscillators.forEach(({ osc, gain }) => {
      gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
      osc.stop(this.audioContext.currentTime + 0.1);
    });
    this.oscillators.clear();
    this.isPlaying = false;
  }
}
