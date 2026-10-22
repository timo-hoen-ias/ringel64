import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';
import { Texturen, material } from '../engine/texturen.js';
import { PAARE } from './daten.js';

export const info = {
  name: 'Herdplatten-Vulkan', musik: 'herd', himmel: '#2a1418', tipp: 'Hier ist alles heiß: Du bleibst trocken und kannst gleiten. Die Herdplatten glühen im Takt – spring, wenn sie dunkel sind.',
  nebel: { farbe: '#2a1418', nah: 30, fern: 80 }, licht: { himmel: 0xffb080, boden: 0x3a1a10, intensitaet: .8, sonne: 0xffcc99, sonneIntensitaet: 1.0, richtung: [-3, 10, 5] },
  todesHoehe: -6, spawn: [-4, 0, 14], spawnYaw: Math.PI, immerTrocken: true,
};

export function baue(welt, b) {
  const paare = PAARE.herd;
  const schwarz = '#2b2b33';
  // Herdfläche (Glaskeramik) und Arbeitsplatte rechts, Backofenglut darunter
  b.box({ w: 44, h: 1.5, d: 32, x: 0, y: -1.5, z: 0, farbe: schwarz, textur: Texturen.rauschen('#2b2b33', .08), wiederholung: 6 });
  b.box({ w: 20, h: 1.5, d: 32, x: 32, y: -1.5, z: 0, farbe: '#8a6a4a', textur: Texturen.holz('#8a6a4a'), wiederholung: 6 });
  const glut = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), new THREE.MeshBasicMaterial({ color: 0xff5a1a }));
  glut.rotation.x = -Math.PI / 2; glut.position.y = -8; welt.scene.add(glut);
  b.lampe(0, -4, 0, 0xff6a2a, 2.5, 50);
  b.box({ w: 70, h: 40, d: 1, x: 10, y: 0, z: -16.5, farbe: '#d8c8b0', textur: Texturen.fliesen('#e0d0b8', '#9a8a70'), wiederholung: 14 });
  b.portal({ x: 4, y: 0, z: 13, ziel: 'hub', name: 'Waschkeller', benoetigt: 0 });
  b.schild({ text: 'Herdplatten-\nVulkan', x: -10, y: 0, z: 13, b: 4, h: 1.5 });
  b.schild({ text: 'Alles heiß:\nimmer trocken', x: 2, y: 0, z: 16, b: 3.2, h: 1.2 });

  // ---- Herdplatten mit Glüh-Takt ----
  const platten = [];
  [[-10, -6], [10, -6], [-10, 6], [10, 6]].forEach(([x, z], i) => {
    const m = b.zylinder({ r: 4, h: .3, x, y: 0, z, farbe: '#444450', seg: 20 });
    m.material = material('#444450', { emissive: 0x000000 }).clone();
    const zone = b.box({ w: 7.5, h: 1.2, d: 7.5, x, y: .3, z, farbe: '#ff5a1a', fest: false, trigger: true, schaden: false, transparent: true, opacity: 0 });
    zone.visible = false;
    platten.push({ m, zone: zone.userData.kollider, i });
  });
  let takt = 0;
  welt.dinge.push({ update: dt => {
    takt += dt; const phase = Math.floor(takt / 2.4) % 4; const rest = (takt % 2.4) / 2.4;
    platten.forEach(p => { const an = p.i === phase && rest > .25; const vor = p.i === (phase + 1) % 4 && rest > .7;
      p.zone.schaden = an; p.m.material.emissive.setHex(an ? 0xff3a00 : vor ? 0x5a1a00 : 0x000000);
      if (an && Math.random() < dt * 10) welt.partikel.spawn(p.m.position.clone().add(new THREE.Vector3((Math.random() - .5) * 6, .3, (Math.random() - .5) * 6)), { anzahl: 1, farbe: [0xff8c3a, 0xffe04a], geschwindigkeit: 2, gravitation: 3, leben: .5, groesse: .1 }); });
  } });
  b.schild({ text: 'Platten glühen\nim Takt!', x: 0, y: 0, z: 10, b: 3.2, h: 1.2 });

  // ---- Topf (hohl) mit kochendem Wasser, Knödel und Dampf-Aufwind auf Platte 1 ----
  b.zylinder({ r: 4, h: .5, x: -10, y: .3, z: -6, farbe: '#9aa0b0', seg: 16 });
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2;
    b.box({ w: 2.4, h: 6, d: .7, x: -10 + Math.cos(a) * 4.1, y: .3, z: -6 + Math.sin(a) * 4.1, ry: -a + Math.PI / 2, farbe: '#9aa0b0', textur: Texturen.metall(), wiederholung: 2 }); }
  b.wasser({ w: 7, h: 4.4, d: 7, x: -10, y: .8, z: -6 });
  b.kugel({ r: 1.2, x: -10, y: 4.3, z: -6, farbe: '#f0e0c0', seg: 8 });
  b.klammer(-10, 7.4, -6, 'Knödel im Topf');
  b.wind({ w: 6, h: 16, d: 6, x: -10, y: 6.3, z: -6, kraft: [0, 27, 0], sichtbar: true });
  b.box({ w: 1.2, h: .6, d: 4, x: -15.2, y: 5.5, z: -6, farbe: '#2b2b33' });
  // Kochbuch-Stapel als Treppe zum Topfgriff
  b.box({ w: 3.5, h: 2.4, d: 4, x: -17.5, y: 0, z: 1, farbe: '#8a2a2e', textur: Texturen.holz('#8a2a2e'), wiederholung: 2 });
  b.box({ w: 3.5, h: 4.4, d: 4, x: -17.5, y: 0, z: -4, farbe: '#2a5a8a', textur: Texturen.holz('#2a5a8a'), wiederholung: 2 });
  b.schild({ text: 'KOCHEN\nFÜR SOCKEN', x: -15.7, y: 1, z: 1, ry: Math.PI / 2, b: 3, h: 1.2, pfosten: false });
  b.schild({ text: 'Dampf trägt\ntrockene Socken', x: -10, y: 6.5, z: -1.2, b: 3.4, h: 1.2, pfosten: false });
  b.fussel(-17.5, 2.9, 1); b.fussel(-17.5, 4.9, -4); b.fussel(-15.2, 6.6, -6);
  // Pfanne auf Platte 4 mit heißem Öl und Stiel als Brücke
  b.zylinder({ r: 4.2, h: 1.6, x: 10, y: .3, z: 6, farbe: '#3a3a44', seg: 16 });
  b.box({ w: 6, h: .4, d: 6, x: 10, y: 1.9, z: 6, farbe: '#ffb030', schaden: true, emissive: 0x663300 });
  b.box({ w: 14, h: .8, d: 1.4, x: 19, y: 1.5, z: 6, farbe: '#2b2b33' });
  b.klammer(25.5, 2.9, 6, 'Pfannenstiel');
  b.fusselLinie([14, 2.8, 6], [23, 2.8, 6], 4);
  b.gegner('flamme', { x: 0, y: .3, z: -2, punkte: [[0, .3, -2], [-5, .3, 5], [5, .3, 5]] });
  b.gegner('flamme', { x: 16, y: .3, z: -8, punkte: [[16, .3, -8], [16, .3, -2], [4, .3, -2]] });
  b.gegner('flamme', { x: -4, y: .3, z: -12, punkte: [[-4, .3, -12], [6, .3, -12], [6, .3, -9]] });

  // ---- Toaster (hinten links) → Gewürzregal ----
  b.box({ w: 6, h: 4, d: 3.4, x: -18, y: 0, z: -10, farbe: '#c0c8d0', textur: Texturen.metall(), wiederholung: 2 });
  b.box({ w: .4, h: 1.2, d: .4, x: -21.3, y: 2, z: -10, farbe: '#2b2b33', kollision: false });
  for (const dz of [-.8, .8]) b.box({ w: 4.4, h: .5, d: .9, x: -18, y: 3.6, z: -10 + dz, farbe: '#111', sprung: 25 });
  b.schild({ text: 'TOASTER\n(Sprungkraft)', x: -18, y: 4, z: -7.8, b: 3.2, h: 1.2, pfosten: false });
  b.socke(-18, 0, -13.8, { name: paare[1][1], partner: paare[1][0], farbe: paare[1][2] });
  b.checkpoint(-14, 0, -8);
  b.fusselLinie([-8, .5, 12], [-16, .5, -4], 5);
  // Gewürzregal an der Rückwand
  b.box({ w: 16, h: .5, d: 3.5, x: -16, y: 12, z: -14.2, farbe: '#7a5230', textur: Texturen.holz('#7a5230'), wiederholung: 3 });
  ['#e8474c', '#3aa84a', '#ffd25a', '#8a4a2a', '#f0f0f0'].forEach((f, i) => { b.zylinder({ r: .9, h: 2.4 + (i % 2) * .6, x: -22 + i * 3.2, y: 12.5, z: -14.8, farbe: f, seg: 8 });
    b.zylinder({ r: .95, h: .4, x: -22 + i * 3.2, y: 14.9 + (i % 2) * .6, z: -14.8, farbe: '#2b2b33', seg: 8, kollision: false }); });
  b.schild({ text: 'Gewürze', x: -16, y: 12.5, z: -12.3, b: 3, h: .9, pfosten: false });
  b.klammer(-12.4, 15.6, -14.8, 'Gewürzglas');
  b.socke(-20, 12.5, -12.8, { name: paare[2][1], partner: paare[2][0], farbe: paare[2][2] });
  b.checkpoint(-16, 12.5, -12.6);
  b.fusselLinie([-22, 13, -12.8], [-10, 13, -12.8], 4);
  b.haken(-10, 16, -8); b.haken(-6, 21, -6);

  // ---- Dunstabzugshaube ----
  b.box({ w: 24, h: 2, d: 12, x: 0, y: 18, z: -4, farbe: '#b8bec9', textur: Texturen.metall(), wiederholung: 6 });
  b.box({ w: 6, h: 20, d: 6, x: 0, y: 20, z: -12, farbe: '#b8bec9', textur: Texturen.metall(), wiederholung: 4 });
  b.klammer(8, 20.8, -4, 'Dunstabzug');
  b.socke(-8, 20, -2, { name: paare[0][1], partner: paare[0][0], farbe: paare[0][2] });
  b.gegner('flamme', { x: 0, y: 20, z: 0, punkte: [[0, 20, 0], [-9, 20, -7], [9, 20, -7]] });
  b.fusselKreis(0, 20.6, -4, 4, 6);
  b.checkpoint(10, 20, 0);
  // Wasserkocher mit zweitem Dampf → Oberschrank
  b.zylinder({ r: 2.4, h: 7, x: 24, y: 0, z: -11, farbe: '#e8e8f0', seg: 12 });
  b.box({ w: 1, h: 3, d: .6, x: 27.2, y: 2, z: -11, farbe: '#2b2b33', kollision: false });
  b.wind({ w: 5, h: 24, d: 5, x: 24, y: 7, z: -11, kraft: [0, 27, 0], sichtbar: true });
  b.box({ w: 14, h: 8, d: 7, x: 30, y: 24, z: -13, farbe: '#d8c8b0', textur: Texturen.holz('#d8c8b0'), wiederholung: 3 });
  b.klammer(30, 32.6, -13, 'Oberschrank');
  b.fusselLinie([26, 32.6, -10], [34, 32.6, -10], 3);
  // Arbeitsplatte: Schneidebrett, Salzstreuer, Wurst Werner
  b.box({ w: 8, h: 1, d: 6, x: 32, y: 0, z: 4, farbe: '#c8a060', textur: Texturen.holz('#c8a060'), wiederholung: 2 });
  b.knopf(32, 1.4, 4, 3);
  b.zylinder({ r: 1.2, h: 4, x: 38, y: 0, z: -4, farbe: '#f4f4f8', seg: 10 });
  b.zylinder({ r: 1.3, h: .5, x: 38, y: 4, z: -4, farbe: '#c0c8d0', seg: 10 });
  b.klammer(38, 5.2, -4, 'Salzstreuer');
  b.npc({ art: 'wurst', name: 'Wurst Werner', x: 30, y: 0, z: 10, ry: -.4, handFarbe: '#b5603a', belohnung: 'klammer',
    dialog: ['Psst. Nicht so laut. Die Pfanne hört alles.', 'Ich bin eine Bratwurst. Ich habe genau EIN Lebensziel, und das ist: nicht in die Pfanne.', 'Du riechst nach Keller. Das ist gut. Keller ist nicht Pfanne.', 'Hier, eine Klammer. Ich hab sie in einer Ritze gefunden. Frag nicht, wie.'],
    dialogDanach: ['Wenn jemand fragt: Du hast mich nie gesehen. Ich bin eine Gurke.'] });
  b.checkpoint(28, 0, 2);
  b.fusselLinie([24, .5, 10], [40, .5, 10], 5);
  b.fusselKreis(38, .5, -4, 2.4, 5);
  b.box({ w: 1.4, h: .4, d: 10, x: 22, y: 0, z: -4, ry: .5, farbe: '#c8a060' });
}
