const https = require('https');
const crypto = require('crypto');

function validateToken(token) {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const lastColon = decoded.lastIndexOf(':');
    const sig = decoded.slice(lastColon + 1);
    const payload = decoded.slice(0, lastColon);
    const expire = payload.slice(payload.indexOf(':') + 1);
    if (Date.now() > parseInt(expire, 10)) return false;
    const secret = process.env.SESSION_SECRET || 'dev-secret-inseguro';
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    if (sig.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch { return false; }
}

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') return res.status(405).end();

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!validateToken(token)) return res.status(401).json({ error: 'No autorizado' });

  const fileId = req.body && req.body.fileId;
  if (!fileId || typeof fileId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
    return res.status(400).json({ error: 'fileId inválido' });
  }

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) return res.status(500).json({ error: 'ImageKit no configurado' });

  const credentials = Buffer.from(`${privateKey}:`).toString('base64');
  const options = {
    hostname: 'api.imagekit.io',
    path: `/v1/files/${encodeURIComponent(fileId)}`,
    method: 'DELETE',
    headers: { Authorization: `Basic ${credentials}` },
  };

  const ikReq = https.request(options, (ikRes) => {
    if (ikRes.statusCode === 204) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ ok: true });
    }
    let data = '';
    ikRes.on('data', c => { data += c; });
    ikRes.on('end', () => res.status(502).json({ error: data }));
  });
  ikReq.on('error', () => res.status(500).json({ error: 'Error de conexión' }));
  ikReq.end();
};
