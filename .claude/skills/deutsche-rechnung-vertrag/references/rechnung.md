# Referenz: Deutsche Rechnung

Diese Datei bündelt die rechtlichen Anforderungen an eine deutsche Rechnung, die
Berechnungslogik und die Prüf-Checkliste. Rechtsstand: laufende Praxis; im
Zweifel oder bei heiklen Fällen fachlich prüfen lassen.

## Inhaltsverzeichnis
1. Pflichtangaben nach § 14 UStG (Regelrechnung)
2. Kleinunternehmer (§ 19 UStG)
3. Kleinbetragsrechnung (§ 33 UStDV, bis 250 € brutto)
4. Umsatzsteuer richtig rechnen (19 % / 7 % / gemischt)
5. Rechnungsnummern-Register
6. Zahlungsbedingungen, Skonto, Verzug
7. GoBD, Aufbewahrung, E-Rechnung
8. Prüf-Checkliste (vor PDF-Ausgabe abarbeiten)

---

## 1. Pflichtangaben nach § 14 Abs. 4 UStG

Jede Regelrechnung (über 250 € brutto) muss enthalten:

1. **Vollständiger Name und Anschrift des leistenden Unternehmers** (Absender).
2. **Vollständiger Name und Anschrift des Leistungsempfängers** (Kunde).
3. **Steuernummer oder USt-IdNr.** des leistenden Unternehmers.
4. **Ausstellungsdatum** (Rechnungsdatum).
5. **Fortlaufende, einmalige Rechnungsnummer** (eine oder mehrere Zahlenreihen).
6. **Menge und handelsübliche Bezeichnung** der Lieferung bzw. **Umfang und Art**
   der sonstigen Leistung.
7. **Zeitpunkt der Lieferung/Leistung** oder Leistungszeitraum. Fällt er mit dem
   Rechnungsdatum zusammen, genügt der Hinweis „Leistungsdatum entspricht
   Rechnungsdatum". Dieser Punkt wird oft vergessen — nie weglassen.
8. **Nach Steuersätzen aufgeschlüsseltes Netto-Entgelt** sowie jede im Voraus
   vereinbarte **Entgeltminderung** (z. B. Skonto), sofern nicht schon abgezogen.
9. **Anzuwendender Steuersatz** und der **Steuerbetrag** — oder bei Steuerbefreiung
   ein entsprechender **Hinweis** (siehe § 19).

Bei Rechnungssummen über 10.000 € (bzw. je nach Fall) kann zusätzlich die
USt-IdNr. relevant sein; für reine Inlandsgeschäfte reicht die Steuernummer.

## 2. Kleinunternehmer (§ 19 UStG)

Wer die Kleinunternehmerregelung nutzt, **weist keine Umsatzsteuer aus**:

- **Kein** Steuersatz, **kein** Steuerbetrag in den Positionen oder der Summe.
- Stattdessen ein **Pflichthinweis**, z. B.:
  > „Gemäß § 19 UStG wird keine Umsatzsteuer berechnet."
- Alle übrigen Pflichtangaben aus § 14 gelten weiter (Nummer, Anschriften,
  Leistungsdatum usw.).
- Der Gesamtbetrag ist zugleich der zu zahlende Betrag (keine Netto/Brutto-
  Aufteilung).

Achtung: Ein versehentlich ausgewiesener USt-Betrag würde nach § 14c UStG
geschuldet — bei § 19 also niemals einen Steuersatz oder -betrag anzeigen.

## 3. Kleinbetragsrechnung (§ 33 UStDV)

Bis **250 € brutto** genügen vereinfachte Angaben:

- Name und Anschrift des leistenden Unternehmers,
- Ausstellungsdatum,
- Menge/Art der Leistung,
- **Bruttobetrag** und der darin enthaltene **Steuersatz** (bzw. Hinweis auf
  Steuerbefreiung / § 19).

Nicht erforderlich: Empfängeranschrift, Rechnungsnummer, getrennter Steuerausweis.
Nutze diese Vereinfachung nur, wenn der Nutzer sie ausdrücklich will — im Zweifel
die vollständige Rechnung, die ist immer zulässig.

## 4. Umsatzsteuer richtig rechnen

Positionen können 19 % oder 7 % tragen (mischbar). Rechne **immer selbst**:

1. Je Position: `Positions-Netto = Menge × Einzelpreis` (bzw. `Stunden × Satz`,
   oder Pauschale). Rabatt je Position vorher abziehen.
2. **Netto je Steuersatz** summieren (alle 19-%-Positionen, alle 7-%-Positionen).
3. **USt je Steuersatz** = `Netto(Satz) × Satz`.
4. **Gesamt-Netto** = Summe aller Netto-Beträge.
5. **Gesamt-USt** = Summe der USt-Beträge je Satz.
6. **Brutto (Gesamtbetrag)** = Gesamt-Netto + Gesamt-USt.

Runde kaufmännisch auf 2 Nachkommastellen. Bei gemischten Sätzen die USt in der
Summenbox **pro Satz getrennt** ausweisen (§ 14-Pflicht), z. B.:

```
Zwischensumme (netto)          1.200,00 €
zzgl. 19 % USt auf 1.000,00 €    190,00 €
zzgl.  7 % USt auf   200,00 €     14,00 €
Gesamtbetrag                   1.404,00 €
```

Bei § 19 entfallen die USt-Zeilen; es gibt nur einen Gesamtbetrag.

Skonto/Rabatt: Ein vereinbartes Skonto ist auf der Rechnung anzugeben
(„2 % Skonto bei Zahlung bis TT.MM.JJJJ"). Der Skontobetrag mindert später das
Entgelt und die USt — auf der Rechnung selbst nur ausweisen, nicht vorab abziehen.

## 5. Rechnungsnummern-Register

Format: **`JAHR-MONAT-NNNN`** (z. B. `2026-09-0001`). Der laufende Zähler `NNNN`
**startet pro Monat neu** bei `0001`. Nummern werden über das Skript vergeben:

```bash
python3 .claude/skills/deutsche-rechnung-vertrag/scripts/naechste_rechnungsnummer.py
```

Das Skript pflegt `rechnungen/rechnungsregister.json` im Repo-Root:

```json
{
  "format": "JAHR-MONAT-NNNN",
  "zaehler_pro_monat": { "2026-09": 2 },
  "vergeben": [
    { "nummer": "2026-09-0001", "vergeben_am": "2026-09-02T10:00:00" },
    { "nummer": "2026-09-0002", "vergeben_am": "2026-09-02T10:05:00" }
  ]
}
```

Regeln:
- Jede Nummer wird **genau einmal** vergeben. Bricht die Erstellung ab, ist die
  Nummer trotzdem verbraucht — eine sichtbare Lücke ist gewollt und
  dokumentierbar (Lücken sind erlaubt, solange keine Nummer doppelt auftaucht).
- Mit `--peek` nur anschauen, ohne zu vergeben.
- Mit `--datum YYYY-MM-DD` für einen anderen Monat vergeben (z. B. Nachtrag).
- Das Register **committen**, damit der Zählerstand erhalten bleibt.

## 6. Zahlungsbedingungen, Skonto, Verzug

- **Default-Zahlungsziel: 14 Tage ohne Abzug** (überschreibbar).
- Zahlbar mit Angabe der **Rechnungsnummer** als Verwendungszweck.
- **Bankverbindung** (Kontoinhaber, IBAN, BIC) gehört auf die Rechnung.
- Optionaler Verzugshinweis ist zulässig, aber kein Pflichtinhalt. Gesetzlicher
  Verzug tritt bei Geschäftskunden i. d. R. 30 Tage nach Zugang/Fälligkeit ein
  (§ 286 BGB) — nicht als feste Drohklausel einbauen, nur auf Wunsch.

## 7. GoBD, Aufbewahrung, E-Rechnung

- **Aufbewahrungsfrist: 10 Jahre** (§ 14b UStG, § 147 AO). Ausgangsrechnungen
  unveränderbar archivieren.
- **E-Rechnungspflicht (B2B):** Seit **1.1.2025** müssen inländische Unternehmen
  E-Rechnungen **empfangen** können; die Pflicht zum **Ausstellen** strukturierter
  E-Rechnungen (XRechnung/ZUGFeRD nach EN 16931) greift **schrittweise ab 2027/
  2028** je nach Umsatz. Ein reines PDF ist übergangsweise noch zulässig, gilt
  aber künftig als „sonstige Rechnung", nicht als E-Rechnung. Weise darauf hin,
  wenn der Empfänger Geschäftskunde ist; die strukturierte Ausgabe ist in diesem
  Skill (noch) nicht enthalten.

## 8. Prüf-Checkliste (vor PDF-Ausgabe abarbeiten)

- [ ] Absender vollständig inkl. **Steuernummer oder USt-IdNr.**
- [ ] Empfänger vollständig (bei Kleinbetragsrechnung optional)
- [ ] **Rechnungsnummer** aus dem Skript gezogen, Format `JAHR-MONAT-NNNN`
- [ ] **Rechnungsdatum** gesetzt
- [ ] **Leistungsdatum/-zeitraum** angegeben (nie vergessen!)
- [ ] Jede Position: Bezeichnung, Menge/Einheit bzw. Stunden, Einzelpreis/Satz
- [ ] Regelbesteuerung: **Steuersatz je Position** + USt **je Satz** getrennt
- [ ] § 19: **kein** USt-Ausweis, aber der **§-19-Hinweis** ist vorhanden
- [ ] Netto/USt/Brutto (bzw. Gesamtbetrag bei § 19) korrekt gerechnet
- [ ] Zahlungsziel + **Bankverbindung** angegeben
- [ ] Rechenprobe: Summe der Positionen = ausgewiesenes Netto
