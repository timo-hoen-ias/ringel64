import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';
import { Texturen, material, faerbe } from '../engine/texturen.js';

// Outfits: freischaltbar über Knöpfe. Index 0 ist immer verfügbar.
export const OUTFITS = [
  { name: 'Ringelsocke', farbe: '#e8474c', streifen: '#fff6e5', breite: 4 },
  { name: 'Tennissocke', farbe: '#f4f4f4', streifen: '#3b6fd8', breite: 2, zubehoer: 'schweissband' },
  { name: 'Weihnachtssocke', farbe: '#c8343a', streifen: '#3a9a4a', breite: 4, zubehoer: 'bommel' },
  { name: 'Sandalen-Socke', farbe: '#e9e2d0', streifen: '#c8c0ac', breite: 8, zubehoer: 'sandale' },
  { name: 'Zehensocke', farbe: '#f5d44a', streifen: '#f5d44a', breite: 8, zubehoer: 'zehen' },
  { name: 'Business-Socke', farbe: '#2b2b35', streifen: '#444455', breite: 1, zubehoer: 'krawatte' },
  { name: 'Regenbogensocke', farbe: '#ff6b6b', streifen: 'regenbogen', breite: 2 },
  { name: 'Glückssocke', farbe: '#f0c040', streifen: '#fff2b0', breite: 3, zubehoer: 'kleeblatt' },
];

function regenbogenTextur() {
  const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d');
  const f = ['#ff4d4d', '#ff9a3c', '#ffe94d', '#5bd65b', '#4da3ff', '#9b5bff'];
  for (let y = 0; y < 16; y++) { g.fillStyle = f[Math.floor(y / 16 * 6)]; g.fillRect(0, y, 16, 1); }
  const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Baut eine Socke mit Ferse, Bein, Bund, Knopfaugen und Zehenloch. Rückgabe: Gruppe + Teile.
// Die Zehe zeigt nach +Z.
export function baueSocke({ outfit = OUTFITS[0], groesse = 1, augen = true, loch = true, muede = false } = {}) {
  const g = new THREE.Group();
  const tex = outfit.streifen === 'regenbogen' ? regenbogenTextur() : Texturen.streifen(outfit.farbe, outfit.streifen, outfit.breite);
  const matBein = material(outfit.farbe, { textur: tex, wiederholung: 2 });
  const matGlatt = material(outfit.farbe);

  const bein = new THREE.Group(); bein.position.set(0, .3, -.1); g.add(bein);
  const beinMesh = new THREE.Mesh(faerbe(new THREE.CylinderGeometry(.3, .33, .85, 18), outfit.farbe), matBein);
  beinMesh.position.y = .42; bein.add(beinMesh);
  const bund = new THREE.Mesh(faerbe(new THREE.CylinderGeometry(.34, .34, .16, 18), outfit.farbe), material(outfit.streifen === 'regenbogen' ? '#ffffff' : outfit.streifen));
  bund.position.y = .88; bein.add(bund);

  const ferse = new THREE.Mesh(faerbe(new THREE.SphereGeometry(.31, 16, 12), outfit.farbe), matGlatt);
  ferse.position.set(0, .3, -.1); g.add(ferse);
  const fuss = new THREE.Mesh(faerbe(new THREE.BoxGeometry(.5, .36, .7), outfit.farbe), matGlatt);
  fuss.position.set(0, .2, .25); g.add(fuss);
  const zehe = new THREE.Mesh(faerbe(new THREE.SphereGeometry(.26, 16, 12), outfit.farbe), matGlatt);
  zehe.position.set(0, .2, .55); zehe.scale.set(1, .75, 1); g.add(zehe);

  if (loch) {
    const l = new THREE.Mesh(new THREE.CircleGeometry(.09, 8), new THREE.MeshBasicMaterial({ color: 0x2a1a2e }));
    l.position.set(.05, .24, .8); g.add(l);
  }
  const augenGruppe = new THREE.Group(); bein.add(augenGruppe);
  if (augen) {
    for (const s of [-1, 1]) {
      const a = new THREE.Mesh(new THREE.SphereGeometry(.075, 12, 8), new THREE.MeshBasicMaterial({ color: 0x1a1218 }));
      a.position.set(s * .13, .62, .27); augenGruppe.add(a);
      const gl = new THREE.Mesh(new THREE.SphereGeometry(.025, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      gl.position.set(s * .13 + .025, .645, .33); augenGruppe.add(gl);
      // Knopf-Fäden
      const f = new THREE.Mesh(new THREE.BoxGeometry(.04, .04, .02), new THREE.MeshBasicMaterial({ color: 0xfff6e5 }));
      f.position.set(s * .13, .62, .34); augenGruppe.add(f);
    }
    if (muede) { const lid = new THREE.Mesh(faerbe(new THREE.BoxGeometry(.4, .06, .1), outfit.farbe), matGlatt); lid.position.set(0, .66, .28); augenGruppe.add(lid); }
  }
  // Zubehör
  if (outfit.zubehoer === 'schweissband') { const sb = new THREE.Mesh(faerbe(new THREE.CylinderGeometry(.36, .36, .1, 10), '#3b6fd8'), material('#3b6fd8')); sb.position.y = .95; bein.add(sb); }
  if (outfit.zubehoer === 'bommel') { const b = new THREE.Mesh(faerbe(new THREE.SphereGeometry(.14, 8, 6), '#ffffff'), material('#ffffff')); b.position.set(0, 1.0, -.2); bein.add(b); }
  if (outfit.zubehoer === 'sandale') {
    const s = new THREE.Mesh(faerbe(new THREE.BoxGeometry(.6, .12, 1.0), '#8b5a2b'), material('#8b5a2b')); s.position.set(0, .06, .3); g.add(s);
    const r = new THREE.Mesh(faerbe(new THREE.BoxGeometry(.62, .08, .14), '#5a3a1b'), material('#5a3a1b')); r.position.set(0, .36, .35); g.add(r);
  }
  if (outfit.zubehoer === 'zehen') for (let i = 0; i < 5; i++) {
    const z = new THREE.Mesh(faerbe(new THREE.SphereGeometry(.08, 6, 5), outfit.farbe), matGlatt); z.position.set(-.2 + i * .1, .22, .78); g.add(z);
  }
  if (outfit.zubehoer === 'krawatte') {
    const k = new THREE.Mesh(faerbe(new THREE.BoxGeometry(.12, .45, .04), '#d33'), material('#d33')); k.position.set(0, .45, .32); bein.add(k);
  }
  if (outfit.zubehoer === 'kleeblatt') for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(faerbe(new THREE.SphereGeometry(.07, 6, 5), '#3aa84a'), material('#3aa84a'));
    const a = i / 4 * Math.PI * 2; b.position.set(Math.cos(a) * .08 + .2, 1.0 + Math.sin(a) * .08, -.15); bein.add(b);
  }
  g.scale.setScalar(groesse);
  return { gruppe: g, bein, fuss, ferse, zehe, augen: augenGruppe, beinMesh, bund };
}

// Flusi: der Fussel auf dem Kopf
export function baueFlusi() {
  const g = new THREE.Group();
  const k = new THREE.Mesh(faerbe(new THREE.DodecahedronGeometry(.17, 1), '#b9b2c2', { variation: .2 }), material('#b9b2c2'));
  g.add(k);
  for (let i = 0; i < 6; i++) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(.03, .12, .03), material('#a79fb0', { vertexColors: false }));
    const a = i / 6 * Math.PI * 2; h.position.set(Math.cos(a) * .14, .1, Math.sin(a) * .14); h.rotation.z = Math.cos(a) * .6; h.rotation.x = Math.sin(a) * .6; g.add(h);
  }
  for (const s of [-1, 1]) {
    const a = new THREE.Mesh(new THREE.SphereGeometry(.035, 6, 4), new THREE.MeshBasicMaterial({ color: 0x1a1218 }));
    a.position.set(s * .06, .03, .15); g.add(a);
  }
  return g;
}

// Generische kleine Figur für Nicht-Socken-NPCs (Zahnbürste, Käse, Teddy ...)
export function baueFigur(art) {
  const g = new THREE.Group();
  const augen = (y, z, abstand = .12, r = .06) => { for (const s of [-1, 1]) {
    const a = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), new THREE.MeshBasicMaterial({ color: 0x1a1218 })); a.position.set(s * abstand, y, z); g.add(a);
    const gl = new THREE.Mesh(new THREE.SphereGeometry(r * .35, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff })); gl.position.set(s * abstand + r * .3, y + r * .3, z + r * .7); g.add(gl); } };
  const teil = (geo, farbe, x, y, z) => { const m = new THREE.Mesh(faerbe(geo, farbe), material(farbe)); m.position.set(x, y, z); g.add(m); return m; };
  switch (art) {
    case 'schwamm': teil(new THREE.BoxGeometry(1.1, .7, .6), '#f2d35b', 0, .35, 0); teil(new THREE.BoxGeometry(1.1, .25, .6), '#3aa84a', 0, .82, 0);
      teil(new THREE.ConeGeometry(.35, .5, 8), '#2a1a2e', 0, 1.2, 0); augen(.5, .31); break;
    case 'zahnbuerste': teil(new THREE.BoxGeometry(.3, 2.2, .3), '#5fb7e8', 0, 1.1, 0); teil(new THREE.BoxGeometry(.34, .5, .5), '#ffffff', 0, 2.3, .1); augen(1.4, .16, .08, .05); break;
    case 'kaese': { const m = teil(new THREE.CylinderGeometry(.9, .9, .7, 3), '#f5c842', 0, .35, 0); m.rotation.y = Math.PI / 6;
      for (let i = 0; i < 5; i++) teil(new THREE.SphereGeometry(.12, 6, 5), '#d9a828', (Math.random() - .5) * .8, .3 + Math.random() * .4, (Math.random() - .5) * .8);
      teil(new THREE.BoxGeometry(.6, .4, .1), '#dddddd', 0, .15, .55); augen(.5, .55, .15); break; }
    case 'magnetNpc': teil(new THREE.TorusGeometry(.5, .18, 6, 10, Math.PI), '#aa2222', 0, .5, 0).rotation.z = Math.PI; break;
    case 'teddy': { teil(new THREE.SphereGeometry(1.3, 12, 10), '#b87a45', 0, 1.3, 0); teil(new THREE.SphereGeometry(.9, 12, 10), '#b87a45', 0, 2.9, 0);
      teil(new THREE.SphereGeometry(.35, 8, 6), '#b87a45', -.7, 3.5, 0); teil(new THREE.SphereGeometry(.35, 8, 6), '#b87a45', .7, 3.5, 0);
      teil(new THREE.SphereGeometry(.4, 8, 6), '#e6c39a', 0, 2.65, .75); teil(new THREE.SphereGeometry(.14, 6, 5), '#2a1a2e', 0, 2.8, 1.1);
      teil(new THREE.SphereGeometry(.5, 8, 6), '#b87a45', -1.4, 1.4, .4); teil(new THREE.SphereGeometry(.5, 8, 6), '#b87a45', 1.4, 1.4, .4);
      teil(new THREE.SphereGeometry(.55, 8, 6), '#b87a45', -.7, .5, .6); teil(new THREE.SphereGeometry(.55, 8, 6), '#b87a45', .7, .5, .6);
      augen(3.1, .78, .3, .1); break; }
    case 'pantoffel': { teil(new THREE.BoxGeometry(1.2, .4, 2.2), '#8b4f6b', 0, .2, 0); teil(new THREE.SphereGeometry(.6, 10, 8), '#a36584', 0, .5, .5).scale.set(1, .7, 1);
      augen(.9, .9, .2, .08); break; }
    case 'fernbedienung': teil(new THREE.BoxGeometry(.9, .3, 2.6), '#2b2b35', 0, .15, 0);
      for (let i = 0; i < 9; i++) teil(new THREE.CylinderGeometry(.1, .1, .1, 6), ['#e8474c', '#5fb7e8', '#ffd25a'][i % 3], -.25 + (i % 3) * .25, .33, -.8 + Math.floor(i / 3) * .5);
      break;
    case 'gartenzwerg': teil(new THREE.CylinderGeometry(.4, .5, 1, 8), '#3b6fd8', 0, .5, 0); teil(new THREE.SphereGeometry(.38, 8, 6), '#f0c9a8', 0, 1.25, 0);
      teil(new THREE.ConeGeometry(.35, .9, 8), '#e8474c', 0, 1.9, 0); teil(new THREE.SphereGeometry(.3, 8, 6), '#ffffff', 0, 1.0, .25).scale.set(1, .6, .6); augen(1.3, .33, .12, .05); break;
    case 'gummiente': teil(new THREE.SphereGeometry(.5, 10, 8), '#ffd400', 0, .45, 0).scale.set(1.1, .8, 1.3);
      teil(new THREE.SphereGeometry(.32, 10, 8), '#ffd400', 0, .95, .35); teil(new THREE.BoxGeometry(.25, .12, .3), '#ff8a00', 0, .9, .7); augen(1.05, .55, .13, .05); break;
    case 'baron': { // Trockner-Gesicht: nur Augenbrauen und Mund, wird an der Wand platziert
      teil(new THREE.BoxGeometry(1.6, .3, .2), '#2a1a2e', -1.2, 1.1, 0).rotation.z = -.3; teil(new THREE.BoxGeometry(1.6, .3, .2), '#2a1a2e', 1.2, 1.1, 0).rotation.z = .3;
      teil(new THREE.TorusGeometry(1.2, .18, 6, 12, Math.PI), '#2a1a2e', 0, -1.2, 0); augen(.3, .1, 1.2, .35); break; }
    case 'wurst': { const w = teil(new THREE.CapsuleGeometry(.45, 1.8, 4, 8), '#b5603a', 0, .5, 0); w.rotation.x = Math.PI / 2;
      teil(new THREE.BoxGeometry(.5, .08, .9), '#f5d44a', 0, .98, 0); augen(.75, 1.2, .18, .07); break; }
    case 'roboter': teil(new THREE.BoxGeometry(1.2, 1.4, .8), '#8fa3b8', 0, .9, 0); teil(new THREE.BoxGeometry(.9, .8, .8), '#a8bccc', 0, 2.0, 0);
      teil(new THREE.CylinderGeometry(.06, .06, .6, 5), '#555', 0, 2.6, 0); teil(new THREE.SphereGeometry(.12, 6, 5), '#e8474c', 0, 2.95, 0);
      teil(new THREE.BoxGeometry(.3, 1, .3), '#8fa3b8', -.8, .9, 0); teil(new THREE.BoxGeometry(.3, 1, .3), '#8fa3b8', .8, .9, 0);
      teil(new THREE.BoxGeometry(.4, .3, .5), '#555', -.3, .15, 0); teil(new THREE.BoxGeometry(.4, .3, .5), '#555', .3, .15, 0); augen(2.1, .42, .22, .09); break;
    case 'heizung': teil(new THREE.BoxGeometry(2.4, 1.6, .5), '#e8e8e8', 0, .8, 0);
      for (let i = 0; i < 6; i++) teil(new THREE.BoxGeometry(.25, 1.4, .55), '#d0d0d0', -1 + i * .4, .8, 0); augen(1.0, .3, .3, .08); break;
  }
  return g;
}
