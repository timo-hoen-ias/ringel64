import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';
import { Texturen, material, faerbe } from '../engine/texturen.js';
import { PAARE } from './daten.js';

export const info = {
  name: 'Winter-Terrasse', musik: 'winter', himmel: '#a8bcd8', tipp: 'Schnee macht nicht nass, Matsch schon. Auf dem zugefrorenen Teich rutschen trockene Socken. Schneebälle wachsen, wenn sie rollen.',
  nebel: { farbe: '#dce6f2', nah: 45, fern: 130 }, licht: { himmel: 0xeaf2ff, boden: 0x8a9ab0, intensitaet: 1.0, sonne: 0xfff4e0, sonneIntensitaet: 1.1, richtung: [-5, 9, 4] },
  todesHoehe: -8, spawn: [0, 0, 34], spawnYaw: Math.PI, kamera: { dist: 8.5 },
  aussen: { himmel: { oben: '#6f8fb8', horizont: '#eef3fa', unten: '#dfe6ee' }, wolken: { anzahl: 16, hoehe: 40, farbe: '#f4f7fb' }, sonnenFarbe: '#fff8e8' },
};

export function baue(welt, b) {
  const paare = PAARE.winter;
  const schnee = Texturen.schnee();
  // Schneeboden, Terrasse, Zaun mit Lichterkette
  b.box({ w: 100, h: 1, d: 100, x: 0, y: -1, z: 0, farbe: '#f0f5ff', textur: schnee, wiederholung: 24 });
  b.box({ w: 30, h: .4, d: 14, x: 0, y: 0, z: 37, farbe: '#9a9ca8', textur: Texturen.karo('#a0a2ae', '#8e909c'), wiederholung: 8 });
  for (const [x, z, w, d] of [[0, -46, 94, .6], [0, 46, 94, .6], [-46, 0, .6, 94], [46, 0, .6, 94]]) b.box({ w, h: 2.6, d, x, y: 0, z, farbe: '#8a6a4a', textur: Texturen.holz('#8a6a4a'), wiederholung: 20 });
  for (let i = -44; i <= 44; i += 4) for (const [x, z] of [[i, -46], [i, 46], [-46, i], [46, i]]) { b.box({ w: .7, h: 3.2, d: .7, x, y: 0, z, farbe: '#7a5a3a', kollision: false });
    b.kugel({ r: .55, x, y: 3.2, z, farbe: '#ffffff', kollision: false, seg: 8 }); }
  const lichter = [];
  for (let i = -44; i <= 44; i += 2) for (const [x, z] of [[i, -45.4], [i, 45.4], [-45.4, i], [45.4, i]]) {
    const f = ['#ff4040', '#40d040', '#4080ff', '#ffd040'][((i + 44) / 2) % 4];
    const l = new THREE.Mesh(new THREE.SphereGeometry(.18, 8, 6), new THREE.MeshBasicMaterial({ color: f })); l.position.set(x, 2.9 + Math.sin(i) * .15, z); l.userData.keinSchatten = true; welt.scene.add(l); lichter.push(l); }
  welt.dinge.push({ update: () => { const an = Math.floor(welt.t * 2) % 2; lichter.forEach((l, i) => { l.visible = (i % 2 === an) || Math.sin(welt.t) > .7; }); } });
  // Schneefall
  welt.dinge.push({ update: dt => { for (let i = 0; i < 3; i++) { const p = welt.spieler.pos.clone().add(new THREE.Vector3((Math.random() - .5) * 50, 14 + Math.random() * 6, (Math.random() - .5) * 50));
    welt.partikel.spawn(p, { anzahl: 1, farbe: 0xffffff, geschwindigkeit: .4, leben: 7, gravitation: -.45, groesse: .13, schrumpf: false }); } } });
  b.portal({ x: 7, y: .4, z: 40, ziel: 'hub', name: 'Waschkeller', benoetigt: 0 });
  b.schild({ text: 'Winter-\nTerrasse', x: -5, y: .4, z: 40, b: 4, h: 1.5 });

  // ---- Schneemann Siggi ----
  b.npc({ art: 'schneemann', name: 'Schneemann Siggi', x: -8, y: 0, z: 26, ry: .3, naseZu: false, kopfHoehe: 4, handFarbe: '#f4f8ff', belohnung: 'klammer',
    dialog: ['Brrr. Ah, keine Sorge, mir ist nie kalt. Mir ist immer kalt. Das ist mein Normalzustand.', 'Ich hab Augen aus Kohle und eine Nase aus Möhre. Du hast Augen aus Knöpfen. Wir sind praktisch Brüder.', 'Der Teich ist zugefroren. Trockene Socken rutschen wie Pucks. Nasse kleben. Such dir aus, was lustiger ist.', 'Nimm die Klammer. Sie war mein zweiter Knopf. Ich brauch keine Knöpfe. Ich bin Schnee.'],
    dialogDanach: ['Wenn der Frühling kommt, bin ich eine Pfütze. Erzähl den anderen nichts davon.'] });
  // ---- Zugefrorener Teich mit Klammer, Schneematsch und Glühwein ----
  b.zylinder({ r: 11, h: .4, x: -16, y: 0, z: -4, farbe: '#c8e6ff', textur: Texturen.rauschen('#cfe9ff', .08, 12), wiederholung: 4, eis: true, transparent: true, opacity: .9, seg: 28 });
  b.schild({ text: 'Zugefroren:\ntrocken = rutschig', x: -4, y: 0, z: 6, b: 3.6, h: 1.3 });
  b.klammer(-16, .9, -4, 'Teichmitte');
  b.fusselKreis(-16, .9, -4, 6, 8);
  b.wasser({ w: 5, h: .4, d: 4, x: -2, y: 0, z: 0, farbe: '#8a9aa8', wellen: .02 });
  b.schild({ text: 'Matsch: nass', x: -2, y: 0, z: 3.5, b: 2.6, h: .9 });
  b.zylinder({ r: 1, h: 1.6, x: 4, y: 0, z: -4, farbe: '#a8304a', seg: 12 });
  b.zylinder({ r: .8, h: .2, x: 4, y: 1.6, z: -4, farbe: '#8a2030', seg: 12, kollision: false });
  b.hitze({ w: 3, h: 3, d: 3, x: 4, y: 0, z: -4, sichtbar: true, farbe: '#ff8c3a' });
  b.schild({ text: 'Glühwein:\ntrocknet', x: 4, y: 0, z: -1, b: 2.6, h: 1 });
  b.gegner('schneeball', { x: -24, y: 0, z: 12, reichweite: 16 });
  b.gegner('schneeball', { x: 10, y: 0, z: -14, reichweite: 14 });

  // ---- Tannenbaum mit Stern, Vogelhaus ----
  const tx = 24, tz = -14;
  b.zylinder({ r: 1.2, h: 18, x: tx, y: 0, z: tz, farbe: '#6a4a2a', textur: Texturen.holz('#6a4a2a'), wiederholung: 4 });
  [[3, 6], [6.5, 5], [10, 4], [13.5, 3]].forEach(([y, r]) => { b.zylinder({ r, rOben: r * .55, h: 3, x: tx, y, z: tz, farbe: '#2f7a3a', seg: 16 });
    b.zylinder({ r: r * .6, rOben: r * .5, h: .4, x: tx, y: y + 3, z: tz, farbe: '#f4f8ff', seg: 16, kollision: false }); });
  for (let i = 0; i < 12; i++) { const a = i * 2.1; const y = 4 + i; const r = 6.2 - i * .3;
    const k = new THREE.Mesh(new THREE.SphereGeometry(.4, 10, 8), new THREE.MeshBasicMaterial({ color: ['#ff4040', '#ffd040', '#4080ff'][i % 3] })); k.position.set(tx + Math.cos(a) * r * .9, y, tz + Math.sin(a) * r * .9); k.userData.keinSchatten = true; welt.scene.add(k); }
  const stern = new THREE.Mesh(faerbe(new THREE.OctahedronGeometry(1, 0), '#ffd25a'), material('#ffd25a', { emissive: 0x554400 })); stern.position.set(tx, 18.5, tz); welt.scene.add(stern);
  welt.dinge.push({ update: dt => { stern.rotation.y += dt; } });
  b.klammer(tx, 17.2, tz, 'Baumspitze');
  b.socke(tx + 2.2, 10.4, tz, { name: paare[0][1], partner: paare[0][0], farbe: paare[0][2] });
  b.fussel(tx, 6.4, tz + 2); b.fussel(tx + 2, 9.9, tz); b.fussel(tx, 13.4, tz - 1.5);
  b.checkpoint(tx + 7, 0, tz + 4);
  b.schild({ text: 'Tannenbaum:\nStufe für Stufe', x: tx + 7, y: 0, z: tz + 7, b: 3.4, h: 1.3 });
  b.zylinder({ r: .2, h: 6, x: 34, y: 0, z: -4, farbe: '#7a5a3a', seg: 6 });
  b.box({ w: 3, h: 2, d: 3, x: 34, y: 6, z: -4, farbe: '#a07040', textur: Texturen.holz('#a07040'), wiederholung: 2 });
  b.box({ w: 3.6, h: .4, d: 3.6, x: 34, y: 8, z: -4, farbe: '#f4f8ff' });
  b.klammer(34, 9, -4, 'Vogelhaus');

  // ---- Tisch mit Rodelbahn (Tablett), Stühle, Knopf unten ----
  b.box({ w: 10, h: .8, d: 6, x: 20, y: 7.2, z: 22, farbe: '#8a6a4a', textur: Texturen.holz('#8a6a4a'), wiederholung: 3 });
  for (const [x, z] of [[16, 20], [24, 20], [16, 24], [24, 24]]) b.box({ w: .6, h: 7.2, d: .6, x, y: 0, z, farbe: '#6a4a2a' });
  b.kugel({ r: 3, x: 20, y: 7, z: 22, farbe: '#f4f8ff', mitte: true, kollision: false, seg: 12 }).scale.y = .35;
  b.socke(20, 0, 22, { name: paare[1][1], partner: paare[1][0], farbe: paare[1][2] });
  b.zylinder({ r: 1.5, h: 2, x: 10, y: 0, z: 26, farbe: '#b05a3a', seg: 14 });
  b.box({ w: 3.5, h: 4.6, d: 3.5, x: 13, y: 0, z: 27, farbe: '#8a6a4a', textur: Texturen.holz('#8a6a4a'), wiederholung: 2 });
  b.box({ w: 3.5, h: 3, d: .4, x: 13, y: 4.6, z: 28.6, farbe: '#8a6a4a', kollision: false });
  b.klammer(20, 8.6, 22, 'Tischplatte');
  b.box({ w: 3.4, h: .3, d: 22, x: 20, y: 4.5, z: 8, rx: -.36, farbe: '#cfe9ff', textur: Texturen.rauschen('#cfe9ff', .08, 12), wiederholung: 3, eis: true, mitte: true });
  b.schild({ text: 'Tablett =\nRodelbahn', x: 23.5, y: 8, z: 18, b: 3, h: 1.2, pfosten: false });
  b.fusselLinie([20, 7.3, 15], [20, 1.4, 0], 6);
  b.knopf(20, .5, -3, 9);
  b.checkpoint(14, 0, 23);
  b.gegner('schneeball', { x: 20, y: 0, z: -8, reichweite: 12 });

  // ---- Iglu mit Klammer und Socke ----
  const ix = -30, iz = 22;
  for (let i = 0; i < 12; i++) { if (i === 3 || i === 4) continue; const a = i / 12 * Math.PI * 2;
    b.box({ w: 2.4, h: 2.6, d: .9, x: ix + Math.cos(a) * 4.2, y: 0, z: iz + Math.sin(a) * 4.2, ry: -a - Math.PI / 2, farbe: '#eef4ff', textur: schnee, wiederholung: 2 }); }
  const kuppel = b.kugel({ r: 4.6, x: ix, y: 1.2, z: iz, farbe: '#eef4ff', mitte: true, kollision: false, textur: schnee, wiederholung: 4, seg: 18 }); kuppel.scale.y = .8;
  b.klammer(ix, .8, iz, 'Iglu');
  b.socke(ix - 1.8, 0, iz - 1.5, { name: paare[2][1], partner: paare[2][0], farbe: paare[2][2] });
  b.lampe(ix, 2, iz, 0xffd9a0, .8, 8);
  b.schild({ text: 'Iglu', x: ix + 5, y: 0, z: iz + 5, b: 2, h: .9 });
  b.fusselKreis(ix, .5, iz, 7, 6);

  // ---- Grill mit Restwärme, Gartenzwerg ----
  b.box({ w: 4, h: 3, d: 4, x: 32, y: 0, z: 30, farbe: '#2b2b33', textur: Texturen.metall(), wiederholung: 2 });
  b.kugel({ r: 2.4, x: 32, y: 3, z: 30, farbe: '#f4f8ff', mitte: true, kollision: false, seg: 12 }).scale.y = .4;
  b.hitze({ w: 6, h: 3, d: 6, x: 32, y: 0, z: 30, sichtbar: true, farbe: '#ff6a3a' });
  b.schild({ text: 'Grill:\nnoch warm', x: 28, y: 0, z: 33, b: 2.8, h: 1.1 });
  b.npc({ art: 'gartenzwerg', name: 'Zwerg Zwenzel', x: 10, y: 0, z: 12, ry: -.6, handFarbe: '#f0c9a8', kopfHoehe: 2.2,
    dialog: ['HALT. Ach, du bist es. Der Garten ist jetzt zu. Wegen Winter.', 'Ich stehe hier, bis es taut. Das ist mein Vertrag. Zwerge haben Verträge.', 'Die Schneebälle da hinten werden größer, wenn sie rollen. Ich hab das lange beobachtet. Ich beobachte viel.'],
    dialogDanach: ['Ist mein Bart schon weiß? Nein? Das ist Schnee. Oder doch der Bart.'] });

  // ---- Schneeschaufel-Schanze zum Nachbarbalkon ----
  b.box({ w: 4, h: .4, d: 12, x: -30, y: 1.8, z: 10, rx: .3, farbe: '#e8474c', eis: true, mitte: true });
  b.sprungfeld({ w: 3.6, h: .4, d: 2, x: -30, y: 3.4, z: 3.6, staerke: 23, farbe: '#ffd25a' });
  b.box({ w: .5, h: 6, d: .5, x: -30, y: -2, z: 16.5, farbe: '#8a6a4a', rx: -.3, kollision: false });
  b.schild({ text: 'Schaufel-\nSchanze', x: -34, y: 0, z: 16, b: 3, h: 1.2 });
  b.box({ w: 8, h: 1, d: 8, x: -30, y: 6, z: -12, farbe: '#9a9ca8', textur: Texturen.karo('#a0a2ae', '#8e909c'), wiederholung: 3 });
  b.box({ w: 8, h: 1.2, d: .4, x: -30, y: 7, z: -8.2, farbe: '#8a6a4a' });
  b.schild({ text: 'Nachbars\nBalkon', x: -30, y: 7, z: -14, b: 3, h: 1.2 });
  b.klammer(-30, 7.8, -12, 'Nachbars Balkon');
  b.fusselBogen([-30, 4, 2], [-30, 7.5, -10], 5, 3);
  b.checkpoint(-30, 0, 20);
  b.fusselLinie([-20, .5, 34], [20, .5, 34], 6);
}
