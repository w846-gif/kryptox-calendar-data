// Minimaler, abhängigkeitsfreier PNG-Encoder + ein paar Zeichen-Helfer.
// Reicht völlig, um die von Apple Wallet verlangten Icon-/Logo-PNGs
// (8-bit RGBA) zu erzeugen — ohne ImageMagick, Canvas oder sonstige Libs.
import zlib from 'node:zlib';

// ---- CRC32 (für PNG-Chunks) -------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

/**
 * Eine einfache RGBA-Zeichenfläche.
 */
export class Canvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4); // alles transparent
  }

  _idx(x, y) {
    return (y * this.width + x) * 4;
  }

  setPixel(x, y, [r, g, b, a = 255]) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const i = this._idx(x | 0, y | 0);
    // Alpha-Blend über bestehende Pixel
    const sa = a / 255;
    const da = this.data[i + 3] / 255;
    const oa = sa + da * (1 - sa);
    if (oa === 0) return;
    const dr = this.data[i], dg = this.data[i + 1], db = this.data[i + 2];
    this.data[i] = (r * sa + dr * da * (1 - sa)) / oa;
    this.data[i + 1] = (g * sa + dg * da * (1 - sa)) / oa;
    this.data[i + 2] = (b * sa + db * da * (1 - sa)) / oa;
    this.data[i + 3] = oa * 255;
  }

  fill(color) {
    for (let y = 0; y < this.height; y++)
      for (let x = 0; x < this.width; x++) this.setPixel(x, y, color);
  }

  fillRect(x0, y0, w, h, color) {
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) this.setPixel(x, y, color);
  }

  // Abgerundetes Rechteck als Hintergrundkachel.
  fillRoundedRect(x0, y0, w, h, radius, color) {
    const r = Math.min(radius, w / 2, h / 2);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let inside = true;
        // Ecken testen
        const corners = [
          [r, r], [w - r, r], [r, h - r], [w - r, h - r],
        ];
        if (x < r && y < r) inside = dist(x, y, corners[0]) <= r;
        else if (x > w - r && y < r) inside = dist(x, y, corners[1]) <= r;
        else if (x < r && y > h - r) inside = dist(x, y, corners[2]) <= r;
        else if (x > w - r && y > h - r) inside = dist(x, y, corners[3]) <= r;
        if (inside) this.setPixel(x0 + x, y0 + y, color);
      }
    }
  }

  // Dicke Linie (rund abgeschlossen) für Monogramm-Striche.
  thickLine(x1, y1, x2, y2, thickness, color) {
    const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1)) * 2 + 1;
    const rad = thickness / 2;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const cx = x1 + (x2 - x1) * t;
      const cy = y1 + (y2 - y1) * t;
      this.fillCircle(cx, cy, rad, color);
    }
  }

  fillCircle(cx, cy, r, color) {
    const x0 = Math.floor(cx - r), x1 = Math.ceil(cx + r);
    const y0 = Math.floor(cy - r), y1 = Math.ceil(cy + r);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d <= r) {
          this.setPixel(x, y, color);
        } else if (d <= r + 1) {
          // 1px Antialiasing am Rand
          const a = (color[3] ?? 255) * (1 - (d - r));
          this.setPixel(x, y, [color[0], color[1], color[2], a]);
        }
      }
    }
  }

  toPNG() {
    const { width, height } = this;
    // Rohdaten mit Filter-Byte 0 pro Scanline
    const raw = Buffer.alloc((width * 4 + 1) * height);
    let p = 0;
    for (let y = 0; y < height; y++) {
      raw[p++] = 0; // Filter: none
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        raw[p++] = this.data[i];
        raw[p++] = this.data[i + 1];
        raw[p++] = this.data[i + 2];
        raw[p++] = this.data[i + 3];
      }
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // color type RGBA
    ihdr[10] = 0; // compression
    ihdr[11] = 0; // filter
    ihdr[12] = 0; // interlace
    const idat = zlib.deflateSync(raw, { level: 9 });
    return Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG-Signatur
      chunk('IHDR', ihdr),
      chunk('IDAT', idat),
      chunk('IEND', Buffer.alloc(0)),
    ]);
  }
}

function dist(x, y, [cx, cy]) {
  return Math.hypot(x - cx, y - cy);
}

// hex/rgb-String -> [r,g,b,a]
export function color(input, alpha = 255) {
  if (Array.isArray(input)) return [input[0], input[1], input[2], input[3] ?? alpha];
  const s = String(input).trim();
  let m = s.match(/^#?([0-9a-f]{6})$/i);
  if (m) {
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, alpha];
  }
  m = s.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i);
  if (m) return [+m[1], +m[2], +m[3], alpha];
  throw new Error(`Farbe nicht erkannt: ${input}`);
}
