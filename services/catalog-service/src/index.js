import express from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { pool } from './db.js';

const app = express();
const PORT = process.env.PORT || 3002;
const STREAMING_BASE_URL = process.env.STREAMING_BASE_URL || 'http://localhost:3003';
const AUTH_URL = process.env.AUTH_URL || 'http://auth-service:3001';

app.use(cors());
app.use(express.json());

// Middleware: reenvía el Bearer token al auth-service y deja pasar solo si
// el usuario es admin. Es un ejemplo de comunicación entre microservicios:
// el catalog no conoce el JWT_SECRET; delega la verificación a auth.
async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'missing token' });
  }
  try {
    const r = await fetch(`${AUTH_URL}/me`, {
      headers: { Authorization: authHeader },
    });
    if (r.status === 401) return res.status(401).json({ error: 'invalid token' });
    if (!r.ok) return res.status(502).json({ error: 'auth-service unavailable' });
    const { role } = await r.json();
    if (role !== 'admin') return res.status(403).json({ error: 'admin role required' });
    next();
  } catch (err) {
    console.error('requireAdmin error', err);
    res.status(502).json({ error: 'auth-service unreachable' });
  }
}

function toApi(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    thumbnail: row.thumbnail,
    hlsPath: row.hls_path,
    durationSeconds: row.duration_seconds,
    createdAt: row.created_at,
    streamUrl: buildStreamUrl(row.hls_path),
  };
}

function buildStreamUrl(hlsPath) {
  if (hlsPath.startsWith('http://') || hlsPath.startsWith('https://')) {
    return hlsPath;
  }
  return `${STREAMING_BASE_URL}/stream/${hlsPath}`;
}

// Seed idempotente. IDs fijos + ON CONFLICT: dos réplicas arrancando a la vez
// no duplican filas, y borrar un seed manualmente no lo resucita en el próximo
// arranque (porque el INSERT da conflict por el id y no hace nada).
const SEED_VIDEOS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    title: 'Big Buck Bunny',
    description: 'Animación open source de Blender Foundation',
    thumbnail: 'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg',
    hlsPath: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    durationSeconds: 888,
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    title: 'Sintel',
    description: 'Cortometraje animado de Blender Foundation',
    thumbnail: 'https://durian.blender.org/wp-content/uploads/2010/05/sintel-poster.jpg',
    hlsPath: 'https://test-streams.mux.dev/pts_shift/master.m3u8',
    durationSeconds: 888,
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    title: 'Tears of Steel',
    description: 'Ciencia ficción open source de Blender',
    thumbnail: 'https://mango.blender.org/wp-content/gallery/4k-renders/01_thom_celia_bridge.jpg',
    hlsPath: 'https://test-streams.mux.dev/test_001/stream.m3u8',
    durationSeconds: 734,
  },
];

async function seedIfMissing() {
  for (const v of SEED_VIDEOS) {
    await pool.query(
      `INSERT INTO videos (id, title, description, thumbnail, hls_path, duration_seconds)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [v.id, v.title, v.description, v.thumbnail, v.hlsPath, v.durationSeconds]
    );
  }
}

app.get('/health', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM videos');
    res.json({ status: 'ok', service: 'catalog-service', videoCount: rows[0].n });
  } catch {
    res.status(503).json({ status: 'degraded', service: 'catalog-service', db: 'down' });
  }
});

app.get('/videos', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM videos ORDER BY created_at DESC');
  res.json(rows.map(toApi));
});

app.get('/videos/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM videos WHERE id = $1', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'video not found' });
  res.json(toApi(rows[0]));
});

app.post('/videos', requireAdmin, async (req, res) => {
  const { title, description, thumbnail, hlsPath, durationSeconds } = req.body;
  if (!title || !hlsPath) {
    return res.status(400).json({ error: 'title and hlsPath are required' });
  }
  const id = randomUUID();
  const { rows } = await pool.query(
    `INSERT INTO videos (id, title, description, thumbnail, hls_path, duration_seconds)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [id, title, description ?? '', thumbnail ?? '', hlsPath, durationSeconds ?? 0]
  );
  res.status(201).json(toApi(rows[0]));
});

app.delete('/videos/:id', requireAdmin, async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM videos WHERE id = $1', [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: 'video not found' });
  res.status(204).end();
});

// Arrancar: primero intentamos seed, pero si falla (p.ej. la BD aún no está)
// igual levantamos el servidor — el healthcheck de K8s lo marcará not ready
// hasta que la BD responda.
seedIfMissing().catch((err) => console.error('seed falló (seguirá sin seed):', err.message));

app.listen(PORT, () => {
  console.log(`catalog-service listening on port ${PORT}`);
});
