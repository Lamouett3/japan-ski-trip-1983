const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'guestbook.json');

function ensureDataFile() {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (_) {}
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }
}

function readAll() {
  ensureDataFile();
  try {
    const buf = fs.readFileSync(DATA_FILE, 'utf8');
    const arr = JSON.parse(buf);
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

function append(entry) {
  const arr = readAll();
  arr.push(entry);
  fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), 'utf8');
}

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/guestbook' && req.method === 'GET') {
    const data = readAll();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(data));
  }
  if (url.pathname === '/api/guestbook' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 1e6) req.socket.destroy(); });
    req.on('end', () => {
      try {
        const obj = JSON.parse(body || '{}');
        const name = String(obj.name || '').trim();
        const text = String(obj.text || '').trim();
        let stars = Number(obj.stars || 5);
        if (!name || !text) { throw new Error('invalid'); }
        stars = Math.max(1, Math.min(5, stars));
        const entry = { name, text, stars, ts: Date.now() };
        append(entry);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(entry));
      } catch (_) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Bad Request' }));
      }
    });
    return;
  }
  if (url.pathname === '/api/guestbook' && req.method === 'DELETE') {
    ensureDataFile();
    try { fs.writeFileSync(DATA_FILE, '[]', 'utf8'); } catch(_){ /* ignore */ }
    res.writeHead(204, { 'Content-Type': 'application/json' });
    return res.end();
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Guestbook API listening on http://localhost:' + PORT);
});
