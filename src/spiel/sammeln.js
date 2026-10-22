import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';
import { material, faerbe } from '../engine/texturen.js';
import { baueSocke, OUTFITS } from './sockenmodell.js';

const _tmp = new THREE.Vector3();

class Sammelobjekt {
  constructor(welt, id, pos, radius = 1.0) {
    this.welt = welt; this.id = id; this.pos = pos.clone(); this.radius = radius; this.t = Math.random() * 6; this.weg = false;
    this.gruppe = new THREE.Group(); this.gruppe.position.copy(pos);
    if (welt.spiel.spielstand.istGesammelt(id)) { this.weg = true; return; }
    welt.scene.add(this.gruppe); welt.sammel.push(this); welt.dinge.push(this);
  }
  update(dt) {
    if (this.weg) return;
    this.t += dt;
    this.animiere(dt);
    const sp = this.welt.spieler;
    if (!sp) return;
    if (this.gruppe.position.distanceTo(sp.mitte) < this.radius + .5) this.einsammeln();
  }
  animiere() {}
  entferne() {
    this.weg = true; this.welt.scene.remove(this.gruppe);
    this.welt.sammel.splice(this.welt.sammel.indexOf(this), 1);
    this.welt.dinge.splice(this.welt.dinge.indexOf(this), 1);
  }
}

// Goldene Wäscheklammer: Hauptziel
export class Klammer extends Sammelobjekt {
  constructor(welt, id, pos, name = '') {
    super(welt, id, pos, 1.1); this.name = name;
    if (!welt.klammerIds.includes(id)) welt.klammerIds.push(id);
    if (this.weg) return;
    const gold = '#ffd25a';
    for (const s of [-1, 1]) {
      const h = new THREE.Mesh(faerbe(new THREE.BoxGeometry(.22, 1.3, .32), gold), material(gold, { emissive: 0x332200 }));
      h.position.set(s * .14, .65, 0); h.rotation.z = s * .12; this.gruppe.add(h);
    }
    const feder = new THREE.Mesh(new THREE.TorusGeometry(.2, .06, 6, 10), material('#c0c0c0', { vertexColors: false }));
    feder.position.set(0, .75, 0); feder.rotation.y = Math.PI / 2; this.gruppe.add(feder);
    const licht = new THREE.PointLight(0xffd25a, .6, 5); licht.position.y = .8; this.gruppe.add(licht);
  }
  animiere(dt) { this.gruppe.rotation.y += dt * 2; this.gruppe.position.y = this.pos.y + Math.sin(this.t * 2) * .2; }
  einsammeln() {
    this.entferne();
    const sp = this.welt.spiel;
    sp.spielstand.sammle(this.id, 'klammer');
    sp.audio.sfx('klammer'); sp.renderer.blitz(.35);
    sp.hud.popup(this.name ? `Goldene Wäscheklammer! (${this.name})` : 'Goldene Wäscheklammer!');
    this.welt.partikel.spawn(this.gruppe.position, { anzahl: 24, farbe: [0xffd25a, 0xffffff, 0xffa030], geschwindigkeit: 5, leben: .9 });
    this.welt.spieler.jubel(1.2);
    sp.hud.aktualisiere();
  }
}

// Flusen: Münzen. 100 Stück = ein Extraleben.
export class Fussel extends Sammelobjekt {
  constructor(welt, id, pos) {
    super(welt, id, pos, .8);
    if (this.weg) return;
    const m = new THREE.Mesh(faerbe(new THREE.DodecahedronGeometry(.22, 0), '#d8d2e0', { variation: .25 }), material('#d8d2e0'));
    m.position.y = .35; this.gruppe.add(m); this.m = m;
    for (let i = 0; i < 4; i++) { const h = new THREE.Mesh(new THREE.BoxGeometry(.03, .14, .03), material('#bdb5c8', { vertexColors: false }));
      const a = i / 4 * Math.PI * 2 + .4; h.position.set(Math.cos(a) * .2, .4, Math.sin(a) * .2); h.rotation.z = Math.cos(a); h.rotation.x = Math.sin(a); this.gruppe.add(h); }
  }
  animiere(dt) { this.gruppe.rotation.y += dt * 1.5; this.gruppe.position.y = this.pos.y + Math.sin(this.t * 3) * .1; }
  einsammeln() {
    this.entferne();
    const sp = this.welt.spiel;
    const vorher = sp.spielstand.daten.flusen;
    sp.spielstand.sammle(this.id, 'fussel');
    sp.audio.sfx('fussel');
    this.welt.partikel.spawn(this.gruppe.position, { anzahl: 5, farbe: 0xd8d2e0, geschwindigkeit: 2, leben: .4, groesse: .08 });
    if (Math.floor(sp.spielstand.daten.flusen / 100) > Math.floor(vorher / 100)) {
      sp.spielstand.daten.leben++; sp.spielstand.speichere(); sp.audio.sfx('leben'); sp.hud.popup('100 Flusen: Extraleben!');
    }
    sp.hud.aktualisiere();
  }
}

// Verlorene Socke: wird gerettet und zieht in den Waschkeller.
export class Socke extends Sammelobjekt {
  constructor(welt, id, pos, { name, farbe, partner }) {
    super(welt, id, pos, 1.2);
    this.name = name; this.farbe = farbe; this.partner = partner;
    if (this.weg) return;
    const outfit = { name, farbe, streifen: '#fff6e5', breite: 6 };
    const s = baueSocke({ outfit, groesse: .9, muede: true });
    this.gruppe.add(s.gruppe); this.modell = s;
    // Tränchen
    const t = new THREE.Mesh(new THREE.SphereGeometry(.05, 6, 4), new THREE.MeshBasicMaterial({ color: 0x8fd3ff }));
    t.position.set(.2, .85, .3); this.gruppe.add(t); this.traene = t;
  }
  animiere(dt) {
    this.modell.bein.rotation.z = Math.sin(this.t * 1.2) * .06;
    this.traene.position.y = .85 - ((this.t * .8) % 1) * .3;
    if (this.welt.spieler) { _tmp.subVectors(this.welt.spieler.pos, this.gruppe.position); const w = Math.atan2(_tmp.x, _tmp.z);
      this.gruppe.rotation.y += (w - this.gruppe.rotation.y) * Math.min(1, dt * 3); }
  }
  einsammeln() {
    this.entferne();
    const sp = this.welt.spiel;
    sp.spielstand.rette(this.id, this.name, this.partner, this.farbe);
    sp.audio.sfx('socke');
    this.welt.partikel.spawn(this.gruppe.position, { anzahl: 18, farbe: [0xff6fa8, 0xffffff], geschwindigkeit: 3, leben: 1.2, gravitation: 2 });
    sp.hud.aktualisiere();
    this.welt.spieler.jubel(1.2);
    const spruch = ['Endlich! Ich dachte, ich bleibe ewig hier liegen.', 'Du riechst ... interessant. Aber danke!', 'Ist mein Partner wirklich noch da? Ich zieh sofort in den Keller!',
      'Ohne Partner ist man nur ein halber Mensch. Äh, halbe Socke.', 'Ein Loch im Zeh? Das ist ein Fenster zur Welt, sagt man.'];
    sp.dialog.zeige([{ name: this.name, text: spruch[Math.floor(Math.random() * spruch.length)] },
      { name: 'Flusi', text: `${this.name} wartet jetzt im Waschkeller auf ${this.partner}.` }]);
  }
}

// Knopf: schaltet ein Outfit frei
export class Knopf extends Sammelobjekt {
  constructor(welt, id, pos, outfit) {
    super(welt, id, pos, .9); this.outfit = outfit;
    if (this.weg) return;
    const farbe = ['#3b6fd8', '#3a9a4a', '#c8c0ac', '#f5d44a', '#2b2b35', '#ff6b6b', '#f0c040'][(outfit - 1) % 7];
    const d = new THREE.Mesh(faerbe(new THREE.CylinderGeometry(.4, .4, .1, 14), farbe), material(farbe));
    d.rotation.x = Math.PI / 2; d.position.y = .5; this.gruppe.add(d);
    for (const [x, y] of [[-.12, .62], [.12, .62], [-.12, .38], [.12, .38]]) {
      const l = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .14, 6), new THREE.MeshBasicMaterial({ color: 0x2a1a2e }));
      l.rotation.x = Math.PI / 2; l.position.set(x, y, 0); this.gruppe.add(l);
    }
  }
  animiere(dt) { this.gruppe.rotation.y += dt * 1.8; this.gruppe.position.y = this.pos.y + Math.sin(this.t * 2.5) * .15; }
  einsammeln() {
    this.entferne();
    const sp = this.welt.spiel;
    sp.spielstand.sammle(this.id, 'knopf', this.outfit);
    sp.audio.sfx('knopf');
    sp.hud.popup(`Knopf! Neues Outfit: ${OUTFITS[this.outfit].name} (Pause-Menü)`);
    this.welt.partikel.spawn(this.gruppe.position, { anzahl: 14, farbe: 0xffffff, geschwindigkeit: 3 });
    sp.hud.aktualisiere();
  }
}
