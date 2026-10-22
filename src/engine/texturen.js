import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';

// Kleine, pixelige Texturen aus Canvas — nichts wird geladen.
const cache = new Map();
function canvasTextur(name, groesse, maler) {
  if (cache.has(name)) return cache.get(name);
  const c = document.createElement('canvas'); c.width = c.height = groesse;
  const g = c.getContext('2d'); maler(g, groesse);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  cache.set(name, t); return t;
}
function zufall(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

export const Texturen = {
  karo(a = '#ffffff', b = '#d8d8d8') {
    return canvasTextur('karo' + a + b, 16, (g, n) => { g.fillStyle = a; g.fillRect(0, 0, n, n); g.fillStyle = b;
      g.fillRect(0, 0, n / 2, n / 2); g.fillRect(n / 2, n / 2, n / 2, n / 2); });
  },
  fliesen(a = '#f0f4ff', fuge = '#9aa6c0') {
    return canvasTextur('fliesen' + a + fuge, 32, (g, n) => { g.fillStyle = fuge; g.fillRect(0, 0, n, n); g.fillStyle = a; g.fillRect(1, 1, n - 2, n - 2); });
  },
  rauschen(a = '#ffffff', staerke = .12, seed = 7) {
    return canvasTextur('rausch' + a + staerke + seed, 16, (g, n) => {
      const z = zufall(seed); const basis = new THREE.Color(a);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const k = 1 + (z() - .5) * 2 * staerke; const c = basis.clone().multiplyScalar(k);
        g.fillStyle = '#' + c.getHexString(); g.fillRect(x, y, 1, 1);
      }
    });
  },
  holz(a = '#b4783c') {
    return canvasTextur('holz' + a, 32, (g, n) => {
      const basis = new THREE.Color(a); const z = zufall(3);
      for (let y = 0; y < n; y++) { const k = .85 + .3 * Math.abs(Math.sin(y * .9 + z())); const c = basis.clone().multiplyScalar(k);
        g.fillStyle = '#' + c.getHexString(); g.fillRect(0, y, n, 1); }
    });
  },
  streifen(a = '#e8474c', b = '#fff6e5', breite = 4) {
    return canvasTextur('streifen' + a + b + breite, 16, (g, n) => { g.fillStyle = a; g.fillRect(0, 0, n, n); g.fillStyle = b;
      for (let y = 0; y < n; y += breite * 2) g.fillRect(0, y, n, breite); });
  },
  gras() {
    return canvasTextur('gras', 16, (g, n) => { const z = zufall(11); g.fillStyle = '#5fae4a'; g.fillRect(0, 0, n, n);
      for (let i = 0; i < 40; i++) { g.fillStyle = z() > .5 ? '#4e9a3c' : '#78c45c'; g.fillRect(Math.floor(z() * n), Math.floor(z() * n), 1, 2); } });
  },
  teppich(a = '#6b4a7a') {
    return canvasTextur('teppich' + a, 16, (g, n) => { const z = zufall(5); const basis = new THREE.Color(a);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const c = basis.clone().multiplyScalar(.8 + z() * .4);
        g.fillStyle = '#' + c.getHexString(); g.fillRect(x, y, 1, 1); } });
  },
  metall() {
    return canvasTextur('metall', 16, (g, n) => { g.fillStyle = '#b8bec9'; g.fillRect(0, 0, n, n); g.fillStyle = '#d7dce4';
      for (let y = 0; y < n; y += 4) g.fillRect(0, y, n, 1); g.fillStyle = '#8f96a3'; for (let y = 2; y < n; y += 4) g.fillRect(0, y, n, 1); });
  },
  lego(a) {
    return canvasTextur('lego' + a, 16, (g, n) => { g.fillStyle = a; g.fillRect(0, 0, n, n);
      const c = new THREE.Color(a).multiplyScalar(1.25); g.fillStyle = '#' + c.getHexString(); g.beginPath(); g.arc(n / 2, n / 2, 4, 0, 7); g.fill();
      const d = new THREE.Color(a).multiplyScalar(.75); g.fillStyle = '#' + d.getHexString(); g.beginPath(); g.arc(n / 2 + 1, n / 2 + 1, 4, 0, Math.PI); g.fill(); });
  },
  // Text auf Schild
  text(text, { farbe = '#2a1a2e', hintergrund = '#f6e7c3', breite = 256, hoehe = 96 } = {}) {
    return canvasTextur('text' + text + farbe + hintergrund + breite, breite, (g, n) => {
      const c = g.canvas; c.width = breite; c.height = hoehe;
      g.fillStyle = hintergrund; g.fillRect(0, 0, breite, hoehe);
      g.strokeStyle = farbe; g.lineWidth = 4; g.strokeRect(3, 3, breite - 6, hoehe - 6);
      const zeilen = text.split('\n');
      // Schriftgröße so wählen, dass die längste Zeile hineinpasst
      let groesse = Math.min(22, Math.floor((hoehe - 16) / zeilen.length / 1.5));
      g.font = `bold ${groesse}px "Press Start 2P", monospace`;
      const maxBreite = Math.max(...zeilen.map(z => g.measureText(z).width));
      if (maxBreite > breite - 20) groesse = Math.max(8, Math.floor(groesse * (breite - 20) / maxBreite));
      g.font = `bold ${groesse}px "Press Start 2P", monospace`;
      g.fillStyle = farbe; g.textAlign = 'center'; g.textBaseline = 'middle';
      zeilen.forEach((z, i) => g.fillText(z, breite / 2, hoehe / 2 + (i - (zeilen.length - 1) / 2) * (groesse * 1.5)));
    });
  },
  sprechblase(text) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
    g.fillStyle = '#fff6e5'; g.beginPath(); g.roundRect(4, 4, 248, 48, 10); g.fill();
    g.fillStyle = '#2a1a2e'; g.font = '13px "Press Start 2P", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 128, 28);
    g.beginPath(); g.moveTo(118, 52); g.lineTo(138, 52); g.lineTo(128, 62); g.fillStyle = '#fff6e5'; g.fill();
    const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; return t;
  },
};

// Materialien: Lambert, flach, mit Vertexfarben als "gebackene" Schattierung.
const matCache = new Map();
export function material(farbe = '#ffffff', { textur = null, emissive = 0x000000, transparent = false, opacity = 1, wiederholung = 1, seite = THREE.FrontSide, vertexColors = true } = {}) {
  const key = [farbe, textur ? textur.uuid : '-', emissive, transparent, opacity, wiederholung, seite, vertexColors].join('|');
  if (matCache.has(key)) return matCache.get(key);
  let map = null;
  if (textur) { map = textur.clone(); map.needsUpdate = true; map.repeat.set(wiederholung, wiederholung); }
  const m = new THREE.MeshLambertMaterial({ color: vertexColors ? 0xffffff : farbe, map, emissive, transparent, opacity, side: seite, vertexColors });
  matCache.set(key, m); return m;
}

// Vertexfarben: Grundfarbe, oben heller, unten dunkler, leichte Flächenvariation.
export function faerbe(geometrie, farbe, { variation = .06, verlauf = .25 } = {}) {
  const basis = new THREE.Color(farbe);
  const pos = geometrie.attributes.position; const n = pos.count;
  geometrie.computeBoundingBox();
  const bb = geometrie.boundingBox; const h = Math.max(1e-6, bb.max.y - bb.min.y);
  const farben = new Float32Array(n * 3);
  const normal = geometrie.attributes.normal;
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const t = (pos.getY(i) - bb.min.y) / h;
    let k = 1 - verlauf / 2 + verlauf * t;
    if (normal) { const ny = normal.getY(i); k *= .92 + .12 * Math.max(0, ny); }
    k += (Math.sin(i * 12.9898) * 43758.5453 % 1) * variation - variation / 2;
    c.copy(basis).multiplyScalar(k);
    farben[i * 3] = c.r; farben[i * 3 + 1] = c.g; farben[i * 3 + 2] = c.b;
  }
  geometrie.setAttribute('color', new THREE.BufferAttribute(farben, 3));
  return geometrie;
}
