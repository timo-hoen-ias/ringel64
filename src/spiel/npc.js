import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';
import { material, faerbe, Texturen } from '../engine/texturen.js';
import { baueSocke, baueFigur } from './sockenmodell.js';
import { Klammer } from './sammeln.js';

const _tmp = new THREE.Vector3();

// Sprechblase über einem Objekt (Bosse, Gags)
export function zeigeBlase(welt, obj, text, dauer = 2.5, hoehe = 2) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: Texturen.sprechblase(text), transparent: true, depthTest: false }));
  s.scale.set(4, 1, 1); s.position.copy(obj.position); s.position.y += hoehe; welt.scene.add(s);
  let t = 0;
  const d = { update: dt => { t += dt; s.position.copy(obj.position); s.position.y += hoehe + Math.sin(t * 3) * .1;
    if (t > dauer) { welt.scene.remove(s); welt.dinge.splice(welt.dinge.indexOf(d), 1); } } };
  welt.dinge.push(d);
}

// Nicht-Spieler-Figur mit Dialog, optionaler Belohnung und Nase-Zuhalten-Gag.
export class NPC {
  constructor(welt, o) {
    this.welt = welt; this.o = o;
    this.name = o.name; this.pos = new THREE.Vector3(o.x, o.y, o.z);
    this.gruppe = new THREE.Group(); this.gruppe.position.copy(this.pos); this.gruppe.rotation.y = o.ry || 0;
    welt.scene.add(this.gruppe);
    this.ruheRotation = o.ry || 0;
    if (o.art === 'socke' || !o.art) {
      const outfit = { name: o.name, farbe: o.farbe || '#5fb7e8', streifen: o.streifen || '#fff6e5', breite: o.breite || 4 };
      this.modell = baueSocke({ outfit, groesse: o.groesse || 1 }); this.gruppe.add(this.modell.gruppe);
      this.kopfHoehe = 1.3 * (o.groesse || 1);
    } else {
      this.figur = baueFigur(o.art); this.figur.scale.setScalar(o.groesse || 1); this.gruppe.add(this.figur);
      this.kopfHoehe = (o.kopfHoehe || 1.4) * (o.groesse || 1);
    }
    // Hand zum Nase zuhalten
    if (o.naseZu !== false) {
      this.hand = new THREE.Group();
      const h = new THREE.Mesh(faerbe(new THREE.SphereGeometry(.12, 7, 6), o.handFarbe || '#f0c9a8'), material(o.handFarbe || '#f0c9a8'));
      this.hand.add(h);
      const arm = new THREE.Mesh(faerbe(new THREE.BoxGeometry(.07, .5, .07), o.handFarbe || '#f0c9a8'), material(o.handFarbe || '#f0c9a8'));
      arm.position.y = -.28; this.hand.add(arm);
      this.hand.position.set(.32, this.kopfHoehe * .55, .25); this.hand.visible = false; this.gruppe.add(this.hand);
    }
    this.t = Math.random() * 10; this.gesprochen = 0; this.inReichweite = false;
    this.belohnungId = `${welt.schluessel}:npc-${o.name}`;
    this.id = this.belohnungId;
    this.gesprochenFlag = `gespr-${welt.schluessel}-${o.name}`;
    welt.npcs.push(this); welt.dinge.push(this);
    if (o.belohnung === 'klammer') welt.klammerIds.push(this.belohnungId);
    if (o.tanzen) this.tanzen = true;
  }
  get aktiv() { return this.o.aktiv ? this.o.aktiv() : true; }
  update(dt) {
    this.t += dt;
    const sp = this.welt.spieler; if (!sp) return;
    const d = this.gruppe.position.distanceTo(sp.pos);
    const nah = d < 3.2 && this.aktiv;
    // zum Spieler drehen
    if (nah) { _tmp.subVectors(sp.pos, this.gruppe.position); const w = Math.atan2(_tmp.x, _tmp.z);
      this.gruppe.rotation.y += (w - this.gruppe.rotation.y) * Math.min(1, dt * 4); }
    else this.gruppe.rotation.y += (this.ruheRotation - this.gruppe.rotation.y) * Math.min(1, dt * 2);
    if (this.hand) { this.hand.visible = nah; if (nah) this.hand.rotation.z = Math.sin(this.t * 8) * .08; }
    if (this.modell) {
      this.modell.bein.rotation.z = Math.sin(this.t * 1.5) * .05;
      if (this.tanzen) { this.gruppe.position.y = this.pos.y + Math.abs(Math.sin(this.t * 6)) * .3; this.modell.bein.rotation.z = Math.sin(this.t * 6) * .25; this.gruppe.rotation.y = this.ruheRotation + Math.sin(this.t * 3) * .5; }
    }
    if (this.figur && this.o.wippen !== false) this.figur.rotation.z = Math.sin(this.t * 1.3) * .03;
    this.inReichweite = nah && d < 2.6;
  }
  // Vom Spiel aufgerufen, wenn der Spieler E drückt und in Reichweite ist
  sprich() {
    const sp = this.welt.spiel;
    const st = sp.spielstand;
    let zeilen = typeof this.o.dialog === 'function' ? this.o.dialog(st) : this.o.dialog;
    if (this.gesprochen > 0 && this.o.dialogDanach) zeilen = typeof this.o.dialogDanach === 'function' ? this.o.dialogDanach(st) : this.o.dialogDanach;
    if (!zeilen || !zeilen.length) return;
    sp.dialog.zeige(zeilen.map(z => typeof z === 'string' ? { name: this.name, text: z } : z), () => {
      this.gesprochen++;
      if (this.o.belohnung === 'klammer' && !st.istGesammelt(this.belohnungId) && !this.belohnungGegeben) {
        this.belohnungGegeben = true;
        const p = this.gruppe.position.clone(); p.y += this.kopfHoehe + .8;
        new Klammer(this.welt, this.belohnungId, p, this.name);
        this.welt.partikel.spawn(p, { anzahl: 10, farbe: 0xffd25a, geschwindigkeit: 3 });
        sp.audio.sfx('fanfare');
      }
      this.o.beiEnde && this.o.beiEnde(this.gesprochen, st);
    });
  }
}
