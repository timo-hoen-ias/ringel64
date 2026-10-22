import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';

// Analytische Kollisionskörper an Object3Ds: Box (beliebig gedreht), Zylinder (lokale Y-Achse),
// Kugel und Innenzylinder (hält den Spieler innerhalb, z. B. Trommel). Alle Möbel der Welt
// sind aus diesen Formen gebaut, deshalb braucht es keine Mesh-Kollision.
const _p = new THREE.Vector3(), _q = new THREE.Vector3(), _d = new THREE.Vector3();
const _n = new THREE.Vector3();

export class Kollider {
  constructor(obj, art, p = {}) {
    this.obj = obj; this.art = art;
    this.halb = p.halb || new THREE.Vector3(.5, .5, .5);
    this.radius = p.radius ?? .5; this.halbHoehe = p.halbHoehe ?? .5;
    this.fest = p.fest ?? true;          // blockiert
    this.trigger = p.trigger ?? false;   // nur Berührung melden
    this.eis = p.eis ?? false;
    this.sprung = p.sprung ?? 0;         // Trampolin: Aufprall → Geschwindigkeit nach oben
    this.schaden = p.schaden ?? false;
    this.wasser = p.wasser ?? false;
    this.hitze = p.hitze ?? false;
    this.wind = p.wind || null;          // Vector3 Kraft
    this.knopf = p.knopf || null;        // { braucheNass, braucheStampf, beiDruecken, gedrueckt }
    this.beweglich = p.beweglich ?? false;
    this.beiBeruehrung = p.beiBeruehrung || null;
    this.name = p.name || '';
    this.aktiv = true;
    this.inv = new THREE.Matrix4(); this.mat = new THREE.Matrix4(); this.vorher = new THREE.Matrix4();
    this.aktualisiere(); this.vorher.copy(this.mat);
  }
  aktualisiere() {
    this.obj.updateWorldMatrix(true, false);
    this.mat.copy(this.obj.matrixWorld);
    this.inv.copy(this.mat).invert();
  }
  // Weltposition des Kolliders
  mitte(ziel) { return ziel.setFromMatrixPosition(this.mat); }

  // Prüft eine Kugel (pos, r). Füllt out.normal / out.tiefe, gibt true bei Kontakt.
  kontakt(pos, r, out) {
    if (!this.aktiv) return false;
    _p.copy(pos).applyMatrix4(this.inv);
    let tiefe = 0;
    if (this.art === 'box') {
      const h = this.halb;
      _q.set(THREE.MathUtils.clamp(_p.x, -h.x, h.x), THREE.MathUtils.clamp(_p.y, -h.y, h.y), THREE.MathUtils.clamp(_p.z, -h.z, h.z));
      _d.subVectors(_p, _q);
      const dist = _d.length();
      if (dist > 1e-6) { if (dist >= r) return false; _n.copy(_d).divideScalar(dist); tiefe = r - dist; }
      else {
        const ox = h.x - Math.abs(_p.x), oy = h.y - Math.abs(_p.y), oz = h.z - Math.abs(_p.z);
        if (ox <= oy && ox <= oz) { _n.set(Math.sign(_p.x) || 1, 0, 0); tiefe = ox + r; }
        else if (oy <= oz) { _n.set(0, Math.sign(_p.y) || 1, 0); tiefe = oy + r; }
        else { _n.set(0, 0, Math.sign(_p.z) || 1); tiefe = oz + r; }
      }
    } else if (this.art === 'zylinder') {
      const rl = Math.hypot(_p.x, _p.z);
      const dr = Math.max(0, rl - this.radius), dy = Math.max(0, Math.abs(_p.y) - this.halbHoehe);
      if (dr > 0 || dy > 0) {
        const dist = Math.hypot(dr, dy);
        if (dist >= r) return false;
        const rx = rl > 1e-6 ? _p.x / rl : 1, rz = rl > 1e-6 ? _p.z / rl : 0;
        _n.set(rx * dr, (Math.sign(_p.y) || 1) * dy, rz * dr).divideScalar(dist); tiefe = r - dist;
      } else {
        const ir = this.radius - rl, iy = this.halbHoehe - Math.abs(_p.y);
        if (iy <= ir) { _n.set(0, Math.sign(_p.y) || 1, 0); tiefe = iy + r; }
        else { const rx = rl > 1e-6 ? _p.x / rl : 1, rz = rl > 1e-6 ? _p.z / rl : 0; _n.set(rx, 0, rz); tiefe = ir + r; }
      }
    } else if (this.art === 'kugel') {
      const dist = _p.length();
      if (dist >= r + this.radius) return false;
      _n.copy(_p).divideScalar(Math.max(dist, 1e-6)); tiefe = r + this.radius - dist;
    } else if (this.art === 'innenZylinder') {
      const rl = Math.hypot(_p.x, _p.z);
      if (Math.abs(_p.y) > this.halbHoehe + r) return false;
      if (rl <= this.radius - r) return false;
      _n.set(-_p.x / Math.max(rl, 1e-6), 0, -_p.z / Math.max(rl, 1e-6)); tiefe = rl - (this.radius - r);
    } else return false;
    out.normal.copy(_n).transformDirection(this.mat);
    out.tiefe = tiefe;
    return true;
  }
}

// Prüft, ob ein Punkt (mit Radius) irgendeinen festen Kollider berührt — für Kamera und Bodenabfrage.
const _k = { normal: new THREE.Vector3(), tiefe: 0 };
export function festerKontakt(kollider, pos, r, ausschluss = null) {
  for (const k of kollider) {
    if (!k.fest || k === ausschluss) continue;
    if (k.kontakt(pos, r, _k)) return k;
  }
  return null;
}
