const crypto = require('crypto');

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Faltan credenciales' });
  }

  if (username !== process.env.ADMIN_USER || password !== process.env.ADMIN_PASS) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  const secret = process.env.SESSION_SECRET || 'dev-secret-inseguro';
  const expire = Date.now() + 8 * 60 * 60 * 1000; // 8 horas
  const payload = `${username}:${expire}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const token = Buffer.from(`${payload}:${sig}`).toString('base64');

  return res.status(200).json({ token });
};
