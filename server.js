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

try {
  const envFilePath = path.join(ROOT_DIR, '.env');
  if (fs.existsSync(envFilePath)) {
    const rawEnv = fs.readFileSync(envFilePath, 'utf8');
    rawEnv.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx <= 0) return;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (key && process.env[key] === undefined) {
        process.env[key] = val;
      }
    });
  }
} catch (err) {}

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

const MAILBOX_COOLDOWN_MS = 45 * 1000;
const MAILBOX_WINDOW_MS = 60 * 60 * 1000;
const MAILBOX_MAX_PER_HOUR = 5;
const mailboxRateMap = new Map();

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.trim()) {
    return fwd.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function checkMailboxRateLimit(ip) {
  const now = Date.now();
  const entry = mailboxRateMap.get(ip) || { lastSentAt: 0, recent: [] };
  entry.recent = entry.recent.filter((ts) => now - ts < MAILBOX_WINDOW_MS);

  if (entry.lastSentAt && now - entry.lastSentAt < MAILBOX_COOLDOWN_MS) {
    const waitSec = Math.ceil((MAILBOX_COOLDOWN_MS - (now - entry.lastSentAt)) / 1000);
    return { allowed: false, retryAfter: waitSec, reason: `잠시 뒤(${waitSec}초 후)에 다시 편지를 띄워 주세요.` };
  }
  if (entry.recent.length >= MAILBOX_MAX_PER_HOUR) {
    return { allowed: false, retryAfter: 600, reason: '한 시간에 보낼 수 있는 편지 횟수를 초과했어요. 잠시 후 다시 시도해 주세요.' };
  }
  mailboxRateMap.set(ip, entry);
  return { allowed: true, entry };
}

function recordMailboxSend(ip) {
  const now = Date.now();
  const entry = mailboxRateMap.get(ip) || { lastSentAt: 0, recent: [] };
  entry.lastSentAt = now;
  entry.recent = entry.recent.filter((ts) => now - ts < MAILBOX_WINDOW_MS);
  entry.recent.push(now);
  mailboxRateMap.set(ip, entry);
}

function sanitizeMailboxText(value, allowNewlines = false) {
  const str = String(value || '');
  const stripped = allowNewlines
    ? str.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '').replace(/[<>]/g, '')
    : str.replace(/[\u0000-\u001F\u007F<>]/g, '');
  return stripped.trim();
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

  // API Route: Eunhajae Mailbox (Visitor -> Operator Email)
  if (pathname === '/api/mailbox/send') {
    const corsHeaders = {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*'
    };

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end();
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      let aborted = false;
      req.on('error', () => {
        if (aborted) return;
        aborted = true;
        res.writeHead(500, corsHeaders);
        res.end(JSON.stringify({ ok: false, error: '요청 처리 중 오류가 발생했습니다.' }));
      });
      req.on('data', (chunk) => {
        body += chunk;
        if (body.length > 20000) {
          aborted = true;
          res.writeHead(413, corsHeaders);
          res.end(JSON.stringify({ ok: false, error: '편지 내용이 너무 깁니다.' }));
          req.destroy();
        }
      });
      req.on('end', async () => {
        if (aborted) return;
        try {
          const data = JSON.parse(body || '{}');
          if (data.website && String(data.website).trim() !== '') {
            res.writeHead(400, corsHeaders);
            res.end(JSON.stringify({ ok: false, error: '올바르지 않은 요청입니다.' }));
            return;
          }

          const clientIp = getClientIp(req);
          const rateCheck = checkMailboxRateLimit(clientIp);
          if (!rateCheck.allowed) {
            res.writeHead(429, { ...corsHeaders, 'Retry-After': String(rateCheck.retryAfter) });
            res.end(JSON.stringify({ ok: false, code: 'RATE_LIMITED', error: rateCheck.reason }));
            return;
          }

          const senderName = sanitizeMailboxText(data.senderName, false);
          const message = sanitizeMailboxText(data.message, true);

          if (senderName.length < 1 || senderName.length > 20) {
            res.writeHead(400, corsHeaders);
            res.end(JSON.stringify({ ok: false, error: '보내는 이 이름을 1자 이상 20자 이하로 적어주세요.' }));
            return;
          }
          if (message.length < 5 || message.length > 500) {
            res.writeHead(400, corsHeaders);
            res.end(JSON.stringify({ ok: false, error: '편지 내용을 5자 이상 500자 이하로 적어주세요.' }));
            return;
          }

          const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
          const receiverEmail = (process.env.MAIL_RECEIVER_EMAIL || '').trim();
          const fromEmail = (process.env.MAIL_FROM_EMAIL || '').trim() || '은하재 우체통 <onboarding@resend.dev>';
          const webhookUrl = (process.env.MAIL_WEBHOOK_URL || '').trim();

          if (resendApiKey && receiverEmail) {
            const emailRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: fromEmail,
                to: [receiverEmail],
                subject: `[은하재 우체통] ${senderName}님의 편지가 도착했어요`,
                text: `보내는 이: ${senderName}\n전송 시각: ${new Date().toISOString()}\n\n${message}`
              })
            });

            if (!emailRes.ok) {
              res.writeHead(502, corsHeaders);
              res.end(JSON.stringify({ ok: false, code: 'MAIL_DELIVERY_FAILED', error: '이메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.' }));
              return;
            }

            recordMailboxSend(clientIp);
            res.writeHead(200, corsHeaders);
            res.end(JSON.stringify({ ok: true }));
            return;
          }

          if (webhookUrl) {
            const hookRes = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                source: 'eunhajae-mailbox',
                senderName,
                message,
                sentAt: new Date().toISOString()
              })
            });
            const hookJson = await hookRes.json().catch(() => null);
            if (!hookRes.ok || (hookJson && hookJson.ok === false)) {
              res.writeHead(502, corsHeaders);
              res.end(JSON.stringify({ ok: false, code: 'MAIL_DELIVERY_FAILED', error: '외부 메일 전달 서버 응답 오류가 발생했습니다.' }));
              return;
            }

            recordMailboxSend(clientIp);
            res.writeHead(200, corsHeaders);
            res.end(JSON.stringify({ ok: true }));
            return;
          }

          res.writeHead(503, corsHeaders);
          res.end(JSON.stringify({
            ok: false,
            code: 'MAIL_NOT_CONFIGURED',
            error: '이메일 발송 서비스가 아직 설정되지 않았습니다. 환경 설정을 확인해 주세요.'
          }));
        } catch (err) {
          res.writeHead(400, corsHeaders);
          res.end(JSON.stringify({ ok: false, error: '요청 형식이 올바르지 않습니다.' }));
        }
      });
      return;
    }

    res.writeHead(405, corsHeaders);
    res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
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
