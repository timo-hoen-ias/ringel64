import { Spiel } from './spiel/spiel.js';

const spiel = new Spiel();
window.ringel = spiel; // zum Debuggen in der Konsole
spiel.schleife();
