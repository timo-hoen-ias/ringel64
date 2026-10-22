import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';
import { festerKontakt } from '../engine/kollision.js';

// Third-Person-Kamera: folgt weich, lässt sich drehen, weicht Wänden aus, dreht sich sanft hinter den Spieler.
const _p = new THREE.Vector3(), _z = new THREE.Vector3();
export class Kamera {
  constructor(kamera) {
    this.cam = kamera; this.yaw = 0; this.pitch = .32; this.dist = 7.5;
    this.ziel = new THREE.Vector3(); this.vorwaerts = new THREE.Vector3(0, 0, -1); this.rechts = new THREE.Vector3(1, 0, 0);
    this.manuell = 0; this.ersteFrame = true;
  }
  setze(spieler, info = {}) {
    this.yaw = info.yaw ?? spieler.yaw + Math.PI; this.pitch = info.pitch ?? .32; this.dist = info.dist ?? 7.5;
    this.ziel.copy(spieler.pos).setY(spieler.pos.y + 1.2); this.ersteFrame = true; this.positioniere(null);
  }
  update(dt, spieler, eingabe, welt) {
    const ka = eingabe.kameraAchse();
    if (Math.abs(ka.x) > .01 || Math.abs(ka.y) > .01) { this.yaw -= ka.x * dt; this.pitch += ka.y * dt; this.manuell = 1.2; }
    this.manuell -= dt;
    this.pitch = THREE.MathUtils.clamp(this.pitch, -.15, 1.1);
    // sanft hinter den Spieler drehen, wenn er sich bewegt
    const tempo = Math.hypot(spieler.v.x, spieler.v.z);
    if (this.manuell <= 0 && tempo > 3 && !spieler.zug) {
      const wunsch = Math.atan2(-spieler.v.x, -spieler.v.z);
      let d = (wunsch - this.yaw + Math.PI * 3) % (Math.PI * 2) - Math.PI;
      this.yaw += d * Math.min(1, dt * .9);
    }
    this.vorwaerts.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    this.rechts.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    // Zielpunkt
    _z.copy(spieler.pos).setY(spieler.pos.y + 1.2);
    const k = this.ersteFrame ? 1 : Math.min(1, dt * 10);
    const ky = this.ersteFrame ? 1 : Math.min(1, dt * (spieler.amBoden || spieler.inWasser ? 10 : 4));
    this.ziel.x += (_z.x - this.ziel.x) * k; this.ziel.z += (_z.z - this.ziel.z) * k; this.ziel.y += (_z.y - this.ziel.y) * ky;
    this.ersteFrame = false;
    this.positioniere(welt);
  }
  positioniere(welt) {
    const d = this.dist;
    _p.set(this.ziel.x - this.vorwaerts.x * d * Math.cos(this.pitch), this.ziel.y + d * Math.sin(this.pitch), this.ziel.z - this.vorwaerts.z * d * Math.cos(this.pitch));
    let t = 1;
    if (welt) {
      const schritte = 16; let letzte = 1;
      for (let i = 2; i <= schritte; i++) {
        const a = i / schritte; const q = new THREE.Vector3().lerpVectors(this.ziel, _p, a);
        if (festerKontakt(welt.kollider, q, .4)) { t = Math.max(.12, (i - 1) / schritte); break; }
        letzte = a;
      }
      if (t === 1) t = letzte;
    }
    this.cam.position.lerpVectors(this.ziel, _p, t);
    this.cam.lookAt(this.ziel);
  }
}
