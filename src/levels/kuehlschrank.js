import { Texturen } from '../engine/texturen.js';
import { PAARE } from './daten.js';

export const info = {
  name: 'Kühlschrank-Gebirge', musik: 'kuehlschrank', himmel: '#dff1fb', tipp: 'Trockene Socken rutschen auf Eis. Nasse kleben. Die Pfütze hilft, die Kühlschranklampe trocknet.',
  nebel: { farbe: '#dff1fb', nah: 25, fern: 70 }, licht: { himmel: 0xffffff, boden: 0x9ab8d0, intensitaet: 1.0, sonne: 0xe8f4ff, sonneIntensitaet: 1.2, richtung: [2, 10, 8] },
  todesHoehe: -8, spawn: [0, 0, 12], spawnYaw: Math.PI,
};

export function baue(welt, b) {
  const paare = PAARE.kuehlschrank;
  const weiss = '#f4f7fa';
  const eisTex = Texturen.rauschen('#cfe9ff', .1, 3);
  // Innenraum: Boden, Rückwand, Seiten, Decke, Türdichtung vorn
  b.box({ w: 50, h: 1, d: 30, x: 0, y: -1, z: 0, farbe: weiss, textur: Texturen.rauschen('#f4f7fa', .04), wiederholung: 8 });
  b.box({ w: 50, h: 44, d: 1, x: 0, y: 0, z: -15.5, farbe: weiss });
  b.box({ w: 1, h: 44, d: 30, x: -25.5, y: 0, z: 0, farbe: weiss });
  b.box({ w: 1, h: 44, d: 30, x: 25.5, y: 0, z: 0, farbe: weiss });
  b.box({ w: 50, h: 1, d: 30, x: 0, y: 43, z: 0, farbe: '#dfe6ee', kollision: false });
  b.box({ w: 50, h: .6, d: 1, x: 0, y: 0, z: 15, farbe: '#c8d0d8' });
  // Küche dahinter (Deko in der Tiefe)
  b.box({ w: 120, h: 1, d: 60, x: 0, y: -9, z: 40, farbe: '#5a4a3a', kollision: false, textur: Texturen.holz('#5a4a3a'), wiederholung: 10 });
  b.portal({ x: 7, y: 0, z: 11, ziel: 'hub', name: 'Waschkeller', benoetigt: 0 });
  b.schild({ text: 'Kühlschrank-\nGebirge', x: -5, y: 0, z: 11, b: 4, h: 1.5 });

  // ---- Unterstes Fach ----
  // Gemüsefach (hohl, vorn offen): Klammer drin
  b.box({ w: 1, h: 5, d: 12, x: -20, y: 0, z: -8, farbe: '#d8e8f0', transparent: true, opacity: .7 });
  b.box({ w: 1, h: 5, d: 12, x: 4, y: 0, z: -8, farbe: '#d8e8f0', transparent: true, opacity: .7 });
  b.box({ w: 25, h: 5, d: 1, x: -8, y: 0, z: -14, farbe: '#d8e8f0', transparent: true, opacity: .7 });
  b.box({ w: 25, h: .5, d: 13, x: -8, y: 5, z: -8, farbe: '#d8e8f0', transparent: true, opacity: .6 });
  b.schild({ text: 'Gemüsefach', x: -8, y: 5.5, z: -1.5, b: 3.6, h: 1, pfosten: false });
  for (let i = 0; i < 4; i++) b.kugel({ r: 1.1, x: -16 + i * 3.4, y: 0, z: -11, farbe: ['#e8474c', '#ff8c3a', '#e8474c', '#3aa84a'][i], seg: 8 });
  b.klammer(-8, 1.2, -6, 'Gemüsefach');
  b.fusselLinie([-16, .5, -5], [0, .5, -5], 5);
  // Pfütze und Eisfläche
  b.wasser({ w: 6, h: .5, d: 5, x: 12, y: 0, z: 4, farbe: '#7fc8ff' });
  b.schild({ text: 'Pfütze', x: 12, y: 0, z: 7.5, b: 2.4, h: .9 });
  b.box({ w: 16, h: .3, d: 10, x: -14, y: 0, z: 7, farbe: '#cfe9ff', textur: eisTex, wiederholung: 4, eis: true, transparent: true, opacity: .85 });
  b.schild({ text: 'Eis: nass\nkleben!', x: -6, y: 0, z: 12, b: 2.6, h: 1.1 });
  b.klammer(-22, .8, 8, 'Eisfläche');
  b.fusselKreis(-14, .8, 7, 3.5, 6);
  b.gegner('magnet', { x: -10, y: .3, z: 10, punkte: [[-10, .3, 10], [-18, .3, 10], [-18, .3, 4], [-10, .3, 4]] });
  // Joghurtbecher-Berg → erstes Fach
  b.zylinder({ r: 3.2, h: 4, x: 17, y: 0, z: 8, farbe: '#ff9fbf', seg: 12 });
  b.zylinder({ r: 2.6, h: 4, x: 18, y: 4, z: 6, farbe: '#ffd25a', seg: 12 });
  b.zylinder({ r: 2.1, h: 3, x: 19, y: 8, z: 4, farbe: '#b8e8a0', seg: 12 });
  b.schild({ text: 'JOGHURT', x: 17, y: 1.5, z: 11.3, b: 3, h: .9, pfosten: false });
  b.checkpoint(14, 0, 11);
  b.fussel(17, 4.5, 8); b.fussel(18, 8.5, 6); b.fussel(19, 11.5, 4);

  // ---- Fach 1 (Glasboden y 10) ----
  b.box({ w: 48, h: .4, d: 20, x: 0, y: 10, z: -5, farbe: '#cfe8ff', transparent: true, opacity: .4 });
  b.checkpoint(19, 10.4, 2);
  // Eierkarton mit Socke zwischen den Eiern
  b.box({ w: 10, h: 1, d: 6, x: 8, y: 10.4, z: -9, farbe: '#9a8a7a', textur: Texturen.rauschen('#9a8a7a', .12), wiederholung: 3 });
  for (let i = 0; i < 6; i++) b.kugel({ r: 1, x: 4.5 + (i % 3) * 3.5, y: 11.2, z: -10.5 + Math.floor(i / 3) * 3, farbe: '#fff4e0', seg: 8 });
  b.socke(8, 11.4, -9, { name: paare[0][1], partner: paare[0][0], farbe: paare[0][2] });
  // Butter (glatt) und Milchtüte
  b.box({ w: 6, h: 2, d: 3, x: -4, y: 10.4, z: -2, farbe: '#fff2a8', eis: true });
  b.schild({ text: 'BUTTER', x: -4, y: 12.4, z: -2, b: 2.4, h: .8, pfosten: false });
  b.box({ w: 4, h: 8, d: 4, x: -18, y: 10.4, z: -8, farbe: '#ffffff', textur: Texturen.karo('#ffffff', '#5fb7e8'), wiederholung: 2 });
  b.box({ w: 4, h: 1, d: 4, x: -18, y: 18.4, z: -8, rx: 0, farbe: '#5fb7e8', kollision: false });
  b.schild({ text: 'MILCH', x: -18, y: 13, z: -5.9, b: 3, h: 1, pfosten: false });
  b.klammer(-18, 19.6, -8, 'Milchtüte');
  b.fusselLinie([12, 10.9, 0], [-12, 10.9, 0], 6);
  b.fusselBogen([-10, 10.9, -6], [-16, 13, -8], 4, 2);
  b.gegner('magnet', { x: 0, y: 10.4, z: 2, punkte: [[0, 10.4, 2], [-12, 10.4, 2], [-12, 10.4, -6], [0, 10.4, -6]] });
  b.gegner('magnet', { x: 14, y: 10.4, z: -2, punkte: [[14, 10.4, -2], [20, 10.4, -2], [20, 10.4, -12], [14, 10.4, -12]], tempo: 2 });
  // Haken als zweiter Weg nach oben
  b.haken(-22, 15, 2); b.haken(-22, 19.5, -2);

  // ---- Fach 2 (y 20) ----
  b.box({ w: 48, h: .4, d: 16, x: 0, y: 20, z: 1, farbe: '#cfe8ff', transparent: true, opacity: .4 });
  b.checkpoint(-18, 20.4, 2);
  b.npc({ art: 'kaese', name: 'Käse Kasimir', x: -8, y: 20.4, z: -5, ry: .3, handFarbe: '#d9a828', belohnung: 'klammer',
    dialog: ['Hmmm. Du riechst. Ich rieche. Wir verstehen uns.', 'Ich bin seit 2019 abgelaufen. Seitdem bin ich weise. Und blau an den Rändern.', 'Weisheit für dich: Wer nass ist, rutscht nicht. Wer trocken ist, fliegt. Und wer Käse ist, bleibt.', 'Nimm diese Klammer. Ich habe keine Hände, aber ich habe Prinzipien.'],
    dialogDanach: ['Bleib nicht zu lange. Die Kühlschranklampe macht misstrauisch.'] });
  // Gurkenglas mit Senfglas als Stufe
  b.zylinder({ r: 1.5, h: 3.5, x: 10, y: 20.4, z: 4, farbe: '#e8c030', seg: 10 });
  b.zylinder({ r: 2.6, h: 7, x: 14, y: 20.4, z: -2, farbe: '#8ac85a', seg: 12, transparent: true, opacity: .7 });
  b.zylinder({ r: 2.7, h: .8, x: 14, y: 27.4, z: -2, farbe: '#5a5a66', seg: 12 });
  b.schild({ text: 'GURKEN', x: 14, y: 23, z: .8, b: 3, h: 1, pfosten: false });
  b.klammer(14, 29, -2, 'Gurkenglas');
  b.socke(18, 20.4, -6, { name: paare[2][1], partner: paare[2][0], farbe: paare[2][2] });
  b.fusselLinie([-14, 20.9, 4], [6, 20.9, 4], 6);
  // Kühlschranklampe (trocknet) mit Klammer
  b.box({ w: 3, h: 1.5, d: 2, x: 0, y: 23.5, z: -13.5, farbe: '#e8e8e8' });
  b.kugel({ r: .8, x: 0, y: 23.8, z: -12.2, farbe: '#fff8c0', kollision: false, emissive: 0x887744 });
  b.lampe(0, 24, -11, 0xfff2c0, 2, 22);
  b.hitze({ w: 6, h: 5, d: 6, x: 0, y: 22, z: -12 });
  b.schild({ text: 'Lampe: warm\n& trocken', x: 3, y: 25, z: -13.5, b: 3, h: 1.2, pfosten: false });
  b.klammer(0, 25.4, -13.5, 'Kühlschranklampe');
  // Eiswürfel-Stufen zum Gefrierfach
  for (const [x, y, z] of [[22, 20.4, 6], [22, 23.4, 1], [22, 26.4, -4]])
    b.box({ w: 3, h: 3, d: 3, x, y, z, farbe: '#cfe9ff', textur: eisTex, wiederholung: 2, transparent: true, opacity: .8, eis: true });
  b.fussel(22, 23.9, 6); b.fussel(22, 26.9, 1); b.fussel(22, 29.9, -4);

  // ---- Gefrierfach (y 30) ----
  b.box({ w: 48, h: .6, d: 18, x: 0, y: 30, z: -6, farbe: '#bfe2ff', textur: eisTex, wiederholung: 6, eis: true });
  b.schild({ text: 'GEFRIERFACH\n-18°C', x: 0, y: 30.6, z: 3, b: 5, h: 1.4 });
  b.checkpoint(20, 30.6, 0);
  for (let i = 0; i < 12; i++) b.kugel({ r: .35, x: -20 + (i % 6) * 2.2, y: 30.6, z: -12 + Math.floor(i / 6) * 2, farbe: '#5fae4a', kollision: false, seg: 6 });
  b.box({ w: 3, h: 3, d: 3, x: -12, y: 30.6, z: -8, farbe: '#cfe9ff', textur: eisTex, wiederholung: 2, transparent: true, opacity: .75, eis: true });
  b.socke(-12, 33.6, -8, { name: paare[1][1], partner: paare[1][0], farbe: paare[1][2] });
  // Eis am Stiel mit Knopf
  b.box({ w: 2.4, h: 5, d: 1.2, x: 6, y: 30.6, z: -10, farbe: '#ff8c3a' });
  b.box({ w: .5, h: 2, d: .3, x: 6, y: 35.6, z: -10, farbe: '#c8a060', kollision: false });
  b.knopf(6, 36.2, -10, 2);
  b.klammer(-20, 31.4, -12, 'Gefrierfach');
  b.fusselLinie([14, 31.2, -4], [-14, 31.2, -4], 7);
  b.gegner('magnet', { x: -4, y: 30.6, z: -4, punkte: [[-4, 30.6, -4], [-16, 30.6, -4], [-16, 30.6, -11], [-4, 30.6, -11]], tempo: 2.4 });
  // Eiszapfen von der Decke (Deko)
  for (let i = 0; i < 8; i++) b.zylinder({ r: .05, rOben: .45, h: 2 + (i % 3), x: -20 + i * 5.5, y: 43 - (2 + (i % 3)), z: -8 + (i % 2) * 4, farbe: '#cfe9ff', kollision: false, seg: 6 });
}
