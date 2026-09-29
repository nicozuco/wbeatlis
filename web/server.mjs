import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.ATLIS_PORT || 4310);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8' };
const allowedFiles = new Set(['/index.html', '/demo.html', '/styles.css', '/channel-preview.css', '/experience.css', '/demo.css', '/responsive.css', '/privacidad.html', '/aviso-legal.html', '/robots.txt', '/sitemap.xml']);

export const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1');
    const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ accepted: false, error: 'La versión de revisión no recibe solicitudes.' }));
    }
    const isPublic = allowedFiles.has(pathname) || pathname.startsWith('/assets/') || pathname.startsWith('/js/');
    const filename = path.resolve(root, '.' + pathname);
    if (!isPublic || !filename.startsWith(root + path.sep)) { res.writeHead(404); return res.end('No encontrado'); }
    const file = await stat(filename);
    if (!file.isFile()) { res.writeHead(404); return res.end('No encontrado'); }
    res.writeHead(200, {
      'Content-Type': types[path.extname(filename)] || 'application/octet-stream',
      'Content-Length': file.size,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    });
    if (req.method === 'HEAD') return res.end();
    res.end(await readFile(filename));
  } catch (error) { res.writeHead(error.code === 'ENOENT' ? 404 : 400); res.end('No encontrado'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Atlis · test landing disponible en http://127.0.0.1:${port}`));
