# Webartelier Nord – Visitenkarte für Apple Wallet

Eine native **Apple-Wallet-Karte** (`.pkpass`) als digitale Visitenkarte für
Webartelier Nord, plus eine **Landing-Page** (`index.html`) im Kartendesign mit
„Zu Apple Wallet hinzufügen"-Button und vCard-Download – deployt auf
**Firebase Hosting**.

Alles läuft mit **Node.js** und **OpenSSL** – keine npm-Abhängigkeiten.

```
├── firebase.json     Firebase-Hosting-Konfiguration (Repo-Root)
├── .firebaserc       Firebase-Projekt-ID (Repo-Root)
└── wallet-card/
    ├── config.mjs        ← die EINZIGE Datei, die du bearbeiten musst
    ├── make-images.mjs   Erzeugt die Wallet-Bilder (Kompass-Stern-Logo)
    ├── make-pass.mjs     Baut & signiert webartelier.pkpass
    ├── build.mjs         Stellt die Seite in public/ zusammen (für Firebase)
    ├── index.html        Web-Visitenkarte (Wallet-Button + vCard)
    ├── lib/png.mjs       Kleiner PNG-Encoder (ohne Abhängigkeiten)
    ├── assets/           Generierte PNGs
    └── certs/            Deine Apple-Zertifikate (NICHT im Repo, per .gitignore)
```

---

## Wie wird die Karte signiert? (3 Wege)

Apple Wallet akzeptiert nur `.pkpass`-Dateien, die mit einem **von Apple
ausgestellten** Zertifikat signiert sind. Dafür gibt es drei Wege — `build.mjs`
wählt automatisch in dieser Reihenfolge:

1. **Eigenes Apple-Zertifikat** (`certs/`, siehe Abschnitt 2) → volle Kontrolle
   & eigenes Logo/Design. Baut über `make-pass.mjs`.
2. **WalletWallet-API** (Drittanbieter) → signiert die Karte mit deren
   Apple-Zertifikat. `WALLETWALLET_API_KEY=ww_live_… node make-pass-walletwallet.mjs`.
   Gratis, aber eigenes Logobild/Custom-Farben nur im Pro-Tarif.
3. **Vorhandene `webartelier.pkpass`** im Ordner → wird unverändert deployt
   (die aktuell eingecheckte Karte wurde über Weg 2 erzeugt).

> **Aktiv:** Die live geschaltete Karte nutzt Weg 2 (WalletWallet).
> Für das exakte schwarz-weisse Design mit Kompass-Logo auf Weg 1 wechseln.

---

## Schnellstart (in 3 Befehlen)

```bash
cd wallet-card

# 1) Deine Daten eintragen
$EDITOR config.mjs

# 2) Bilder erzeugen
node make-images.mjs

# 3) Karte bauen & signieren  (setzt die Zertifikate voraus, s. u.)
node make-pass.mjs
```

Ergebnis: **`webartelier.pkpass`** – auf iPhone/Mac öffnen → landet in Apple Wallet.

---

## 1. Daten eintragen

Öffne `config.mjs` und trage deine echten Werte ein:

- **`contact`** – Name, Rolle, Telefon, E-Mail, Website, Adresse, Social-Links
- **`design`** – Farben & Monogramm (Standard: dunkel mit goldenem „W")
- **`apple`** – `passTypeIdentifier`, `teamIdentifier`, `organizationName`

> Die Datei `index.html` enthält oben im `<script>` ein `CONTACT`-Objekt –
> trage dort dieselben Daten ein, damit die Web-Karte passt.

---

## 2. Apple-Zertifikate besorgen

Für eine **echte** Wallet-Karte verlangt Apple eine Signatur. Dafür brauchst du
eine **Apple-Developer-Mitgliedschaft** (99 $/Jahr) und drei PEM-Dateien im
Ordner `certs/`:

| Datei                   | Was es ist                                   |
| ----------------------- | -------------------------------------------- |
| `certs/signerCert.pem`  | Dein **Pass Type ID**-Zertifikat             |
| `certs/signerKey.pem`   | Der zugehörige **private Schlüssel**         |
| `certs/wwdr.pem`        | Apples **WWDR**-Zwischenzertifikat           |

### a) Pass Type ID anlegen

1. [developer.apple.com](https://developer.apple.com/account) → **Certificates,
   Identifiers & Profiles** → **Identifiers** → **+**
2. **Pass Type IDs** wählen → Bezeichner z. B. `pass.com.webatelier.card`
3. Diesen Wert in `config.mjs` unter `apple.passTypeIdentifier` eintragen.

### b) Zertifikat + Schlüssel erzeugen (ohne Mac, per OpenSSL)

```bash
cd wallet-card
mkdir -p certs

# Privaten Schlüssel + Zertifikatsanfrage (CSR) erstellen
openssl genrsa -out certs/signerKey.pem 2048
openssl req -new -key certs/signerKey.pem -out certs/request.csr \
  -subj "/emailAddress=hallo@webatelier.com/CN=Webatelier Pass/O=Webatelier/C=CH"
```

3. Im Portal: **Certificates → + → Pass Type ID Certificate**, die eben
   angelegte Pass Type ID wählen und die Datei **`certs/request.csr`** hochladen.
4. Das erzeugte Zertifikat (`pass.cer`) herunterladen und in PEM umwandeln:

```bash
openssl x509 -inform der -in pass.cer -out certs/signerCert.pem
```

> **Alternative (Mac/Keychain):** Wer das Zertifikat über Keychain Access
> erstellt, exportiert es als `Certificates.p12` und wandelt es um:
> ```bash
> openssl pkcs12 -in Certificates.p12 -clcerts -nokeys -out certs/signerCert.pem -legacy
> openssl pkcs12 -in Certificates.p12 -nocerts -nodes -out certs/signerKey.pem -legacy
> ```
> (`-legacy` ist bei OpenSSL 3 nötig.)

### c) WWDR-Zwischenzertifikat

Von <https://www.apple.com/certificateauthority/> die **Worldwide Developer
Relations – G4**-Datei laden und umwandeln:

```bash
openssl x509 -inform der -in AppleWWDRCAG4.cer -out certs/wwdr.pem
```

### d) Team-Identifier

Steht im Developer-Portal unter **Membership** (10-stellig, z. B. `A1B2C3D4E5`).
In `config.mjs` unter `apple.teamIdentifier` eintragen.

> **Wichtig:** `passTypeIdentifier` und `teamIdentifier` in `config.mjs` müssen
> exakt zum Zertifikat passen – sonst weigert sich Wallet, die Karte zu öffnen.

Hat der private Schlüssel eine Passphrase, setze sie beim Bauen:
```bash
PASS_KEY_PASSPHRASE='deinPasswort' node make-pass.mjs
```

---

## 3. Karte bauen

```bash
node make-images.mjs   # erzeugt assets/*.png
node make-pass.mjs      # erzeugt webatelier.pkpass
```

Zum Testen: `webatelier.pkpass` per AirDrop/E-Mail aufs iPhone schicken oder auf
dem Mac doppelklicken. Die Karte enthält einen **QR-Code (vCard)** – wer ihn
scannt, kann dich direkt als Kontakt speichern.

---

## 4. Online bereitstellen (Firebase Hosting)

Die Seite wird auf **Firebase Hosting** ausgeliefert. `firebase.json` setzt für
`*.pkpass` automatisch den korrekten MIME-Typ `application/vnd.apple.pkpass` –
den Apple Wallet zwingend braucht.

### Variante A — manuell vom eigenen Rechner (schnell)

```bash
# einmalig:
npm install -g firebase-tools
firebase login

# Projekt-ID in .firebaserc eintragen (statt DEIN_FIREBASE_PROJEKT_ID),
# oder einmalig verknüpfen:
firebase use --add

# Seite bauen und deployen:
node wallet-card/build.mjs        # erzeugt wallet-card/public/
firebase deploy --only hosting
```

Danach ist die Karte live unter `https://<projekt-id>.web.app`.

### Variante B — automatisch per GitHub Actions

Der Workflow **`.github/workflows/deploy-firebase.yml`** läuft bei jedem Push auf
den Wallet-Card-Branch (oder manuell über *Actions → Run workflow*), baut die
Seite und deployt sie auf Firebase. Dafür zwei Secrets setzen unter
**Repo → Settings → Secrets and variables → Actions**:

| Secret                     | Inhalt                                                             |
| -------------------------- | ----------------------------------------------------------------- |
| `FIREBASE_SERVICE_ACCOUNT` | JSON eines Firebase-Service-Accounts (Firebase Console → Projekt­einstellungen → Dienstkonten → *Neuen privaten Schlüssel generieren*) |
| `FIREBASE_PROJECT_ID`      | deine Firebase-Projekt-ID                                         |

### Zertifikate als GitHub-Secrets (für die Wallet-Karte)

Damit die CI die Karte **signieren** kann, ohne den privaten Schlüssel ins Repo
zu legen, die drei PEM-Dateien als Base64 hinterlegen:

```bash
cd wallet-card
base64 -w0 certs/signerCert.pem   # -> Secret PASS_SIGNER_CERT
base64 -w0 certs/signerKey.pem    # -> Secret PASS_SIGNER_KEY
base64 -w0 certs/wwdr.pem         # -> Secret PASS_WWDR
# (macOS ohne -w0:  base64 -i certs/signerCert.pem | tr -d '\n')
```

| Secret               | Inhalt                                              |
| -------------------- | --------------------------------------------------- |
| `PASS_SIGNER_CERT`   | Base64 von `signerCert.pem`                         |
| `PASS_SIGNER_KEY`    | Base64 von `signerKey.pem`                          |
| `PASS_WWDR`          | Base64 von `wwdr.pem`                               |
| `PASS_KEY_PASSPHRASE`| Passphrase des Schlüssels (nur falls gesetzt)       |
| `PASS_TEAM_ID`       | dein 10-stelliger Team-Identifier                   |
| `PASS_TYPE_ID`       | z. B. `pass.com.webartelier.card`                   |
| `PASS_ORG_NAME`      | z. B. `Webartelier Nord`                            |

Ohne diese Zertifikate geht die Seite trotzdem live – der Wallet-Button zeigt
dann „in Vorbereitung" und wird automatisch scharf, sobald die Secrets gesetzt
sind und der Deploy erneut läuft.

---

## Sicherheit

- **Zertifikate niemals committen.** `certs/`, `*.pem`, `*.p12`, `*.key` sind
  bereits über `.gitignore` ausgeschlossen.
- Der private Schlüssel (`signerKey.pem`) ist so sensibel wie ein Passwort.
