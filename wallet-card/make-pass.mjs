// Baut die signierte Apple-Wallet-Karte "webatelier.pkpass".
//
//  Ablauf:
//   1. pass.json aus config.mjs erzeugen
//   2. Bilder + pass.json in einen Build-Ordner kopieren
//   3. manifest.json (SHA1 jeder Datei) schreiben
//   4. manifest.json mit OpenSSL (PKCS#7, detached) signieren -> signature
//   5. alles zu webatelier.pkpass zippen
//
//  Voraussetzung: node make-images.mjs wurde ausgeführt und die drei
//  Zertifikate liegen wie in config.mjs angegeben (siehe README.md).
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile, rm, readdir, copyFile } from 'node:fs/promises';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config, buildVCard } from './config.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(HERE, 'assets');
const BUILD = join(HERE, '.build');
const OUT_PKPASS = join(HERE, 'webatelier.pkpass');

const REQUIRED_IMAGES = ['icon.png', 'icon@2x.png', 'icon@3x.png'];

function die(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

// ---- 1. pass.json -----------------------------------------------------------
function buildPassJson() {
  const { contact: c, design: d, apple: a } = config;

  const backFields = [
    c.website && { key: 'website', label: 'Website', value: c.website },
    c.email && { key: 'email', label: 'E-Mail', value: c.email },
    c.phone && { key: 'phone_back', label: 'Telefon', value: c.phone },
    c.address && { key: 'address', label: 'Adresse', value: c.address },
    c.about && { key: 'about', label: 'Über', value: c.about },
    ...(c.socials ?? []).map((s, i) => ({
      key: `social_${i}`,
      label: s.label,
      value: s.value,
    })),
  ].filter(Boolean);

  return {
    formatVersion: 1,
    passTypeIdentifier: a.passTypeIdentifier,
    teamIdentifier: a.teamIdentifier,
    organizationName: a.organizationName,
    serialNumber: a.serialNumber,
    description: `${c.company} – Visitenkarte`,
    logoText: d.logoText,
    foregroundColor: d.foreground,
    backgroundColor: d.background,
    labelColor: d.label,
    sharingProhibited: false,
    generic: {
      primaryFields: [{ key: 'name', label: '', value: c.fullName }],
      secondaryFields: [
        c.title && { key: 'title', label: 'ROLLE', value: c.title },
        c.company && { key: 'company', label: 'ATELIER', value: c.company },
      ].filter(Boolean),
      auxiliaryFields: [
        c.phone && { key: 'phone', label: 'TELEFON', value: c.phone },
        c.email && { key: 'email_aux', label: 'E-MAIL', value: c.email },
      ].filter(Boolean),
      backFields,
    },
    barcodes: [
      {
        format: 'PKBarcodeFormatQRCode',
        message: buildVCard(),
        messageEncoding: 'iso-8859-1',
        altText: c.website?.replace(/^https?:\/\//, ''),
      },
    ],
  };
}

// ---- Vorbedingungen prüfen --------------------------------------------------
function checkPrereqs() {
  for (const img of REQUIRED_IMAGES) {
    if (!existsSync(join(ASSETS, img))) {
      die(`Bild fehlt: assets/${img}\n  Bitte zuerst ausführen:  node make-images.mjs`);
    }
  }
  const { certs } = config;
  for (const [name, p] of [
    ['signerCert', certs.signerCert],
    ['signerKey', certs.signerKey],
    ['wwdr', certs.wwdr],
  ]) {
    const abs = join(HERE, p);
    if (!existsSync(abs)) {
      die(
        `Zertifikat fehlt: ${p}  (${name})\n` +
          `  Siehe README.md → Abschnitt "Apple-Zertifikate besorgen".`
      );
    }
  }
  // Platzhalter-Warnung
  if (config.apple.teamIdentifier === 'ABCDE12345') {
    console.warn(
      '⚠  Hinweis: teamIdentifier ist noch der Platzhalter "ABCDE12345".\n' +
        '   Die Karte wird gebaut, Wallet akzeptiert sie aber nur mit deinen echten Werten.\n'
    );
  }
}

// ---- 3. manifest.json -------------------------------------------------------
async function buildManifest(dir) {
  const entries = await readdir(dir);
  const manifest = {};
  for (const name of entries.sort()) {
    if (name === 'manifest.json' || name === 'signature') continue;
    const buf = await readFile(join(dir, name));
    manifest[name] = createHash('sha1').update(buf).digest('hex');
  }
  await writeFile(join(dir, 'manifest.json'), JSON.stringify(manifest));
  return manifest;
}

// ---- 4. Signatur (OpenSSL, PKCS#7 detached) ---------------------------------
function signManifest(dir) {
  const { certs } = config;
  const args = [
    'smime', '-binary', '-sign',
    '-certfile', join(HERE, certs.wwdr),
    '-signer', join(HERE, certs.signerCert),
    '-inkey', join(HERE, certs.signerKey),
    '-in', join(dir, 'manifest.json'),
    '-out', join(dir, 'signature'),
    '-outform', 'DER',
  ];
  if (certs.signerKeyPassphrase) {
    args.push('-passin', `pass:${certs.signerKeyPassphrase}`);
  }
  try {
    execFileSync('openssl', args, { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (err) {
    const stderr = err.stderr?.toString() ?? '';
    die(
      `OpenSSL-Signatur fehlgeschlagen.\n${stderr}\n` +
        `  Häufige Ursachen: falsche Passphrase, Zertifikat/Key passen nicht\n` +
        `  zusammen, oder wwdr.pem ist nicht das WWDR-Zwischenzertifikat.`
    );
  }
}

// ---- 5. Zippen --------------------------------------------------------------
function zipPass(dir) {
  if (existsSync(OUT_PKPASS)) execFileSync('rm', ['-f', OUT_PKPASS]);
  // -X: keine Extra-Attribute, -r rekursiv; im Build-Ordner ausführen, damit
  // die Dateien ohne Unterverzeichnis in der ZIP liegen (Apple verlangt das).
  execFileSync('zip', ['-X', '-r', '-q', OUT_PKPASS, '.', '-x', '.*'], { cwd: dir });
}

async function main() {
  checkPrereqs();

  await rm(BUILD, { recursive: true, force: true });
  await mkdir(BUILD, { recursive: true });

  // pass.json
  const passJson = buildPassJson();
  await writeFile(join(BUILD, 'pass.json'), JSON.stringify(passJson, null, 2));

  // Bilder kopieren
  for (const name of await readdir(ASSETS)) {
    if (name.endsWith('.png')) await copyFile(join(ASSETS, name), join(BUILD, name));
  }

  await buildManifest(BUILD);
  signManifest(BUILD);
  zipPass(BUILD);

  await rm(BUILD, { recursive: true, force: true });

  console.log(`\n✓ Fertig:  ${basename(OUT_PKPASS)}`);
  console.log('  Öffne die Datei auf einem iPhone/Mac oder verlinke sie in index.html,');
  console.log('  um sie zu Apple Wallet hinzuzufügen.\n');
}

main().catch((err) => die(err.stack || String(err)));
