/*
 * „Lichterflug“ – the Glimm theme. Original composition written for this game (no samples, no third-party
 * material), played live with Web Audio. 32 bars in F major: A (theme) · B (chorus) · A · C (bridge), then it loops.
 * GlimmSong.step(...) schedules one 16th-note step; the game and the preview renderer both use it.
 */
(function () {
  'use strict';
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const note = s => { const m = /^([A-G])(b|#)?(\d)$/.exec(s); return 12 * (+m[3] + 1) + PC[m[1]] + (m[2] === 'b' ? -1 : m[2] === '#' ? 1 : 0); };
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);

  // melody on an 8th-note grid ('.' holds the previous note)
  const MEL = {
    A: ['C5 . A4 C5 F5 . E5 .', 'D5 . . F5 E5 D5 C5 .', 'D5 . Bb4 D5 F5 . G5 .', 'E5 . . . C5 . . .',
        'C5 . A4 C5 F5 . A5 .', 'G5 F5 E5 D5 . . F5 .', 'D5 C5 Bb4 A4 . Bb4 . C5', 'C5 . . . . . . .'],
    B: ['F5 . . D5 F5 . G5 .', 'G5 . . E5 C5 . . .', 'E5 . . C5 E5 . A5 .', 'F5 . . . D5 . . .',
        'D5 . F5 . Bb5 . A5 .', 'G5 . E5 . G5 . C6 .', 'A5 . . G5 F5 . C5 .', 'F5 . . . . . . .'],
    C: ['Bb4 . . . D5 . . .', 'C5 . . . E5 . G5 .', 'A5 . . . F5 . . .', 'D5 . . . . . . .',
        'G4 . Bb4 . D5 . G5 .', 'F5 . D5 . Bb4 . D5 .', 'E5 . G5 . C6 . . .', '. . . . . . . .'],
  };
  // little glockenspiel answers in the chorus and bridge
  const BELL = {
    B: ['. . . . . . . .', '. . . . . . E6 G6', '. . . . . . . .', '. . . . . . A6 F6', '. . . . . . . .', '. . . . . . . .', '. . . . . . . .', '. . C6 . A5 . F5 .'],
    C: ['. . . . . . Bb5 .', '. . . . . . . .', '. . . . . . C6 .', '. . F5 . A5 . D6 .', '. . . . . . . .', '. . . . . . . .', '. . . . . . . .', 'C6 . A5 . G5 . E5 .'],
  };
  const CH = {
    A: ['F', 'Dm', 'Bb', 'C', 'F', 'Dm', 'Bb', 'C'],
    B: ['Bb', 'C', 'Am', 'Dm', 'Bb', 'C', 'F', 'F'],
    C: ['Gm', 'C', 'F', 'Dm', 'Gm', 'Bb', 'C', 'C'],
  };
  const CHORD = { F: [60, 65, 69], Dm: [62, 65, 69], Bb: [62, 65, 70], C: [60, 64, 67], Am: [60, 64, 69], Gm: [62, 67, 70] };
  const BASS = { F: 41, Dm: 38, Bb: 46, C: 48, Am: 45, Gm: 43 };
  const FORM = ['A', 'B', 'A', 'C'];
  const parse = rows => rows.map(r => {
    const tk = r.trim().split(/\s+/), out = [];
    tk.forEach((x, i) => { if (x === '.') return; let hold = 1; while (tk[i + hold] === '.') hold++; out[i] = { n: note(x), hold }; });
    return out;
  });
  const P = { mel: {}, bell: {} };
  for (const k of Object.keys(MEL)) P.mel[k] = MEL[k].map(r => parse([r])[0]);
  for (const k of Object.keys(BELL)) P.bell[k] = BELL[k].map(r => parse([r])[0]);

  let noiseBuf = null;
  function noiseOf(c) {
    if (noiseBuf && noiseBuf.sampleRate === c.sampleRate) return noiseBuf;
    noiseBuf = c.createBuffer(1, c.sampleRate * .5 | 0, c.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }
  function env(c, at, vol, attack, dur) {
    const g = c.createGain(); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(vol, at + attack); g.gain.exponentialRampToValueAtTime(.0001, at + dur); return g;
  }
  function osc(c, type, f, at, dur, dest, detune = 0) { const o = c.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune; o.connect(dest); o.start(at); o.stop(at + dur + .05); }
  const send = (c, g, wet, amt) => { if (!wet || !amt) return; const s = c.createGain(); s.gain.value = amt; g.connect(s); s.connect(wet); };

  // soft marimba / kalimba voice
  function mallet(c, out, wet, f, at, dur, vol) {
    const g = env(c, at, vol, .004, dur); g.connect(out); send(c, g, wet, .35);
    osc(c, 'sine', f, at, dur, g);
    const h = env(c, at, vol * .35, .002, Math.min(dur, .18)); h.connect(out); osc(c, 'sine', f * 4, at, .2, h);
    const t2 = env(c, at, vol * .12, .004, dur * .7); t2.connect(out); osc(c, 'triangle', f * 2, at, dur, t2);
  }
  function bell(c, out, wet, f, at, vol) {
    const g = env(c, at, vol, .003, 1.4); g.connect(out); send(c, g, wet, .8);
    osc(c, 'sine', f, at, 1.4, g); const h = env(c, at, vol * .25, .003, .5); h.connect(out); osc(c, 'sine', f * 2.76, at, .5, h);
  }
  function pluck(c, out, wet, f, at, dur, vol) {
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(2400, at); lp.frequency.exponentialRampToValueAtTime(600, at + dur);
    const g = env(c, at, vol, .005, dur); lp.connect(g); g.connect(out); send(c, g, wet, .3);
    osc(c, 'triangle', f, at, dur, lp, -4); osc(c, 'sawtooth', f, at, dur, lp, 5);
  }
  function bass(c, out, f, at, dur, vol) {
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
    const g = env(c, at, vol, .01, dur); lp.connect(g); g.connect(out);
    osc(c, 'triangle', f, at, dur, lp); const sub = env(c, at, vol * .5, .01, dur); sub.connect(out); osc(c, 'sine', f, at, dur, sub);
  }
  function kick(c, out, at, vol) {
    const o = c.createOscillator(), g = env(c, at, vol, .002, .22); o.frequency.setValueAtTime(110, at); o.frequency.exponentialRampToValueAtTime(55, at + .12);
    o.connect(g); g.connect(out); o.start(at); o.stop(at + .25);
  }
  function hiss(c, out, wet, at, dur, vol, freq, type, q = .8) {
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = env(c, at, vol, .001, dur);
    s.buffer = noiseOf(c); f.type = type; f.frequency.value = freq; f.Q.value = q; s.connect(f); f.connect(g); g.connect(out); send(c, g, wet, .25);
    s.start(at, Math.random() * .3); s.stop(at + dur + .02);
  }

  /*
   * s: 16th step counter · at: start time · sixteenth: seconds per 16th
   * o: { trans: semitones, drums: 0..1, energy: 0..1, calm: bool }
   */
  function step(c, out, wet, s, at, sixteenth, o = {}) {
    const bar = Math.floor(s / 16) % 32, sec = FORM[Math.floor(bar / 8)], bi = bar % 8, st = s % 16, tr = o.trans || 0;
    const chord = CH[sec][bi], eighth = sixteenth * 2, calm = !!o.calm;
    // melody
    if (st % 2 === 0) {
      const m = P.mel[sec][bi][st / 2];
      if (m) mallet(c, out, wet, midi(m.n + tr), at, Math.max(.28, m.hold * eighth * 1.1), calm ? .055 : .07);
      const b = P.bell[sec] && P.bell[sec][bi][st / 2];
      if (b && !calm) bell(c, out, wet, midi(b.n + tr), at, .022);
    }
    // bass: root on 1, fifth on 3, a little pickup before the next bar
    const root = BASS[chord] + tr;
    if (st === 0) bass(c, out, midi(root), at, eighth * 3, .085);
    if (st === 8) bass(c, out, midi(root + 7), at, eighth * 2.2, .06);
    if (st === 14 && !calm) bass(c, out, midi(root + 12), at, eighth * .9, .035);
    // chord stabs on the off-beats (ukulele feel); calmer in the menu
    const stab = calm ? (st === 4 || st === 12) : (st % 4 === 2);
    if (stab) CHORD[chord].forEach((n, i) => pluck(c, out, wet, midi(n + tr), at + i * .012, calm ? .5 : .22, calm ? .016 : .02));
    // light percussion while flying
    const d = o.drums || 0;
    if (d > 0) {
      const fill = sec === 'C' && bi === 7;
      if ((st === 0 || st === 8) && !fill) kick(c, out, at, .07 * d);
      if (st === 4 || st === 12 || (fill && st % 2 === 0)) hiss(c, out, wet, at, .09, .05 * d, 1900, 'bandpass', 1.2);
      if (st % 2 === 1 || (o.energy > .5 && st % 2 === 0)) hiss(c, out, null, at, .035, (st % 4 === 2 ? .028 : .018) * d, 7000, 'highpass');
    }
  }
  window.GlimmSong = { step, bars: 32, title: 'Lichterflug' };
})();
