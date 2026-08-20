// ============================================================================
//  Webatelier – Virtuelle Visitenkarte für Apple Wallet
//  ---------------------------------------------------------------------------
//  DIES IST DIE EINZIGE DATEI, DIE DU BEARBEITEN MUSST.
//  Trage unten deine Kontaktdaten und die Pfade zu deinen Apple-Zertifikaten
//  ein, dann:   node make-images.mjs   &&   node make-pass.mjs
// ============================================================================

export const config = {
  // --- Wer steht auf der Karte? --------------------------------------------
  contact: {
    fullName: 'Vorname Nachname',        // TODO: dein Name
    title: 'Web-Design & Entwicklung',   // Rolle / Position
    company: 'Webatelier',
    phone: '+41 00 000 00 00',           // TODO: Telefon (international, +41…)
    email: 'hallo@webatelier.com',       // TODO: E-Mail
    website: 'https://webatelier.com',
    // Adresse ist optional – leer lassen ('') zum Ausblenden.
    address: 'Musterstrasse 1, 8000 Zürich',
    // Kurzer Satz für die Rückseite der Wallet-Karte:
    about: 'Individuelle Websites, die verkaufen. Vom Konzept bis zum Launch.',
    // Social-Links (Rückseite). Nicht benötigte Zeilen einfach entfernen.
    socials: [
      { label: 'Instagram', value: 'https://instagram.com/webatelier' },
      { label: 'LinkedIn', value: 'https://linkedin.com/company/webatelier' },
    ],
  },

  // --- Erscheinungsbild (Wallet-Farben, Format „rgb(r, g, b)") --------------
  design: {
    background: 'rgb(18, 19, 23)',    // fast Schwarz, edel
    foreground: 'rgb(240, 238, 232)', // warmes Off-White (Haupttext)
    label: 'rgb(176, 170, 158)',      // gedämpfte Labels
    accent: '#C8A96A',                // warmes Gold fürs Monogramm/Logo
    logoText: 'Webatelier',           // Schriftzug oben in der Karte
    monogram: 'W',                    // Buchstabe im Icon/Logo
  },

  // --- Apple-Developer-Angaben ---------------------------------------------
  //  Beziehst du alles aus dem Apple Developer Portal (siehe README.md).
  //  Werte lassen sich per Umgebungsvariable überschreiben (praktisch für CI):
  apple: {
    // Aus dem Portal → Identifiers → Pass Type IDs, z. B. "pass.com.webatelier.card"
    passTypeIdentifier: process.env.PASS_TYPE_ID ?? 'pass.com.webatelier.card',
    // Dein 10-stelliger Team-Identifier (oben rechts im Developer-Portal).
    teamIdentifier: process.env.PASS_TEAM_ID ?? 'ABCDE12345',
    // Wird in Wallet als Aussteller angezeigt.
    organizationName: process.env.PASS_ORG_NAME ?? 'Webatelier',
    // Eindeutige Seriennummer – kann so bleiben; pro Person/Karte einmalig.
    serialNumber: process.env.PASS_SERIAL ?? 'webatelier-card-001',
  },

  // --- Pfade zu den Zertifikaten (siehe README.md, Schritt „Zertifikate") ---
  //  Relativ zu diesem Ordner. Diese Dateien NICHT committen (.gitignore).
  certs: {
    signerCert: './certs/signerCert.pem', // dein Pass-Type-ID-Zertifikat (PEM)
    signerKey: './certs/signerKey.pem',   // zugehöriger privater Schlüssel (PEM)
    wwdr: './certs/wwdr.pem',              // Apple WWDR-Zwischenzertifikat (PEM)
    // Passphrase des privaten Schlüssels; '' wenn keiner gesetzt ist.
    // Tipp: Besser per Umgebungsvariable setzen: PASS_KEY_PASSPHRASE=…
    signerKeyPassphrase: process.env.PASS_KEY_PASSPHRASE ?? '',
  },
};

// vCard-String, der als QR-Code in die Wallet-Karte eingebettet wird.
// Wer den Code scannt, kann dich direkt als Kontakt speichern.
export function buildVCard(c = config.contact) {
  const [firstName, ...rest] = c.fullName.split(' ');
  const lastName = rest.join(' ');
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName};;;`,
    `FN:${c.fullName}`,
    c.company && `ORG:${c.company}`,
    c.title && `TITLE:${c.title}`,
    c.phone && `TEL;TYPE=CELL:${c.phone}`,
    c.email && `EMAIL;TYPE=INTERNET:${c.email}`,
    c.website && `URL:${c.website}`,
    c.address && `ADR;TYPE=WORK:;;${c.address};;;;`,
    'END:VCARD',
  ].filter(Boolean);
  return lines.join('\n');
}
