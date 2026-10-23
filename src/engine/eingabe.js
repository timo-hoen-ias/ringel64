// Tastatur, Maus und Gamepad zusammengefasst zu benannten Aktionen.
const BELEGUNG = {
  links: ['KeyA'], rechts: ['KeyD'], vor: ['KeyW'], zurueck: ['KeyS'],
  kamLinks: ['ArrowLeft'], kamRechts: ['ArrowRight'], kamHoch: ['ArrowUp'], kamRunter: ['ArrowDown'],
  springen: ['Space', 'KeyK'],
  zug: ['ShiftLeft', 'ShiftRight', 'KeyJ'],
  stampf: ['ControlLeft', 'ControlRight', 'KeyL'],
  aktion: ['KeyE', 'Enter', 'NumpadEnter'],
  pause: ['Escape', 'KeyP'],
};
// Standard-Gamepad-Layout: A=0 B=1 X=2 Y=3, Start=9
const PAD = { springen: [0], stampf: [1], zug: [2], aktion: [3], pause: [9] };

export class Eingabe {
  constructor(canvas) {
    this.gehaltenTasten = new Set();
    this.frischTasten = new Set();
    this.padGehalten = new Set();
    this.padFrisch = new Set();
    this.padAchsen = [0, 0, 0, 0];
    this.maus = { x: 0, y: 0, aktiv: false };
    this.touch = { achse: { x: 0, y: 0 }, kamera: { x: 0, y: 0 }, gehalten: new Set(), frisch: new Set() };
    this.letzteAktivitaet = performance.now();
    this.beiErsterGeste = [];
    this.gesperrt = false;

    window.addEventListener('keydown', e => {
      if (e.repeat) return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      this.gehaltenTasten.add(e.code); this.frischTasten.add(e.code); this.aktiv();
    });
    window.addEventListener('keyup', e => this.gehaltenTasten.delete(e.code));
    window.addEventListener('blur', () => { this.gehaltenTasten.clear(); this.padGehalten.clear(); });

    canvas.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') return; this.maus.aktiv = true; canvas.setPointerCapture(e.pointerId); this.aktiv(); });
    canvas.addEventListener('pointerup', () => { this.maus.aktiv = false; });
    canvas.addEventListener('pointermove', e => {
      if (!this.maus.aktiv) return;
      this.maus.x += e.movementX; this.maus.y += e.movementY; this.aktiv();
    });
    ['keydown', 'pointerdown', 'touchstart'].forEach(ev =>
      window.addEventListener(ev, () => { this.beiErsterGeste.forEach(f => f()); this.beiErsterGeste = []; }, { once: false }));
  }

  aktiv() { this.letzteAktivitaet = performance.now(); }
  get ruheSekunden() { return (performance.now() - this.letzteAktivitaet) / 1000; }

  // Einmal pro Frame aufrufen: Gamepad lesen.
  frameBeginn() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = Array.from(pads).find(p => p && p.connected);
    this.padFrisch.clear();
    if (!pad) { this.padGehalten.clear(); this.padAchsen = [0, 0, 0, 0]; return; }
    for (let i = 0; i < pad.buttons.length; i++) {
      const an = pad.buttons[i].pressed;
      if (an && !this.padGehalten.has(i)) { this.padFrisch.add(i); this.aktiv(); }
      if (an) this.padGehalten.add(i); else this.padGehalten.delete(i);
    }
    const tot = v => Math.abs(v) < 0.22 ? 0 : v;
    this.padAchsen = [tot(pad.axes[0] || 0), tot(pad.axes[1] || 0), tot(pad.axes[2] || 0), tot(pad.axes[3] || 0)];
    if (this.padAchsen.some(a => a !== 0)) this.aktiv();
  }

  frameEnde() { this.frischTasten.clear(); this.touch.frisch.clear(); this.maus.x = 0; this.maus.y = 0; this.touch.kamera.x = 0; this.touch.kamera.y = 0; }

  gehalten(name) {
    if (this.gesperrt) return false;
    return (BELEGUNG[name] || []).some(c => this.gehaltenTasten.has(c)) || (PAD[name] || []).some(b => this.padGehalten.has(b)) || this.touch.gehalten.has(name);
  }
  gedrueckt(name) {
    if (this.gesperrt && name !== 'pause' && name !== 'aktion') return false;
    return (BELEGUNG[name] || []).some(c => this.frischTasten.has(c)) || (PAD[name] || []).some(b => this.padFrisch.has(b)) || this.touch.frisch.has(name);
  }

  // Bewegungsachse (x rechts, y vor), Länge <= 1
  achse() {
    if (this.gesperrt) return { x: 0, y: 0 };
    let x = (this.gehalten('rechts') ? 1 : 0) - (this.gehalten('links') ? 1 : 0);
    let y = (this.gehalten('vor') ? 1 : 0) - (this.gehalten('zurueck') ? 1 : 0);
    if (x === 0 && y === 0) { x = this.padAchsen[0]; y = -this.padAchsen[1]; }
    if (x === 0 && y === 0) { x = this.touch.achse.x; y = this.touch.achse.y; }
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    return { x, y };
  }

  kameraAchse() {
    let x = (this.gehalten('kamRechts') ? 1 : 0) - (this.gehalten('kamLinks') ? 1 : 0);
    let y = (this.gehalten('kamRunter') ? 1 : 0) - (this.gehalten('kamHoch') ? 1 : 0);
    if (x === 0 && y === 0) { x = this.padAchsen[2]; y = this.padAchsen[3]; }
    return { x: x * 2.4 + (this.maus.x + this.touch.kamera.x * .8) * 0.012 * 60, y: y * 1.4 + (this.maus.y + this.touch.kamera.y * .8) * 0.008 * 60 };
  }
}
