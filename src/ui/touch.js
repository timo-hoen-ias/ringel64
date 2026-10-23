// Touch-Steuerung: Joystick links, Kamera-Wischen rechts, Aktionstasten, Pause.
// Schreibt in eingabe.touch; die Eingabe-Klasse mischt das mit Tastatur und Gamepad.
export class TouchSteuerung {
  constructor(spiel) {
    this.spiel = spiel; this.eingabe = spiel.eingabe;
    this.el = document.getElementById('touch');
    this.stick = { id: null, basis: null, x: 0, y: 0 };
    this.kamera = { id: null, x: 0, y: 0 };
    this.baue();
    let an = this.istTouchGeraet();
    try { const g = localStorage.getItem('ringel64.touch'); if (g !== null) an = g === '1'; } catch (e) { /* egal */ }
    this.setzeAktiv(an);
  }
  istTouchGeraet() {
    return (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  }
  setzeAktiv(an) {
    this.aktiv = an; this.el.hidden = !an || this.spiel.zustand !== 'spiel'; document.body.classList.toggle('touch-aktiv', an);
    try { localStorage.setItem('ringel64.touch', an ? '1' : '0'); } catch (e) { /* egal */ }
    if (!an) { this.eingabe.touch.achse.x = 0; this.eingabe.touch.achse.y = 0; this.eingabe.touch.gehalten.clear(); }
  }
  // Sichtbar nur im Spiel (nicht auf Titel, Pause, Abspann)
  zeige(an) { this.el.hidden = !(this.aktiv && an); }
  baue() {
    const el = this.el;
    const fange = (ziel, e) => { try { ziel.setPointerCapture(e.pointerId); } catch (err) { /* synthetische Zeiger */ } };
    el.innerHTML = `
      <div class="touch-zone links" id="touch-stick-zone"><div class="stick-basis" id="stick-basis"><div class="stick-knopf" id="stick-knopf"></div></div></div>
      <div class="touch-zone rechts" id="touch-kamera-zone"></div>
      <div class="touch-tasten">
        <button class="taste y" data-aktion="aktion"><span>Y</span><small>Reden</small></button>
        <button class="taste x" data-aktion="zug"><span>X</span><small>Zug</small></button>
        <button class="taste b" data-aktion="stampf"><span>B</span><small>Stampf</small></button>
        <button class="taste a" data-aktion="springen"><span>A</span><small>Sprung</small></button>
      </div>
      <button class="taste pause" data-aktion="pause">II</button>`;
    const stickZone = el.querySelector('#touch-stick-zone'), basis = el.querySelector('#stick-basis'), knopf = el.querySelector('#stick-knopf');
    const R = 52;
    // Joystick: erscheint dort, wo der Finger aufsetzt
    stickZone.addEventListener('pointerdown', e => {
      if (this.stick.id !== null) return;
      this.stick.id = e.pointerId; this.stick.basis = { x: e.clientX, y: e.clientY };
      basis.style.left = e.clientX + 'px'; basis.style.top = e.clientY + 'px'; basis.classList.add('aktiv');
      fange(stickZone, e); this.eingabe.aktiv(); e.preventDefault();
    });
    const bewege = e => {
      if (e.pointerId !== this.stick.id) return;
      let dx = e.clientX - this.stick.basis.x, dy = e.clientY - this.stick.basis.y;
      const l = Math.hypot(dx, dy); if (l > R) { dx *= R / l; dy *= R / l; }
      knopf.style.transform = `translate(${dx}px, ${dy}px)`;
      const n = Math.min(1, l / R); const staerke = n < .12 ? 0 : (n - .12) / .88;
      this.eingabe.touch.achse.x = l > 0 ? dx / l * staerke : 0;
      this.eingabe.touch.achse.y = l > 0 ? -dy / l * staerke : 0;
      this.eingabe.aktiv();
    };
    const loslassen = e => {
      if (e.pointerId !== this.stick.id) return;
      this.stick.id = null; basis.classList.remove('aktiv'); knopf.style.transform = '';
      this.eingabe.touch.achse.x = 0; this.eingabe.touch.achse.y = 0;
    };
    stickZone.addEventListener('pointermove', bewege); stickZone.addEventListener('pointerup', loslassen); stickZone.addEventListener('pointercancel', loslassen);
    // Kamera: Wischen in der rechten Zone
    const kamZone = el.querySelector('#touch-kamera-zone');
    kamZone.addEventListener('pointerdown', e => { if (this.kamera.id !== null) return; this.kamera.id = e.pointerId; this.kamera.x = e.clientX; this.kamera.y = e.clientY; fange(kamZone, e); this.eingabe.aktiv(); e.preventDefault(); });
    kamZone.addEventListener('pointermove', e => { if (e.pointerId !== this.kamera.id) return;
      this.eingabe.touch.kamera.x += e.clientX - this.kamera.x; this.eingabe.touch.kamera.y += e.clientY - this.kamera.y; this.kamera.x = e.clientX; this.kamera.y = e.clientY; this.eingabe.aktiv(); });
    const kamEnde = e => { if (e.pointerId === this.kamera.id) this.kamera.id = null; };
    kamZone.addEventListener('pointerup', kamEnde); kamZone.addEventListener('pointercancel', kamEnde);
    // Tasten: gedrückt halten zählt als gehalten (Gleiten, Abtauchen)
    for (const t of el.querySelectorAll('.taste')) {
      const aktion = t.dataset.aktion;
      t.addEventListener('pointerdown', e => { e.preventDefault(); fange(t, e); t.classList.add('gedrueckt');
        this.eingabe.touch.gehalten.add(aktion); this.eingabe.touch.frisch.add(aktion); this.eingabe.aktiv(); });
      const los = () => { t.classList.remove('gedrueckt'); this.eingabe.touch.gehalten.delete(aktion); };
      t.addEventListener('pointerup', los); t.addEventListener('pointercancel', los); t.addEventListener('lostpointercapture', los);
      t.addEventListener('contextmenu', e => e.preventDefault());
    }
    // Dialog: Tippen auf die Box blättert weiter
    document.getElementById('dialog').addEventListener('pointerdown', e => { e.preventDefault(); this.eingabe.touch.frisch.add('aktion'); this.eingabe.aktiv(); });
  }
}
