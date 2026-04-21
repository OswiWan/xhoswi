import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

app.use(cors());
app.use(express.json());

// Al arrancar, asegura que el email admin definido por env tenga role='admin'.
// Idempotente: si no existe el user aún, no hace nada; cuando se registre con
// ese email, se creará ya como admin (ver /register más abajo).
async function promoteAdmin() {
  if (!ADMIN_EMAIL) return;
  const { rowCount } = await pool.query(
    `UPDATE users SET role = 'admin' WHERE email = $1 AND role <> 'admin'`,
    [ADMIN_EMAIL]
  );
  if (rowCount > 0) console.log(`promoted ${ADMIN_EMAIL} to admin`);
}

function roleFor(email) {
  return email === ADMIN_EMAIL ? 'admin' : 'user';
}

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', service: 'auth-service', db: 'ok' });
  } catch {
    res.status(503).json({ status: 'degraded', service: 'auth-service', db: 'down' });
  }
});

app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password required' });
  }
  const hash = await bcrypt.hash(password, 10);
  const role = roleFor(email);
  try {
    await pool.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
      [email, hash, role]
    );
    res.status(201).json({ email, role });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'user already exists' });
    }
    console.error('register error', err);
    res.status(500).json({ error: 'internal error' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await pool.query(
    'SELECT email, password_hash, role FROM users WHERE email = $1',
    [email]
  );
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  const token = jwt.sign({ email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, email, role: user.role });
});

app.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'missing token' });
  }
  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET);
    res.json({ email: payload.email, role: payload.role || 'user' });
  } catch {
    res.status(401).json({ error: 'invalid token' });
  }
});

promoteAdmin().catch((err) => console.error('promoteAdmin falló:', err.message));

app.listen(PORT, () => {
  console.log(`auth-service listening on port ${PORT}`);
});
