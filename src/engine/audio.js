// Prozedurales Audio: Effekte aus Oszillatoren/Rauschen, Musik über einen kleinen Step-Sequencer.
const NOTEN = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11, H: 11 };
function frequenz(note) {
  const m = /^([A-H][#b]?)(\d)$/.exec(note);
  if (!m) return 0;
  const n = NOTEN[m[1]] + (parseInt(m[2]) + 1) * 12;
  return 440 * Math.pow(2, (n - 69) / 12);
}

// Lieder: 16tel-Schritte, '-' = Pause, Tonnamen = Anschlag. Spuren mit Wellenform und Lautstärke.
const LIEDER = {
  titel: { bpm: 96, spuren: [
    { welle: 'triangle', laut: .5, laenge: .9, noten: 'C3 - - - G3 - - - A3 - - - F3 - - - C3 - - - G3 - - - F3 - - - G3 - - -' },
    { welle: 'square', laut: .18, laenge: .5, noten: 'E5 - G5 - C6 - - - B5 - G5 - E5 - - - D5 - F5 - A5 - - - G5 - E5 - D5 - - -' },
  ] },
  hub: { bpm: 88, spuren: [
    { welle: 'triangle', laut: .5, laenge: .8, noten: 'F2 - - - F2 - - - C3 - - - C3 - - - Bb2 - - - Bb2 - - - C3 - - - C3 - - -' },
    { welle: 'square', laut: .15, laenge: .6, noten: 'A4 - C5 - F5 - - - E5 - C5 - A4 - - - G4 - Bb4 - D5 - - - C5 - E5 - G5 - - -' },
    { welle: 'sine', laut: .22, laenge: .3, noten: '- - F4 - - - F4 - - - E4 - - - E4 - - - D4 - - - D4 - - - E4 - - - E4 -' },
  ] },
  bad: { bpm: 120, spuren: [
    { welle: 'triangle', laut: .5, laenge: .7, noten: 'D3 - - D3 - - A2 - D3 - - D3 - - A2 - G2 - - G2 - - D3 - A2 - - A2 - - D3 -' },
    { welle: 'square', laut: .17, laenge: .5, noten: 'D5 - - F5 - - A5 - D6 - - A5 - - F5 - G5 - - B5 - - D6 - A5 - - F5 - - E5 -' },
    { welle: 'rauschen', laut: .12, laenge: .08, noten: '- - X - - - X - - - X - - - X - - - X - - - X - - - X - - - X - X -' },
  ] },
  kuehlschrank: { bpm: 100, spuren: [
    { welle: 'triangle', laut: .45, laenge: .9, noten: 'E2 - - - - - - - B2 - - - - - - - C3 - - - - - - - B2 - - - - - - -' },
    { welle: 'sine', laut: .25, laenge: .35, noten: 'E5 - B5 - G5 - E6 - B5 - G5 - E5 - B4 - C5 - G5 - E5 - C6 - G5 - E5 - B4 - D5 -' },
    { welle: 'square', laut: .08, laenge: .2, noten: '- E6 - - - B6 - - - E6 - - - B6 - - - C6 - - - G6 - - - D6 - - - G6 - -' },
  ] },
  herd: { bpm: 132, spuren: [
    { welle: 'sawtooth', laut: .3, laenge: .5, noten: 'A2 - A2 - - A2 - - C3 - - - E3 - - - A2 - A2 - - A2 - - G2 - - - E2 - - -' },
    { welle: 'square', laut: .16, laenge: .4, noten: 'A4 - - C5 E5 - - A5 - G5 - E5 - - - - F5 - - E5 D5 - - F5 - E5 - C5 - - - -' },
    { welle: 'rauschen', laut: .13, laenge: .06, noten: 'X - X - X - X X X - X - X - X X X - X - X - X X X - X - X - X X' },
  ] },
  kinderzimmer: { bpm: 108, spuren: [
    { welle: 'sine', laut: .4, laenge: .5, noten: 'C3 - G3 - E3 - G3 - F3 - A3 - F3 - A3 - G3 - B3 - G3 - B3 - C3 - G3 - E3 - G3 -' },
    { welle: 'triangle', laut: .3, laenge: .4, noten: 'E5 - G5 - C6 - G5 - F5 - A5 - C6 - A5 - D5 - G5 - B5 - G5 - E5 - G5 - C6 - - -' },
  ] },
  bett: { bpm: 80, spuren: [
    { welle: 'triangle', laut: .45, laenge: 1, noten: 'D2 - - - - - - - F2 - - - - - - - D2 - - - - - - - A2 - - - - - - -' },
    { welle: 'sine', laut: .2, laenge: .6, noten: '- - D5 - - F5 - - - - A5 - - - G5 - - - F5 - - D5 - - - - E5 - - - A4 -' },
  ] },
  garten: { bpm: 112, spuren: [
    { welle: 'triangle', laut: .45, laenge: .7, noten: 'G2 - - - D3 - - - E2 - - - B2 - - - C3 - - - G2 - - - D3 - - - D3 - - -' },
    { welle: 'square', laut: .14, laenge: .5, noten: 'B4 - D5 - G5 - - B5 - A5 - G5 - E5 - - - C5 - E5 - G5 - - E5 - D5 - - - - - -' },
    { welle: 'sine', laut: .2, laenge: .3, noten: '- - G4 - - - G4 - - - E4 - - - E4 - - - C4 - - - C4 - - - D4 - - - D4 -' },
  ] },
  trommel: { bpm: 140, spuren: [
    { welle: 'sawtooth', laut: .32, laenge: .4, noten: 'E2 - E2 - E2 - G2 - E2 - E2 - Bb2 - A2 - E2 - E2 - E2 - G2 - C3 - B2 - Bb2 - A2 -' },
    { welle: 'square', laut: .16, laenge: .3, noten: 'E5 - - - - - E5 - G5 - - - Bb5 - A5 - E5 - - - - - E5 - C6 - B5 - Bb5 - A5 - - -' },
    { welle: 'rauschen', laut: .16, laenge: .07, noten: 'X - - - X - - - X - - - X - X - X - - - X - - - X - - - X - X X' },
  ] },
  ende: { bpm: 84, spuren: [
    { welle: 'triangle', laut: .5, laenge: 1, noten: 'C3 - - - - - - - A2 - - - - - - - F2 - - - - - - - G2 - - - - - - -' },
    { welle: 'sine', laut: .25, laenge: .7, noten: 'E5 - - - G5 - - - C6 - - - E5 - - - A5 - - - - - G5 - - - F5 - - - - - - -' },
  ] },
};

export class Audio {
  constructor() {
    this.ctx = null; this.musikLaut = .6; this.sfxLaut = .8;
    this.lied = null; this.liedName = null; this.schritt = 0; this.naechsteZeit = 0; this.timer = null;
  }
  start() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = .9; this.master.connect(this.ctx.destination);
    this.musikGain = this.ctx.createGain(); this.musikGain.gain.value = this.musikLaut; this.musikGain.connect(this.master);
    this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = this.sfxLaut; this.sfxGain.connect(this.master);
    const n = this.ctx.sampleRate * 2; const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this.rauschen = buf;
    if (this.liedName) this.spieleMusik(this.liedName, true);
  }
  setzeUnterwasser(an) { this.unterwasser = an; }
  setzeLautstaerke(musik, sfx) {
    this.musikLaut = musik; this.sfxLaut = sfx;
    if (this.musikGain) this.musikGain.gain.value = musik;
    if (this.sfxGain) this.sfxGain.gain.value = sfx;
  }

  // ---- Effekte ----
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
  rausch({ dauer = .1, laut = .3, start = 0, filter = 2000, typ = 'lowpass', ziel = null }) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + start;
    const s = this.ctx.createBufferSource(); s.buffer = this.rauschen;
    const f = this.ctx.createBiquadFilter(); f.type = typ; f.frequency.value = filter;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(laut, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
    s.connect(f); f.connect(g); g.connect(ziel || this.sfxGain); s.start(t); s.stop(t + dauer + .02);
  }
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
      case 'quietsch': // Hundespielzeug
        this.ton({ welle: 'sawtooth', f0: 1400, f1: 900, dauer: .12, laut: .22 });
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
    while (this.naechsteZeit < this.ctx.currentTime + .15) {
      for (const sp of this.spuren) {
        const n = sp.schritte[this.schritt % sp.schritte.length];
        if (n === '-') continue;
        const start = this.naechsteZeit - this.ctx.currentTime;
        const dauer = this.schrittDauer * 4 * sp.laenge;
        if (sp.welle === 'rauschen') this.rausch({ dauer: Math.max(.03, dauer), laut: sp.laut, start, filter: 6000, typ: 'highpass', ziel: this.musikGain });
        else this.ton({ welle: sp.welle, f0: frequenz(n), dauer, laut: sp.laut, start, ziel: this.musikGain });
      }
      this.naechsteZeit += this.schrittDauer; this.schritt++;
    }
  }
}
