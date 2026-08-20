// Erzeugt alle von Apple Wallet benötigten PNGs (Icon in 3 Auflösungen +
// Logo in 3 Auflösungen) aus den Marken-Farben in config.mjs — komplett ohne
// externe Bibliotheken. Das Monogramm ist auf den Buchstaben "W" optimiert;
// setzt du config.design.monogram auf etwas anderes, hinterlege am besten
// eigene Logo-PNGs im Ordner assets/.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Canvas, color } from './lib/png.mjs';
import { config } from './config.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'assets');

const bg = color(config.design.background);
const accent = color(config.design.accent);

// Zeichnet den Buchstaben "W" als vier dicke Striche in eine Bounding-Box.
function drawMonogramW(cv, x, y, w, h, stroke, col) {
  const pts = [
    [x, y],
    [x + w * 0.28, y + h],
    [x + w * 0.5, y + h * 0.38],
    [x + w * 0.72, y + h],
    [x + w, y],
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    cv.thickLine(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], stroke, col);
  }
}

// Icon: quadratisch, gefüllter Marken-Hintergrund + Monogramm (Wallet maskiert
// die Ecken selbst, daher keine vorgerundete Kachel).
function makeIcon(size) {
  const cv = new Canvas(size, size);
  cv.fill(bg);
  const pad = size * 0.24;
  const box = size - pad * 2;
  drawMonogramW(cv, pad, pad + box * 0.08, box, box * 0.84, Math.max(2, size * 0.09), accent);
  return cv.toPNG();
}

// Logo: transparenter Hintergrund, nur das Monogramm (der Schriftzug
// "Webatelier" kommt über logoText aus pass.json daneben).
function makeLogo(height) {
  const w = Math.round(height * 1.05);
  const cv = new Canvas(w, height);
  const pad = height * 0.14;
  drawMonogramW(cv, pad, pad, w - pad * 2, height - pad * 2, Math.max(2, height * 0.14), accent);
  return cv.toPNG();
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const files = {
    'icon.png': makeIcon(29),
    'icon@2x.png': makeIcon(58),
    'icon@3x.png': makeIcon(87),
    'logo.png': makeLogo(50),
    'logo@2x.png': makeLogo(100),
    'logo@3x.png': makeLogo(150),
  };
  for (const [name, buf] of Object.entries(files)) {
    await writeFile(join(OUT, name), buf);
    console.log(`  ✓ assets/${name} (${buf.length} B)`);
  }
  console.log('Bilder erzeugt. Nächster Schritt: node make-pass.mjs');
}

main().catch((err) => {
  console.error('Fehler beim Erzeugen der Bilder:', err);
  process.exit(1);
});
