# kryptox-calendar-data

Kleiner Daten-Relay für den KryptoX-Wirtschaftskalender.

Ein GitHub-Actions-Job (`.github/workflows/update.yml`) holt alle 30 Minuten
den öffentlichen Forex-Factory-Wochen-Feed serverseitig ab und committed ihn
als `events.json` in dieses Repo. Damit ist kein CORS-Proxy und kein
eigenes Backend nötig — der KryptoX-Trading-Kurs lädt die Datei direkt per
`https://raw.githubusercontent.com/w846-gif/kryptox-calendar-data/main/events.json`
(sendet `Access-Control-Allow-Origin: *`, also im Browser direkt ladbar).
