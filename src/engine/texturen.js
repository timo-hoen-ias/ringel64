import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';

// Prozedurale Texturen aus Canvas — nichts wird geladen. 64 px, weich gefiltert mit Mipmaps.
const cache = new Map();
function canvasTextur(name, groesse, maler, { weich = true } = {}) {
  if (cache.has(name)) return cache.get(name);
  const c = document.createElement('canvas'); c.width = c.height = groesse;
  const g = c.getContext('2d'); maler(g, groesse);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = weich ? THREE.LinearFilter : THREE.NearestFilter;
  t.minFilter = weich ? THREE.LinearMipmapLinearFilter : THREE.NearestFilter; t.generateMipmaps = weich;
  t.anisotropy = 4;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  cache.set(name, t); return t;
}
function zufall(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
// Weiches Werte-Rauschen (bilinear interpoliert) für organische Oberflächen
function wertRauschen(n, zellen, seed) {
  const z = zufall(seed); const g = []; for (let i = 0; i <= zellen; i++) { g.push([]); for (let j = 0; j <= zellen; j++) g[i].push(z()); }
  const w = []; const k = n / zellen;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const gx = (x / k) % zellen, gy = (y / k) % zellen; const x0 = Math.floor(gx), y0 = Math.floor(gy); const fx = gx - x0, fy = gy - y0;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = g[x0][y0], b = g[x0 + 1][y0], c = g[x0][y0 + 1], d = g[x0 + 1][y0 + 1];
    w.push(a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy);
  }
  return w;
}
const hex = (c) => '#' + c.getHexString();

export const Texturen = {
  karo(a = '#ffffff', b = '#d8d8d8') {
    return canvasTextur('karo' + a + b, 64, (g, n) => { g.fillStyle = a; g.fillRect(0, 0, n, n); g.fillStyle = b;
      g.fillRect(0, 0, n / 2, n / 2); g.fillRect(n / 2, n / 2, n / 2, n / 2); });
  },
  fliesen(a = '#f0f4ff', fuge = '#9aa6c0') {
    return canvasTextur('fliesen' + a + fuge, 64, (g, n) => { g.fillStyle = fuge; g.fillRect(0, 0, n, n); g.fillStyle = a; g.fillRect(2, 2, n - 4, n - 4);
      const r = wertRauschen(n, 4, 2); const basis = new THREE.Color(a); const c = new THREE.Color();
      for (let y = 3; y < n - 3; y += 2) for (let x = 3; x < n - 3; x += 2) { c.copy(basis).multiplyScalar(.95 + r[y * n + x] * .1); g.fillStyle = hex(c); g.fillRect(x, y, 2, 2); } });
  },
  rauschen(a = '#ffffff', staerke = .12, seed = 7) {
    return canvasTextur('rausch' + a + staerke + seed, 64, (g, n) => {
      const r = wertRauschen(n, 8, seed); const basis = new THREE.Color(a); const c = new THREE.Color();
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { c.copy(basis).multiplyScalar(1 + (r[y * n + x] - .5) * 2 * staerke); g.fillStyle = hex(c); g.fillRect(x, y, 1, 1); }
    });
  },
  holz(a = '#b4783c') {
    return canvasTextur('holz' + a, 64, (g, n) => {
      const basis = new THREE.Color(a); const r = wertRauschen(n, 6, 3); const c = new THREE.Color();
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const k = .82 + .28 * Math.abs(Math.sin(y * .5 + r[y * n + x] * 4)); c.copy(basis).multiplyScalar(k); g.fillStyle = hex(c); g.fillRect(x, y, 1, 1); }
    });
  },
  streifen(a = '#e8474c', b = '#fff6e5', breite = 4) {
    return canvasTextur('streifen' + a + b + breite, 64, (g, n) => { g.fillStyle = a; g.fillRect(0, 0, n, n); g.fillStyle = b;
      const h = breite * 4; for (let y = 0; y < n; y += h * 2) g.fillRect(0, y, n, h); }, { weich: true });
  },
  gras() {
    return canvasTextur('gras', 64, (g, n) => { const r = wertRauschen(n, 6, 11); const c = new THREE.Color(); const basis = new THREE.Color('#5fae4a');
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { c.copy(basis).multiplyScalar(.85 + r[y * n + x] * .3); g.fillStyle = hex(c); g.fillRect(x, y, 1, 1); }
      const z = zufall(5); for (let i = 0; i < 160; i++) { g.fillStyle = z() > .5 ? '#4e9a3c' : '#86d068'; g.fillRect(Math.floor(z() * n), Math.floor(z() * n), 1, 3); } });
  },
  schnee() {
    return canvasTextur('schnee', 64, (g, n) => { const r = wertRauschen(n, 5, 21); const c = new THREE.Color(); const basis = new THREE.Color('#f4f8ff');
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { c.copy(basis).multiplyScalar(.9 + r[y * n + x] * .12); g.fillStyle = hex(c); g.fillRect(x, y, 1, 1); }
      const z = zufall(9); g.fillStyle = '#ffffff'; for (let i = 0; i < 60; i++) g.fillRect(Math.floor(z() * n), Math.floor(z() * n), 1, 1); });
  },
  kies() {
    return canvasTextur('kies', 64, (g, n) => { g.fillStyle = '#7c7568'; g.fillRect(0, 0, n, n); const z = zufall(17);
      for (let i = 0; i < 90; i++) { g.fillStyle = ['#a39a88', '#8a8276', '#b8ac96', '#6a6358', '#c9b89a'][i % 5]; g.beginPath(); g.arc(z() * n, z() * n, 2 + z() * 3, 0, 7); g.fill(); } });
  },
  teppich(a = '#6b4a7a') {
    return canvasTextur('teppich' + a, 64, (g, n) => { const r = wertRauschen(n, 16, 5); const basis = new THREE.Color(a); const c = new THREE.Color();
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { c.copy(basis).multiplyScalar(.8 + r[y * n + x] * .4); g.fillStyle = hex(c); g.fillRect(x, y, 1, 1); } });
  },
  metall() {
    return canvasTextur('metall', 64, (g, n) => { g.fillStyle = '#b8bec9'; g.fillRect(0, 0, n, n);
      for (let y = 0; y < n; y += 2) { g.fillStyle = y % 8 === 0 ? '#d7dce4' : y % 8 === 4 ? '#9aa1ad' : '#b8bec9'; g.fillRect(0, y, n, 1); } });
  },
  lego(a) {
    return canvasTextur('lego' + a, 64, (g, n) => { g.fillStyle = a; g.fillRect(0, 0, n, n);
      const d = new THREE.Color(a).multiplyScalar(.72); g.fillStyle = hex(d); g.beginPath(); g.arc(n / 2 + 2, n / 2 + 2, 16, 0, 7); g.fill();
      const c = new THREE.Color(a).multiplyScalar(1.2); g.fillStyle = hex(c); g.beginPath(); g.arc(n / 2, n / 2, 16, 0, 7); g.fill(); });
  },
  wasser() {
    return canvasTextur('wasser', 64, (g, n) => { const r = wertRauschen(n, 4, 31); const c = new THREE.Color(); const basis = new THREE.Color('#6fc0f0');
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { c.copy(basis).multiplyScalar(.85 + r[y * n + x] * .35); g.fillStyle = hex(c); g.fillRect(x, y, 1, 1); } });
  },
  // Text auf Schild
  text(text, { farbe = '#2a1a2e', hintergrund = '#f6e7c3', breite = 256, hoehe = 96 } = {}) {
    return canvasTextur('text' + text + farbe + hintergrund + breite, breite, (g, n) => {
      const c = g.canvas; c.width = breite; c.height = hoehe;
      g.fillStyle = hintergrund; g.fillRect(0, 0, breite, hoehe);
      g.strokeStyle = farbe; g.lineWidth = 4; g.strokeRect(3, 3, breite - 6, hoehe - 6);
      const zeilen = text.split('\n');
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
    const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.LinearFilter; t.colorSpace = THREE.SRGBColorSpace; return t;
  },
};

// Materialien: Lambert (matt) oder Phong (glanz > 0) mit Vertexfarben als "gebackene" Schattierung.
const matCache = new Map();
export function material(farbe = '#ffffff', { textur = null, emissive = 0x000000, transparent = false, opacity = 1, wiederholung = 1, seite = THREE.FrontSide, vertexColors = true, glanz = 0 } = {}) {
  const key = [farbe, textur ? textur.uuid : '-', emissive, transparent, opacity, wiederholung, seite, vertexColors, glanz].join('|');
  if (matCache.has(key)) return matCache.get(key);
  let map = null;
  if (textur) { map = textur.clone(); map.needsUpdate = true; map.repeat.set(wiederholung, wiederholung); }
  const basis = { color: vertexColors ? 0xffffff : farbe, map, emissive, transparent, opacity, side: seite, vertexColors };
  const m = glanz > 0 ? new THREE.MeshPhongMaterial({ ...basis, shininess: glanz, specular: 0x666666 }) : new THREE.MeshLambertMaterial(basis);
  matCache.set(key, m); return m;
}

// Schattenwurf für alle Meshes eines Teilbaums (außer transparente, Sprites und markierte)
export function aktiviereSchatten(obj) {
  obj.traverse(o => {
    if (!o.isMesh || o.isSprite || o.userData.keinSchatten) return;
    if (o.material && (o.material.transparent || o.material.isShaderMaterial)) return;
    if (o.castShadow === false && o.userData.schattenFest) return;
    o.castShadow = true; o.receiveShadow = true;
  });
}

// Vertexfarben: Grundfarbe, oben heller, unten dunkler, leichte Flächenvariation.
export function faerbe(geometrie, farbe, { variation = .04, verlauf = .14 } = {}) {
  const basis = new THREE.Color(farbe);
  const pos = geometrie.attributes.position; const n = pos.count;
  geometrie.computeBoundingBox();
  const bb = geometrie.boundingBox; const h = Math.max(1e-6, bb.max.y - bb.min.y);
  const farben = new Float32Array(n * 3);
  const normal = geometrie.attributes.normal;
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const t = (pos.getY(i) - bb.min.y) / h;
    let k = 1.02 - verlauf / 2 + verlauf * t;
    if (normal) { const ny = normal.getY(i); k *= .96 + .08 * Math.max(0, ny); }
    k += (Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1) * variation - variation / 2;
    c.copy(basis).multiplyScalar(k);
    farben[i * 3] = c.r; farben[i * 3 + 1] = c.g; farben[i * 3 + 2] = c.b;
  }
  geometrie.setAttribute('color', new THREE.BufferAttribute(farben, 3));
  return geometrie;
}
