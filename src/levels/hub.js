import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';
import { Texturen, material, faerbe } from '../engine/texturen.js';
import { PAARE, KLAMMERN_NOETIG, LEVELNAMEN, LEVEL_REIHENFOLGE } from './daten.js';

export const info = {
  name: 'Waschkeller', musik: 'hub', himmel: '#2b2238', tipp: 'Jede gerettete Socke zieht ins Sockendorf. Die Körbe führen in die Level.',
  nebel: { farbe: '#2b2238', nah: 30, fern: 90 }, licht: { himmel: 0xe4d8ff, boden: 0x4a3e5a, intensitaet: 1.25, sonne: 0xffe2b8, sonneIntensitaet: 1.2, richtung: [3, 10, 2] },
  todesHoehe: -10, spawn: [0, 0, 28], spawnYaw: Math.PI, kamera: { dist: 8 },
};
const KORB_POS = {};
LEVEL_REIHENFOLGE.forEach((l, i) => { const a = (200 + i * 28) * Math.PI / 180; KORB_POS[l] = [Math.cos(a) * 20, 0, Math.sin(a) * 20 - 2]; });

export function spawnVon(herkunft) {
  if (herkunft === 'trommel') return [24, 0, 16];
  const p = KORB_POS[herkunft]; return p ? [p[0], 0, p[2] + 4.5] : null;
}

const WARTE_SPRUECHE = [
  'Hast du {p} gesehen? Wir waren mal ein Paar. Jetzt bin ich nur noch "die eine Socke".',
  'Ich warte seit siebzehn Wäschen. Siebzehn! Weißt du, wie viele Schleudergänge das sind?',
  'Der Baron hat {p} mitgenommen. Einfach so. Mitten im Trockengang.',
  'Ohne {p} rolle ich mich nachts nicht mal mehr zusammen.',
  'Wenn du {p} findest: Sag nichts von meinem Loch an der Ferse.',
  'Man sagt, im {l} wartet {p}. Aber wer traut sich schon dorthin?',
];
const JUBEL_SPRUECHE = [
  'Wir tanzen bis zur nächsten Wäsche!', 'Zusammengerollt ist das Leben schöner.', 'Nie wieder einzeln in der Schublade!',
  'Mein Partner! Meine zweite Hälfte! Mein ... Geruch!', 'Danke, Ringel. Du riechst nach Heldentum. Und nach Keller.',
];

export function baue(welt, b) {
  const st = welt.spiel.spielstand;
  // Boden, Wände, Decke
  b.box({ w: 84, h: 1, d: 84, x: 0, y: -1, z: 0, farbe: '#8a8a94', textur: Texturen.karo('#8c8c96', '#7a7a84'), wiederholung: 24 });
  for (const [x, z, w, d] of [[0, -42, 84, 1], [0, 42, 84, 1], [-42, 0, 1, 84], [42, 0, 1, 84]])
    b.box({ w, h: 18, d, x, y: 0, z, farbe: '#6d6478', textur: Texturen.rauschen('#6d6478', .08), wiederholung: 10 });
  b.box({ w: 84, h: 1, d: 84, x: 0, y: 18, z: 0, farbe: '#2a2233', kollision: false });
  for (const [x, z] of [[-20, -10], [20, -10], [0, 12], [-20, 25], [20, 25], [30, 10]]) { b.lampe(x, 12, z, 0xffd9a0, 1.4, 30);
    b.zylinder({ r: .08, h: 5, x, y: 13, z, farbe: '#333', kollision: false }); b.kugel({ r: .5, x, y: 12.2, z, farbe: '#fff2c0', kollision: false, emissive: 0x886633 }); }
  b.schild({ text: 'Sockendorf\nWaschkeller', x: 0, y: 0, z: 24, b: 5, h: 1.6 });

  // Körbe in die Level
  for (const l of LEVEL_REIHENFOLGE) {
    const p = KORB_POS[l];
    b.portal({ x: p[0], y: 0, z: p[2], ziel: l, name: LEVELNAMEN[l], benoetigt: KLAMMERN_NOETIG[l], farbe: ['#c89b5a', '#b8d8e8', '#d89a6a', '#d86a6a', '#8a7aa8', '#8ac89a'][LEVEL_REIHENFOLGE.indexOf(l)] });
  }

  // Der Trockner (Baron von Trommel)
  b.box({ w: 10, h: 12, d: 10, x: 36, y: 0, z: 14, farbe: '#e4e4ec', textur: Texturen.metall(), wiederholung: 4 });
  b.box({ w: 10, h: 1.2, d: 1.6, x: 36, y: 12, z: 9.5, farbe: '#d0d0d8', kollision: false });
  const tuer = new THREE.Mesh(faerbe(new THREE.CylinderGeometry(3.2, 3.2, .6, 20), '#1a1420'), material('#1a1420'));
  tuer.rotation.z = Math.PI / 2; tuer.position.set(30.7, 5.5, 14); welt.scene.add(tuer);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.3, .35, 8, 20), material('#b0b0c0', { vertexColors: false }));
  ring.rotation.y = Math.PI / 2; ring.position.set(30.7, 5.5, 14); welt.scene.add(ring);
  for (let i = 0; i < 3; i++) { const k = b.zylinder({ r: .5, h: .3, x: 31.2, y: 10.2, z: 11 + i * 1.5, farbe: ['#e8474c', '#ffd25a', '#5fb7e8'][i], kollision: false }); k.rotation.z = Math.PI / 2; }
  b.box({ w: 5, h: 2.6, d: 6, x: 26.5, y: 0, z: 14, farbe: '#9a8a7a', textur: Texturen.holz('#9a8a7a'), wiederholung: 2 });
  b.schild({ text: `Baron von Trommel\n${KLAMMERN_NOETIG.trommel} Klammern`, x: 26.5, y: 2.6, z: 17.5, b: 5, h: 1.6 });
  welt.portale.push({ pos: new THREE.Vector3(30, 5.0, 14), ziel: 'trommel', name: 'Trommel', benoetigt: KLAMMERN_NOETIG.trommel, innen: tuer });
  if (st.daten.ende) {
    b.npc({ art: 'heizung', name: 'Baron von Trommel', x: 24, y: 0, z: 8, ry: Math.PI / 4, naseZu: false, kopfHoehe: 1.6,
      dialog: ['Brrrumm. Warm. Endlich warm.', 'Ich habe euch allen einen Pullover gestrickt. Er hat 36 Ärmel.', 'Danke, Ringel. Ich hätte einfach fragen sollen.'] });
    b.lampe(24, 2, 8, 0xff8c3a, 1.5, 12);
    b.npc({ art: 'socke', name: 'Ringelinde', x: -3, y: 0, z: 26, ry: Math.PI / 2, farbe: '#e8474c', streifen: '#fff6e5', breite: 4, naseZu: false, tanzen: true,
      dialog: ['Ringel! Du hast mich gefunden!', 'Du riechst furchtbar. Ich hab dich vermisst.', 'Wollen wir ... zusammen in eine Schublade ziehen?'] });
  }

  // Sockendorf: sechs Hütten mit wartenden Socken
  LEVEL_REIHENFOLGE.forEach((l, i) => {
    const a = (i / 6) * Math.PI * 2 + .5; const hx = Math.cos(a) * 11, hz = 8 + Math.sin(a) * 7;
    b.box({ w: 4.5, h: 3, d: 4, x: hx, y: 0, z: hz, farbe: ['#c89b5a', '#b8d8e8', '#d89a6a', '#d86a6a', '#8a7aa8', '#8ac89a'][i], textur: Texturen.holz('#c89b5a'), wiederholung: 2 });
    b.box({ w: 5.2, h: .4, d: 4.8, x: hx, y: 3, z: hz, farbe: '#5a4a6a' });
    b.schild({ text: LEVELNAMEN[l], x: hx, y: 3.4, z: hz, b: 4, h: 1, pfosten: false });
    const richtung = new THREE.Vector3(hx, 0, hz - 8).normalize(); // von der Dorfmitte weg
    PAARE[l].forEach((paar, j) => {
      const [warte, partner, farbe] = paar;
      const seit = new THREE.Vector3(-richtung.z, 0, richtung.x);
      const px = hx - richtung.x * 3.2 + seit.x * (j - 1) * 1.6, pz = hz - richtung.z * 3.2 + seit.z * (j - 1) * 1.6;
      const id = `${l}:s${j}`;
      const gerettet = () => Object.values(st.daten.gerettet).some(g => g.name === partner);
      b.npc({ art: 'socke', name: warte, x: px, y: 0, z: pz, ry: Math.atan2(-richtung.x, -richtung.z), farbe, naseZu: true, tanzen: gerettet(),
        dialog: () => gerettet() ? [JUBEL_SPRUECHE[(i * 3 + j) % JUBEL_SPRUECHE.length]]
          : [WARTE_SPRUECHE[(i * 3 + j) % WARTE_SPRUECHE.length].replace('{p}', partner).replace('{l}', LEVELNAMEN[l])] });
      if (gerettet()) b.npc({ art: 'socke', name: partner, x: px - richtung.x * 1.3, y: 0, z: pz - richtung.z * 1.3, ry: Math.atan2(richtung.x, richtung.z), farbe, naseZu: false, tanzen: true,
        dialog: [`${warte} und ich sind wieder ein Paar. Danke, Ringel!`] });
      void id;
    });
  });

  // Zehensocken-Hipster
  b.npc({ art: 'socke', name: 'Zeh', x: 6, y: 0, z: 26, ry: -Math.PI / 2, farbe: '#f5d44a', streifen: '#f5d44a', naseZu: true,
    dialog: ['Partner? Brauch ich nicht. Ich bin eine Zehensocke. Jeder Zeh ist für sich allein.', 'Die anderen nennen das "einsam". Ich nenne es "Individualität".', 'Übrigens: Du riechst wie ein Konzept.'],
    dialogDanach: ['Ich trug Socken, bevor es cool war. Ich bin eine Socke.'] });

  // Bügelbrett-Rampe zur Waschmittelflasche
  b.box({ w: 9, h: .4, d: 2.4, x: -27, y: 2.3, z: 22, rz: .6, farbe: '#5fb7e8', textur: Texturen.karo('#5fb7e8', '#4aa0d0'), wiederholung: 4, mitte: true });
  b.box({ w: .3, h: 3, d: 2, x: -25, y: 0, z: 22, farbe: '#aaa', kollision: false, rz: .3 }); b.box({ w: .3, h: 3, d: 2, x: -28, y: 0, z: 22, farbe: '#aaa', kollision: false, rz: -.3 });
  b.zylinder({ r: 2, h: 8, x: -20, y: 0, z: 22, farbe: '#4fa8e8', seg: 14 });
  b.zylinder({ r: 1, h: 1.2, x: -20, y: 8, z: 22, farbe: '#e8474c', seg: 10 });
  b.schild({ text: 'ULTRA\nWEISS', x: -22.05, y: 2.5, z: 22, ry: -Math.PI / 2, b: 2.4, h: 1.6, pfosten: false });
  b.fusselBogen([-30, 1, 22], [-23.5, 5.6, 22], 5, .6);
  b.klammer(-20, 9.6, 22, 'Flasche');

  // Rohr an der Südwand mit Klammer am Ende
  const rohr = b.zylinder({ r: .6, h: 62, x: 0, y: 7, z: 39, farbe: '#9a9aa8', textur: Texturen.metall(), wiederholung: 8, mitte: true, seg: 10 }); rohr.rotation.z = Math.PI / 2; rohr.userData.kollider.aktualisiere();
  for (const x of [-30, -15, 0, 15, 30]) b.box({ w: .8, h: .8, d: 2.5, x, y: 6.6, z: 40, farbe: '#777', kollision: false, mitte: true });
  b.box({ w: 3, h: 2, d: 3, x: 31, y: 0, z: 35, farbe: '#b08a5a', textur: Texturen.holz('#b08a5a'), wiederholung: 2 });
  b.box({ w: 3, h: 4.6, d: 3, x: 35, y: 0, z: 37.5, farbe: '#b08a5a', textur: Texturen.holz('#b08a5a'), wiederholung: 2 });
  b.fusselLinie([25, 8.3, 39], [-20, 8.3, 39], 8);
  b.klammer(-29, 8.6, 39, 'Rohr');

  // Regal mit Kniestrumpf und Knopf (Westwand)
  b.box({ w: 3, h: 2, d: 3, x: -33, y: 0, z: -14, farbe: '#b08a5a', textur: Texturen.holz('#b08a5a'), wiederholung: 2 });
  b.box({ w: 3, h: 4.3, d: 3, x: -36.5, y: 0, z: -17.5, farbe: '#b08a5a', textur: Texturen.holz('#b08a5a'), wiederholung: 2 });
  b.box({ w: 6, h: .5, d: 8, x: -38.5, y: 6.3, z: -24, farbe: '#7a5230', textur: Texturen.holz('#7a5230'), wiederholung: 3 });
  b.box({ w: .4, h: 6.3, d: .4, x: -36, y: 0, z: -27.5, farbe: '#5a3a1a', kollision: false });
  b.npc({ art: 'socke', name: 'Kniestrumpf', x: -38, y: 6.8, z: -22, ry: Math.PI / 2, farbe: '#3a3a4a', streifen: '#8a8a9a', breite: 2, groesse: 1.7, naseZu: true,
    dialog: ['Ah. Eine Kurze. Von hier oben seht ihr alle gleich aus.', 'Ich reiche bis zum Knie. Ich habe das Knie GESEHEN.', 'Was? Nein, ich hab keine Höhenangst. Ich wohne hier nur, weil ... der Ausblick.'],
    dialogDanach: ['Geh runter. Du machst mich nervös. Ich meine: Ich bin nicht nervös.'] });
  b.knopf(-39, 6.8, -27, 7);
  b.fusselKreis(-34.5, 7, -24, 1.4, 4);

  // Flusen im Dorf
  b.fusselKreis(0, .4, 8, 5, 8);
  b.fusselLinie([-10, .4, 30], [10, .4, 30], 5);
  for (const l of LEVEL_REIHENFOLGE) { const p = KORB_POS[l]; b.fussel(p[0], 2.6, p[2]); }

  // Wäschekörbe als Deko / Trittstufen
  b.zylinder({ r: 1.5, h: 1.6, x: -8, y: 0, z: 32, farbe: '#c89b5a', textur: Texturen.holz('#c89b5a'), wiederholung: 3, seg: 10 });
  b.zylinder({ r: 1.5, h: 1.6, x: 12, y: 0, z: 34, farbe: '#b8d8e8', textur: Texturen.holz('#b8d8e8'), wiederholung: 3, seg: 10 });
  b.box({ w: 2, h: 1.2, d: 1.6, x: 16, y: 0, z: 28, farbe: '#e8474c', textur: Texturen.karo('#e8474c', '#d03a40'), wiederholung: 2 });
  b.schild({ text: 'WASCHPULVER', x: 16, y: 1.2, z: 28, b: 2, h: .7, pfosten: false });
  b.checkpoint(0, 0, 20);
}
