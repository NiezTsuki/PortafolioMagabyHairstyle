const crypto = require('crypto');

function validateToken(token) {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const lastColon = decoded.lastIndexOf(':');
    const sig = decoded.slice(lastColon + 1);
    const payload = decoded.slice(0, lastColon);
    const colonIdx = payload.indexOf(':');
    const expire = payload.slice(colonIdx + 1);
    if (Date.now() > parseInt(expire, 10)) return false;
    const secret = process.env.SESSION_SECRET || 'dev-secret-inseguro';
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    if (sig.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

const ALLOWED_CATEGORIES = new Set(['civil', 'eclesiastico', 'hindu', 'china']);

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).end();

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

  if (!validateToken(token)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const category = (req.body && req.body.category) || (req.query && req.query.category);
  if (category && !ALLOWED_CATEGORIES.has(category)) {
    return res.status(400).json({ error: 'Categoría no válida' });
  }

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  if (!privateKey || !publicKey) {
    return res.status(500).json({ error: 'ImageKit no configurado en variables de entorno' });
  }

  const expire = Math.floor(Date.now() / 1000) + 3600;
  const nonce = crypto.randomBytes(16).toString('hex');
  const signature = crypto.createHmac('sha1', privateKey).update(nonce + expire).digest('hex');

  return res.status(200).json({ token: nonce, expire, signature, publicKey });
};
