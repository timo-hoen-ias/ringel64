import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';
import { Texturen } from '../engine/texturen.js';
import { PAARE } from './daten.js';

export const info = {
  name: 'Badewannen-Bucht', musik: 'bad', himmel: '#bfe3f5', tipp: 'Wasser macht dich nass und schwer. Im Wasser sinkst du zum Boden – gut für Dinge, die unten liegen.',
  nebel: { farbe: '#bfe3f5', nah: 35, fern: 95 }, licht: { himmel: 0xffffff, boden: 0x8aa0b8, intensitaet: 1.0, sonne: 0xfff6e0, sonneIntensitaet: 1.3, richtung: [-4, 10, 6] },
  todesHoehe: -8, spawn: [0, 0, 24], spawnYaw: Math.PI,
};

export function baue(welt, b) {
  const paare = PAARE.bad;
  const fliese = Texturen.fliesen('#f0f6ff', '#8fb3d8');
  const holz = Texturen.holz('#b08a5a');
  // Raum
  b.box({ w: 64, h: 1, d: 64, x: 0, y: -1, z: 0, farbe: '#f0f6ff', textur: fliese, wiederholung: 32 });
  for (const [x, z, w, d] of [[0, -32, 64, 1], [0, 32, 64, 1], [-32, 0, 1, 64], [32, 0, 1, 64]])
    b.box({ w, h: 24, d, x, y: 0, z, farbe: '#d8ecf8', textur: Texturen.fliesen('#dcedf8', '#9fc3e0'), wiederholung: 16 });
  // Fenster an der Nordwand mit Sims
  b.box({ w: 10, h: 8, d: .4, x: 0, y: 10, z: -31.6, farbe: '#fff8d0', kollision: false, emissive: 0x443311 });
  b.box({ w: 11, h: .6, d: 2.2, x: 0, y: 9.4, z: -30.6, farbe: '#ffffff' });

  b.portal({ x: 7, y: 0, z: 27, ziel: 'hub', name: 'Waschkeller', benoetigt: 0 });
  b.schild({ text: 'Badewannen-\nBucht', x: -5, y: 0, z: 26, b: 4, h: 1.5 });

  // ---- Badewanne ----
  const wanne = '#f6f6fa';
  b.box({ w: 28, h: .5, d: 12, x: 0, y: 0, z: -4, farbe: wanne });
  b.box({ w: 1.5, h: 6, d: 12, x: -13.25, y: 0, z: -4, farbe: wanne });
  b.box({ w: 1.5, h: 6, d: 12, x: 13.25, y: 0, z: -4, farbe: wanne });
  b.box({ w: 28, h: 6, d: 1.5, x: 0, y: 0, z: -9.25, farbe: wanne });
  b.box({ w: 28, h: 6, d: 1.5, x: 0, y: 0, z: 1.25, farbe: wanne });
  b.wasser({ w: 25, h: 3.5, d: 10, x: 0, y: .5, z: -4 });
  b.zylinder({ r: .5, h: 4, x: 0, y: 6, z: -9.5, farbe: '#c0c8d0', textur: Texturen.metall() });
  const hahn = b.zylinder({ r: .4, h: 3, x: 0, y: 9.5, z: -8, farbe: '#c0c8d0', mitte: true, kollision: false }); hahn.rotation.x = Math.PI / 2;
  let tropf = 0; welt.dinge.push({ update: dt => { tropf += dt; if (tropf > .7) { tropf = 0; welt.partikel.spawn(new THREE.Vector3(0, 9, -6.6), { anzahl: 1, farbe: 0x7fc8ff, geschwindigkeit: 0, leben: 1, groesse: .12 }); } } });

  // Seifenkiste (bewegtes Schiff) mit Mast
  const schiff = b.box({ w: 5, h: 1.2, d: 3.2, x: -8, y: 3.9, z: -4, farbe: '#e9a1c8' });
  b.bewege(schiff, { nach: [8, 3.9, -4], dauer: 7, pause: 1.2 });
  b.zylinder({ r: .15, h: 4, x: 0, y: .6, z: 0, farbe: '#7a5230', eltern: schiff, kollision: false });
  b.box({ w: .1, h: 2.2, d: 2.4, x: .2, y: 2, z: 0, farbe: '#ffffff', eltern: schiff, kollision: false });
  b.klammer(0, 7.4, -4, 'Mastspitze');
  b.fusselBogen([-10, 6.5, -4], [10, 6.5, -4], 7, 1.2);
  // Schwamm-Insel mit Socke
  b.box({ w: 3, h: 4, d: 3, x: 7, y: .5, z: -7.5, farbe: '#f2d35b', textur: Texturen.rauschen('#f2d35b', .2), wiederholung: 2 });
  b.socke(7, 4.5, -7.5, { name: paare[0][1], partner: paare[0][0], farbe: paare[0][2] });
  b.klammer(-10, 1.0, -7, 'Wannengrund');
  b.fusselLinie([-6, 1.2, -7], [-9, 1.2, -1], 4);
  // Abfluss-Knopf (nass drücken) öffnet den Schrank unterm Waschbecken
  const schrankTuer = b.tuer({ w: .4, h: 7.5, d: 6.5, x: -20.9, y: 0, z: 6, farbe: '#9ad1e8' });
  b.schalter({ x: 10, y: .5, z: -2, r: .9, braucheNass: true, beiDruecken: () => { schrankTuer.userData.oeffne(); welt.spiel.hud.popup('Der Schrank unter dem Waschbecken geht auf!'); } });

  // Weg in die Wanne: Hocker → Handtuchstapel → Rand
  b.zylinder({ r: 2, h: 2.4, x: 18, y: 0, z: 8, farbe: '#b08a5a', textur: holz, wiederholung: 2, seg: 10 });
  b.box({ w: 4, h: 4.4, d: 3, x: 17, y: 0, z: 2.5, farbe: '#ff9fbf', textur: Texturen.streifen('#ff9fbf', '#ffd0e0', 4), wiederholung: 2 });
  b.checkpoint(18, 2.4, 8);
  b.fusselLinie([18, 2.9, 8], [17, 4.9, 2.5], 3);
  b.fusselLinie([12, 6.5, 2], [-12, 6.5, 2], 6);
  b.gegner('ente', { x: -10, y: 6, z: 1.25, punkte: [[-10, 6, 1.25], [10, 6, 1.25]] });
  b.gegner('ente', { x: 10, y: 6, z: -9.25, punkte: [[10, 6, -9.25], [-10, 6, -9.25]], tempo: 2.6 });
  b.gegner('ente', { x: 10, y: 0, z: 18, punkte: [[10, 0, 18], [-6, 0, 18], [-6, 0, 12], [10, 0, 12]] });
  b.npc({ art: 'schwamm', name: "Käpt'n Schwamm", x: 13.25, y: 6, z: -4, ry: -Math.PI / 2, handFarbe: '#e8c850', belohnung: 'klammer',
    dialog: ['Arrr! Eine Landratte auf meiner Wanne!', 'Meine Entenmannschaft meutert. Sie wollen keine Schatzsuche, sie wollen quietschen.', 'Du siehst aus, als könntest du einen Schatz gebrauchen. Nimm diese Klammer und verschwinde!'],
    dialogDanach: ['Arrr. Das Wasser wird kalt. Wie meine Mannschaft.'] });

  // ---- Waschbecken (Westen): hohler Unterschrank, Platte, Zahnpasta-Sprungbrett, Föhn ----
  b.box({ w: 1, h: 8, d: 8, x: -28.5, y: 0, z: 6, farbe: '#f6f6fa' });
  b.box({ w: 8, h: 8, d: 1, x: -25, y: 0, z: 2.5, farbe: '#f6f6fa' });
  b.box({ w: 8, h: 8, d: 1, x: -25, y: 0, z: 9.5, farbe: '#f6f6fa' });
  b.box({ w: 8, h: .5, d: 8, x: -25, y: 8, z: 6, farbe: '#eef0f8' });
  b.klammer(-25.5, .8, 6, 'Schrank');
  b.socke(-24, 0, 8, { name: paare[1][1], partner: paare[1][0], farbe: paare[1][2] });
  b.fusselKreis(-25, .6, 6, 1.6, 4);
  // Zahnpasta
  const tube = b.zylinder({ r: 1.1, h: 6, x: -18, y: 1.1, z: 14, farbe: '#ffffff', mitte: true, kollision: false, seg: 10 }); tube.rotation.z = Math.PI / 2;
  b.zylinder({ r: 1.2, h: .8, x: -14.6, y: 1.1, z: 14, farbe: '#e8474c', mitte: true, kollision: false, seg: 10 }).rotation.z = Math.PI / 2;
  b.schild({ text: 'ZAHNWEISS', x: -18, y: 1.1, z: 15.2, b: 3.2, h: .9, pfosten: false });
  b.box({ w: 2.6, h: 1.4, d: 2.6, x: -21.5, y: 0, z: 14, farbe: '#ffffff' });
  b.sprungfeld({ w: 2.2, h: .6, d: 2.2, x: -21.5, y: 1.4, z: 14, staerke: 23, farbe: '#4fd0c0' });
  b.schild({ text: 'Drauf-\nhüpfen!', x: -24, y: 0, z: 16, b: 2.4, h: 1.1 });
  b.checkpoint(-25, 8.5, 3.5);
  b.fusselKreis(-25, 9, 6, 2.4, 6);
  b.npc({ art: 'zahnbuerste', name: 'Zahnbürste Zoe', x: -27.5, y: 8.5, z: 3.5, ry: Math.PI / 2 + .4, handFarbe: '#5fb7e8', kopfHoehe: 1.8,
    dialog: ['Hallo! Ich bin Zoe. Ich putze. Alles. Immer.', 'Du ... hast du dich schon mal gewaschen? Ich frage für einen Freund.', 'Der Föhn hinten bläst nach oben. Trockene Socken fliegen damit bis zur Duschstange.'] });
  for (let i = 0; i < 3; i++) b.zylinder({ r: .8, h: 3.5 + i * .6, x: -28, y: 8.5, z: 9 - i * 1.8, farbe: ['#9ad1e8', '#ffb0c8', '#b8e8a0'][i], seg: 8 });
  b.klammer(-28, 8.9, 3.3, 'Hinter dem Shampoo');
  // Föhn mit Aufwind (trocknet und bläst hoch)
  b.box({ w: 2.4, h: 1.6, d: 1.2, x: -23.5, y: 8.5, z: 8.5, farbe: '#ff6fa8' });
  b.zylinder({ r: .7, h: 1.6, x: -23.5, y: 10.1, z: 8.5, farbe: '#ffb0c8', seg: 8, kollision: false });
  b.wind({ w: 3, h: 12, d: 3, x: -23.5, y: 10.3, z: 8.5, kraft: [0, 34, 0], sichtbar: true });
  b.hitze({ w: 3, h: 12, d: 3, x: -23.5, y: 10.3, z: 8.5 });
  b.schild({ text: 'Föhn: trocknet\n& bläst hoch', x: -23.5, y: 8.5, z: 11, b: 3.2, h: 1.2 });
  // Haken-Kette zur Duschstange
  b.haken(-24, 13, 0); b.haken(-22, 15.5, -5); b.haken(-24, 18, -10);
  // Duschstange mit Handtuch-Plattformen
  const stange = b.zylinder({ r: .55, h: 20, x: -25, y: 17, z: -14, farbe: '#c0c8d0', textur: Texturen.metall(), mitte: true, seg: 10 }); stange.rotation.x = Math.PI / 2; stange.userData.kollider.aktualisiere();
  b.box({ w: 3, h: 4, d: .3, x: -25, y: 13, z: -8, farbe: '#ffd25a', textur: Texturen.streifen('#ffd25a', '#fff0b0', 3), wiederholung: 2 });
  b.box({ w: 3, h: 4, d: .3, x: -25, y: 13, z: -18, farbe: '#5fb7e8', textur: Texturen.streifen('#5fb7e8', '#bfe8ff', 3), wiederholung: 2 });
  b.fusselLinie([-25, 18, -6], [-25, 18, -22], 6);
  b.klammer(-25, 18.2, -23.5, 'Duschstange');
  b.socke(-25, 17.6, -5, { name: paare[2][1], partner: paare[2][0], farbe: paare[2][2] });
  // Seifen-Rutsche vom Waschbecken in die Wanne
  b.box({ w: 8, h: .5, d: 2.6, x: -17.5, y: 7.2, z: 0, rz: -.3, farbe: '#b8f0c8', eis: true, mitte: true });
  b.schild({ text: 'Seife = glatt', x: -18, y: 8.6, z: 1.6, b: 2.8, h: .9, pfosten: false });

  // ---- Toilette (Osten): Schüssel, Rolle, Spülkasten, Ablagen zur Fensterbank ----
  b.zylinder({ r: 3.2, h: 4, x: 22, y: 0, z: -13, farbe: '#f6f6fa', seg: 16 });
  b.zylinder({ r: 3.4, rOben: 3.4, h: .4, x: 22, y: 4, z: -13, farbe: '#2a1a2e', seg: 16, kollision: false });
  b.box({ w: 6, h: 5.5, d: 2.2, x: 22, y: 4, z: -18, farbe: '#f6f6fa' });
  b.box({ w: 1.2, h: .4, d: .6, x: 23.5, y: 9.5, z: -18, farbe: '#c0c8d0' });
  const rolle = b.zylinder({ r: 1.3, h: 2, x: 26.8, y: 5.6, z: -12, farbe: '#ffffff', mitte: true, seg: 12 }); rolle.rotation.z = Math.PI / 2; rolle.userData.kollider.aktualisiere();
  b.box({ w: 2.4, h: .3, d: .3, x: 29.5, y: 5.5, z: -12, farbe: '#c0c8d0', kollision: false });
  b.klammer(22, 10, -18, 'Spülkasten');
  b.fusselLinie([22, 4.6, -11], [22, 4.6, -15], 3);
  b.checkpoint(22, 4, -11);
  b.box({ w: 3, h: .4, d: 2, x: 22, y: 9.5, z: -24, farbe: '#ffffff' });
  b.box({ w: 3, h: .4, d: 2, x: 16, y: 9.5, z: -29, farbe: '#ffffff' });
  b.box({ w: 3, h: .4, d: 2, x: 10, y: 9.5, z: -29.5, farbe: '#ffffff' });
  b.fussel(22, 10.3, -24); b.fussel(16, 10.3, -29); b.fussel(10, 10.3, -29.5);
  b.knopf(0, 10.3, -30.6, 1);
  b.fusselLinie([-4, 10.4, -30.6], [4, 10.4, -30.6], 3);
  // Badematte, Flusen am Boden
  b.box({ w: 8, h: .2, d: 5, x: 0, y: 0, z: 8, farbe: '#9ad1e8', textur: Texturen.rauschen('#9ad1e8', .15), wiederholung: 4 });
  b.fusselKreis(0, .5, 8, 2.5, 6);
  b.fusselLinie([-6, .4, 20], [6, .4, 20], 4);
}
