import { Renderer, GRAFIK_STUFEN } from '../engine/renderer.js';
import { Eingabe } from '../engine/eingabe.js';
import { Audio } from '../engine/audio.js';
import { Spielstand } from './spielstand.js';
import { HUD, zufallsTipp } from '../ui/hud.js';
import { Dialog } from '../ui/dialog.js';
import { Kamera } from './kamera.js';
import { Welt } from './welt.js';
import { OUTFITS } from './sockenmodell.js';
import { LEVELS } from '../levels/index.js';

// Spielzustände: titel → uebergang → spiel ⇄ pause, dazu dialog (im Spiel) und ende.
export class Spiel {
  constructor() {
    const canvas = document.getElementById('spiel');
    this.renderer = new Renderer(canvas);
    this.eingabe = new Eingabe(canvas);
    this.audio = new Audio();
    this.spielstand = new Spielstand();
    this.hud = new HUD(this);
    this.dialog = new Dialog(this);
    this.kamera = new Kamera(this.renderer.kamera);
    this.welt = null; this.zustand = 'titel'; this.wechselt = false; this.letzteZeit = performance.now();
    this.eingabe.beiErsterGeste.push(() => this.audio.start());
    this.ui = {
      titel: document.getElementById('titel'), uebergang: document.getElementById('uebergang'), pause: document.getElementById('pause'),
      ende: document.getElementById('ende'), blende: document.getElementById('blende'),
    };
    this.bindeUI();
    this.audio.liedName = 'titel';
  }
  bindeUI() {
    const start = document.getElementById('btn-start');
    if (!this.spielstand.existiert) start.textContent = 'SPIEL STARTEN';
    start.addEventListener('click', () => this.starte());
    const neu = document.getElementById('btn-neu'); let neuBestaetigen = 0;
    neu.addEventListener('click', () => {
      if (!this.spielstand.existiert || performance.now() - neuBestaetigen < 4000) { this.spielstand.neu(); this.starte(); return; }
      neuBestaetigen = performance.now(); neu.textContent = 'WIRKLICH LÖSCHEN? NOCHMAL KLICKEN';
      setTimeout(() => { neu.textContent = 'NEUES SPIEL'; }, 4000);
    });
    document.getElementById('btn-weiter').addEventListener('click', () => this.pauseEnde());
    document.getElementById('btn-hub').addEventListener('click', () => { this.pauseEnde(); if (this.welt && this.welt.schluessel !== 'hub') this.ladeLevel('hub', this.welt.schluessel); });
    document.getElementById('btn-ende-weiter').addEventListener('click', () => { this.ui.ende.style.display = 'none'; this.ladeLevel('hub', 'trommel'); });
    const g = document.getElementById('pause-grafik');
    const NAMEN = { weich: 'Weich', hoch: 'Hoch', retro: 'Retro (N64)' };
    const zeichneGrafik = () => { g.innerHTML = ''; for (const st of GRAFIK_STUFEN) { const el = document.createElement('div'); el.className = 'outfit' + (this.renderer.stufe === st ? ' aktiv' : ''); el.textContent = NAMEN[st];
      el.addEventListener('click', () => { this.renderer.setzeStufe(st); zeichneGrafik(); }); g.appendChild(el); } };
    zeichneGrafik();
    const ml = document.getElementById('musik-laut'), sl = document.getElementById('sfx-laut');
    const laut = () => { this.audio.setzeLautstaerke(ml.value / 100, sl.value / 100); try { localStorage.setItem('ringel64.laut', JSON.stringify([ml.value, sl.value])); } catch (e) {} };
    try { const l = JSON.parse(localStorage.getItem('ringel64.laut') || 'null'); if (l) { ml.value = l[0]; sl.value = l[1]; } } catch (e) {}
    ml.addEventListener('input', laut); sl.addEventListener('input', laut); laut();
  }
  starte() {
    this.audio.start();
    this.ui.titel.style.display = 'none';
    this.ladeLevel(this.spielstand.daten.level || 'hub', null);
  }
  // Level laden mit Ladebildschirm und Flusi-Tipp
  ladeLevel(schluessel, herkunft) {
    if (this.wechselt) return;
    this.wechselt = true; this.zustand = 'uebergang';
    this.dialog.abbrechen();
    const modul = LEVELS[schluessel];
    this.audio.sfx('tuer');
    const u = this.ui.uebergang;
    u.querySelector('.zieltitel').textContent = modul.info.name;
    u.querySelector('.tipp').textContent = modul.info.tipp || zufallsTipp();
    u.style.display = 'flex'; this.hud.zeige(false); this.hud.setzeHinweis('');
    this.audio.stoppeMusik();
    setTimeout(() => {
      if (this.welt) this.welt.dispose();
      this.welt = new Welt(this, schluessel, modul, herkunft);
      this.kamera.setze(this.welt.spieler, modul.info.kamera || {});
      this.spielstand.daten.level = schluessel === 'trommel' ? 'hub' : schluessel; this.spielstand.speichere();
      this.hud.aktualisiere(); this.hud.zeige(true);
      this.audio.spieleMusik(modul.info.musik || 'hub');
      this.zustand = 'spiel';
      // Bild einen Moment stehen lassen, dann Übergang ausblenden
      setTimeout(() => { u.style.display = 'none'; this.wechselt = false; modul.info.beiStart && modul.info.beiStart(this.welt); }, 500);
    }, 1500);
  }
  pauseStart() {
    if (this.zustand !== 'spiel') return;
    this.zustand = 'pause'; this.ui.pause.style.display = 'flex';
    const d = this.spielstand.daten;
    const min = Math.floor(d.spielzeit / 60);
    document.getElementById('pause-statistik').innerHTML =
      `Klammern ${d.klammern} / 44 · Flusen ${d.flusen} · Socken gerettet ${d.socken} / 18 · Knöpfe ${d.knoepfe} / 7<br>Spielzeit ${min} min · Leben ${d.leben}`;
    const o = document.getElementById('pause-outfits'); o.innerHTML = '';
    OUTFITS.forEach((f, i) => {
      const frei = d.outfits.includes(i);
      const el = document.createElement('div'); el.className = 'outfit' + (i === d.outfit ? ' aktiv' : '') + (frei ? '' : ' gesperrt');
      el.textContent = frei ? f.name : '???';
      el.addEventListener('click', () => { if (!frei) return; d.outfit = i; this.spielstand.speichere(); this.welt.spieler.baueModell(); this.audio.sfx('knopf'); this.pauseStart(); });
      o.appendChild(el);
    });
  }
  pauseEnde() { if (this.zustand !== 'pause') return; this.zustand = 'spiel'; this.ui.pause.style.display = 'none'; }

  // Abspann nach dem Baron
  zeigeEnde() {
    this.zustand = 'ende'; this.audio.spieleMusik('ende');
    const d = this.spielstand.daten; d.ende = true; this.spielstand.speichere();
    document.getElementById('ende-text').innerHTML = `
      <p>Baron von Trommel hat nie aus Bosheit geklaut. Seine Heizspirale war kaputt, ihm war kalt,<br>und aus den Socken wollte er sich einen Pullover stricken.</p>
      <p>Ringel hat die Spirale repariert. Der Baron ist jetzt der Wärmespender des Waschkellers<br>und brummt zufrieden vor sich hin. Ringelinde ist wieder da.</p>
      <p>Klammern: ${d.klammern} / 44 · Socken gerettet: ${d.socken} / 18 · Flusen: ${d.flusen} · Outfits: ${d.outfits.length} / 8</p>
      <p style="color:var(--gold)">Ringel 64 · Flusi · Gunther die Fliege · Alle Socken dieser Welt</p>
      <p style="opacity:.7">Ein Spiel aus Boxen, Zylindern und viel zu viel Fussel.</p>`;
    this.ui.ende.style.display = 'flex';
  }

  schleife() {
    const jetzt = performance.now();
    let dt = Math.min(.05, (jetzt - this.letzteZeit) / 1000); this.letzteZeit = jetzt;
    this.eingabe.frameBeginn();
    if (this.zustand === 'titel') {
      if (this.eingabe.gedrueckt('aktion') || this.eingabe.gedrueckt('springen')) this.starte();
    } else if (this.zustand === 'spiel') {
      if (this.eingabe.gedrueckt('pause')) this.pauseStart();
      else {
        this.dialog.update(dt);
        this.welt.update(this.dialog.offen ? dt * 1 : dt, this.eingabe, this.kamera);
        this.spielstand.daten.spielzeit += dt;
      }
    } else if (this.zustand === 'pause') {
      if (this.eingabe.gedrueckt('pause')) this.pauseEnde();
    } else if (this.zustand === 'uebergang') {
      if (this.welt) this.welt.update(0, this.eingabe, this.kamera);
    }
    if (this.welt) this.renderer.zeichne(this.welt.scene, dt);
    this.eingabe.frameEnde();
    requestAnimationFrame(() => this.schleife());
  }
}
