import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';
import { Texturen, material, faerbe } from '../engine/texturen.js';
import { PAARE } from './daten.js';

export const info = {
  name: 'Staubwüste', musik: 'bett', himmel: '#120c18', tipp: 'Unterm Bett ist es dunkel. Nimm die Taschenlampe. Staubmäuse verbinden sich zu größeren Klumpen – trenne sie, bevor sie husten.',
  nebel: { farbe: '#120c18', nah: 3, fern: 13 }, licht: { himmel: 0x8a7aa8, boden: 0x1a1020, intensitaet: .35, sonne: 0x9a8ab8, sonneIntensitaet: .25, richtung: [2, 10, 2] },
  todesHoehe: -6, spawn: [-30, 0, 22], spawnYaw: Math.PI, kamera: { dist: 7 },
};

export function baue(welt, b) {
  const paare = PAARE.bett;
  const st = welt.spiel.spielstand;
  const teppich = Texturen.teppich('#4a3a5a');
  // Teppich mit Fußbodenritze bei x 10..13
  b.box({ w: 50, h: 1, d: 60, x: -15, y: -1, z: 0, farbe: '#4a3a5a', textur: teppich, wiederholung: 16 });
  b.box({ w: 27, h: 1, d: 60, x: 26.5, y: -1, z: 0, farbe: '#4a3a5a', textur: teppich, wiederholung: 10 });
  b.box({ w: 3, h: 6, d: 60, x: 11.5, y: -7, z: 0, farbe: '#0a060c', kollision: false });
  // Bett: Lattenrost, Matratze (Decke), Pfosten
  for (let z = -12; z <= 12; z += 3.4) b.box({ w: 44, h: .4, d: 2.4, x: 0, y: 6, z, farbe: '#9a8a7a', textur: Texturen.holz('#9a8a7a'), wiederholung: 6 });
  b.box({ w: 48, h: 3, d: 36, x: 0, y: 8.5, z: 0, farbe: '#2a2030', kollision: false });
  b.box({ w: 48, h: .3, d: 36, x: 0, y: 8.5, z: 0, farbe: '#3a3040', kollision: false, textur: Texturen.karo('#3a3040', '#352b3a'), wiederholung: 8 });
  for (const [x, z] of [[-30, -20], [30, -20], [-30, 20], [30, 20]]) b.zylinder({ r: 1.8, h: 8.5, x, y: 0, z, farbe: '#5a3a2a', textur: Texturen.holz('#5a3a2a'), wiederholung: 3, seg: 10 });
  b.portal({ x: -24, y: 0, z: 26, ziel: 'hub', name: 'Waschkeller', benoetigt: 0 });
  b.schild({ text: 'Staubwüste\n(unterm Bett)', x: -34, y: 0, z: 25, b: 4, h: 1.5 });
  b.lampe(-30, 2, 24, 0xffd9a0, .8, 10);

  // ---- Taschenlampe ----
  const lampeHolen = (leise = false) => {
    const sp = welt.spieler;
    const spot = new THREE.SpotLight(0xfff2c0, 4, 30, .55, .5, .8); spot.position.set(0, 1.2, .3);
    const ziel = new THREE.Object3D(); ziel.position.set(0, 0, 8); sp.gruppe.add(ziel); spot.target = ziel; sp.gruppe.add(spot);
    const punkt = new THREE.PointLight(0xfff2c0, .7, 8); punkt.position.set(0, 1, 0); sp.gruppe.add(punkt);
    const lampe = new THREE.Mesh(faerbe(new THREE.CylinderGeometry(.12, .16, .6, 8), '#c0c8d0'), material('#c0c8d0')); lampe.rotation.x = Math.PI / 2; lampe.position.set(.3, .9, .3); sp.modell.bein.add(lampe);
    welt.scene.fog.near = 8; welt.scene.fog.far = 30;
    if (!leise) { welt.spiel.audio.sfx('schalter'); welt.spiel.hud.popup('Taschenlampe! Es werde Licht.'); }
    st.flag('bett-lampe', true);
  };
  if (st.flag('bett-lampe')) lampeHolen(true);
  else {
    const m = b.zylinder({ r: .35, h: 2.2, x: -27, y: .35, z: 20, farbe: '#c0c8d0', mitte: true, kollision: false }); m.rotation.z = Math.PI / 2;
    b.kugel({ r: .45, x: -25.8, y: .35, z: 20, farbe: '#fff2c0', kollision: false, mitte: true, emissive: 0x665522 });
    const stelle = welt.benutzbarStelle({ x: -27, y: 0, z: 20, radius: 2.4, text: 'E / Y: Taschenlampe nehmen', aktiv: () => !st.flag('bett-lampe'),
      beiBenutzen: () => { welt.scene.remove(m); lampeHolen(); stelle.aktiv = () => false; } });
  }
  b.schild({ text: 'Dunkel hier.\nLampe nehmen!', x: -27, y: 0, z: 17, b: 3.2, h: 1.2 });

  // ---- Staubdünen ----
  for (const [x, y, z, r] of [[-15, -5, -8, 7], [0, -6, 10, 9], [-5, -4.5, -24, 6], [25, -4, -15, 6], [30, -5, 12, 8], [36, -5, 26, 7]])
    b.kugel({ r, x, y, z, farbe: '#5a5068', mitte: true, textur: Texturen.rauschen('#5a5068', .2, 9), wiederholung: 4, seg: 14 });
  // Fernbedienung (verschollen seit drei Jahren)
  b.npc({ art: 'fernbedienung', name: 'Die verschollene Fernbedienung', x: -12, y: 0, z: 4, ry: .6, naseZu: false, kopfHoehe: .6, wippen: false, belohnung: 'klammer',
    dialog: [{ name: 'Flusi', text: 'DAS IST SIE. Die Fernbedienung! Seit drei Jahren gesucht!' }, { name: 'Flusi', text: 'Die Familie hat deswegen zweimal den Fernseher gewechselt. Und sie lag HIER.' },
      { name: 'Fernbedienung', text: '...' }, { name: 'Flusi', text: 'Sie redet nicht. Aber sie hat eine Klammer zwischen den Tasten. Nimm sie.' }],
    dialogDanach: [{ name: 'Flusi', text: 'Die Batterien sind übrigens leer. Natürlich.' }] });
  b.checkpoint(-12, 0, 8);
  b.fusselKreis(-12, .5, 4, 3, 6);
  // Bettfeder → Lattenrost
  b.zylinder({ r: 1.4, h: 1.6, x: -5, y: 0, z: -12, farbe: '#9a9aa8', textur: Texturen.metall(), wiederholung: 2, seg: 10, kollision: false });
  b.sprungfeld({ w: 2.6, h: .4, d: 2.6, x: -5, y: 1.6, z: -12, staerke: 21, farbe: '#c0c8d0' });
  b.box({ w: 2.8, h: 1.6, d: 2.8, x: -5, y: 0, z: -12, farbe: '#9a9aa8' });
  b.schild({ text: 'Bettfeder:\nhoch zum\nLattenrost', x: -8.5, y: 0, z: -10, b: 3, h: 1.5 });
  b.klammer(0, 7.0, 0, 'Lattenrost');
  b.socke(20, 6.4, -5.2, { name: paare[0][1], partner: paare[0][0], farbe: paare[0][2] });
  b.fusselLinie([-4, 7, -1.8], [16, 7, -1.8], 6);
  // Haargummi mit Klammer in der Mitte, bewacht
  const gummi = new THREE.Mesh(faerbe(new THREE.TorusGeometry(3, .5, 8, 20), '#8a3a5a'), material('#8a3a5a'));
  gummi.rotation.x = Math.PI / 2; gummi.position.set(-28, .5, -10); welt.scene.add(gummi);
  b.klammer(-28, .8, -10, 'Haargummi');
  for (let i = 0; i < 3; i++) b.gegner('staubmaus', { x: -28 + Math.cos(i * 2.1) * 5, y: 0, z: -10 + Math.sin(i * 2.1) * 5, gebiet: [-36, -18, -20, -2] });
  // Lego-Stein in der dunkelsten Ecke
  b.box({ w: 3, h: 1.2, d: 3, x: -36, y: 0, z: -26, farbe: '#3b6fd8' });
  for (const [dx, dz] of [[-.75, -.75], [.75, -.75], [-.75, .75], [.75, .75]]) b.zylinder({ r: .45, h: .3, x: -36 + dx, y: 1.2, z: -26 + dz, farbe: '#3b6fd8', seg: 8, kollision: false });
  b.klammer(-36, 1.9, -26, 'Dunkle Ecke');
  b.gegner('staubmaus', { x: -32, y: 0, z: -22, gebiet: [-38, -28, -26, -14] });
  b.gegner('staubmaus', { x: -30, y: 0, z: -26, gebiet: [-38, -28, -26, -14] });
  // Chipstüte mit Krümeln, Haken darüber
  b.box({ w: 5, h: 7, d: 2.2, x: -24, y: 0, z: -22, farbe: '#e8a030', rz: .2, textur: Texturen.rauschen('#e8a030', .12), wiederholung: 3 });
  b.schild({ text: 'KNUSPER\nCHIPS', x: -24.6, y: 2.5, z: -20.8, b: 3, h: 1.4, pfosten: false });
  for (let i = 0; i < 8; i++) b.box({ w: .6, h: .25, d: .6, x: -20 + Math.cos(i * 1.3) * 3, y: 0, z: -18 + Math.sin(i * 1.3) * 3, farbe: '#f0c060', kollision: false, ry: i });
  b.socke(-19, 0, -16, { name: paare[2][1], partner: paare[2][0], farbe: paare[2][2] });
  b.haken(-21, 6.5, -19);
  b.klammer(-24.7, 7.6, -22, 'Chipstüte');
  b.gegner('staubmaus', { x: -18, y: 0, z: -20, gebiet: [-26, -28, -12, -12] });

  // ---- Lineal-Brücke über die Ritze ----
  b.box({ w: 9, h: .3, d: 1.6, x: 11.5, y: 0, z: -20, farbe: '#f5d44a', textur: Texturen.streifen('#f5d44a', '#2a1a2e', 1), wiederholung: 4 });
  b.schild({ text: 'Ritze! Nicht\nreinfallen.', x: 6, y: 0, z: -17, b: 3, h: 1.2 });
  b.checkpoint(5, 0, -22);
  b.fusselLinie([8, .5, -20], [15, .5, -20], 4);
  // Kugelschreiber als zweite, wackelige Brücke
  const stift = b.zylinder({ r: .45, h: 10, x: 11.5, y: .45, z: 16, farbe: '#3b6fd8', mitte: true, seg: 8 }); stift.rotation.z = Math.PI / 2; stift.userData.kollider.aktualisiere();
  b.kegel({ r: .45, h: 1.2, x: 17, y: .45, z: 16, farbe: '#c0c8d0', mitte: true, kollision: false }).rotation.z = -Math.PI / 2;

  // ---- Jenseits der Ritze ----
  b.checkpoint(20, 0, 0);
  b.npc({ art: 'pantoffel', name: 'Pantoffel Paul', x: 22, y: 0, z: -4, ry: -.8, handFarbe: '#a36584', kopfHoehe: 1.2, belohnung: 'klammer',
    dialog: ['Oh. Besuch. Hier kommt sonst nur Staub.', 'Ich war mal der Linke. Der Rechte steht noch oben vor dem Bett. Man hat mich hierher getreten. Aus Versehen. Sagt man.', 'Du suchst Socken? Ich suche einen Fuß. Wir alle suchen irgendwas.', 'Nimm die Klammer. Sie lag in meiner Sohle. Ich brauche sie nicht. Ich brauche einen Fuß.'],
    dialogDanach: ['Wenn du den Rechten siehst: Ich bin nicht böse. Ich bin nur ... unten.'] });
  b.klammer(30, 3.4, 12, 'Große Düne');
  b.knopf(25, 2.3, -15, 5);
  b.socke(37, 0, 18, { name: paare[1][1], partner: paare[1][0], farbe: paare[1][2] });
  b.fusselKreis(30, 3.2, 12, 4, 6);
  b.fusselLinie([16, .5, -10], [34, .5, -2], 5);
  for (let i = 0; i < 3; i++) b.gegner('staubmaus', { x: 20 + i * 6, y: 0, z: 4 + i * 4, gebiet: [14, -12, 38, 24] });
  // Münzstapel
  for (let i = 0; i < 4; i++) b.zylinder({ r: 2.2, h: .4, x: 20, y: i * .4, z: 20, farbe: '#d8b84a', seg: 14 });
  b.fussel(20, 2, 20);
  // Umherfliegender Staub
  let staub = 0; welt.dinge.push({ update: dt => { staub += dt; if (staub > .15) { staub = 0; const p = welt.spieler.pos.clone().add(new THREE.Vector3((Math.random() - .5) * 14, Math.random() * 5, (Math.random() - .5) * 14));
    welt.partikel.spawn(p, { anzahl: 1, farbe: 0x8a8098, geschwindigkeit: .2, leben: 2.5, gravitation: -.2, groesse: .07, schrumpf: false }); } } });
}
