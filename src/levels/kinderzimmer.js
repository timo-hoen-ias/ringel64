import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';
import { Texturen, material, faerbe } from '../engine/texturen.js';
import { Klammer } from '../spiel/sammeln.js';
import { PAARE } from './daten.js';

export const info = {
  name: 'Klötzchen-Chaos', musik: 'kinderzimmer', himmel: '#ffe6c8', tipp: 'Alle haben Angst vor Lego-Steinen. Du nicht – du hast keine Füße. Der Teddy will nur kuscheln. Ziel auf seine Knöpfe.',
  nebel: { farbe: '#ffe6c8', nah: 40, fern: 110 }, licht: { himmel: 0xfff4e0, boden: 0xa08070, intensitaet: 1.0, sonne: 0xfff0d0, sonneIntensitaet: 1.3, richtung: [4, 10, 6] },
  todesHoehe: -8, spawn: [-6, 0, 33], spawnYaw: Math.PI,
};

export function baue(welt, b) {
  const paare = PAARE.kinderzimmer;
  const st = welt.spiel.spielstand;
  // Teppich, Wände
  b.box({ w: 80, h: 1, d: 80, x: 0, y: -1, z: 0, farbe: '#6b4a7a', textur: Texturen.teppich('#6b4a7a'), wiederholung: 20 });
  for (const [x, z, w, d] of [[0, -40, 80, 1], [0, 40, 80, 1], [-40, 0, 1, 80], [40, 0, 1, 80]])
    b.box({ w, h: 30, d, x, y: 0, z, farbe: '#bfe3f5', textur: Texturen.karo('#bfe3f5', '#a8d8f0'), wiederholung: 10 });
  b.portal({ x: 7, y: 0, z: 32, ziel: 'hub', name: 'Waschkeller', benoetigt: 0 });
  b.schild({ text: 'Klötzchen-\nChaos', x: -5, y: 0, z: 31, b: 4, h: 1.5 });

  // ---- Lego-Feld: nur Ringel traut sich drüber ----
  const legoFarben = ['#e8474c', '#3b6fd8', '#ffd25a', '#3aa84a'];
  for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) {
    const f = legoFarben[(i + j) % 4]; const x = -7.5 + i * 3, z = -2 + j * 3;
    b.box({ w: 3, h: 1.2, d: 3, x, y: 0, z, farbe: f });
    for (const [dx, dz] of [[-.75, -.75], [.75, -.75], [-.75, .75], [.75, .75]]) b.zylinder({ r: .45, h: .3, x: x + dx, y: 1.2, z: z + dz, farbe: f, seg: 8, kollision: false });
  }
  b.klammer(0, 1.8, 4, 'Lego-Feld');
  b.fusselKreis(0, 1.8, 4, 3.5, 6);
  b.schild({ text: 'VORSICHT\nLEGO', x: -11, y: 0, z: 10, b: 3.2, h: 1.2 });
  b.npc({ art: 'roboter', name: 'Rob-1', x: -12, y: 0, z: 4, ry: Math.PI / 2, handFarbe: '#8fa3b8', kopfHoehe: 2.4,
    dialog: ['ACHTUNG. LEGO ERKANNT. ICH GEHE DA NICHT DRÜBER.', 'Ich bin aus Blech. Ich bin einmal auf einen Stein getreten. Ich habe geweint. Blech weint nicht. Ich schon.', 'Du hast keine Füße. Das ist ... logisch unfair. Hol du die Klammer.'],
    dialogDanach: ['BITTE KEINE STEINE WERFEN. DANKE.'] });
  b.npc({ art: 'gummiente', name: 'Quietschi', x: 13, y: 0, z: 4, ry: -Math.PI / 2, handFarbe: '#ffd400', kopfHoehe: 1.2,
    dialog: ['Quietsch. Ich bin eine Ente auf Rädern. Räder und Lego: schlechte Kombi.', 'Der Teddy da hinten ist nicht böse. Er ist nur SEHR anhänglich.', 'Seine Knöpfe sind die Schwachstelle. Nicht weitersagen. Quietsch.'] });

  // ---- Spielzeugeisenbahn im Kreis ----
  const pivot = b.gruppe(0, 0, 12);
  const schiene = new THREE.Mesh(new THREE.TorusGeometry(13, .35, 6, 40), material('#7a7a88', { vertexColors: false }));
  schiene.rotation.x = Math.PI / 2; schiene.position.y = .3; pivot.add(schiene);
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; const s = new THREE.Mesh(faerbe(new THREE.BoxGeometry(.5, .2, 2.4), '#8a5a3a'), material('#8a5a3a'));
    s.position.set(Math.cos(a) * 13, .1, Math.sin(a) * 13); s.rotation.y = -a; pivot.add(s); }
  const lok = b.box({ w: 4, h: 1.6, d: 2.4, x: 13, y: .5, z: 0, farbe: '#e8474c', eltern: pivot });
  b.box({ w: 1.6, h: 1.2, d: 1.6, x: 14.2, y: 2.1, z: 0, farbe: '#3b6fd8', eltern: pivot });
  b.zylinder({ r: .5, h: 1.6, x: 11.8, y: 2.1, z: 0, farbe: '#2b2b33', eltern: pivot, kollision: false });
  const wagen = b.box({ w: 3.4, h: 1.4, d: 2.2, x: 13, y: .5, z: -5, farbe: '#3aa84a', eltern: pivot }); wagen.rotation.y = -.4; wagen.userData.kollider.aktualisiere();
  b.drehe(pivot, { achse: 'y', geschwindigkeit: .33 });
  void lok;
  let qualm = 0; welt.dinge.push({ update: dt => { qualm += dt; if (qualm > .25) { qualm = 0; const p = new THREE.Vector3(11.8, 3.2, 0).applyMatrix4(pivot.matrixWorld); welt.partikel.spawn(p, { anzahl: 1, farbe: 0xdddddd, geschwindigkeit: .6, leben: 1.2, gravitation: 1.5, groesse: .25 }); } } });
  // Bahnhof mit Knopf auf dem Dach
  b.box({ w: 5, h: 3, d: 3, x: 0, y: 0, z: 28.5 - 2, farbe: '#ffd25a', textur: Texturen.holz('#ffd25a'), wiederholung: 2 });
  b.box({ w: 6, h: .5, d: 4, x: 0, y: 3, z: 26.5, farbe: '#e8474c' });
  b.schild({ text: 'BAHNHOF', x: 0, y: 3.5, z: 26.5, b: 3.4, h: 1, pfosten: false });
  b.knopf(0, 4, 26.5, 4);

  // ---- Bücherregal (über die Bahn erreichbar) ----
  b.box({ w: 6, h: 9, d: 10, x: 19, y: 0, z: 12, farbe: '#7a5230', textur: Texturen.holz('#7a5230'), wiederholung: 3 });
  b.treppe({ x: 15, y: 0, z: 8, stufen: 4, breite: 3, tiefe: 1.3, hoehe: 1.5, richtung: 'x', farbe: '#9a3a3a', textur: Texturen.holz('#9a3a3a') });
  ['#e8474c', '#3b6fd8', '#3aa84a', '#ffd25a'].forEach((f, i) => b.box({ w: 1.2, h: 3, d: 5, x: 17 + i * 1.3, y: 9, z: 8, farbe: f }));
  b.klammer(20, 12.6, 8, 'Bücherregal');
  b.socke(20, 9, 15, { name: paare[0][1], partner: paare[0][0], farbe: paare[0][2] });
  b.fusselLinie([16, 9.5, 12], [21, 9.5, 12], 3);
  b.checkpoint(19, 9, 16);
  b.gegner('ente', { x: 10, y: 0, z: 20, punkte: [[10, 0, 20], [-10, 0, 20], [-10, 0, 24], [10, 0, 24]], tempo: 2.4 });

  // ---- ABC-Klötzchen-Turm ----
  [[12, 0, -8, '#e8474c'], [14.5, 3, -11, '#3b6fd8'], [12, 6, -14, '#ffd25a']].forEach(([x, y, z, f], i) => {
    b.box({ w: 3, h: 3, d: 3, x, y, z, farbe: f });
    b.schild({ text: 'ABC'[i], x, y: y + .6, z: z + 1.55, b: 1.6, h: 1.6, pfosten: false, hintergrund: f, farbe: '#fff6e5' });
  });
  b.klammer(12, 9.8, -14, 'Klötzchenturm');
  b.fussel(12, 3.6, -8); b.fussel(14.5, 6.6, -11);

  // ---- Spielzeugkiste mit Stuhl davor ----
  b.box({ w: 4, h: 3, d: 4, x: 18, y: 0, z: -14, farbe: '#c8a060', textur: Texturen.holz('#c8a060'), wiederholung: 2 });
  b.box({ w: 4, h: 4, d: .5, x: 18, y: 3, z: -16, farbe: '#c8a060', kollision: false });
  for (const [x, z, w, d] of [[18, -24, 8, 1], [18, -16.5, 8, 1], [14.5, -20.25, 1, 6.5], [21.5, -20.25, 1, 6.5]]) b.box({ w, h: 6, d, x, y: 0, z, farbe: '#5fb7e8', textur: Texturen.karo('#5fb7e8', '#4aa0d0'), wiederholung: 3 });
  b.schild({ text: 'SPIELZEUG', x: 18, y: 6, z: -16.5, b: 3.6, h: 1, pfosten: false });
  b.kugel({ r: 1.5, x: 18, y: 0, z: -22, farbe: '#e8474c', seg: 10 });
  b.klammer(16.5, .8, -19, 'Spielzeugkiste');
  b.socke(19.8, 0, -18.5, { name: paare[1][1], partner: paare[1][0], farbe: paare[1][2] });
  b.fussel(18, 3.5, -14); b.fussel(18, 6.5, -16.5);
  b.checkpoint(18, 3, -14);

  // ---- Bett mit Nachttisch und Lampe ----
  b.box({ w: 16, h: 3, d: 24, x: -24, y: 2, z: -2, farbe: '#ffffff', textur: Texturen.karo('#ffffff', '#ffd0e0'), wiederholung: 6 });
  for (const [x, z] of [[-31, -13], [-17, -13], [-31, 9], [-17, 9]]) b.zylinder({ r: .5, h: 2, x, y: 0, z, farbe: '#7a5230', seg: 8 });
  b.box({ w: 14, h: 2, d: 14, x: -24, y: 5, z: 2, farbe: '#e8474c', textur: Texturen.karo('#e8474c', '#d03a40'), wiederholung: 4 });
  b.box({ w: 8, h: 1.5, d: 5, x: -24, y: 5, z: -11, farbe: '#ffffff' });
  b.box({ w: 16, h: 8, d: 1, x: -24, y: 0, z: -14.5, farbe: '#7a5230', textur: Texturen.holz('#7a5230'), wiederholung: 3 });
  b.socke(-24, 0, -2, { name: paare[2][1], partner: paare[2][0], farbe: paare[2][2] });
  b.gegner('staubmaus', { x: -26, y: 0, z: 2, gebiet: [-31, -13, -17, 9] });
  b.gegner('staubmaus', { x: -20, y: 0, z: -8, gebiet: [-31, -13, -17, 9] });
  b.fusselLinie([-30, .5, -10], [-18, .5, 6], 5);
  b.box({ w: 5, h: 4, d: 5, x: -24, y: 0, z: 14, farbe: '#7a5230', textur: Texturen.holz('#7a5230'), wiederholung: 2 });
  b.zylinder({ r: .5, h: 4, x: -24, y: 4, z: 14, farbe: '#c0c8d0', seg: 8 });
  b.zylinder({ r: 2.2, rOben: 1.4, h: 2, x: -24, y: 7.6, z: 14, farbe: '#ffd25a', seg: 12, emissive: 0x443300 });
  b.lampe(-24, 8, 14, 0xffe0a0, 1.5, 14);
  b.klammer(-24, 10.2, 14, 'Nachttischlampe');
  b.fusselBogen([-24, 7.5, -5], [-24, 5.5, 10], 4, 1.5);
  b.checkpoint(-24, 5, 6);
  b.schild({ text: 'Unters Bett\npasst nur eine\nSocke', x: -14, y: 0, z: 4, b: 3.4, h: 1.5 });

  // ---- Drachen an der Wand (Haken) ----
  b.haken(27, 8, 4); b.haken(30, 13, 8); b.haken(33, 18.3, 12);
  b.box({ w: 6, h: 5, d: .5, x: 33, y: 14.5, z: 12, farbe: '#e8474c', mitte: true });
  b.box({ w: 6.2, h: .4, d: .6, x: 33, y: 14.5, z: 12, farbe: '#ffd25a', kollision: false, mitte: true });
  b.box({ w: .3, h: .3, d: 6, x: 33, y: 10, z: 12, farbe: '#ffffff', kollision: false });
  b.klammer(33, 17.6, 12, 'Drachen');
  b.fussel(27, 9, 4); b.fussel(30, 14, 8);

  // ---- Teddy-Arena auf grüner Grundplatte ----
  b.box({ w: 24, h: 1.2, d: 24, x: 0, y: 0, z: -24, farbe: '#3aa84a', textur: Texturen.lego('#3aa84a'), wiederholung: 8 });
  for (let i = 0; i < 8; i++) for (const s of [-1, 1]) b.box({ w: 2.4, h: 2.4, d: 2.4, x: -8.4 + i * 2.4, y: 1.2, z: -24 + s * 12, farbe: legoFarben[i % 4] });
  b.schild({ text: 'KUSCHEL-ARENA', x: 0, y: 1.2, z: -11, b: 4.5, h: 1.2 });
  b.checkpoint(0, 1.2, -13.5);
  const teddyId = 'kinderzimmer:teddy';
  const besiegt = st.daten.bosse.kinderzimmer;
  welt.klammerIds.push(teddyId);
  if (!besiegt) {
    b.gegner('teddy', { x: 0, y: 1.2, z: -26, beiTod: (t) => {
      st.daten.bosse.kinderzimmer = true; st.speichere();
      new Klammer(welt, teddyId, new THREE.Vector3(t.gruppe.position.x, 5.5, t.gruppe.position.z), 'Teddy');
      welt.spiel.dialog.zeige([{ name: 'Teddy', text: 'Okay. Du willst nicht kuscheln. Ich respektiere das. Hier, ich hab eine Klammer im Bauch gefunden.' },
        { name: 'Flusi', text: 'Er hatte sie IM BAUCH. Ich frage nicht weiter.' }]);
    } });
  } else {
    new Klammer(welt, teddyId, new THREE.Vector3(0, 5.5, -26), 'Teddy');
    b.npc({ art: 'teddy', name: 'Teddy', x: 0, y: 1.2, z: -30, ry: 0, naseZu: false, kopfHoehe: 4, wippen: false,
      dialog: ['Kuscheln? Nein? Okay. Ich frage morgen nochmal.', 'Mein Knopf ist ab. Jetzt bin ich ein Teddy mit Charakter.'] });
  }
  b.fusselKreis(0, 1.8, -24, 8, 8);
}
