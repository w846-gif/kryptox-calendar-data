// Erzeugt die signierte webartelier.pkpass über die WalletWallet-API
// (Drittanbieter, signiert mit deren Apple-Pass-Type-ID-Zertifikat).
//
// Nutzung:  WALLETWALLET_API_KEY=ww_live_… node make-pass-walletwallet.mjs
//
// Der API-Key wird ausschliesslich aus der Umgebungsvariable gelesen und
// landet NICHT im Repo. Die erzeugte .pkpass enthält keine Geheimnisse
// (nur öffentliche Kontaktdaten) und darf gehostet/committet werden.
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config, buildVCard } from './config.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'webartelier.pkpass');
const API = 'https://api.walletwallet.dev/api/passes';

// PNG als data-URI einlesen (für Logo/Thumbnail). null, wenn nicht vorhanden.
function dataURI(rel) {
  const p = join(HERE, rel);
  return existsSync(p) ? 'data:image/png;base64,' + readFileSync(p).toString('base64') : null;
}

const key = process.env.WALLETWALLET_API_KEY;
if (!key) {
  console.error('Fehler: WALLETWALLET_API_KEY ist nicht gesetzt.');
  process.exit(1);
}

const c = config.contact;
const services = (c.services ?? []).join(' · ');

// Marken-Bilder: Kompass-Logo (oben links) + die Erde als grosser Banner
// (Store-Card-Layout, Erde rechts, nach links in Schwarz auslaufend) – wie auf
// der Visitenkarte. Reines Schwarz als Hintergrund.
const logo = dataURI('assets/logo@3x.png');
const strip = dataURI('assets/strip.png');

const body = {
  organizationName: config.apple.organizationName || c.company,
  logoText: config.design.logoText || c.company,
  description: `${c.company} – Visitenkarte`,
  colorPreset: 'dark',
  color: '#000000',
  ...(logo ? { logoURL: logo } : {}),
  ...(strip ? { stripURL: strip } : {}),
  sharingProhibited: false,
  primaryFields: [{ label: '', value: c.taglineWallet || c.tagline || c.company }],
  secondaryFields: [
    c.phone && { label: 'TELEFON', value: c.phone },
    c.email && { label: 'E-MAIL', value: c.email },
  ].filter(Boolean),
  backFields: [
    c.website && { label: 'Website', value: c.website },
    services && { label: 'Leistungen', value: services },
    c.phone && { label: 'Telefon', value: c.phone },
    c.email && { label: 'E-Mail', value: c.email },
    c.about && { label: 'Über', value: c.about },
  ].filter(Boolean),
  barcodeValue: buildVCard(),
  barcodeFormat: 'QR',
};

const tmp = mkdtempSync(join(tmpdir(), 'ww-'));
const bodyFile = join(tmp, 'body.json');
writeFileSync(bodyFile, JSON.stringify(body));

// curl nutzt den (in CI/Proxy-Umgebungen) konfigurierten HTTPS-Proxy zuverlässig.
let raw;
try {
  raw = execFileSync(
    'curl',
    [
      '-sS', '-X', 'POST', API,
      '-H', `Authorization: Bearer ${key}`,
      '-H', 'Content-Type: application/json',
      '--data-binary', `@${bodyFile}`,
    ],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }
  );
} catch (err) {
  console.error('Netzwerk-/curl-Fehler:', err.message);
  process.exit(1);
}

let res;
try {
  res = JSON.parse(raw);
} catch {
  console.error('Unerwartete API-Antwort:', raw.slice(0, 300));
  process.exit(1);
}
if (res.error || !res.applePass) {
  console.error('WalletWallet-Fehler:', JSON.stringify(res));
  process.exit(1);
}

writeFileSync(OUT, Buffer.from(res.applePass, 'base64'));
console.log(`✓ webartelier.pkpass erzeugt (WalletWallet, serial ${res.serialNumber}).`);
