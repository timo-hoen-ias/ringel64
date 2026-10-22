// Prozedurales Audio: Effekte aus Oszillatoren/Rauschen, Musik über einen Step-Sequencer mit
// Instrumenten im Stil der Rare-N64-Soundtracks (Marimba, Banjo, Kazoo, Flöte, Tuba, Glocken,
// Schlittenglocken, Schlagzeug), Swing und einem Unterwasser-Filter.
const NOTEN = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11, H: 11 };
function frequenz(note) {
  const m = /^([A-H][#b]?)(\d)$/.exec(note);
  if (!m) return 0;
  const n = NOTEN[m[1]] + (parseInt(m[2]) + 1) * 12;
  return 440 * Math.pow(2, (n - 69) / 12);
}

// ---- Lieder: 16tel-Schritte. '-' Pause, Ton = Anschlag, 'A4+C5' = Akkord. Schlagzeug: K S H X (Kick, Snare, Hat, Shaker). ----
const LIEDER = {
  titel: { bpm: 112, swing: .1, spuren: [
    { instr: 'bass', laut: .5, laenge: 3, noten: 'G2 - - - D3 - - - G2 - - G2 - D3 - - C3 - - - G2 - - - D3 - - D3 - F#2 - -' },
    { instr: 'banjo', laut: .3, laenge: 2, noten: 'G4 B4 D5 - G5 - D5 - B4 - D5 - G5 - B5 - C5 E5 G5 - C6 - G5 - D5 - F#5 - A5 - D6 -' },
    { instr: 'kazoo', laut: .22, laenge: 3, noten: '- - - - - - - - B5 - - - A5 - G5 - - - - - E5 - - - D5 - - - - - - -' },
    { instr: 'drums', laut: .5, noten: 'K - H - S - H - K - H K S - H - K - H - S - H - K - H K S - H H' },
  ] },
  hub: { bpm: 98, swing: .14, spuren: [
    { instr: 'bass', laut: .5, laenge: 3, noten: 'D2 - - - A2 - - - D2 - - D2 - A2 - - G2 - - - D3 - - - A2 - - A2 - C#3 - - D2 - - - A2 - - - F#2 - - F#2 - A2 - - G2 - - - A2 - - - D2 - - A2 - D2 - -' },
    { instr: 'banjo', laut: .28, laenge: 2, noten: 'D4 F#4 A4 - D5 - A4 - F#4 - A4 - D5 - F#5 - G4 B4 D5 - G5 - D5 - A4 - C#5 - E5 - A5 - D4 F#4 A4 - D5 - A4 - F#4 - A4 - D5 - F#5 - G4 B4 D5 - A4 C#5 E5 - D5 - F#5 - A5 - D6 -' },
    { instr: 'marimba', laut: .3, laenge: 3, noten: '- - - - F#5 - A5 - - - D6 - - A5 - - - - - - G5 - B5 - - - D6 - - C#6 - - - - - - F#5 - A5 - - - D6 - F#6 - - - - - - - E6 - D6 - - C#6 - - - D6 - - -' },
    { instr: 'drums', laut: .45, noten: 'K - X - S - X - K - X K S - X - K - X - S - X - K - X K S - X X K - X - S - X - K - X K S - X - K - X - S - X - K K X - S - X X' },
  ] },
  bad: { bpm: 122, swing: .08, spuren: [
    { instr: 'bass', laut: .5, laenge: 2, noten: 'C3 - - C3 - - G2 - C3 - - C3 - - G2 - F2 - - F2 - - C3 - G2 - - G2 - - B2 - C3 - - C3 - - G2 - E3 - - E3 - - G2 - F2 - - A2 - - C3 - G2 - - G2 - B2 - -' },
    { instr: 'marimba', laut: .32, laenge: 2, noten: 'E5 - G5 C6 - - G5 - E5 - G5 C6 - - G5 - F5 - A5 C6 - - A5 - D5 - G5 B5 - - G5 - E5 - G5 C6 - - G5 - E6 - D6 C6 - - G5 - F5 - A5 C6 - F6 - E6 - D6 - B5 - - - G5 -' },
    { instr: 'floete', laut: .22, laenge: 4, noten: '- - - - - - - - C6 - - - - - - - - - - - - - - - D6 - - - - - - - - - - - - - - - E6 - - - - - - - - - - - - - - - D6 - - - C6 - - -' },
    { instr: 'drums', laut: .45, noten: 'K - H - S - H H K - H - S - H - K - H - S - H H K - H - S - S - K - H - S - H H K - H - S - H - K - H - S - H H K - S - S - S -' },
  ] },
  kuehlschrank: { bpm: 104, swing: .1, spuren: [
    { instr: 'bass', laut: .45, laenge: 3, noten: 'A2 - - - E3 - - - A2 - - - G2 - - - F2 - - - C3 - - - E2 - - - E3 - - - A2 - - - E3 - - - A2 - - - G2 - - - F2 - - - C3 - - - E2 - - E2 - E2 - -' },
    { instr: 'glocke', laut: .25, laenge: 4, noten: 'A5 - - - C6 - - - E6 - - - - - - - F5 - - - A5 - - - C6 - - - B5 - - - A5 - - - C6 - - - E6 - - - A6 - - - G6 - - - E6 - - - D6 - - - C6 - - -' },
    { instr: 'marimba', laut: .26, laenge: 2, noten: '- A4 C5 E5 - A4 C5 E5 - G4 B4 D5 - G4 B4 D5 - F4 A4 C5 - F4 A4 C5 - E4 G#4 B4 - E4 G#4 B4 - A4 C5 E5 - A4 C5 E5 - G4 B4 D5 - G4 B4 D5 - F4 A4 C5 - F4 A4 C5 - E4 G#4 B4 E5 - G#5 - B5' },
    { instr: 'drums', laut: .3, noten: '- - H - - - H - - - H - - - H - - - H - - - H - - - H - - - H - - - H - - - H - S - H - - - H - - - H - - - H - S - H - S - H H' },
  ] },
  herd: { bpm: 138, swing: .05, spuren: [
    { instr: 'tuba', laut: .45, laenge: 2, noten: 'A2 - A2 - E2 - - - A2 - A2 - G2 - - - F2 - F2 - C3 - - - E2 - E2 - E2 G#2 - - A2 - A2 - E2 - - - A2 - A2 - G2 - - - F2 - F2 - C3 - - - E2 - G#2 - E2 - - -' },
    { instr: 'banjo', laut: .3, laenge: 1, noten: 'A4 C5 E5 A5 - E5 C5 - A4 C5 E5 A5 G5 - E5 - F4 A4 C5 F5 - C5 A4 - E4 G#4 B4 E5 - B4 G#4 - A4 C5 E5 A5 - E5 C5 - A4 C5 E5 A5 G5 - E5 - F4 A4 C5 F5 - C5 A4 - E5 - G#5 - B5 - E6 -' },
    { instr: 'kazoo', laut: .22, laenge: 2, noten: '- - - - - - - - E6 - D6 - C6 - - - - - - - - - - - A5 - B5 - C6 - - - - - - - - - - - E6 - D6 - C6 - - - - - - - - - - - B5 - G#5 - A5 - - -' },
    { instr: 'drums', laut: .5, noten: 'K - H - S - H K K - H - S - H - K - H - S - H K K - H - S S - S K - H - S - H K K - H - S - H - K - H - S - H K K K S - S - S S' },
  ] },
  kinderzimmer: { bpm: 132, swing: 0, spuren: [ // Walzer: 12 Schritte pro Takt
    { instr: 'bass', laut: .45, laenge: 3, noten: 'C3 - - - - - - - - - - - G2 - - - - - - - - - - - F2 - - - - - - - - - - - G2 - - - - - - - - - - -' },
    { instr: 'marimba', laut: .28, laenge: 2, noten: '- - - - E4+G4 - - - E4+G4 - - - - - - - D4+G4 - - - D4+G4 - - - - - - - F4+A4 - - - F4+A4 - - - - - - - D4+G4 - - - D4+B4 - - -' },
    { instr: 'glocke', laut: .3, laenge: 4, noten: 'E6 - - - G6 - - - C7 - - - B6 - - - G6 - - - D6 - - - A6 - - - F6 - - - C6 - - - D6 - - - B5 - - - G5 - - -' },
    { instr: 'drums', laut: .3, noten: 'K - - - H - - - H - - - K - - - H - - - H - - - K - - - H - - - H - - - K - - - H - - - H - - -' },
  ] },
  bett: { bpm: 84, swing: .18, spuren: [
    { instr: 'tuba', laut: .45, laenge: 3, noten: 'D2 - - - - - - - F2 - - - - - - - D2 - - - - - A2 - Bb2 - - - A2 - - - D2 - - - - - - - F2 - - - - - - - G2 - - - - - - - A2 - - - C#3 - - -' },
    { instr: 'marimba', laut: .26, laenge: 1, noten: '- - D4 - - - F4 - - - A4 - - - D5 - - - C5 - - - A4 - - - F4 - - - D4 - - - D4 - - - F4 - - - A4 - - - G4 - - - Bb4 - - - A4 - - - C#5 - - - E5 -' },
    { instr: 'kazoo', laut: .2, laenge: 4, noten: '- - - - - - - - - - - - - - - - A5 - - - - - - - F5 - - - - - - - - - - - - - - - - - - - - - - - G5 - - - - - - - A5 - - - - - - -' },
    { instr: 'drums', laut: .35, noten: 'K - - - - - H - - - K - - - H - K - - - - - H - - - K - S - H - K - - - - - H - - - K - - - H - K - - - - - H - S - - - S - S -' },
  ] },
  garten: { bpm: 116, swing: .12, spuren: [
    { instr: 'bass', laut: .45, laenge: 3, noten: 'G2 - - - D3 - - - E2 - - - B2 - - - C3 - - - G2 - - - D3 - - D3 - F#2 - - G2 - - - D3 - - - E2 - - - B2 - - - C3 - - - A2 - - - D3 - - - G2 - - -' },
    { instr: 'floete', laut: .26, laenge: 4, noten: 'B5 - - - D6 - - - G6 - - - - - - - E6 - - - D6 - - - B5 - - - - - - - C6 - - - E6 - - - G6 - - - - - - - A6 - - - F#6 - - - G6 - - - - - - -' },
    { instr: 'banjo', laut: .26, laenge: 2, noten: 'G4 - B4 D5 - B4 G4 - E4 - G4 B4 - G4 E4 - C4 - E4 G4 - E4 C4 - D4 - F#4 A4 - F#4 D4 - G4 - B4 D5 - B4 G4 - E4 - G4 B4 - G4 E4 - C4 - E4 G4 - A4 - C5 - D5 - F#5 A5 - D5 -' },
    { instr: 'drums', laut: .4, noten: 'K - X - S - X - K - X X S - X - K - X - S - X - K - X X S - X X K - X - S - X - K - X X S - X - K - X - S - X - K - X X S - S -' },
  ] },
  aquarium: { bpm: 88, swing: .08, spuren: [
    { instr: 'bass', laut: .4, laenge: 4, noten: 'F2 - - - - - - - C3 - - - - - - - Bb2 - - - - - - - C3 - - - - - - - F2 - - - - - - - A2 - - - - - - - Bb2 - - - - - - - C3 - - - - - - -' },
    { instr: 'marimba', laut: .26, laenge: 3, noten: 'F4 - A4 - C5 - A4 - E4 - G4 - C5 - G4 - D4 - F4 - Bb4 - F4 - E4 - G4 - C5 - G4 - F4 - A4 - C5 - F5 - C#5 - E5 - A5 - E5 - D5 - F5 - Bb5 - F5 - E5 - G5 - C6 - G5 -' },
    { instr: 'floete', laut: .24, laenge: 6, noten: '- - - - A5 - - - - - - - G5 - - - - - - - F5 - - - - - - - E5 - - - - - - - A5 - - - - - - - C6 - - - - - - - Bb5 - - - - - - - G5 - - -' },
    { instr: 'glocke', laut: .14, laenge: 6, noten: 'C6 - - - - - - - - - - - - - - - F6 - - - - - - - - - - - - - - - A6 - - - - - - - - - - - - - - - G6 - - - - - - - - - - - - - - -' },
    { instr: 'drums', laut: .22, noten: '- - - - X - - - - - - - X - - - - - - - X - - - - - - - X - - - - - - - X - - - - - - - X - - - - - - - X - - - - - - - X - X -' },
  ] },
  winter: { bpm: 126, swing: .1, spuren: [
    { instr: 'bass', laut: .45, laenge: 2, noten: 'C3 - - - G2 - - - C3 - - - G2 - - - F2 - - - C3 - - - G2 - - - G2 - B2 - C3 - - - G2 - - - E3 - - - A2 - - - F2 - - - G2 - - - C3 - - G2 - C3 - -' },
    { instr: 'glocke', laut: .3, laenge: 3, noten: 'E6 - - - E6 - - - E6 - - - - - - - E6 - - - E6 - - - E6 - - - - - - - E6 - - - G6 - - - C6 - - D6 - E6 - - - - - - - F6 - F6 - F6 - - - F6 - E6 - E6 -' },
    { instr: 'marimba', laut: .26, laenge: 2, noten: 'C4 E4 G4 - C5 - G4 - C4 E4 G4 - C5 - G4 - F4 A4 C5 - F5 - C5 - G4 B4 D5 - G5 - D5 - C4 E4 G4 - C5 - G4 - E4 G#4 B4 - E5 - B4 - F4 A4 C5 - F5 - G4 B4 D5 - G5 - C5 E5 G5 - C6 -' },
    { instr: 'schlitten', laut: .25, noten: 'X - X - X - X - X - X - X - X - X - X - X - X - X - X - X - X - X - X - X - X - X - X - X - X - X - X - X - X - X - X - X - X X' },
    { instr: 'drums', laut: .35, noten: 'K - - - S - - - K - - - S - - - K - - - S - - - K - - - S - S - K - - - S - - - K - - - S - - - K - - - S - - - K - S - S - S -' },
  ] },
  trommel: { bpm: 144, swing: .04, spuren: [
    { instr: 'tuba', laut: .5, laenge: 2, noten: 'E2 - E2 - E2 - G2 - E2 - E2 - Bb2 - A2 - E2 - E2 - E2 - G2 - C3 - B2 - Bb2 - A2 - E2 - E2 - E2 - G2 - E2 - E2 - Bb2 - A2 - E2 - G2 - A2 - Bb2 - B2 - C3 - C#3 - D3 -' },
    { instr: 'kazoo', laut: .26, laenge: 2, noten: 'E5 - - - - - E5 - G5 - - - Bb5 - A5 - E5 - - - - - E5 - C6 - B5 - Bb5 - A5 - - - E5 - - - - - E5 - G5 - - - Bb5 - A5 - E6 - D6 - C6 - B5 - Bb5 - A5 - G5 - E5 - - -' },
    { instr: 'banjo', laut: .22, laenge: 1, noten: 'E4 G4 Bb4 E5 - Bb4 G4 - E4 G4 Bb4 E5 - Bb4 G4 - E4 G4 Bb4 E5 - Bb4 G4 - E4 G4 Bb4 E5 D5 - Bb4 - E4 G4 Bb4 E5 - Bb4 G4 - E4 G4 Bb4 E5 - Bb4 G4 - E4 G4 Bb4 E5 - Bb4 G4 - A4 - B4 - C5 - C#5 - D5 -' },
    { instr: 'drums', laut: .55, noten: 'K - H - S - H K K - H - S - H - K - H - S - H K K K S - S S K S K - H - S - H K K - H - S - H - K - H - S - H K K K S S S S S S' },
  ] },
  ende: { bpm: 92, swing: .12, spuren: [
    { instr: 'bass', laut: .45, laenge: 4, noten: 'C3 - - - - - - - A2 - - - - - - - F2 - - - - - - - G2 - - - - - - - C3 - - - - - - - E2 - - - - - - - F2 - - - - - - - G2 - - - - - - -' },
    { instr: 'floete', laut: .26, laenge: 5, noten: 'E5 - - - G5 - - - C6 - - - - - - - A5 - - - - - G5 - - - F5 - - - - - - - E5 - - - G5 - - - C6 - - - E6 - - - D6 - - - - - C6 - - - B5 - - - - - - -' },
    { instr: 'glocke', laut: .18, laenge: 6, noten: 'C6 - - - - - - - - - - - - - - - A5 - - - - - - - - - - - - - - - F5 - - - - - - - - - - - - - - - G5 - - - - - - - D6 - - - - - - -' },
    { instr: 'banjo', laut: .2, laenge: 2, noten: 'C4 E4 G4 - C5 - G4 - A3 C4 E4 - A4 - E4 - F3 A3 C4 - F4 - C4 - G3 B3 D4 - G4 - D4 - C4 E4 G4 - C5 - G4 - E3 G#3 B3 - E4 - B3 - F3 A3 C4 - F4 - G3 B3 D4 - G4 - B4 D5 G5 - -' },
    { instr: 'drums', laut: .25, noten: '- - X - - - X - - - X - - - X - - - X - - - X - - - X - - - X - - - X - - - X - - - X - - - X - - - X - - - X - - - X - - - X -' },
  ] },
};

export class Audio {
  constructor() {
    this.ctx = null; this.musikLaut = .6; this.sfxLaut = .8; this.unterwasser = false;
    this.lied = null; this.liedName = null; this.schritt = 0; this.naechsteZeit = 0; this.timer = null;
  }
  start() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = .9; this.master.connect(this.ctx.destination);
    // Musikbus: Gain → Unterwasser-Tiefpass → Master
    this.musikFilter = this.ctx.createBiquadFilter(); this.musikFilter.type = 'lowpass'; this.musikFilter.frequency.value = 20000; this.musikFilter.Q.value = .7; this.musikFilter.connect(this.master);
    this.musikGain = this.ctx.createGain(); this.musikGain.gain.value = this.musikLaut; this.musikGain.connect(this.musikFilter);
    this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = this.sfxLaut; this.sfxGain.connect(this.master);
    const n = this.ctx.sampleRate * 2; const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this.rauschen = buf;
    if (this.liedName) this.spieleMusik(this.liedName, true);
  }
  setzeLautstaerke(musik, sfx) {
    this.musikLaut = musik; this.sfxLaut = sfx;
    if (this.musikGain) this.musikGain.gain.value = musik;
    if (this.sfxGain) this.sfxGain.gain.value = sfx;
  }
  // Unter Wasser klingt die Musik dumpf (wie bei Banjo-Kazooie)
  setzeUnterwasser(an) {
    if (this.unterwasser === an) return;
    this.unterwasser = an;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.musikFilter.frequency.cancelScheduledValues(t);
    this.musikFilter.frequency.setTargetAtTime(an ? 420 : 20000, t, .25);
    this.musikFilter.Q.setTargetAtTime(an ? 2.5 : .7, t, .25);
  }

  // ---- Bausteine ----
  huelle(g, t, { a = .005, laut = .3, dauer = .3, abklingen = .3, halten = 0 }) {
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(laut, t + a);
    if (halten > 0) { g.gain.setValueAtTime(laut, t + a + halten); g.gain.exponentialRampToValueAtTime(0.0001, t + a + halten + abklingen); }
    else g.gain.exponentialRampToValueAtTime(0.0001, t + a + Math.max(.02, dauer));
  }
  ton({ welle = 'square', f0 = 440, f1 = f0, dauer = .1, laut = .3, start = 0, kurve = 'exp', ziel = null }) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + start;
    const o = this.ctx.createOscillator(); o.type = welle;
    o.frequency.setValueAtTime(f0, t);
    if (kurve === 'exp') o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dauer);
    else o.frequency.linearRampToValueAtTime(f1, t + dauer);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(laut, t + .008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
    o.connect(g); g.connect(ziel || this.sfxGain); o.start(t); o.stop(t + dauer + .02);
  }
  rausch({ dauer = .1, laut = .3, start = 0, filter = 2000, typ = 'lowpass', q = 1, ziel = null }) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + start;
    const s = this.ctx.createBufferSource(); s.buffer = this.rauschen;
    const f = this.ctx.createBiquadFilter(); f.type = typ; f.frequency.value = filter; f.Q.value = q;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(laut, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
    s.connect(f); f.connect(g); g.connect(ziel || this.sfxGain); s.start(t); s.stop(t + dauer + .02);
  }

  // ---- Instrumente (Zeit absolut) ----
  instrument(name, f, t, dauer, laut) {
    const ctx = this.ctx, ziel = this.musikGain;
    const osc = (welle, freq, detune = 0) => { const o = ctx.createOscillator(); o.type = welle; o.frequency.setValueAtTime(freq, t); o.detune.value = detune; return o; };
    const ende = (nodes, stop) => nodes.forEach(o => { o.start(t); o.stop(t + stop); });
    switch (name) {
      case 'marimba': { // Holz: Grundton + 4. Teilton, schnell abklingend, kleiner Klick
        const g = ctx.createGain(); this.huelle(g, t, { laut, dauer: Math.min(.45, dauer) });
        const o1 = osc('sine', f), o2 = osc('sine', f * 4); const g2 = ctx.createGain(); g2.gain.value = .22;
        o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(ziel); ende([o1, o2], dauer + .1);
        this.rausch({ dauer: .02, laut: laut * .4, start: t - ctx.currentTime, filter: 3000, typ: 'bandpass', q: 2, ziel }); break; }
      case 'banjo': { // Zupf: zwei verstimmte Sägezähne durch Bandpass, sehr kurz
        const g = ctx.createGain(); this.huelle(g, t, { a: .003, laut, dauer: Math.min(.32, dauer) });
        const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 2400; f1.Q.value = .9;
        const o1 = osc('sawtooth', f, -5), o2 = osc('sawtooth', f, 5), o3 = osc('square', f * 2); const g3 = ctx.createGain(); g3.gain.value = .15;
        o1.connect(f1); o2.connect(f1); o3.connect(g3); g3.connect(f1); f1.connect(g); g.connect(ziel); ende([o1, o2, o3], dauer + .1); break; }
      case 'kazoo': { // nasal: Sägezahn + Rechteck mit Vibrato durch engen Bandpass
        const g = ctx.createGain(); this.huelle(g, t, { a: .03, laut: laut * .9, halten: Math.max(.05, dauer - .1), abklingen: .08 });
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 1.8;
        const o1 = osc('sawtooth', f), o2 = osc('square', f * 1.005); const g2 = ctx.createGain(); g2.gain.value = .4;
        const lfo = osc('sine', 5.5); const lg = ctx.createGain(); lg.gain.value = f * .012; lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
        o1.connect(bp); o2.connect(g2); g2.connect(bp); bp.connect(g); g.connect(ziel); ende([o1, o2, lfo], dauer + .2); break; }
      case 'floete': { // Ocarina/Flöte: weicher Sinus + Dreieck, leichtes Vibrato
        const g = ctx.createGain(); this.huelle(g, t, { a: .05, laut: laut * .9, halten: Math.max(.05, dauer - .12), abklingen: .12 });
        const o1 = osc('sine', f), o2 = osc('triangle', f); const g2 = ctx.createGain(); g2.gain.value = .35;
        const lfo = osc('sine', 5); const lg = ctx.createGain(); lg.gain.value = f * .006; lfo.connect(lg); lg.connect(o1.frequency);
        o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(ziel); ende([o1, o2, lfo], dauer + .25);
        this.rausch({ dauer: .08, laut: laut * .15, start: t - ctx.currentTime, filter: 2500, typ: 'bandpass', q: 1, ziel }); break; }
      case 'bass': { // Bass: Dreieck + Sub-Rechteck, Tiefpass
        const g = ctx.createGain(); this.huelle(g, t, { a: .005, laut, dauer: Math.min(.4, dauer) });
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
        const o1 = osc('triangle', f), o2 = osc('square', f / 2); const g2 = ctx.createGain(); g2.gain.value = .25;
        o1.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(ziel); ende([o1, o2], dauer + .1); break; }
      case 'tuba': { // Tuba: Sägezahn durch Tiefpass, kleines Vibrato, kurz gehalten
        const g = ctx.createGain(); this.huelle(g, t, { a: .02, laut, halten: Math.max(.05, dauer * .6), abklingen: .1 });
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380; lp.Q.value = 1.2;
        const o1 = osc('sawtooth', f), o2 = osc('sawtooth', f * 2.003); const g2 = ctx.createGain(); g2.gain.value = .25;
        const lfo = osc('sine', 4.5); const lg = ctx.createGain(); lg.gain.value = f * .01; lfo.connect(lg); lg.connect(o1.frequency);
        o1.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(ziel); ende([o1, o2, lfo], dauer + .2); break; }
      case 'glocke': { // Glockenspiel: unharmonische Teiltöne, lang abklingend
        const g = ctx.createGain(); this.huelle(g, t, { a: .003, laut: laut * .8, dauer: Math.max(.6, dauer) });
        const o1 = osc('sine', f), o2 = osc('sine', f * 2.76), o3 = osc('sine', f * 5.4); const g2 = ctx.createGain(); g2.gain.value = .35; const g3 = ctx.createGain(); g3.gain.value = .12;
        o1.connect(g); o2.connect(g2); g2.connect(g); o3.connect(g3); g3.connect(g); g.connect(ziel); ende([o1, o2, o3], Math.max(.6, dauer) + .2); break; }
      case 'schlitten': { // Schlittenglocken: hohes Rauschen mit Metallton
        this.rausch({ dauer: .12, laut: laut * .8, start: t - ctx.currentTime, filter: 7600, typ: 'bandpass', q: 3, ziel });
        const g = ctx.createGain(); this.huelle(g, t, { a: .002, laut: laut * .25, dauer: .15 }); const o = osc('sine', 5200 + Math.random() * 400); o.connect(g); g.connect(ziel); ende([o], .2); break; }
    }
  }
  schlagzeug(token, t, laut) {
    const ctx = this.ctx, ziel = this.musikGain, start = t - ctx.currentTime;
    if (token === 'K') { const g = ctx.createGain(); this.huelle(g, t, { a: .002, laut, dauer: .22 }); const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + .14); o.connect(g); g.connect(ziel); o.start(t); o.stop(t + .3);
      this.rausch({ dauer: .03, laut: laut * .4, start, filter: 1200, ziel }); }
    else if (token === 'S') { this.rausch({ dauer: .14, laut: laut * .7, start, filter: 1900, typ: 'bandpass', q: .8, ziel }); this.ton({ welle: 'triangle', f0: 230, f1: 150, dauer: .09, laut: laut * .5, start, ziel }); }
    else if (token === 'H') this.rausch({ dauer: .05, laut: laut * .35, start, filter: 8000, typ: 'highpass', ziel });
    else if (token === 'X') this.rausch({ dauer: .07, laut: laut * .25, start, filter: 5500, typ: 'bandpass', q: 1.5, ziel });
  }

  // ---- Effekte ----
  sfx(name) {
    if (!this.ctx) return;
    switch (name) {
      case 'springen': this.ton({ welle: 'square', f0: 280, f1: 620, dauer: .14, laut: .22 }); break;
      case 'doppel': this.ton({ welle: 'triangle', f0: 400, f1: 950, dauer: .18, laut: .28 });
        this.ton({ welle: 'square', f0: 600, f1: 1200, dauer: .14, laut: .12, start: .05 }); break;
      case 'landen': this.rausch({ dauer: .06, laut: .12, filter: 600 }); break;
      case 'fussel': this.ton({ welle: 'sine', f0: 900, f1: 900, dauer: .06, laut: .25 });
        this.ton({ welle: 'sine', f0: 1300, f1: 1300, dauer: .08, laut: .22, start: .06 }); break;
      case 'klammer': ['C5', 'E5', 'G5', 'C6', 'E6'].forEach((n, i) =>
        this.ton({ welle: 'square', f0: frequenz(n), dauer: .16, laut: .2, start: i * .08 })); break;
      case 'socke': ['G4', 'C5', 'E5', 'G5', 'E5', 'G5', 'C6'].forEach((n, i) =>
        this.ton({ welle: 'triangle', f0: frequenz(n), dauer: .2, laut: .25, start: i * .1 })); break;
      case 'knopf': ['A4', 'A4', 'E5'].forEach((n, i) => this.ton({ welle: 'square', f0: frequenz(n), dauer: .12, laut: .18, start: i * .09 })); break;
      case 'quietsch': this.ton({ welle: 'sawtooth', f0: 1400, f1: 900, dauer: .12, laut: .22 });
        this.ton({ welle: 'sawtooth', f0: 800, f1: 1500, dauer: .18, laut: .2, start: .12 }); break;
      case 'stampf': this.rausch({ dauer: .25, laut: .4, filter: 300 }); this.ton({ welle: 'sine', f0: 90, f1: 35, dauer: .3, laut: .5 }); break;
      case 'dialog': this.ton({ welle: 'square', f0: 820, f1: 820, dauer: .03, laut: .08 }); break;
      case 'treffer': this.rausch({ dauer: .12, laut: .3, filter: 1500 }); this.ton({ welle: 'sawtooth', f0: 260, f1: 80, dauer: .15, laut: .25 }); break;
      case 'pop': this.ton({ welle: 'sine', f0: 700, f1: 120, dauer: .18, laut: .3 }); this.rausch({ dauer: .08, laut: .15, filter: 3000, typ: 'highpass' }); break;
      case 'tuer': this.rausch({ dauer: .5, laut: .25, filter: 900 }); this.ton({ welle: 'sine', f0: 200, f1: 900, dauer: .5, laut: .12 }); break;
      case 'zug': this.ton({ welle: 'square', f0: 300, f1: 1100, dauer: .22, laut: .18 }); break;
      case 'schalter': this.ton({ welle: 'square', f0: 500, f1: 250, dauer: .08, laut: .2 }); this.ton({ welle: 'square', f0: 250, f1: 500, dauer: .1, laut: .18, start: .1 }); break;
      case 'nass': this.rausch({ dauer: .25, laut: .2, filter: 1200 }); this.ton({ welle: 'sine', f0: 500, f1: 180, dauer: .25, laut: .15 }); break;
      case 'trocken': this.rausch({ dauer: .35, laut: .18, filter: 5000, typ: 'highpass' }); break;
      case 'sprungfeld': this.ton({ welle: 'triangle', f0: 200, f1: 1400, dauer: .3, laut: .3 }); break;
      case 'blubb': this.ton({ welle: 'sine', f0: 300, f1: 700, dauer: .12, laut: .15 }); break;
      case 'schnarch': this.ton({ welle: 'sawtooth', f0: 90, f1: 140, dauer: .6, laut: .07, kurve: 'lin' }); break;
      case 'fehler': this.ton({ welle: 'square', f0: 220, f1: 110, dauer: .25, laut: .2 }); break;
      case 'boss': ['E3', 'Bb3', 'E3', 'Bb3', 'E4'].forEach((n, i) => this.ton({ welle: 'sawtooth', f0: frequenz(n), dauer: .25, laut: .22, start: i * .14 })); break;
      case 'fanfare': ['C5', 'E5', 'G5', 'C6', 'G5', 'C6', 'E6', 'G6'].forEach((n, i) =>
        this.ton({ welle: 'square', f0: frequenz(n), dauer: .3, laut: .2, start: i * .12 })); break;
      case 'summen': this.ton({ welle: 'sawtooth', f0: 180, f1: 180, dauer: .05, laut: .03 }); break;
      case 'leben': ['C5', 'G5', 'C6', 'E6', 'G6'].forEach((n, i) => this.ton({ welle: 'triangle', f0: frequenz(n), dauer: .25, laut: .25, start: i * .1 })); break;
      case 'schnee': this.rausch({ dauer: .12, laut: .12, filter: 900 }); break;
      case 'eis': this.ton({ welle: 'sine', f0: 2200, f1: 1800, dauer: .1, laut: .12 }); this.rausch({ dauer: .1, laut: .08, filter: 6000, typ: 'highpass' }); break;
    }
  }

  // ---- Musik ----
  spieleMusik(name, erzwinge = false) {
    if (this.liedName === name && !erzwinge) return;
    this.stoppeMusik();
    this.liedName = name;
    const lied = LIEDER[name];
    if (!lied || !this.ctx) return;
    this.lied = lied;
    this.spuren = lied.spuren.map(s => ({ ...s, schritte: s.noten.trim().split(/\s+/) }));
    this.schrittDauer = 60 / lied.bpm / 4;
    this.schritt = 0; this.naechsteZeit = this.ctx.currentTime + .05;
    this.timer = setInterval(() => this.plane(), 40);
  }
  stoppeMusik() { if (this.timer) clearInterval(this.timer); this.timer = null; this.lied = null; this.liedName = null; }
  plane() {
    if (!this.ctx || !this.lied) return;
    while (this.naechsteZeit < this.ctx.currentTime + .18) {
      const swing = (this.schritt % 2 === 1) ? (this.lied.swing || 0) * this.schrittDauer : 0;
      const t = this.naechsteZeit + swing;
      for (const sp of this.spuren) {
        const token = sp.schritte[this.schritt % sp.schritte.length];
        if (token === '-') continue;
        if (sp.instr === 'drums') { for (const ch of token) this.schlagzeug(ch, t, sp.laut); continue; }
        if (sp.instr === 'schlitten') { this.instrument('schlitten', 0, t, .1, sp.laut); continue; }
        const dauer = this.schrittDauer * (sp.laenge || 2);
        for (const n of token.split('+')) { const f = frequenz(n); if (f > 0) this.instrument(sp.instr, f, t, dauer, sp.laut); }
      }
      this.naechsteZeit += this.schrittDauer; this.schritt++;
    }
  }
}
