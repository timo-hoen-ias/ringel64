// Spielstand in localStorage. Kein Game Over, nichts geht verloren.
const SCHLUESSEL = 'ringel64.spielstand.v1';

function frisch() {
  return { klammern: 0, flusen: 0, socken: 0, knoepfe: 0, leben: 3, outfit: 0, outfits: [0],
    gesammelt: {}, gerettet: {}, flags: {}, bosse: {}, ende: false, spielzeit: 0, level: 'hub' };
}

export class Spielstand {
  constructor() { this.daten = frisch(); this.lade(); }
  lade() {
    try { const s = localStorage.getItem(SCHLUESSEL); if (s) this.daten = { ...frisch(), ...JSON.parse(s) }; } catch (e) { /* privater Modus o. ä. */ }
  }
  speichere() { try { localStorage.setItem(SCHLUESSEL, JSON.stringify(this.daten)); } catch (e) { /* ignorieren */ } }
  neu() { this.daten = frisch(); this.speichere(); }
  get existiert() { try { return !!localStorage.getItem(SCHLUESSEL); } catch (e) { return false; } }

  istGesammelt(id) { return !!this.daten.gesammelt[id]; }
  sammle(id, art, extra) {
    if (this.daten.gesammelt[id]) return;
    this.daten.gesammelt[id] = true;
    if (art === 'klammer') this.daten.klammern++;
    if (art === 'fussel') this.daten.flusen++;
    if (art === 'knopf') { this.daten.knoepfe++; if (!this.daten.outfits.includes(extra)) this.daten.outfits.push(extra); }
    this.speichere();
  }
  rette(id, name, partner, farbe) {
    if (this.daten.gesammelt[id]) return;
    this.daten.gesammelt[id] = true; this.daten.socken++;
    this.daten.gerettet[id] = { name, partner, farbe };
    this.speichere();
  }
  flag(name, wert) { if (wert === undefined) return !!this.daten.flags[name]; this.daten.flags[name] = wert; this.speichere(); }
  // Anzahl gesammelter Klammern in einer Liste von Ids
  zaehle(ids) { return ids.filter(id => this.daten.gesammelt[id]).length; }
}
