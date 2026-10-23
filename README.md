# Ringel 64

3D-Jump'n'Run im Browser mit three.js. Die Socke **Ringel** rettet verlorene Socken aus Bad, Kühlschrank,
Herd, Kinderzimmer, Staubwüste, Garten, Aquarium und Winter-Terrasse und stellt sich **Baron von Trommel**,
dem Wäschetrockner, der seit Jahren aus jedem Paar eine Socke klaut.

## Starten

Kein Build-Schritt. Einen statischen Server im Projektordner starten, z. B.

```
npx serve .
```

und `index.html` öffnen. three.js wird vom CDN geladen.

## Steuerung

| Aktion | Tastatur | Gamepad |
|---|---|---|
| Laufen | WASD | linker Stick |
| Kamera | Pfeile / Maus ziehen | rechter Stick |
| Springen (2× = Schleudergang) | Leertaste | A |
| Gummizug an Haken | Shift | X |
| Stampfattacke (nur nass) | Strg | B |
| Gleiten (nur trocken) | Leertaste halten | A halten |
| Reden / benutzen | E | Y |
| Pause, Outfits, Grafik | Esc | Start |

**Touch** (erscheint automatisch auf Touch-Geräten, im Pausemenü umschaltbar): Joystick links durch Aufsetzen und Ziehen,
Kamera durch Wischen rechts, Tasten A (Sprung, halten = gleiten), B (Stampf, halten = abtauchen), X (Gummizug), Y (Reden), Pause oben rechts.
Dialoge blättern durch Tippen.

## Struktur

- `src/engine` – Renderer (Post-Processing), Eingabe, prozedurales Audio, Kollision, Bauer, Texturen, Partikel
- `src/spiel` – Spieler, Kamera, Welt, Sammelobjekte, Gegner, NPCs, Spielstand, Spielzustände
- `src/levels` – eine Datei pro Welt
- `src/ui` – HUD und Dialog

## Tests

`test/` enthält Playwright-Skripte, die jede Welt headless laden und Spielmechaniken prüfen
(`node test/mechanik.mjs`). Chromium und Playwright müssen installiert sein.
