# Webatelier – Visitenkarte für Apple Wallet

Eine native **Apple-Wallet-Karte** (`.pkpass`) als digitale Visitenkarte für
Webatelier, plus eine **Landing-Page** (`index.html`) mit „Zu Apple Wallet
hinzufügen"-Button und vCard-Download.

Alles läuft mit **Node.js** und **OpenSSL** – keine npm-Abhängigkeiten.

```
wallet-card/
├── config.mjs        ← die EINZIGE Datei, die du bearbeiten musst
├── make-images.mjs   Erzeugt die Wallet-Bilder (Icon + Logo)
├── make-pass.mjs     Baut & signiert webatelier.pkpass
├── index.html        Web-Visitenkarte (Wallet-Button + vCard)
├── lib/png.mjs       Kleiner PNG-Encoder (ohne Abhängigkeiten)
├── assets/           Generierte PNGs
└── certs/            Deine Apple-Zertifikate (NICHT im Repo, per .gitignore)
```

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

Ergebnis: **`webatelier.pkpass`** – auf iPhone/Mac öffnen → landet in Apple Wallet.

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

## 4. Online bereitstellen (GitHub Pages – automatisch)

Im Repo liegt der Workflow **`.github/workflows/deploy-wallet-card.yml`**. Er
läuft bei jedem Push auf den Wallet-Card-Branch (oder manuell über
*Actions → Deploy Wallet Card → Run workflow*) und veröffentlicht die Seite auf
**GitHub Pages**:

```
https://<user>.github.io/<repo>/
```

Der Workflow:
1. erzeugt die Bilder (`make-images.mjs`),
2. baut die **signierte `.pkpass`** – *aber nur, wenn die Zertifikat-Secrets
   gesetzt sind* (siehe unten); sonst geht die Seite ohne `.pkpass` live und der
   Wallet-Button zeigt „in Vorbereitung",
3. deployt `index.html`, `assets/` und (falls vorhanden) `webatelier.pkpass`.

GitHub Pages liefert `.pkpass` automatisch mit dem korrekten MIME-Typ
`application/vnd.apple.pkpass` aus – kein manuelles Setup nötig.

### Zertifikate als GitHub-Secrets hinterlegen

Damit die CI die Karte signieren kann, ohne den privaten Schlüssel ins Repo zu
legen, kodierst du die drei PEM-Dateien als Base64 und trägst sie unter
**Repo → Settings → Secrets and variables → Actions** ein:

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
| `PASS_TYPE_ID`       | z. B. `pass.com.webatelier.card`                    |
| `PASS_ORG_NAME`      | z. B. `Webatelier`                                  |

Nach dem Setzen der Secrets einmal den Workflow neu ausführen – der
Wallet-Button wird automatisch scharf.

> **Eigener Server statt Pages?** `index.html`, `assets/` und `webatelier.pkpass`
> zusammen hochladen und den MIME-Typ setzen (z. B. `.htaccess`:
> `AddType application/vnd.apple.pkpass .pkpass`).

---

## Sicherheit

- **Zertifikate niemals committen.** `certs/`, `*.pem`, `*.p12`, `*.key` sind
  bereits über `.gitignore` ausgeschlossen.
- Der private Schlüssel (`signerKey.pem`) ist so sensibel wie ein Passwort.
