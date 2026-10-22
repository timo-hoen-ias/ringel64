// Dialogbox mit Schreibmaschineneffekt. Blockiert die Spielersteuerung, solange sie offen ist.
export class Dialog {
  constructor(spiel) {
    this.spiel = spiel;
    this.el = document.getElementById('dialog');
    this.nameEl = this.el.querySelector('.name');
    this.inhaltEl = this.el.querySelector('.inhalt');
    this.zeilen = []; this.index = 0; this.offen = false; this.zeichen = 0; this.timer = 0; this.danach = null;
  }
  zeige(zeilen, danach = null) {
    if (!zeilen || !zeilen.length) { danach && danach(); return; }
    this.zeilen = zeilen; this.index = 0; this.danach = danach; this.offen = true; this.el.style.display = 'block';
    this.spiel.eingabe.gesperrt = true;
    this.starteZeile();
  }
  starteZeile() {
    const z = this.zeilen[this.index];
    this.nameEl.textContent = z.name || ''; this.inhaltEl.textContent = ''; this.zeichen = 0; this.timer = 0;
  }
  update(dt) {
    if (!this.offen) { this.geradeGeschlossen = false; return; }
    const z = this.zeilen[this.index];
    if (this.zeichen < z.text.length) {
      this.timer += dt;
      while (this.timer > .022 && this.zeichen < z.text.length) {
        this.timer -= .022; this.zeichen++;
        if (this.zeichen % 3 === 0) this.spiel.audio.sfx('dialog');
      }
      this.inhaltEl.textContent = z.text.slice(0, this.zeichen);
    }
    if (this.spiel.eingabe.gedrueckt('aktion') || this.spiel.eingabe.gedrueckt('springen')) {
      if (this.zeichen < z.text.length) { this.zeichen = z.text.length; this.inhaltEl.textContent = z.text; return; }
      this.index++;
      if (this.index >= this.zeilen.length) this.schliesse(); else this.starteZeile();
    }
  }
  schliesse() {
    this.offen = false; this.geradeGeschlossen = true; this.el.style.display = 'none';
    this.spiel.eingabe.gesperrt = false;
    const d = this.danach; this.danach = null;
    d && d();
  }
  // Beim Levelwechsel ohne Folgeaktion schließen
  abbrechen() { if (!this.offen) return; this.danach = null; this.schliesse(); }
}
