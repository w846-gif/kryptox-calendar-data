// ============================================================================
//  Webartelier Nord – Virtuelle Visitenkarte für Apple Wallet
//  ---------------------------------------------------------------------------
//  DIES IST DIE EINZIGE DATEI, DIE DU BEARBEITEN MUSST.
//  Trage unten deine Daten und die Pfade zu deinen Apple-Zertifikaten ein,
//  dann:   node make-images.mjs   &&   node make-pass.mjs
// ============================================================================

export const config = {
  // --- Wer/was steht auf der Karte? ----------------------------------------
  contact: {
    company: 'Webartelier Nord',
    // Optionaler Ansprechpartner – leer lassen ('') für eine reine Firmenkarte.
    fullName: '',
    // Grosse Schlagzeile (wie „Webseiten für Ihr Geschäft.").
    tagline: 'Webseiten für Ihr Geschäft.',
    phone: '0152 695 9143',
    email: 'kontakt@webartelier.com',
    website: 'https://webartelier.com',
    // Adresse optional – leer lassen ('') zum Ausblenden.
    address: '',
    // Leistungen (erscheinen als gesperrte Zeile / auf der Rückseite).
    services: ['Design', 'Sichtbarkeit', 'Hosting', 'Betreuung'],
    // Kurzer Satz für die Rückseite der Wallet-Karte.
    about: 'Sichtbar. Im ganzen Norden.',
    // Social-/Weblinks (Rückseite). Nicht benötigte Zeilen entfernen.
    socials: [],
  },

  // --- Erscheinungsbild (streng schwarz-weiß, Format „rgb(r, g, b)") --------
  design: {
    background: 'rgb(0, 0, 0)', // reines Schwarz
    foreground: 'rgb(255, 255, 255)', // weiss (Haupttext)
    label: 'rgb(150, 150, 150)', // gedämpfte, gesperrte Labels
    accent: '#FFFFFF', // Sternfarbe / Akzent (monochrom)
    logoText: 'Webartelier Nord', // Schriftzug oben in der Karte
  },

  // --- Apple-Developer-Angaben ---------------------------------------------
  //  Werte lassen sich per Umgebungsvariable überschreiben (praktisch für CI):
  apple: {
    // Aus dem Portal → Identifiers → Pass Type IDs, z. B. "pass.com.webartelier.card"
    passTypeIdentifier: process.env.PASS_TYPE_ID ?? 'pass.com.webartelier.card',
    // Dein 10-stelliger Team-Identifier (oben rechts im Developer-Portal).
    teamIdentifier: process.env.PASS_TEAM_ID ?? 'ABCDE12345',
    // Wird in Wallet als Aussteller angezeigt.
    organizationName: process.env.PASS_ORG_NAME ?? 'Webartelier Nord',
    // Eindeutige Seriennummer – kann so bleiben; pro Karte einmalig.
    serialNumber: process.env.PASS_SERIAL ?? 'webartelier-nord-card-001',
  },

  // --- Pfade zu den Zertifikaten (siehe README.md, Schritt „Zertifikate") ---
  //  Relativ zu diesem Ordner. Diese Dateien NICHT committen (.gitignore).
  certs: {
    signerCert: './certs/signerCert.pem', // dein Pass-Type-ID-Zertifikat (PEM)
    signerKey: './certs/signerKey.pem', // zugehöriger privater Schlüssel (PEM)
    wwdr: './certs/wwdr.pem', // Apple WWDR-Zwischenzertifikat (PEM)
    // Passphrase des privaten Schlüssels; '' wenn keiner gesetzt ist.
    // Tipp: Besser per Umgebungsvariable setzen: PASS_KEY_PASSPHRASE=…
    signerKeyPassphrase: process.env.PASS_KEY_PASSPHRASE ?? '',
  },
};

// vCard-String, der als QR-Code in die Wallet-Karte eingebettet wird.
// Wer den Code scannt, kann Webartelier Nord direkt als Kontakt speichern.
export function buildVCard(c = config.contact) {
  const displayName = c.fullName || c.company;
  const [firstName, ...rest] = (c.fullName || '').split(' ');
  const lastName = rest.join(' ');
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    c.fullName ? `N:${lastName};${firstName};;;` : `N:${c.company};;;;`,
    `FN:${displayName}`,
    c.company && `ORG:${c.company}`,
    c.tagline && `TITLE:${c.tagline}`,
    c.phone && `TEL;TYPE=CELL:${c.phone}`,
    c.email && `EMAIL;TYPE=INTERNET:${c.email}`,
    c.website && `URL:${c.website}`,
    c.address && `ADR;TYPE=WORK:;;${c.address};;;;`,
    'END:VCARD',
  ].filter(Boolean);
  return lines.join('\n');
}
