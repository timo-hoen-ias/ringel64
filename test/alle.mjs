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
await page.goto('http://localhost:8765/', { waitUntil: 'networkidle' });
const levels = process.argv.slice(2).length ? process.argv.slice(2) : ['hub', 'bad', 'kuehlschrank', 'herd', 'kinderzimmer', 'bett', 'garten', 'trommel'];
for (const level of levels) {
  fehler.length = 0;
  await page.evaluate((l) => { localStorage.setItem('ringel64.spielstand.v1', JSON.stringify({ level: l, klammern: 40, outfits: [0,1,2,3,4,5,6,7], outfit: 0, bosse: {}, flags: {}, gesammelt: {}, gerettet: {} })); }, level);
  await page.reload({ waitUntil: 'networkidle' });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2400);
  // Dialog ggf. wegdrücken
  for (let i = 0; i < 8; i++) { await page.keyboard.press('KeyE'); await page.waitForTimeout(120); }
  await page.screenshot({ path: root + '/../shot_' + level + '.png' });
  await page.keyboard.down('KeyW'); await page.waitForTimeout(700); await page.keyboard.press('Space'); await page.waitForTimeout(250); await page.keyboard.press('Space'); await page.waitForTimeout(900); await page.keyboard.up('KeyW');
  await page.keyboard.down('KeyD'); await page.waitForTimeout(500); await page.keyboard.up('KeyD');
  await page.waitForTimeout(600);
  const stat = await page.evaluate(() => { const s = window.ringel; const w = s.welt; return { zustand: s.zustand, pos: w.spieler.pos.toArray().map(v => +v.toFixed(2)), kollider: w.kollider.length, dinge: w.dinge.length, klammern: w.klammerIds.length, sammel: w.sammel.length, gegner: w.gegner.length, npcs: w.npcs.length, fehlerBox: document.getElementById('fehler').textContent }; });
  console.log(level, JSON.stringify(stat));
  if (fehler.length) console.log('  FEHLER:\n  ' + fehler.join('\n  '));
}
await browser.close(); server.close();
