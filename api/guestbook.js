// Vercel/Serverless function for guestbook backed by Supabase
// Requires environment variables:
//  - SUPABASE_URL (e.g., https://xxxx.supabase.co)
//  - SUPABASE_SERVICE_ROLE (service role key) for writes
//  - SUPABASE_ANON (optional; if provided, used for reads)

const fetchImpl = global.fetch || require('node-fetch');

function json(res, code, data) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,apikey');
  res.end(JSON.stringify(data));
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {});

  const URL = process.env.SUPABASE_URL;
  const KEY_WRITE = process.env.SUPABASE_SERVICE_ROLE;
  const KEY_READ = process.env.SUPABASE_ANON || KEY_WRITE;
  if (!URL || !KEY_WRITE) {
    return json(res, 501, { error: 'Not configured: SUPABASE_URL / SUPABASE_SERVICE_ROLE' });
  }

  const table = 'guestbook';
  if (req.method === 'GET') {
    try {
      const r = await fetchImpl(`${URL}/rest/v1/${table}?select=*&order=ts.desc`, {
        headers: { apikey: KEY_READ, Authorization: `Bearer ${KEY_READ}` },
      });
      if (!r.ok) throw new Error('fetch failed');
      const data = await r.json();
      return json(res, 200, data);
    } catch (e) {
      return json(res, 502, { error: 'Upstream error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = await new Promise((resolve, reject) => {
        let acc = '';
        req.on('data', (c) => { acc += c; if (acc.length > 1e6) reject(new Error('too big')); });
        req.on('end', () => resolve(acc));
        req.on('error', reject);
      });
      const obj = JSON.parse(body || '{}');
      const name = String(obj.name || '').trim();
      const text = String(obj.text || '').trim();
      const stars = Math.max(1, Math.min(5, Number(obj.stars || 5)));
      if (!name || !text) return json(res, 400, { error: 'Invalid payload' });
      const entry = { name, text, stars, ts: new Date().toISOString() };
      const r = await fetchImpl(`${URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          apikey: KEY_WRITE,
          Authorization: `Bearer ${KEY_WRITE}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(entry),
      });
      if (!r.ok) throw new Error('insert failed');
      const data = await r.json();
      return json(res, 201, Array.isArray(data) ? data[0] : entry);
    } catch (e) {
      return json(res, 502, { error: 'Upstream insert error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const r = await fetchImpl(`${URL}/rest/v1/${table}?id=gt.0`, {
        method: 'DELETE',
        headers: { apikey: KEY_WRITE, Authorization: `Bearer ${KEY_WRITE}` },
      });
      if (!r.ok) throw new Error('delete failed');
      return json(res, 204, {});
    } catch (e) {
      return json(res, 502, { error: 'Upstream delete error' });
    }
  }

  return json(res, 405, { error: 'Method Not Allowed' });
};
