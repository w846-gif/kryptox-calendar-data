// Holt den öffentlichen Forex-Factory-Wochen-Feed serverseitig (GitHub
// Actions Runner hat kein CORS-Problem) und schreibt ihn als events.json
// in dieses Repo. Der Runner committed/pusht die Datei bei Änderungen.
// Ausgeliefert wird sie danach per raw.githubusercontent.com (sendet
// Access-Control-Allow-Origin: * — im Browser direkt ladbar, kein Proxy nötig).
const FEED_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';

const res = await fetch(FEED_URL, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; KryptoX-Calendar-Relay/1.0; +https://krypto-x.com)',
    Accept: 'application/json',
  },
});

if (!res.ok) {
  throw new Error(`Feed-Fehler: HTTP ${res.status}`);
}

const data = await res.json();

if (!Array.isArray(data)) {
  throw new Error('Unerwartetes Feed-Format (kein Array)');
}

const output = {
  updatedAt: new Date().toISOString(),
  count: data.length,
  events: data,
};

const fs = await import('node:fs/promises');
await fs.writeFile('events.json', JSON.stringify(output, null, 2) + '\n', 'utf-8');

console.log(`OK — ${data.length} Events geschrieben (${output.updatedAt}).`);
