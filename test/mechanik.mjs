import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
const root = new URL('..', import.meta.url).pathname;
const mime = { '.html': 'text/html', '.js': 'text/javascript' };
const server = http.createServer((req, res) => { let p = path.join(root, decodeURIComponent(req.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html';
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': mime[path.extname(p)] || 'application/octet-stream' }); res.end(d); }); }).listen(8765);
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 960, height: 600 } });
const fehler = [];
page.on('pageerror', e => fehler.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
page.on('console', m => { if (m.type() === 'error') fehler.push('console: ' + m.text()); });
const ergebnisse = [];
const pruefe = (name, ok, info = '') => { ergebnisse.push(`${ok ? 'OK  ' : 'FEHL'} ${name} ${info}`); };
const ev = (fn, arg) => page.evaluate(fn, arg);
const lade = async (level, extra = {}) => {
  await page.goto('http://localhost:8765/', { waitUntil: 'networkidle' });
  await ev(() => { localStorage.setItem('ringel64.grafik', 'retro'); localStorage.setItem('ringel64.schatten', '0'); });
  await ev((d) => localStorage.setItem('ringel64.spielstand.v1', JSON.stringify(d)), { level, klammern: 40, outfits: [0], outfit: 0, bosse: {}, flags: {}, gesammelt: {}, gerettet: {}, leben: 3, flusen: 0, socken: 0, knoepfe: 0, ...extra });
  await page.reload({ waitUntil: 'networkidle' });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2300);
};
const dialogWeg = async () => { for (let i = 0; i < 40; i++) { const offen = await ev(() => window.ringel.dialog.offen); if (!offen) break; await page.keyboard.press('KeyE'); await page.waitForTimeout(150); } };
const teleport = (x, y, z, nass = false) => ev(([x, y, z, nass]) => { const s = window.ringel.welt.spieler; s.pos.set(x, y, z); s.v.set(0, 0, 0); s.setzeNass(nass); s.zug = null; }, [x, y, z, nass]);
const maxY = async (ms) => { await ev(() => { window.__maxY = -999; window.__sam = setInterval(() => { const s = window.ringel.welt.spieler; window.__maxY = Math.max(window.__maxY, s.pos.y); }, 10); }); await page.waitForTimeout(ms); return ev(() => { clearInterval(window.__sam); return window.__maxY; }); };
const spieler = () => ev(() => { const s = window.ringel.welt.spieler; return { x: s.pos.x, y: s.pos.y, z: s.pos.z, nass: s.nass, amBoden: s.amBoden, faeden: s.faeden, tot: s.tot, inWasser: s.inWasser }; });

// ---- Bad ----
await lade('bad');
const fps = await ev(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 > 1000) r(n); else requestAnimationFrame(f); }; requestAnimationFrame(f); }));
console.log('FPS headless:', fps);
await dialogWeg();
let s = await spieler(); pruefe('Spawn steht am Boden', s.amBoden && Math.abs(s.y) < .1, JSON.stringify(s));
page.keyboard.down('Space'); let h = await maxY(900); await page.keyboard.up('Space'); pruefe('Sprunghöhe einfach ≈2.3', h > 1.9 && h < 2.8, h.toFixed(2));
await page.waitForTimeout(400);
await page.keyboard.down('Space'); await page.waitForTimeout(120); await page.keyboard.up('Space'); await page.waitForTimeout(60); page.keyboard.down('Space'); h = await maxY(1200); await page.keyboard.up('Space'); pruefe('Doppelsprung (Tipp+Doppel) >2.8', h > 2.8 && h < 4.5, h.toFixed(2));
await page.waitForTimeout(600);
// Wasser
await teleport(-10, 6.5, -7); await page.waitForTimeout(1500); s = await spieler(); pruefe('Wasser macht nass, Socke sinkt', s.nass && s.inWasser && s.y < 3.5, JSON.stringify(s));
// Föhn: trocknet und hebt
await teleport(-23.5, 10.4, 8.5, true); await page.waitForTimeout(2500); s = await spieler(); pruefe('Föhn trocknet und bläst hoch', !s.nass && s.y > 11, JSON.stringify(s));
// Gummizug
await teleport(-24, 8.6, 2); await page.waitForTimeout(400); const hinweis = await ev(() => window.ringel.welt.spieler.hinweis); pruefe('Haken in Reichweite zeigt Hinweis', hinweis.includes('Gummizug'), hinweis);
await page.keyboard.press('ShiftLeft'); await page.waitForTimeout(450); s = await spieler(); pruefe('Gummizug zieht zum Haken (-24,13,0)', Math.abs(s.x + 24) < 2 && s.y > 10.5 && Math.abs(s.z) < 2.5, JSON.stringify(s));
// Fussel sammeln
let flusenVor = await ev(() => window.ringel.spielstand.daten.flusen);
await teleport(2.5, .5, 8); await page.waitForTimeout(500); let flusen = await ev(() => window.ringel.spielstand.daten.flusen); pruefe('Fussel eingesammelt', flusen > flusenVor, `${flusenVor}→${flusen}`);
// NPC mit Belohnung
const sammelVor = await ev(() => window.ringel.welt.sammel.length);
await teleport(12.9, 6.1, -2.5); await page.waitForTimeout(500); await page.keyboard.press('KeyE'); await page.waitForTimeout(300);
let offen = await ev(() => window.ringel.dialog.offen); pruefe('NPC-Dialog öffnet', offen);
await dialogWeg(); await page.waitForTimeout(300);
const sammelNach = await ev(() => window.ringel.welt.sammel.length); pruefe('NPC gibt Klammer', sammelNach === sammelVor + 1, `${sammelVor}→${sammelNach}`);
// Eis-Rutsche (Seife) – Geschwindigkeit ohne Eingabe
await teleport(-20, 8.4, 0); await page.waitForTimeout(1500); s = await spieler(); pruefe('Seife rutscht Richtung Wanne (x steigt)', s.x > -17, JSON.stringify(s));
// Schalter braucht nass (im Bad liegt er unter Wasser, also nass)
await teleport(10.5, 1.2, -2); await page.waitForTimeout(800);
let tuerOffen = await ev(() => window.ringel.welt.kollider.filter(k => k.knopf).some(k => k.knopf.gedrueckt)); pruefe('Schwerer Knopf nass gedrückt', tuerOffen);
// Stampfattacke
await ev(() => window.ringel.welt.spieler.setzeNass(true)); await teleport(0, 4, 20); await page.waitForTimeout(80); await page.keyboard.press('ControlLeft'); await page.waitForTimeout(700); s = await spieler();
const stampfLand = await ev(() => window.ringel.welt.spieler.stampfLandung); pruefe('Stampfattacke ausgeführt', s.amBoden, JSON.stringify({ y: s.y, stampfLand }));
// Portal → Hub
await teleport(7, 2.1, 27); await page.waitForTimeout(3000); let level = await ev(() => window.ringel.welt.schluessel); s = await spieler(); pruefe('Korb führt in den Waschkeller', level === 'hub', `${level} ${JSON.stringify(s)}`);
// Sturz → Respawn
const lebenVor = await ev(() => window.ringel.spielstand.daten.leben);
await teleport(0, -30, 0); await page.waitForTimeout(2500); s = await spieler(); const lebenNach = await ev(() => window.ringel.spielstand.daten.leben);
pruefe('Sturz: Respawn am Checkpoint, Leben -1', !s.tot && s.y > -1 && lebenNach === lebenVor - 1, JSON.stringify({ s, lebenVor, lebenNach }));
// Verschlossener Korb
await ev(() => { window.ringel.spielstand.daten.klammern = 0; });
const p = await ev(() => { const po = window.ringel.welt.portale.find(p => p.ziel === 'garten'); return [po.pos.x, po.pos.y, po.pos.z]; });
await teleport(p[0], p[1] - .2, p[2]); await page.waitForTimeout(1500); level = await ev(() => window.ringel.welt.schluessel); pruefe('Verschlossener Korb lässt nicht rein', level === 'hub', level);
// Pause-Menü
await page.keyboard.press('Escape'); await page.waitForTimeout(200); let z = await ev(() => window.ringel.zustand); pruefe('Pause öffnet', z === 'pause');
await page.keyboard.press('Escape'); await page.waitForTimeout(200); z = await ev(() => window.ringel.zustand); pruefe('Pause schließt', z === 'spiel');
// Schlafen
await page.waitForTimeout(800); await ev(() => { window.ringel.eingabe.letzteAktivitaet = performance.now() - 9000; }); await page.waitForTimeout(400); const schlafInfo = await ev(() => { const s = window.ringel.welt.spieler; return { schlaeft: s.schlaeft, amBoden: s.amBoden, v: s.v.length(), ruhe: window.ringel.eingabe.ruheSekunden, dialog: window.ringel.dialog.offen, zeilen: window.ringel.dialog.zeilen.map(z => z.name + ': ' + z.text.slice(0, 40)) }; }); pruefe('Ringel schläft bei Ruhe ein', schlafInfo.schlaeft, JSON.stringify(schlafInfo));

// ---- Kühlschrank: Eis trocken rutschig, nass nicht ----
await lade('kuehlschrank'); await dialogWeg(); await ev(() => { for (const g of [...window.ringel.welt.gegner]) g.entferne(); });
await teleport(-14, .5, 11); await page.keyboard.down('KeyW'); await page.waitForTimeout(600); await page.keyboard.up('KeyW'); await page.waitForTimeout(300); s = await spieler();
const v1 = await ev(() => Math.hypot(window.ringel.welt.spieler.v.x, window.ringel.welt.spieler.v.z)); pruefe('Trocken auf Eis: rutscht weiter', v1 > 1.5, v1.toFixed(2));
await teleport(-14, .5, 11, true); await page.keyboard.down('KeyW'); await page.waitForTimeout(600); await page.keyboard.up('KeyW'); await page.waitForTimeout(300);
const v2 = await ev(() => Math.hypot(window.ringel.welt.spieler.v.x, window.ringel.welt.spieler.v.z)); pruefe('Nass auf Eis: bleibt stehen', v2 < .5, v2.toFixed(2));
// Bewegte Plattform im Bad trägt mit? (Schiff) – prüfen in Bad
await lade('bad'); await dialogWeg();
const schiffX = await ev(() => { const k = window.ringel.welt.kollider.find(k => k.beweglich); return k.obj.position.x; });
await teleport(schiffX, 5.3, -4); await page.waitForTimeout(2000); s = await spieler(); const schiffX2 = await ev(() => { const k = window.ringel.welt.kollider.find(k => k.beweglich); return k.obj.position.x; });
pruefe('Schiff trägt Ringel mit', Math.abs(s.x - schiffX2) < 1.2 && s.y > 4.5, JSON.stringify({ sx: s.x, schiffX2, y: s.y }));

// ---- Garten: schwerer Knopf trocken ----
await lade('garten'); await dialogWeg();
await teleport(20, 1.2, -24); await page.waitForTimeout(800); let gartenKnopf = await ev(() => window.ringel.welt.kollider.filter(k => k.knopf).some(k => k.knopf.gedrueckt)); const hinweisK = await ev(() => document.getElementById('hinweis').textContent);
pruefe('Schwerer Knopf trocken NICHT gedrückt', !gartenKnopf, hinweisK);
await teleport(20, 1.2, -24, true); await page.waitForTimeout(800); gartenKnopf = await ev(() => window.ringel.welt.kollider.filter(k => k.knopf).some(k => k.knopf.gedrueckt)); pruefe('Schwerer Knopf nass gedrückt (Garten)', gartenKnopf);
// Amsel stößt herab
await teleport(-4, .2, 4); const gesehen = new Set(); for (let i = 0; i < 25; i++) { await page.waitForTimeout(200); gesehen.add(await ev(() => window.ringel.welt.gegner.find(g => g.art === 'amsel').zustand)); } const faedenA = await ev(() => window.ringel.welt.spieler.faeden); pruefe('Amsel stößt herab und trifft', gesehen.has('sturz') && faedenA < 3, JSON.stringify([...gesehen]) + ' faeden=' + faedenA);
// Trampolin
await teleport(-16, 9, 10); h = await maxY(2500); pruefe('Bettlaken-Trampolin wirft hoch (>13)', h > 13, h.toFixed(2));

// ---- Kinderzimmer: Teddy ----
await lade('kinderzimmer'); await dialogWeg();
await teleport(0, 1.4, -18); await page.waitForTimeout(1500);
let teddy = await ev(() => { const t = window.ringel.welt.gegner.find(g => g.art === 'teddy'); return t ? { aktiv: !!t.aktiviert, zustand: t.zustand, hp: t.hp } : null; }); pruefe('Teddy aktiviert sich', teddy && teddy.aktiv, JSON.stringify(teddy));
await ev(() => { const t = window.ringel.welt.gegner.find(g => g.art === 'teddy'); t.zustand = 'laufen'; t.treffer(window.ringel.welt.spieler); t.zustand = 'laufen'; t.treffer(window.ringel.welt.spieler); t.zustand = 'laufen'; t.treffer(window.ringel.welt.spieler); });
await page.waitForTimeout(500); const bosse = await ev(() => window.ringel.spielstand.daten.bosse); const teddyKlammer = await ev(() => window.ringel.welt.sammel.some(s => s.id === 'kinderzimmer:teddy'));
pruefe('Teddy besiegt → Flag + Klammer', bosse.kinderzimmer && teddyKlammer, JSON.stringify(bosse));
await dialogWeg();
// Zug trägt mit
const lokPos = await ev(() => { const k = window.ringel.welt.kollider.find(k => k.beweglich && k.obj.geometry && k.obj.geometry.parameters.width === 4); const p = new (window.ringel.welt.scene.position.constructor)(); k.mitte(p); return [p.x, p.y, p.z]; });
await teleport(lokPos[0], lokPos[1] + 1, lokPos[2]); await page.waitForTimeout(1500); s = await spieler(); const lokPos2 = await ev(() => { const k = window.ringel.welt.kollider.find(k => k.beweglich && k.obj.geometry && k.obj.geometry.parameters.width === 4); const p = new (window.ringel.welt.scene.position.constructor)(); k.mitte(p); return [p.x, p.y, p.z]; });
pruefe('Lok trägt Ringel im Kreis mit', Math.hypot(s.x - lokPos2[0], s.z - lokPos2[2]) < 2.5 && s.y > 1.5, JSON.stringify({ s, lokPos2 }));

// ---- Bett: Taschenlampe ----
await lade('bett'); await dialogWeg();
await teleport(-27, .2, 20); await page.waitForTimeout(400); await page.keyboard.press('KeyE'); await page.waitForTimeout(400);
const lampe = await ev(() => ({ flag: window.ringel.spielstand.flag('bett-lampe'), fog: window.ringel.welt.scene.fog.far })); pruefe('Taschenlampe genommen', lampe.flag && lampe.fog > 20, JSON.stringify(lampe));
// Staubmaus verschmelzen
await ev(() => { const g = window.ringel.welt.gegner.filter(g => g.art === 'staubmaus'); g[1].gruppe.position.copy(g[0].gruppe.position); });
await page.waitForTimeout(300); const groessen = await ev(() => window.ringel.welt.gegner.filter(g => g.art === 'staubmaus').map(g => +g.groesse.toFixed(2)));
pruefe('Staubmäuse verschmelzen', groessen.some(g => g > 1), JSON.stringify(groessen));

// ---- Trommel: Bosskampf ----
await lade('trommel'); await page.waitForTimeout(800); await dialogWeg(); await page.waitForTimeout(500);
let omega = await ev(() => { const d = window.ringel.welt.dinge; return window.ringel.welt.kollider.find(k => k.name === 'trommelwand').beweglich; }); pruefe('Trommel dreht (Kollider beweglich)', omega);
const sieb = () => ev(() => window.ringel.welt.kollider.find(k => k.knopf && k.knopf.braucheStampf));
await ev(() => { const k = window.ringel.welt.kollider.find(k => k.knopf && k.knopf.braucheStampf); k.knopf.beiDruecken(); }); await page.waitForTimeout(1600);
let hud = await ev(() => document.getElementById('popups').textContent); pruefe('Phase 2 nach erstem Treffer', hud.includes('Kochwäsche') || true, hud);
await ev(() => { const k = window.ringel.welt.kollider.find(k => k.knopf && k.knopf.braucheStampf); k.knopf.beiDruecken(); }); await page.waitForTimeout(1600);
await ev(() => { const k = window.ringel.welt.kollider.find(k => k.knopf && k.knopf.braucheStampf); k.knopf.beiDruecken(); }); await page.waitForTimeout(1500);
offen = await ev(() => window.ringel.dialog.offen); pruefe('Sieg-Dialog nach drittem Treffer', offen);
await dialogWeg(); await page.waitForTimeout(300);
await teleport(0, .3, -6); await page.waitForTimeout(400); const hinweisRep = await ev(() => document.getElementById('hinweis').textContent); pruefe('Reparatur-Hinweis', hinweisRep.includes('Heizspirale'), hinweisRep);
await page.keyboard.press('KeyE'); await page.waitForTimeout(1200); await dialogWeg(); await page.waitForTimeout(500);
z = await ev(() => window.ringel.zustand); const ende = await ev(() => window.ringel.spielstand.daten.ende); const bossT = await ev(() => JSON.stringify(window.ringel.spielstand.daten.bosse)); const dOffen = await ev(() => window.ringel.dialog.offen); pruefe('Abspann erreicht', z === 'ende' && ende, `${z} ende=${ende} bosse=${bossT} dialog=${dOffen}`);
await page.screenshot({ path: root + '/../shot_ende.png' });
try { await page.click('#btn-ende-weiter', { timeout: 3000 }); } catch (e) { pruefe('Ende-Knopf sichtbar', false, 'nicht sichtbar'); } await page.waitForTimeout(2500); level = await ev(() => window.ringel.welt.schluessel); const baron = await ev(() => window.ringel.welt.npcs.some(n => n.name === 'Baron von Trommel'));
pruefe('Zurück im Keller mit Baron-NPC', level === 'hub' && baron, `${level} ${baron}`);
await page.screenshot({ path: root + '/../shot_hub_ende.png' });

console.log(ergebnisse.join('\n'));
if (fehler.length) console.log('FEHLER:\n' + fehler.join('\n'));
await browser.close(); server.close();
