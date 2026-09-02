# Referenz: Markendesign webartelier.com

Rechnungen und Verträge sollen im visuellen Stil von **webartelier.com**
erscheinen. Diese Datei hält die Design-Tokens fest, die aus der Website
abgeleitet wurden (shadcn/ui + Tailwind, konsequent monochrom, editorial). Die
Vorlagen in `assets/` setzen diese Tokens bereits um — hier zum Nachschlagen und
für konsistente Anpassungen.

## Markenkern

- **Stil:** minimalistisch, elegant, redaktionell. Viel Weißraum, feine Linien,
  keine bunten Flächen. Ruhe und Hochwertigkeit statt Signalfarben.
- **Wortmarke:** „Webartelier Nord" — in der Display-Serif, normale Groß-/
  Kleinschreibung.
- **Claim:** „Webseiten für Geschäfte in Norddeutschland".

## Farben (Light, für Druck maßgeblich)

| Rolle              | Wert       | Einsatz                                  |
|--------------------|------------|------------------------------------------|
| Hintergrund        | `#ffffff`  | Seitenhintergrund                        |
| Text / Primär      | `#19191a`  | Fließtext, Überschriften (fast Schwarz)  |
| Gedämpfter Text    | `#737373`  | Sekundärinfos, Fußzeile, Labels          |
| Linien / Rahmen    | `#e6e6e6`  | Tabellenlinien, Trenner                  |
| Fläche / Akzent    | `#f5f5f5`  | dezente Hinterlegung (z. B. Summenblock) |
| Kräftige Linie     | `#19191a`  | Kopf-/Summentrenner                      |

Herkunft (HSL-Tokens der Website): `--background: 0 0% 100%`,
`--foreground: 240 3% 10%`, `--muted-foreground: 0 0% 45%`,
`--border: 0 0% 90%`, `--muted/accent: 0 0% 96%`. Bewusst **keine**
Akzentfarbe — nicht eigenmächtig eine hinzufügen.

## Typografie

- **Display / Überschriften / Wortmarke:** `Fraunces`, Fallback
  `"Cormorant Garamond", Georgia, serif`.
- **Fließtext / Tabellen:** `Nunito`, Fallback `system-ui, "Segoe UI", sans-serif`.
- Geladen via Google Fonts (in den Vorlagen als `<link>` eingebunden). Ist beim
  PDF-Rendern kein Netz verfügbar, greifen die Serif-/Sans-Fallbacks — Layout
  bleibt stabil.
- Überschriften dürfen etwas größer und in der Serif gesetzt sein; Zahlen und
  Tabellen in Nunito für gute Lesbarkeit.

## Anwendung in den Vorlagen

- Kopf: Wortmarke „Webartelier Nord" in Fraunces, darunter dünn der Claim.
- Feine `#e6e6e6`-Linien, ein kräftiger `#19191a`-Trenner unter der Kopfzeile
  und über dem Gesamtbetrag.
- Summen-/Hinweisblock optional auf `#f5f5f5` hinterlegt.
- Fußzeile in gedämpftem `#737373`, klein.

Wenn der Nutzer später ein echtes Logo (SVG/PNG) liefert, im Kopf statt der
Wortmarke einbinden; Farb- und Schrifttokens bleiben gleich.
