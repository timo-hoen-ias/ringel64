import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';

// Einfacher Partikel-Pool aus kleinen Würfeln (Staub, Tropfen, Funken, Herzen).
export class Partikel {
  constructor(szene, anzahl = 220) {
    this.geo = new THREE.BoxGeometry(1, 1, 1);
    this.pool = [];
    for (let i = 0; i < anzahl; i++) {
      const m = new THREE.Mesh(this.geo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
      m.visible = false; m.frustumCulled = false; m.userData.keinSchatten = true; szene.add(m);
      this.pool.push({ mesh: m, leben: 0, v: new THREE.Vector3(), g: 0, groesse: .1, maxLeben: 1, schrumpf: true });
    }
    this.naechster = 0;
  }
  spawn(pos, { anzahl = 8, farbe = 0xffffff, geschwindigkeit = 3, leben = .6, gravitation = -9, groesse = .14, streuung = 1, richtung = null, schrumpf = true } = {}) {
    for (let i = 0; i < anzahl; i++) {
      const p = this.pool[this.naechster]; this.naechster = (this.naechster + 1) % this.pool.length;
      p.mesh.visible = true; p.mesh.material.color.set(Array.isArray(farbe) ? farbe[i % farbe.length] : farbe);
      p.mesh.position.copy(pos).add(new THREE.Vector3((Math.random() - .5) * streuung, Math.random() * streuung * .5, (Math.random() - .5) * streuung));
      p.mesh.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      if (richtung) p.v.copy(richtung).multiplyScalar(geschwindigkeit).add(new THREE.Vector3((Math.random() - .5), (Math.random() - .5), (Math.random() - .5)).multiplyScalar(geschwindigkeit * .4));
      else p.v.set((Math.random() - .5) * 2, Math.random() * 1.2, (Math.random() - .5) * 2).normalize().multiplyScalar(geschwindigkeit * (.5 + Math.random() * .5));
      p.g = gravitation; p.leben = p.maxLeben = leben * (.7 + Math.random() * .6); p.groesse = groesse; p.schrumpf = schrumpf;
      p.mesh.scale.setScalar(groesse);
    }
  }
  update(dt) {
    for (const p of this.pool) {
      if (!p.mesh.visible) continue;
      p.leben -= dt;
      if (p.leben <= 0) { p.mesh.visible = false; continue; }
      p.v.y += p.g * dt;
      p.mesh.position.addScaledVector(p.v, dt);
      p.mesh.rotation.x += dt * 4; p.mesh.rotation.z += dt * 3;
      if (p.schrumpf) p.mesh.scale.setScalar(p.groesse * Math.min(1, p.leben / p.maxLeben * 2));
    }
  }
}
