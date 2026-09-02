#!/usr/bin/env python3
"""Vergibt die naechste lueckenlose Rechnungsnummer im Format JAHR-MONAT-NNNN.

Der Zaehler laeuft pro Monat und startet in jedem Monat neu bei 0001, z. B.
2026-09-0001, 2026-09-0002, 2026-10-0001. Die Nummern muessen nach § 14 UStG
einmalig und fortlaufend sein; das Register dokumentiert jede vergebene Nummer,
sodass eine Luecke (etwa bei Abbruch) nachvollziehbar bleibt.

Aufruf:
    python3 naechste_rechnungsnummer.py            # naechste Nummer, aktueller Monat
    python3 naechste_rechnungsnummer.py --peek     # nur anzeigen, NICHT vergeben
    python3 naechste_rechnungsnummer.py --datum 2026-10-05   # fuer bestimmten Monat
    python3 naechste_rechnungsnummer.py --register pfad/zum/register.json

Das Register liegt standardmaessig unter <repo-root>/rechnungen/rechnungsregister.json.
Repo-Root wird ueber `git rev-parse --show-toplevel` bestimmt; klappt das nicht,
wird das aktuelle Arbeitsverzeichnis genommen.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import subprocess
import sys
from pathlib import Path


def repo_root() -> Path:
    try:
        out = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            capture_output=True, text=True, check=True,
        )
        return Path(out.stdout.strip())
    except Exception:
        return Path.cwd()


def default_register_path() -> Path:
    return repo_root() / "rechnungen" / "rechnungsregister.json"


def load_register(path: Path) -> dict:
    if path.exists():
        with path.open("r", encoding="utf-8") as fh:
            data = json.load(fh)
    else:
        data = {}
    data.setdefault("format", "JAHR-MONAT-NNNN")
    data.setdefault("zaehler_pro_monat", {})  # "2026-09" -> letzte laufende Nummer
    data.setdefault("vergeben", [])            # Liste aller vergebenen Nummern (Audit)
    return data


def save_register(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)
        fh.write("\n")


def naechste_nummer(data: dict, monat_key: str) -> str:
    letzte = data["zaehler_pro_monat"].get(monat_key, 0)
    neue = letzte + 1
    return f"{monat_key}-{neue:04d}"


def main() -> int:
    p = argparse.ArgumentParser(description="Naechste deutsche Rechnungsnummer (JAHR-MONAT-NNNN).")
    p.add_argument("--register", type=Path, default=None, help="Pfad zur Registerdatei.")
    p.add_argument("--datum", type=str, default=None, help="Bezugsdatum YYYY-MM-DD (Default: heute).")
    p.add_argument("--peek", action="store_true", help="Nur anzeigen, nicht vergeben/speichern.")
    args = p.parse_args()

    if args.datum:
        try:
            tag = dt.date.fromisoformat(args.datum)
        except ValueError:
            print(f"Ungueltiges Datum: {args.datum} (erwartet YYYY-MM-DD)", file=sys.stderr)
            return 2
    else:
        tag = dt.date.today()
    monat_key = f"{tag.year:04d}-{tag.month:02d}"

    reg_path = args.register or default_register_path()
    data = load_register(reg_path)
    nummer = naechste_nummer(data, monat_key)

    if args.peek:
        print(nummer)
        return 0

    data["zaehler_pro_monat"][monat_key] = int(nummer.rsplit("-", 1)[1])
    data["vergeben"].append({
        "nummer": nummer,
        "vergeben_am": dt.datetime.now().isoformat(timespec="seconds"),
    })
    save_register(reg_path, data)
    print(nummer)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
