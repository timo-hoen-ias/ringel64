import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
const root = new URL('..', import.meta.url).pathname;
const mime = { '.html': 'text/html', '.js': 'text/javascript' };
const server = http.createServer((req, res) => { let p = path.join(root, decodeURIComponent(req.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html';
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': mime[path.extname(p)] || 'application/octet-stream' }); res.end(d); }); }).listen(8769);
const browser = await chromium.launch({ args: ['--use-gl=swiftshader'] });
const ctx = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const fehler = []; page.on('pageerror', e => fehler.push(e.message)); page.on('console', m => { if (m.type() === 'error') fehler.push(m.text()); });
const ergeb = []; const pruefe = (n, ok, i = '') => ergeb.push(`${ok ? 'OK  ' : 'FEHL'} ${n} ${i}`);
await page.goto('http://localhost:8769/', { waitUntil: 'networkidle' });
await page.evaluate(() => { localStorage.setItem('ringel64.grafik', 'retro'); localStorage.setItem('ringel64.schatten', '0'); localStorage.setItem('ringel64.spielstand.v1', JSON.stringify({ level: 'bad', klammern: 40, outfits: [0], outfit: 0, bosse: {}, flags: {}, gesammelt: {}, gerettet: {} })); });
await page.reload({ waitUntil: 'networkidle' });
await page.screenshot({ path: root + '/../shot_touch_titel.png' });
const touchAktiv = await page.evaluate(() => window.ringel.touch.aktiv); pruefe('Touch auf Touch-Gerät aktiv', touchAktiv);
const sichtbarTitel = await page.evaluate(() => !document.getElementById('touch').hidden); pruefe('Touch-Overlay auf Titel versteckt', !sichtbarTitel);
await page.tap('#btn-start'); await page.waitForTimeout(2600);
const sichtbarSpiel = await page.evaluate(() => !document.getElementById('touch').hidden); pruefe('Touch-Overlay im Spiel sichtbar', sichtbarSpiel);
await page.screenshot({ path: root + '/../shot_touch_spiel.png' });
// Joystick: synthetische Pointer-Events (touch) in der linken Zone
const stick = async (dx, dy, ms) => page.evaluate(async ([dx, dy, ms]) => {
  const z = document.getElementById('touch-stick-zone'); const r = z.getBoundingClientRect(); const x0 = r.left + r.width / 2, y0 = r.top + r.height / 2;
  const ev = (t, x, y) => z.dispatchEvent(new PointerEvent(t, { clientX: x, clientY: y, pointerId: 77, pointerType: 'touch', bubbles: true, isPrimary: true }));
  ev('pointerdown', x0, y0); ev('pointermove', x0 + dx, y0 + dy); await new Promise(r => setTimeout(r, ms)); ev('pointerup', x0 + dx, y0 + dy); }, [dx, dy, ms]);
const vor = await page.evaluate(() => window.ringel.welt.spieler.pos.toArray());
await stick(0, -50, 900); await page.waitForTimeout(200);
const nach = await page.evaluate(() => window.ringel.welt.spieler.pos.toArray());
pruefe('Joystick bewegt Ringel vorwärts', Math.hypot(nach[0] - vor[0], nach[2] - vor[2]) > 2, JSON.stringify({ vor, nach }));
const achse = await page.evaluate(() => window.ringel.eingabe.touch.achse); pruefe('Joystick losgelassen = Achse null', achse.x === 0 && achse.y === 0);
// Sprungtaste gedrückt halten
await page.evaluate(() => { window.__maxY = 0; window.__s = setInterval(() => { window.__maxY = Math.max(window.__maxY, window.ringel.welt.spieler.pos.y); }, 10); });
const a = await page.$('.taste.a'); const box = await a.boundingBox();
await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2); await page.waitForTimeout(1000);
const maxY = await page.evaluate(() => { clearInterval(window.__s); return window.__maxY; }); pruefe('A-Taste springt (kurzer Tipp = kleiner Hüpfer)', maxY > .4, maxY.toFixed(2));
// Kamera wischen
const yawVor = await page.evaluate(() => window.ringel.kamera.yaw);
await page.evaluate(async () => { const z = document.getElementById('touch-kamera-zone'); const r = z.getBoundingClientRect(); const x0 = r.left + 40, y0 = r.top + 40;
  const ev = (t, x, y) => z.dispatchEvent(new PointerEvent(t, { clientX: x, clientY: y, pointerId: 78, pointerType: 'touch', bubbles: true }));
  ev('pointerdown', x0, y0); for (let i = 1; i <= 10; i++) { ev('pointermove', x0 + i * 12, y0); await new Promise(r => setTimeout(r, 40)); } ev('pointerup', x0 + 120, y0); });
await page.waitForTimeout(200); const yawNach = await page.evaluate(() => window.ringel.kamera.yaw); pruefe('Wischen dreht Kamera', Math.abs(yawNach - yawVor) > .2, (yawNach - yawVor).toFixed(2));
// Y-Taste öffnet Dialog bei NPC, Tippen auf Dialog blättert
await page.evaluate(() => { const s = window.ringel.welt.spieler; s.pos.set(12.9, 6.1, -2.5); s.v.set(0, 0, 0); }); await page.waitForTimeout(500);
const y = await page.$('.taste.y'); const yb = await y.boundingBox(); await page.touchscreen.tap(yb.x + yb.width / 2, yb.y + yb.height / 2); await page.waitForTimeout(300);
const offen = await page.evaluate(() => window.ringel.dialog.offen); pruefe('Y-Taste startet Dialog', offen);
await page.screenshot({ path: root + '/../shot_touch_dialog.png' });
for (let i = 0; i < 10; i++) { await page.touchscreen.tap(400, 350); await page.waitForTimeout(150); }
const zu = await page.evaluate(() => !window.ringel.dialog.offen); pruefe('Tippen auf Dialog blättert bis zum Ende', zu);
// Pause-Taste
const pz = await page.$('.taste.pause'); const pb = await pz.boundingBox(); await page.touchscreen.tap(pb.x + pb.width / 2, pb.y + pb.height / 2); await page.waitForTimeout(300);
const pause = await page.evaluate(() => window.ringel.zustand); pruefe('Pause-Taste öffnet Pause', pause === 'pause');
await page.screenshot({ path: root + '/../shot_touch_pause.png' });
await page.tap('#btn-weiter'); await page.waitForTimeout(200); pruefe('Weiter schließt Pause', (await page.evaluate(() => window.ringel.zustand)) === 'spiel');
console.log(ergeb.join('\n')); if (fehler.length) console.log('FEHLER', fehler.join('\n'));
await browser.close(); server.close();
