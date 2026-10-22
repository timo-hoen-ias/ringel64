import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';
import { Kollider } from './kollision.js';
import { Texturen, material, faerbe } from './texturen.js';
import { Klammer, Fussel, Socke, Knopf } from '../spiel/sammeln.js';
import { NPC } from '../spiel/npc.js';
import { erzeugeGegner } from '../spiel/gegner.js';

// Der Bauer stellt Möbel, Plattformen, Trigger und Spielobjekte in die Welt und registriert
// die passenden Kollider. Alle y-Angaben sind die Unterkante (Standfläche), nicht die Mitte.
export class Bauer {
  constructor(welt) { this.welt = welt; this.scene = welt.scene; this.zaehler = 0; }

  _flags(o) {
    const f = {};
    for (const k of ['fest', 'trigger', 'eis', 'sprung', 'schaden', 'wasser', 'hitze', 'wind', 'knopf', 'beweglich', 'beiBeruehrung', 'name']) if (o[k] !== undefined) f[k] = o[k];
    return f;
  }
  _mesh(geo, o) {
    faerbe(geo, o.farbe || '#cccccc', { variation: o.variation ?? .06, verlauf: o.verlauf ?? .25 });
    const mat = material(o.farbe || '#cccccc', { textur: o.textur || null, wiederholung: o.wiederholung ?? 1, emissive: o.emissive ?? 0,
      transparent: !!o.transparent, opacity: o.opacity ?? 1, seite: o.seite ?? THREE.FrontSide });
    const m = new THREE.Mesh(geo, mat);
    m.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0);
    (o.eltern || this.scene).add(m);
    return m;
  }

  // Box: Mitte bei (x, y + h/2, z)
  box(o) {
    const { w = 1, h = 1, d = 1, x = 0, y = 0, z = 0 } = o;
    const m = this._mesh(new THREE.BoxGeometry(w, h, d), o);
    m.position.set(x, y + h / 2, z);
    if (o.mitte) m.position.set(x, y, z);
    if (o.kollision !== false) {
      const k = new Kollider(m, 'box', { halb: new THREE.Vector3(w / 2, h / 2, d / 2), ...this._flags(o) });
      this.welt.fuegeKollider(k); m.userData.kollider = k;
    }
    return m;
  }
  zylinder(o) {
    const { r = 1, h = 1, x = 0, y = 0, z = 0, seg = 12 } = o;
    const m = this._mesh(new THREE.CylinderGeometry(o.rOben ?? r, r, h, seg), o);
    m.position.set(x, y + h / 2, z);
    if (o.mitte) m.position.set(x, y, z);
    if (o.kollision !== false) {
      const k = new Kollider(m, 'zylinder', { radius: Math.max(r, o.rOben ?? r), halbHoehe: h / 2, ...this._flags(o) });
      this.welt.fuegeKollider(k); m.userData.kollider = k;
    }
    return m;
  }
  kugel(o) {
    const { r = 1, x = 0, y = 0, z = 0 } = o;
    const m = this._mesh(new THREE.SphereGeometry(r, o.seg ?? 10, o.seg ?? 8), o);
    m.position.set(x, y + (o.mitte ? 0 : r), z);
    if (o.kollision !== false) {
      const k = new Kollider(m, 'kugel', { radius: r, ...this._flags(o) });
      this.welt.fuegeKollider(k); m.userData.kollider = k;
    }
    return m;
  }
  // Kegel (z. B. Zahnpasta-Spitze, Eis-Zapfen)
  kegel(o) { return this.zylinder({ ...o, rOben: o.rOben ?? 0.01 }); }
  gruppe(x = 0, y = 0, z = 0) { const g = new THREE.Group(); g.position.set(x, y, z); this.scene.add(g); return g; }

  // Textschild auf einem Pfosten
  schild({ text, x, y, z, ry = 0, b = 3, h = 1.2, pfosten = true, hintergrund, farbe }) {
    if (pfosten) this.box({ w: .15, h: 1.2, d: .15, x, y, z, farbe: '#7a5230', kollision: false });
    const t = Texturen.text(text, { hintergrund, farbe });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(b, h), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }));
    m.position.set(x, y + (pfosten ? 1.2 + h / 2 : h / 2), z); m.rotation.y = ry; this.scene.add(m); return m;
  }
  lampe(x, y, z, farbe = 0xffd9a0, intensitaet = 1.2, reichweite = 14) {
    const l = new THREE.PointLight(farbe, intensitaet, reichweite, 1.2); l.position.set(x, y, z); this.scene.add(l); return l;
  }

  // ---- Bewegung ----
  // Plattform zwischen zwei Punkten pendeln lassen (Mesh mit Kollider aus box()/zylinder()).
  bewege(mesh, { nach, dauer = 3, pause = .6, phase = 0 }) {
    const von = mesh.position.clone(); const ziel = new THREE.Vector3(...nach); ziel.y += (mesh.position.y - (mesh.userData.unten ?? mesh.position.y));
    const k = mesh.userData.kollider; if (k) k.beweglich = true;
    let t = phase;
    this.welt.dinge.push({ update: dt => {
      t += dt; const zyklus = (dauer + pause) * 2; const p = t % zyklus;
      let a;
      if (p < dauer) a = p / dauer; else if (p < dauer + pause) a = 1;
      else if (p < dauer * 2 + pause) a = 1 - (p - dauer - pause) / dauer; else a = 0;
      a = a * a * (3 - 2 * a);
      mesh.position.lerpVectors(von, ziel, a);
      if (k) k.aktualisiere();
    } });
    return mesh;
  }
  // Objekt dauerhaft drehen (Achse 'x'|'y'|'z', Rad/s). Kollider folgt.
  drehe(obj, { achse = 'y', geschwindigkeit = 1 }) {
    const ks = []; obj.traverse(o => { if (o.userData.kollider) { o.userData.kollider.beweglich = true; ks.push(o.userData.kollider); } });
    this.welt.dinge.push({ update: dt => { obj.rotation[achse] += geschwindigkeit * dt; ks.forEach(k => k.aktualisiere()); } });
    return obj;
  }
  // Pendeln (Hemd an der Leine): dreht um die lokale Achse hin und her
  pendel(obj, { achse = 'z', amplitude = .4, dauer = 3, phase = 0 }) {
    const ks = []; obj.traverse(o => { if (o.userData.kollider) { o.userData.kollider.beweglich = true; ks.push(o.userData.kollider); } });
    let t = phase;
    this.welt.dinge.push({ update: dt => { t += dt; obj.rotation[achse] = Math.sin(t / dauer * Math.PI * 2) * amplitude; ks.forEach(k => k.aktualisiere()); } });
    return obj;
  }
  // Schiebetür: fährt beim Öffnen nach oben weg
  tuer(o) {
    const m = this.box({ ...o, farbe: o.farbe || '#8b6b4a' });
    const k = m.userData.kollider; const start = m.position.y; let offen = false; let a = 0;
    this.welt.dinge.push({ update: dt => { if (!offen || a >= 1) return; a = Math.min(1, a + dt / 1.2); m.position.y = start + a * (o.h + .2); k.aktualisiere(); if (a >= 1) k.aktiv = false; } });
    m.userData.oeffne = () => { if (offen) return; offen = true; this.welt.spiel.audio.sfx('tuer'); this.welt.partikel.spawn(m.position, { anzahl: 12, farbe: 0xccbbaa, geschwindigkeit: 3 }); };
    return m;
  }
  treppe({ x, y, z, stufen = 5, breite = 3, tiefe = 1, hoehe = .6, richtung = 'z', farbe = '#9a8a7a', textur = null }) {
    for (let i = 0; i < stufen; i++) {
      const dx = richtung === 'x' ? i * tiefe : richtung === '-x' ? -i * tiefe : 0;
      const dz = richtung === 'z' ? i * tiefe : richtung === '-z' ? -i * tiefe : 0;
      const w = richtung.includes('x') ? tiefe : breite, d = richtung.includes('z') ? tiefe : breite;
      this.box({ w, h: hoehe * (i + 1), d, x: x + dx, y, z: z + dz, farbe, textur });
    }
  }

  // ---- Zonen ----
  wasser({ w, h, d, x, y, z, farbe = '#4fa8e8' }) {
    const m = this.box({ w, h, d, x, y, z, farbe, transparent: true, opacity: .55, fest: false, trigger: true, wasser: true, verlauf: .1 });
    m.userData.oberflaeche = y + h;
    return m;
  }
  hitze({ w, h, d, x, y, z, sichtbar = false, farbe = '#ff8c3a' }) {
    const m = this.box({ w, h, d, x, y, z, farbe, transparent: true, opacity: sichtbar ? .25 : 0, fest: false, trigger: true, hitze: true });
    m.visible = sichtbar; return m;
  }
  wind({ w, h, d, x, y, z, kraft, sichtbar = false }) {
    const m = this.box({ w, h, d, x, y, z, farbe: '#ffffff', transparent: true, opacity: .12, fest: false, trigger: true, wind: new THREE.Vector3(...kraft) });
    m.visible = sichtbar;
    // Windpartikel
    const richtung = new THREE.Vector3(...kraft).normalize(); let t = 0;
    this.welt.dinge.push({ update: dt => { t += dt; if (t > .12) { t = 0;
      const p = new THREE.Vector3(x + (Math.random() - .5) * w, y + Math.random() * h, z + (Math.random() - .5) * d);
      this.welt.partikel.spawn(p, { anzahl: 1, farbe: 0xffffff, richtung, geschwindigkeit: 6, leben: .6, gravitation: 0, groesse: .08 }); } } });
    return m;
  }
  sprungfeld(o) { const m = this.box({ ...o, farbe: o.farbe || '#ff6fa8', sprung: o.staerke || 18 }); return m; }
  schaden(o) { return this.box({ ...o, schaden: true }); }

  // Schwerer Knopf (nass drücken / stampfen) oder leichter Schalter
  schalter({ x, y, z, r = 1, braucheNass = false, braucheStampf = false, beiDruecken, farbe = '#e8474c', text = null }) {
    const sockel = this.zylinder({ r: r + .3, h: .3, x, y, z, farbe: '#5a5a66', seg: 16 });
    const k = this.zylinder({ r, h: .5, x, y: y + .3, z, farbe, seg: 16, emissive: 0x220000 });
    const knopf = { braucheNass, braucheStampf, gedrueckt: false, beiDruecken: () => {
      if (knopf.gedrueckt) return; knopf.gedrueckt = true; k.position.y -= .3; k.userData.kollider.aktualisiere(); k.material = material('#8a2a2e', { emissive: 0 });
      faerbe(k.geometry, '#8a2a2e');
      this.welt.spiel.audio.sfx('schalter'); this.welt.partikel.spawn(k.position, { anzahl: 10, farbe: 0xffd25a, geschwindigkeit: 4 });
      beiDruecken && beiDruecken();
    } };
    k.userData.kollider.knopf = knopf; sockel.userData.kollider.knopf = knopf;
    if (text) this.schild({ text, x, y, z: z + r + .8, b: 3, h: 1 });
    return knopf;
  }
  haken(x, y, z) {
    const g = new THREE.Group(); g.position.set(x, y, z); this.scene.add(g);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.35, .09, 6, 10), material('#f0c040', { vertexColors: false, emissive: 0x332200 }));
    ring.rotation.x = Math.PI / 2; g.add(ring);
    const stift = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .6, 6), material('#c0c0c0', { vertexColors: false }));
    stift.position.y = .5; g.add(stift);
    const h = { pos: new THREE.Vector3(x, y, z), obj: g, ring };
    this.welt.haken.push(h); return h;
  }
  checkpoint(x, y, z) {
    const g = this.gruppe(x, y, z);
    const stange = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 2.4, 6), material('#c9c9c9', { vertexColors: false }));
    stange.position.y = 1.2; g.add(stange);
    const fahne = new THREE.Mesh(faerbe(new THREE.BoxGeometry(.9, .6, .08), '#9b8fa0'), material('#9b8fa0'));
    fahne.position.set(.5, 2.0, 0); g.add(fahne);
    const cp = { pos: new THREE.Vector3(x, y, z), aktiv: false, fahne, obj: g };
    this.welt.checkpoints.push(cp); return cp;
  }
  // Portal (Wäschekorb) in ein Level
  portal({ x, y, z, ziel, name, benoetigt = 0, farbe = '#c89b5a' }) {
    const korb = this.zylinder({ r: 2.2, h: 2.0, x, y, z, farbe, seg: 14, textur: Texturen.holz(farbe), wiederholung: 3 });
    const rand = this.zylinder({ r: 2.4, rOben: 2.4, h: .3, x, y: y + 2.0, z, farbe: '#a87a3a', seg: 14, kollision: false });
    const innen = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, .2, 14), new THREE.MeshBasicMaterial({ color: 0x2a1a2e }));
    innen.position.set(x, y + 2.15, z); this.scene.add(innen);
    this.schild({ text: `${name}\n${benoetigt > 0 ? benoetigt + ' Klammern' : 'offen'}`, x, y, z: z + 2.9, b: 4.2, h: 1.6 });
    const p = { pos: new THREE.Vector3(x, y + 2.3, z), ziel, name, benoetigt, korb, innen, rand };
    this.welt.portale.push(p); return p;
  }

  // ---- Sammelobjekte ----
  _id(prefix) { return `${this.welt.schluessel}:${prefix}${this.zaehler++}`; }
  fussel(x, y, z) { return new Fussel(this.welt, this._id('f'), new THREE.Vector3(x, y, z)); }
  fusselLinie([x1, y1, z1], [x2, y2, z2], n = 5) {
    for (let i = 0; i < n; i++) { const t = n === 1 ? 0 : i / (n - 1); this.fussel(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, z1 + (z2 - z1) * t); }
  }
  fusselBogen([x1, y1, z1], [x2, y2, z2], n = 5, hoehe = 2) {
    for (let i = 0; i < n; i++) { const t = i / (n - 1); this.fussel(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * hoehe, z1 + (z2 - z1) * t); }
  }
  fusselKreis(x, y, z, r = 2, n = 6) {
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; this.fussel(x + Math.cos(a) * r, y, z + Math.sin(a) * r); }
  }
  klammer(x, y, z, name = '') { return new Klammer(this.welt, this._id('k'), new THREE.Vector3(x, y, z), name); }
  socke(x, y, z, { name, farbe = '#5fb7e8', partner }) { return new Socke(this.welt, this._id('s'), new THREE.Vector3(x, y, z), { name, farbe, partner }); }
  knopf(x, y, z, outfit) { return new Knopf(this.welt, this._id('b'), new THREE.Vector3(x, y, z), outfit); }
  npc(o) { return new NPC(this.welt, o); }
  gegner(art, o) { return erzeugeGegner(this.welt, art, o); }
}
