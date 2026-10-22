import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';
import { Texturen, material, faerbe } from '../engine/texturen.js';
import { PAARE } from './daten.js';

export const info = {
  name: 'Wäscheleinen-Höhen', musik: 'garten', himmel: '#8fd0f5', tipp: 'Wind trägt nur trockene Socken. Bettlaken sind Trampoline. Die Amsel hält dich für Nistmaterial.',
  nebel: { farbe: '#bfe6f8', nah: 50, fern: 140 }, licht: { himmel: 0xffffff, boden: 0x5a8a4a, intensitaet: 1.1, sonne: 0xfff6d0, sonneIntensitaet: 1.5, richtung: [6, 12, 4] },
  todesHoehe: -8, spawn: [0, 0, 36], spawnYaw: Math.PI, kamera: { dist: 8.5 },
};

export function baue(welt, b) {
  const paare = PAARE.garten;
  // Rasen, Terrasse, Zaun
  b.box({ w: 100, h: 1, d: 100, x: 0, y: -1, z: 0, farbe: '#5fae4a', textur: Texturen.gras(), wiederholung: 30 });
  b.box({ w: 30, h: .3, d: 14, x: 0, y: 0, z: 37, farbe: '#b8b0a8', textur: Texturen.karo('#b8b0a8', '#a8a098'), wiederholung: 8 });
  for (const [x, z, w, d] of [[0, -46, 94, .6], [0, 46, 94, .6], [-46, 0, .6, 94], [46, 0, .6, 94]]) b.box({ w, h: 2.6, d, x, y: 0, z, farbe: '#c8a060', textur: Texturen.holz('#c8a060'), wiederholung: 20 });
  for (let i = -44; i <= 44; i += 4) { for (const [x, z] of [[i, -46], [i, 46], [-46, i], [46, i]]) b.box({ w: .7, h: 3.2, d: .7, x, y: 0, z, farbe: '#b08a4a', kollision: false }); }
  b.portal({ x: 7, y: .3, z: 40, ziel: 'hub', name: 'Waschkeller', benoetigt: 0 });
  b.schild({ text: 'Wäscheleinen-\nHöhen', x: -5, y: .3, z: 40, b: 4, h: 1.5 });
  // Sonnenfleck (trocknet)
  b.hitze({ w: 10, h: 4, d: 8, x: -10, y: 0, z: 34, sichtbar: true, farbe: '#ffe04a' });
  b.schild({ text: 'Sonnenfleck:\ntrocknet', x: -10, y: .3, z: 30, b: 3, h: 1.2 });
  // Blumen
  for (let i = 0; i < 24; i++) { const x = -40 + (i * 37) % 80, z = -40 + (i * 53) % 70; if (Math.abs(x) < 24 && z > 0 && z < 20) continue;
    b.zylinder({ r: .08, h: 1.2, x, y: 0, z, farbe: '#3a8a3a', kollision: false, seg: 5 }); b.kugel({ r: .35, x, y: 1.1, z, farbe: ['#e8474c', '#ffd25a', '#ff9fbf', '#5fb7e8'][i % 4], kollision: false, seg: 6 }); }

  // ---- Wäscheleine mit Pfosten ----
  const pfosten = (x, z) => { b.zylinder({ r: .5, h: 14, x, y: 0, z, farbe: '#8a7a6a', textur: Texturen.holz('#8a7a6a'), wiederholung: 4, seg: 8 }); b.box({ w: 1.4, h: .3, d: 1.4, x, y: 14, z, farbe: '#5a4a3a' }); };
  pfosten(-20, 10); pfosten(20, 10);
  const leine = b.zylinder({ r: .15, h: 40, x: 0, y: 13.8, z: 10, farbe: '#f0f0f0', mitte: true, seg: 6, kollision: false }); leine.rotation.z = Math.PI / 2;
  // hängende Wäsche als Pendel-Plattformen
  const haenge = (x, { w, h, d, farbe, textur, phase = 0, aermel = false }) => {
    const g = b.gruppe(x, 13.8, 10);
    b.box({ w, h, d, x: 0, y: -h, z: 0, farbe, textur, wiederholung: 2, eltern: g });
    if (aermel) for (const s of [-1, 1]) b.box({ w: 2.4, h: 1, d: d, x: s * (w / 2 + 1.2), y: -1, z: 0, farbe, textur, wiederholung: 2, eltern: g });
    for (const s of [-1, 1]) b.box({ w: .3, h: .9, d: .5, x: s * (w / 2 - .4), y: -.3, z: 0, farbe: '#ffd25a', kollision: false, eltern: g });
    b.pendel(g, { achse: 'z', amplitude: .18, dauer: 3.2, phase });
    return g;
  };
  haenge(-14, { w: 3, h: 7, d: 1.2, farbe: '#3b6fd8', textur: Texturen.karo('#3b6fd8', '#2f5fc0') });
  haenge(-6, { w: 4, h: 5, d: .9, farbe: '#e8474c', textur: Texturen.karo('#e8474c', '#d03a40'), phase: 1, aermel: true });
  haenge(2, { w: 3, h: 8, d: .8, farbe: '#ffd25a', textur: Texturen.streifen('#ffd25a', '#fff0b0', 3), phase: 2 });
  haenge(12, { w: 4, h: 5, d: .9, farbe: '#3aa84a', textur: Texturen.karo('#3aa84a', '#2f9040'), phase: .5, aermel: true });
  haenge(16.8, { w: 5, h: 8, d: .6, farbe: '#ffffff', textur: Texturen.karo('#ffffff', '#f0f0f8'), phase: 1.5 });
  b.socke(7, 13.7, 10, { name: paare[1][1], partner: paare[1][0], farbe: paare[1][2] });
  b.klammer(-6, 14.6, 10, 'Höchstes Hemd');
  b.klammer(-20, 14.9, 10, 'Pfostenspitze');
  b.fusselLinie([-12, 14.4, 10], [15, 14.4, 10], 7);
  // Gießkanne → Bettlaken-Trampolin → Hose
  b.zylinder({ r: 2.5, h: 5, x: -24, y: 0, z: 3, farbe: '#3aa84a', seg: 12 });
  const tuelle = b.zylinder({ r: .4, h: 4, x: -21, y: 3.5, z: 3, farbe: '#3aa84a', mitte: true, kollision: false, seg: 6 }); tuelle.rotation.z = -1;
  b.checkpoint(-24, 0, 8);
  b.box({ w: 8, h: .5, d: 6, x: -16, y: 7, z: 10, farbe: '#ffffff', textur: Texturen.karo('#ffffff', '#f0f0f8'), wiederholung: 4, sprung: 20 });
  for (const s of [-1, 1]) b.box({ w: .2, h: 7.5, d: .2, x: -16 + s * 3.8, y: 0, z: 10, farbe: '#f0f0f0', kollision: false });
  b.schild({ text: 'Bettlaken =\nTrampolin', x: -20, y: 0, z: 14, b: 3, h: 1.2 });
  b.fussel(-24, 5.6, 3); b.fussel(-16, 8, 10);
  b.gegner('amsel', { x: -4, y: 17, z: 4, kreis: 9, reichweite: 14 });
  b.gegner('amsel', { x: 14, y: 17, z: 14, kreis: 7, reichweite: 12 });
  b.checkpoint(22, 0, 14);

  // ---- Sonnenblume östlich von Pfosten 2 ----
  b.zylinder({ r: .35, h: 16, x: 26, y: 0, z: 4, farbe: '#3a8a3a', seg: 6 });
  b.zylinder({ r: 2.6, h: .8, x: 26, y: 16, z: 4, farbe: '#5a3a1a', seg: 14 });
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; b.box({ w: 1.8, h: .2, d: .9, x: 26 + Math.cos(a) * 3.2, y: 16.3, z: 4 + Math.sin(a) * 3.2, ry: -a, farbe: '#ffd25a', kollision: false }); }
  for (const [x, z] of [[24.5, 1], [27.5, 1.5]]) b.box({ w: 3, h: .2, d: 1.2, x, y: 9, z, farbe: '#3aa84a', rz: .3, kollision: false });
  b.klammer(26, 17.4, 4, 'Sonnenblume');
  b.fusselBogen([20, 14.6, 10], [26, 17, 5], 4, 1.5);

  // ---- Zweite Leine zum Baum, Wind, Baumkrone mit Nest ----
  const leine2 = b.zylinder({ r: .15, h: 26, x: -24, y: 13.8, z: -2, farbe: '#f0f0f0', mitte: true, seg: 6, kollision: false }); leine2.rotation.x = Math.PI / 2; leine2.rotation.z = .33;
  const haenge2 = (z, x, o) => { const g = b.gruppe(x, 13.8, z); b.box({ w: o.d, h: o.h, d: o.w, x: 0, y: -o.h, z: 0, farbe: o.farbe, textur: o.textur, wiederholung: 2, eltern: g });
    if (o.aermel) for (const s of [-1, 1]) b.box({ w: o.d, h: 1, d: 2.4, x: 0, y: -1, z: s * (o.w / 2 + 1.2), farbe: o.farbe, textur: o.textur, wiederholung: 2, eltern: g });
    b.pendel(g, { achse: 'x', amplitude: .18, dauer: 3.5, phase: o.phase || 0 }); };
  haenge2(2, -21.5, { w: 3, h: 7, d: 1.2, farbe: '#9b5bff', textur: Texturen.karo('#9b5bff', '#8a4ae8') });
  haenge2(-6, -24, { w: 4, h: 5, d: .9, farbe: '#ff9a3c', textur: Texturen.karo('#ff9a3c', '#e8852a'), phase: 1.2, aermel: true });
  b.wind({ w: 10, h: 10, d: 12, x: -27, y: 10, z: -14, kraft: [-9, 7, -16], sichtbar: true });
  b.schild({ text: 'Wind: nur\ntrocken gleiten', x: -30, y: 0, z: -4, b: 3, h: 1.2 });
  b.zylinder({ r: 2.5, h: 14, x: -30, y: 0, z: -24, farbe: '#6a4a2a', textur: Texturen.holz('#6a4a2a'), wiederholung: 5, seg: 10 });
  b.kugel({ r: 7.5, x: -30, y: 13, z: -24, farbe: '#3f9a3a', mitte: true, textur: Texturen.rauschen('#3f9a3a', .18, 4), wiederholung: 6, seg: 14 });
  b.kugel({ r: 4, x: -24, y: 11, z: -20, farbe: '#4aa844', mitte: true, kollision: false, seg: 10 });
  b.haken(-27, 17, -16); b.haken(-30, 21.5, -21);
  b.klammer(-30, 21.2, -24, 'Baumkrone');
  b.fusselKreis(-30, 20.8, -24, 2.5, 5);
  b.checkpoint(-26, 0, -18);
  // Nest
  b.box({ w: 3, h: .5, d: 3, x: -23, y: 14.5, z: -20, farbe: '#8a6a3a' });
  const nest = new THREE.Mesh(faerbe(new THREE.TorusGeometry(1.3, .4, 6, 12), '#8a6a3a'), material('#8a6a3a')); nest.rotation.x = Math.PI / 2; nest.position.set(-23, 15.2, -20); welt.scene.add(nest);
  b.socke(-23, 15, -20, { name: paare[2][1], partner: paare[2][0], farbe: paare[2][2] });

  // ---- Vogeltränke, schwerer Knopf, Gartenhaus ----
  b.zylinder({ r: 3, h: 3, x: 10, y: 0, z: -20, farbe: '#b8b0a8', seg: 14 });
  b.wasser({ w: 5, h: 1, d: 5, x: 10, y: 3, z: -20 });
  b.schild({ text: 'Vogeltränke:\nnass werden', x: 10, y: 0, z: -15.5, b: 3, h: 1.2 });
  b.checkpoint(14, 0, -16);
  const tuer = b.tuer({ w: 4, h: 6, d: .5, x: 30, y: 0, z: -19.8, farbe: '#7a5230' });
  b.schalter({ x: 20, y: 0, z: -24, r: 1, braucheNass: true, beiDruecken: () => { tuer.userData.oeffne(); welt.spiel.hud.popup('Die Gartenhaus-Tür geht auf!'); }, text: 'Schwerer Knopf:\nnass drücken' });
  const holz = Texturen.holz('#8a6a4a');
  b.box({ w: 12, h: 8, d: .6, x: 30, y: 0, z: -30, farbe: '#8a6a4a', textur: holz, wiederholung: 4 });
  b.box({ w: .6, h: 8, d: 10, x: 24.2, y: 0, z: -25, farbe: '#8a6a4a', textur: holz, wiederholung: 4 });
  b.box({ w: .6, h: 8, d: 10, x: 35.8, y: 0, z: -25, farbe: '#8a6a4a', textur: holz, wiederholung: 4 });
  b.box({ w: 3.8, h: 8, d: .6, x: 26, y: 0, z: -20, farbe: '#8a6a4a', textur: holz, wiederholung: 2 });
  b.box({ w: 3.8, h: 8, d: .6, x: 34, y: 0, z: -20, farbe: '#8a6a4a', textur: holz, wiederholung: 2 });
  b.box({ w: 4.2, h: 2, d: .6, x: 30, y: 6, z: -20, farbe: '#8a6a4a', textur: holz, wiederholung: 2 });
  b.box({ w: 13, h: .6, d: 12, x: 30, y: 8, z: -25, farbe: '#5a3a2a', textur: holz, wiederholung: 4 });
  b.box({ w: 14, h: 2, d: 13, x: 30, y: 8.6, z: -25, farbe: '#a04040', rx: 0, kollision: false, textur: Texturen.karo('#a04040', '#903636'), wiederholung: 4 });
  b.schild({ text: 'GARTENHAUS', x: 30, y: 8.6, z: -18.5, b: 4, h: 1, pfosten: false });
  b.klammer(30, .8, -26, 'Gartenhaus');
  b.socke(27, 0, -27, { name: paare[0][1], partner: paare[0][0], farbe: paare[0][2] });
  b.lampe(30, 5, -25, 0xffd9a0, 1, 12);
  b.fusselLinie([26, .5, -24], [34, .5, -24], 4);
  b.npc({ art: 'gartenzwerg', name: 'Zwerg Zwenzel', x: 20, y: 0, z: -12, ry: -.5, handFarbe: '#f0c9a8', kopfHoehe: 2.2, belohnung: 'klammer',
    dialog: ['HALT. Wer bist du? Was willst du? Hast du einen Gartenausweis?', 'Ich bewache diesen Garten. Hauptsächlich vor Maulwürfen. Und Socken. Du bist ... eine Socke.', 'Hm. Du riechst harmlos. Also: furchtbar, aber harmlos.', 'Hier, nimm die Klammer. Sie ist von der Leine gefallen. Ich hebe alles auf. ALLES.'],
    dialogDanach: ['Die Amsel ist nicht böse. Sie baut nur. Mit allem. Auch mit dir.'] });

  // ---- Rasenmäher mit Schubkarre ----
  b.box({ w: 4, h: 2, d: 6, x: 30, y: 0, z: 32, farbe: '#5fb7e8', textur: Texturen.metall(), wiederholung: 3 });
  b.zylinder({ r: 1, h: .6, x: 30, y: .5, z: 35.5, farbe: '#2b2b33', mitte: true, kollision: false }).rotation.z = Math.PI / 2;
  b.knopf(30, 2.5, 32, 6);
  b.box({ w: 5, h: 3, d: 6, x: 36, y: 0, z: 30, farbe: '#e8474c', textur: Texturen.metall(), wiederholung: 3 });
  for (const s of [-1, 1]) b.box({ w: .4, h: 7, d: .4, x: 36 + s * 1.8, y: 2, z: 34.5, farbe: '#2b2b33', rx: -.5, kollision: false });
  b.box({ w: 4.4, h: .6, d: .8, x: 36, y: 6.3, z: 36.2, farbe: '#2b2b33' });
  b.klammer(36, 7.4, 36.2, 'Rasenmäher');
  b.fussel(30, 2.8, 30); b.fussel(36, 3.5, 30);
  b.schild({ text: 'RASENMÄHER\n(aus. hoffentlich.)', x: 36, y: 3, z: 27, b: 3.6, h: 1.2, pfosten: false });
  b.fusselKreis(0, .5, 20, 6, 8);
  b.fusselLinie([-30, .5, 30], [30, .5, 20], 6);
}
