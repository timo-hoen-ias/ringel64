import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';
import { Texturen, material, faerbe } from '../engine/texturen.js';
import { PAARE } from './daten.js';
import { Klammer } from '../spiel/sammeln.js';

export const info = {
  name: 'Aquarium-Tiefen', musik: 'aquarium', himmel: '#1a5a8a', tipp: 'Unter Wasser: Springen gedrückt = auftauchen, Strg/B gedrückt = abtauchen. Strömungen schieben dich – manchmal auch dorthin, wo du hinwillst.',
  nebel: { farbe: '#1c6a9a', nah: 10, fern: 48 }, licht: { himmel: 0x8fd8ff, boden: 0x0a3050, intensitaet: .9, sonne: 0xbfe8ff, sonneIntensitaet: 1.1, richtung: [2, 10, 3] },
  todesHoehe: -8, spawn: [0, 1, 14], spawnYaw: Math.PI, kamera: { dist: 9, pitch: .25 },
};

export function baue(welt, b) {
  const paare = PAARE.aquarium;
  const st = welt.spiel.spielstand;
  const glas = { farbe: '#9ad1e8', transparent: true, opacity: .18 };
  // Becken: Kiesboden, Glaswände, Deckel mit Lampe
  b.box({ w: 60, h: 1, d: 36, x: 0, y: -1, z: 0, farbe: '#8a8274', textur: Texturen.kies(), wiederholung: 14 });
  for (const [x, z, w, d] of [[0, -18.5, 62, 1], [0, 18.5, 62, 1], [-30.5, 0, 1, 38], [30.5, 0, 1, 38]]) b.box({ w, h: 28, d, x, y: 0, z, ...glas });
  b.box({ w: 62, h: 1.5, d: 38, x: 0, y: 26, z: 0, farbe: '#2b2b33' });
  b.box({ w: 30, h: .6, d: 4, x: 0, y: 25.4, z: 0, farbe: '#fff6d0', kollision: false, emissive: 0x665522 });
  b.lampe(0, 24, 0, 0xbfe8ff, 2.5, 40);
  b.wasser({ w: 60, h: 24, d: 36, x: 0, y: 0, z: 0, farbe: '#3f9fd8', wellen: .15 });
  // Lichtstrahlen
  for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(2.5, 26, .2), new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: .07, depthWrite: false }));
    s.position.set(-20 + i * 8, 12, -6 + (i % 2) * 8); s.rotation.z = .12; s.rotation.y = .6; s.userData.keinSchatten = true; welt.scene.add(s); }
  // Blasen
  let blubb = 0; welt.dinge.push({ update: dt => { blubb += dt; if (blubb > .12) { blubb = 0; const p = new THREE.Vector3((Math.random() - .5) * 56, Math.random() * 4, (Math.random() - .5) * 32);
    welt.partikel.spawn(p, { anzahl: 1, farbe: 0xdff4ff, geschwindigkeit: .8, gravitation: 3.5, leben: 2.5, groesse: .12, schrumpf: false }); } } });
  b.portal({ x: 7, y: 0, z: 15, ziel: 'hub', name: 'Waschkeller', benoetigt: 0 });
  b.schild({ text: 'Aquarium-\nTiefen', x: -5, y: 0, z: 15, b: 4, h: 1.5 });
  b.schild({ text: 'Springen = hoch\nStrg/B = runter', x: 0, y: 0, z: 10, b: 3.6, h: 1.3 });

  // ---- Seegras ----
  for (let i = 0; i < 14; i++) { const x = -26 + (i * 37) % 52, z = -15 + (i * 23) % 30; const g = b.gruppe(x, 0, z);
    for (let k = 0; k < 3; k++) b.box({ w: .4, h: 4 + (i % 3) * 1.5, d: .15, x: (k - 1) * .5, y: 0, z: 0, farbe: ['#2f9a5a', '#3ab070', '#2a8a4a'][k], kollision: false, eltern: g, ry: k * .7 });
    b.pendel(g, { achse: 'x', amplitude: .25, dauer: 2.5 + (i % 4) * .5, phase: i }); }
  // ---- Versunkene Burg (hohl, Tor vorn) ----
  const burg = '#b8a890';
  b.box({ w: 1.5, h: 9, d: 12, x: -22, y: 0, z: -6, farbe: burg, textur: Texturen.rauschen('#b8a890', .12), wiederholung: 3 });
  b.box({ w: 1.5, h: 9, d: 12, x: -8, y: 0, z: -6, farbe: burg, textur: Texturen.rauschen('#b8a890', .12), wiederholung: 3 });
  b.box({ w: 15, h: 9, d: 1.5, x: -15, y: 0, z: -12, farbe: burg, textur: Texturen.rauschen('#b8a890', .12), wiederholung: 3 });
  b.box({ w: 5, h: 9, d: 1.5, x: -20, y: 0, z: 0, farbe: burg }); b.box({ w: 5, h: 9, d: 1.5, x: -10, y: 0, z: 0, farbe: burg });
  b.box({ w: 5, h: 4, d: 1.5, x: -15, y: 5, z: 0, farbe: burg });
  b.box({ w: 15, h: 1, d: 13, x: -15, y: 9, z: -6, farbe: burg });
  for (const [x, z] of [[-22, -12], [-8, -12], [-22, 0], [-8, 0]]) { b.zylinder({ r: 2, h: 14, x, y: 0, z, farbe: burg, seg: 14 }); b.kegel({ r: 2.4, h: 3, x, y: 14, z, farbe: '#c04040', kollision: false }); }
  for (let i = 0; i < 6; i++) b.box({ w: 1.2, h: 1.2, d: 1.2, x: -21 + i * 2.4, y: 10, z: -12, farbe: burg });
  b.klammer(-15, 1.2, -6, 'Burghof');
  b.socke(-15, 10, -9, { name: paare[0][1], partner: paare[0][0], farbe: paare[0][2] });
  b.fusselKreis(-15, 2, -6, 4, 6);
  b.fusselLinie([-15, 11, -3], [-15, 11, -11], 4);
  b.schild({ text: 'Schloss\nFlossenstein', x: -15, y: 0, z: 2.5, b: 3.6, h: 1.3 });
  b.checkpoint(-15, 0, 4);
  b.gegner('fisch', { x: -15, y: 5, z: -6, punkte: [[-15, 5, -6], [-19, 3, -3], [-11, 7, -9], [-13, 2, -10]], farbe: '#ff8a30' });

  // ---- Filterpumpe mit Strömung, Klammer dahinter ----
  b.box({ w: 4, h: 8, d: 4, x: 26, y: 0, z: 8, farbe: '#2b2b33', textur: Texturen.metall(), wiederholung: 2 });
  b.zylinder({ r: 1.2, h: 2, x: 23.5, y: 3, z: 8, farbe: '#4a4a55', mitte: true }).rotation.z = Math.PI / 2;
  b.wind({ w: 16, h: 6, d: 5, x: 14, y: 1, z: 8, kraft: [-22, 1, 0], sichtbar: true });
  b.schild({ text: 'FILTER\nstarke Strömung', x: 20, y: 0, z: 12, b: 3.6, h: 1.3 });
  b.klammer(26, 0.9, 13.5, 'Hinter dem Filter');
  b.fusselLinie([22, 5, 4], [26, 9, 4], 3);
  // ---- Taucher Theo mit Luftschlauch (Aufwärtsströmung) ----
  b.npc({ art: 'taucher', name: 'Taucher Theo', x: 2, y: 0, z: -2, ry: .4, naseZu: false, kopfHoehe: 2.6, belohnung: 'klammer',
    dialog: ['Blubb. Endlich Gesellschaft. Ich stehe hier seit 2011.', 'Ich bin aus Plastik. Meine Luftblasen kommen aus einem Schlauch. Es ist ... entwürdigend.', 'Der Schlauch bläst nach oben. Stell dich rein, dann fliegst du. Schwimmst. Was auch immer Socken tun.', 'Nimm die Klammer. Sie steckte in meinem Helm. Ich hab sie als Hut getragen.'],
    dialogDanach: ['Falls du einen Fisch siehst: Zacki beißt. Die anderen nur ein bisschen.'] });
  b.wind({ w: 3, h: 20, d: 3, x: 2, y: 3, z: 1, kraft: [0, 16, 0], sichtbar: true });
  // ---- Schiffswrack (hohl) ----
  const wrack = b.gruppe(12, 0, -10); wrack.rotation.z = .18; wrack.rotation.y = -.4;
  b.box({ w: 14, h: .8, d: 7, x: 0, y: 0, z: 0, farbe: '#7a5230', textur: Texturen.holz('#7a5230'), wiederholung: 3, eltern: wrack });
  b.box({ w: 14, h: 4, d: .7, x: 0, y: .8, z: -3.5, farbe: '#8a6240', textur: Texturen.holz('#8a6240'), wiederholung: 3, eltern: wrack });
  b.box({ w: 14, h: 4, d: .7, x: 0, y: .8, z: 3.5, farbe: '#8a6240', textur: Texturen.holz('#8a6240'), wiederholung: 3, eltern: wrack });
  b.box({ w: 14, h: .6, d: 7, x: 0, y: 4.8, z: 0, farbe: '#7a5230', textur: Texturen.holz('#7a5230'), wiederholung: 3, eltern: wrack });
  b.zylinder({ r: .25, h: 9, x: 0, y: 5.4, z: 0, farbe: '#5a3a1a', eltern: wrack, kollision: false });
  b.box({ w: .15, h: 4, d: 5, x: .3, y: 9, z: 0, farbe: '#e8e0c8', eltern: wrack, kollision: false, rz: .1 });
  for (const k of welt.kollider) if (k.obj.parent === wrack) k.aktualisiere();
  b.klammer(12, 2.2, -10, 'Im Wrack');
  b.socke(17, 1.5, -11, { name: paare[1][1], partner: paare[1][0], farbe: paare[1][2] });
  b.fusselLinie([6, 2.5, -10], [18, 2.5, -10], 4);
  b.schild({ text: 'Wrack der\n"Fussel-Perle"', x: 12, y: 0, z: -4, b: 3.6, h: 1.3 });
  b.gegner('fisch', { x: 12, y: 8, z: -8, punkte: [[12, 8, -8], [20, 10, -2], [8, 12, 2], [4, 9, -6]], farbe: '#ffd040', tempo: 3 });
  b.gegner('fisch', { x: -4, y: 14, z: 10, punkte: [[-4, 14, 10], [-20, 16, 12], [-24, 12, 2], [-8, 18, 0]], farbe: '#ff5a5a', tempo: 3.6, reichweite: 9 });

  // ---- Muschel mit Klammer (schnappt zu) ----
  const mx = 22, mz = -14;
  b.zylinder({ r: 2.4, h: .6, x: mx, y: 0, z: mz, farbe: '#f0e0ff', seg: 18 });
  const deckel = b.gruppe(mx, .6, mz - 2.4);
  const oben = b.zylinder({ r: 2.4, h: .5, x: 0, y: 0, z: 2.4, farbe: '#f0e0ff', seg: 18, eltern: deckel, kollision: false });
  void oben;
  const perle = b.kugel({ r: .6, x: mx, y: .6, z: mz, farbe: '#fff8ff', kollision: false, emissive: 0x332233 });
  void perle;
  const zahnZone = b.box({ w: 4.4, h: 2.2, d: 4.4, x: mx, y: .6, z: mz, farbe: '#ff0000', fest: false, trigger: true, schaden: false, transparent: true, opacity: 0 }); zahnZone.visible = false;
  let mt = 0; welt.dinge.push({ update: dt => { mt += dt; const zyklus = mt % 5; const zu = zyklus > 3.4; deckel.rotation.x = zu ? 0 : -1.1 + Math.sin(mt * 2) * .05; zahnZone.userData.kollider.schaden = zu;
    if (zu && zyklus < 3.5) welt.spiel.audio.sfx('schalter'); } });
  b.klammer(mx, 1.6, mz, 'Perlmuschel');
  b.schild({ text: 'Muschel:\nschnappt zu!', x: mx - 4, y: 0, z: mz + 3, b: 3, h: 1.2 });
  b.socke(27, 0, -16, { name: paare[2][1], partner: paare[2][0], farbe: paare[2][2] });
  b.kugel({ r: 2, x: 26, y: -.8, z: -13, farbe: '#6a6a74', mitte: true, textur: Texturen.rauschen('#6a6a74', .15), wiederholung: 3 });

  // ---- Schatztruhe: braucht den Schlüssel ----
  const tx = -2, tz = 14 - 24;
  b.box({ w: 4, h: 2.2, d: 2.6, x: tx, y: 0, z: tz, farbe: '#8a5a2a', textur: Texturen.holz('#8a5a2a'), wiederholung: 2 });
  const deckelT = b.gruppe(tx, 2.2, tz - 1.3);
  b.box({ w: 4.2, h: .8, d: 2.7, x: 0, y: 0, z: 1.3, farbe: '#a06a30', textur: Texturen.holz('#a06a30'), wiederholung: 2, eltern: deckelT, kollision: false });
  b.box({ w: .6, h: .6, d: .3, x: 0, y: .2, z: 2.7, farbe: '#ffd25a', eltern: deckelT, kollision: false });
  const schluesselId = 'aquarium-schluessel';
  const truheOffen = () => st.flag('aquarium-truhe');
  if (!st.flag(schluesselId)) {
    const g = b.gruppe(-26, 0, 12);
    const bart = b.box({ w: .3, h: .9, d: .3, x: 0, y: .3, z: 0, farbe: '#ffd25a', kollision: false, eltern: g, emissive: 0x332200 }); void bart;
    b.box({ w: .9, h: .3, d: .3, x: .3, y: .3, z: 0, farbe: '#ffd25a', kollision: false, eltern: g });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.4, .1, 8, 14), material('#ffd25a', { vertexColors: false, emissive: 0x332200 })); ring.position.y = 1.5; g.add(ring);
    const l = new THREE.PointLight(0xffd25a, 14, 7, 1.5); l.position.y = 1; g.add(l);
    welt.dinge.push({ update: dt => { g.rotation.y += dt; g.position.y = Math.sin(welt.t * 2) * .2; } });
    const stelle = welt.benutzbarStelle({ x: -26, y: 0, z: 12, radius: 2.2, text: 'E / Y: Schlüssel nehmen', aktiv: () => !st.flag(schluesselId), beiBenutzen: () => {
      st.flag(schluesselId, true); welt.scene.remove(g); welt.spiel.audio.sfx('knopf'); welt.spiel.hud.popup('Ein goldener Schlüssel! Wo ist die Truhe?'); stelle.aktiv = () => false; } });
    b.schild({ text: 'Schlüssel', x: -26, y: 0, z: 15, b: 2.6, h: .9 });
  }
  const truhe = welt.benutzbarStelle({ x: tx, y: 0, z: tz + 2, radius: 2.8, text: 'E / Y: Truhe öffnen', aktiv: () => !truheOffen(), beiBenutzen: () => {
    if (!st.flag(schluesselId)) { welt.spiel.hud.popup('Verschlossen. Irgendwo liegt ein Schlüssel.'); welt.spiel.audio.sfx('fehler'); return; }
    st.flag('aquarium-truhe', true); welt.spiel.audio.sfx('fanfare'); truhe.aktiv = () => false;
    welt.partikel.spawn(new THREE.Vector3(tx, 2.5, tz), { anzahl: 20, farbe: [0xffd25a, 0xffffff], geschwindigkeit: 4, leben: 1 });
  } });
  welt.dinge.push({ update: dt => { const ziel = truheOffen() ? -1.4 : 0; deckelT.rotation.x += (ziel - deckelT.rotation.x) * Math.min(1, dt * 3); } });
  const truhenKlammer = { update: () => { if (truheOffen() && !truhenKlammer.erzeugt) { truhenKlammer.erzeugt = true; new Klammer(welt, 'aquarium:truhe', new THREE.Vector3(tx, 2.8, tz), 'Schatztruhe'); } } };
  welt.dinge.push(truhenKlammer); welt.klammerIds.push('aquarium:truhe');
  b.schild({ text: 'Schatztruhe', x: tx + 4, y: 0, z: tz, b: 3, h: 1 });
  b.checkpoint(tx + 4, 0, tz + 3);

  // ---- Heizstab bis über die Oberfläche: Knopf und Klammer im Trockenen ----
  b.zylinder({ r: .8, h: 26.5, x: 24, y: 0, z: -2, farbe: '#d8d8e0', textur: Texturen.metall(), wiederholung: 6 });
  b.box({ w: 4, h: .5, d: 4, x: 24, y: 24.5, z: -2, farbe: '#4a4a55' });
  b.hitze({ w: 5, h: 3, d: 5, x: 24, y: 25, z: -2 });
  b.knopf(24, 25.4, -2, 8);
  b.zylinder({ r: .3, h: 25, x: -24, y: 0, z: -14, farbe: '#ffffff', seg: 8 });
  b.box({ w: 3, h: .4, d: 3, x: -24, y: 24.4, z: -14, farbe: '#e8474c' });
  b.klammer(-24, 25.2, -14, 'Thermometer');
  b.schild({ text: 'Oben: Luft\nund Licht', x: 24, y: 25, z: 1.5, b: 3, h: 1.2, pfosten: false });
  b.fusselBogen([-20, 20, -14], [-24, 24.8, -14], 4, 1);
  // ---- Schnecke ----
  b.npc({ art: 'schnecke', name: 'Schnecke Schnirkel', x: -27, y: 0, z: -4, ry: 1.2, naseZu: false, kopfHoehe: 1.2,
    dialog: ['Laaaangsam. Nicht so hektisch.', 'Ich putze das Glas. Seit ... immer. Es wird nie sauber. Das ist mein Leben.', 'In der Muschel liegt was Glänzendes. Aber sie beißt. Ich hab\'s probiert. Mit meinem Gesicht.'],
    dialogDanach: ['Du bist schon wieder da? Ich bin noch nicht mal umgedreht.'] });
  b.fusselKreis(0, 1, 0, 7, 8);
  b.fusselLinie([-26, 6, 0], [-26, 18, 0], 5);
  b.fusselLinie([20, 12, 14], [-20, 12, 14], 6);
  b.checkpoint(20, 0, 2);
}
