// ---------- Small synthesised sound kit (no audio files): footsteps, blaster, clicks ----------
const SND = (() => {
  let ac = null, noise = null, muted = false, master = null;
  try { muted = localStorage.getItem('kh-sound') === '0'; } catch (e) {}
  function ctx() {
    if (muted || ac === false) return null;
    if (!ac) {
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
        const n = Math.floor(ac.sampleRate * 0.4); noise = ac.createBuffer(1, n, ac.sampleRate);
        const d = noise.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      } catch (e) { ac = false; return null; }
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function out(a, pan) {
    if (pan && a.createStereoPanner) { const p = a.createStereoPanner(); p.pan.value = pan; p.connect(master); return p; }
    return master;
  }
  // filtered noise burst: vol, filter start/end frequency, duration, filter type, attack, pan
  function burst(vol, f0, f1, dur, type, att = 0.004, pan = 0, q = 0.9) {
    const a = ctx(); if (!a || vol < 0.003) return;
    const t = a.currentTime, src = a.createBufferSource(); src.buffer = noise;
    src.playbackRate.value = 0.9 + Math.random() * 0.2;
    const flt = a.createBiquadFilter(); flt.type = type || 'bandpass'; flt.frequency.setValueAtTime(f0, t); flt.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur); flt.Q.value = q;
    const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(flt); flt.connect(g); g.connect(out(a, pan)); src.start(t, Math.random() * 0.2); src.stop(t + dur + 0.03);
  }
  function tone(vol, f0, f1, dur, type = 'sine', pan = 0) {
    const a = ctx(); if (!a) return;
    const t = a.currentTime, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out(a, pan)); o.start(t); o.stop(t + dur + 0.02);
  }
  // one footstep on a floor type: carpet, wood, tile, stone, grass
  function step(kind, pan, loud = 1) {
    const v = (x) => x * loud * (0.85 + Math.random() * 0.3);
    // soft, low sounds (like indoor shoes); hard floors give a muted tap instead of a click
    if (kind === 'carpet') { burst(v(0.045), 600, 240, 0.08, 'lowpass', 0.014, pan); tone(v(0.022), 90, 60, 0.06, 'sine', pan); }
    else if (kind === 'wood') { burst(v(0.04), 520, 260, 0.07, 'lowpass', 0.008, pan); tone(v(0.035), 150, 95, 0.08, 'sine', pan); }
    else if (kind === 'tile') { burst(v(0.035), 900, 380, 0.06, 'lowpass', 0.006, pan); tone(v(0.025), 120, 75, 0.06, 'sine', pan); }
    else if (kind === 'stone') { burst(v(0.035), 1000, 420, 0.07, 'lowpass', 0.007, pan); tone(v(0.02), 110, 70, 0.06, 'sine', pan); }
    else { burst(v(0.03), 1800, 1100, 0.12, 'bandpass', 0.02, pan, 0.6); burst(v(0.02), 700, 400, 0.1, 'lowpass', 0.02, pan); }
  }
  return {
    ctx, burst, tone, step, get noise() { ctx(); return noise; },
    get muted() { return muted; },
    set muted(m) { muted = m; try { localStorage.setItem('kh-sound', m ? '0' : '1'); } catch (e) {} if (m && ac && ac.suspend) ac.suspend(); }
  };
})();
