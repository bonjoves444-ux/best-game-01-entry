// Mothlight — all sound is a small WebAudio synth. No audio files,
// no network, nothing that can fail the load: every call is guarded
// and the context only starts after the player's first input, so a
// headless screenshot run stays silent and never throws.

export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;

  function ensure() {
    try {
      if (ctx) {
        if (ctx.state === 'suspended') void ctx.resume();
        return ctx;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.22;
      master.connect(ctx.destination);
      return ctx;
    } catch {
      return null;
    }
  }

  // A short oscillator blip with an exponential fade. The whole game
  // is built from these: pitch, shape and length are the instrument.
  function blip(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const ac = ensure();
    if (!ac || !master) return;
    try {
      const now = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + dur + 0.02);
    } catch {
      // Sound is garnish: a failed blip never stops the game.
    }
  }

  function chord(notes, dur, type, vol) {
    notes.forEach((freq, i) => {
      setTimeout(() => blip(freq, dur, type, vol), i * 55);
    });
  }

  return {
    get muted() {
      return muted;
    },
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    // The collect chime climbs with the combo, so a hot streak sings.
    collect(combo) {
      const base = 523 * Math.pow(1.059, Math.min(combo, 12));
      blip(base, 0.22, 'sine', 0.5, base * 1.5);
      blip(base * 2, 0.12, 'triangle', 0.18);
    },
    dash() {
      blip(220, 0.16, 'sawtooth', 0.16, 660);
    },
    hit() {
      blip(140, 0.3, 'sawtooth', 0.5, 55);
      blip(70, 0.35, 'square', 0.22, 40);
    },
    burst() {
      chord([523, 659, 784, 1046], 0.4, 'sine', 0.32);
    },
    blessing() {
      chord([392, 523, 659, 784], 0.35, 'triangle', 0.3);
    },
    boss() {
      blip(98, 0.9, 'sawtooth', 0.3, 65);
      blip(147, 0.9, 'sawtooth', 0.2, 98);
    },
    gameOver() {
      chord([392, 330, 262, 196], 0.5, 'triangle', 0.3);
    },
    waveClear() {
      chord([523, 784, 1046], 0.3, 'sine', 0.28);
    },
  };
}
