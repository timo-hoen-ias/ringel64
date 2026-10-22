import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';
import { baueSocke, baueFlusi, OUTFITS } from './sockenmodell.js';
import { festerKontakt } from '../engine/kollision.js';
import { Texturen, aktiviereSchatten } from '../engine/texturen.js';

const RADIUS = .5;
const _n = new THREE.Vector3(), _m = new THREE.Vector3(), _delta = new THREE.Matrix4(), _inv = new THREE.Matrix4();
const _kontakt = { normal: new THREE.Vector3(), tiefe: 0 };
const _v = new THREE.Vector3();

export class Spieler {
  constructor(welt, spawn) {
    this.welt = welt; this.spiel = welt.spiel;
    this.pos = spawn.clone(); this.v = new THREE.Vector3(); this.mitte = new THREE.Vector3();
    this.yaw = 0; this.amBoden = false; this.boden = null; this.coyote = 0; this.puffer = 0; this.doppel = true;
    this.dreht = 0; this.stampft = false; this.gleitet = false; this.zug = null; this.zugPause = 0;
    this.nass = false; this.trockenTimer = 0; this.inWasser = false; this.wasserOberflaeche = 0;
    this.faeden = 3; this.unverwundbar = 0; this.tot = false; this.totTimer = 0; this.festgehalten = 0;
    this.schlaeft = false; this.schnarch = 0; this.jubelTimer = 0; this.tropf = 0; this.t = 0; this.eis = false;
    this.luftZeit = 0; this.letzteBodenHoehe = spawn.y; this.gelandet = false; this.sprungGehalten = false;
    this.checkpoint = spawn.clone(); this.hinweis = '';
    this.baueModell();
    this.welt.scene.add(this.gruppe);
    // Blob-Schatten
    this.schatten = new THREE.Mesh(new THREE.CircleGeometry(.5, 12), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .35, depthWrite: false }));
    this.schatten.rotation.x = -Math.PI / 2; this.schatten.userData.keinSchatten = true; this.schatten.visible = false; this.welt.scene.add(this.schatten);
    // Gummizug-Linie
    this.linie = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xe8474c }));
    this.linie.visible = false; this.linie.frustumCulled = false; this.welt.scene.add(this.linie);
    // Zzz
    this.zzz = new THREE.Sprite(new THREE.SpriteMaterial({ map: Texturen.sprechblase('Zzz...'), transparent: true, depthTest: false }));
    this.zzz.scale.set(2.4, .6, 1); this.zzz.visible = false; this.welt.scene.add(this.zzz);
  }
  baueModell() {
    if (this.gruppe) this.welt.scene.remove(this.gruppe);
    this.gruppe = new THREE.Group();
    const outfit = OUTFITS[this.spiel.spielstand.daten.outfit] || OUTFITS[0];
    this.outfit = outfit;
    this.modell = baueSocke({ outfit });
    this.gruppe.add(this.modell.gruppe);
    this.flusi = baueFlusi(); this.flusi.position.set(0, 1.08, -.05); this.modell.bein.add(this.flusi);
    // Gunther, die Fliege
    this.fliege = new THREE.Mesh(new THREE.SphereGeometry(.06, 5, 4), new THREE.MeshBasicMaterial({ color: 0x1a1218 }));
    const fl = new THREE.Mesh(new THREE.BoxGeometry(.12, .02, .06), new THREE.MeshBasicMaterial({ color: 0xccccff, transparent: true, opacity: .6 }));
    fl.position.y = .04; this.fliege.add(fl); this.gruppe.add(this.fliege);
    this.welt.scene.add(this.gruppe);
    aktiviereSchatten(this.gruppe);
    this.setzeNassOptik();
  }
  setzeNassOptik() {
    const k = this.nass ? .55 : 1;
    this.gruppe.traverse(o => { if (o.isMesh && o.material && o.material.isMeshLambertMaterial) { if (!o.userData.basis) o.userData.basis = o.material; o.material = o.userData.basis.clone(); o.material.color.multiplyScalar(k); } });
  }
  get angriffAktiv() { return this.dreht > 0 || this.stampft || this.stampfLandung > 0; }

  // ---- Zustand von außen ----
  verletze(quelle) {
    if (this.unverwundbar > 0 || this.tot || this.festgehalten > 0) return;
    this.faeden--; this.unverwundbar = 1.6;
    this.spiel.audio.sfx('quietsch'); this.spiel.renderer.wackeln = .5;
    this.rueckstoss(quelle, 6, 7); this.schlaeft = false;
    this.welt.partikel.spawn(this.mitte, { anzahl: 8, farbe: 0xe8474c, geschwindigkeit: 3, leben: .5 });
    this.spiel.hud.aktualisiere();
    if (this.faeden <= 0) this.stirb('Alle Fäden gerissen!');
  }
  rueckstoss(quelle, h = 6, hoch = 7) {
    _v.subVectors(this.pos, quelle).setY(0); if (_v.lengthSq() < 1e-4) _v.set(0, 0, 1); _v.normalize();
    this.v.x = _v.x * h; this.v.z = _v.z * h; this.v.y = hoch; this.amBoden = false; this.zug = null; this.stampft = false; this.eigenerSprung = false;
  }
  wirfWeg(quelle, h, hoch) { this.festgehalten = 0; this.rueckstoss(quelle, h, hoch); this.unverwundbar = 1; }
  festhalten(dauer, pos) { this.festgehalten = dauer; this.v.set(0, 0, 0); this.pos.copy(pos).add(new THREE.Vector3(0, 1.2, 1.4)); }
  jubel(d) { this.jubelTimer = d; }
  stirb(grund) {
    if (this.tot) return;
    this.tot = true; this.totTimer = 1.3; this.zug = null; this.stampft = false;
    this.spiel.audio.sfx('quietsch'); this.spiel.audio.sfx('fehler');
    this.v.set(0, 9, 0);
    if (grund) this.spiel.hud.popup(grund);
  }
  wiederbelebe() {
    const st = this.spiel.spielstand;
    st.daten.leben--;
    if (st.daten.leben < 0) { st.daten.leben = 0; this.spiel.hud.popup('Egal. Socken sterben nicht.'); }
    st.speichere();
    this.tot = false; this.faeden = 3; this.unverwundbar = 2; this.pos.copy(this.checkpoint); this.v.set(0, 0, 0);
    this.nass = false; this.setzeNassOptik(); this.schlaeft = false; this.stampft = false; this.dreht = 0;
    this.spiel.renderer.blitz(.8); this.spiel.hud.aktualisiere();
    this.welt.beiRespawn && this.welt.beiRespawn();
  }
  setzeNass(nass) {
    if (this.nass === nass) return;
    this.nass = nass; this.setzeNassOptik(); this.spiel.hud.aktualisiere();
    this.spiel.audio.sfx(nass ? 'nass' : 'trocken');
    this.welt.partikel.spawn(this.mitte, nass ? { anzahl: 10, farbe: 0x7fc8ff, geschwindigkeit: 3, leben: .5 } : { anzahl: 10, farbe: 0xffffff, geschwindigkeit: 1.5, leben: .9, gravitation: 2, groesse: .12 });
    if (!nass) this.spiel.hud.popup('Trocken und flauschig!'); else this.spiel.hud.popup('Nass und schwer.');
  }

  // ---- Hauptschleife ----
  update(dt, eingabe, kamera) {
    this.t += dt;
    const audio = this.spiel.audio;
    this.mitte.copy(this.pos).setY(this.pos.y + RADIUS);
    if (this.unverwundbar > 0) this.unverwundbar -= dt;
    if (this.jubelTimer > 0) this.jubelTimer -= dt;
    if (this.zugPause > 0) this.zugPause -= dt;
    if (this.stampfLandung > 0) this.stampfLandung -= dt;

    if (this.tot) {
      this.totTimer -= dt; this.v.y -= 25 * dt; this.pos.addScaledVector(this.v, dt);
      this.gruppe.rotation.y += dt * 12; this.gruppe.position.copy(this.pos);
      if (this.totTimer <= 0) { this.gruppe.rotation.set(0, 0, 0); this.wiederbelebe(); }
      return;
    }
    if (this.festgehalten > 0) { this.festgehalten -= dt; this.gruppe.position.copy(this.pos); this.gruppe.rotation.z = Math.sin(this.t * 30) * .2; this.animiere(dt, 0); return; }
    this.gruppe.rotation.z = 0;

    // Mitnahme durch bewegte Plattform
    if (this.amBoden && this.boden && this.boden.beweglich) {
      _inv.copy(this.boden.vorher).invert(); _delta.multiplyMatrices(this.boden.mat, _inv);
      this.pos.applyMatrix4(_delta);
      const e = new THREE.Euler().setFromRotationMatrix(_delta, 'YXZ'); this.yaw += e.y;
    }

    // Eingabe
    const achse = eingabe.achse();
    const vor = kamera.vorwaerts, rechts = kamera.rechts;
    const wunsch = new THREE.Vector3(vor.x * achse.y + rechts.x * achse.x, 0, vor.z * achse.y + rechts.z * achse.x);
    const staerke = Math.min(1, wunsch.length());
    if (staerke > 0.01) wunsch.divideScalar(staerke);
    if (eingabe.gedrueckt('springen')) this.puffer = .13;
    this.puffer -= dt; this.coyote -= dt;
    this.sprungGehalten = eingabe.gehalten('springen');

    // Schlafen
    if (this.schlaeft) { if (eingabe.ruheSekunden < .1 || !this.amBoden) { this.schlaeft = false; this.zzz.visible = false; }
      else { this.schnarch -= dt; if (this.schnarch <= 0) { this.schnarch = 2.2; audio.sfx('schnarch'); } } }
    else if (eingabe.ruheSekunden > 8 && this.amBoden && !this.inWasser && this.v.lengthSq() < .1 && !this.spiel.dialog.offen) { this.schlaeft = true; this.schnarch = .5; }

    // Gummizug
    const haken = this.naechsterHaken();
    this.hinweis = '';
    if (this.zug) {
      this.zug.t += dt;
      const ziel = this.zug.haken.pos;
      _v.subVectors(ziel, this.mitte); const d = _v.length();
      if (d < 1.0 || this.zug.t > 3) { this.zug = null; this.v.set(0, 5, 0); this.doppel = true; this.coyote = .35; this.zugPause = .4; }
      else { _v.divideScalar(d); this.v.copy(_v).multiplyScalar(17); }
    } else if (haken && !this.schlaeft) {
      this.hinweis = 'Shift / X: Gummizug';
      if (eingabe.gedrueckt('zug') && this.zugPause <= 0) { this.zug = { haken, t: 0 }; this.stampft = false; this.gleitet = false; this.amBoden = false; audio.sfx('zug');
        this.welt.partikel.spawn(this.mitte, { anzahl: 6, farbe: 0xe8474c, geschwindigkeit: 2, leben: .3 }); }
    }

    if (!this.zug) {
      // Horizontale Bewegung
      const maxTempo = this.inWasser ? 4 : this.gleitet ? 6 : 7;
      const eis = this.eis && !this.nass && this.amBoden;
      let beschl = this.amBoden ? (eis ? 9 : 48) : 18;
      let bremse = this.amBoden ? (eis ? 1.5 : 30) : 4;
      if (this.inWasser) { beschl = 14; bremse = 6; }
      const vh = new THREE.Vector3(this.v.x, 0, this.v.z);
      if (staerke > .01 && !this.stampft) {
        const ziel = wunsch.clone().multiplyScalar(maxTempo * staerke);
        const diff = ziel.sub(vh); const l = diff.length();
        if (l > 0) vh.addScaledVector(diff.divideScalar(l), Math.min(l, beschl * dt));
        this.yaw = this.lerpWinkel(this.yaw, Math.atan2(wunsch.x, wunsch.z), Math.min(1, dt * 14));
      } else {
        const l = vh.length(); if (l > 0) vh.multiplyScalar(Math.max(0, l - bremse * dt) / l);
      }
      this.v.x = vh.x; this.v.z = vh.z;

      // Springen
      const kannSpringen = (this.amBoden || this.coyote > 0);
      if (this.puffer > 0 && !this.schlaeft) {
        if (this.inWasser) {
          if (this.pos.y > this.wasserOberflaeche - .9) { this.v.y = 10; this.puffer = 0; this.inWasser = false; audio.sfx('springen'); this.doppel = true; this.eigenerSprung = true; }
          else { this.puffer = 0; audio.sfx('blubb'); this.welt.partikel.spawn(this.mitte, { anzahl: 3, farbe: 0xbfe8ff, geschwindigkeit: 1.5, gravitation: 3, leben: .5 }); }
        } else if (kannSpringen) {
          this.v.y = this.nass ? 10 : 11.5; this.puffer = 0; this.coyote = 0; this.amBoden = false; this.doppel = true; this.eigenerSprung = true; audio.sfx('springen');
          this.welt.partikel.spawn(this.pos, { anzahl: 5, farbe: 0xd8d2e0, geschwindigkeit: 2, leben: .4, groesse: .1 });
        } else if (this.doppel && !this.stampft) {
          this.v.y = this.nass ? 8.5 : 9.5; this.doppel = false; this.dreht = .55; this.puffer = 0; this.eigenerSprung = true; audio.sfx('doppel');
          this.welt.partikel.spawn(this.mitte, { anzahl: 8, farbe: [0xe8474c, 0xffffff], geschwindigkeit: 3, leben: .4 });
        }
      }
      // Variable Sprunghöhe
      if (!this.sprungGehalten && this.eigenerSprung && this.v.y > 6 && !this.inWasser && this.dreht <= 0) this.v.y = 6;

      // Stampfattacke (nass, in der Luft)
      if (eingabe.gedrueckt('stampf') && !this.amBoden && !this.inWasser && !this.stampft) {
        if (this.nass) { this.stampft = true; this.dreht = 0; this.gleitet = false; this.v.set(this.v.x * .3, -26, this.v.z * .3); audio.sfx('zug'); }
        else { this.spiel.hud.popup('Zum Stampfen musst du nass sein!'); audio.sfx('fehler'); }
      }
      // Gleiten (trocken, in der Luft, Sprung gehalten, nach dem Schleudergang oder beim Fallen)
      this.gleitet = !this.nass && !this.amBoden && !this.inWasser && !this.stampft && this.sprungGehalten && this.v.y < 0 && this.luftZeit > .25 && !this.doppel;
      // Schwerkraft
      let g = this.nass ? -36 : -28;
      if (this.inWasser) { // Schwimmen: Springen gedrückt = auftauchen, Stampfen gedrückt = abtauchen, sonst langsam sinken
        g = -4;
        if (this.sprungGehalten) this.v.y = Math.min(this.v.y + 30 * dt, 4.5);
        else if (eingabe.gehalten('stampf')) this.v.y = Math.max(this.v.y - 30 * dt, -5);
        if (Math.random() < dt * 3) this.welt.partikel.spawn(this.mitte, { anzahl: 1, farbe: 0xdff4ff, geschwindigkeit: .6, gravitation: 3, leben: 1.2, groesse: .09 });
      }
      if (this.gleitet) { g = -6; if (this.v.y < -2.2) this.v.y = -2.2; }
      if (this.stampft) g = -10;
      this.v.y += g * dt;
      if (this.inWasser && this.v.y < -2 && !eingabe.gehalten('stampf')) this.v.y = -2;
      if (this.v.y < -40) this.v.y = -40;
    }
    if (this.dreht > 0) this.dreht -= dt;

    // Bewegung mit Teilschritten und Kollision
    const warAmBoden = this.amBoden;
    const bodenVorher = this.boden;
    this.amBoden = false; this.boden = null; this.eis = false;
    let imWasser = false, inHitze = false; const wind = new THREE.Vector3(); let schaden = false; let sprung = 0; const beruehrt = [];
    const schritte = Math.max(1, Math.ceil(this.v.length() * dt / .3));
    const kollider = this.welt.kollider;
    for (let s = 0; s < schritte; s++) {
      this.pos.addScaledVector(this.v, dt / schritte);
      for (let it = 0; it < 3; it++) {
        this.mitte.copy(this.pos).setY(this.pos.y + RADIUS);
        let bewegt = false;
        for (const k of kollider) {
          if (!k.aktiv) continue;
          if (!k.kontakt(this.mitte, RADIUS, _kontakt)) continue;
          if (!k.fest) {
            if (it === 0 && s === schritte - 1) { if (k.wasser) { imWasser = true; this.wasserOberflaeche = k.obj.position.y + k.halb.y; } if (k.hitze) inHitze = true; if (k.wind) wind.add(k.wind);
              if (k.schaden) schaden = true; if (k.beiBeruehrung) beruehrt.push(k); }
            continue;
          }
          const n = _kontakt.normal, tiefe = _kontakt.tiefe;
          this.pos.addScaledVector(n, tiefe); this.mitte.copy(this.pos).setY(this.pos.y + RADIUS); bewegt = true;
          const vn = this.v.dot(n);
          if (n.y > .55) {
            this.amBoden = true; this.boden = k; if (k.eis) this.eis = true;
            if (k.sprung && vn < -1) sprung = Math.max(sprung, k.sprung);
            if (k.knopf) this.drueckeKnopf(k.knopf, false);
          }
          if (vn < 0) this.v.addScaledVector(n, -vn);
          if (k.schaden) schaden = true;
          if (k.beiBeruehrung) beruehrt.push(k);
        }
        if (!bewegt) break;
      }
    }
    for (const k of beruehrt) k.beiBeruehrung(this, k);
    if (sprung > 0) { this.v.y = sprung; this.amBoden = false; this.doppel = true; this.eigenerSprung = false; audio.sfx('sprungfeld'); }
    if (wind.y > 0 || this.zug) this.eigenerSprung = false;
    if (this.amBoden && this.zug && this.zug.t > .3) this.zug = null;
    // Wind
    if (wind.lengthSq() > 0) { const k = this.nass ? .25 : 1; this.v.addScaledVector(wind, k * dt); if (!this.amBoden && !this.nass && wind.y > 0) this.gleitet = this.gleitet || this.sprungGehalten; }
    if (schaden && this.unverwundbar <= 0) this.verletze(this.pos.clone().add(new THREE.Vector3(Math.random() - .5, 0, Math.random() - .5)));

    // Wasser / Nass / Trocken
    if (imWasser && !this.inWasser) { if (!this.nass) this.setzeNass(true); else audio.sfx('blubb'); this.welt.partikel.spawn(this.mitte, { anzahl: 8, farbe: 0x7fc8ff, geschwindigkeit: 3, leben: .5 }); this.stampft = false; }
    this.inWasser = imWasser;
    if (imWasser) { this.doppel = true; this.coyote = 0; }
    if (this.welt.info.immerTrocken) inHitze = true;
    if (inHitze && this.nass) { this.trockenTimer += dt; if (this.trockenTimer > (this.welt.info.immerTrocken ? .2 : .9)) { this.setzeNass(false); this.trockenTimer = 0; }
      else if (Math.random() < dt * 8) this.welt.partikel.spawn(this.mitte, { anzahl: 1, farbe: 0xffffff, geschwindigkeit: 1, leben: .8, gravitation: 2, groesse: .1 }); }
    else this.trockenTimer = 0;

    // Landung
    if (this.amBoden) {
      this.coyote = .13; this.doppel = true;
      if (!warAmBoden) {
        this.luftZeit = 0;
        if (this.stampft) { this.stampfe(); } else audio.sfx('landen');
        this.welt.partikel.spawn(this.pos, { anzahl: 4, farbe: 0xd8d2e0, geschwindigkeit: 1.5, leben: .3, groesse: .08 });
      }
      this.letzteBodenHoehe = this.pos.y; this.gleitet = false;
    } else { this.luftZeit += dt; if (bodenVorher && this.coyote <= 0 && !warAmBoden) { /* bereits in der Luft */ } }

    // Sturz
    if (this.pos.y < this.welt.info.todesHoehe) { this.stirb('Plumps.'); }

    // Nass tropfen
    if (this.nass) { this.tropf -= dt; if (this.tropf <= 0) { this.tropf = .35; this.welt.partikel.spawn(this.pos.clone().setY(this.pos.y + .3), { anzahl: 1, farbe: 0x7fc8ff, geschwindigkeit: .5, leben: .5, groesse: .08 }); } }

    // Gummizug-Linie
    this.linie.visible = !!this.zug;
    if (this.zug) { const p = this.linie.geometry.attributes.position; p.setXYZ(0, this.pos.x, this.pos.y + 1.1, this.pos.z); p.setXYZ(1, this.zug.haken.pos.x, this.zug.haken.pos.y, this.zug.haken.pos.z); p.needsUpdate = true; }
    for (const h of this.welt.haken) { const nah = h === haken; h.ring.scale.setScalar(nah ? 1.3 + Math.sin(this.t * 10) * .2 : 1); h.ring.material.emissive.setHex(nah ? 0x886600 : 0x332200); }

    this.mitte.copy(this.pos).setY(this.pos.y + RADIUS);
    this.gruppe.position.copy(this.pos);
    this.animiere(dt, staerke);
  }

  stampfe() {
    this.stampft = false; this.stampfLandung = .15;
    this.spiel.audio.sfx('stampf'); this.spiel.renderer.wackeln = .8;
    this.welt.partikel.spawn(this.pos, { anzahl: 22, farbe: [0xd8d2e0, 0x7fc8ff], geschwindigkeit: 6, leben: .6, groesse: .14 });
    for (const g of [...this.welt.gegner]) if (g.gruppe.position.distanceTo(this.pos) < 3.2 && !g.tot) g.treffer(null);
    for (const k of this.welt.kollider) if (k.knopf && k.knopf.braucheStampf && !k.knopf.gedrueckt && k.mitte(_m).distanceTo(this.pos) < 2.6) this.drueckeKnopf(k.knopf, true);
    this.welt.beiStampf && this.welt.beiStampf(this.pos);
  }
  drueckeKnopf(knopf, gestampft) {
    if (knopf.gedrueckt) return;
    if (knopf.braucheStampf && !gestampft) { this.hinweis = 'Stampfattacke nötig (nass + Strg/B in der Luft)'; return; }
    if (knopf.braucheNass && !this.nass) { this.hinweis = 'Zu leicht! Mach dich nass.'; return; }
    knopf.beiDruecken();
  }
  naechsterHaken() {
    let best = null, bd = 9.5;
    for (const h of this.welt.haken) {
      if (h.obj.visible === false) continue;
      const d = h.pos.distanceTo(this.mitte);
      if (d < bd && h.pos.y > this.pos.y - 1.5) { bd = d; best = h; }
    }
    return best;
  }
  lerpWinkel(a, b, t) { let d = (b - a + Math.PI * 3) % (Math.PI * 2) - Math.PI; return a + d * t; }

  animiere(dt, staerke) {
    const m = this.modell; const g = m.gruppe;
    g.rotation.y = this.yaw;
    const tempo = Math.hypot(this.v.x, this.v.z);
    if (this.schlaeft) {
      g.rotation.x += (Math.PI / 2 * .9 - g.rotation.x) * Math.min(1, dt * 4); g.position.y = .2;
      this.zzz.visible = true; this.zzz.position.copy(this.pos).add(new THREE.Vector3(.5, 1.2 + Math.sin(this.t * 2) * .15, 0));
    } else {
      g.rotation.x += (0 - g.rotation.x) * Math.min(1, dt * 6); g.position.y = 0;
    }
    if (this.dreht > 0) { g.rotation.y = this.yaw + (0.55 - this.dreht) / .55 * Math.PI * 4; m.bein.rotation.x = -.3; }
    else if (this.stampft) { m.bein.rotation.x = .6; g.scale.set(1.2, .8, 1.2); }
    else if (this.gleitet) { m.bein.rotation.x = -.9; g.scale.set(1.3, .9, 1.3); m.bein.rotation.z = Math.sin(this.t * 6) * .1; }
    else if (!this.amBoden) { m.bein.rotation.x = -.25 + THREE.MathUtils.clamp(-this.v.y * .02, -.2, .3); g.scale.set(.9, 1.15, .9); }
    else if (tempo > .5) { const ph = this.t * 12 * Math.min(1, tempo / 7);
      m.bein.rotation.x = Math.sin(ph) * .35 - .1; g.position.y = Math.abs(Math.sin(ph)) * .18; g.scale.set(1 + Math.sin(ph) * .06, 1 - Math.sin(ph) * .08, 1); }
    else { m.bein.rotation.x = Math.sin(this.t * 2.5) * .05; g.scale.set(1 + Math.sin(this.t * 2.5) * .02, 1 - Math.sin(this.t * 2.5) * .02, 1); }
    if (this.jubelTimer > 0) { g.position.y += Math.abs(Math.sin(this.t * 14)) * .3; g.rotation.y += Math.sin(this.t * 8) * .4; }
    if (this.unverwundbar > 0) g.visible = Math.floor(this.unverwundbar * 12) % 2 === 0; else g.visible = true;
    this.flusi.position.y = 1.08 + Math.sin(this.t * 3) * .03; this.flusi.rotation.y = Math.sin(this.t * 1.5) * .4;
    // Gunther kreist
    const a = this.t * 5;
    this.fliege.position.set(Math.cos(a) * .7, 1.3 + Math.sin(a * 2.3) * .2, Math.sin(a) * .7);
    this.fliege.rotation.y = -a;
  }
  aktualisiereSchatten() {
    const r = .3;
    for (let i = 0; i <= 40; i++) {
      _m.set(this.pos.x, this.pos.y + .2 - i * .35, this.pos.z);
      const k = festerKontakt(this.welt.kollider, _m, r);
      if (k) { this.schatten.visible = true; this.schatten.position.set(this.pos.x, Math.max(_m.y - r, this.pos.y - i * .35 - r) + .36, this.pos.z);
        // genauer an die Oberfläche: eine Stufe zurück und feiner suchen
        let y = _m.y; for (let j = 0; j < 6; j++) { y += .05; _m.y = y; if (!festerKontakt(this.welt.kollider, _m, r)) break; }
        this.schatten.position.y = y - r + .03;
        const s = Math.max(.3, 1 - i * .02); this.schatten.scale.set(s, s, 1);
        return; }
    }
    this.schatten.visible = false;
  }
}
