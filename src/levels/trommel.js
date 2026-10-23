import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';
import { Texturen, material, faerbe } from '../engine/texturen.js';
import { Kollider } from '../engine/kollision.js';
import { baueFigur } from '../spiel/sockenmodell.js';
import { zeigeBlase } from '../spiel/npc.js';

export const info = {
  name: 'In der Trommel', musik: 'trommel', himmel: '#1a1420', tipp: 'Das Flusensieb des Barons ist seine Schwachstelle. Werde im Wasser nass und stampfe drauf, wenn es unten vorbeikommt.',
  nebel: { farbe: '#1a1420', nah: 14, fern: 40 }, licht: { himmel: 0xb0a0c0, boden: 0x201828, intensitaet: .7, sonne: 0xffd0b0, sonneIntensitaet: .8, richtung: [0, 10, 6] },
  todesHoehe: -10, spawn: [0, .3, 2], spawnYaw: Math.PI, kamera: { dist: 10.5, pitch: .38 },
  beiStart: (welt) => welt.trommelStart && welt.trommelStart(),
};

export function baue(welt, b) {
  const st = welt.spiel.spielstand;
  const fertig = !!st.daten.bosse.trommel;
  const R = 10;
  // Trommel: Gruppe um die Z-Achse gedreht; lokale Y-Achse = Welt-Z
  const trommel = b.gruppe(0, R, 0); trommel.rotation.x = Math.PI / 2;
  const wand = new THREE.Mesh(faerbe(new THREE.CylinderGeometry(R, R, 18, 28, 1, true), '#8a8a98', { verlauf: 0, variation: .15 }),
    material('#8a8a98', { textur: Texturen.metall(), wiederholung: 8, seite: THREE.BackSide }));
  trommel.add(wand);
  const wandK = new Kollider(wand, 'innenZylinder', { radius: R, halbHoehe: 9, name: 'trommelwand' });
  wand.userData.kollider = wandK; welt.fuegeKollider(wandK);
  // Lochmuster (Deko)
  for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2 * 5, y = -8 + (i % 12) * 1.5;
    const l = new THREE.Mesh(new THREE.CircleGeometry(.25, 6), new THREE.MeshBasicMaterial({ color: 0x0a0810 })); l.position.set(Math.cos(a) * (R - .05), y, Math.sin(a) * (R - .05)); l.lookAt(0, y, 0); trommel.add(l); }
  // Rippen
  for (let i = 0; i < 3; i++) { const t = i / 3 * Math.PI * 2;
    const r = b.box({ w: 2.2, h: 16, d: 1.4, x: Math.cos(t) * (R - 1), y: 0, z: Math.sin(t) * (R - 1), farbe: '#a8a8b8', textur: Texturen.metall(), wiederholung: 3, eltern: trommel, mitte: true });
    r.rotation.y = -t; r.userData.kollider.aktualisiere(); }
  // Flusensieb (Schwachstelle) an der Wand
  const sieb = b.box({ w: 1.2, h: 3.2, d: 3.2, x: 0, y: 0, z: 0, farbe: '#e8474c', emissive: 0x551010, eltern: trommel, mitte: true });
  const siebLicht = new THREE.PointLight(0xff3030, 24, 9, 1.5); sieb.add(siebLicht);
  const setzeSieb = (t) => { sieb.position.set(Math.cos(t) * (R - .6), 0, Math.sin(t) * (R - .6)); sieb.rotation.y = -t; sieb.userData.kollider.aktualisiere(); };
  setzeSieb(Math.PI * 1.1);
  // Wände vorn und hinten (statisch), Baron-Gesicht hinten, Tür vorn
  b.box({ w: 26, h: 26, d: 1, x: 0, y: -3, z: -9.5, farbe: '#6a6a78', textur: Texturen.metall(), wiederholung: 6 });
  const glas = b.box({ w: 26, h: 26, d: 1, x: 0, y: -3, z: 9.6, farbe: '#9ad1e8', transparent: true, opacity: .25 });
  void glas;
  const baron = baueFigur('baron'); baron.scale.setScalar(2.2); baron.position.set(0, R + 1, -8.9); welt.scene.add(baron);
  // Heizspirale hinten unten
  const spirale = new THREE.Mesh(new THREE.TorusGeometry(2.2, .3, 8, 20), material(fertig ? '#ff8c3a' : '#55505a', { vertexColors: false, emissive: fertig ? 0x662200 : 0 }));
  spirale.position.set(0, 3.5, -8.8); welt.scene.add(spirale);
  if (fertig) b.lampe(0, 4, -7, 0xff8c3a, 2, 16);
  // Wasser und Heizplatte unten
  const wasser = b.wasser({ w: 9, h: 1.3, d: 16, x: 0, y: 0, z: 0 });
  const wasserK = wasser.userData.kollider;
  const hitze = b.hitze({ w: 9, h: 2, d: 16, x: 0, y: 0, z: 0, farbe: '#ff5a1a' }); const hitzeK = hitze.userData.kollider; hitzeK.aktiv = false;
  const glutBoden = new THREE.Mesh(new THREE.PlaneGeometry(9, 16), new THREE.MeshBasicMaterial({ color: 0xff5a1a, transparent: true, opacity: .45 })); glutBoden.rotation.x = -Math.PI / 2; glutBoden.position.set(0, .06, 0); glutBoden.visible = false; welt.scene.add(glutBoden);
  // Ausgang vorn unten
  const tuerDisc = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, .2, 14), new THREE.MeshBasicMaterial({ color: 0x2a1a2e })); tuerDisc.rotation.x = Math.PI / 2; tuerDisc.position.set(0, 1.8, 9.0); welt.scene.add(tuerDisc);
  b.schild({ text: 'Ausgang', x: 0, y: 2.9, z: 9.0, b: 2.4, h: .8, pfosten: false });
  welt.portale.push({ pos: new THREE.Vector3(0, 1, 9.0), ziel: 'hub', name: 'Waschkeller', benoetigt: 0, innen: tuerDisc });
  b.fusselKreis(0, 2.2, 0, 6, 8);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; b.fussel(Math.cos(a) * 3, R + Math.sin(a) * 3, 6); }

  // ---- Kampfsteuerung ----
  const kampf = { phase: 0, omega: 0, laeuft: false, taktTimer: 0, heiss: false, klumpenTimer: 0 };
  const dialog = welt.spiel.dialog;
  const ks = []; trommel.traverse(o => { if (o.userData.kollider) { o.userData.kollider.beweglich = true; ks.push(o.userData.kollider); } });
  welt.dinge.push({ update: dt => {
    if (kampf.omega !== 0) { trommel.rotation.y += kampf.omega * dt; ks.forEach(k => k.aktualisiere()); }
    sieb.material.emissive.setHex(Math.sin(welt.t * 8) > 0 ? 0x771010 : 0x330000);
    if (!kampf.laeuft) return;
    if (kampf.phase >= 2) { // Kochwäsche: Boden wechselt zwischen Wasser und Hitze
      kampf.taktTimer += dt; const heiss = (kampf.taktTimer % 6) > 3;
      if (heiss !== kampf.heiss) { kampf.heiss = heiss; hitzeK.aktiv = heiss; glutBoden.visible = heiss; wasserK.aktiv = !heiss; wasser.visible = !heiss; welt.spiel.audio.sfx(heiss ? 'trocken' : 'nass'); }
      if (heiss && Math.random() < dt * 12) welt.partikel.spawn(new THREE.Vector3((Math.random() - .5) * 8, .3, (Math.random() - .5) * 14), { anzahl: 1, farbe: 0xffffff, geschwindigkeit: 1, leben: .8, gravitation: 2, groesse: .12 });
    }
    if (kampf.phase >= 2) { kampf.klumpenTimer -= dt; if (kampf.klumpenTimer <= 0 && welt.gegner.length < (kampf.phase >= 3 ? 3 : 2)) { kampf.klumpenTimer = 5;
      b.gegner('klumpen', { x: (Math.random() - .5) * 6, y: 0, z: (Math.random() - .5) * 10, trommel: { x: 0, y: R, r: R }, leben: 16 }); zeigeBlase(welt, baron, 'FLUSEN!', 1.5, 3.5); } }
  } });
  const sprueche = [['Du? DU willst mich besiegen? Eine halbe Socke?', 'Schonwaschgang. Für Empfindliche.'], ['Autsch! Mein Sieb! Jetzt wird es heiß: KOCHWÄSCHE!'], ['Genug! SCHLEUDERN!']];
  const startePhase = (p) => {
    kampf.phase = p; kampf.laeuft = true; kampf.omega = [0, .3, .5, .7][p];
    setzeSieb(Math.PI * (1.1 + p * .7));
    sieb.userData.kollider.knopf.gedrueckt = false;
    welt.spiel.audio.sfx('boss'); welt.spiel.renderer.wackeln = 1;
    sprueche[p - 1].forEach((s, i) => setTimeout(() => zeigeBlase(welt, baron, s, 2.6, 3.5), i * 2800));
    welt.spiel.hud.popup(['', 'Phase 1: Schonwaschgang', 'Phase 2: Kochwäsche', 'Phase 3: Schleudern'][p]);
  };
  const sieg = () => {
    kampf.laeuft = false; let w = kampf.omega; const bremse = { update: dt => { w = Math.max(0, w - dt * .3); kampf.omega = w; if (w === 0) welt.dinge.splice(welt.dinge.indexOf(bremse), 1); } }; welt.dinge.push(bremse);
    hitzeK.aktiv = false; glutBoden.visible = false; wasserK.aktiv = true; wasser.visible = true;
    for (const g of [...welt.gegner]) g.stirb();
    welt.spiel.audio.stoppeMusik(); welt.spiel.audio.sfx('fanfare');
    setTimeout(() => dialog.zeige([
      { name: 'Baron von Trommel', text: 'Hör auf ... bitte. Mein Sieb. Mein schönes Sieb.' },
      { name: 'Ringel', text: 'Wo ist Ringelinde?! Wo sind all die Socken?!' },
      { name: 'Baron von Trommel', text: 'Hinten. In der Ecke. Ich wollte ... ich wollte einen Pullover stricken.' },
      { name: 'Flusi', text: 'Einen PULLOVER? Du bist ein Trockner!' },
      { name: 'Baron von Trommel', text: 'Meine Heizspirale ist seit Jahren kaputt. Mir ist so kalt. Niemand merkt es. Alle nehmen die Wäsche raus und gehen.' },
      { name: 'Baron von Trommel', text: 'Ich habe die Socken nicht aus Bosheit genommen. Ich wollte nur etwas Warmes.' },
      { name: 'Ringel', text: '... Ich kann Spiralen reparieren. Ich bin eine Socke mit Loch, ich kenne mich mit Kaputtem aus.' },
      { name: 'Flusi', text: 'Geh zur Heizspirale hinten und drück E. Und dann holen wir Ringelinde.' },
    ], () => { reparatur.aktiv = () => true; welt.spiel.audio.spieleMusik('ende'); }), 900);
  };
  const reparatur = welt.benutzbarStelle({ x: 0, y: 0, z: -7, radius: 3, text: 'E / Y: Heizspirale reparieren', aktiv: () => false, beiBenutzen: () => {
    reparatur.aktiv = () => false;
    spirale.material = material('#ff8c3a', { vertexColors: false, emissive: 0x662200 });
    b.lampe(0, 4, -7, 0xff8c3a, 2, 16);
    welt.partikel.spawn(new THREE.Vector3(0, 3.5, -8), { anzahl: 30, farbe: [0xff8c3a, 0xffe04a], geschwindigkeit: 5, leben: 1 });
    welt.spiel.audio.sfx('leben'); welt.spiel.renderer.blitz(.5);
    st.daten.bosse.trommel = true; st.speichere();
    b.npc({ art: 'socke', name: 'Ringelinde', x: 3, y: .3, z: -5, ry: -Math.PI / 2, farbe: '#e8474c', streifen: '#fff6e5', breite: 4, naseZu: false, tanzen: true, dialog: ['Ringel!'] });
    welt.spiel.hud.popup('Die Heizspirale glüht wieder!');
    setTimeout(() => dialog.zeige([
      { name: 'Baron von Trommel', text: 'Brrrumm ... warm. Es ist WARM. Danke, kleine Socke.' },
      { name: 'Ringelinde', text: 'Ringel! Du hast ein Loch im Zeh. Und du riechst. Und ich hab dich so vermisst.' },
      { name: 'Ringel', text: 'Es ist ein Fenster zur Welt.' },
      { name: 'Baron von Trommel', text: 'Ich bringe alle Socken zurück in den Keller. Und ich stricke nie wieder. Ehrenwort eines Trockners.' },
      { name: 'Flusi', text: 'Und ich? Ich bleib auf deinem Kopf. Für immer. Das ist keine Drohung. Doch.' },
    ], () => welt.spiel.zeigeEnde()), 800);
  } });

  // Schwachstelle: nur per Stampfattacke
  sieb.userData.kollider.knopf = { braucheStampf: true, gedrueckt: false, beiDruecken: () => {
    sieb.userData.kollider.knopf.gedrueckt = true;
    welt.spiel.audio.sfx('treffer'); welt.spiel.renderer.wackeln = 1.2; welt.spiel.renderer.blitz(.5);
    welt.partikel.spawn(welt.spieler.pos, { anzahl: 24, farbe: [0xe8474c, 0xd8d2e0], geschwindigkeit: 6, leben: .8 });
    if (kampf.phase >= 3) { zeigeBlase(welt, baron, 'NEIN! MEIN SIEB!', 3, 3.5); sieg(); }
    else setTimeout(() => startePhase(kampf.phase + 1), 1200);
  } };

  if (fertig) {
    kampf.omega = 0; sieb.visible = false; sieb.userData.kollider.aktiv = false;
    b.npc({ art: 'socke', name: 'Ringelinde', x: 3, y: .3, z: -5, ry: -Math.PI / 2, farbe: '#e8474c', streifen: '#fff6e5', breite: 4, naseZu: false, tanzen: true,
      dialog: ['Hier war es gar nicht so schlimm. Der Baron hat uns Geschichten erzählt. Lange. Sehr lange.'] });
    welt.benutzbarStelle({ x: 0, y: 0, z: -7, radius: 3, text: 'E / Y: Mit dem Baron reden', beiBenutzen: () => dialog.zeige([
      { name: 'Baron von Trommel', text: 'Brrrumm. Warm. Komm jederzeit vorbei. Ich hab jetzt Wollprogramm.' }]) });
  } else {
    welt.trommelStart = () => {
      dialog.zeige([
        { name: 'Baron von Trommel', text: 'Brrrrrumm. Wer wagt es, in meine Trommel zu steigen?' },
        { name: 'Ringel', text: 'Ich will Ringelinde zurück. Und alle anderen Socken.' },
        { name: 'Baron von Trommel', text: 'Socken sind MEIN. Ich sammle sie. Für ... Gründe.' },
        { name: 'Flusi', text: 'Sein Flusensieb glüht rot. Das ist die Schwachstelle! Nass werden, dann stampfen, wenn es unten vorbeikommt!' },
      ], () => startePhase(1));
    };
  }
}
