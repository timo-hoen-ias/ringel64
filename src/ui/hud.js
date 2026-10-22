import { OUTFITS } from '../spiel/sockenmodell.js';

const TIPPS = [
  'Socken mit Sandalen sind kein Verbrechen. Doch.',
  'Ein Loch im Zeh ist ein Fenster zur Welt.',
  'Nasse Socken sind schwer – perfekt für die Stampfattacke (Strg / B).',
  'Trockene Socken gleiten: nach dem Schleudergang Springen gedrückt halten.',
  'Heizkörper, Föhn und Herdplatten trocknen dich. Pfützen machen dich nass.',
  'Der Gummizug (Shift / X) zieht dich zum nächsten goldenen Haken.',
  'Schwere Knöpfe brauchen eine nasse Socke oder eine Stampfattacke.',
  '100 Flusen ergeben ein Extraleben. Niemand weiß, warum.',
  'Lego-Steine tun nur Wesen mit Füßen weh. Du hast keine. Nutze das.',
  'Nasse Socken rutschen auf Eis nicht. Trockene schon.',
  'Wenn du zu lange stillstehst, schläfst du ein. Das ist okay.',
  'Jede gerettete Socke zieht in den Waschkeller und wartet auf ihren Partner.',
  'Ein Kniestrumpf ist auch nur eine Socke mit Höhenangst.',
  'Die Fliege heißt Gunther. Sie mag dich. Sehr.',
  'Der Baron klaut nicht aus Bosheit. Glaubt Flusi. Flusi glaubt viel.',
];
export function zufallsTipp() { return TIPPS[Math.floor(Math.random() * TIPPS.length)]; }

export class HUD {
  constructor(spiel) {
    this.spiel = spiel;
    this.el = document.getElementById('hud');
    this.hinweis = document.getElementById('hinweis');
    this.popups = document.getElementById('popups');
    this.zeichneSymbole();
  }
  zeichneSymbole() {
    const svg = (inhalt) => `<svg viewBox="0 0 22 22" width="22" height="22">${inhalt}</svg>`;
    document.getElementById('sym-klammer').innerHTML = svg('<rect x="6" y="2" width="4" height="18" rx="1" fill="#ffd25a" stroke="#2a1a2e" stroke-width="1.5" transform="rotate(-6 8 11)"/><rect x="12" y="2" width="4" height="18" rx="1" fill="#ffd25a" stroke="#2a1a2e" stroke-width="1.5" transform="rotate(6 14 11)"/><circle cx="11" cy="9" r="2.5" fill="none" stroke="#bbb" stroke-width="1.5"/>');
    document.getElementById('sym-fussel').innerHTML = svg('<circle cx="11" cy="11" r="6" fill="#d8d2e0" stroke="#2a1a2e" stroke-width="1.5"/><path d="M5 6l-2-2M17 6l2-2M5 16l-2 2M17 16l2 2" stroke="#2a1a2e" stroke-width="1.5"/>');
    document.getElementById('sym-socke').innerHTML = svg('<path d="M7 2h7v9l4 4-4 5H8l-3-4 2-3z" fill="#5fb7e8" stroke="#2a1a2e" stroke-width="1.5"/><rect x="7" y="2" width="7" height="3" fill="#fff6e5" stroke="#2a1a2e" stroke-width="1.5"/>');
    document.getElementById('sym-knopf').innerHTML = svg('<circle cx="11" cy="11" r="8" fill="#3b6fd8" stroke="#2a1a2e" stroke-width="1.5"/><circle cx="8" cy="8" r="1.2" fill="#2a1a2e"/><circle cx="14" cy="8" r="1.2" fill="#2a1a2e"/><circle cx="8" cy="14" r="1.2" fill="#2a1a2e"/><circle cx="14" cy="14" r="1.2" fill="#2a1a2e"/>');
  }
  zeige(an) { this.el.style.display = an ? 'block' : 'none'; }
  aktualisiere() {
    const d = this.spiel.spielstand.daten;
    document.getElementById('hud-klammern').textContent = `${d.klammern}`;
    document.getElementById('hud-flusen').textContent = `${d.flusen}`;
    document.getElementById('hud-socken').textContent = `${d.socken}`;
    document.getElementById('hud-knoepfe').textContent = `${d.knoepfe} / ${OUTFITS.length - 1}`;
    document.getElementById('hud-leben').textContent = `×${d.leben}`;
    const sp = this.spiel.welt && this.spiel.welt.spieler;
    const f = document.getElementById('hud-faeden');
    const faeden = sp ? sp.faeden : 3;
    f.innerHTML = [0, 1, 2].map(i => `<span class="faden ${i < faeden ? '' : 'leer'}"></span>`).join('');
    const z = document.getElementById('hud-zustand');
    if (sp) { z.textContent = sp.nass ? 'NASS' : 'TROCKEN'; z.className = sp.nass ? 'nass' : 'trocken'; }
    const w = this.spiel.welt;
    if (w) {
      document.getElementById('levelname').textContent = w.info.name;
      const ziel = document.getElementById('hud-levelziel');
      if (w.klammerIds.length) ziel.textContent = `Klammern hier: ${this.spiel.spielstand.zaehle(w.klammerIds)} / ${w.klammerIds.length}`;
      else ziel.textContent = '';
    }
  }
  setzeHinweis(text) {
    if (!text) { this.hinweis.style.display = 'none'; return; }
    if (this.hinweis.textContent !== text) this.hinweis.textContent = text;
    this.hinweis.style.display = 'block';
  }
  popup(text) {
    const p = document.createElement('div'); p.className = 'popup'; p.textContent = text;
    this.popups.appendChild(p); setTimeout(() => p.remove(), 1700);
  }
}
