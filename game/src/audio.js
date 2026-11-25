// Dapur Rush — tiny synthesized sound effects (WebAudio, no audio files).
// Every effect is a few oscillators; nothing is fetched, nothing is stored.
// Audio starts on the first user gesture, as browsers require.

export function createAudio() {
  let context = null;
  let muted = false;
  let sizzleNodes = null;

  function ensure() {
    if (context) return context;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
    return context;
  }

  function tone(freq, seconds, type, gainValue, when = 0, slideTo = null) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    const start = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, start + seconds);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + seconds + 0.05);
  }

  return {
    unlock() {
      const ctx = ensure();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    },
    toggleMute() {
      muted = !muted;
      if (muted) this.stopSizzle();
      return muted;
    },
    get muted() {
      return muted;
    },
    click() {
      tone(660, 0.07, 'triangle', 0.12);
    },
    add() {
      tone(520, 0.08, 'triangle', 0.14);
      tone(780, 0.1, 'triangle', 0.1, 0.05);
    },
    sizzleStart() {
      if (muted || sizzleNodes) return;
      const ctx = ensure();
      if (!ctx) return;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 3200;
      const gain = ctx.createGain();
      gain.gain.value = 0.035;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();
      sizzleNodes = { source, gain };
    },
    stopSizzle() {
      if (!sizzleNodes) return;
      try {
        sizzleNodes.gain.gain.setTargetAtTime(0.0001, context.currentTime, 0.05);
        sizzleNodes.source.stop(context.currentTime + 0.2);
      } catch (error) {
        // The context may already be gone; silence is the same outcome.
      }
      sizzleNodes = null;
    },
    ding() {
      tone(880, 0.16, 'sine', 0.16);
      tone(1318, 0.28, 'sine', 0.12, 0.09);
    },
    coin() {
      tone(988, 0.09, 'square', 0.07);
      tone(1319, 0.16, 'square', 0.06, 0.07);
    },
    error() {
      tone(196, 0.22, 'sawtooth', 0.1, 0, 130);
    },
    burn() {
      tone(220, 0.3, 'sawtooth', 0.09, 0, 110);
      tone(165, 0.3, 'sawtooth', 0.07, 0.08, 90);
    },
    tick() {
      tone(1200, 0.04, 'square', 0.05);
    },
  };
}
