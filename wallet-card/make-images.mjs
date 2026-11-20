// Erzeugt alle von Apple Wallet benötigten PNGs (Icon in 3 Auflösungen +
// Logo in 3 Auflösungen) aus den Marken-Farben in config.mjs — komplett ohne
// externe Bibliotheken. Das Markenzeichen ist der Kompass-Stern (Webartelier
// Nord): ein weißer Vierstrahl-Stern mit dünnem Ring auf schwarzem Grund.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Canvas, color } from './lib/png.mjs';
import { config } from './config.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'assets');

const bg = color(config.design.background);
const mark = color(config.design.accent); // Sternfarbe (weiß)

// Eckpunkte eines Vierstrahl-Sterns (Nordstern/Kompass) um (cx, cy).
function starPolygon(cx, cy, R, rInner) {
  const axes = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];
  const pts = [];
  for (let i = 0; i < 4; i++) {
    const a = axes[i];
    const b = axes[(i + 1) % 4];
    pts.push([cx + a[0] * R, cy + a[1] * R]); // Spitze
    const dx = a[0] + b[0];
    const dy = a[1] + b[1];
    const len = Math.hypot(dx, dy) || 1;
    pts.push([cx + (dx / len) * rInner, cy + (dy / len) * rInner]); // innere Kerbe
  }
  return pts;
}

function drawMark(cv, size, { ring }) {
  const cx = size / 2;
  const cy = size / 2;
  if (ring) {
    const r = size * 0.44;
    cv.strokeCircle(cx, cy, r, Math.max(1.4, size * 0.028), mark);
  }
  const R = size * (ring ? 0.34 : 0.46);
  cv.fillPolygon(starPolygon(cx, cy, R, R * 0.24), mark);
}

// Icon: schwarzer Grund + Kompass-Stern mit Ring (Wallet maskiert die Ecken).
function makeIcon(size) {
  const cv = new Canvas(size, size);
  cv.fill(bg);
  drawMark(cv, size, { ring: true });
  return cv.toPNG();
}

// Logo: transparenter Grund, nur der Kompass-Stern mit Ring (der Schriftzug
// "Webartelier Nord" kommt über logoText aus pass.json daneben).
function makeLogo(height) {
  const cv = new Canvas(height, height);
  drawMark(cv, height, { ring: true });
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
