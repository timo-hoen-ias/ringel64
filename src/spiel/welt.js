import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';
import { Bauer } from '../engine/bau.js';
import { Partikel } from '../engine/partikel.js';
import { aktiviereSchatten } from '../engine/texturen.js';
import { Spieler } from './spieler.js';

// Eine geladene Welt (Hub oder Level): Szene, Licht, Kollider, Entitäten, Spieler.
export class Welt {
  constructor(spiel, schluessel, modul, herkunft = null) {
    this.spiel = spiel; this.schluessel = schluessel; this.info = modul.info;
    this.scene = new THREE.Scene();
    this.kollider = []; this.dinge = []; this.sammel = []; this.gegner = []; this.npcs = []; this.haken = [];
    this.checkpoints = []; this.portale = []; this.benutzbar = []; this.klammerIds = [];
    this.t = 0;
    const info = this.info;
    this.scene.background = new THREE.Color(info.himmel || '#87b7e8');
    if (info.nebel) this.scene.fog = new THREE.Fog(info.nebel.farbe || info.himmel || '#87b7e8', info.nebel.nah ?? 20, info.nebel.fern ?? 70);
    const l = info.licht || {};
    this.scene.add(new THREE.HemisphereLight(l.himmel || 0xffffff, l.boden || 0x6a6a7a, (l.intensitaet ?? 1.0) * .9));
    this.scene.add(new THREE.AmbientLight(0xffffff, .12));
    // Sonne mit Schatten, folgt dem Spieler
    const sonne = new THREE.DirectionalLight(l.sonne || 0xfff1d6, (l.sonneIntensitaet ?? 1.4) * 1.1);
    this.sonnenRichtung = new THREE.Vector3(...(l.richtung || [5, 10, 4])).normalize();
    sonne.castShadow = spiel.renderer.schatten; sonne.shadow.mapSize.set(2048, 2048);
    const sk = sonne.shadow.camera; sk.left = -42; sk.right = 42; sk.top = 42; sk.bottom = -42; sk.near = 1; sk.far = 160;
    sonne.shadow.bias = -0.0006; sonne.shadow.normalBias = .06; sonne.shadow.radius = 3;
    this.scene.add(sonne); this.scene.add(sonne.target); this.sonne = sonne;
    this.partikel = new Partikel(this.scene);
    this.bauer = new Bauer(this);
    if (info.aussen) {
      this.bauer.himmel(info.aussen.himmel || {});
      if (info.aussen.wolken !== false) this.bauer.wolken(info.aussen.wolken || {});
      if (info.aussen.sonne !== false) this.bauer.sonne({ richtung: l.richtung || [5, 10, 4], farbe: info.aussen.sonnenFarbe });
    }
    const spawn = (modul.spawnVon && herkunft && modul.spawnVon(herkunft)) || info.spawn || [0, 1, 0];
    this.spieler = new Spieler(this, new THREE.Vector3(...spawn));
    this.spieler.yaw = info.spawnYaw ?? 0;
    this.spieler.stampfLandung = 0;
    modul.baue(this, this.bauer);
    this.spieler.checkpoint.copy(this.spieler.pos);
    for (const k of this.kollider) k.aktualisiere();
    aktiviereSchatten(this.scene);
    this.aktualisiereLicht();
  }
  fuegeKollider(k) { this.kollider.push(k); return k; }
  entferneKollider(k) { const i = this.kollider.indexOf(k); if (i >= 0) this.kollider.splice(i, 1); }
  // Benutzbare Stelle (E drücken)
  benutzbarStelle({ x, y, z, radius = 2.2, text, beiBenutzen, aktiv }) {
    const b = { pos: new THREE.Vector3(x, y, z), radius, text, beiBenutzen, aktiv: aktiv || (() => true) };
    this.benutzbar.push(b); return b;
  }
  aktualisiereLicht() {
    const p = this.spieler.pos;
    this.sonne.target.position.copy(p);
    this.sonne.position.copy(p).addScaledVector(this.sonnenRichtung, 70);
    if (this.himmelKuppel) this.himmelKuppel.position.copy(this.spiel.renderer.kamera.position);
  }

  update(dt, eingabe, kamera) {
    this.t += dt;
    for (const d of [...this.dinge]) d.update(dt);
    const sp = this.spieler;
    sp.update(dt, eingabe, kamera);
    kamera.update(dt, sp, eingabe, this);
    this.aktualisiereLicht();
    let hinweis = sp.hinweis;
    // Checkpoints
    for (const c of this.checkpoints) {
      if (!c.aktiv && c.pos.distanceTo(sp.pos) < 1.6) {
        for (const o of this.checkpoints) { o.aktiv = false; o.fahne.material = o.fahne.material.clone(); o.fahne.material.color.set('#9b8fa0'); }
        c.aktiv = true; c.fahne.material = c.fahne.material.clone(); c.fahne.material.color.set('#e8474c'); sp.checkpoint.copy(c.pos).setY(c.pos.y + .1);
        this.spiel.audio.sfx('knopf'); this.spiel.hud.popup('Checkpoint!'); this.partikel.spawn(c.pos.clone().setY(c.pos.y + 2), { anzahl: 8, farbe: 0xe8474c, geschwindigkeit: 2 });
      }
      c.fahne.rotation.y = Math.sin(this.t * 4 + c.pos.x) * .2;
    }
    // Portale (Wäschekörbe)
    for (const p of this.portale) {
      p.innen.rotation.y += dt;
      const d = sp.pos.distanceTo(p.pos);
      if (d < 2.6 && sp.pos.y > p.pos.y - .6 && sp.pos.y < p.pos.y + 1.5) {
        const st = this.spiel.spielstand.daten;
        if (p.benoetigt > st.klammern) { hinweis = `Verschlossen: ${p.benoetigt} Klammern nötig (du hast ${st.klammern})`; if (d < 1.9) { sp.rueckstoss(p.pos, 7, 6); this.spiel.audio.sfx('fehler'); } }
        else if (!this.spiel.wechselt) { this.spiel.ladeLevel(p.ziel, this.schluessel); }
      }
    }
    // NPCs und benutzbare Stellen
    if (!this.spiel.dialog.offen && !this.spiel.dialog.geradeGeschlossen) {
      let naechster = null, nd = 99;
      for (const n of this.npcs) { if (n.inReichweite) { const d = n.gruppe.position.distanceTo(sp.pos); if (d < nd) { nd = d; naechster = n; } } }
      let stelle = null;
      for (const b of this.benutzbar) { if (b.aktiv() && b.pos.distanceTo(sp.pos) < b.radius) { stelle = b; break; } }
      if (naechster) { hinweis = `E / Y: Mit ${naechster.name} reden`; if (eingabe.gedrueckt('aktion')) naechster.sprich(); }
      else if (stelle) { hinweis = stelle.text; if (eingabe.gedrueckt('aktion')) stelle.beiBenutzen(); }
    }
    this.spiel.hud.setzeHinweis(hinweis);
    for (const k of this.kollider) if (k.beweglich) k.vorher.copy(k.mat);
    this.partikel.update(dt);
    const unterWasser = sp.inWasser && sp.pos.y + 1.0 < sp.wasserOberflaeche;
    this.spiel.audio.setzeUnterwasser(unterWasser); this.spiel.renderer.setzeUnterwasser(unterWasser);
    this.info.update && this.info.update(this, dt);
  }
  dispose() {
    this.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  }
}
