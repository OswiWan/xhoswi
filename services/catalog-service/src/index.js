import express from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';

const app = express();
const PORT = process.env.PORT || 3002;
const STREAMING_BASE_URL = process.env.STREAMING_BASE_URL || 'http://localhost:3003';

app.use(cors());
app.use(express.json());

const videos = new Map();

function seed() {
  const samples = [
    {
      title: 'Big Buck Bunny',
      description: 'Animación open source de Blender Foundation',
      thumbnail: 'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg',
      hlsPath: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      durationSeconds: 888,
    },
    {
      title: 'Sintel',
      description: 'Cortometraje animado de Blender Foundation',
      thumbnail: 'https://durian.blender.org/wp-content/uploads/2010/05/sintel-poster.jpg',
      hlsPath: 'https://test-streams.mux.dev/pts_shift/master.m3u8',
      durationSeconds: 888,
    },
    {
      title: 'Tears of Steel',
      description: 'Ciencia ficción open source de Blender',
      thumbnail: 'https://mango.blender.org/wp-content/gallery/4k-renders/01_thom_celia_bridge.jpg',
      hlsPath: 'https://test-streams.mux.dev/test_001/stream.m3u8',
      durationSeconds: 734,
    },
  ];
  for (const v of samples) {
    const id = randomUUID();
    videos.set(id, { id, ...v, createdAt: new Date() });
  }
}
seed();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'catalog-service', videoCount: videos.size });
});

function buildStreamUrl(hlsPath) {
  if (hlsPath.startsWith('http://') || hlsPath.startsWith('https://')) {
    return hlsPath;
  }
  return `${STREAMING_BASE_URL}/stream/${hlsPath}`;
}

app.get('/videos', (req, res) => {
  const list = Array.from(videos.values()).map((v) => ({
    ...v,
    streamUrl: buildStreamUrl(v.hlsPath),
  }));
  res.json(list);
});

app.get('/videos/:id', (req, res) => {
  const v = videos.get(req.params.id);
  if (!v) return res.status(404).json({ error: 'video not found' });
  res.json({ ...v, streamUrl: buildStreamUrl(v.hlsPath) });
});

app.post('/videos', (req, res) => {
  const { title, description, thumbnail, hlsPath, durationSeconds } = req.body;
  if (!title || !hlsPath) {
    return res.status(400).json({ error: 'title and hlsPath are required' });
  }
  const id = randomUUID();
  const video = {
    id,
    title,
    description: description ?? '',
    thumbnail: thumbnail ?? '',
    hlsPath,
    durationSeconds: durationSeconds ?? 0,
    createdAt: new Date(),
  };
  videos.set(id, video);
  res.status(201).json(video);
});

app.delete('/videos/:id', (req, res) => {
  if (!videos.delete(req.params.id)) {
    return res.status(404).json({ error: 'video not found' });
  }
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`catalog-service listening on port ${PORT}`);
});
