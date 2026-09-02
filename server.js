import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Enable body parsing for base64 photo uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static assets with correct MIME types
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/pages', express.static(path.join(__dirname, 'pages')));
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(__dirname));

// Route handlers for seamless client navigation without 404s
const serveIndex = (req, res) => res.sendFile(path.join(__dirname, 'index.html'));
const serveQuestion = (req, res) => res.sendFile(path.join(__dirname, 'pages', 'question.html'));
const serveCards = (req, res) => res.sendFile(path.join(__dirname, 'pages', 'cards.html'));
const serveCard = (req, res) => res.sendFile(path.join(__dirname, 'pages', 'card.html'));
const servePhotobooth = (req, res) => res.sendFile(path.join(__dirname, 'pages', 'photobooth.html'));

// Main Root & Legacy Paths
app.get('/', serveIndex);
app.get('/index.html', serveIndex);
app.get('/year-in-review', serveIndex);
app.get('/year-in-review/index.html', serveIndex);

// Question Card Page
app.get('/pages/question.html', serveQuestion);
app.get('/pages/question', serveQuestion);
app.get('/question.html', serveQuestion);
app.get('/question', serveQuestion);
app.get('/questions', serveQuestion);
app.get('/year-in-review/pages/question.html', serveQuestion);

// Tarot Cards Selection Spread Page
app.get('/pages/cards.html', serveCards);
app.get('/pages/cards', serveCards);
app.get('/cards.html', serveCards);
app.get('/cards', serveCards);
app.get('/year-in-review/pages/cards.html', serveCards);

// Tarot Reading Result Page
app.get('/pages/card.html', serveCard);
app.get('/pages/card', serveCard);
app.get('/card.html', serveCard);
app.get('/card', serveCard);
app.get('/year-in-review/pages/card.html', serveCard);

// Photo Booth Page
app.get('/pages/photobooth.html', servePhotobooth);
app.get('/pages/photobooth', servePhotobooth);
app.get('/photobooth.html', servePhotobooth);
app.get('/photobooth', servePhotobooth);
app.get('/photo', servePhotobooth);
app.get('/year-in-review/pages/photobooth.html', servePhotobooth);

// Direct Photo Viewer page for QR scans
app.get('/photo-view/:id', (req, res) => {
  const photoId = req.params.id;
  const filePath = path.join(uploadsDir, `${photoId}.png`);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('사진을 찾을 수 없습니다.');
  }
});

// Robust Cloud & Temporary Upload API for QR code generation
app.post('/api/upload-imgbb', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'No image provided' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imgBuffer = Buffer.from(cleanBase64, 'base64');
    const photoId = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Save locally as reliable fallback
    const localFilePath = path.join(uploadsDir, `${photoId}.png`);
    fs.writeFileSync(localFilePath, imgBuffer);

    // 1. Try uploading to tmpfiles.org (direct accessible link for 24h)
    try {
      const form = new FormData();
      const blob = new Blob([imgBuffer], { type: 'image/png' });
      form.append('file', blob, `${photoId}.png`);

      const tmpRes = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: form
      });
      const tmpData = await tmpRes.json();
      if (tmpData && tmpData.status === 'success' && tmpData.data?.url) {
        // Transform tmpfiles url to direct download url (insert /dl/)
        const directUrl = tmpData.data.url.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');
        return res.json({
          success: true,
          url: directUrl,
          displayUrl: directUrl,
          localUrl: `${req.protocol}://${req.get('host')}/photo-view/${photoId}`
        });
      }
    } catch (e) {
      console.warn('tmpfiles.org upload failed, trying fallback:', e.message);
    }

    // 2. Local hosted URL fallback
    const host = req.get('host');
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const directPhotoUrl = `${protocol}://${host}/uploads/${photoId}.png`;

    return res.json({
      success: true,
      url: directPhotoUrl,
      displayUrl: directPhotoUrl,
      localUrl: directPhotoUrl
    });
  } catch (err) {
    console.error('Photo upload error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});

