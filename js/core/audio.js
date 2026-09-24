export class AudioManager {
  constructor() {
    this.music = 0.25;
    this.sound = 0.5;
    this.scene = "island";
    this.time = 0;
    this.crossfade = 1;
  }
  start() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.connect(this.master);
    }
    this.ctx.resume();
  }
  tone(
    freq = 523,
    duration = 0.12,
    type = "sine",
    volume = 0.1,
    isMusic = false,
  ) {
    if (!this.ctx || this.ctx.state !== "running") return;
    const o = this.ctx.createOscillator(),
      g = this.ctx.createGain(),
      t = this.ctx.currentTime;
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(volume, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    o.connect(g);
    g.connect(isMusic ? this.musicGain : this.master);
    o.start(t);
    o.stop(t + duration + 0.05);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  effect(kind = "click") {
    this.tone(
      {
        click: 523,
        correct: 784,
        miss: 220,
        reward: 1047,
        back: 392,
        typing: 660,
      }[kind] || 523,
      0.16,
      "sine",
      this.sound * 0.12,
    );
  }
  stopSpeech() {
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  }
  speak(text, lang = "en-US", options = {}) {
    if (
      !text ||
      typeof speechSynthesis === "undefined" ||
      typeof SpeechSynthesisUtterance === "undefined"
    )
      return false;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(String(text));
    utterance.lang = lang;
    utterance.rate = Math.max(0.55, Math.min(1.35, Number(options.rate ?? 0.78)));
    utterance.pitch = Math.max(0.55, Math.min(1.6, Number(options.pitch ?? 1)));
    utterance.volume = Math.max(0, Math.min(1, this.sound));
    const voices = (speechSynthesis.getVoices?.() || []).filter((v) =>
      v.lang?.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()),
    );
    const voiceIndex = Number(options.voiceIndex ?? 0);
    if (voices.length)
      utterance.voice =
        voices[((Number.isInteger(voiceIndex) ? voiceIndex : 0) % voices.length + voices.length) % voices.length];
    speechSynthesis.speak(utterance);
    return true;
  }
  setScene(name) {
    if (this.scene === name) return;
    this.scene = name;
    this.time = 0.15;
    if (this.ctx) {
      const old = this.musicGain;
      old.gain.cancelScheduledValues(this.ctx.currentTime);
      old.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.25);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.musicGain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + 1);
      this.musicGain.connect(this.master);
      setTimeout(() => old.disconnect(), 1600);
    }
  }
  update(dt) {
    if (!this.ctx) return;
    this.time -= dt;
    if (this.time <= 0) {
      this.time =
        this.scene === "arena" ? 0.28 : this.scene === "typing" ? 0.36 : 0.55;
      const scales = {
        excavation: [220, 261, 329, 392, 329, 261],
        typing: [392, 523, 659, 784, 659, 523],
        school: [329, 392, 523, 659, 523, 392],
        room: [261, 329, 392, 329, 293, 261],
        mansion: [261, 329, 392, 329, 293, 261],
        shop: [392, 440, 523, 659, 587, 523],
        fishing: [261, 392, 523, 392, 329, 293],
        arena: [220, 329, 440, 523, 440, 329],
      };
      const tones = scales[this.scene] || [
        261, 329, 392, 523, 392, 329, 293, 392,
      ];
      this.note = (this.note || 0) + 1;
      this.tone(
        tones[this.note % tones.length],
        0.7,
        "sine",
        this.music * 0.07,
        true,
      );
    }
  }
}
