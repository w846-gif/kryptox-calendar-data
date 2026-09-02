---
name: deutsche-rechnung-vertrag
description: >-
  Erstellt rechtskonforme deutsche Rechnungen und Freelancer-/Dienstverträge als
  fertiges PDF. Nutze diesen Skill immer, wenn der Nutzer eine Rechnung, Faktura,
  Honorarrechnung, Gutschrift, Kleinbetragsrechnung oder einen Dienst-,
  Freelancer- bzw. Honorarvertrag nach deutschem Recht schreiben, aufsetzen oder
  ausstellen will — auch wenn Begriffe wie "Rechnung schreiben", "in Rechnung
  stellen", "Vertrag aufsetzen", "§14 UStG", "Kleinunternehmer", "§19 UStG",
  "Werkvertrag", "NDA" oder "Freelancer-Vertrag" fallen, ohne dass ausdrücklich
  ein PDF verlangt wird. Deckt Regelbesteuerung (19 %/7 %, gemischt) und die
  Kleinunternehmerregelung ab, vergibt lückenlose fortlaufende Rechnungsnummern
  über ein Register und prüft die Pflichtangaben. Kein Ersatz für Steuer-/
  Rechtsberatung.
---

# Deutsche Rechnungen & Verträge

Dieser Skill erzeugt **rechtskonforme deutsche Rechnungen** und **Freelancer-/
Dienstverträge** und gibt sie als sauber gestaltetes **PDF** aus. Er kennt die
gesetzlichen Pflichtangaben, rechnet die Umsatzsteuer korrekt und vergibt
lückenlose Rechnungsnummern.

Wichtig vorweg: Du bist kein Anwalt und kein Steuerberater. Erstelle
gewissenhaft und weise am Ende **einmal kurz** darauf hin, dass individuelle
oder heikle Fälle fachlich geprüft werden sollten — aber ohne den Nutzer mit
Disclaimern zuzutexten.

## Scope (bewusst festgelegt)

Der Nutzer hat den Umfang eingegrenzt, damit der Skill schlank und zuverlässig
bleibt. Halte dich daran; bei Bedarf außerhalb weise kurz hin, statt zu raten.

- **Ausgabe:** PDF.
- **Umsatzsteuer:** Regelbesteuerung mit **19 % und 7 %**, auch **gemischt** in
  einer Rechnung — *und* **Kleinunternehmer nach § 19 UStG** (kein USt-Ausweis).
- **Rechnungsnummern:** automatisch aus einem **Register im Repo**, lückenlos.
- **Empfängerkreis:** **Inland (Deutschland)**. Reverse Charge (§ 13b),
  innergemeinschaftliche Lieferung und Drittland sind *nicht* eingebaut — kommt
  ein EU-/Auslandsfall, sag das offen und biete an, den Skill zu erweitern.
- **E-Rechnung:** vorerst **PDF**. Merke den Hinweis zur B2B-E-Rechnungspflicht
  an (siehe `references/rechnung.md`), erzeuge aber kein XRechnung/ZUGFeRD.
- **Verträge:** **Dienst-/Freelancer-Vertrag** (§ 611 BGB) mit optionalen
  Bausteinen (Nutzungsrechte/IP, Haftungsbegrenzung, DSGVO/AVV,
  Wettbewerbs-/Abwerbeverbot).

## Ablauf

### 1. Aufgabe erkennen

Entscheide zuerst: **Rechnung** oder **Vertrag**? Bei Unklarheit kurz fragen.
Dann die passende Referenz lesen — sie enthält die rechtlichen Details, damit du
nichts vergisst:

- Rechnung → lies `references/rechnung.md`
- Vertrag → lies `references/vertrag.md`

### 2. Daten sammeln

Frag **nur, was fehlt**. Vieles gibt der Nutzer schon in der ersten Nachricht
mit; übernimm das und frag gebündelt nach dem Rest (eine Rückfrage-Runde, nicht
zehn Einzelfragen).

**Absender-Profil zuerst prüfen:** Existiert `rechnungen/absender-profil.json`
im Repo, nutze die dortigen Firmen-/Absenderdaten als Vorbelegung und frag sie
**nicht** erneut ab. Enthält ein Pflichtfeld noch `AUSFUELLEN`, fehlt der echte
Wert — dann **einmal gezielt nachfragen** und den echten Wert eintragen. Erfinde
niemals Steuernummer, USt-IdNr. oder IBAN. Gibt es kein Profil, erhebe die
Absenderdaten im Gespräch (ohne sie zu speichern).

Für eine **Rechnung** brauchst du mindestens:

- **Absender** (leistender Unternehmer): Name/Firma, vollständige Anschrift,
  **Steuernummer oder USt-IdNr.**, Bankverbindung (IBAN/BIC, Kontoinhaber).
- **Besteuerung:** Regelbesteuerung *oder* Kleinunternehmer (§ 19). Wenn unklar,
  frag explizit — das ändert den kompletten USt-Teil.
- **Empfänger:** Name/Firma, vollständige Anschrift.
- **Positionen:** je Position Bezeichnung, Menge/Einheit *oder* Stunden,
  Einzelpreis/Stundensatz *oder* Pauschale, und (bei Regelbesteuerung) den
  **Steuersatz je Position** (19 % oder 7 %). Die Vorlage ist flexibel: Menge ×
  Einzelpreis, Stunden × Satz und Pauschalen sind mischbar.
- **Leistungsdatum/-zeitraum** (Pflicht — darf mit dem Rechnungsdatum
  zusammenfallen, dann Hinweis "Leistungsdatum entspricht Rechnungsdatum").
- **Rechnungsdatum** (Standard: heute).
- **Zahlungsziel:** Default **14 Tage, ohne Skonto** — überschreibbar.
- Optional: Betreff/Projekt, Bestell-/Referenznummer, Skonto, Rabatt.

Die **Rechnungsnummer** vergibt der Skill selbst (Schritt 3) — frag nicht danach.

Für einen **Vertrag** brauchst du mindestens: beide Vertragsparteien (vollständig),
Leistungsgegenstand, Vergütung (Honorar/Stundensatz/Pauschale + Fälligkeit),
Laufzeit und Kündigung, sowie welche der optionalen Klauseln gewünscht sind.
Details und Formulierungen in `references/vertrag.md`.

### 3. Rechnungsnummer ziehen (nur Rechnung)

Nummern müssen **einmalig und fortlaufend** sein (§ 14 UStG). Der Skill führt
dafür ein Register. Nutze das Hilfsskript — es liest den Zähler, vergibt die
nächste Nummer und schreibt sie zurück (idempotent pro Aufruf):

```bash
python3 .claude/skills/deutsche-rechnung-vertrag/scripts/naechste_rechnungsnummer.py
```

Es gibt die neue Nummer aus (Format `JAHR-NNNN`, z. B. `2026-0001`) und legt/
aktualisiert `rechnungen/rechnungsregister.json` im Repo-Root. Details und das
Format-Schema stehen in `references/rechnung.md` → "Rechnungsnummern-Register".
Storniere eine gezogene Nummer nicht durch Wiederverwenden — bei Abbruch bleibt
die Lücke sichtbar; das ist gewollt und dokumentiert.

### 4. PDF erzeugen

Fülle die passende HTML-Vorlage und wandle sie in ein PDF um.

- Rechnung → `assets/rechnung-vorlage.html`
- Vertrag → `assets/vertrag-vorlage.html`

Ersetze die `{{platzhalter}}` und baue die Positions-/Klausel-Zeilen dynamisch
zusammen. Rechenwerte (Zwischensumme, USt je Satz, Gesamt) **immer selbst
rechnen**, nie den Nutzer rechnen lassen — Nachkommastellen kaufmännisch runden.

HTML → PDF, in dieser Reihenfolge probieren:

1. Ist der **`pdf`-Skill** verfügbar, nutze ihn für die HTML→PDF-Konvertierung.
2. Sonst headless Chromium (im Web-Environment vorinstalliert):
   ```bash
   chromium --headless --disable-gpu --no-sandbox \
     --print-to-pdf=/pfad/rechnung.pdf /pfad/gefuellt.html
   ```
3. Sonst `weasyprint gefuellt.html rechnung.pdf`.

Speichere das PDF an einen sinnvollen Ort (z. B. `rechnungen/2026-0001.pdf` bzw.
`vertraege/<name>.pdf`) und liefere es dem Nutzer mit `SendUserFile` aus.

### 5. Prüfen und übergeben

Bevor du das PDF übergibst, geh die **Checkliste** in der jeweiligen Referenz
durch (Pflichtangaben nach § 14 UStG bzw. Vertrags-Mindestinhalte). Fehlt eine
Pflichtangabe, hol sie nach — ein PDF mit fehlender Pflichtangabe ist wertlos.

Fasse dem Nutzer in 2–3 Zeilen zusammen: welche Nummer vergeben wurde, Netto/USt/
Brutto (bzw. § 19-Hinweis) und wo das PDF liegt. Ein *kurzer* Hinweis, dass
individuelle Fälle fachlich zu prüfen sind, gehört ans Ende — mehr nicht.

## Wiederverwendbare Bausteine

- `references/rechnung.md` — Pflichtangaben § 14 UStG, § 19 Kleinunternehmer,
  § 33 UStDV Kleinbetragsrechnung, USt-Berechnung, GoBD/Aufbewahrung,
  E-Rechnung, Nummern-Register, Prüf-Checkliste.
- `references/vertrag.md` — Aufbau Dienst-/Freelancer-Vertrag, optionale Klauseln
  im Wortlaut, Scheinselbständigkeit, Prüf-Checkliste.
- `assets/rechnung-vorlage.html` / `assets/vertrag-vorlage.html` — Layout-Vorlagen.
- `scripts/naechste_rechnungsnummer.py` — lückenlose Nummernvergabe.
