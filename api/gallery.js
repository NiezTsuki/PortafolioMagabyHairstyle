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

        /* 🔴 SOLUCIÓN: Filtramos las imágenes para separarlas definitivamente */
        let fotosFiltradas = files;
        
        // Si la web NO está pidiendo explícitamente las fotos de la portada (landing)...
        if (tag !== 'landing') {
          // ...filtramos y eliminamos de la lista cualquier foto que tenga el tag 'landing'
          fotosFiltradas = files.filter(f => !(f.tags && f.tags.includes('landing')));
        }

        res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
        res.setHeader('Content-Type', 'application/json');
        
        // Devolvemos la lista limpia
        res.status(200).json(
          fotosFiltradas.map((f) => ({
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