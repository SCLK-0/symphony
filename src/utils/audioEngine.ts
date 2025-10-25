export class SymphonyAudioEngine {
  private audioContext: AudioContext;
  private masterGain: GainNode;
  private oscillators: Map<string, { osc: OscillatorNode; gain: GainNode }> = new Map();
  private analyser: AnalyserNode;
  private isPlaying: boolean = false;

  constructor() {
    this.audioContext = new AudioContext();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.25;
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  getAnalyser(): AnalyserNode {
    return this.analyser;
  }

  startSymphony() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    const chordNotes = [
      { freq: 220.00, type: 'sine' as OscillatorType, gain: 0.03 },
      { freq: 277.18, type: 'sine' as OscillatorType, gain: 0.025 },
      { freq: 329.63, type: 'sine' as OscillatorType, gain: 0.03 },
      { freq: 440.00, type: 'triangle' as OscillatorType, gain: 0.02 },
      { freq: 554.37, type: 'triangle' as OscillatorType, gain: 0.015 },
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
      const frequency = 330 + (1 - leftHand.y) * 440;
      const volume = Math.max(0.01, leftHand.openness * 0.06);

      this.updateOrCreateOscillator('left', frequency, volume, 'sine');
    } else {
      this.removeOscillator('left');
    }

    if (rightHand) {
      const frequency = 440 + (1 - rightHand.y) * 550;
      const volume = Math.max(0.01, rightHand.openness * 0.06);

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
        this.audioContext.currentTime + 0.1
      );
    } else {
      existing.osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, frequency),
        this.audioContext.currentTime + 0.1
      );
      existing.gain.gain.linearRampToValueAtTime(
        volume,
        this.audioContext.currentTime + 0.1
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
