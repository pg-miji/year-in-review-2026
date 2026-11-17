import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateCrystalBallAnswer } from './server_crystal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname);
const THREE_DIR = path.resolve(__dirname, 'node_modules', 'three');
const PORT = Number(process.env.PORT) || 3000;

const BLOCKED_ROOT_FILES = new Set([
  'server.js',
  'server_crystal.js',
  'package.json',
  'package-lock.json',
  'bun.lock',
  '.env',
  '.env.example',
  '.gitattributes',
  'metadata.json'
]);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function resolveSafePath(baseDir, relativeRequestPath) {
  const normalized = path.posix.normalize(relativeRequestPath.replace(/\\/g, '/'));
  const stripped = normalized.replace(/^(\.\.(\/|$))+/, '').replace(/^\/+/, '');
  const resolved = path.resolve(baseDir, stripped);
  if (resolved !== baseDir && !resolved.startsWith(baseDir + path.sep)) {
    return null;
  }
  return { resolved, stripped };
}

const server = http.createServer(async (req, res) => {
  let pathname = '/';
  try {
    const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
    pathname = decodeURIComponent(parsedUrl.pathname);
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 Bad Request');
    return;
  }

  // API Route: Crystal Ball AI Answer
  if (pathname === '/api/crystal-ball') {
    if (req.method === 'POST') {
      let body = '';
      req.on('error', () => {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Request stream error' }));
      });
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 50000) {
          req.destroy();
        }
      });
      req.on('end', async () => {
        try {
          const data = JSON.parse(body || '{}');
          const worry = data.worry || '';
          const previousAnswer = data.previousAnswer || '';
          const category = data.category || '';
          const answer = await generateCrystalBallAnswer(worry, previousAnswer, category);
          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({ ok: true, answer }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'Invalid JSON request' }));
        }
      });
      return;
    } else if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end();
      return;
    }
  }

  // Local ES Module vendor route for Three.js (zero external CDN 404 risk)
  if (pathname.startsWith('/vendor/three/')) {
    const subPath = pathname.slice('/vendor/three/'.length);
    const check = resolveSafePath(THREE_DIR, subPath);
    if (!check) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 Forbidden');
      return;
    }
    fs.stat(check.resolved, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
      }
      const ext = path.extname(check.resolved).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=86400'
      });
      fs.createReadStream(check.resolved).pipe(res);
    });
    return;
  }

  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  const safeCheck = resolveSafePath(ROOT_DIR, pathname);
  if (!safeCheck) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  const topSegment = safeCheck.stripped.split('/')[0];
  if (
    safeCheck.stripped.startsWith('.') ||
    safeCheck.stripped.startsWith('node_modules/') ||
    BLOCKED_ROOT_FILES.has(safeCheck.stripped) ||
    BLOCKED_ROOT_FILES.has(topSegment)
  ) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  let filePath = safeCheck.resolved;

  // If path is a directory, look for index.html inside
  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
  } catch (err) {}

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const htmlPath = filePath + '.html';
      if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
        filePath = htmlPath;
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Running at http://0.0.0.0:${PORT} (Static + Crystal API)`);
});
