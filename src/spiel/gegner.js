import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';
import { material, faerbe, aktiviereSchatten } from '../engine/texturen.js';
import { baueFigur } from './sockenmodell.js';
import { zeigeBlase } from './npc.js';

const _tmp = new THREE.Vector3();

class Gegner {
  constructor(welt, o) {
    this.welt = welt; this.o = o; this.art = o.art;
    this.gruppe = new THREE.Group(); this.gruppe.position.set(o.x, o.y, o.z); welt.scene.add(this.gruppe);
    this.radius = o.radius || .7; this.hp = o.hp || 1; this.tot = false; this.t = Math.random() * 10; this.bodenY = o.y;
    this.nurStampf = !!o.nurStampf;
    welt.gegner.push(this); welt.dinge.push(this);
  }
  get pos() { return this.gruppe.position; }
  mitte(out) { return out.copy(this.gruppe.position).setY(this.gruppe.position.y + this.radius); }
  update(dt) {
    if (this.tot) return;
    if (!this.schattenGesetzt) { this.schattenGesetzt = true; aktiviereSchatten(this.gruppe); }
    this.t += dt; this.verhalten(dt);
    const sp = this.welt.spieler; if (!sp || sp.tot) return;
    const d = this.mitte(_tmp).distanceTo(sp.mitte);
    if (d < this.radius + .55) {
      if (sp.angriffAktiv && (!this.nurStampf || sp.stampft)) this.treffer(sp);
      else if (sp.unverwundbar <= 0) this.verletzeSpieler(sp);
    }
  }
  verletzeSpieler(sp) { sp.verletze(this.gruppe.position); }
  verhalten() {}
  treffer(sp) {
    this.hp--;
    this.welt.spiel.audio.sfx('treffer');
    this.welt.partikel.spawn(this.mitte(_tmp.clone()), { anzahl: 8, farbe: 0xffffff, geschwindigkeit: 4, leben: .4 });
    if (sp) sp.rueckstoss(this.gruppe.position, 5, 7);
    if (this.hp <= 0) this.stirb(); else this.beiTreffer && this.beiTreffer();
  }
  stirb() {
    this.tot = true;
    this.welt.spiel.audio.sfx('pop');
    this.welt.partikel.spawn(this.mitte(_tmp.clone()), { anzahl: 16, farbe: this.o.staubFarbe || 0xd8d2e0, geschwindigkeit: 4, leben: .7 });
    this.entferne();
    this.o.beiTod && this.o.beiTod(this);
  }
  entferne() {
    this.welt.scene.remove(this.gruppe);
    const i = this.welt.gegner.indexOf(this); if (i >= 0) this.welt.gegner.splice(i, 1);
    const j = this.welt.dinge.indexOf(this); if (j >= 0) this.welt.dinge.splice(j, 1);
  }
  // Hilfsmittel: Wegpunkte abfahren
  patrouille(dt, tempo) {
    const p = this.o.punkte; if (!p || p.length < 2) return;
    if (this.ziel === undefined) this.ziel = 1;
    const z = p[this.ziel];
    _tmp.set(z[0], z[1], z[2]).sub(this.gruppe.position);
    const d = _tmp.length();
    if (d < .2) { this.ziel = (this.ziel + 1) % p.length; return; }
    _tmp.divideScalar(d);
    this.gruppe.position.addScaledVector(_tmp, Math.min(d, tempo * dt));
    const w = Math.atan2(_tmp.x, _tmp.z); this.gruppe.rotation.y += ((w - this.gruppe.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 6);
  }
  schauZu(dt, ziel, k = 6) {
    _tmp.subVectors(ziel, this.gruppe.position); const w = Math.atan2(_tmp.x, _tmp.z);
    this.gruppe.rotation.y += ((w - this.gruppe.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * k);
  }
}

// Gummienten-Pirat
class Ente extends Gegner {
  constructor(welt, o) {
    super(welt, { radius: .75, ...o });
    const f = baueFigur('gummiente'); this.gruppe.add(f); this.figur = f;
    const hut = new THREE.Mesh(faerbe(new THREE.ConeGeometry(.45, .35, 4), '#2a1a2e'), material('#2a1a2e')); hut.position.set(0, 1.3, .3); hut.rotation.y = Math.PI / 4; this.gruppe.add(hut);
    const klappe = new THREE.Mesh(new THREE.CircleGeometry(.09, 8), new THREE.MeshBasicMaterial({ color: 0x2a1a2e })); klappe.position.set(.14, 1.07, .62); this.gruppe.add(klappe);
  }
  verhalten(dt) { this.patrouille(dt, this.o.tempo || 2.2); this.figur.rotation.z = Math.sin(this.t * 10) * .15; this.figur.position.y = Math.abs(Math.sin(this.t * 10)) * .08; }
}

// Kühlschrankmagnet: patrouilliert, stürmt los wenn der Spieler nah ist
class Magnet extends Gegner {
  constructor(welt, o) {
    super(welt, { radius: .7, ...o });
    const u = new THREE.Mesh(faerbe(new THREE.TorusGeometry(.45, .2, 6, 10, Math.PI), '#c0392b'), material('#c0392b')); u.rotation.z = Math.PI; u.position.y = .8; this.gruppe.add(u);
    for (const s of [-1, 1]) { const t = new THREE.Mesh(faerbe(new THREE.BoxGeometry(.4, .4, .4), '#d0d0d8'), material('#d0d0d8')); t.position.set(s * .45, .25, 0); this.gruppe.add(t); }
    for (const s of [-1, 1]) { const a = new THREE.Mesh(new THREE.SphereGeometry(.07, 6, 5), new THREE.MeshBasicMaterial({ color: 0x1a1218 })); a.position.set(s * .15, 1.0, .25); this.gruppe.add(a); }
    this.sturm = 0;
  }
  verhalten(dt) {
    const sp = this.welt.spieler;
    const d = this.gruppe.position.distanceTo(sp.pos);
    if (this.sturm > 0) { this.sturm -= dt; this.gruppe.position.addScaledVector(this.richtung, 6 * dt); this.gruppe.position.y = this.bodenY; return; }
    if (d < 6 && Math.abs(sp.pos.y - this.bodenY) < 2 && this.pause <= 0) {
      this.richtung = _tmp.subVectors(sp.pos, this.gruppe.position).setY(0).normalize().clone(); this.sturm = .7; this.pause = 2.2;
      this.schauZu(0.5, sp.pos, 30); this.welt.spiel.audio.sfx('summen'); return;
    }
    this.pause = (this.pause || 0) - dt;
    this.patrouille(dt, 1.6);
  }
}

// Staubmaus: wandert, verbindet sich mit anderen zu größeren Klumpen
class Staubmaus extends Gegner {
  constructor(welt, o) {
    super(welt, { radius: .55, staubFarbe: 0x9c94a8, ...o });
    this.groesse = o.groesse || 1;
    const k = new THREE.Mesh(faerbe(new THREE.DodecahedronGeometry(.5, 1), '#8f879c', { variation: .3 }), material('#8f879c')); k.position.y = .5; this.gruppe.add(k); this.kugel = k;
    for (let i = 0; i < 8; i++) { const h = new THREE.Mesh(new THREE.BoxGeometry(.04, .3, .04), material('#7a7388', { vertexColors: false }));
      const a = i / 8 * Math.PI * 2; h.position.set(Math.cos(a) * .45, .5 + Math.sin(i) * .2, Math.sin(a) * .45); h.rotation.z = Math.cos(a) * 1.2; h.rotation.x = Math.sin(a) * 1.2; this.gruppe.add(h); }
    for (const s of [-1, 1]) { const a = new THREE.Mesh(new THREE.SphereGeometry(.07, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffe08a })); a.position.set(s * .15, .6, .42); this.gruppe.add(a); }
    this.richtung = new THREE.Vector3(Math.random() - .5, 0, Math.random() - .5).normalize(); this.wechsel = 1 + Math.random() * 2;
    this.setzeGroesse(this.groesse);
  }
  setzeGroesse(g) { this.groesse = g; this.gruppe.scale.setScalar(g); this.radius = .55 * g; this.hp = Math.ceil(g); }
  verhalten(dt) {
    this.wechsel -= dt;
    const sp = this.welt.spieler;
    const d = this.gruppe.position.distanceTo(sp.pos);
    if (d < 5 && Math.abs(sp.pos.y - this.bodenY) < 2) { this.richtung.subVectors(sp.pos, this.gruppe.position).setY(0).normalize(); }
    else if (this.wechsel <= 0) { this.wechsel = 1 + Math.random() * 2; this.richtung.set(Math.random() - .5, 0, Math.random() - .5).normalize(); }
    // im Gebiet bleiben
    if (this.o.gebiet) { const g = this.o.gebiet; const p = this.gruppe.position;
      if (p.x < g[0] || p.x > g[2] || p.z < g[1] || p.z > g[3]) this.richtung.set((g[0] + g[2]) / 2 - p.x, 0, (g[1] + g[3]) / 2 - p.z).normalize(); }
    this.gruppe.position.addScaledVector(this.richtung, (1.4 + .4 / this.groesse) * dt); this.gruppe.position.y = this.bodenY;
    this.gruppe.rotation.y = Math.atan2(this.richtung.x, this.richtung.z);
    this.kugel.rotation.x += dt * 3;
    // verschmelzen
    for (const g of this.welt.gegner) {
      if (g === this || g.art !== 'staubmaus' || g.tot || g.groesse > 2.6 || this.groesse > 2.6) continue;
      if (g.gruppe.position.distanceTo(this.gruppe.position) < this.radius + g.radius) {
        const groesser = this.groesse >= g.groesse ? this : g, kleiner = groesser === this ? g : this;
        groesser.setzeGroesse(Math.min(3, groesser.groesse + kleiner.groesse * .5)); kleiner.tot = true; kleiner.entferne();
        this.welt.partikel.spawn(groesser.gruppe.position, { anzahl: 10, farbe: 0x9c94a8, geschwindigkeit: 2 });
        if (groesser.groesse > 2) zeigeBlase(this.welt, groesser.gruppe, 'HUST!', 1.5, 1.6 * groesser.groesse);
        break;
      }
    }
  }
}

// Flämmchen: hüpft über Wegpunkte, brennt
class Flamme extends Gegner {
  constructor(welt, o) {
    super(welt, { radius: .6, staubFarbe: 0xff8c3a, ...o });
    const f = new THREE.Mesh(faerbe(new THREE.ConeGeometry(.45, 1.1, 7), '#ff8c3a', { verlauf: -.5 }), material('#ff8c3a', { emissive: 0x661a00 })); f.position.y = .55; this.gruppe.add(f); this.f = f;
    const k = new THREE.Mesh(faerbe(new THREE.ConeGeometry(.25, .7, 6), '#ffe04a'), material('#ffe04a', { emissive: 0x553300 })); k.position.y = .45; this.gruppe.add(k);
    for (const s of [-1, 1]) { const a = new THREE.Mesh(new THREE.SphereGeometry(.07, 6, 5), new THREE.MeshBasicMaterial({ color: 0x2a1a2e })); a.position.set(s * .13, .55, .35); this.gruppe.add(a); }
    const l = new THREE.PointLight(0xff8c3a, .8, 5); l.position.y = .8; this.gruppe.add(l);
  }
  verhalten(dt) { this.patrouille(dt, 2.8); this.gruppe.position.y = this.bodenY + Math.abs(Math.sin(this.t * 7)) * .5; this.f.scale.y = 1 + Math.sin(this.t * 20) * .12;
    if (Math.random() < dt * 6) this.welt.partikel.spawn(this.gruppe.position, { anzahl: 1, farbe: [0xff8c3a, 0xffe04a], geschwindigkeit: 1.5, leben: .5, gravitation: 3, groesse: .1 }); }
}

// Amsel: kreist, stößt auf den Spieler herab
class Amsel extends Gegner {
  constructor(welt, o) {
    super(welt, { radius: .7, staubFarbe: 0x222222, ...o });
    const k = new THREE.Mesh(faerbe(new THREE.SphereGeometry(.45, 10, 8), '#222228'), material('#222228')); k.scale.set(1, .8, 1.4); k.position.y = .5; this.gruppe.add(k);
    const kopf = new THREE.Mesh(faerbe(new THREE.SphereGeometry(.28, 8, 6), '#222228'), material('#222228')); kopf.position.set(0, .85, .5); this.gruppe.add(kopf);
    const schnabel = new THREE.Mesh(faerbe(new THREE.ConeGeometry(.1, .4, 6), '#f5b400'), material('#f5b400')); schnabel.rotation.x = Math.PI / 2; schnabel.position.set(0, .82, .9); this.gruppe.add(schnabel);
    for (const s of [-1, 1]) { const a = new THREE.Mesh(new THREE.SphereGeometry(.06, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffd25a })); a.position.set(s * .14, .95, .68); this.gruppe.add(a); }
    this.fluegel = [];
    for (const s of [-1, 1]) { const f = new THREE.Mesh(faerbe(new THREE.BoxGeometry(1.1, .06, .6), '#2b2b33'), material('#2b2b33')); f.position.set(s * .7, .6, 0); this.gruppe.add(f); this.fluegel.push(f); }
    this.zentrum = new THREE.Vector3(o.x, o.y, o.z); this.winkel = Math.random() * 6; this.zustand = 'kreisen'; this.hoehe = o.y;
  }
  verhalten(dt) {
    const sp = this.welt.spieler;
    this.fluegel[0].rotation.z = Math.sin(this.t * 14) * .6; this.fluegel[1].rotation.z = -Math.sin(this.t * 14) * .6;
    if (this.zustand === 'kreisen') {
      this.winkel += dt * .8; const r = this.o.kreis || 5;
      const ziel = new THREE.Vector3(this.zentrum.x + Math.cos(this.winkel) * r, this.hoehe + Math.sin(this.t) * .5, this.zentrum.z + Math.sin(this.winkel) * r);
      this.gruppe.position.lerp(ziel, Math.min(1, dt * 3)); this.schauZu(dt, ziel.add(new THREE.Vector3(-Math.sin(this.winkel), 0, Math.cos(this.winkel))), 5);
      const abstand = Math.hypot(sp.pos.x - this.zentrum.x, sp.pos.z - this.zentrum.z);
      if (abstand < (this.o.reichweite || 10) && sp.pos.y < this.hoehe && (this.pause = (this.pause || 0) - dt) <= 0) { this.zustand = 'sturz'; this.welt.spiel.audio.sfx('summen'); }
    } else if (this.zustand === 'sturz') {
      _tmp.copy(sp.mitte).sub(this.gruppe.position); _tmp.y -= this.radius; const d = _tmp.length(); _tmp.divideScalar(Math.max(d, 1e-6));
      this.gruppe.position.addScaledVector(_tmp, 9 * dt); this.schauZu(dt, sp.pos, 8);
      if (d < .5 || this.gruppe.position.y < sp.pos.y - 1) { this.zustand = 'aufstieg'; }
    } else {
      this.gruppe.position.y += 6 * dt; this.gruppe.position.x += Math.sin(this.winkel) * dt * 2;
      if (this.gruppe.position.y >= this.hoehe) { this.zustand = 'kreisen'; this.pause = 3; }
    }
  }
  verletzeSpieler(sp) { sp.verletze(this.gruppe.position); zeigeBlase(this.welt, this.gruppe, 'Nistmaterial!', 1.5, 1.4); this.zustand = 'aufstieg'; }
}

// Flusenklumpen in der Trommel: rollt dem Spieler hinterher
class Klumpen extends Gegner {
  constructor(welt, o) {
    super(welt, { radius: .8, staubFarbe: 0x9c94a8, ...o });
    const k = new THREE.Mesh(faerbe(new THREE.DodecahedronGeometry(.8, 1), '#6f6680', { variation: .3 }), material('#6f6680')); k.position.y = .8; this.gruppe.add(k); this.kugel = k;
    for (const s of [-1, 1]) { const a = new THREE.Mesh(new THREE.SphereGeometry(.1, 6, 5), new THREE.MeshBasicMaterial({ color: 0xff4040 })); a.position.set(s * .25, .9, .7); this.gruppe.add(a); }
    this.v = new THREE.Vector3(); this.leben = o.leben || 14;
  }
  verhalten(dt) {
    const sp = this.welt.spieler;
    this.leben -= dt; if (this.leben <= 0) { this.stirb(); return; }
    _tmp.subVectors(sp.pos, this.gruppe.position).setY(0);
    if (_tmp.length() > .1) _tmp.normalize();
    this.v.addScaledVector(_tmp, 4 * dt); this.v.multiplyScalar(1 - dt * .8);
    if (this.v.length() > 4) this.v.setLength(4);
    this.gruppe.position.addScaledVector(this.v, dt);
    // in der Trommel bleiben (Radius)
    if (this.o.trommel) { const r = Math.hypot(this.gruppe.position.x - this.o.trommel.x, this.gruppe.position.y - this.o.trommel.y);
      const maxR = this.o.trommel.r - 1.2; if (r > maxR) { const a = Math.atan2(this.gruppe.position.y - this.o.trommel.y, this.gruppe.position.x - this.o.trommel.x);
        this.gruppe.position.x = this.o.trommel.x + Math.cos(a) * maxR; }
      this.gruppe.position.y = this.o.trommel.y - Math.sqrt(Math.max(0, maxR * maxR - (this.gruppe.position.x - this.o.trommel.x) ** 2)); }
    this.kugel.rotation.x += this.v.z * dt; this.kugel.rotation.z -= this.v.x * dt;
  }
}

// Teddy: Boss im Kinderzimmer. Will nur kuscheln.
class Teddy extends Gegner {
  constructor(welt, o) {
    super(welt, { radius: 1.6, hp: 3, staubFarbe: 0xb87a45, ...o });
    this.figur = baueFigur('teddy'); this.gruppe.add(this.figur);
    this.knoepfe = [];
    for (let i = 0; i < 3; i++) { const k = new THREE.Mesh(faerbe(new THREE.CylinderGeometry(.2, .2, .1, 10), '#e8474c'), material('#e8474c', { emissive: 0x330000 }));
      k.rotation.x = Math.PI / 2; k.position.set(0, .8 + i * .5, 1.25 - Math.abs(1 - i) * .1); this.figur.add(k); this.knoepfe.push(k); }
    this.zustand = 'warten'; this.timer = 2; this.spruch = 0; this.start = new THREE.Vector3(o.x, o.y, o.z);
    this.sprueche = ['KUSCHELN?', 'Nur eine Umarmung!', 'Komm her, Söckchen!', 'Autsch! Mein Knopf!', 'Nochmal!', 'Du bist so weich!'];
  }
  mitte(out) { return out.copy(this.gruppe.position).setY(this.gruppe.position.y + 1.5); }
  verhalten(dt) {
    const sp = this.welt.spieler;
    this.figur.rotation.z = Math.sin(this.t * 4) * .04;
    this.timer -= dt;
    if (!this.aktiviert) { if (sp.pos.distanceTo(this.gruppe.position) < 9) { this.aktiviert = true; this.welt.spiel.audio.sfx('boss'); zeigeBlase(this.welt, this.gruppe, 'KUSCHELN!', 2.5, 4.4); } return; }
    if (this.zustand === 'warten') { if (this.timer <= 0) { this.zustand = 'laufen'; } return; }
    if (this.zustand === 'laufen') {
      _tmp.subVectors(sp.pos, this.gruppe.position).setY(0); const d = _tmp.length();
      if (d > .1) { _tmp.divideScalar(d); this.gruppe.position.addScaledVector(_tmp, 2.6 * dt); this.schauZu(dt, sp.pos, 4); }
      this.figur.position.y = Math.abs(Math.sin(this.t * 6)) * .25;
      if (d < 2.4 && sp.pos.y < this.gruppe.position.y + 2) { this.zustand = 'umarmen'; this.timer = 1.6; this.welt.spiel.audio.sfx('quietsch');
        zeigeBlase(this.welt, this.gruppe, this.sprueche[this.spruch++ % 3], 1.5, 4.4); sp.festhalten(1.3, this.gruppe.position); }
      if (Math.random() < dt * .2) zeigeBlase(this.welt, this.gruppe, this.sprueche[1 + this.spruch++ % 2], 1.5, 4.4);
      return;
    }
    if (this.zustand === 'umarmen') {
      this.figur.scale.setScalar(1 + Math.sin(this.t * 20) * .04);
      if (this.timer <= 0) { this.figur.scale.setScalar(1); this.zustand = 'erschoepft'; this.timer = 3; sp.wirfWeg(this.gruppe.position, 9, 11);
        zeigeBlase(this.welt, this.gruppe, 'Puh, anstrengend.', 2, 4.4); }
      return;
    }
    if (this.zustand === 'erschoepft') { this.figur.rotation.x = Math.sin(this.t * 3) * .08; if (this.timer <= 0) { this.figur.rotation.x = 0; this.zustand = 'laufen'; } return; }
    if (this.zustand === 'betaeubt') { this.figur.rotation.z = Math.sin(this.t * 12) * .15; if (this.timer <= 0) { this.zustand = 'laufen'; } }
  }
  update(dt) {
    if (this.tot) return;
    this.t += dt; this.verhalten(dt);
    const sp = this.welt.spieler; if (!sp || sp.tot || !this.aktiviert) return;
    const d = this.mitte(_tmp).distanceTo(sp.mitte);
    if (d < this.radius + .6 && sp.angriffAktiv && this.zustand !== 'betaeubt' && this.zustand !== 'umarmen') this.treffer(sp);
  }
  treffer(sp) {
    this.hp--; this.welt.spiel.audio.sfx('treffer'); this.welt.spiel.renderer.wackeln = 1;
    const k = this.knoepfe[this.hp]; if (k) { k.visible = false; this.welt.partikel.spawn(this.gruppe.position.clone().setY(this.gruppe.position.y + 1.5), { anzahl: 12, farbe: 0xe8474c, geschwindigkeit: 5 }); }
    sp.rueckstoss(this.gruppe.position, 7, 8);
    zeigeBlase(this.welt, this.gruppe, this.hp > 0 ? 'Autsch! Mein Knopf!' : 'Okay ... du gewinnst.', 2, 4.4);
    if (this.hp <= 0) { this.tot = true; this.zustand = 'besiegt'; this.welt.spiel.audio.sfx('fanfare'); this.o.beiTod && this.o.beiTod(this); return; }
    this.zustand = 'betaeubt'; this.timer = 2.5;
  }
}

// Zierfisch: schwimmt Wegpunkte in 3D ab, jagt den Spieler, wenn er nah ist
class Fisch extends Gegner {
  constructor(welt, o) {
    super(welt, { radius: .7, staubFarbe: 0xffa040, ...o });
    const f = o.farbe || '#ff8a30';
    const k = new THREE.Mesh(faerbe(new THREE.SphereGeometry(.6, 14, 10), f), material(f, { glanz: 40 })); k.scale.set(.7, 1, 1.5); k.position.y = .6; this.gruppe.add(k);
    const s = new THREE.Mesh(faerbe(new THREE.ConeGeometry(.45, .7, 4), f), material(f)); s.rotation.x = -Math.PI / 2; s.position.set(0, .6, -1.1); this.gruppe.add(s); this.schwanz = s;
    const fl = new THREE.Mesh(faerbe(new THREE.ConeGeometry(.3, .5, 4), f), material(f)); fl.position.set(0, 1.2, 0); this.gruppe.add(fl);
    for (const sd of [-1, 1]) { const a = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), new THREE.MeshBasicMaterial({ color: 0x1a1218 })); a.position.set(sd * .3, .75, .6); this.gruppe.add(a); }
    const m = new THREE.Mesh(new THREE.BoxGeometry(.25, .08, .1), new THREE.MeshBasicMaterial({ color: 0x2a1a2e })); m.position.set(0, .45, .9); this.gruppe.add(m);
    this.jagd = 0;
  }
  verhalten(dt) {
    this.schwanz.rotation.y = Math.sin(this.t * 9) * .5;
    const sp = this.welt.spieler; const d = this.gruppe.position.distanceTo(sp.pos);
    if (d < (this.o.reichweite || 7) && sp.inWasser) this.jagd = 1.5; else this.jagd -= dt;
    if (this.jagd > 0) { _tmp.subVectors(sp.mitte, this.gruppe.position).setY(sp.mitte.y - this.gruppe.position.y - .6); const l = _tmp.length(); if (l > .3) { _tmp.divideScalar(l); this.gruppe.position.addScaledVector(_tmp, (this.o.tempo || 3.2) * dt); this.schauZu(dt, sp.pos, 5); } }
    else this.patrouille(dt, this.o.tempo || 2.4);
    this.gruppe.position.y += Math.sin(this.t * 2) * dt * .3;
  }
}

// Schneeball: rollt auf den Spieler zu und wächst dabei
class Schneeball extends Gegner {
  constructor(welt, o) {
    super(welt, { radius: .6, staubFarbe: 0xffffff, ...o });
    const k = new THREE.Mesh(faerbe(new THREE.SphereGeometry(.6, 14, 10), '#f4f8ff', { variation: .08 }), material('#f4f8ff')); k.position.y = .6; this.gruppe.add(k); this.kugel = k;
    for (const s of [-1, 1]) { const a = new THREE.Mesh(new THREE.SphereGeometry(.08, 6, 5), new THREE.MeshBasicMaterial({ color: 0x2a1a2e })); a.position.set(s * .2, .75, .5); this.gruppe.add(a); }
    this.groesse = 1; this.v = new THREE.Vector3(); this.start = this.gruppe.position.clone();
  }
  verhalten(dt) {
    const sp = this.welt.spieler; const d = this.gruppe.position.distanceTo(sp.pos);
    if (d < (this.o.reichweite || 14) && Math.abs(sp.pos.y - this.bodenY) < 3) { _tmp.subVectors(sp.pos, this.gruppe.position).setY(0).normalize(); this.v.addScaledVector(_tmp, 5 * dt);
      this.groesse = Math.min(2.4, this.groesse + dt * .12); }
    else { _tmp.subVectors(this.start, this.gruppe.position).setY(0); if (_tmp.length() > 1) { _tmp.normalize(); this.v.addScaledVector(_tmp, 3 * dt); } this.groesse = Math.max(1, this.groesse - dt * .2); }
    this.v.multiplyScalar(1 - dt * 1.2); const max = 5.5 / this.groesse; if (this.v.length() > max) this.v.setLength(max);
    this.gruppe.position.addScaledVector(this.v, dt); this.gruppe.position.y = this.bodenY;
    this.gruppe.scale.setScalar(this.groesse); this.radius = .6 * this.groesse; this.hp = this.groesse > 1.8 ? 2 : 1;
    this.kugel.rotation.x += this.v.z * dt / this.groesse; this.kugel.rotation.z -= this.v.x * dt / this.groesse;
    if (this.v.length() > 1 && Math.random() < dt * 6) this.welt.partikel.spawn(this.gruppe.position, { anzahl: 1, farbe: 0xffffff, geschwindigkeit: 1, leben: .5, groesse: .1 });
  }
}

export function erzeugeGegner(welt, art, o) {
  const K = { ente: Ente, magnet: Magnet, staubmaus: Staubmaus, flamme: Flamme, amsel: Amsel, klumpen: Klumpen, teddy: Teddy, fisch: Fisch, schneeball: Schneeball }[art];
  if (!K) throw new Error('Unbekannter Gegner ' + art);
  return new K(welt, { art, ...o });
}
