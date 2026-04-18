import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3003;
const VIDEOS_DIR = process.env.VIDEOS_DIR || path.join(__dirname, '..', 'videos');

app.use(cors());

app.get('/health', (req, res) => {
  const exists = fs.existsSync(VIDEOS_DIR);
  const videoCount = exists
    ? fs.readdirSync(VIDEOS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).length
    : 0;
  res.json({
    status: 'ok',
    service: 'streaming-service',
    videosDir: VIDEOS_DIR,
    videoCount,
  });
});

app.get('/videos', (req, res) => {
  if (!fs.existsSync(VIDEOS_DIR)) return res.json([]);
  const dirs = fs
    .readdirSync(VIDEOS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  res.json(dirs);
});

app.use(
  '/stream',
  (req, res, next) => {
    const ext = path.extname(req.path).toLowerCase();
    if (ext === '.m3u8') {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    } else if (ext === '.ts') {
      res.setHeader('Content-Type', 'video/mp2t');
    }
    res.setHeader('Cache-Control', 'no-cache');
    next();
  },
  express.static(VIDEOS_DIR, {
    fallthrough: false,
    extensions: ['m3u8'],
  })
);

app.use((err, req, res, next) => {
  if (err.statusCode === 404) {
    return res.status(404).json({ error: 'video segment not found', path: req.path });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`streaming-service listening on port ${PORT}`);
  console.log(`serving videos from: ${VIDEOS_DIR}`);
});
