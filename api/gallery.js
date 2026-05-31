const https = require('https');

module.exports = function handler(req, res) {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json([]);
  }

  const tag = req.query && req.query.tag;
  const limit = Math.min(parseInt((req.query && req.query.limit) || '500', 10), 500);

  let path = '/v1/files?path=%2Fportfolio&fileType=image&sort=DESC_CREATED&limit=' + limit;
  if (tag) path += '&tags=' + encodeURIComponent(tag);

  const credentials = Buffer.from(`${privateKey}:`).toString('base64');
  const options = {
    hostname: 'api.imagekit.io',
    path,
    headers: { Authorization: `Basic ${credentials}` },
  };

  https.get(options, (ikRes) => {
    let data = '';
    ikRes.on('data', (chunk) => { data += chunk; });
    ikRes.on('end', () => {
      try {
        const files = JSON.parse(data);
        if (!Array.isArray(files)) {
          return res.status(502).json({ error: 'Respuesta inesperada de ImageKit' });
        }
        res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(
          files.map((f) => ({
            url: f.url,
            name: f.name,
            fileId: f.fileId,
            tags: f.tags || [],
          }))
        );
      } catch {
        res.status(500).json({ error: 'Error al parsear respuesta de ImageKit' });
      }
    });
  }).on('error', () => {
    res.status(500).json({ error: 'Error de conexión con ImageKit' });
  });
};
