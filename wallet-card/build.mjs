// Stellt die statische Seite für Firebase Hosting in wallet-card/public/
// zusammen. Ablauf:
//   1. Wallet-Bilder erzeugen (make-images.mjs)
//   2. Zertifikate ggf. aus Umgebungs-Secrets (Base64) nach certs/ schreiben
//   3. wenn Zertifikate vorhanden: signierte webartelier.pkpass bauen
//   4. index.html, assets/ und (falls vorhanden) die .pkpass nach public/ kopieren
//
// Lokal:   node build.mjs        (nutzt certs/ falls vorhanden)
// In CI:   Secrets werden als PASS_SIGNER_* Umgebungsvariablen übergeben.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile, readFile, copyFile, cp } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CERTS = join(HERE, 'certs');
const PUBLIC = join(HERE, 'public');
const PKPASS = join(HERE, 'webartelier.pkpass');

const run = (script) =>
  execFileSync('node', [join(HERE, script)], { cwd: HERE, stdio: 'inherit' });

async function writeCertFromEnv(envName, file) {
  const b64 = process.env[envName];
  if (!b64) return false;
  await mkdir(CERTS, { recursive: true });
  await writeFile(join(CERTS, file), Buffer.from(b64, 'base64'));
  return true;
}

async function main() {
  // 1. Bilder
  run('make-images.mjs');

  // 2. Zertifikate aus Secrets (falls gesetzt)
  const fromEnv =
    (await writeCertFromEnv('PASS_SIGNER_CERT', 'signerCert.pem')) &
    (await writeCertFromEnv('PASS_SIGNER_KEY', 'signerKey.pem')) &
    (await writeCertFromEnv('PASS_WWDR', 'wwdr.pem'));

  // 3. Pass signieren, wenn alle drei Zertifikate vorliegen
  const haveCerts =
    existsSync(join(CERTS, 'signerCert.pem')) &&
    existsSync(join(CERTS, 'signerKey.pem')) &&
    existsSync(join(CERTS, 'wwdr.pem'));

  // Reihenfolge der Pass-Quellen:
  //  1. eigenes Apple-Zertifikat (volle Kontrolle/Branding)
  //  2. WalletWallet-API-Key (Drittanbieter, signiert die Karte)
  //  3. bereits vorhandene/committete webartelier.pkpass (Fallback)
  if (haveCerts) {
    console.log(fromEnv ? 'Apple-Zertifikate aus Secrets übernommen.' : 'Apple-Zertifikate in certs/ gefunden.');
    run('make-pass.mjs');
  } else if (process.env.WALLETWALLET_API_KEY) {
    console.log('WalletWallet-API-Key gefunden – erzeuge signierte Karte über WalletWallet.');
    run('make-pass-walletwallet.mjs');
  } else if (existsSync(PKPASS)) {
    console.log('Nutze vorhandene webartelier.pkpass (kein Zertifikat/Key gesetzt).');
  } else {
    console.log('Keine Karte – baue die Seite ohne .pkpass (Wallet-Button bleibt "in Vorbereitung").');
  }

  // 4. public/ zusammenstellen
  await rm(PUBLIC, { recursive: true, force: true });
  await mkdir(PUBLIC, { recursive: true });
  // index.html (volle Version) + flyer.html (Kunden-/Flyer-Version ohne
  // "Zu Apple Wallet hinzufügen"-Button, aus derselben Quelle abgeleitet).
  const indexHtml = await readFile(join(HERE, 'index.html'), 'utf8');
  await writeFile(join(PUBLIC, 'index.html'), indexHtml);
  const flyerHtml = indexHtml.replace(
    /[ \t]*<!-- WALLET-ACTION-START[\s\S]*?WALLET-ACTION-END -->\n?/,
    ''
  );
  if (flyerHtml === indexHtml) {
    console.warn('⚠  Wallet-Block-Marker nicht gefunden – flyer.html ist identisch zu index.html.');
  }
  await writeFile(join(PUBLIC, 'flyer.html'), flyerHtml);
  await cp(join(HERE, 'assets'), join(PUBLIC, 'assets'), { recursive: true });
  if (existsSync(PKPASS)) {
    await copyFile(PKPASS, join(PUBLIC, 'webartelier.pkpass'));
    console.log('webartelier.pkpass in die Seite aufgenommen.');
  }

  console.log('\n✓ Seite gebaut: wallet-card/public/');
  console.log('  Deploy:  firebase deploy --only hosting\n');
}

main().catch((err) => {
  console.error('Build-Fehler:', err.stack || String(err));
  process.exit(1);
});
